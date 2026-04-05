// routes/sellerRoutes.js
const express = require('express');
const router = express.Router();
const { protect, seller, approvedSeller } = require('../middleware/authMiddleware');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Withdrawal = require('../models/Withdrawal');
const Chat = require('../models/Chat');
const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');

// All seller routes require authentication + seller role + seller approval
router.use(protect, seller, approvedSeller);

// ==================== DASHBOARD & STATS ====================
router.get('/stats', async (req, res) => {
  try {
    const sellerId = req.user.id;

    // Get products
    const products = await Product.find({ user: sellerId });
    
    // Get orders where seller's products are included
    const orders = await Order.find({ 'items.seller': sellerId })
      .populate('user', 'name email phoneNumber')
      .sort('-createdAt');
    
    // Get withdrawals
    const withdrawals = await Withdrawal.find({ seller: sellerId });
    
    // Calculate earnings from delivered orders (after 2% commission)
    const deliveredOrders = orders.filter(o => o.status === 'delivered');
    let totalEarnings = 0;
    let totalSales = 0;
    
    deliveredOrders.forEach(order => {
      const sellerItems = order.items.filter(item => 
        item.seller?.toString() === sellerId
      );
      sellerItems.forEach(item => {
        const itemTotal = item.price * item.quantity;
        totalSales += itemTotal;
        totalEarnings += itemTotal * 0.98; // 2% platform commission
      });
    });
    
    // Calculate withdrawn amount
    const totalWithdrawn = withdrawals
      .filter(w => w.status === 'completed')
      .reduce((sum, w) => sum + w.netAmount, 0);
    
    const pendingWithdrawals = withdrawals
      .filter(w => w.status === 'pending')
      .reduce((sum, w) => sum + w.amount, 0);
    
    const cashBox = Math.max(0, totalEarnings - totalWithdrawn - pendingWithdrawals);
    
    // Get sales chart data (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const salesChart = await Order.aggregate([
      { $match: { 
        createdAt: { $gte: thirtyDaysAgo },
        status: 'delivered'
      }},
      { $unwind: '$items' },
      { $match: { 'items.seller': mongoose.Types.ObjectId(sellerId) } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        sales: { $sum: { $multiply: ['$items.price', '$items.quantity', 0.98] } }
      }},
      { $sort: { _id: 1 } }
    ]);
    
    // Get top products
    const topProducts = await Product.aggregate([
      { $match: { user: mongoose.Types.ObjectId(sellerId) } },
      { $lookup: {
        from: 'orders',
        localField: '_id',
        foreignField: 'items.product',
        as: 'orders'
      }},
      { $addFields: {
        totalSold: { $sum: { $size: '$orders' } },
        totalRevenue: { $sum: { $map: {
          input: '$orders',
          as: 'order',
          in: { $multiply: ['$$order.items.price', '$$order.items.quantity', 0.98] }
        }}}
      }},
      { $sort: { totalSold: -1 } },
      { $limit: 6 },
      { $project: { name: 1, image: 1, totalSold: 1, totalRevenue: 1 } }
    ]);
    
    // Get recent orders
    const recentOrders = orders.slice(0, 5);
    
    // Monthly earnings chart
    const monthlySalesChart = await Order.aggregate([
      { $match: { status: 'delivered' } },
      { $unwind: '$items' },
      { $match: { 'items.seller': mongoose.Types.ObjectId(sellerId) } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        earnings: { $sum: { $multiply: ['$items.price', '$items.quantity', 0.98] } },
        commission: { $sum: { $multiply: ['$items.price', '$items.quantity', 0.02] } }
      }},
      { $sort: { _id: 1 } },
      { $limit: 12 }
    ]);
    
    res.json({
      stats: {
        overview: {
          totalProducts: products.length,
          totalOrders: orders.length,
          totalEarnings,
          totalSales,
          totalWithdrawn,
          pendingWithdrawals,
          cashBox
        },
        recentOrders,
        topProducts,
        salesChart,
        monthlySalesChart,
        monthlyEarnings: monthlySalesChart[monthlySalesChart.length - 1]?.earnings || 0
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/profile', async (req, res) => {
  try {
    const seller = await User.findById(req.user.id).select('-password');
    res.json({ seller });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/earnings', async (req, res) => {
  try {
    const sellerId = req.user.id;
    
    const orders = await Order.find({ 
      'items.seller': sellerId,
      status: 'delivered'
    });
    
    let totalEarnings = 0;
    let totalCommission = 0;
    
    orders.forEach(order => {
      const sellerItems = order.items.filter(item => 
        item.seller?.toString() === sellerId
      );
      sellerItems.forEach(item => {
        const itemTotal = item.price * item.quantity;
        totalEarnings += itemTotal * 0.98;
        totalCommission += itemTotal * 0.02;
      });
    });
    
    const withdrawals = await Withdrawal.find({ seller: sellerId });
    const totalWithdrawn = withdrawals
      .filter(w => w.status === 'completed')
      .reduce((sum, w) => sum + w.netAmount, 0);
    
    res.json({
      earnings: {
        totalEarnings,
        totalCommission,
        totalWithdrawn,
        availableBalance: totalEarnings - totalWithdrawn
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== PRODUCT MANAGEMENT ====================
router.get('/products', async (req, res) => {
  try {
    const { limit = 200, page = 1 } = req.query;
    const products = await Product.find({ user: req.user.id })
      .sort('-createdAt')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await Product.countDocuments({ user: req.user.id });
    
    res.json({
      products,
      pagination: { total, page: parseInt(page), limit: parseInt(limit) }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/products', async (req, res) => {
  try {
    const data = {
      ...req.body,
      user: req.user.id,
      price: req.body.sellingPrice
    };
    if (!data.sku || data.sku.trim() === '') delete data.sku;
    if (!data.brand || data.brand.trim() === '') delete data.brand;
    
    const product = new Product(data);
    await product.save();
    res.status(201).json({ product });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create product', error: error.message });
  }
});

router.put('/products/:id', async (req, res) => {
  try {
    const data = { ...req.body, price: req.body.sellingPrice };
    if (!data.sku || data.sku.trim() === '') delete data.sku;
    if (!data.brand || data.brand.trim() === '') delete data.brand;
    
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      data,
      { new: true, runValidators: true }
    );
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ product });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update product', error: error.message });
  }
});

router.delete('/products/:id', async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ 
      _id: req.params.id, 
      user: req.user.id 
    });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete product' });
  }
});

// ==================== ORDER MANAGEMENT ====================
router.get('/orders', async (req, res) => {
  try {
    const { limit = 100, status } = req.query;
    const query = { 'items.seller': req.user.id };
    if (status) query.status = status;
    
    const orders = await Order.find(query)
      .populate('user', 'name email phoneNumber profilePic')
      .sort('-createdAt')
      .limit(parseInt(limit));
    
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/orders/:id', async (req, res) => {
  try {
    const { status, trackingNumber, courier } = req.body;
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, 'items.seller': req.user.id },
      { status, trackingNumber, courier },
      { new: true }
    );
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json({ order });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update order' });
  }
});

// ==================== CUSTOMERS ====================
router.get('/customers', async (req, res) => {
  try {
    const orders = await Order.find({ 'items.seller': req.user.id })
      .populate('user', 'name email phoneNumber profilePic createdAt');
    
    const customersMap = new Map();
    orders.forEach(order => {
      if (order.user && !customersMap.has(order.user._id.toString())) {
        const orderCount = orders.filter(o => o.user?._id?.toString() === order.user._id.toString()).length;
        customersMap.set(order.user._id.toString(), {
          ...order.user.toObject(),
          orderCount
        });
      }
    });
    
    const customers = Array.from(customersMap.values());
    res.json({ customers });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== WITHDRAWALS ====================
router.post('/withdraw', async (req, res) => {
  try {
    const { amount, paymentMethod, accountNumber, accountName } = req.body;
    
    // Calculate available balance
    const orders = await Order.find({ 
      'items.seller': req.user.id,
      status: 'delivered'
    });
    
    let totalEarnings = 0;
    orders.forEach(order => {
      const sellerItems = order.items.filter(item => 
        item.seller?.toString() === req.user.id
      );
      sellerItems.forEach(item => {
        totalEarnings += item.price * item.quantity * 0.98;
      });
    });
    
    const withdrawals = await Withdrawal.find({ user: req.user.id });
    const totalWithdrawn = withdrawals
      .filter(w => w.status === 'completed')
      .reduce((sum, w) => sum + w.netAmount, 0);
    const pendingWithdrawals = withdrawals
      .filter(w => w.status === 'pending')
      .reduce((sum, w) => sum + w.amount, 0);
    
    const availableBalance = totalEarnings - totalWithdrawn - pendingWithdrawals;
    
    if (amount > availableBalance) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }
    
    const serviceCharge = amount * 0.02; // 2% service charge
    const netAmount = amount - serviceCharge;
    
    const withdrawal = new Withdrawal({
      user: req.user.id,
      amount: parseFloat(amount),
      serviceCharge,
      netAmount,
      paymentMethod,
      accountNumber,
      accountName,
      status: 'pending'
    });
    
    await withdrawal.save();
    res.status(201).json({ withdrawal });
  } catch (error) {
    res.status(500).json({ message: 'Failed to process withdrawal' });
  }
});

router.get('/withdrawals', async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ user: req.user.id })
      .sort('-createdAt');
    res.json({ withdrawals });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== SALES ====================
router.get('/sales', async (req, res) => {
  try {
    const sales = await Sale.find({ user: req.user.id })
      .populate('product', 'name image')
      .sort('-createdAt');
    res.json({ sales });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/sales', async (req, res) => {
  try {
    const { product, quantity, totalAmount, paymentMethod, notes } = req.body;
    
    // Check product stock
    const productData = await Product.findOne({ _id: product, user: req.user.id });
    if (!productData) {
      return res.status(404).json({ message: 'Product not found' });
    }
    if (productData.stock < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }
    
    // Calculate profit
    const profit = totalAmount - (productData.purchasePrice * quantity);
    
    const sale = new Sale({
      user: req.user.id,
      product,
      quantity,
      totalAmount,
      profit,
      paymentMethod,
      notes,
      saleNumber: `SALE-${Date.now()}`
    });
    
    await sale.save();
    
    // Update product stock
    productData.stock -= quantity;
    await productData.save();
    
    // Create transaction record
    const transaction = new Transaction({
      user: req.user.id,
      type: 'Cash In',
      amount: totalAmount,
      description: `Sale: ${productData.name} x${quantity}`,
      paymentMethod,
      category: 'sales'
    });
    await transaction.save();
    
    res.status(201).json({ sale });
  } catch (error) {
    res.status(500).json({ message: 'Failed to record sale' });
  }
});

// ==================== PURCHASES ====================
router.get('/purchases', async (req, res) => {
  try {
    const purchases = await Purchase.find({ user: req.user.id })
      .populate('product', 'name image')
      .sort('-createdAt');
    res.json({ purchases });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/purchases', async (req, res) => {
  try {
    const { product, quantity, totalAmount, description, supplierName, supplierPhone } = req.body;
    
    const purchase = new Purchase({
      user: req.user.id,
      product,
      quantity,
      totalAmount,
      description,
      supplierName,
      supplierPhone,
      purchaseNumber: `PUR-${Date.now()}`
    });
    
    await purchase.save();
    
    // Update product stock
    const productData = await Product.findOne({ _id: product, user: req.user.id });
    if (productData) {
      productData.stock += quantity;
      await productData.save();
    }
    
    // Create transaction record
    const transaction = new Transaction({
      user: req.user.id,
      type: 'Cash Out',
      amount: totalAmount,
      description: `Purchase: ${productData?.name || 'Product'} x${quantity}`,
      paymentMethod: 'Cash',
      category: 'purchases'
    });
    await transaction.save();
    
    res.status(201).json({ purchase });
  } catch (error) {
    res.status(500).json({ message: 'Failed to record purchase' });
  }
});

// ==================== TRANSACTIONS ====================
router.get('/transactions', async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id })
      .sort('-createdAt');
    res.json({ transactions });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/transactions', async (req, res) => {
  try {
    const transaction = new Transaction({
      ...req.body,
      user: req.user.id
    });
    await transaction.save();
    res.status(201).json({ transaction });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add transaction' });
  }
});

// ==================== CHATS ====================
router.get('/chats', async (req, res) => {
  try {
    const chats = await Chat.find({ 
      $or: [
        { user: req.user.id },
        { participants: req.user.id }
      ]
    })
    .populate('user', 'name email profilePic')
    .sort('-updatedAt');
    
    res.json({ chats });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/chats/:chatId/messages', async (req, res) => {
  try {
    const chat = await Chat.findOne({ 
      _id: req.params.chatId,
      $or: [{ user: req.user.id }, { participants: req.user.id }]
    }).populate('messages.sender', 'name');
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    res.json({ messages: chat.messages || [] });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/chats/:chatId/reply', async (req, res) => {
  try {
    const { message } = req.body;
    const chat = await Chat.findOneAndUpdate(
      { _id: req.params.chatId, user: req.user.id },
      { 
        $push: { 
          messages: { 
            sender: req.user.id, 
            senderModel: 'User',
            message,
            createdAt: new Date()
          }
        },
        lastMessage: message,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    res.json({ chat });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send message' });
  }
});

// ==================== SYNC BALANCE ====================
router.get('/sync-balance', async (req, res) => {
  try {
    const sellerId = req.user.id;
    
    // Recalculate earnings from all delivered orders
    const orders = await Order.find({ 
      'items.seller': sellerId,
      status: 'delivered'
    });
    
    let totalEarnings = 0;
    orders.forEach(order => {
      const sellerItems = order.items.filter(item => 
        item.seller?.toString() === sellerId
      );
      sellerItems.forEach(item => {
        totalEarnings += item.price * item.quantity * 0.98;
      });
    });
    
    const withdrawals = await Withdrawal.find({ seller: sellerId });
    const totalWithdrawn = withdrawals
      .filter(w => w.status === 'completed')
      .reduce((sum, w) => sum + w.netAmount, 0);
    const pendingWithdrawals = withdrawals
      .filter(w => w.status === 'pending')
      .reduce((sum, w) => sum + w.amount, 0);
    
    const cashBox = Math.max(0, totalEarnings - totalWithdrawn - pendingWithdrawals);
    
    res.json({ 
      message: 'Balance synced successfully',
      balance: { totalEarnings, totalWithdrawn, pendingWithdrawals, cashBox }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to sync balance' });
  }
});

module.exports = router;