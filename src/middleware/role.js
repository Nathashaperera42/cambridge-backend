const ApiError = require('../utils/ApiError');

// Role authorization middleware.
// Usage: authorize('admin')  or  authorize('admin', 'client')
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(
      new ApiError(403, 'You do not have permission to perform this action')
    );
  }
  next();
};

module.exports = authorize;
