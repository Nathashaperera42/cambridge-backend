// Central error handling middleware + 404 handler.

const notFound = (req, res) => {
  res
    .status(404)
    .json({ success: false, message: `Route not found: ${req.originalUrl}` });
};

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Mongo duplicate key (e.g. unique email)
  if (err.code === 11000) {
    statusCode = 409;
    message = 'Email already registered';
  }
  // Mongoose schema validation
  if (err.name === 'ValidationError') {
    statusCode = 422;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  }

  if (process.env.NODE_ENV !== 'production') console.error(err);

  res.status(statusCode).json({ success: false, message });
};

module.exports = { notFound, errorHandler };
