const ContactMessage = require('../models/ContactMessage');
const ApiError = require('../utils/ApiError');
const { sendContactNotification, sendContactAutoReply, sendContactReply } = require('../services/emailService');

// ── Public ────────────────────────────────────────────────────────────────────

const submit = async (req, res, next) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    const contact = await ContactMessage.create({ name, email, phone, subject, message });

    // Fire-and-forget email notifications
    sendContactNotification(contact).catch(() => {});
    sendContactAutoReply(contact).catch(() => {});

    res.status(201).json({ success: true, message: 'Your message has been sent! We will get back to you shortly.' });
  } catch (err) { next(err); }
};

// ── Admin ─────────────────────────────────────────────────────────────────────

const list = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unread } = req.query;
    const filter = {};
    if (unread === 'true') filter.isRead = false;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [messages, total] = await Promise.all([
      ContactMessage.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      ContactMessage.countDocuments(filter),
    ]);
    res.json({ success: true, data: { messages, total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) { next(err); }
};

const markRead = async (req, res, next) => {
  try {
    const msg = await ContactMessage.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    if (!msg) throw new ApiError(404, 'Message not found');
    res.json({ success: true, data: msg });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const msg = await ContactMessage.findByIdAndDelete(req.params.id);
    if (!msg) throw new ApiError(404, 'Message not found');
    res.json({ success: true, message: 'Message deleted' });
  } catch (err) { next(err); }
};

const reply = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) throw new ApiError(400, 'Reply message is required');

    const contact = await ContactMessage.findById(req.params.id);
    if (!contact) throw new ApiError(404, 'Message not found');

    await sendContactReply(contact, message.trim());

    // Auto-mark as read on reply
    if (!contact.isRead) {
      contact.isRead = true;
      await contact.save();
    }

    res.json({ success: true, message: `Reply sent to ${contact.email}` });
  } catch (err) { next(err); }
};

const unreadCount = async (req, res, next) => {
  try {
    const count = await ContactMessage.countDocuments({ isRead: false });
    res.json({ success: true, data: { count } });
  } catch (err) { next(err); }
};

module.exports = { submit, list, markRead, remove, unreadCount, reply };
