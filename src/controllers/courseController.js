const Course = require('../models/Course');
const ApiError = require('../utils/ApiError');
const { uploadStream, deleteImage } = require('../services/cloudinaryService');

// ── Public ────────────────────────────────────────────────────────────────────

const list = async (req, res, next) => {
  try {
    const { category, featured, page = 1, limit = 20 } = req.query;
    const filter = { isPublished: true };
    if (category) filter.category = category;
    if (featured === 'true') filter.isFeatured = true;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [courses, total] = await Promise.all([
      Course.find(filter).sort({ isFeatured: -1, createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Course.countDocuments(filter),
    ]);

    res.json({ success: true, data: { courses, total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course || !course.isPublished) throw new ApiError(404, 'Course not found');
    res.json({ success: true, data: course });
  } catch (err) { next(err); }
};

// ── Admin CRUD ────────────────────────────────────────────────────────────────

const listAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const filter = {};
    if (search) filter.title = { $regex: search, $options: 'i' };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [courses, total] = await Promise.all([
      Course.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Course.countDocuments(filter),
    ]);
    res.json({ success: true, data: { courses, total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const body = { ...req.body };
    if (typeof body.features === 'string') body.features = body.features.split('\n').filter(Boolean);

    if (req.file) {
      const result = await uploadStream(req.file.buffer, { folder: 'governess/courses' });
      body.thumbnail = result.secure_url;
      body.thumbnailPublicId = result.public_id;
    }

    const course = await Course.create(body);
    res.status(201).json({ success: true, message: 'Course created', data: course });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) throw new ApiError(404, 'Course not found');

    const body = { ...req.body };
    if (typeof body.features === 'string') body.features = body.features.split('\n').filter(Boolean);

    if (req.file) {
      if (course.thumbnailPublicId) await deleteImage(course.thumbnailPublicId).catch(() => {});
      const result = await uploadStream(req.file.buffer, { folder: 'governess/courses' });
      body.thumbnail = result.secure_url;
      body.thumbnailPublicId = result.public_id;
    }

    const updated = await Course.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
    res.json({ success: true, message: 'Course updated', data: updated });
  } catch (err) { next(err); }
};

const addImage = async (req, res, next) => {
  try {
    if (!req.file) throw new ApiError(400, 'Image file required');
    const course = await Course.findById(req.params.id);
    if (!course) throw new ApiError(404, 'Course not found');

    const result = await uploadStream(req.file.buffer, { folder: 'governess/courses' });
    course.images.push({ url: result.secure_url, publicId: result.public_id });
    await course.save();
    res.json({ success: true, message: 'Image added', data: course });
  } catch (err) { next(err); }
};

const removeImage = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) throw new ApiError(404, 'Course not found');

    const img = course.images.id(req.params.imageId);
    if (!img) throw new ApiError(404, 'Image not found');

    if (img.publicId) await deleteImage(img.publicId).catch(() => {});
    img.deleteOne();
    await course.save();
    res.json({ success: true, message: 'Image removed', data: course });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) throw new ApiError(404, 'Course not found');

    if (course.thumbnailPublicId) await deleteImage(course.thumbnailPublicId).catch(() => {});
    for (const img of course.images) {
      if (img.publicId) await deleteImage(img.publicId).catch(() => {});
    }

    await Course.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Course deleted' });
  } catch (err) { next(err); }
};

module.exports = { list, getOne, listAll, create, update, addImage, removeImage, remove };
