const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Transaction = require('../models/Transaction');
const { getDashboardStats } = require('../utils/analytics');
const { syncSellerBalance } = require('../utils/balanceUtils');

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
const getStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const [
      totalUsers, totalProducts, totalOrders,
      totalSales, totalRevenue, recentOrders,
      recentUsers, lowStockProducts, pendingOrders,
      topProducts, topSellers, dailyStats,
      activeUsers, stockStats, ordersByStatus
    ] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      Product.countDocuments({ liveStatus: { $ne: 'archived' } }),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { status: 'delivered', createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ]),
      Order.aggregate([
        { $match: { status: 'delivered', createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: '$platformCommission' } } }
      ]),
      Order.find().populate('user', 'name email').sort({ createdAt: -1 }).limit(10),
      User.find({ role: { $ne: 'admin' } }).select('-password').sort({ createdAt: -1 }).limit(10),
      Product.find({
        $expr: { $lte: ['$stock', '$lowStockThreshold'] },
        liveStatus: { $ne: 'archived' }
      }).populate('user', 'name shopName').limit(20),
      Order.countDocuments({ status: 'pending' }),
      Order.aggregate([
        { $unwind: '$items' },
        { $group: { _id: '$items.product', totalSold: { $sum: '$items.quantity' }, totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
        { $sort: { totalSold: -1 } }, { $limit: 10 },
        { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
        { $unwind: '$product' }
      ]),
      Order.aggregate([
        { $unwind: '$sellers' },
        { $group: { _id: '$sellers.sellerId', totalSales: { $sum: '$sellers.subtotal' }, orderCount: { $sum: 1 } } },
        { $sort: { totalSales: -1 } }, { $limit: 10 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'seller' } },
        { $unwind: '$seller' }
      ]),
      getDashboardStats(start, end),
      User.countDocuments({ role: { $ne: 'admin' }, isActive: true }),
      Product.aggregate([
        { $match: { liveStatus: { $ne: 'archived' } } },
        { $group: { _id: null, total: { $sum: { $multiply: ['$purchasePrice', '$stock'] } }, count: { $sum: '$stock' } } }
      ]),
      Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
    ]);

    const totalSalesAmount = totalSales[0]?.total || 0;
    const totalRevenueAmount = totalRevenue[0]?.total || 0;
    const totalStockValue = stockStats[0]?.total || 0;

    const monthlySales = await Order.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }, status: 'delivered' } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, total: { $sum: '$totalPrice' }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const categoryStats = await Product.aggregate([
      { $match: { liveStatus: { $ne: 'archived' } } },
      { $group: { _id: '$category', count: { $sum: 1 }, totalStock: { $sum: '$stock' } } },
      { $sort: { count: -1 } }
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers, activeUsers, totalProducts, totalOrders,
        totalSales: totalSalesAmount, totalRevenue: totalRevenueAmount,
        totalStockValue, pendingOrders, ordersByStatus,
        recentOrders, recentUsers, lowStockProducts,
        topProducts, topSellers, dailyStats, monthlySales, categoryStats
      }
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch stats: ' + error.message });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search, isActive } = req.query;

    let query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password -otp -otpExpire -resetPasswordToken')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      User.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true, users,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch users: ' + error.message });
  }
};

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
  try {
    const { role, isActive, isSellerApproved } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // FIX: prevent demoting/promoting the requesting admin themselves accidentally
    if (req.params.id === req.user.id && role && role !== 'admin') {
      return res.status(400).json({ success: false, message: 'You cannot change your own role' });
    }

    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    if (isSellerApproved !== undefined) user.isSellerApproved = isSellerApproved;

    await user.save();
    return res.status(200).json({ success: true, message: 'User updated', user });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update user: ' + error.message });
  }
};

// @desc    Get user details (admin)
// @route   GET /api/admin/users/:id
// @access  Private/Admin
const getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password -otp -otpExpire -resetPasswordToken");
    
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const orders = await Order.find({ user: user._id })
      .sort({ createdAt: -1 })
      .populate("items.product", "name image sellingPrice");

    return res.status(200).json({ success: true, user, orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch user details: " + error.message });
  }
};

