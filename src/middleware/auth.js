const { verifyToken } = require('../utils/jwt');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');

// Authentication middleware: verifies the Bearer token and attaches req.user.
const authenticate = async (req, res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Authentication token missing'));
  }
  const token = header.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id);
    if (!user) return next(new ApiError(401, 'User no longer exists'));
    req.user = user;
    next();
  } catch (err) {
    next(new ApiError(401, 'Invalid or expired token'));
  }
};

module.exports = authenticate;
