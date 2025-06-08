class ApiResponse {
  constructor(res) {
    this.res = res;
  }

  success(data = null, message = 'Success', statusCode = 200) {
    return this.res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  error(message = 'Internal Server Error', statusCode = 500, errors = null) {
    return this.res.status(statusCode).json({
      success: false,
      message,
      error: {
        message,
        ...(errors && { details: errors }),
        statusCode
      }
    });
  }

  created(data = null, message = 'Resource created successfully') {
    return this.success(data, message, 201);
  }

  notFound(message = 'Resource not found') {
    return this.error(message, 404);
  }

  badRequest(message = 'Bad Request', errors = null) {
    return this.error(message, 400, errors);
  }

  unauthorized(message = 'Unauthorized') {
    return this.error(message, 401);
  }

  forbidden(message = 'Forbidden') {
    return this.error(message, 403);
  }

  conflict(message = 'Resource already exists') {
    return this.error(message, 409);
  }

  validationError(errors) {
    return this.error('Validation Error', 422, errors);
  }
}

// Middleware to attach response methods to res object
const responseHandler = (req, res, next) => {
  res.api = new ApiResponse(res);
  next();
};

module.exports = responseHandler;
