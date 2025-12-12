// backend/models/Transaction.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  amount: { type: Number, required: true },
  method: { type: String, required: true },
  status: { type: String, default: 'Posted' },
  account: { type: String, default: 'checking' }, // Added to support checking, savings, usdt
  date: { type: Date, default: Date.now },
  receipt: { type: String, default: null }
});

module.exports = mongoose.model('Transaction', transactionSchema);