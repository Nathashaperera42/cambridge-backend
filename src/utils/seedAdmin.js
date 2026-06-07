// One-off script to create the first admin account.
// Run with:  npm run seed:admin
require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');

(async () => {
  await connectDB();
  const email = 'collegegoverness@gmail.com';
  const existing = await User.findOne({ email });
  if (existing) {
    console.log('Admin already exists:', email);
    process.exit(0);
  }
  await User.create({
    name: 'Administrator',
    email,
    password: 'admin1234',
    role: 'admin',
  });
  console.log('Admin created -> email:', email, '| password: admin1234');
  process.exit(0);
})();
