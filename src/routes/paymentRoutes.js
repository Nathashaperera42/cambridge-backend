const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/paymentController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// Stripe webhook needs raw body — must be before express.json() parses it
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), ctrl.stripeWebhook);

// Stripe redirect handlers (no auth — redirected from Stripe)
router.get('/stripe/success', ctrl.stripeSuccess);
router.get('/stripe/demo-success', ctrl.demoSuccess);

// Authenticated
router.post('/stripe/create-session', auth, ctrl.createStripeSession);

// Admin
router.get('/admin/all', auth, role('admin'), ctrl.allPayments);

module.exports = router;
