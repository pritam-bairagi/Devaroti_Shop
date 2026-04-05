const Withdrawal = require('../models/Withdrawal');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// @desc    Create withdrawal request
// @route   POST /api/withdrawals
// @access  Private/Seller
exports.createWithdrawal = async (req, res) => {
  try {
    const { amount, paymentMethod, accountNumber, sellerNote } = req.body;

    if (amount < 100) {
      return res.status(400).json({ success: false, message: 'Minimum withdrawal is 100 Taka' });
    }

    const seller = await User.findById(req.user.id);
    if (seller.cashBox < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance in Cash Box' });
    }

    // Logic: 2% service charge controlled by admin (placeholder for 2% now)
    const serviceCharge = amount * 0.02;
    const netAmount = amount - serviceCharge;

    const withdrawal = await Withdrawal.create({
      seller: req.user.id,
      amount,
      serviceCharge,
      netAmount,
      paymentMethod,
      accountNumber,
      sellerNote
    });

    // Deduct from seller's cashBox and add to pending
    seller.cashBox -= amount;
    seller.pendingWithdrawals += amount;
    await seller.save();

    res.status(201).json({ success: true, withdrawal, message: 'Withdrawal request submitted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get seller withdrawals
// @route   GET /api/withdrawals/seller
// @access  Private/Seller
exports.getSellerWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ seller: req.user.id }).sort('-createdAt');
    res.status(200).json({ success: true, withdrawals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all withdrawals (Admin)
// @route   GET /api/withdrawals/admin
// @access  Private/Admin
exports.getAllWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find().populate('seller', 'name shopName email').sort('-createdAt');
    res.status(200).json({ success: true, withdrawals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Approve/Reject withdrawal (Admin)
// @route   PUT /api/withdrawals/:id/status
// @access  Private/Admin
exports.updateWithdrawalStatus = async (req, res) => {
  try {
    const { status, adminNote, transactionId } = req.body;
    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) return res.status(404).json({ success: false, message: 'Withdrawal not found' });

    if (withdrawal.status !== 'pending') {
        return res.status(400).json({ success: false, message: 'Withdrawal already processed' });
    }

    const seller = await User.findById(withdrawal.seller);

    if (status === 'approved') {
      withdrawal.status = 'approved';
      withdrawal.processedAt = new Date();
      withdrawal.adminNote = adminNote;
      withdrawal.transactionId = transactionId;
      
      seller.pendingWithdrawals -= withdrawal.amount;
      seller.totalWithdrawn += withdrawal.amount;
    } else if (status === 'rejected') {
      withdrawal.status = 'rejected';
      withdrawal.processedAt = new Date();
      withdrawal.adminNote = adminNote;

      // Refund to cashBox
      seller.cashBox += withdrawal.amount;
      seller.pendingWithdrawals -= withdrawal.amount;
    }

    await withdrawal.save();
    await seller.save();

    res.status(200).json({ success: true, withdrawal, message: `Withdrawal ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
