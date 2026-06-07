const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { signToken } = require('../utils/jwt');

const register = async ({ name, email, password, role }) => {
  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'Email already registered');

  const user = await User.create({
    name,
    email,
    password,
    role: role || 'client',
  });
  const token = signToken({ id: user._id, role: user.role });
  return { user, token };
};

const login = async ({ email, password }) => {
  // password has select:false, so request it explicitly
  const user = await User.findOne({ email }).select('+password');
  if (!user) throw new ApiError(401, 'Invalid email or password');

  const match = await user.comparePassword(password);
  if (!match) throw new ApiError(401, 'Invalid email or password');

  const token = signToken({ id: user._id, role: user.role });
  return { user, token };
};

module.exports = { register, login };
