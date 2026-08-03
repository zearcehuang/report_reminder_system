const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');
const { logError } = require('./errorLogger');

class JsonStoreEventEmitter extends EventEmitter {}
const jsonStoreEvents = new JsonStoreEventEmitter();

const jsonCache = new Map();
const fileLocks = new Map(); // Promise chain mutex for concurrent writes

function deepClone(obj) {
  if (obj === undefined) return undefined;
  if (obj === null || typeof obj !== 'object') return obj; // 快速跳過基本型別 (Primitives)
  return typeof structuredClone === 'function' ? structuredClone(obj) : JSON.parse(JSON.stringify(obj));
}

function readJsonSync(filePath, defaultValue) {
  if (jsonCache.has(filePath)) {
    return deepClone(jsonCache.get(filePath));
  }
  try {
    if (!fs.existsSync(filePath)) return defaultValue;
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    jsonCache.set(filePath, deepClone(data));
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
    return deepClone(jsonCache.get(filePath));
  }
  try {
    if (!fs.existsSync(filePath)) return defaultValue;
    const content = await fsPromises.readFile(filePath, 'utf8');
    const data = JSON.parse(content);
    jsonCache.set(filePath, deepClone(data));
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
  const clonedData = deepClone(data);
  
  const currentLock = fileLocks.get(filePath) || Promise.resolve();
  
  const nextLock = currentLock.then(async () => {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      await fsPromises.mkdir(dir, { recursive: true });
    }

    const tmpPath = `${filePath}.tmp.${Date.now()}`;
    try {
      await fsPromises.writeFile(tmpPath, JSON.stringify(data, null, 2), 'utf8');
      await fsPromises.rename(tmpPath, filePath); // Atomic replacement
      
      // 更新快取確保與磁碟狀態嚴密同步 (嚴格一致性)
      jsonCache.set(filePath, clonedData);
      jsonStoreEvents.emit('change', filePath, clonedData);
    } catch (err) {
      logError('JSON_WRITE_ERROR', err, { filePath });
      if (fs.existsSync(tmpPath)) {
        await fsPromises.unlink(tmpPath).catch(() => {});
      }
      // 寫入失敗時使快取失效，避免髒讀 (Dirty Read)
      invalidateCache(filePath);
      throw err;
    }
  });

  const finalLock = nextLock.catch(() => {}).finally(() => {
    if (fileLocks.get(filePath) === finalLock) {
      fileLocks.delete(filePath);
    }
  });

  fileLocks.set(filePath, finalLock);
  return nextLock;
}

function writeJsonSync(filePath, data) {
  const clonedData = deepClone(data);
  
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const tmpPath = `${filePath}.tmp.${Date.now()}`;
  try {
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tmpPath, filePath); // Atomic replacement
    
    // 更新快取確保與磁碟狀態同步
    jsonCache.set(filePath, clonedData);
    jsonStoreEvents.emit('change', filePath, clonedData);
  } catch (err) {
    logError('JSON_WRITE_ERROR_SYNC', err, { filePath });
    if (fs.existsSync(tmpPath)) {
      try { fs.unlinkSync(tmpPath); } catch (e) {}
    }
    // 寫入失敗時使快取失效
    invalidateCache(filePath);
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
