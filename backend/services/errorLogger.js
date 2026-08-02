const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const ERROR_LOG_FILE = path.join(DATA_DIR, 'error.log');

function logError(source, error, extra = {}) {
  const time = new Date().toISOString();
  const msg = typeof error === 'string' ? error : (error ? error.message : 'Unknown Error');
  const stack = error && error.stack ? error.stack : '';
  const logLine = `[${time}] [${source.toUpperCase()}] ${msg}\n${stack ? 'Stack: ' + stack + '\n' : ''}${Object.keys(extra).length ? 'Extra: ' + JSON.stringify(extra) + '\n' : ''}---\n`;
  
  console.error(`❌ [${source.toUpperCase()}] ${msg}`);
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.appendFileSync(ERROR_LOG_FILE, logLine, 'utf8');
  } catch (e) {}
}

function getErrorLogs() {
  try {
    if (fs.existsSync(ERROR_LOG_FILE)) {
      return fs.readFileSync(ERROR_LOG_FILE, 'utf8');
    }
  } catch (e) {
    logError('GET_LOGS', e);
  }
  return '尚無後端 Error Log 紀錄';
}

module.exports = {
  logError,
  getErrorLogs,
  ERROR_LOG_FILE
};
