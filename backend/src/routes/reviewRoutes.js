const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Review = require('../models/Review');
const Order = require('../models/Order');
const { protect, admin } = require('../middleware/authMiddleware');

// @desc    Get product reviews
// @route   GET /api/reviews/product/:productId
// @access  Public
router.get('/product/:productId', async (req, res) => {
  try {
    // FIX: validate ObjectId before using it in aggregation
    if (!mongoose.Types.ObjectId.isValid(req.params.productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }

    const { page = 1, limit = 10, sort = 'newest' } = req.query;

    let sortOption = { createdAt: -1 };
    if (sort === 'highest') sortOption = { rating: -1 };
    if (sort === 'lowest') sortOption = { rating: 1 };
    if (sort === 'helpful') sortOption = { 'helpful.count': -1 };

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const productObjectId = new mongoose.Types.ObjectId(req.params.productId);

    const [reviews, total, stats] = await Promise.all([
      Review.find({ productId: req.params.productId, approved: true })
        .populate('userId', 'name profilePic level')
        .sort(sortOption)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Review.countDocuments({ productId: req.params.productId, approved: true }),
      Review.aggregate([
        { $match: { productId: productObjectId, approved: true } },
        { $group: {
            _id: null,
            avgRating: { $avg: '$rating' },
            total: { $sum: 1 },
            five:  { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
            four:  { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
            three: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
            two:   { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
            one:   { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } }
          }}
      ])
    ]);

    res.status(200).json({
      success: true,
      reviews,
      stats: stats[0] || { avgRating: 0, total: 0, five: 0, four: 0, three: 0, two: 0, one: 0 },
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch reviews' });
  }
});

// @desc    Create review
// @route   POST /api/reviews
// @access  Private
router.post(
  '/',
  protect,
  [
    body('productId').notEmpty().withMessage('Product ID is required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').notEmpty().withMessage('Comment is required')
  ],
  async (req, res) => {
    try {
      // FIX: run express-validator checks
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { productId, rating, comment, title, orderId } = req.body;

      const existing = await Review.findOne({ productId, userId: req.user.id });
      if (existing) {
        return res.status(400).json({ success: false, message: 'You already reviewed this product' });
      }

      // Verify purchase if orderId provided
      let verifiedPurchase = false;
      if (orderId) {
        const order = await Order.findOne({
          _id: orderId,
          user: req.user.id,
          status: 'delivered',
          'items.product': productId
        });
        verifiedPurchase = !!order;
      }

      const review = await Review.create({
        productId,
        userId: req.user.id,
        userName: req.user.name,
        userProfilePic: req.user.profilePic,
        rating,
        comment,
        title,
        orderId,
        verifiedPurchase,
        approved: true
      });

      res.status(201).json({ success: true, message: 'Review added', review });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({ success: false, message: 'You already reviewed this product' });
      }
      console.error('Create review error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// @desc    Mark review as helpful
// @route   PUT /api/reviews/:id/helpful
// @access  Private
router.put('/:id/helpful', protect, async (req, res) => {
  try {
    // FIX: validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid review ID' });
    }

    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

    // FIX: compare as strings
    const alreadyMarked = review.helpful.users.some(uid => uid.toString() === req.user.id);

    if (alreadyMarked) {
      review.helpful.users.pull(req.user.id);
      review.helpful.count = Math.max(0, review.helpful.count - 1);
    } else {
      review.helpful.users.push(req.user.id);
      review.helpful.count += 1;
    }

    await review.save();

    res.status(200).json({
      success: true,
      helpful: review.helpful.count,
      marked: !alreadyMarked
    });
  } catch (error) {
    console.error('Mark helpful error:', error);
    res.status(500).json({ success: false, message: 'Failed to update' });
  }
});

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    // FIX: validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid review ID' });
    }

    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

    if (review.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await review.deleteOne();
    res.status(200).json({ success: true, message: 'Review deleted' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete review' });
  }
});

module.exports = router;