// Central place for env-derived config values.
module.exports = {
  jwtSecret: process.env.JWT_SECRET || 'Nathasha',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
};
