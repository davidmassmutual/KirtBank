// backend/routes/user.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const verifyToken = require('../middleware/auth');
const upload = require('../middleware/upload'); // ← Multer middleware
const path = require('path');
const fs = require('fs');

// ──────────────────────────────────────────────────────────────
// Middleware: Admin check
// ──────────────────────────────────────────────────────────────
const isAdmin = (req, res, next) => {
  if (!req.isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// ──────────────────────────────────────────────────────────────
// GET: Current user (token validation)
// ──────────────────────────────────────────────────────────────
router.get('/', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Get current user error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ──────────────────────────────────────────────────────────────
// GET: All users (Admin only)
// ──────────────────────────────────────────────────────────────
router.get('/all', verifyToken, isAdmin, async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (err) {
    console.error('Error fetching all users:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ──────────────────────────────────────────────────────────────
// SEARCH & FILTER: Users (Admin only)
// ?q=john&page=1&limit=10
// ──────────────────────────────────────────────────────────────
router.get('/search', verifyToken, isAdmin, async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = q
      ? {
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } },
            { phone: { $regex: q, $options: 'i' } },
          ],
        }
      : {};

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('Search users error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ──────────────────────────────────────────────────────────────
// BULK ACTIONS: Delete or Update Balance
// POST { action: 'delete' | 'updateBalance', userIds: [], data: { balance: { checking: 100 } } }
// ──────────────────────────────────────────────────────────────
router.post('/bulk', verifyToken, isAdmin, async (req, res) => {
  const { action, userIds, data } = req.body;

  if (!action || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ message: 'Invalid bulk request' });
  }

  try {
    switch (action) {
      case 'delete':
        await User.deleteMany({ _id: { $in: userIds } });
        await logAdminNotification(req.userId, `Bulk deleted ${userIds.length} users`);
        return res.json({ message: `${userIds.length} users deleted` });

      case 'updateBalance':
        if (!data?.balance) {
          return res.status(400).json({ message: 'Balance data required' });
        }
        const result = await User.updateMany(
          { _id: { $in: userIds } },
          {
            $set: {
              'balance.checking': data.balance.checking || 0,
              'balance.savings': data.balance.savings || 0,
              'balance.usdt': data.balance.usdt || 0,
            },
          }
        );
        await logAdminNotification(req.userId, `Bulk updated balance for ${userIds.length} users`);
        return res.json({
          message: `Updated ${result.modifiedCount} user(s)`,
          modified: result.modifiedCount,
        });

      default:
        return res.status(400).json({ message: 'Invalid action' });
    }
  } catch (err) {
    console.error('Bulk action error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ──────────────────────────────────────────────────────────────
// GET: Admin Notifications
// ──────────────────────────────────────────────────────────────
router.get('/notifications', verifyToken, isAdmin, async (req, res) => {
  try {
    const admin = await User.findById(req.userId).select('adminNotifications');
    res.json(admin.adminNotifications || []);
  } catch (err) {
    console.error('Fetch admin notifications error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ──────────────────────────────────────────────────────────────
// Helper: Log admin notification
// ──────────────────────────────────────────────────────────────
async function logAdminNotification(adminId, message) {
  try {
    await User.findByIdAndUpdate(
      adminId,
      {
        $push: {
          adminNotifications: {
            message,
            date: new Date(),
            read: false,
          },
        },
      },
      { new: true }
    );
  } catch (err) {
    console.error('Failed to log admin notification:', err.message);
  }
}

// ──────────────────────────────────────────────────────────────
// PUT: Update profile (Name, Address, Phone)
// ──────────────────────────────────────────────────────────────
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.name = name;
    user.phone = phone;
    user.address = address;

    await user.save();

    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Profile update error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ──────────────────────────────────────────────────────────────
// PUT: Upload Profile Image
// ──────────────────────────────────────────────────────────────
router.put('/profile/image', verifyToken, upload.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image uploaded' });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Delete old image
    if (user.profileImage) {
      const oldPath = path.join(__dirname, '..', user.profileImage);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    user.profileImage = `/uploads/${req.file.filename}`;
    await user.save();

    res.json({ message: 'Profile image updated', profileImage: user.profileImage });
  } catch (err) {
    console.error('Image upload error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ──────────────────────────────────────────────────────────────
// PUT: Change password
// ──────────────────────────────────────────────────────────────
router.put('/password', verifyToken, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.password = await bcrypt.hash(password, 10);
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Password update error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ──────────────────────────────────────────────────────────────
// PUT: 2FA toggle
// ──────────────────────────────────────────────────────────────
router.put('/2fa', verifyToken, async (req, res) => {
  try {
    const { twoFactor } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.twoFactorEnabled = twoFactor;
    await user.save();

    res.json({ message: `Two-Factor Authentication ${twoFactor ? 'enabled' : 'disabled'}` });
  } catch (err) {
    console.error('2FA update error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ──────────────────────────────────────────────────────────────
// PUT: Notification settings
// ──────────────────────────────────────────────────────────────
router.put('/notifications', verifyToken, async (req, res) => {
  try {
    const { email, sms, push } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.notificationsSettings = { email, sms, push };
    await user.save();

    res.json({ message: 'Notification preferences updated' });
  } catch (err) {
    console.error('Notifications update error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ──────────────────────────────────────────────────────────────
// PUT: Preferences (currency/theme)
// ──────────────────────────────────────────────────────────────
router.put('/preferences', verifyToken, async (req, res) => {
  try {
    const { currency, theme } = req.body;
    if (!['USD', 'EUR', 'GBP'].includes(currency) || !['light', 'dark'].includes(theme)) {
      return res.status(400).json({ message: 'Invalid currency or theme' });
    }
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.currency = currency;
    user.theme = theme;
    await user.save();

    res.json({ message: 'Preferences updated' });
  } catch (err) {
    console.error('Preferences update error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ──────────────────────────────────────────────────────────────
// POST: Submit KYC documents
// ──────────────────────────────────────────────────────────────
router.post('/kyc', verifyToken, upload.single('idDocument'), async (req, res) => {
  try {
    const { ssn } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'ID document is required' });
    }

    if (!ssn) {
      return res.status(400).json({ message: 'SSN is required' });
    }

    // Validate SSN format
    const ssnRegex = /^\d{3}-\d{2}-\d{4}$/;
    if (!ssnRegex.test(ssn)) {
      return res.status(400).json({ message: 'Invalid SSN format. Use XXX-XX-XXXX' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Update user with KYC data
    user.kycDocument = `/uploads/${req.file.filename}`;
    user.ssn = ssn;
    user.kycStatus = 'submitted';
    user.kycSubmittedAt = new Date();

  await user.save();

  res.json({
    message: 'KYC documents submitted successfully',
    kycStatus: 'submitted'
  });
} catch (err) {
  console.error('KYC submission error:', err.message);
  res.status(500).json({ message: 'Server error' });
}
});

// ──────────────────────────────────────────────────────────────
// ADMIN: Approve/Reject KYC
// PUT /api/user/:userId/kyc-approve
// ──────────────────────────────────────────────────────────────
router.put('/:userId/kyc-approve', verifyToken, isAdmin, async (req, res) => {
  try {
    const { action } = req.body; // 'approve' or 'reject'
    const userId = req.params.userId;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (action === 'approve') {
      user.kycStatus = 'verified';
      await logAdminNotification(req.userId, `KYC approved for ${user.name} (${user.email})`);
    } else if (action === 'reject') {
      user.kycStatus = 'rejected';
      user.kycDocument = null; // Optionally remove document
      await logAdminNotification(req.userId, `KYC rejected for ${user.name} (${user.email})`);
    } else {
      return res.status(400).json({ message: 'Invalid action' });
    }

    await user.save();
    res.json({ message: `KYC ${action}d successfully`, kycStatus: user.kycStatus });
  } catch (err) {
    console.error('KYC approval error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ──────────────────────────────────────────────────────────────
// DELETE: Session (optional)
// ──────────────────────────────────────────────────────────────
router.delete('/sessions/:sessionId', verifyToken, async (req, res) => {
  try {
    const Session = require('../models/Session');
    const session = await Session.findOne({ _id: req.params.sessionId, userId: req.userId });
    if (!session) return res.status(404).json({ message: 'Session not found' });

    await session.deleteOne();
    res.json({ message: 'Session terminated' });
  } catch (err) {
    console.error('Session deletion error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ──────────────────────────────────────────────────────────────
// DELETE: All Sessions (Clear all)
// ──────────────────────────────────────────────────────────────
router.delete('/sessions', verifyToken, async (req, res) => {
  try {
    const Session = require('../models/Session');
    await Session.deleteMany({ userId: req.userId });
    res.json({ message: 'All sessions cleared' });
  } catch (err) {
    console.error('Clear all sessions error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ──────────────────────────────────────────────────────────────
// ADMIN: Update user balance manually (ONE USER)
// PUT /api/user/:userId/balances
// ──────────────────────────────────────────────────────────────
router.put('/:userId/balances', verifyToken, isAdmin, async (req, res) => {
  const { checkingBalance, savingsBalance, usdtBalance } = req.body;

  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (checkingBalance !== undefined) user.balance.checking = Number(checkingBalance);
    if (savingsBalance !== undefined) user.balance.savings = Number(savingsBalance);
    if (usdtBalance !== undefined) user.balance.usdt = Number(usdtBalance);

    await user.save();

    res.json({
      message: 'Balance updated successfully',
      balance: user.balance
    });
  } catch (err) {
    console.error('Balance update error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
