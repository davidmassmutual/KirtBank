// scripts/createAdmin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  try {
    const existingAdmin = await User.findOne({ email: 'samirahpartel48@gmail.com' });
    if (existingAdmin) {
      console.log('Admin already exists');
      process.exit();
    }
    const hash = await bcrypt.hash('kirt@123', 10);
    const admin = new User({
      name: 'Admin',
      email: 'samirahpartel48@gmail.com',
      password: hash,
      isAdmin: true,
      balance: { checking: 0, savings: 0, usdt: 0 },
      transactions: [],
      notifications: []
    });
    await admin.save();
    console.log('Admin created');
  } catch (err) {
    console.error('Error creating admin:', err);
  } finally {
    process.exit();
  }
}).catch(err => {
  console.error('DB connection error:', err);
  process.exit(1);
});
