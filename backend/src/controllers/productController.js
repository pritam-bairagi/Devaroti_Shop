const Product = require('../models/Product');
const { validationResult } = require('express-validator');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
  try {
    const {
      search, category, minPrice, maxPrice, sort,
      page = 1, limit = 20, inStock, brand, rating, seller
    } = req.query;

    let query = { liveStatus: 'live' };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    if (category) {
      const categories = typeof category === 'string' ? category.split(',') : category;
      query.category = { $in: categories };
    }

    if (minPrice || maxPrice) {
      query.sellingPrice = {};
      if (minPrice) query.sellingPrice.$gte = parseFloat(minPrice);
      if (maxPrice) query.sellingPrice.$lte = parseFloat(maxPrice);
    }

    if (inStock === 'true') query.stock = { $gt: 0 };

    if (brand) {
      const brands = typeof brand === 'string' ? brand.split(',') : brand;
      query.brand = { $in: brands };
    }

    if (rating) query.averageRating = { $gte: parseFloat(rating) };
    if (seller) query.user = seller;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let sortOption = { createdAt: -1 };
    if (sort) {
      const sortMap = {
        'price-asc': { sellingPrice: 1 },
        'price-desc': { sellingPrice: -1 },
        'rating': { averageRating: -1 },
        'newest': { createdAt: -1 },
        'bestselling': { soldCount: -1 },
        'discount': { discount: -1 }
      };
      sortOption = sortMap[sort] || { createdAt: -1 };
    }

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('user', 'name shopName profilePic')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum),
      Product.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      products,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch products: ' + error.message });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('user', 'name shopName profilePic shopLocation phoneNumber')
      .populate({
        path: 'reviews',
        match: { approved: true },
        populate: { path: 'userId', select: 'name profilePic' },
        options: { sort: { createdAt: -1 }, limit: 10 }
      });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // FIX: Use findByIdAndUpdate to avoid triggering full model validation on view increment
    await Product.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    const relatedProducts = await Product.find({
      _id: { $ne: product._id },
      category: product.category,
      liveStatus: 'live'
    }).limit(8).populate('user', 'name shopName');

    res.status(200).json({ success: true, product, relatedProducts });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch product: ' + error.message });
  }
};

// @desc    Create product
// @route   POST /api/products
// @access  Private (Admin/Seller)
exports.createProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
      name, description, sellingPrice, purchasePrice, unit, category,
      image, stock, images, mrp, brand, shortDescription, sku, barcode, tags
    } = req.body;

    // Check SKU uniqueness
    if (sku && sku.trim() !== '') {
      const existingProduct = await Product.findOne({ sku });
      if (existingProduct) {
        return res.status(400).json({ success: false, message: 'Product with this SKU already exists' });
      }
    }

    const productData = {
      name: String(name).trim(),
      description: String(description).trim(),
      sellingPrice: Number(sellingPrice),
      purchasePrice: Number(purchasePrice),
      price: Number(sellingPrice), // keep alias in sync
      unit: unit || 'পিস',
      category: String(category).trim(),
      stock: Number(stock) || 0,
      image: String(image).trim(),
      images: (Array.isArray(images) && images.length > 0)
        ? images.map(img => String(img).trim())
        : [String(image).trim()],
      user: req.user.id,
      liveStatus: 'live'
    };

    if (shortDescription) productData.shortDescription = String(shortDescription).trim();
    if (mrp) productData.mrp = Number(mrp);
    if (brand) productData.brand = String(brand).trim();
    if (sku && sku.trim()) productData.sku = String(sku).trim();
    if (barcode) productData.barcode = String(barcode).trim();
    if (tags) {
      productData.tags = Array.isArray(tags)
        ? tags.map(tag => String(tag).trim())
        : [String(tags).trim()];
    }

    const product = await Product.create(productData);

    res.status(201).json({ success: true, message: 'Product created successfully', product });
  } catch (error) {
    console.error('Create product error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(v => v.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate key error. Please check SKU or other unique fields.'
      });
    }
    res.status(500).json({ success: false, message: error.message || 'Failed to create product' });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private
