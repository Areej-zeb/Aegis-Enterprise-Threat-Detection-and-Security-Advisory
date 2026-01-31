/**
 * Global error handler middleware
 * Returns clean JSON responses instead of HTML error pages
 */
export const errorHandler = (err, req, res, next) => {
  // Log full error server-side only
  console.error('Server Error:', {
    message: err.message,
    stack: err.stack,
    code: err.code,
    name: err.name
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      code: 'validation_error',
      message: Object.values(err.errors)[0]?.message || 'Validation error occurred.'
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      code: 'email_in_use',
      message: 'This email is already registered. Try logging in instead.'
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(403).json({
      success: false,
      code: 'invalid_token',
      message: 'Your session is invalid or has expired. Please log in again.'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(403).json({
      success: false,
      code: 'invalid_token',
      message: 'Your session has expired. Please log in again.'
    });
  }

  // Default error - don't expose internal details
  res.status(err.status || 500).json({
    success: false,
    code: 'server_error',
    message: 'Something went wrong on the server. Please try again later.'
  });
};
