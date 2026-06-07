const router = require('express').Router();

router.use('/auth', require('./authRoutes'));
router.use('/users', require('./userRoutes'));
router.use('/profile', require('./profileRoutes'));
router.use('/courses', require('./courseRoutes'));
router.use('/orders', require('./orderRoutes'));
router.use('/payments', require('./paymentRoutes'));
router.use('/contact', require('./contactRoutes'));
router.use('/site-images', require('./siteImageRoutes'));

module.exports = router;
