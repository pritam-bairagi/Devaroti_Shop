// routes/withdrawalRoutes.js
const express = require('express');
const router = express.Router();
const { protect, admin, seller } = require('../middleware/authMiddleware');
const Withdrawal = require('../models/Withdrawal');
const Order = require('../models/Order');
const User = require('../models/User');

// ==================== CONTROLLER FUNCTIONS ====================

// @desc    Create withdrawal request
// @route   POST /api/withdrawals
// @access  Private (Seller only)
const createWithdrawal = async (req, res) => {
  try {
    const { amount, paymentMethod, accountNumber, accountName, sellerNote } = req.body;
    const sellerId = req.user.id;

    // Validate amount
    if (!amount || Number(amount) < 100) {
      return res.status(400).json({ 
        success: false, 
        message: 'Minimum withdrawal amount is 100 Taka' 
      });
    }

    if (Number(amount) > 500000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Maximum withdrawal amount per request is 500,000 Taka' 
      });
    }

    // Use User.cashBox as single source of truth for available balance
    const sellerUser = await User.findById(sellerId);
    if (!sellerUser) return res.status(404).json({ success: false, message: 'Seller not found' });

    const availableBalance = sellerUser.cashBox || 0;

    if (Number(amount) > availableBalance) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient balance. Available: ৳${availableBalance.toLocaleString('en-BD', { maximumFractionDigits: 0 })}` 
      });
    }

    // Check pending withdrawals count (max 3 pending at a time)
    const pendingCount = await Withdrawal.countDocuments({ seller: sellerId, status: 'pending' });
    if (pendingCount >= 3) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have too many pending requests. Please wait for previous requests to be processed.' 
      });
    }

    // Calculate service charge (2%)
    const parsedAmount = parseFloat(amount);
    const serviceCharge = parsedAmount * 0.02;
    const netAmount = parsedAmount - serviceCharge;

    // Create withdrawal record
    const withdrawal = new Withdrawal({
      seller: sellerId,
      amount: parsedAmount,
      serviceCharge,
      netAmount,
      paymentMethod,
      accountNumber,
      accountName: accountName || '',
      sellerNote: sellerNote || '',
      status: 'pending'
    });

    // ATOMICALLY deduct from seller cashBox and add to pending
    sellerUser.cashBox = Math.max(0, sellerUser.cashBox - parsedAmount);
    sellerUser.pendingWithdrawals = (sellerUser.pendingWithdrawals || 0) + parsedAmount;

    await withdrawal.save();
    await sellerUser.save();
    await withdrawal.populate('seller', 'name email shopName');

    res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      withdrawal
    });
  } catch (error) {
    console.error('Create withdrawal error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create withdrawal request: ' + error.message
    });
  }
};

// @desc    Get seller's withdrawals
// @route   GET /api/withdrawals/my
// @access  Private (Seller only)
const getSellerWithdrawals = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const sellerId = req.user.id;
    
    const query = { seller: sellerId };
    if (status && status !== 'all') {
      query.status = status;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [withdrawals, total] = await Promise.all([
      Withdrawal.find(query)
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit)),
      Withdrawal.countDocuments(query)
    ]);
    
    // Calculate statistics
    const stats = await Withdrawal.aggregate([
      { $match: { seller: sellerId } },
      { $group: {
        _id: '$status',
        totalAmount: { $sum: '$amount' },
        totalNetAmount: { $sum: '$netAmount' },
        count: { $sum: 1 }
      }}
    ]);
    
    const withdrawalStats = {
      pending: { amount: 0, count: 0 },
      approved: { amount: 0, count: 0 },
      completed: { amount: 0, count: 0 },
      rejected: { amount: 0, count: 0 }
    };
    
    stats.forEach(stat => {
      if (withdrawalStats[stat._id]) {
        withdrawalStats[stat._id] = {
          amount: stat.totalAmount,
          netAmount: stat.totalNetAmount,
          count: stat.count
        };
      }
    });
    
    res.json({
      success: true,
      withdrawals,
      stats: withdrawalStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get seller withdrawals error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch withdrawals',
      error: error.message 
    });
  }
};

// @desc    Get all withdrawals (Admin)
// @route   GET /api/withdrawals/admin/all
// @access  Private (Admin only)
const getAllWithdrawals = async (req, res) => {
  try {
    const { page = 1, limit = 50, status } = req.query;
    
    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [withdrawals, total] = await Promise.all([
      Withdrawal.find(query)
        .populate('seller', 'name email phoneNumber shopName shopAddress profilePic')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit)),
      Withdrawal.countDocuments(query)
    ]);
    
    // Get summary statistics
    const summary = await Withdrawal.aggregate([
      { $group: {
        _id: '$status',
        totalAmount: { $sum: '$amount' },
        totalNetAmount: { $sum: '$netAmount' },
        count: { $sum: 1 }
      }}
    ]);
    
    const stats = {
      pending: { amount: 0, count: 0 },
      approved: { amount: 0, count: 0 },
      completed: { amount: 0, count: 0 },
      rejected: { amount: 0, count: 0 },
      totalAmount: 0,
      totalCount: 0
    };
    
    summary.forEach(stat => {
      if (stats[stat._id]) {
        stats[stat._id] = {
          amount: stat.totalAmount,
          netAmount: stat.totalNetAmount,
          count: stat.count
        };
      }
      stats.totalAmount += stat.totalAmount;
      stats.totalCount += stat.count;
    });
    
    res.json({
      success: true,
      withdrawals,
      stats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all withdrawals error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch withdrawals',
      error: error.message 
    });
  }
};

// @desc    Update withdrawal status (Admin)
// @route   PUT /api/withdrawals/admin/:id/status
// @access  Private (Admin only)
const updateWithdrawalStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, transactionId, adminNote, rejectionReason } = req.body;
    
    const withdrawal = await Withdrawal.findById(id);
    if (!withdrawal) {
      return res.status(404).json({ 
        success: false, 
        message: 'Withdrawal not found' 
      });
    }
    
    // Validate status transition
    if (withdrawal.status === 'completed' || withdrawal.status === 'rejected') {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot update withdrawal that is already ${withdrawal.status}` 
      });
    }

    const sellerUser = await User.findById(withdrawal.seller);
    if (!sellerUser) return res.status(404).json({ success: false, message: 'Seller not found' });
    
    // Update based on new status
    if (status === 'approved') {
      withdrawal.status = 'approved';
      withdrawal.approvedAt = new Date();
      if (adminNote) withdrawal.adminNote = adminNote;
      if (transactionId) withdrawal.transactionId = transactionId;
      // No balance change yet — stays in pendingWithdrawals until completed
    } 
    else if (status === 'completed') {
      if (withdrawal.status !== 'approved') {
        return res.status(400).json({ 
          success: false, 
          message: 'Withdrawal must be approved before completing' 
        });
      }
      withdrawal.status = 'completed';
      withdrawal.processedAt = new Date();
      if (transactionId) withdrawal.transactionId = transactionId;
      if (adminNote) withdrawal.adminNote = adminNote;

      // Move from pending → totalWithdrawn
      sellerUser.pendingWithdrawals = Math.max(0, (sellerUser.pendingWithdrawals || 0) - withdrawal.amount);
      sellerUser.totalWithdrawn = (sellerUser.totalWithdrawn || 0) + withdrawal.amount;
    }
    else if (status === 'rejected') {
      withdrawal.status = 'rejected';
      withdrawal.rejectedAt = new Date();
      withdrawal.rejectionReason = rejectionReason || 'Request rejected by admin';
      if (adminNote) withdrawal.adminNote = adminNote;

      // Refund the amount back to cashBox and remove from pending
      sellerUser.pendingWithdrawals = Math.max(0, (sellerUser.pendingWithdrawals || 0) - withdrawal.amount);
      sellerUser.cashBox = (sellerUser.cashBox || 0) + withdrawal.amount;
    }
    else {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status. Must be approved, completed, or rejected' 
      });
    }
    
    await withdrawal.save();
    await sellerUser.save();
    await withdrawal.populate('seller', 'name email phoneNumber shopName');
    
    res.json({
      success: true,
      message: `Withdrawal ${status} successfully`,
      withdrawal
    });
  } catch (error) {
    console.error('Update withdrawal status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update withdrawal status: ' + error.message
    });
  }
};

