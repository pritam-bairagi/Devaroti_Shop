const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters'],
    index: true
  },
  slug: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  shortDescription: {
    type: String,
    maxlength: [200, 'Short description cannot exceed 200 characters']
  },
  
  sellingPrice: {
    type: Number,
    required: [true, 'Selling price is required'],
    min: [0, 'Price cannot be negative']
  },
  purchasePrice: {
    type: Number,
    required: [true, 'Purchase price is required'],
    min: [0, 'Purchase price cannot be negative']
  },
  price: {
    type: Number,
    required: true
  },
  mrp: {
    type: Number,
    min: [0, 'MRP cannot be negative']
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  unit: {
    type: String,
    default: 'পিস',
    enum: ['পিস', 'কেজি', 'লিটার', 'ডজন', 'হালি', 'প্যাকেট', 'মিলিলিটার', 'পিয়ার', 'গ্রাম']
  },
  stock: {
    type: Number,
    required: true,
    default: 0,
    min: [0, 'Stock cannot be negative']
  },
  lowStockThreshold: {
    type: Number,
    default: 5
  },
  sku: {
    type: String,
    unique: true,
    sparse: true
  },
  barcode: String,
  
  image: {
    type: String,
    required: [true, 'Product image is required']
  },
  images: [String],
  video: String,
  
  category: {
    type: String,
    required: [true, 'Category is required'],
    index: true
  },
  subcategory: String,
  brand: String,
  tags: [String],
  
  liveStatus: {
    type: String,
    enum: ['live', 'issue', 'not-available', 'draft', 'archived'],
    default: 'live',
    index: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isNewArrival: {
    type: Boolean,
    default: false
  },
  isBestSeller: {
    type: Boolean,
    default: false
  },
  
  specifications: {
    type: Map,
    of: String
  },
  weight: Number,
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    unit: { type: String, default: 'cm' }
  },
  
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  
  metaTitle: String,
  metaDescription: String,
  metaKeywords: [String],
  
  soldCount: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
productSchema.index({ name: 'text', description: 'text', category: 'text' });
productSchema.index({ sellingPrice: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ soldCount: -1 });

// Create slug from name
productSchema.pre('save', function(next) {
  if (this.isModified('name') && this.name) {
    let baseSlug = this.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
      
    if (!baseSlug) baseSlug = 'product';
    
    if (this.isNew || !this.slug) {
      this.slug = `${baseSlug}-${Date.now().toString().slice(-6)}`;
    }
  }
  
  this.price = this.sellingPrice;
  
  if (this.mrp && this.mrp > 0 && this.sellingPrice < this.mrp) {
    this.discount = Math.round(((this.mrp - this.sellingPrice) / this.mrp) * 100);
  }
  
  next();
});

productSchema.virtual('inStock').get(function() {
  return this.stock > 0;
});

productSchema.virtual('profitMargin').get(function() {
  if (this.purchasePrice > 0) {
    return ((this.sellingPrice - this.purchasePrice) / this.purchasePrice) * 100;
  }
  return 0;
});

productSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'productId'
});

module.exports = mongoose.model('Product', productSchema);