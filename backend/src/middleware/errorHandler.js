const logger = require('../utils/logger');

/**
 * Central error-handling middleware.
 * Must be registered last in the Express app.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const message = err.expose ? err.message : 'Internal server error.';

  logger.error('Unhandled error', {
    status,
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(status).json({ message });
}

/**
 * 404 handler — place before errorHandler.
 */
function notFound(req, res) {
  res.status(404).json({ message: `Route ${req.path} not found.` });
}

module.exports = { errorHandler, notFound };