// @desc    Get withdrawal statistics (Admin)
// @route   GET /api/withdrawals/admin/stats
// @access  Private (Admin only)
const getWithdrawalStats = async (req, res) => {
  try {
    const stats = await Withdrawal.aggregate([
      { $group: {
        _id: null,
        totalPending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] } },
        totalApproved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, '$amount', 0] } },
        totalCompleted: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0] } },
        totalRejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, '$amount', 0] } },
        pendingCount: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        completedCount: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        totalServiceCharge: { $sum: '$serviceCharge' }
      }}
    ]);
    
    // Get monthly stats
    const monthlyStats = await Withdrawal.aggregate([
      { $match: { status: 'completed' } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        totalAmount: { $sum: '$amount' },
        totalNetAmount: { $sum: '$netAmount' },
        count: { $sum: 1 }
      }},
      { $sort: { _id: -1 } },
      { $limit: 12 }
    ]);
    
    res.json({
      success: true,
      stats: stats[0] || {
        totalPending: 0,
        totalApproved: 0,
        totalCompleted: 0,
        totalRejected: 0,
        pendingCount: 0,
        completedCount: 0,
        totalServiceCharge: 0
      },
      monthlyStats
    });
  } catch (error) {
    console.error('Get withdrawal stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch statistics',
      error: error.message 
    });
  }
};

// ==================== ROUTES ====================

// Seller routes
router.post('/', protect, seller, createWithdrawal);
router.get('/my', protect, seller, getSellerWithdrawals);

// Admin routes
router.get('/admin/all', protect, admin, getAllWithdrawals);
router.get('/admin/stats', protect, admin, getWithdrawalStats);
router.put('/admin/:id/status', protect, admin, updateWithdrawalStatus);

module.exports = router;