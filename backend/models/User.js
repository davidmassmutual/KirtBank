// backend/models/User.js
const mongoose = require('mongoose');

const notificationSubSchema = new mongoose.Schema({
  message: { type: String, required: true },
  type: { type: String }, // Optional, e.g., 'deposit', 'loan'
  date: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  isAdmin: { type: Boolean, default: false },
  twoFactorEnabled: { type: Boolean, default: false },
  currency: { type: String, default: 'USD' },
  theme: { type: String, default: 'light' },
  profileImage: { type: String, default: '' },
  investments: [{
  plan: { type: String, required: true },
  amount: { type: Number, required: true },
  rate: { type: Number, required: true },
  startDate: { type: Date, default: Date.now },
  maturityDate: { type: Date, required: true },
  status: { type: String, default: 'Active' },
  expectedReturn: { type: Number, required: true }
}],
  notificationsSettings: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    push: { type: Boolean, default: true },
  },
  balance: {
    checking: { type: Number, default: 0 },
    savings: { type: Number, default: 0 },
    usdt: { type: Number, default: 0 },
  },
  
  createdAt: { type: Date, default: Date.now },

  // Added fields
  notifications: [notificationSubSchema],
  loanOffer: { type: Number, default: 0 },
  hasGeneratedOffer: { type: Boolean, default: false },
  hasSubmittedIdSsn: { type: Boolean, default: false },
  hasReceivedLoan: { type: Boolean, default: false },
  currentLoanAmount: { type: Number, default: 0 },
  loanStartDate: { type: Date },
  loanRepaymentDate: { type: Date },
  idDocument: { type: String, default: '' },
  ssn: { type: String, default: '' }, // Will be stored encrypted

  // Admin notifications
  adminNotifications: [{
    message: String,
    date: { type: Date, default: Date.now },
    read: { type: Boolean, default: false },
  }],
});

module.exports = mongoose.model('User', userSchema);
