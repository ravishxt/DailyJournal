const ApiError = require('../utils/apiError');

// Error handling middleware
exports.errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for development
  console.error(`Error: ${err.message}`.red);
  console.error(err.stack);

  // Handle specific error types
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    error = new ApiError(404, message);
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = new ApiError(400, message);
  }

  // Handle duplicate field value
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Duplicate field value: ${field}. Please use another value.`;
    error = new ApiError(400, message);
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = new ApiError(401, message);
  }

  // Handle JWT expired error
  if (err.name === 'TokenExpiredError') {
    const message = 'Token has expired';
    error = new ApiError(401, message);
  }

  // Default to 500 server error
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error'
  });
};

// 404 Not Found handler
exports.notFound = (req, res, next) => {
  next(new ApiError(404, `Not Found - ${req.originalUrl}`));
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Error: ${err.message}`.red);
  // Close server & exit process
  // server.close(() => process.exit(1));
});
