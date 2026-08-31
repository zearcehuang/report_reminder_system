function createRateLimiter(options = {}) {
  const windowMs = options.windowMs || 60 * 1000;
  const max = options.max || 100;
  const message = options.message || '請求過於頻繁，請稍後再試 (Too many requests, please try again later)';
  const map = new Map();

  // Periodic cleanup
  setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of map) {
      if (now - entry.windowStart > windowMs * 2) {
        map.delete(ip);
      }
    }
  }, Math.max(windowMs * 2, 60000));

  return function rateLimitMiddleware(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    let entry = map.get(ip);
    if (!entry || now - entry.windowStart > windowMs) {
      entry = { windowStart: now, count: 0 };
      map.set(ip, entry);
    }
    entry.count++;
    if (entry.count > max) {
      return res.status(429).json({
        success: false,
        error: message,
        retryAfterMs: windowMs - (now - entry.windowStart)
      });
    }
    next();
  };
}

// Global API rate limiter (300 requests / min)
const globalRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 300,
  message: '系統請求頻率超出上限，請稍後再試 (Rate Limit Exceeded)'
});

// Dedicated strict rate limiter for authentication endpoints (15 attempts / min)
const authRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 15,
  message: '登入嘗試次數過多，為確保帳號安全請於 1 分鐘後再試 (Brute-force Protection Triggered)'
});

module.exports = globalRateLimiter;
module.exports.globalRateLimiter = globalRateLimiter;
module.exports.authRateLimiter = authRateLimiter;
module.exports.createRateLimiter = createRateLimiter;
