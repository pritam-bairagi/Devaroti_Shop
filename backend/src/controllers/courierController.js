const Order = require('../models/Order');
const User = require('../models/User');

// @desc    Get all deliveries assigned to a courier (or available)
// @route   GET /api/courier/deliveries
// @access  Private/Courier
exports.getDeliveries = async (req, res, next) => {
  try {
    // Usually a courier sees orders where status >= 'shipped'
    // For now, let's fetch orders that are shipped, out-for-delivery, or delivered
    const deliveries = await Order.find({
      status: { $in: ['shipped', 'out-for-delivery', 'delivered'] }
      // Could also filter by assignment: courierId: req.user._id
    })
      .populate('user', 'name email phoneNumber')
      .populate('orderItems.product', 'name seller')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: deliveries.length,
      data: deliveries
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status
// @route   PUT /api/courier/deliveries/:id/status
// @access  Private/Courier
exports.updateDeliveryStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['out-for-delivery', 'delivered'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status update' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status === 'delivered') {
      return res.status(400).json({ success: false, message: 'Order is already delivered' });
    }

    order.status = status;
    
    // If delivered, mark paymentStatus as paid if it was cash on delivery
    // Though we require admin verification now, so maybe we leave paymentStatus alone
    
    await order.save();

    // Trigger socket event for real-time tracking
    const io = require('../../server').io;
    if (io) {
      io.emit('order_status_updated', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: order.status
      });
    }

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get courier stats
// @route   GET /api/courier/stats
// @access  Private/Courier
exports.getCourierStats = async (req, res, next) => {
  try {
    // For now returning mock stats or calculated stats
    const totalDeliveries = await Order.countDocuments({ status: 'delivered' });
    const pendingTasks = await Order.countDocuments({ status: { $in: ['shipped', 'out-for-delivery'] } });
    
    res.status(200).json({
      success: true,
      data: {
        totalDeliveries,
        pendingTasks,
        totalEarnings: totalDeliveries * 60 // Dummy earning logic: 60tk per delivery
      }
    });
  } catch (error) {
    next(error);
  }
};
