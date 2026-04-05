// models/Purchase.js
const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Seller is required'],
    index: true
  },
  
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
    index: true
  },
  
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product is required'],
    index: true
  },
  
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  
  unitPrice: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0, 'Unit price cannot be negative']
  },
  
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative']
  },
  
  purchaseNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  
  invoiceNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  
  supplier: {
    name: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    address: {
      type: String,
      trim: true
    }
  },
  
  supplierName: {
    type: String,
    trim: true
  },
  
  supplierPhone: {
    type: String,
    trim: true
  },
  
  paymentStatus: {
    type: String,
    enum: ['paid', 'partial', 'pending'],
    default: 'pending'
  },
  
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  dueAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Bank', 'bKash', 'Nagad', 'Rocket', 'Card', 'bkash', 'nagad', 'rocket'],
    default: 'Cash'
  },
  
  description: {
    type: String,
    trim: true
  },
  
  notes: {
    type: String,
    trim: true
  },
  
  status: {
    type: String,
    enum: ['ordered', 'received', 'cancelled', 'returned', 'completed'],
    default: 'received'
  },
  
  purchaseDate: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
purchaseSchema.index({ purchaseDate: -1 });
purchaseSchema.index({ product: 1, purchaseDate: -1 });
purchaseSchema.index({ seller: 1, purchaseDate: -1 });
purchaseSchema.index({ seller: 1, paymentStatus: 1 });
purchaseSchema.index({ purchaseNumber: 1 });
purchaseSchema.index({ invoiceNumber: 1 });
purchaseSchema.index({ supplierName: 1 });

// Virtual for formatted total amount
purchaseSchema.virtual('formattedTotalAmount').get(function() {
  return `৳${this.totalAmount.toLocaleString('en-BD')}`;
});

// Virtual for formatted unit price
purchaseSchema.virtual('formattedUnitPrice').get(function() {
  return `৳${this.unitPrice.toLocaleString('en-BD')}`;
});

// Virtual for formatted paid amount
purchaseSchema.virtual('formattedPaidAmount').get(function() {
  return `৳${this.paidAmount.toLocaleString('en-BD')}`;
});

// Virtual for formatted due amount
purchaseSchema.virtual('formattedDueAmount').get(function() {
  return `৳${this.dueAmount.toLocaleString('en-BD')}`;
});

// Virtual for payment percentage
purchaseSchema.virtual('paymentPercentage').get(function() {
  if (this.totalAmount > 0) {
    return ((this.paidAmount / this.totalAmount) * 100).toFixed(2);
  }
  return 0;
});

// Pre-validate middleware to generate purchase number and calculate due amount
purchaseSchema.pre('validate', function(next) {
  // Generate purchase number if not provided
  if (!this.purchaseNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.purchaseNumber = `PUR-${year}${month}${day}-${hours}${minutes}${seconds}-${random}`;
  }
  
  // Generate invoice number if not provided
  if (!this.invoiceNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.invoiceNumber = `PO-${year}${month}${day}-${random}`;
  }
  
  // Calculate due amount
  this.dueAmount = Math.max(0, this.totalAmount - this.paidAmount);
  
  // Update payment status based on paid amount
  if (this.paidAmount >= this.totalAmount && this.totalAmount > 0) {
    this.paymentStatus = 'paid';
  } else if (this.paidAmount > 0 && this.paidAmount < this.totalAmount) {
    this.paymentStatus = 'partial';
  } else {
    this.paymentStatus = 'pending';
  }
  
  // Ensure total amount matches quantity * unit price
  const calculatedTotal = this.quantity * this.unitPrice;
  if (Math.abs(this.totalAmount - calculatedTotal) > 0.01) {
    this.totalAmount = calculatedTotal;
  }
  
  // Sync supplier fields
  if (this.supplierName && (!this.supplier || !this.supplier.name)) {
    if (!this.supplier) this.supplier = {};
    this.supplier.name = this.supplierName;
  }
  
  if (this.supplierPhone && (!this.supplier || !this.supplier.phone)) {
    if (!this.supplier) this.supplier = {};
    this.supplier.phone = this.supplierPhone;
  }
  
  next();
});

