// backend/routes/virtualCards.js
const express = require('express');
const router = express.Router();
const VirtualCard = require('../models/VirtualCard');
const User = require('../models/User');
const verifyToken = require('../middleware/auth');

router.get('/', verifyToken, async (req, res) => {
  try {
    const cards = await VirtualCard.find({ userId: req.userId });
    res.json(cards);
  } catch (err) {
    console.error('Error fetching virtual cards:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    // Check if user already has an active virtual card
    const existingActiveCard = await VirtualCard.findOne({
      userId: req.userId,
      cardType: 'virtual',
      status: { $in: ['Active', 'Frozen'] }
    });

    if (existingActiveCard) {
      return res.status(400).json({
        message: 'You already have an active virtual card. Delete or freeze your existing card to create a new one.'
      });
    }

    const generateRandomNumber = (length) => {
      return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
    };
    const cardNumber = generateRandomNumber(16);
    const cvv = generateRandomNumber(3);
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 3);
    const formattedExpiry = `${(expiryDate.getMonth() + 1).toString().padStart(2, '0')}/${expiryDate.getFullYear().toString().slice(-2)}`;

    const card = new VirtualCard({
      userId: req.userId,
      cardNumber,
      cvv,
      expiryDate: formattedExpiry,
      cardType: 'virtual',
      network: 'Visa',
      status: 'Active',
    });
    await card.save();

    const user = await User.findById(req.userId);
    user.notifications.push({
      message: `New virtual card ending in ${cardNumber.slice(-4)} created`,
      date: new Date(),
    });
    await user.save();

    res.status(201).json(card);
  } catch (err) {
    console.error('Error creating virtual card:', err.message);
    res.status(500).json({ message: 'Failed to create virtual card' });
  }
});

// POST: Order physical card
router.post('/physical', verifyToken, async (req, res) => {
  try {
    const { shippingAddress } = req.body;

    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city ||
        !shippingAddress.state || !shippingAddress.zipCode) {
      return res.status(400).json({ message: 'Complete shipping address is required' });
    }

    const user = await User.findById(req.userId);

    // Check if user has enough balance for $100 fee
    const totalBalance = user.balance.checking + user.balance.savings + user.balance.usdt;
    if (totalBalance < 100) {
      return res.status(400).json({ message: 'Insufficient balance. Physical card costs $100.' });
    }

    // Check if user already has a physical card in progress
    const existingPhysicalCard = await VirtualCard.findOne({
      userId: req.userId,
      cardType: 'physical',
      status: { $nin: ['Deleted', 'Delivered'] }
    });

    if (existingPhysicalCard) {
      return res.status(400).json({
        message: 'You already have a physical card order in progress.'
      });
    }

    // Deduct $100 from user's balance
    if (user.balance.checking >= 100) {
      user.balance.checking -= 100;
    } else if (user.balance.savings >= 100) {
      user.balance.savings -= 100;
    } else {
      // Use combination of accounts
      const remaining = 100 - user.balance.checking;
      user.balance.checking = 0;
      user.balance.savings -= remaining;
    }

    const generateRandomNumber = (length) => {
      return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
    };
    const cardNumber = generateRandomNumber(16);
    const cvv = generateRandomNumber(3);
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 3);
    const formattedExpiry = `${(expiryDate.getMonth() + 1).toString().padStart(2, '0')}/${expiryDate.getFullYear().toString().slice(-2)}`;

    const trackingNumber = 'KB' + generateRandomNumber(12);

    const card = new VirtualCard({
      userId: req.userId,
      cardNumber,
      cvv,
      expiryDate: formattedExpiry,
      cardType: 'physical',
      network: 'Visa',
      status: 'Ordered',
      shippingAddress,
      shippingStatus: 'Ordered',
      orderDate: new Date(),
      trackingNumber,
    });
    await card.save();

    // Create transaction record for the $100 fee
    const Transaction = require('../models/Transaction');
    const feeTx = new Transaction({
      userId: req.userId,
      type: 'fee',
      amount: 100,
      method: 'physical_card_order',
      status: 'Posted',
      account: 'checking',
      date: new Date(),
    });
    await feeTx.save();

    user.notifications.push({
      message: `Physical card ordered for $100. Tracking: ${trackingNumber}`,
      date: new Date(),
    });
    await user.save();

    res.status(201).json({
      card,
      message: 'Physical card ordered successfully. $100 has been deducted from your account.'
    });
  } catch (err) {
    console.error('Error ordering physical card:', err.message);
    res.status(500).json({ message: 'Failed to order physical card' });
  }
});

router.delete('/:cardId', verifyToken, async (req, res) => {
  try {
    const card = await VirtualCard.findOne({ _id: req.params.cardId, userId: req.userId });
    if (!card) return res.status(404).json({ message: 'Card not found' });
    await card.deleteOne();
    res.json({ message: 'Card deleted successfully' });
  } catch (err) {
    console.error('Error deleting virtual card:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
