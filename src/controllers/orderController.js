const Order = require('../models/Order');
const Course = require('../models/Course');
const Payment = require('../models/Payment');
const ApiError = require('../utils/ApiError');
const { sendOrderConfirmation } = require('../services/emailService');

// ── Customer ──────────────────────────────────────────────────────────────────

const createOrder = async (req, res, next) => {
  try {
    const { items, billingInfo } = req.body;
    if (!items || !items.length) throw new ApiError(400, 'No items in order');

    // Fetch courses to validate prices
    const courseIds = items.map((i) => i.courseId);
    const courses = await Course.find({ _id: { $in: courseIds }, isPublished: true });

    if (courses.length !== courseIds.length) throw new ApiError(400, 'One or more courses are unavailable');

    const orderItems = courses.map((c) => ({
      course: c._id,
      title: c.title,
      price: c.price,
      thumbnail: c.thumbnail,
    }));

    const subtotal = orderItems.reduce((s, i) => s + i.price, 0);
    const tax = 0;
    const total = subtotal + tax;

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      billingInfo,
      subtotal,
      tax,
      total,
    });

    sendOrderConfirmation(order, req.user).catch(() => {});

    res.status(201).json({ success: true, message: 'Order created', data: order });
  } catch (err) { next(err); }
};

const myOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('items.course', 'title thumbnail category')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (err) { next(err); }
};

const myOrderById = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id })
      .populate('items.course', 'title thumbnail category description');
    if (!order) throw new ApiError(404, 'Order not found');
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
};

const myCourses = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id, status: 'completed' })
      .populate('items.course');
    const courses = orders.flatMap((o) => o.items.map((i) => i.course)).filter(Boolean);
    const unique = [...new Map(courses.map((c) => [c._id.toString(), c])).values()];
    res.json({ success: true, data: unique });
  } catch (err) { next(err); }
};

// ── Admin ─────────────────────────────────────────────────────────────────────

const allOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search) filter.orderNumber = { $regex: search, $options: 'i' };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Order.countDocuments(filter),
    ]);
    res.json({ success: true, data: { orders, total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) { next(err); }
};

const adminOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('items.course', 'title thumbnail category');
    if (!order) throw new ApiError(404, 'Order not found');
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
};

const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'processing', 'completed', 'cancelled', 'refunded'];
    if (!allowed.includes(status)) throw new ApiError(400, 'Invalid status');

    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) throw new ApiError(404, 'Order not found');
    res.json({ success: true, message: 'Order status updated', data: order });
  } catch (err) { next(err); }
};

const dashboardStats = async (req, res, next) => {
  try {
    const [totalOrders, totalCustomers, completedOrders, recentOrders] = await Promise.all([
      Order.countDocuments(),
      require('../models/User').countDocuments({ role: 'client' }),
      Order.find({ status: 'completed' }),
      Order.find().populate('user', 'name email').sort({ createdAt: -1 }).limit(5),
    ]);

    const totalRevenue = completedOrders.reduce((s, o) => s + o.total, 0);
    const totalCourses = await Course.countDocuments();

    res.json({
      success: true,
      data: { totalRevenue, totalOrders, totalCustomers, totalCourses, recentOrders },
    });
  } catch (err) { next(err); }
};

module.exports = {
  createOrder, myOrders, myOrderById, myCourses,
  allOrders, adminOrderById, updateStatus, dashboardStats,
};
