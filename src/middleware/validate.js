const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

// Collects express-validator results and throws a single 422 on failure.
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors.array().map((e) => e.msg).join(', ');
    return next(new ApiError(422, message));
  }
  next();
};

module.exports = validate;
