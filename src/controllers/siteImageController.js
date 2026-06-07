const SiteImage = require('../models/SiteImage');
const { uploadStream, deleteImage } = require('../services/cloudinaryService');
const ApiError = require('../utils/ApiError');

const _uploadOpts = {
  folder: 'governess/site',
  transformation: [
    { width: 1400, height: 900, crop: 'fill', quality: 'auto', fetch_format: 'auto' },
  ],
};

// GET /site-images  — public, only active
const list = async (req, res, next) => {
  try {
    const { section } = req.query;
    const filter = { isActive: true };
    if (section) filter.section = section;
    const images = await SiteImage.find(filter).sort({ section: 1, order: 1 });
    res.json({ success: true, data: images });
  } catch (err) {
    next(err);
  }
};

// GET /site-images/admin  — admin, all images
const listAdmin = async (req, res, next) => {
  try {
    const { section } = req.query;
    const filter = section ? { section } : {};
    const images = await SiteImage.find(filter).sort({ section: 1, order: 1 });
    res.json({ success: true, data: images });
  } catch (err) {
    next(err);
  }
};

// POST /site-images
const create = async (req, res, next) => {
  try {
    if (!req.file) throw new ApiError(400, 'Image file is required');
    const { section, label, altText = '', order = 0 } = req.body;
    if (!section) throw new ApiError(400, 'section is required');
    if (!label?.trim()) throw new ApiError(400, 'label is required');

    const result = await uploadStream(req.file.buffer, _uploadOpts);

    const image = await SiteImage.create({
      section,
      label: label.trim(),
      imageUrl: result.secure_url,
      publicId: result.public_id,
      altText: (altText || '').trim(),
      order: Number(order) || 0,
    });

    res.status(201).json({ success: true, data: image });
  } catch (err) {
    next(err);
  }
};

// PUT /site-images/:id
const update = async (req, res, next) => {
  try {
    const image = await SiteImage.findById(req.params.id);
    if (!image) throw new ApiError(404, 'Image not found');

    const { label, altText, order, isActive } = req.body;
    if (label !== undefined) image.label = label.trim();
    if (altText !== undefined) image.altText = altText.trim();
    if (order !== undefined) image.order = Number(order) || 0;
    if (isActive !== undefined)
      image.isActive = isActive === true || isActive === 'true';

    if (req.file) {
      await deleteImage(image.publicId).catch(() => {});
      const result = await uploadStream(req.file.buffer, _uploadOpts);
      image.imageUrl = result.secure_url;
      image.publicId = result.public_id;
    }

    await image.save();
    res.json({ success: true, data: image });
  } catch (err) {
    next(err);
  }
};

// DELETE /site-images/:id
const remove = async (req, res, next) => {
  try {
    const image = await SiteImage.findById(req.params.id);
    if (!image) throw new ApiError(404, 'Image not found');
    await deleteImage(image.publicId).catch(() => {});
    await image.deleteOne();
    res.json({ success: true, message: 'Image deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { list, listAdmin, create, update, remove };
