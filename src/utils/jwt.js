const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpiresIn } = require('../config');

// Token creation utility
const signToken = (payload) =>
  jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn });

// Token verification utility
const verifyToken = (token) => jwt.verify(token, jwtSecret);

module.exports = { signToken, verifyToken };
