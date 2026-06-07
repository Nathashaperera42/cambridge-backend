const router = require('express').Router();
const ctrl = require('../controllers/userController');
const { createUserValidation, updateUserValidation } = require('../validations/userValidation');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/role');

// Every route below requires a valid token AND the admin role.
router.use(authenticate, authorize('admin'));

router.get('/', ctrl.list);
router.post('/', createUserValidation, validate, ctrl.create);
router.get('/:id', ctrl.getOne);
router.put('/:id', updateUserValidation, validate, ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
