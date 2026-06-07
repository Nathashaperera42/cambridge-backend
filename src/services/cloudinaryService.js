const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadStream = (buffer, options = {}) =>
  new Promise((resolve, reject) => {
    const opts = {
      folder: options.folder || 'governess/courses',
      resource_type: 'image',
      transformation: [{ width: 800, height: 600, crop: 'fill', quality: 'auto', fetch_format: 'auto' }],
      ...options,
    };
    cloudinary.uploader
      .upload_stream(opts, (err, result) => (err ? reject(err) : resolve(result)))
      .end(buffer);
  });

const uploadProfileImage = (buffer) =>
  uploadStream(buffer, {
    folder: 'governess/profiles',
    transformation: [{ width: 200, height: 200, crop: 'fill', quality: 'auto' }],
  });

const deleteImage = (publicId) => cloudinary.uploader.destroy(publicId);

module.exports = { uploadStream, uploadProfileImage, deleteImage };
