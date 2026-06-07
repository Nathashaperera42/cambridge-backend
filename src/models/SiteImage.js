const mongoose = require('mongoose');

const siteImageSchema = new mongoose.Schema(
  {
    section: {
      type: String,
      enum: ['hero_slider', 'about', 'speech_drama', 'events', 'gallery'],
      required: true,
    },
    label: { type: String, required: true, trim: true },
    imageUrl: { type: String, required: true },
    publicId: { type: String, required: true },
    altText: { type: String, default: '', trim: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SiteImage', siteImageSchema);
