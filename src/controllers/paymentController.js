const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const ApiError = require('../utils/ApiError');

// ── Stripe Checkout ───────────────────────────────────────────────────────────

const createStripeSession = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order) throw new ApiError(404, 'Order not found');
    if (order.status !== 'pending') throw new ApiError(400, 'Order already processed');

    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_placeholder') {
      // Demo mode: return a mock session for development without real Stripe key
      const payment = await Payment.create({
        order: order._id,
        user: req.user._id,
        gateway: 'stripe',
        amount: order.total,
        currency: 'usd',
        status: 'pending',
        sessionId: `demo_session_${Date.now()}`,
      });
      return res.json({
        success: true,
        data: {
          sessionId: payment.sessionId,
          url: `${process.env.CLIENT_URL || 'http://localhost:5000'}/api/payments/stripe/demo-success?orderId=${order._id}`,
          demo: true,
        },
      });
    }

    const lineItems = order.items.map((item) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.title,
          images: item.thumbnail ? [item.thumbnail] : [],
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: 1,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      customer_email: order.billingInfo?.email || req.user.email,
      success_url: `${process.env.CLIENT_URL || 'http://localhost:5000'}/api/payments/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:5000'}/checkout`,
      metadata: { orderId: order._id.toString() },
    });

    await Payment.create({
      order: order._id,
      user: req.user._id,
      gateway: 'stripe',
      amount: order.total,
      currency: 'usd',
      status: 'pending',
      sessionId: session.id,
    });

    res.json({ success: true, data: { sessionId: session.id, url: session.url } });
  } catch (err) { next(err); }
};

// Stripe redirects here after successful payment
const stripeSuccess = async (req, res, next) => {
  try {
    const { session_id } = req.query;
    if (!session_id) return res.redirect(`${process.env.CLIENT_URL || '/'}/order-confirmation`);

    const payment = await Payment.findOne({ sessionId: session_id }).populate('order');
    if (payment && payment.status !== 'paid') {
      payment.status = 'paid';
      payment.paidAt = new Date();
      await payment.save();
      if (payment.order) {
        await Order.findByIdAndUpdate(payment.order._id, { status: 'completed' });
      }
    }

    const orderId = payment?.order?._id || '';
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5000'}/order-confirmation?orderId=${orderId}`);
  } catch (err) { next(err); }
};

// Demo success (no real Stripe)
const demoSuccess = async (req, res, next) => {
  try {
    const { orderId } = req.query;
    if (orderId) {
      await Order.findByIdAndUpdate(orderId, { status: 'completed' });
      await Payment.findOneAndUpdate(
        { order: orderId },
        { status: 'paid', paidAt: new Date() }
      );
    }
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5000'}/order-confirmation?orderId=${orderId}`);
  } catch (err) { next(err); }
};

// Stripe webhook handler
const stripeWebhook = async (req, res, next) => {
  try {
    const sig = req.headers['stripe-signature'];
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch {
      return res.status(400).json({ success: false, message: 'Webhook signature invalid' });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const payment = await Payment.findOne({ sessionId: session.id });
      if (payment) {
        payment.status = 'paid';
        payment.paidAt = new Date();
        payment.transactionId = session.payment_intent;
        await payment.save();
        await Order.findByIdAndUpdate(payment.order, { status: 'completed' });
      }
    }

    res.json({ received: true });
  } catch (err) { next(err); }
};

// ── Admin payment views ───────────────────────────────────────────────────────

const allPayments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, gateway } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (gateway) filter.gateway = gateway;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate('user', 'name email')
        .populate('order', 'orderNumber total')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Payment.countDocuments(filter),
    ]);
    res.json({ success: true, data: { payments, total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) { next(err); }
};

module.exports = { createStripeSession, stripeSuccess, demoSuccess, stripeWebhook, allPayments };
