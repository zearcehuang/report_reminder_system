const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

class JsonStoreEventEmitter extends EventEmitter {}
const jsonStoreEvents = new JsonStoreEventEmitter();

const jsonCache = new Map();

function readJsonSync(filePath, defaultValue) {
  if (jsonCache.has(filePath)) {
    return jsonCache.get(filePath);
  }
  try {
    if (!fs.existsSync(filePath)) return defaultValue;
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    jsonCache.set(filePath, data);
    return data;
  } catch (err) {
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
  await fsPromises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function writeJsonSync(filePath, data) {
  jsonCache.set(filePath, data);
  jsonStoreEvents.emit('change', filePath, data);
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
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