// Pre-save middleware to ensure data consistency
purchaseSchema.pre('save', function(next) {
  // Recalculate due amount
  this.dueAmount = Math.max(0, this.totalAmount - this.paidAmount);
  
  // Update payment status
  if (this.paidAmount >= this.totalAmount && this.totalAmount > 0) {
    this.paymentStatus = 'paid';
  } else if (this.paidAmount > 0 && this.paidAmount < this.totalAmount) {
    this.paymentStatus = 'partial';
  } else {
    this.paymentStatus = 'pending';
  }
  
  next();
});

// Static method to get seller's purchase summary
purchaseSchema.statics.getSellerSummary = async function(sellerId, startDate, endDate) {
  const matchQuery = { seller: sellerId };
  if (startDate && endDate) {
    matchQuery.purchaseDate = { $gte: startDate, $lte: endDate };
  }
  
  const summary = await this.aggregate([
    { $match: matchQuery },
    { $group: {
      _id: null,
      totalPurchases: { $sum: 1 },
      totalSpent: { $sum: '$totalAmount' },
      totalPaid: { $sum: '$paidAmount' },
      totalDue: { $sum: '$dueAmount' },
      totalQuantity: { $sum: '$quantity' },
      averagePurchaseValue: { $avg: '$totalAmount' }
    }}
  ]);
  
  return summary[0] || {
    totalPurchases: 0,
    totalSpent: 0,
    totalPaid: 0,
    totalDue: 0,
    totalQuantity: 0,
    averagePurchaseValue: 0
  };
};

// Static method to get purchases by payment status
purchaseSchema.statics.getByPaymentStatus = async function(sellerId, paymentStatus) {
  return this.find({ seller: sellerId, paymentStatus })
    .populate('product', 'name image')
    .sort('-purchaseDate');
};

// Static method to get due purchases
purchaseSchema.statics.getDuePurchases = async function(sellerId) {
  return this.find({ 
    seller: sellerId, 
    dueAmount: { $gt: 0 },
    paymentStatus: { $in: ['pending', 'partial'] }
  }).populate('product', 'name image').sort('-purchaseDate');
};

// Static method to get monthly purchase summary
purchaseSchema.statics.getMonthlySummary = async function(sellerId, months = 12) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  
  const summary = await this.aggregate([
    {
      $match: {
        seller: sellerId,
        purchaseDate: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$purchaseDate' } },
        totalAmount: { $sum: '$totalAmount' },
        paidAmount: { $sum: '$paidAmount' },
        dueAmount: { $sum: '$dueAmount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  
  return summary;
};

// Method to record payment
purchaseSchema.methods.recordPayment = async function(amount, paymentMethod, notes) {
  this.paidAmount += amount;
  this.dueAmount = this.totalAmount - this.paidAmount;
  
  if (this.paidAmount >= this.totalAmount) {
    this.paymentStatus = 'paid';
  } else if (this.paidAmount > 0) {
    this.paymentStatus = 'partial';
  }
  
  if (paymentMethod) this.paymentMethod = paymentMethod;
  if (notes) this.notes = notes;
  
  await this.save();
  return this;
};

// Method to add stock from purchase
purchaseSchema.methods.addToStock = async function() {
  const Product = mongoose.model('Product');
  const product = await Product.findById(this.product);
  
  if (product) {
    product.stock += this.quantity;
    await product.save();
  }
  
  return product;
};

// Query helper for pending payments
purchaseSchema.query.pending = function() {
  return this.where({ paymentStatus: { $in: ['pending', 'partial'] } });
};

// Query helper for paid purchases
purchaseSchema.query.paid = function() {
  return this.where({ paymentStatus: 'paid' });
};

// Query helper for this month
purchaseSchema.query.thisMonth = function() {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  return this.where({ purchaseDate: { $gte: startOfMonth } });
};

// Query helper for date range
purchaseSchema.query.dateRange = function(startDate, endDate) {
  return this.where({
    purchaseDate: {
      $gte: startDate,
      $lte: endDate
    }
  });
};

// Find by purchase number
purchaseSchema.statics.findByPurchaseNumber = function(purchaseNumber) {
  return this.findOne({ purchaseNumber }).populate('product seller');
};

module.exports = mongoose.model('Purchase', purchaseSchema);