const ApiError = require('../utils/apiError');

// Error handling middleware
exports.errorHandler = (err, req, res, next) => {
  // Log error for development
  console.error(`Error: ${err.message}`.red);
  console.error("error", err, "stack", err.stack);

  // Handle specific error types
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    return res.status(404).json({
      success: false,
      message,
      error: {
        message,
        statusCode: 404
      }
    });
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(val => ({
      field: val.path,
      message: val.message
    }));
    return res.status(422).json({
      success: false,
      message: 'Validation Error',
      error: {
        message: 'Validation Error',
        details: errors,
        statusCode: 422
      }
    });
  }

  // Handle duplicate field value
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Duplicate field value: ${field}. Please use another value.`;
    return res.status(409).json({
      success: false,
      message,
      error: {
        message,
        statusCode: 409
      }
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    return res.status(401).json({
      success: false,
      message,
      error: {
        message,
        statusCode: 401
      }
    });
  }

  // Handle JWT expired error
  if (err.name === 'TokenExpiredError') {
    const message = 'Token has expired';
    return res.status(401).json({
      success: false,
      message,
      error: {
        message,
        statusCode: 401
      }
    });
  }

  // Handle ApiError instances
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: {
        message: err.message,
        ...(err.errors && { details: err.stack.errors || err.errors }),
        statusCode: err.statusCode
      }
    });
  }

  // Default to 500 server error
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: {
      message: 'An unexpected error occurred',
      statusCode: 500
    }
  });
};

// 404 Not Found handler
exports.notFound = (req, res, next) => {
  const message = `The requested resource ${req.originalUrl} was not found`;
  res.status(404).json({
    success: false,
    message,
    error: {
      message,
      statusCode: 404
    }
  });
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Error: ${err.message}`.red);
  // Close server & exit process
  // server.close(() => process.exit(1));
});
