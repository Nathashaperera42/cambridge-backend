const router = require('express').Router();
const ctrl = require('../controllers/courseController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const upload = require('../middleware/upload');

// Public
router.get('/', ctrl.list);
router.get('/:id', ctrl.getOne);

// Admin only
router.get('/admin/all', auth, role('admin'), ctrl.listAll);
router.post('/', auth, role('admin'), upload.single('thumbnail'), ctrl.create);
router.put('/:id', auth, role('admin'), upload.single('thumbnail'), ctrl.update);
router.delete('/:id', auth, role('admin'), ctrl.remove);
router.post('/:id/images', auth, role('admin'), upload.single('image'), ctrl.addImage);
router.delete('/:id/images/:imageId', auth, role('admin'), ctrl.removeImage);

module.exports = router;
