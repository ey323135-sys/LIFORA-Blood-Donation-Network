const errorHandler = (err, req, res, next) => {
  console.error('[LIFORA API Error]:', err.stack || err.message || err);

  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';

  // PostgreSQL Unique Constraint Violation (Code 23505)
  if (err.code === '23505') {
    statusCode = 409;
    message = 'A record with these unique details already exists in the system.';
  }

  // PostgreSQL Foreign Key Violation (Code 23503)
  if (err.code === '23503') {
    statusCode = 400;
    message = 'Referenced related record was not found.';
  }

  // Supabase Auth Error handling
  if (err.__isAuthError || err.name === 'AuthApiError') {
    statusCode = err.status || 400;
    message = err.message || 'Authentication error';
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

module.exports = errorHandler;
