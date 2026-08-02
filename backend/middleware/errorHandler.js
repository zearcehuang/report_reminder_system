const { AppError } = require('../errors/AppError');
const { logError } = require('../services/errorLogger');

const errorHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.statusCode
    });
  }

  // Log unhandled server errors
  logError('EXPRESS_GLOBAL', err, { method: req.method, url: req.originalUrl });

  // Handle generic / unexpected errors
  res.status(500).json({
    success: false,
    error: '伺服器內部錯誤 (Internal Server Error)',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

module.exports = errorHandler;
