// models/Sale.js
const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Seller is required'],
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
  
  purchasePrice: {
    type: Number,
    required: [true, 'Purchase price is required'],
    min: [0, 'Purchase price cannot be negative']
  },
  
  profit: {
    type: Number,
    default: 0
  },
  
  paymentMethod: {
    type: String,
    enum: ['Cash', 'bKash', 'Nagad', 'Rocket', 'Bank', 'Card', 'due'],
    default: 'Cash'
  },
  
  saleNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  
  invoiceNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  
  status: {
    type: String,
    enum: ['ordered', 'pending', 'delivered', 'cancelled', 'returned', 'completed'],
    default: 'delivered',
    index: true
  },
  
  customerName: {
    type: String,
    trim: true
  },
  
  customerPhone: {
    type: String,
    trim: true
  },
  
  customerEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
    description: 'Customer who made the purchase'
  },
  
  notes: {
    type: String,
    trim: true
  },
  
  saleDate: {
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
saleSchema.index({ saleDate: -1 });
saleSchema.index({ product: 1, saleDate: -1 });
saleSchema.index({ seller: 1, status: 1 });
saleSchema.index({ seller: 1, saleDate: -1 });
saleSchema.index({ saleNumber: 1 });
saleSchema.index({ invoiceNumber: 1 });

// Virtual for formatted total amount
saleSchema.virtual('formattedTotalAmount').get(function() {
  return `৳${this.totalAmount.toLocaleString('en-BD')}`;
});

// Virtual for formatted profit
saleSchema.virtual('formattedProfit').get(function() {
  return `৳${this.profit.toLocaleString('en-BD')}`;
});

// Virtual for formatted unit price
saleSchema.virtual('formattedUnitPrice').get(function() {
  return `৳${this.unitPrice.toLocaleString('en-BD')}`;
});

// Virtual for margin percentage
saleSchema.virtual('marginPercentage').get(function() {
  if (this.unitPrice > 0) {
    return ((this.profit / (this.quantity * this.unitPrice)) * 100).toFixed(2);
  }
  return 0;
});

// Pre-validate middleware to calculate profit and generate sale number
saleSchema.pre('validate', function(next) {
  // Calculate profit if not set
  if (this.isModified('totalAmount') || this.isModified('purchasePrice') || this.isModified('quantity')) {
    const totalCost = this.purchasePrice * this.quantity;
    this.profit = this.totalAmount - totalCost;
  }
  
  // Generate sale number if not provided
  if (!this.saleNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.saleNumber = `SALE-${year}${month}${day}-${hours}${minutes}${seconds}-${random}`;
  }
  
  // Generate invoice number if not provided
  if (!this.invoiceNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.invoiceNumber = `INV-${year}${month}${day}-${random}`;
  }
  
  next();
});

// Pre-save middleware to ensure data consistency
saleSchema.pre('save', function(next) {
  // Ensure totalAmount matches quantity * unitPrice
  const calculatedTotal = this.quantity * this.unitPrice;
  if (Math.abs(this.totalAmount - calculatedTotal) > 0.01) {
    this.totalAmount = calculatedTotal;
  }
  
  // Recalculate profit
  const totalCost = this.purchasePrice * this.quantity;
  this.profit = this.totalAmount - totalCost;
  
  next();
});

// Static method to get seller's sales summary
saleSchema.statics.getSellerSummary = async function(sellerId, startDate, endDate) {
  const matchQuery = { seller: sellerId };
  if (startDate && endDate) {
    matchQuery.saleDate = { $gte: startDate, $lte: endDate };
  }
  
  const summary = await this.aggregate([
    { $match: matchQuery },
    { $group: {
      _id: null,
      totalSales: { $sum: 1 },
      totalRevenue: { $sum: '$totalAmount' },
      totalProfit: { $sum: '$profit' },
      totalQuantity: { $sum: '$quantity' },
      averageOrderValue: { $avg: '$totalAmount' }
    }}
  ]);
  
  return summary[0] || {
    totalSales: 0,
    totalRevenue: 0,
    totalProfit: 0,
    totalQuantity: 0,
    averageOrderValue: 0
  };
};

// Static method to get daily sales for chart
saleSchema.statics.getDailySales = async function(sellerId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const sales = await this.aggregate([
    {
      $match: {
        seller: sellerId,
        saleDate: { $gte: startDate },
        status: 'delivered'
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$saleDate' } },
        totalAmount: { $sum: '$totalAmount' },
        totalProfit: { $sum: '$profit' },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  
  return sales;
};

// Static method to get top selling products
saleSchema.statics.getTopProducts = async function(sellerId, limit = 10) {
  const topProducts = await this.aggregate([
    { $match: { seller: sellerId, status: 'delivered' } },
    {
      $group: {
        _id: '$product',
        totalSold: { $sum: '$quantity' },
        totalRevenue: { $sum: '$totalAmount' },
        totalProfit: { $sum: '$profit' },
        saleCount: { $sum: 1 }
      }
    },
    { $sort: { totalSold: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'productInfo'
      }
    },
    { $unwind: { path: '$productInfo', preserveNullAndEmptyArrays: true } }
  ]);
  
  return topProducts;
};

// Method to get sale by number
saleSchema.statics.findBySaleNumber = function(saleNumber) {
  return this.findOne({ saleNumber }).populate('product seller');
};

// Method to get sales by date range
saleSchema.statics.getByDateRange = function(sellerId, startDate, endDate) {
  return this.find({
    seller: sellerId,
    saleDate: { $gte: startDate, $lte: endDate }
  }).populate('product', 'name image').sort('-saleDate');
};

// Query helper for today's sales
saleSchema.query.today = function() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  return this.where({ saleDate: { $gte: startOfDay, $lte: endOfDay } });
};

// Query helper for this week
saleSchema.query.thisWeek = function() {
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  return this.where({ saleDate: { $gte: startOfWeek } });
};

// Query helper for this month
saleSchema.query.thisMonth = function() {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  return this.where({ saleDate: { $gte: startOfMonth } });
};

module.exports = mongoose.model('Sale', saleSchema);