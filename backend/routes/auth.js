// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');
const verifyToken = require('../middleware/auth');

// ──────────────────────────────────────────────────────────────
// GET: Ping (Keep-alive for free hosting)
// ──────────────────────────────────────────────────────────────
router.get('/ping', (req, res) => res.json({ pong: true }));

router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin || false,
      balance: user.balance || { checking: 0, savings: 0, usdt: 0 },
    });
  } catch (err) {
    console.error('Get current user error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ userId: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '24h' });
    const session = new Session({
      userId: user._id,
      token,
      device: req.headers['user-agent'] || 'Unknown',
    });
    await session.save();
    res.json({ token });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/admin/login', async (req, res) => {
  console.log('Admin login route hit');
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    console.log('Admin login attempt for:', email);
    const user = await User.findOne({ email, isAdmin: true });
    console.log('User found:', !!user, user ? user.email : 'none');
    if (!user) return res.status(400).json({ message: 'Invalid admin credentials' });
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch);
    if (!isMatch) return res.status(400).json({ message: 'Invalid admin credentials' });
    const token = jwt.sign({ userId: user._id, isAdmin: true }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const session = new Session({
      userId: user._id,
      token,
      device: req.headers['user-agent'] || 'Unknown',
    });
    await session.save();
    res.json({ token });
  } catch (err) {
    console.error('Admin login error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'First name, last name, email, and password are required' });
    }
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name: `${firstName} ${lastName}`,
      email,
      password: hashedPassword,
      phone: '',
      address: '',
      twoFactorEnabled: false,
      currency: 'USD',
      theme: 'light',
      isAdmin: false,
      balance: { checking: 0, savings: 0, usdt: 0 },
      notifications: [],
    });
    await user.save();
    const token = jwt.sign({ userId: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '24h' });
    const session = new Session({
      userId: user._id,
      token,
      device: req.headers['user-agent'] || 'Unknown',
    });
    await session.save();
    res.status(201).json({ token });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/sessions', verifyToken, async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.userId }).select('device lastActive _id');
    res.json(sessions);
  } catch (err) {
    console.error('Error fetching sessions:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
