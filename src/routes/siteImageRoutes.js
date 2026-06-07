const router = require('express').Router();
const ctrl = require('../controllers/siteImageController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const upload = require('../middleware/upload');

router.get('/', ctrl.list);
router.get('/admin', auth, role('admin'), ctrl.listAdmin);
router.post('/', auth, role('admin'), upload.single('image'), ctrl.create);
router.put('/:id', auth, role('admin'), upload.single('image'), ctrl.update);
router.delete('/:id', auth, role('admin'), ctrl.remove);

module.exports = router;
