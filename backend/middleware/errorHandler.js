const { AppError } = require('../errors/AppError');
const { createProblemDetails } = require('../errors/ProblemDetails');
const { logError } = require('../services/errorLogger');

const errorHandler = (err, req, res, next) => {
  const instance = req.originalUrl || req.url;

  if (err instanceof AppError) {
    const problem = createProblemDetails({
      type: `https://httpstatuses.com/${err.statusCode}`,
      status: err.statusCode,
      detail: err.message,
      instance,
      errors: err.errors || null
    });
    return res.status(err.statusCode).json(problem);
  }

  // Log unhandled server errors
  logError('EXPRESS_GLOBAL', err, { method: req.method, url: req.originalUrl });

  // Handle generic / unexpected errors without leaking stack in production
  const isDev = process.env.NODE_ENV === 'development';
  const problem = createProblemDetails({
    type: 'https://httpstatuses.com/500',
    status: 500,
    title: 'Internal Server Error',
    detail: isDev ? err.message : '伺服器內部錯誤 (Internal Server Error)',
    instance
  });

  res.status(500).json(problem);
};

module.exports = errorHandler;
