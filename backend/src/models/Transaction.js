const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionNumber: {
    type: String,
    unique: true
  },
  
  type: {
    type: String,
    enum: ['Cash In', 'Cash Out', 'Sale', 'Purchase', 'Expense', 'Withdrawal', 'Refund'],
    required: true,
    index: true
  },
  
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  
  description: {
    type: String,
    required: true
  },
  
  category: {
    type: String,
    enum: ['sales', 'purchases', 'expenses', 'withdrawals', 'others'],
    default: 'others'
  },
  
  reference: {
    type: String
  },
  
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'referenceModel'
  },
  
  referenceModel: {
    type: String,
    enum: ['Order', 'Sale', 'Purchase', 'User', null]
  },
  
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Bank', 'bkash', 'nagad', 'rocket', 'card', 'bKash', 'Nagad', 'Rocket', 'Card']
  },
  
  status: {
    type: String,
    enum: ['completed', 'pending', 'failed'],
    default: 'completed'
  },
  
  date: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // For cash box balance tracking
  runningBalance: {
    type: Number
  },
  
  attachments: [{
    type: String
  }],
  
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true
});

// Indexes
transactionSchema.index({ date: -1 });
transactionSchema.index({ type: 1, date: -1 });

// Generate transaction number BEFORE validation (pre-validate runs before required checks)
transactionSchema.pre('validate', function(next) {
  if (!this.transactionNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.transactionNumber = `TXN-${year}${month}${day}-${random}`;
  }
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);