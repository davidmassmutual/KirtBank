// backend/routes/loans.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const verifyToken = require('../middleware/auth');
const upload = require('../middleware/upload');
const crypto = require('crypto');

// GET: Fetch current loan offer + balance + ID/SSN status + loan details
router.get('/', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('loanOffer hasGeneratedOffer hasSubmittedIdSsn hasReceivedLoan balance currentLoanAmount loanStartDate loanRepaymentDate');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      loanOffer: user.loanOffer,
      hasGeneratedOffer: user.hasGeneratedOffer,
      hasSubmittedIdSsn: user.hasSubmittedIdSsn,
      hasReceivedLoan: user.hasReceivedLoan,
      currentLoanAmount: user.currentLoanAmount,
      loanStartDate: user.loanStartDate,
      loanRepaymentDate: user.loanRepaymentDate,
      balance: user.balance,
    });
  } catch (err) {
    console.error('Fetch loan data error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST: Generate or accept loan offer
router.post('/apply', verifyToken, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount < 2000 || amount > 15000) {
      return res.status(400).json({ message: 'Loan amount must be between $2,000 and $15,000' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Check if user has already received a loan
    if (user.hasReceivedLoan) {
      return res.status(400).json({ message: 'You have already received a loan. Only one loan per user is allowed.' });
    }

    // If user already has an offer and is trying to accept it
    if (user.loanOffer && amount === user.loanOffer) {
      const totalBalance = user.balance.checking + user.balance.savings + user.balance.usdt;
      if (totalBalance < 200) {
        user.notifications.push({
          message: 'Loan acceptance failed due to balance less than $200',
          date: new Date(),
        });
        await user.save();
        return res.json({
          message: 'Loan acceptance failed due to insufficient balance. Please contact customer care at support@kirtbank.com or 1-800-KIRT-BANK for more information.',
        });
      }

      // Loan accepted — add to balance, create transaction, reset offer, add notification
      const startDate = new Date();
      const repaymentDate = new Date();
      repaymentDate.setMonth(repaymentDate.getMonth() + 36); // 36 months repayment

      user.balance.checking += amount;
      user.currentLoanAmount = amount;
      user.loanStartDate = startDate;
      user.loanRepaymentDate = repaymentDate;

      const loanTx = new Transaction({
        userId: user._id,
        type: 'loan',
        amount,
        method: 'bank_loan',
        status: 'Posted',
        account: 'checking',
        date: new Date(),
      });
      await loanTx.save();
      user.loanOffer = 0;
      user.hasReceivedLoan = true; // Mark that user has received a loan
      user.notifications.push({
        message: `Interest-free loan of $${amount} accepted and added to your checking account. Repayment due: ${repaymentDate.toLocaleDateString()}`,
        date: new Date(),
      });
      await user.save();

      return res.json({ message: 'Loan accepted successfully!', amount });
    }

    // Generate new offer only if user hasn't generated one before
    if (!user.hasGeneratedOffer) {
      user.loanOffer = amount;
      user.hasGeneratedOffer = true;
      user.notifications.push({
        message: `New loan offer: $${amount} pre-approved`,
        date: new Date(),
      });
      await user.save();
      return res.json({ message: 'Loan offer generated', amount });
    }

    // User has already generated an offer, can't generate new ones
    return res.status(400).json({
      message: 'You have already generated a loan offer. Submit ID & SSN to increase it, or accept your current offer.',
      amount: user.loanOffer
    });
  } catch (err) {
    console.error('Loan apply error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST: Increase offer by submitting ID & SSN
router.post('/update-offer', verifyToken, upload.single('idDocument'), async (req, res) => {
  try {
    const { ssn } = req.body;
    if (!ssn || !req.file) {
      return res.status(400).json({ message: 'SSN and ID document are required' });
    }

    // Basic SSN format check
    if (!/^\d{3}-\d{2}-\d{4}$/.test(ssn)) {
      return res.status(400).json({ message: 'Invalid SSN format. Use XXX-XX-XXXX' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Encrypt SSN using proper AES-256-CBC with IV
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32); // Derive 32-byte key
    const iv = crypto.randomBytes(16); // Generate random 16-byte IV

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encryptedSsn = cipher.update(ssn, 'utf8', 'hex');
    encryptedSsn += cipher.final('hex');

    // Store IV with encrypted data (needed for decryption)
    const encryptedWithIv = iv.toString('hex') + ':' + encryptedSsn;

    // Increase current offer by 25% or minimum $2000 increase, whichever is greater
    const increaseAmount = Math.max(2000, Math.floor(user.loanOffer * 0.25));
    const newAmount = Math.min(user.loanOffer + increaseAmount, 15000); // Cap at $15,000

    user.loanOffer = newAmount;
    user.hasSubmittedIdSsn = true;
    user.idDocument = req.file.path;
    user.ssn = encryptedWithIv;

    user.notifications.push({
      message: `Loan offer increased to $${newAmount} after ID verification`,
      date: new Date(),
    });

    await user.save();

    res.json({ message: 'Loan offer increased!', amount: newAmount });
  } catch (err) {
    console.error('Update offer error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST: Admin - Get user documents and decrypted SSN
router.get('/admin/user/:userId', verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const user = await User.findById(req.params.userId).select('name email idDocument ssn hasSubmittedIdSsn hasReceivedLoan');
    if (!user) return res.status(404).json({ message: 'User not found' });

    let decryptedSsn = null;
    if (user.ssn && user.ssn.includes(':')) {
      // Decrypt SSN for admin viewing
      const [ivHex, encryptedData] = user.ssn.split(':');
      const algorithm = 'aes-256-cbc';
      const key = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32);
      const iv = Buffer.from(ivHex, 'hex');

      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      decryptedSsn = decrypted;
    }

    res.json({
      userId: user._id,
      name: user.name,
      email: user.email,
      idDocument: user.idDocument,
      ssn: decryptedSsn,
      hasSubmittedIdSsn: user.hasSubmittedIdSsn,
      hasReceivedLoan: user.hasReceivedLoan,
    });
  } catch (err) {
    console.error('Admin get user documents error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
