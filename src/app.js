const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json());

app.get('/', (req, res) =>
  res.json({ success: true, message: 'Governess API is running' })
);

app.use('/api', routes);

// 404 + centralised error handling (must be last)
app.use(notFound);
app.use(errorHandler);

module.exports = app;
