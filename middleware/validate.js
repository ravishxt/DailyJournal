const { validationResult } = require('express-validator');
const ApiError = require('../utils/apiError');

// Middleware to validate request using express-validator
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (errors.isEmpty()) {
    return next();
  }
  
  // Format errors to return as an array of error messages
  const extractedErrors = [];
  errors.array().map(err => extractedErrors.push({ [`${err.location}.${err.path}`]: err.msg }));
  
  // Pass to error handler
  next(new ApiError(400, 'Validation failed', true, { errors: extractedErrors }));
};

module.exports = { validate };
