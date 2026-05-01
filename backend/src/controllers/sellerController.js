const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');
const { syncSellerBalance } = require('../utils/balanceUtils');

// @desc    Get seller dashboard stats
// @route   GET /api/seller/stats
const getSellerStats = async (req, res) => {
  try {
    const sellerId = new mongoose.Types.ObjectId(req.user.id);
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const [
      user, totalProducts, totalOrders, totalSales,
      recentOrders, lowStockProducts,
      pendingOrders, salesChart, topProducts, ordersByStatus
    ] = await Promise.all([
      User.findById(req.user.id),
      Product.countDocuments({ user: req.user.id, liveStatus: { $ne: 'archived' } }),
      Order.countDocuments({ 'sellers.sellerId': sellerId, createdAt: { $gte: start, $lte: end } }),
      Order.aggregate([
        { $match: { 'sellers.sellerId': sellerId, status: { $in: ['confirmed', 'delivered'] }, createdAt: { $gte: start, $lte: end } } },
        { $unwind: '$sellers' },
        { $match: { 'sellers.sellerId': sellerId } },
        { $group: { _id: null, total: { $sum: '$sellers.subtotal' } } }
      ]),
      Order.find({ 'sellers.sellerId': sellerId })
        .populate('user', 'name email phoneNumber')
        .populate('items.product', 'name image')
        .sort({ createdAt: -1 }).limit(10),
      Product.find({
        user: req.user.id,
        $expr: { $lte: ['$stock', '$lowStockThreshold'] },
        liveStatus: { $ne: 'archived' }
      }).limit(20),
      Order.countDocuments({ 'sellers.sellerId': sellerId, status: 'pending' }),
      Order.aggregate([
        { $match: { 'sellers.sellerId': sellerId, status: { $in: ['confirmed', 'delivered'] }, createdAt: { $gte: start, $lte: end } } },
        { $unwind: '$sellers' },
        { $match: { 'sellers.sellerId': sellerId } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, sales: { $sum: '$sellers.sellerEarnings' }, orders: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      Order.aggregate([
        { $match: { 'sellers.sellerId': sellerId, status: { $in: ['confirmed', 'delivered'] } } },
        { $unwind: '$items' },
        { $match: { 'items.seller': sellerId } },
        { $group: { _id: '$items.product', totalSold: { $sum: '$items.quantity' }, totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
        { $sort: { totalSold: -1 } }, { $limit: 10 },
        { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
        { $unwind: '$product' }
      ]),
      Order.aggregate([
        { $match: { 'sellers.sellerId': sellerId } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    const monthlySales = await Order.aggregate([
      { $match: { 'sellers.sellerId': sellerId, status: { $in: ['confirmed', 'delivered'] } } },
      { $unwind: '$sellers' },
      { $match: { 'sellers.sellerId': sellerId } },
      { $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          total: { $sum: '$sellers.sellerEarnings' },
          orders: { $sum: 1 }
        }},
      { $sort: { _id: 1 } }
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        overview: {
          totalProducts,
          totalOrders,
          totalSales: totalSales[0]?.total || 0,
          totalEarnings: user?.totalEarnings || 0,
          totalWithdrawn: user?.totalWithdrawn || 0,
          cashBox: user?.cashBox || 0,
          pendingWithdrawals: user?.pendingWithdrawals || 0,
          pendingOrders,
          lowStockCount: lowStockProducts.length
        },
        recentOrders,
        lowStockProducts,
        topProducts,
        salesChart,
        monthlySales,
        ordersByStatus
      }
    });
  } catch (error) {
    console.error('Seller stats error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch seller stats: ' + error.message });
  }
};

// @desc    Get seller products
const getSellerProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, liveStatus, search } = req.query;

    let query = { user: req.user.id };
    if (category) query.category = category;
    if (liveStatus) query.liveStatus = liveStatus;
    if (search) query.name = { $regex: search, $options: 'i' };

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const [products, total] = await Promise.all([
      Product.find(query).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
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

// @desc    Create product (seller)
const createSellerProduct = async (req, res) => {
  try {
    const productData = { ...req.body, user: req.user.id };
    // FIX: keep price alias in sync
    if (!productData.price) productData.price = productData.sellingPrice;

    const product = await Product.create(productData);
    return res.status(201).json({ success: true, product });
  } catch (error) {
    console.error('Create product error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(v => v.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    return res.status(500).json({ success: false, message: error.message || 'Failed to create product' });
  }
};

// @desc    Update product (seller)
const updateSellerProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, user: req.user.id });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    // FIX: keep price alias in sync
    if (req.body.sellingPrice) req.body.price = req.body.sellingPrice;

    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    return res.status(200).json({ success: true, product: updated });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(v => v.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    return res.status(500).json({ success: false, message: error.message || 'Failed to update product' });
  }
};

// @desc    Delete product (seller - soft delete)
const deleteSellerProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, user: req.user.id });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    product.liveStatus = 'archived';
    await product.save();

    return res.status(200).json({ success: true, message: 'Product archived' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete product: ' + error.message });
  }
};

// @desc    Get seller orders
const getSellerOrders = async (req, res) => {
  try {
    const sellerId = new mongoose.Types.ObjectId(req.user.id);
    const { page = 1, limit = 20, status } = req.query;

    const query = { 'sellers.sellerId': sellerId };
    if (status) query.status = status;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('user', 'name email phoneNumber')
        .populate('items.product', 'name image sellingPrice')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum).limit(limitNum),
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

// @desc    Update seller order status
const updateSellerOrder = async (req, res) => {
  try {
    const { status, trackingNumber, courier, note } = req.body;
    const sellerId = req.user.id;

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // 1. Find seller record in order
    const sellerIndex = order.sellers.findIndex(s => s.sellerId.toString() === sellerId);
    if (sellerIndex === -1 && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this order' });
    }

    // 2. Update seller-specific status
    if (sellerIndex > -1 && status) {
      order.sellers[sellerIndex].status = status;
    }

    // 3. Update global tracking if provided
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (courier) order.courier = courier;

    // 4. Update global status based on multi-vendor rules
    const isSingleSeller = order.sellers.length <= 1;
    const isAdmin = req.user.role === 'admin';
    
    if (status && (isAdmin || isSingleSeller)) {
      order.status = status;
    } else if (status) {
      // Multi-seller logic: update global status only if all sellers have reached this priority
      const statusPriority = {
        'pending': 0, 'confirmed': 1, 'processing': 2, 
        'shipped': 3, 'out-for-delivery': 4, 'delivered': 5,
        'cancelled': -1, 'returned': -1, 'refunded': -1
      };
      
      const targetStatusPriority = statusPriority[status] || 0;

      // Check if all sellers have reached or passed the target status
      const allSellersReached = order.sellers.every(s => {
        // For cancellation logic, if any is cancelled we handle it differently, 
        // but for forward flow, all must be at least at targetStatusPriority
        const sPriority = statusPriority[s.status] || 0;
        return sPriority >= targetStatusPriority;
      });

      if (allSellersReached) {
        order.status = status;
        
        // Auto-confirm payment for COD on delivery
        if (status === 'delivered' && (order.paymentMethod === 'Cash on Delivery' || order.paymentMethod === 'cash')) {
          order.paymentStatus = 'paid';
          order.isPaid = true;
          order.paidAt = new Date();
        }
      }
    }

    // 5. Audit Log
    order.statusHistory.push({
      status: status || order.status,
      date: new Date(),
      note: note || `Updated by ${req.user.role} (${req.user.name})`,
      updatedBy: req.user.id
    });

    await order.save();

    // Trigger balance sync for all sellers in the order if delivered
    if (order.status === 'delivered') {
      try {
        const { syncSellerBalance } = require('../utils/balanceUtils');
        await Promise.all(order.sellers.map(s => syncSellerBalance(s.sellerId)));
      } catch (err) {
        console.error('Balance sync error in updateSellerOrder:', err);
      }
    }

    return res.status(200).json({ success: true, message: 'Order updated successfully', order });
  } catch (error) {
    console.error('Update seller order error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update order: ' + error.message });
  }
};

// @desc    Get seller earnings
const getSellerEarnings = async (req, res) => {
  try {
    const sellerId = new mongoose.Types.ObjectId(req.user.id);
    const { page = 1, limit = 20 } = req.query;

    const earnings = await Order.find({ 'sellers.sellerId': sellerId, status: 'delivered' })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const [total, pendingWithdrawal] = await Promise.all([
      Order.aggregate([
        { $match: { 'sellers.sellerId': sellerId, status: 'delivered' } },
        { $unwind: '$sellers' },
        { $match: { 'sellers.sellerId': sellerId } },
        { $group: { _id: null, totalEarnings: { $sum: '$sellers.sellerEarnings' }, totalCommission: { $sum: '$sellers.commission' }, totalOrders: { $sum: 1 } } }
      ]),
      Transaction.aggregate([
        { $match: { user: req.user.id, type: 'Cash Out', status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    return res.status(200).json({
      success: true,
      earnings,
      totals: {
        ...(total[0] || { totalEarnings: 0, totalCommission: 0, totalOrders: 0 }),
        pendingWithdrawal: pendingWithdrawal[0]?.total || 0
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch earnings: ' + error.message });
  }
};

// @desc    Request withdrawal
const requestWithdrawal = async (req, res) => {
  try {
    const { amount, paymentMethod, accountNumber, accountName } = req.body;

    if (!amount || amount < 100) {
      return res.status(400).json({ success: false, message: 'Minimum withdrawal is ৳100' });
    }

    // Ensure balance is synced before checking
    const syncedUser = await syncSellerBalance(req.user.id);
    const availableBalance = syncedUser.cashBox;

    if (amount > availableBalance) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance in Cash Box. Available: ৳${availableBalance.toFixed(2)}`
      });
    }

    // Atomically update balances
    syncedUser.cashBox -= amount;
    syncedUser.pendingWithdrawals += amount;
    await syncedUser.save();

    const withdrawal = await Transaction.create({
      type: 'Cash Out',
      amount,
      description: `Withdrawal request - ${paymentMethod}: ${accountNumber}`,
      category: 'withdrawals',
      paymentMethod,
      // FIX: metadata stored as plain object, not Map, for simpler querying
      metadata: { accountNumber, accountName, sellerId: req.user.id, sellerName: req.user.name },
      user: req.user.id,
      status: 'pending'
    });

    return res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted. Processing within 1-3 business days.',
      withdrawal
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to submit withdrawal request: ' + error.message });
  }
};

// @desc    Sync seller balance Manually
const syncBalance = async (req, res) => {
  try {
    const user = await syncSellerBalance(req.user.id);
    return res.status(200).json({
      success: true,
      message: 'Balance synced successfully',
      balance: {
        cashBox: user.cashBox,
        totalEarnings: user.totalEarnings,
        pendingWithdrawals: user.pendingWithdrawals
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to sync balance: ' + error.message });
  }
};

// @desc    Get seller profile
const getSellerProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -otp -otpExpire -resetPasswordToken');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const sellerId = new mongoose.Types.ObjectId(req.user.id);
    const [productCount, orderCount, totalEarnings] = await Promise.all([
      Product.countDocuments({ user: req.user.id }),
      Order.countDocuments({ 'sellers.sellerId': sellerId }),
      Order.aggregate([
        { $match: { 'sellers.sellerId': sellerId, status: { $in: ['confirmed', 'delivered'] } } },
        { $unwind: '$sellers' },
        { $match: { 'sellers.sellerId': sellerId } },
        { $group: { _id: null, total: { $sum: '$sellers.sellerEarnings' } } }
      ])
    ]);

    return res.status(200).json({
      success: true,
      seller: {
        ...user.toObject(),
        stats: {
          totalProducts: productCount,
          totalOrders: orderCount,
          totalEarnings: totalEarnings[0]?.total || 0
        }
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch seller profile: ' + error.message });
  }
};

// @desc    Update seller profile
const updateSellerProfile = async (req, res) => {
  try {
    const allowedFields = ['profilePic', 'shopName', 'shopDescription', 'shopLogo', 'shopBanner', 'shopLocation', 'paymentMethod', 'paymentDetails'];
    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });
    const user = await User.findByIdAndUpdate(req.user.id, { $set: updates }, { new: true, runValidators: true }).select('-password');
    return res.status(200).json({ success: true, profile: user });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update profile: ' + error.message });
  }
};

const getSellerSales = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // FIX: Sale model uses 'seller' field, not 'user'
    const [sales, total] = await Promise.all([
      Sale.find({ seller: req.user.id })
        .populate('product', 'name image unit')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Sale.countDocuments({ seller: req.user.id })
    ]);

    return res.status(200).json({
      success: true, sales,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch sales: ' + error.message });
  }
};

const createSellerSale = async (req, res) => {
  try {
    const { product, quantity, totalAmount, paymentMethod, description, customerName, customerPhone } = req.body;

    if (!product || !quantity || !totalAmount) {
      return res.status(400).json({ success: false, message: 'Product, quantity, and total amount are required' });
    }

    // FIX: ensure the product belongs to this seller
    const productInfo = await Product.findOne({ _id: product, user: req.user.id });
    if (!productInfo) return res.status(404).json({ success: false, message: 'Product not found or not yours' });

    const qty = parseInt(quantity);
    const total = parseFloat(totalAmount);

    if (productInfo.stock < qty) {
      return res.status(400).json({ success: false, message: `Insufficient stock. Only ${productInfo.stock} units available` });
    }

    const totalPurchasePrice = (productInfo.purchasePrice || 0) * qty;
    const profit = total - totalPurchasePrice;

    // FIX: use 'seller' field to match Sale schema
    const sale = await Sale.create({
      product,
      quantity: qty,
      unitPrice: total / qty,
      totalAmount: total,
      purchasePrice: totalPurchasePrice,
      profit,
      paymentMethod: paymentMethod || 'Cash',
      notes: description || '',
      customerName: customerName || '',
      customerPhone: customerPhone || '',
      seller: req.user.id,
      status: 'delivered'
    });

    // Deduct stock and increase soldCount
    await Product.findByIdAndUpdate(product, { $inc: { stock: -qty, soldCount: qty } });

    await sale.populate('product', 'name image unit');
    return res.status(201).json({ success: true, sale });
  } catch (error) {
    console.error('Create sale error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateSellerSale = async (req, res) => {
  try {
    const sale = await Sale.findOne({ _id: req.params.id, seller: req.user.id });
    if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });

    const { quantity, totalAmount, paymentMethod, description, customerName, customerPhone } = req.body;

    // If quantity changed, adjust stock accordingly
    if (quantity !== undefined) {
      const newQty = parseInt(quantity);
      const qtyDiff = newQty - sale.quantity; // positive = more sold, negative = returned

      const productInfo = await Product.findById(sale.product);
      if (!productInfo) return res.status(404).json({ success: false, message: 'Product not found' });

      if (qtyDiff > 0 && productInfo.stock < qtyDiff) {
        return res.status(400).json({ success: false, message: `Insufficient stock. Only ${productInfo.stock} additional units available` });
      }

      // Adjust stock: restore old qty, deduct new qty
      await Product.findByIdAndUpdate(sale.product, { $inc: { stock: -qtyDiff, soldCount: qtyDiff } });

      const total = parseFloat(totalAmount || sale.totalAmount);
      const totalPurchasePrice = (productInfo.purchasePrice || 0) * newQty;
      sale.quantity = newQty;
      sale.unitPrice = total / newQty;
      sale.totalAmount = total;
      sale.purchasePrice = totalPurchasePrice;
      sale.profit = total - totalPurchasePrice;
    } else if (totalAmount !== undefined) {
      const total = parseFloat(totalAmount);
      sale.totalAmount = total;
      sale.unitPrice = total / sale.quantity;
      sale.profit = total - sale.purchasePrice;
    }

    if (paymentMethod !== undefined) sale.paymentMethod = paymentMethod;
    if (description !== undefined) sale.notes = description;
    if (customerName !== undefined) sale.customerName = customerName;
    if (customerPhone !== undefined) sale.customerPhone = customerPhone;

    await sale.save();
    await sale.populate('product', 'name image unit');
    return res.status(200).json({ success: true, sale });
  } catch (error) {
    console.error('Update sale error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteSellerSale = async (req, res) => {
  try {
    const sale = await Sale.findOne({ _id: req.params.id, seller: req.user.id });
    if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });

    // Restore stock on deletion
    await Product.findByIdAndUpdate(sale.product, { $inc: { stock: sale.quantity, soldCount: -sale.quantity } });
    await Sale.findByIdAndDelete(sale._id);

    return res.status(200).json({ success: true, message: 'Sale deleted and stock restored' });
  } catch (error) {
    console.error('Delete sale error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getSellerPurchases = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const [purchases, total] = await Promise.all([
      Purchase.find({ user: req.user.id })
        .populate('product', 'name')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Purchase.countDocuments({ user: req.user.id })
    ]);

    return res.status(200).json({
      success: true, purchases,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch purchases: ' + error.message });
  }
};

const createSellerPurchase = async (req, res) => {
  try {
    const { product, quantity, totalAmount, description, supplierName, supplierPhone, paidAmount } = req.body;
    const productInfo = await Product.findOne({ _id: product, user: req.user.id });
    if (!productInfo) return res.status(404).json({ success: false, message: 'Product not found' });

    const paid = paidAmount !== undefined ? Number(paidAmount) : totalAmount;
    const paymentStatus = paid >= totalAmount ? 'paid' : paid > 0 ? 'partial' : 'pending';

    const purchase = await Purchase.create({
      product, quantity,
      unitPrice: totalAmount / quantity,
      totalAmount,
      supplier: { name: supplierName, phone: supplierPhone },
      notes: description,
      paidAmount: paid,
      paymentStatus,
      user: req.user.id
    });

    await Product.findByIdAndUpdate(product, { $inc: { stock: quantity } });

    return res.status(201).json({ success: true, purchase });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getSellerTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const [transactions, total] = await Promise.all([
      Transaction.find({ user: req.user.id })
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Transaction.countDocuments({ user: req.user.id })
    ]);

    return res.status(200).json({
      success: true, transactions,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch transactions: ' + error.message });
  }
};

const createSellerTransaction = async (req, res) => {
  try {
    const { type } = req.body;
    if (!['Cash In', 'Cash Out'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid transaction type. Sellers can only create Cash In or Cash Out transactions.' });
    }
    const transaction = await Transaction.create({ ...req.body, user: req.user.id, status: 'completed' });
    return res.status(201).json({ success: true, transaction });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getSellerWithdrawals = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const [withdrawals, total] = await Promise.all([
      Transaction.find({ user: req.user.id, category: 'withdrawals' })
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Transaction.countDocuments({ user: req.user.id, category: 'withdrawals' })
    ]);

    return res.status(200).json({
      success: true, withdrawals,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch withdrawals: ' + error.message });
  }
};

const getSellerCustomers = async (req, res) => {
  try {
    const sellerId = new mongoose.Types.ObjectId(req.user.id);
    const orders = await Order.find({ 'sellers.sellerId': sellerId })
      .populate('user', 'name email phoneNumber profilePic');

    const customersMap = new Map();
    orders.forEach(o => {
      if (!o.user) return;
      const key = o.user._id.toString();
      if (!customersMap.has(key)) {
        customersMap.set(key, { ...o.user.toObject(), orderCount: 1 });
      } else {
        customersMap.get(key).orderCount++;
      }
    });

    return res.status(200).json({ success: true, customers: Array.from(customersMap.values()) });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch customers: ' + error.message });
  }
};

module.exports = {
  getSellerStats, getSellerProducts, createSellerProduct, updateSellerProduct, deleteSellerProduct,
  getSellerOrders, updateSellerOrder, getSellerEarnings, requestWithdrawal,
  getSellerProfile, updateSellerProfile,
  getSellerSales, createSellerSale, updateSellerSale, deleteSellerSale,
  getSellerPurchases, createSellerPurchase,
  getSellerTransactions, createSellerTransaction, getSellerCustomers, syncBalance,
  getSellerWithdrawals
};