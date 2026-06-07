const router = require('express').Router();
const { register, login, logout, forgotPassword, resetPassword } = require('../controllers/authController');
const { registerValidation, loginValidation } = require('../validations/authValidation');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/auth');

router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.post('/logout', authenticate, logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
