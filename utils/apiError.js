class ApiError extends Error {
  constructor(
    statusCode,
    message = 'Something went wrong',
    isOperational = true,
    stack = ''
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.timestamp = new Date().toISOString();
    this.errors = message;
    
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  // Static method to create a new ApiError instance
  static badRequest(message, data) {
    return new ApiError(400, message, true, data);
  }
  
  static unauthorized(message = 'Not authorized') {
    return new ApiError(401, message);
  }
  
  static forbidden(message = 'Forbidden') {
    return new ApiError(403, message);
  }
  
  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }
  
  static conflict(message = 'Conflict occurred') {
    return new ApiError(409, message);
  }
  
  static internal(message = 'Internal Server Error') {
    return new ApiError(500, message, false);
  }
}

module.exports = ApiError;
