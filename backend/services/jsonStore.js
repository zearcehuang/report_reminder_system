const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');
const { logError } = require('./errorLogger');

class JsonStoreEventEmitter extends EventEmitter {}
const jsonStoreEvents = new JsonStoreEventEmitter();

const jsonCache = new Map();

function readJsonSync(filePath, defaultValue) {
  if (jsonCache.has(filePath)) {
    return jsonCache.get(filePath);
  }
  try {
    if (!fs.existsSync(filePath)) return defaultValue;
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    jsonCache.set(filePath, data);
    return data;
  } catch (err) {
    if (err instanceof SyntaxError) {
      logError('JSON_CORRUPTION_SYNC', err, { filePath });
      const backupPath = `${filePath}.corrupted.${Date.now()}`;
      try {
        fs.renameSync(filePath, backupPath);
      } catch (e) {
        logError('JSON_BACKUP_FAIL_SYNC', e, { filePath, backupPath });
      }
    } else {
      logError('JSON_READ_ERROR_SYNC', err, { filePath });
    }
    return defaultValue;
  }
}

async function readJson(filePath, defaultValue) {
  if (jsonCache.has(filePath)) {
    return jsonCache.get(filePath);
  }
  try {
    if (!fs.existsSync(filePath)) return defaultValue;
    const content = await fsPromises.readFile(filePath, 'utf8');
    const data = JSON.parse(content);
    jsonCache.set(filePath, data);
    return data;
  } catch (err) {
    if (err instanceof SyntaxError) {
      logError('JSON_CORRUPTION', err, { filePath });
      const backupPath = `${filePath}.corrupted.${Date.now()}`;
      try {
        await fsPromises.rename(filePath, backupPath);
      } catch (e) {
        logError('JSON_BACKUP_FAIL', e, { filePath, backupPath });
      }
    } else {
      logError('JSON_READ_ERROR', err, { filePath });
    }
    return defaultValue;
  }
}

async function writeJson(filePath, data) {
  jsonCache.set(filePath, data);
  jsonStoreEvents.emit('change', filePath, data);
  
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    await fsPromises.mkdir(dir, { recursive: true });
  }

  const tmpPath = `${filePath}.tmp.${Date.now()}`;
  try {
    await fsPromises.writeFile(tmpPath, JSON.stringify(data, null, 2), 'utf8');
    await fsPromises.rename(tmpPath, filePath); // Atomic replacement
  } catch (err) {
    logError('JSON_WRITE_ERROR', err, { filePath });
    // Clean up tmp file if it exists and wasn't renamed
    if (fs.existsSync(tmpPath)) {
      await fsPromises.unlink(tmpPath).catch(() => {});
    }
    throw err;
  }
}

function writeJsonSync(filePath, data) {
  jsonCache.set(filePath, data);
  jsonStoreEvents.emit('change', filePath, data);
  
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const tmpPath = `${filePath}.tmp.${Date.now()}`;
  try {
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tmpPath, filePath); // Atomic replacement
  } catch (err) {
    logError('JSON_WRITE_ERROR_SYNC', err, { filePath });
    if (fs.existsSync(tmpPath)) {
      try { fs.unlinkSync(tmpPath); } catch (e) {}
    }
    throw err;
  }
}

function invalidateCache(filePath) {
  if (filePath) {
    jsonCache.delete(filePath);
    jsonStoreEvents.emit('invalidate', filePath);
  } else {
    jsonCache.clear();
    jsonStoreEvents.emit('invalidate', null);
  }
}

module.exports = {
  readJson,
  readJsonSync,
  writeJson,
  writeJsonSync,
  invalidateCache,
  jsonStoreEvents
};
