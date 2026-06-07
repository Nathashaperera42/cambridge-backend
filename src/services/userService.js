const User = require('../models/User');
const ApiError = require('../utils/ApiError');

// List with search + pagination
const listUsers = async ({ page = 1, limit = 10, search = '', role }) => {
  page = parseInt(page, 10) || 1;
  limit = parseInt(limit, 10) || 10;

  const query = {};
  if (role) query.role = role;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return { users, total, page, pages: Math.ceil(total / limit) || 1 };
};

const getUser = async (id) => {
  const user = await User.findById(id);
  if (!user) throw new ApiError(404, 'User not found');
  return user;
};

const createUser = async (data) => {
  const existing = await User.findOne({ email: data.email });
  if (existing) throw new ApiError(409, 'Email already registered');
  return User.create({ ...data, role: data.role || 'client' });
};

const updateUser = async (id, data) => {
  const user = await User.findById(id).select('+password');
  if (!user) throw new ApiError(404, 'User not found');

  if (data.email && data.email !== user.email) {
    const dup = await User.findOne({ email: data.email });
    if (dup) throw new ApiError(409, 'Email already registered');
  }

  ['name', 'email', 'role', 'password'].forEach((field) => {
    if (data[field] !== undefined && data[field] !== '') user[field] = data[field];
  });

  await user.save(); // re-hashes password if it changed
  return user;
};

const deleteUser = async (id) => {
  const user = await User.findByIdAndDelete(id);
  if (!user) throw new ApiError(404, 'User not found');
  return user;
};

module.exports = { listUsers, getUser, createUser, updateUser, deleteUser };
