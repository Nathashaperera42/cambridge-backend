const userService = require('../services/userService');

const getProfile = async (req, res) => {
  res.json({ success: true, data: req.user });
};

const updateProfile = async (req, res, next) => {
  try {
    // Clients may update name / email / password only — never their own role.
    const { name, email, password } = req.body;
    const user = await userService.updateUser(req.user._id, { name, email, password });
    res.json({ success: true, message: 'Profile updated', data: user });
  } catch (err) {
    next(err);
  }
};

const deleteProfile = async (req, res, next) => {
  try {
    await userService.deleteUser(req.user._id);
    res.json({ success: true, message: 'Account deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProfile, updateProfile, deleteProfile };
