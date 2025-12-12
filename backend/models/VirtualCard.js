// backend/models/VirtualCard.js
const mongoose = require('mongoose');

const virtualCardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  cardNumber: { type: String, required: true },
  cvv: { type: String, required: true },
  expiryDate: { type: String, required: true },
  cardType: { type: String, default: 'virtual', enum: ['virtual', 'physical'] },
  network: { type: String, default: 'Visa' },
  status: { type: String, default: 'Active', enum: ['Active', 'Frozen', 'Deleted', 'Ordered', 'Shipped', 'Delivered'] },
  // Physical card fields
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'USA' }
  },
  shippingStatus: { type: String, default: 'Not Ordered', enum: ['Not Ordered', 'Ordered', 'Processing', 'Shipped', 'Delivered'] },
  orderDate: Date,
  deliveryDate: Date,
  trackingNumber: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('VirtualCard', virtualCardSchema);