// @desc    Delete user (soft)
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    // FIX: prevent admin from deleting themselves
    if (req.params.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.isActive = false;
    user.deactivatedAt = new Date();
    await user.save();

    return res.status(200).json({ success: true, message: 'User deactivated' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete user: ' + error.message });
  }
};

// @desc    Approve seller
// @route   PUT /api/admin/approve-seller/:id
// @access  Private/Admin
const approveSeller = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role !== 'seller') return res.status(400).json({ success: false, message: 'User is not a seller' });

    user.isSellerApproved = req.body.approved !== false;
    await user.save();

    return res.status(200).json({
      success: true,
      message: user.isSellerApproved ? 'Seller approved' : 'Seller rejected',
      user
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update seller: ' + error.message });
  }
};

// @desc    Get all orders (admin)
// @route   GET /api/admin/orders
// @access  Private/Admin
const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, paymentStatus, startDate, endDate, search } = req.query;

    let query = {};
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    if (search) query.orderNumber = { $regex: search, $options: 'i' };

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('user', 'name email phoneNumber')
        .populate({
          path: 'items.product',
          select: 'name image brand user',
          populate: { path: 'user', select: 'name shopName' }
        })
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Order.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true, orders,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch orders: ' + error.message });
  }
};

// @desc    Update order (admin)
// @route   PUT /api/admin/orders/:id
// @access  Private/Admin
const updateOrder = async (req, res) => {
  try {
    const { status, paymentStatus, trackingNumber, courier, adminNotes, note } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (status) order.status = status;
    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
      if (paymentStatus === 'paid') { order.isPaid = true; order.paidAt = new Date(); }
    }
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (courier) order.courier = courier;
    if (adminNotes) order.adminNotes = adminNotes;

    order.statusHistory.push({
      status: status || order.status,
      date: new Date(),
      note: note || 'Updated by admin',
      updatedBy: req.user.id
    });

    await order.save();

    // Trigger balance sync for all sellers in the order if delivered
    if (status === 'delivered') {
      try {
        await Promise.all(order.sellers.map(s => syncSellerBalance(s.sellerId)));
      } catch (err) {
        console.error('Balance sync error in updateOrder:', err);
      }
    }

    return res.status(200).json({ success: true, message: 'Order updated', order });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update order: ' + error.message });
  }
};

// @desc    Get all products (admin)
// @route   GET /api/admin/products
// @access  Private/Admin
const getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, liveStatus, search } = req.query;

    let query = {};
    if (category) query.category = category;
    if (liveStatus) query.liveStatus = liveStatus;
    // FIX: use regex instead of $text to avoid needing a text index
    if (search) query.name = { $regex: search, $options: 'i' };

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('user', 'name shopName email')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Product.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true, products,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch products: ' + error.message });
  }
};

// @desc    Create product (admin)
// @route   POST /api/admin/products
// @access  Private/Admin
const createProduct = async (req, res) => {
  try {
    const productData = { 
      ...req.body, 
      user: req.user.id,
      liveStatus: req.body.liveStatus || 'live'
    };
    
    // Ensure all required numeric fields are present
    if (productData.sellingPrice && !productData.price) {
      productData.price = productData.sellingPrice;
    }

    const product = await Product.create(productData);
    return res.status(201).json({ success: true, product });
  } catch (error) {
    console.error('Admin create product error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(v => v.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    return res.status(500).json({ success: false, message: error.message || 'Failed to create product' });
  }
};

// @desc    Update product (admin)
// @route   PUT /api/admin/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    if (req.body.sellingPrice) req.body.price = req.body.sellingPrice;
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    return res.status(200).json({ success: true, product: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to update product' });
  }
};

// @desc    Delete product (admin) - hard delete
// @route   DELETE /api/admin/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    await Product.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: 'Product deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete product: ' + error.message });
  }
};

