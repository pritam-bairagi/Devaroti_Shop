const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  items: [{
    product:       { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name:          { type: String, required: true },
    quantity:      { type: Number, required: true, min: 1 },
    price:         { type: Number, required: true },
    purchasePrice: { type: Number, default: 0 },
    image:         String,
    variant:       { name: String },
    seller:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],

  subtotal:    { type: Number, required: true, default: 0 },
  discount:    { type: Number, default: 0 },
  vat:         { type: Number, default: 0 },
  vatAmount:   { type: Number, default: 0 },
  shippingCost:{ type: Number, default: 0 },
  totalPrice:  { type: Number, required: true },

  shippingAddress: {
    fullName:    String,
    addressLine1:String,
    addressLine2:String,
    city:        String,
    state:       String,
    postalCode:  String,
    country:     { type: String, default: 'Bangladesh' },
    phoneNumber: String
  },

  billingAddress: {
    fullName:    String,
    addressLine1:String,
    addressLine2:String,
    city:        String,
    state:       String,
    postalCode:  String,
    country:     { type: String, default: 'Bangladesh' },
    phoneNumber: String
  },

  deliveryOption: {
    type: String,
    enum: ['standard', 'express', 'same-day'],
    default: 'standard'
  },

  deliveryInstructions:  String,
  estimatedDeliveryDate: Date,
  actualDeliveryDate:    Date,

  // FIX: all payment method values used across the app are listed here
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'bkash', 'nagad', 'rocket', 'bank', 'Cash on Delivery', 'online', 'bKash', 'Nagad', 'Rocket', 'Bank', 'Cash'],
    required: true
  },

  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded', 'processing'],
    default: 'pending'
  },

  paymentDetails: {
    transactionId:   String,
    paymentDate:     Date,
    reference:       String,
    gateway:         String,
    gatewayResponse: mongoose.Schema.Types.Mixed
  },

  isPaid:  { type: Boolean, default: false },
  paidAt:  Date,

  status: {
    type: String,
    enum: ['pending','confirmed','processing','shipped','out-for-delivery','delivered','cancelled','returned','refunded'],
    default: 'pending',
    index: true
  },

  statusHistory: [{
    status:    String,
    date:      { type: Date, default: Date.now },
    note:      String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],

  trackingNumber:     String,
  courier:            String,
  orderNotes:         String,
  adminNotes:         String,
  cancellationReason: String,
  refundAmount:       Number,

  platformCommission: { type: Number, default: 0 },
  sellerEarnings:     { type: Number, default: 0 },

  sellers: [{
    sellerId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    items:         [{ productId: mongoose.Schema.Types.ObjectId, quantity: Number, price: Number }],
    subtotal:      Number,
    commission:    Number,
    sellerEarnings:Number,
    status:        String,
    isPaid:        { type: Boolean, default: false }
  }],

  invoiceUrl:    String,
  invoiceNumber: String,

  // Status timestamps
  pendingAt:        Date,
  confirmedAt:      Date,
  processingAt:     Date,
  shippedAt:        Date,
  outForDeliveryAt: Date,
  deliveredAt:      Date,
  cancelledAt:      Date,
  returnedAt:       Date,
  refundedAt:       Date,

  adminConfirmedPayment: { type: Boolean, default: false },
  adminConfirmedAt: Date,

}, {
  timestamps: true,
  toJSON:   { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ 'sellers.sellerId': 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });

// Pre-save hook
orderSchema.pre('save', async function (next) {
  // Auto-generate orderNumber
  if (!this.orderNumber) {
    const date = new Date();
    const yy = date.getFullYear().toString().slice(-2);
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const dd = date.getDate().toString().padStart(2, '0');
    const count = await mongoose.model('Order').countDocuments();
    const seq = (count + 1).toString().padStart(4, '0');
    this.orderNumber = `ORD-${yy}${mm}${dd}-${seq}`;
  }

  // FIX: Sync isPaid from paymentStatus (single source of truth)
  if (this.isModified('paymentStatus')) {
    this.isPaid = this.paymentStatus === 'paid';
    if (this.isPaid && !this.paidAt) this.paidAt = new Date();
  }

  // Set timestamp for current status change
  if (this.isModified('status')) {
    const fieldMap = {
      'pending':          'pendingAt',
      'confirmed':        'confirmedAt',
      'processing':       'processingAt',
      'shipped':          'shippedAt',
      'out-for-delivery': 'outForDeliveryAt',
      'delivered':        'deliveredAt',
      'cancelled':        'cancelledAt',
      'returned':         'returnedAt',
      'refunded':         'refundedAt'
    };
    const field = fieldMap[this.status];
    if (field && !this[field]) this[field] = new Date();
  }

  next();
});

// Virtual summary
orderSchema.virtual('summary').get(function () {
  return {
    orderNumber: this.orderNumber,
    totalItems:  this.items.reduce((acc, item) => acc + item.quantity, 0),
    subtotal:    this.subtotal,
    totalPrice:  this.totalPrice,
    status:      this.status,
    paymentStatus: this.paymentStatus,
    isPaid:      this.isPaid
  };
});

module.exports = mongoose.model('Order', orderSchema);