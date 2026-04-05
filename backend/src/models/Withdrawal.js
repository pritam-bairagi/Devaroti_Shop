const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 100
  },
  serviceCharge: {
    type: Number,
    required: true,
    default: 0
  },
  netAmount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['Bank Transfer', 'bKash', 'Nagad', 'Rocket']
  },
  accountNumber: {
    type: String,
    required: true
  },
  accountName: {
    type: String
  },
  sellerNote: {
    type: String
  },
  adminNote: {
    type: String
  },
  transactionId: {
    type: String
  },
  rejectionReason: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'completed', 'rejected'],
    default: 'pending'
  },
  approvedAt: {
    type: Date
  },
  processedAt: {
    type: Date
  },
  rejectedAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Withdrawal', withdrawalSchema);