// @desc    Get transactions
// @route   GET /api/admin/transactions
// @access  Private/Admin
const getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, startDate, endDate } = req.query;

    let query = {};
    if (type) query.type = type;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const [transactions, total, summary] = await Promise.all([
      Transaction.find(query)
        .populate('user', 'name email')
        .sort({ date: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Transaction.countDocuments(query),
      Transaction.aggregate([
        { $match: query },
        { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ])
    ]);

    return res.status(200).json({
      success: true, transactions, summary,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch transactions: ' + error.message });
  }
};

// @desc    Create transaction
// @route   POST /api/admin/transactions
// @access  Private/Admin
const createTransaction = async (req, res) => {
  try {
    const { type, amount, description, category, paymentMethod, status, date } = req.body;
    
    if (!type || !amount || !description) {
      return res.status(400).json({ success: false, message: 'Type, amount, and description are required' });
    }

    const transaction = await Transaction.create({
      type,
      amount,
      description,
      category: category || 'others',
      paymentMethod: paymentMethod || 'Cash',
      status: status || 'completed',
      date: date || new Date(),
      user: req.user.id
    });

    return res.status(201).json({ success: true, transaction });
  } catch (error) {
    console.error('Admin create transaction error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create transaction: ' + error.message });
  }
};

// @desc    Get sales
// @route   GET /api/admin/sales
// @access  Private/Admin
const getSales = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const [sales, total] = await Promise.all([
      Sale.find().populate('product', 'name').populate('user', 'name')
        .sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
      Sale.countDocuments()
    ]);

    return res.status(200).json({
      success: true, sales,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch sales: ' + error.message });
  }
};

// @desc    Create sale (admin)
// @route   POST /api/admin/sales
// @access  Private/Admin
const createSale = async (req, res) => {
  try {
    const { 
      product, quantity, totalAmount, paymentMethod, 
      customerName, customerPhone, customerEmail, notes 
    } = req.body;
    
    if (!product || !quantity) {
      return res.status(400).json({ success: false, message: 'Product and quantity are required' });
    }

    const productInfo = await Product.findById(product);
    if (!productInfo) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (productInfo.stock < quantity) {
      return res.status(400).json({ success: false, message: `Insufficient stock. Available: ${productInfo.stock}` });
    }

    const qty = Number(quantity);
    const unitPrice = totalAmount ? (Number(totalAmount) / qty) : productInfo.sellingPrice;
    const finalTotalAmount = totalAmount ? Number(totalAmount) : (unitPrice * qty);
    const purchasePriceTotal = productInfo.purchasePrice * qty;
    const profit = finalTotalAmount - purchasePriceTotal;

    const sale = await Sale.create({
      product,
      quantity: qty,
      unitPrice,
      totalAmount: finalTotalAmount,
      purchasePrice: purchasePriceTotal,
      profit,
      paymentMethod: paymentMethod || 'Cash',
      customerName,
      customerPhone,
      customerEmail,
      notes,
      user: req.user.id
    });

    // Update product stock and soldCount
    productInfo.stock -= qty;
    productInfo.soldCount += qty;
    await productInfo.save();

    // Create a transaction record
    await Transaction.create({
      type: 'Sale',
      amount: finalTotalAmount,
      description: `Sale recorded for ${productInfo.name} (${qty} ${productInfo.unit})`,
      category: 'sales',
      reference: sale.saleNumber,
      referenceId: sale._id,
      referenceModel: 'Sale',
      paymentMethod: paymentMethod || 'Cash',
      status: 'completed',
      user: req.user.id
    });

    return res.status(201).json({ success: true, sale });
  } catch (error) {
    console.error('Admin create sale error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to record sale' });
  }
};

// @desc    Get purchases
// @route   GET /api/admin/purchases
// @access  Private/Admin
const getPurchases = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const [purchases, total] = await Promise.all([
      Purchase.find().populate('product', 'name').populate('user', 'name')
        .sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
      Purchase.countDocuments()
    ]);

    return res.status(200).json({
      success: true, purchases,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch purchases: ' + error.message });
  }
};

// @desc    Create purchase (admin)
// @route   POST /api/admin/purchases
// @access  Private/Admin
const createPurchase = async (req, res) => {
  try {
    const purchase = await Purchase.create({ ...req.body, user: req.user.id });

    if (req.body.product && req.body.quantity) {
      await Product.findByIdAndUpdate(req.body.product, {
        $inc: { stock: Number(req.body.quantity) }
      });
    }

    return res.status(201).json({ success: true, purchase });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get analytics
// @route   GET /api/admin/analytics
// @access  Private/Admin
const getAnalytics = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const days = period === '7d' ? 7 : period === '90d' ? 90 : period === '1y' ? 365 : 30;
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [dailySales, userGrowth, categoryRevenue, paymentMethods] = await Promise.all([
      Order.aggregate([
        { $match: { createdAt: { $gte: start }, status: 'delivered' } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$totalPrice' }, orders: { $sum: 1 }, commission: { $sum: '$platformCommission' } } },
        { $sort: { _id: 1 } }
      ]),
      User.aggregate([
        { $match: { createdAt: { $gte: start } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, users: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      Order.aggregate([
        { $match: { status: 'delivered' } },
        { $unwind: '$items' },
        { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'productInfo' } },
        { $unwind: '$productInfo' },
        { $group: { _id: '$productInfo.category', revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }, orders: { $sum: 1 } } },
        { $sort: { revenue: -1 } }, { $limit: 10 }
      ]),
      Order.aggregate([
        { $group: { _id: '$paymentMethod', count: { $sum: 1 }, total: { $sum: '$totalPrice' } } }
      ])
    ]);

    return res.status(200).json({
      success: true,
      analytics: { dailySales, userGrowth, categoryRevenue, paymentMethods }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch analytics: ' + error.message });
  }
};

// @desc    Get system logs
// @route   GET /api/admin/logs
// @access  Private/Admin
const getSystemLogs = async (req, res) => {
  return res.status(200).json({ success: true, logs: [] });
};

// @desc    Export data
// @route   GET /api/admin/export/:type
// @access  Private/Admin
const exportData = async (req, res) => {
  try {
    const { type } = req.params;
    const { format = 'json', startDate, endDate } = req.query;

    let data;
    let query = {};

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    switch (type) {
      case 'orders':
        data = await Order.find(query)
          .populate('user', 'name email phoneNumber')
          .populate('items.product', 'name')
          .sort({ createdAt: -1 });
        break;
      case 'users':
        data = await User.find(query).select('-password -otp -resetPasswordToken').sort({ createdAt: -1 });
        break;
      case 'products':
        data = await Product.find(query).populate('user', 'name shopName').sort({ createdAt: -1 });
        break;
      case 'transactions':
        data = await Transaction.find(query).populate('user', 'name email').sort({ date: -1 });
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid export type' });
    }

    res.status(200).json({ success: true, data, count: data.length, type, exportedAt: new Date() });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Export failed' });
  }
};

// @desc    Get Google Drive auth URL
// @route   GET /api/admin/google/auth
// @access  Private/Admin
const googleDriveAuth = async (req, res) => {
  try {
    const { google } = require('googleapis');
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/drive.file'],
      state: req.user.id
    });

    res.status(200).json({ success: true, authUrl });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Google Drive auth failed. Install googleapis: npm install googleapis'
    });
  }
};

// @desc    Google Drive OAuth callback
// @route   GET /api/admin/google/callback
// @access  Public (registered directly in server.js, no admin middleware)
const googleDriveCallback = async (req, res) => {
  try {
    const { google } = require('googleapis');
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(req.query.code);
    // TODO: persist tokens in DB for the user identified by req.query.state
    console.log('Google Drive tokens received for user:', req.query.state);

    res.redirect(`${process.env.FRONTEND_URL}/admin/settings?drive=connected`);
  } catch (error) {
    console.error('Google Drive callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/admin/settings?drive=error`);
  }
};

// @desc    Backup data to Google Drive
// @route   POST /api/admin/google/backup
// @access  Private/Admin
const backupToGoogleDrive = async (req, res) => {
  try {
    const { google } = require('googleapis');
    const { accessToken, refreshToken, backupType = 'all' } = req.body;

    if (!accessToken) {
      return res.status(400).json({ success: false, message: 'Google access token required' });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ access_token: accessToken, refresh_token: refreshToken });

    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const { Readable } = require('stream');

    let backupData = {};
    if (backupType === 'all' || backupType === 'orders') backupData.orders = await Order.find().lean();
    if (backupType === 'all' || backupType === 'users') backupData.users = await User.find().select('-password -otp').lean();
    if (backupType === 'all' || backupType === 'products') backupData.products = await Product.find().lean();
    if (backupType === 'all' || backupType === 'transactions') backupData.transactions = await Transaction.find().lean();

    const fileName = `backup-${new Date().toISOString().split('T')[0]}.json`;
    const fileContent = JSON.stringify(backupData, null, 2);
    const stream = Readable.from([fileContent]);

    const response = await drive.files.create({
      resource: { name: fileName, mimeType: 'application/json', parents: ['root'] },
      media: { mimeType: 'application/json', body: stream },
      fields: 'id, name, size, createdTime'
    });

    res.status(200).json({
      success: true,
      message: `Backup uploaded to Google Drive: ${fileName}`,
      fileId: response.data.id,
      fileName: response.data.name,
      backupType,
      recordCounts: {
        orders: backupData.orders?.length,
        users: backupData.users?.length,
        products: backupData.products?.length,
        transactions: backupData.transactions?.length
      }
    });
  } catch (error) {
    console.error('Google Drive backup error:', error);
    if (error.message?.includes('googleapis')) {
      return res.status(500).json({ success: false, message: 'Please install googleapis: npm install googleapis' });
    }
    res.status(500).json({ success: false, message: 'Backup failed: ' + error.message });
  }
};

// @desc    Get inventory report
// @route   GET /api/admin/inventory
// @access  Private/Admin
const getInventoryReport = async (req, res) => {
  try {
    const { category, lowStock, search } = req.query;

    let query = { liveStatus: { $ne: 'archived' } };
    if (category) query.category = category;
    if (lowStock === 'true') query.$expr = { $lte: ['$stock', '$lowStockThreshold'] };
    if (search) query.name = { $regex: search, $options: 'i' };

    const products = await Product.find(query).populate('user', 'name shopName').sort({ stock: 1 });

    const summary = await Product.aggregate([
      { $match: { liveStatus: { $ne: 'archived' } } },
      { $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalStock: { $sum: '$stock' },
          totalStockValue: { $sum: { $multiply: ['$purchasePrice', '$stock'] } },
          lowStockCount: { $sum: { $cond: [{ $lte: ['$stock', '$lowStockThreshold'] }, 1, 0] } },
          outOfStockCount: { $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] } }
        }}
    ]);

    return res.status(200).json({
      success: true,
      products,
      summary: summary[0] || {},
      total: products.length
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch inventory: ' + error.message });
  }
};

// @desc    Get system config
// @route   GET /api/admin/config
// @access  Private/Admin
const getSystemConfig = async (req, res) => {
  try {
    const configs = await require('../models/SystemConfig').find();
    const configMap = {};
    configs.forEach(c => { configMap[c.key] = c.value; });
    return res.status(200).json({ success: true, configs: configMap });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch config: ' + error.message });
  }
};

// @desc    Update system config
// @route   PUT /api/admin/config
// @access  Private/Admin
const updateSystemConfig = async (req, res) => {
  try {
    const { key, value, description } = req.body;
    const SystemConfig = require('../models/SystemConfig');
    let config = await SystemConfig.findOne({ key });
    
    if (config) {
      config.value = value;
      if (description) config.description = description;
      config.updatedBy = req.user.id;
      await config.save();
    } else {
      config = await SystemConfig.create({ key, value, description, updatedBy: req.user.id });
    }
    
    return res.status(200).json({ success: true, message: 'Config updated', config });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update config: ' + error.message });
  }
};

// @desc    Get withdrawal requests
// @route   GET /api/admin/withdrawals
// @access  Private/Admin
const getWithdrawalRequests = async (req, res) => {
  try {
    const { status = 'all', page = 1, limit = 20 } = req.query;
    const query = { category: 'withdrawals' };
    if (status !== 'all') query.status = status;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const [withdrawals, total] = await Promise.all([
      Transaction.find(query)
        .populate('user', 'name email shopName totalEarnings')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Transaction.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true, withdrawals,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch withdrawals: ' + error.message });
  }
};

// @desc    Update withdrawal status (Approve/Reject)
// @route   PUT /api/admin/withdrawals/:id
// @access  Private/Admin
const updateWithdrawalStatus = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    if (!['completed', 'failed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Use completed or failed.' });
    }

    const withdrawal = await Transaction.findOne({ _id: req.params.id, category: 'withdrawals' });
    if (!withdrawal) return res.status(404).json({ success: false, message: 'Withdrawal request not found' });
    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Withdrawal already processed' });
    }

    const user = await User.findById(withdrawal.user);
    if (!user) return res.status(404).json({ success: false, message: 'Seller not found' });

    withdrawal.status = status;
    if (adminNotes) withdrawal.description += ` | Admin Note: ${adminNotes}`;
    
    await withdrawal.save();

    // Sync balance finally to be sure
    await syncSellerBalance(user._id);

    return res.status(200).json({ success: true, message: `Withdrawal ${status === 'completed' ? 'approved' : 'rejected'}`, withdrawal });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update withdrawal: ' + error.message });
  }
};

module.exports = {
  getStats, getAllUsers, getUserDetails, updateUser, deleteUser, approveSeller,
  getAllOrders, updateOrder, getAllProducts, createProduct, updateProduct, deleteProduct,
  getTransactions, createTransaction, getSales, createSale, getPurchases, createPurchase,
  getAnalytics, getSystemLogs, exportData, googleDriveAuth, googleDriveCallback, backupToGoogleDrive,
  getInventoryReport, getSystemConfig, updateSystemConfig, getWithdrawalRequests, updateWithdrawalStatus
};