const mongoose = require('mongoose');

const courseImageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String },
});

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true },
    description: { type: String, required: [true, 'Description is required'] },
    shortDescription: { type: String, trim: true },
    price: { type: Number, required: [true, 'Price is required'], min: 0 },
    category: {
      type: String,
      enum: ['YLE', 'KET', 'PET', 'FCE', 'Speech & Drama', 'Spoken English', 'General', 'Other'],
      default: 'General',
    },
    thumbnail: { type: String },
    thumbnailPublicId: { type: String },
    images: [courseImageSchema],
    content: { type: String },
    features: [{ type: String }],
    ageGroup: { type: String },
    duration: { type: String },
    level: { type: String },
    isPublished: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    gold: { type: Boolean, default: false },
  },
  { timestamps: true }
);

courseSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Course', courseSchema);
