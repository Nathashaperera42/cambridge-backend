const router = require('express').Router();
const ctrl = require('../controllers/orderController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// Customer routes
router.post('/', auth, ctrl.createOrder);
router.get('/my', auth, ctrl.myOrders);
router.get('/my/:id', auth, ctrl.myOrderById);
router.get('/my-courses', auth, ctrl.myCourses);

// Admin routes
router.get('/admin/all', auth, role('admin'), ctrl.allOrders);
router.get('/admin/stats', auth, role('admin'), ctrl.dashboardStats);
router.get('/admin/:id', auth, role('admin'), ctrl.adminOrderById);
router.patch('/admin/:id/status', auth, role('admin'), ctrl.updateStatus);

module.exports = router;