exports.updateProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this product' });
    }

    if (req.body.sku && req.body.sku !== product.sku) {
      const existingProduct = await Product.findOne({ sku: req.body.sku, _id: { $ne: product._id } });
      if (existingProduct) {
        return res.status(400).json({ success: false, message: 'Product with this SKU already exists' });
      }
    }

    const updateFields = [
      'name', 'description', 'shortDescription', 'sellingPrice', 'purchasePrice',
      'mrp', 'unit', 'category', 'brand', 'image', 'images', 'stock',
      'sku', 'barcode', 'specifications', 'tags', 'liveStatus', 'isFeatured',
      'isNewArrival', 'lowStockThreshold'
    ];

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) product[field] = req.body[field];
    });

    // Keep price alias in sync
    if (req.body.sellingPrice) product.price = req.body.sellingPrice;

    await product.save();

    res.status(200).json({ success: true, message: 'Product updated successfully', product });
  } catch (error) {
    console.error('Update product error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(v => v.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: error.message || 'Failed to update product' });
  }
};

// @desc    Delete product (soft)
// @route   DELETE /api/products/:id
// @access  Private
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this product' });
    }

    product.liveStatus = 'archived';
    await product.save();

    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete product: ' + error.message });
  }
};

// @desc    Get seller products
// @route   GET /api/products/seller
// @access  Private (Seller)
exports.getSellerProducts = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    let query = { user: req.user.id };
    if (status) query.liveStatus = status;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const [products, total] = await Promise.all([
      Product.find(query).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
      Product.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      products,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
    });
  } catch (error) {
    console.error('Get seller products error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch products: ' + error.message });
  }
};

// @desc    Get product categories
// @route   GET /api/products/categories/all
// @access  Public
exports.getCategories = async (req, res) => {
  try {
    const categories = await Product.aggregate([
      { $match: { liveStatus: 'live' } },
      { $group: { _id: '$category', count: { $sum: 1 }, image: { $first: '$image' } } },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({ success: true, categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch categories: ' + error.message });
  }
};

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
exports.getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({ liveStatus: 'live', isFeatured: true })
      .limit(12)
      .populate('user', 'name shopName');

    res.status(200).json({ success: true, products });
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch featured products: ' + error.message });
  }
};

// @desc    Update product stock
// @route   PUT /api/products/:id/stock
// @access  Private (Admin/Seller)
exports.updateStock = async (req, res) => {
  try {
    const { quantity, operation } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    let newStock;
    switch (operation) {
      case 'add':
        newStock = product.stock + Number(quantity);
        break;
      case 'subtract':
        newStock = product.stock - Number(quantity);
        if (newStock < 0) {
          return res.status(400).json({ success: false, message: 'Insufficient stock' });
        }
        break;
      case 'set':
        newStock = Number(quantity);
        if (newStock < 0) {
          return res.status(400).json({ success: false, message: 'Stock cannot be negative' });
        }
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid operation. Use add, subtract, or set.' });
    }

    product.stock = newStock;
    await product.save();

    res.status(200).json({ success: true, message: 'Stock updated successfully', stock: product.stock });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({ success: false, message: 'Failed to update stock: ' + error.message });
  }
};

// @desc    Bulk import products
// @route   POST /api/products/bulk
// @access  Private (Admin)
exports.bulkImport = async (req, res) => {
  try {
    const { products } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ success: false, message: 'Products array is required' });
    }

    const createdProducts = [];
    const errors = [];

    for (const productData of products) {
      try {
        const product = await Product.create({
          ...productData,
          user: req.user.id,
          price: productData.sellingPrice // keep alias in sync
        });
        createdProducts.push(product);
      } catch (err) {
        errors.push({ product: productData.name, error: err.message });
      }
    }

    res.status(201).json({
      success: true,
      message: `Imported ${createdProducts.length} products`,
      createdProducts,
      errors
    });
  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({ success: false, message: 'Failed to import products: ' + error.message });
  }
};