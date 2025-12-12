// backend/routes/notifications.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const verifyToken = require('../middleware/auth');

router.get('/', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('notifications');
    res.json(user.notifications.sort((a, b) => b.date - a.date));
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark as read
router.put('/read/:id', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const notif = user.notifications.id(req.params.id);
    if (notif) notif.read = true;
    await user.save();
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;