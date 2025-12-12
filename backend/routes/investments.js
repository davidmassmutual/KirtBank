// backend/routes/investments.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const verifyToken = require('../middleware/auth');

// === INVESTMENT PLANS ===
const PLANS = {
  starter: { 
    name: 'Starter', 
    min: 100, 
    max: 5000, 
    rate: 0.12, // 12%
    term: '3-6 months' 
  },
  growth: { 
    name: 'Growth', 
    min: 5001, 
    max: 25000, 
    rate: 0.18, // 18%
    term: '6-12 months' 
  },
  elite: { 
    name: 'Elite', 
    min: 25001, 
    max: 100000, 
    rate: 0.28, // 28%
    term: '12-24 months' 
  }
};

// backend/routes/investments.js (LINE 26 – FIXED)
router.get('/plans', (req, res) => {
  try {
    const plans = Object.values(PLANS);
    console.log('Returning plans:', plans);
    res.json(plans); // ← ARRAY
  } catch (err) {
    console.error('Get plans error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


// === POST: Invest ===
router.post('/invest', verifyToken, async (req, res) => {
  const { plan: planKey, amount } = req.body;

  // Validate plan
  if (!planKey || !PLANS[planKey]) {
    return res.status(400).json({ message: 'Invalid investment plan' });
  }

  const plan = PLANS[planKey];
  const amountNum = Number(amount);

  // Validate amount
  if (!amountNum || amountNum < plan.min || amountNum > plan.max) {
    return res.status(400).json({
      message: `Amount must be between $${plan.min.toLocaleString()} and $${plan.max.toLocaleString()}`
    });
  }

  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Calculate total liquid balance
    const totalBalance = user.balance.checking + user.balance.savings + user.balance.usdt;
    if (totalBalance < amountNum) {
      return res.status(400).json({
        message: 'Insufficient balance',
        needsDeposit: true,
        required: amountNum - totalBalance
      });
    }

    // Deduct from checking (priority)
    let remaining = amountNum;
    if (user.balance.checking >= remaining) {
      user.balance.checking -= remaining;
      remaining = 0;
    } else {
      remaining -= user.balance.checking;
      user.balance.checking = 0;
    }

    // Then savings
    if (remaining > 0 && user.balance.savings >= remaining) {
      user.balance.savings -= remaining;
      remaining = 0;
    } else if (remaining > 0) {
      remaining -= user.balance.savings;
      user.balance.savings = 0;
    }

    // Then USDT
    if (remaining > 0) {
      user.balance.usdt -= remaining;
    }

    // Initialize investments array
    user.investments = user.investments || [];

    // Generate maturity date (random within term)
    const minMonths = plan.term.includes('3') ? 3 : plan.term.includes('6') ? 6 : 12;
    const maxMonths = plan.term.includes('6') ? 6 : plan.term.includes('12') ? 12 : 24;
    const termMonths = Math.floor(Math.random() * (maxMonths - minMonths + 1)) + minMonths;
    const maturityDate = new Date();
    maturityDate.setMonth(maturityDate.getMonth() + termMonths);

    // Create investment record
    const investment = {
      plan: planKey,
      amount: amountNum,
      rate: plan.rate,
      startDate: new Date(),
      maturityDate,
      status: 'Active',
      expectedReturn: amountNum * (1 + plan.rate)
    };

    user.investments.push(investment);

    // Create transaction
    const transaction = new Transaction({
      userId: user._id,
      type: 'investment',
      amount: amountNum,
      method: 'balance',
      status: 'Completed',
      account: 'checking',
      date: new Date(),
    });

    // Save transaction
    await transaction.save();

    // Add notification
    user.notifications.push({
      message: `Investment of $${amountNum.toLocaleString()} in ${plan.name} Plan confirmed. Expected return: $${(amountNum * plan.rate).toFixed(2)}`,
      type: 'investment',
      date: new Date(),
    });

    // Save user
    await user.save();

    // Return success
    res.json({
      message: 'Investment successful!',
      investment: user.investments[user.investments.length - 1],
      totalInvested: user.investments.reduce((sum, inv) => sum + inv.amount, 0),
      balance: user.balance
    });

  } catch (err) {
    console.error('Investment error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// === GET: User Investments (Optional - if you want separate endpoint) ===
router.get('/my', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('investments');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const investments = user.investments || [];
    const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);

    res.json({
      investments,
      totalInvested,
      count: investments.length
    });
  } catch (err) {
    console.error('Get my investments error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
