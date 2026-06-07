const router = require('express').Router();
const { getProfile, updateProfile, deleteProfile } = require('../controllers/profileController');
const authenticate = require('../middleware/auth');

// Any authenticated user manages their own profile here.
router.use(authenticate);

router.get('/', getProfile);
router.put('/', updateProfile);
router.delete('/', deleteProfile);

module.exports = router;
