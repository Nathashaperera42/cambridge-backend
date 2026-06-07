const router = require('express').Router();
const ctrl = require('../controllers/contactController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// Public
router.post('/', ctrl.submit);

// Admin
router.get('/', auth, role('admin'), ctrl.list);
router.get('/unread-count', auth, role('admin'), ctrl.unreadCount);
router.patch('/:id/read', auth, role('admin'), ctrl.markRead);
router.post('/:id/reply', auth, role('admin'), ctrl.reply);
router.delete('/:id', auth, role('admin'), ctrl.remove);

module.exports = router;
