const crypto = require('crypto');
const authService = require('../services/authService');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { sendWelcomeEmail, sendPasswordReset } = require('../services/emailService');

const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const { user, token } = await authService.register({ name, email, password, role });
    sendWelcomeEmail(user).catch(() => {});
    res.status(201).json({ success: true, message: 'Registered successfully', data: { user, token } });
  } catch (err) { next(err); }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await authService.login({ email, password });
    res.json({ success: true, message: 'Logged in successfully', data: { user, token } });
  } catch (err) { next(err); }
};

const logout = (_req, res) =>
  res.json({ success: true, message: 'Logged out successfully' });

const forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    // Always return success to prevent email enumeration
    if (!user) return res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save({ validateBeforeSave: false });

    await sendPasswordReset(user, token).catch(() => {});
    res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  } catch (err) { next(err); }
};

const resetPassword = async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.body.token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) throw new ApiError(400, 'Reset token is invalid or has expired');

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully. Please log in.' });
  } catch (err) { next(err); }
};

module.exports = { register, login, logout, forgotPassword, resetPassword };
