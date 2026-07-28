export interface LogEntry {
  id: string;
  timestamp: string;
  source: 'FRONTEND' | 'BACKEND' | 'REACT_RENDER' | 'API';
  level: 'ERROR' | 'WARN' | 'INFO';
  message: string;
  stack?: string;
  extra?: any;
}

const frontendLogs: LogEntry[] = [];

export const errorLogger = {
  log(source: LogEntry['source'], level: LogEntry['level'], message: string, stack?: string, extra?: any) {
    const entry: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      source,
      level,
      message,
      stack,
      extra,
    };
    frontendLogs.unshift(entry);
    if (frontendLogs.length > 100) frontendLogs.pop();

    console.error(`🚨 [${source}] [${level}] ${message}`, stack || '', extra || '');
  },

  getLogs(): LogEntry[] {
    return frontendLogs;
  },

  clearLogs() {
    frontendLogs.length = 0;
  },

  async fetchBackendLogs(): Promise<string> {
    try {
      const res = await fetch('/api/logs/errors');
      if (res.ok) {
        const data = await res.json();
        return data.logs || '無紀錄';
      }
    } catch (err) {
      // ignore
    }
    return '無法連線至後端 Error Log API';
  }
};

// Global error handlers
window.onerror = (message, source, lineno, colno, error) => {
  errorLogger.log('FRONTEND', 'ERROR', String(message), error?.stack || `${source}:${lineno}:${colno}`);
};

window.onunhandledrejection = (event) => {
  const reason = event.reason;
  errorLogger.log('FRONTEND', 'ERROR', `Unhandled Promise Rejection: ${reason?.message || reason}`, reason?.stack);
};
