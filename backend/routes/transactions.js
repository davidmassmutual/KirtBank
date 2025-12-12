// backend/routes/transactions.js
const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const verifyToken = require('../middleware/auth');
const upload = require('../middleware/upload');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');

// Email setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async (to, subject, text) => {
  try {
    await transporter.sendMail({
      from: `"Kirt Bank" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });
  } catch (err) {
    console.error('Email send failed:', err);
  }
};

// GET: All transactions (Admin only) - FIXED POPULATE
router.get('/admin', verifyToken, async (req, res) => {
  try {
    if (!req.isAdmin) return res.status(403).json({ message: 'Admin access required' });

    const transactions = await Transaction.find()
      .populate({
        path: 'userId',
        select: 'name email phone balance'
      })
      .sort({ date: -1 })
      .lean();

    res.json(transactions);
  } catch (err) {
    console.error('Admin transactions fetch error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST: Create deposit
router.post('/deposit', verifyToken, upload.single('receipt'), async (req, res) => {
  const { amount, method, account } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount' });

  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const transaction = new Transaction({
      userId: req.userId,
      type: 'deposit',
      amount: parseFloat(amount),
      method: method || 'bank',
      account: account || 'checking',
      status: 'Pending',
      date: new Date(),
      receipt: req.file ? `/uploads/${req.file.filename}` : null,
    });

    await transaction.save();

    user.notifications.push({
      message: `Deposit of $${amount} via ${method} is pending approval.`,
      type: 'deposit',
      date: new Date(),
    });

    await User.updateMany(
      { isAdmin: true },
      { $push: { adminNotifications: { message: `New deposit: $${amount} from ${user.name}`, date: new Date(), read: false } } }
    );

    await user.save();
    await sendEmail(user.email, 'Deposit Pending', `Your deposit of $${amount} is under review.`);

    res.status(201).json({ message: 'Deposit submitted', transaction });
  } catch (err) {
    console.error('Deposit creation error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ADMIN: CONFIRM OR REJECT DEPOSIT - 100% FIXED
router.put('/admin/:txId', verifyToken, async (req, res) => {
  const { txId } = req.params;
  const { action } = req.body;

  if (!['confirm', 'reject'].includes(action)) {
    return res.status(400).json({ message: 'Action must be "confirm" or "reject"' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!req.isAdmin) {
      await session.abortTransaction();
      return res.status(403).json({ message: 'Admin access required' });
    }

    const tx = await Transaction.findById(txId).session(session);
    if (!tx) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Transaction not found' });
    }
    if (tx.type !== 'deposit') {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Not a deposit transaction' });
    }
    if (tx.status !== 'Pending') {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Transaction already processed' });
    }

    const user = await User.findById(tx.userId).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'User not found' });
    }

    let userMsg = '';
    let adminMsg = '';

    if (action === 'confirm') {
      tx.status = 'Completed';
      user.balance[tx.account] = (user.balance[tx.account] || 0) + tx.amount;

      userMsg = `Your deposit of $${tx.amount} has been CONFIRMED and added to ${tx.account}.`;
      adminMsg = `Confirmed deposit #${tx._id.toString().slice(-6)} (+$${tx.amount}) for ${user.name}`;
    } else {
      tx.status = 'Failed';
      userMsg = `Your deposit of $${tx.amount} has been REJECTED.`;
      adminMsg = `Rejected deposit #${tx._id.toString().slice(-6)} ($${tx.amount}) for ${user.name}`;
    }

    // Update user notifications
    user.notifications.push({
      message: userMsg,
      type: action === 'confirm' ? 'deposit_success' : 'deposit_failed',
      date: new Date(),
    });

    // Update admin notifications
    await User.updateMany(
      { isAdmin: true },
      { $push: { adminNotifications: { message: adminMsg, date: new Date(), read: false } } },
      { session }
    );

    await tx.save({ session });
    await user.save({ session });
    await session.commitTransaction();

    // Send email
    await sendEmail(user.email, action === 'confirm' ? 'Deposit Confirmed ✅' : 'Deposit Rejected ❌', userMsg);

    res.json({
      message: `Deposit ${action}ed successfully`,
      transaction: tx,
      user: {
        _id: user._id,
        balance: user.balance
      }
    });
  } catch (err) {
    await session.abortTransaction();
    console.error('Confirm/Reject error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  } finally {
    session.endSession();
  }
});

// GET user transactions by ID
router.get('/user/:userId', verifyToken, async (req, res) => {
  try {
    if (!req.isAdmin && req.userId !== req.params.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    const transactions = await Transaction.find({ userId: req.params.userId })
      .sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST: Add manual transaction (Admin)
router.post('/user/:userId', verifyToken, async (req, res) => {
  if (!req.isAdmin) return res.status(403).json({ message: 'Admin only' });

  const { type, amount, method, status = 'Completed', account = 'checking', date } = req.body;
  if (!type || !amount) return res.status(400).json({ message: 'Type and amount required' });

  try {
    const transaction = new Transaction({
      userId: req.params.userId,
      type,
      amount: parseFloat(amount),
      method,
      status,
      account,
      date: date || new Date(),
    });

    await transaction.save();

    const user = await User.findById(req.params.userId);
    if (user) {
      user.notifications.push({
        message: `Admin added: $${amount} ${type}`,
        type: 'admin_tx',
        date: new Date(),
      });
      await user.save();
    }

    res.status(201).json(transaction);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE transaction
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    if (!req.isAdmin) return res.status(403).json({ message: 'Admin only' });

    const result = await Transaction.deleteOne({ _id: req.params.id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json({ message: 'Transaction deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 