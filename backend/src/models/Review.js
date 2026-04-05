const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true,
    index: true
  },
  
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  
  userName: {
    type: String,
    required: true
  },
  
  userProfilePic: String,
  
  rating: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 5 
  },
  
  title: {
    type: String,
    maxlength: 100
  },
  
  comment: {
    type: String,
    required: true,
    maxlength: 1000
  },
  
  pros: [String],
  cons: [String],
  
  images: [{ 
    type: String 
  }],
  
  videos: [String],
  
  // Verified purchase
  verifiedPurchase: { 
    type: Boolean, 
    default: false 
  },
  
  orderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Order' 
  },
  
  // Helpfulness
  helpful: {
    count: { type: Number, default: 0 },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  
  notHelpful: {
    count: { type: Number, default: 0 },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  
  // Admin moderation
  approved: { 
    type: Boolean, 
    default: true,
    index: true
  },
  
  reported: { 
    type: Boolean, 
    default: false 
  },
  
  reportReason: String,
  
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Admin response
  adminResponse: {
    comment: String,
    date: Date,
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // Seller response
  sellerResponse: {
    comment: String,
    date: Date
  },
  
  // Status
  isEdited: {
    type: Boolean,
    default: false
  },
  
  editHistory: [{
    rating: Number,
    comment: String,
    editedAt: Date
  }]
}, {
  timestamps: true
});

// Ensure one review per user per product
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

// Update product average rating on save/remove
reviewSchema.post('save', async function() {
  const Review = this.constructor;
  const Product = mongoose.model('Product');
  
  const stats = await Review.aggregate([
    { $match: { productId: this.productId, approved: true } },
    { $group: {
        _id: '$productId',
        averageRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 }
      }}
  ]);
  
  if (stats.length > 0) {
    await Product.findByIdAndUpdate(this.productId, {
      averageRating: Math.round(stats[0].averageRating * 10) / 10,
      reviewCount: stats[0].reviewCount
    });
  }
});

reviewSchema.post('remove', async function() {
  const Review = this.constructor;
  const Product = mongoose.model('Product');
  
  const stats = await Review.aggregate([
    { $match: { productId: this.productId, approved: true } },
    { $group: {
        _id: '$productId',
        averageRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 }
      }}
  ]);
  
  if (stats.length > 0) {
    await Product.findByIdAndUpdate(this.productId, {
      averageRating: Math.round(stats[0].averageRating * 10) / 10,
      reviewCount: stats[0].reviewCount
    });
  } else {
    await Product.findByIdAndUpdate(this.productId, {
      averageRating: 0,
      reviewCount: 0
    });
  }
});

module.exports = mongoose.model('Review', reviewSchema);