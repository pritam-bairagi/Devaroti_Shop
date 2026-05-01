const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const SystemConfig = require('../models/SystemConfig');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const { syncSellerBalance } = require('../utils/balanceUtils');

// Default fallbacks if not in DB
let VAT_RATE = 0.02; 
let COMMISSION_RATE = 0.05;
let STANDARD_SHIPPING = 110;

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
      items,
      couponDiscount = 0,        // Only the coupon fixed-amount discount from frontend
      couponDeliveryDiscount = 0, // Coupon delivery discount % from frontend
      shippingAddress, paymentMethod,
      deliveryOption = 'standard', deliveryInstructions, orderNotes, paymentDetails
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No order items provided' });
    }

    if (!shippingAddress || !shippingAddress.addressLine1) {
      return res.status(400).json({ success: false, message: 'Shipping address is required' });
    }

    // --- Dynamic Pricing from SystemConfig ---
    const allConfigs = await SystemConfig.find({ 
      key: { $in: [
        'vat_percentage', 'delivery_charge', 'platform_commission_rate',
        'membership_bronze_discount', 'membership_silver_discount', 
        'membership_gold_discount', 'membership_platinum_discount',
        'membership_bronze_delivery_discount', 'membership_silver_delivery_discount',
        'membership_gold_delivery_discount', 'membership_platinum_delivery_discount'
      ] } 
    });
    const configMap = allConfigs.reduce((acc, c) => ({ ...acc, [c.key]: Number(c.value) }), {});

    const platformCommissionRate = configMap.platform_commission_rate !== undefined ? (configMap.platform_commission_rate / 100) : COMMISSION_RATE;
    const vatPercent = configMap.vat_percentage || 2;
    const baseShipping = configMap.delivery_charge !== undefined ? configMap.delivery_charge : 60;

    const processedItems = [];
    let calculatedSubtotal = 0;
    let platformCommission = 0;
    let sellerEarningsTotal = 0;
    const sellersMap = new Map();

    for (const item of items) {
      // FIX: validate ObjectId before querying
      if (!mongoose.Types.ObjectId.isValid(item.product)) {
        return res.status(400).json({ success: false, message: `Invalid product ID: ${item.product}` });
      }

      const product = await Product.findById(item.product);

      if (!product) {
        return res.status(400).json({ success: false, message: `Product not found: ${item.product}` });
      }
      if (product.liveStatus !== 'live') {
        return res.status(400).json({ success: false, message: `${product.name} is not available` });
      }

      const quantity = Number(item.quantity) || 1;

      // RE-CALCULATE PRICE FROM DB (SOURCE OF TRUTH)
      let itemPrice = product.sellingPrice;
      if (item.variant && item.variant.name && product.variants && product.variants.length > 0) {
        const variant = product.variants.find(v => v.name === item.variant.name);
        if (variant && variant.price) {
          itemPrice = variant.price;
        }
      }

      // Stock check for variant specifically
      if (item.variant && item.variant.name && product.variants && product.variants.length > 0) {
        const variant = product.variants.find(v => v.name === item.variant.name);
        if (variant && variant.stock < quantity) {
          return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name} (${variant.name})` });
        }
      } else if (product.stock < quantity) {
        return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}` });
      }

      const purchasePrice = Number(product.purchasePrice) || 0;
      
      const itemTotal = itemPrice * quantity;
      const itemPurchaseTotal = purchasePrice * quantity;
      calculatedSubtotal += itemTotal;

      const commission = itemTotal * platformCommissionRate;
      platformCommission += commission;
      
      // Calculate earnings for seller based purely on selling price minus commission
      const sellerEarning = itemTotal - commission;
      sellerEarningsTotal += sellerEarning;

      processedItems.push({
        product: product._id,
        quantity,
        price: itemPrice,
        purchasePrice: purchasePrice,
        name: product.name,
        image: product.image,
        variant: item.variant,
        seller: product.user
      });

      const sellerId = product.user.toString();
      if (!sellersMap.has(sellerId)) {
        sellersMap.set(sellerId, { sellerId: product.user, items: [], subtotal: 0, commission: 0, sellerEarnings: 0 });
      }
      const sellerData = sellersMap.get(sellerId);
      sellerData.items.push({ productId: product._id, quantity, price: itemPrice });
      sellerData.subtotal += itemTotal;
      sellerData.commission += commission;
      sellerData.sellerEarnings += sellerEarning;
    }

    // Multi-Seller Shipping calculation
    const shippingCostValue = baseShipping * Math.max(1, sellersMap.size);

    // ── Membership Discounts (single source of truth — computed by backend only) ──
    const userObj = await User.findById(req.user.id);
    const mLevel = userObj?.membershipLevel?.toLowerCase() || 'bronze';
    const mDiscountPercent = configMap[`membership_${mLevel}_discount`] || 0;
    const membershipDiscountAmount = (calculatedSubtotal * mDiscountPercent) / 100;

    // Delivery discount: membership delivery % + coupon delivery % (capped at 100%)
    const mDeliveryDiscountPercent = configMap[`membership_${mLevel}_delivery_discount`] || 0;
    const totalDeliveryDiscountPercent = Math.min(
      100,
      mDeliveryDiscountPercent + (Number(couponDeliveryDiscount) || 0)
    );
    const deliveryDiscountAmount = (shippingCostValue * totalDeliveryDiscountPercent) / 100;

    // Final shipping after delivery discount
    const finalShipping = shippingCostValue - deliveryDiscountAmount;

    // Coupon product discount (fixed amount from validated coupon)
    const couponDiscountNum = Number(couponDiscount) || 0;

    // Total product discount = coupon + membership
    const totalProductDiscount = couponDiscountNum + membershipDiscountAmount;

    // VAT is calculated on the subtotal (before discount), matching the cart display
    const vatAmount = calculatedSubtotal * (vatPercent / 100);

    // Final total: subtotal + vat + shipping(after delivery discount) - product discounts
    const totalPrice = Math.max(
      0,
      calculatedSubtotal + vatAmount + finalShipping - totalProductDiscount
    );

    const isCOD = paymentMethod === 'Cash on Delivery' || paymentMethod === 'cash';
    const paymentStatus = isCOD ? 'pending' : 'processing';

    if (!isCOD && (!paymentDetails || !paymentDetails.transactionId)) {
      return res.status(400).json({
        success: false,
        message: 'Payment transaction ID is required for online payments'
      });
    }

    const order = new Order({
      user: req.user.id,
      items: processedItems,
      subtotal: calculatedSubtotal,
      discount: totalProductDiscount,        // Stored: coupon + membership (product discounts only)
      vat: vatPercent,
      vatAmount,
      shippingCost: finalShipping,           // Stored: shipping after delivery discount applied
      totalPrice,
      shippingAddress: {
        fullName: shippingAddress.fullName || req.user.name,
        addressLine1: shippingAddress.addressLine1,
        addressLine2: shippingAddress.addressLine2 || '',
        city: shippingAddress.city,
        state: shippingAddress.state || '',
        postalCode: shippingAddress.postalCode || '',
        country: 'Bangladesh',
        phoneNumber: shippingAddress.phoneNumber || req.user.phoneNumber
      },
      billingAddress: shippingAddress,
      paymentMethod,
      deliveryOption,
      deliveryInstructions,
      orderNotes,
      paymentStatus,
      isPaid: !isCOD && !!paymentDetails,
      paidAt: !isCOD && paymentDetails ? new Date() : null,
      paymentDetails: paymentDetails
        ? {
            transactionId: paymentDetails.transactionId,
            gateway: paymentDetails.gateway || paymentMethod,
            paymentDate: new Date(),
            reference: paymentDetails.reference
          }
        : null,
      platformCommission,
      sellerEarnings: sellerEarningsTotal,
      sellers: Array.from(sellersMap.values()),
      adminConfirmedPayment: isCOD, // COD is pre-confirmed for flow, online needs admin check
      statusHistory: [{ status: 'pending', date: new Date(), note: 'Order placed successfully' }]
    });

    await order.save();

    // Decrease stock
    for (const item of processedItems) {
      const product = await Product.findById(item.product);
      if (product) {
        // Update total product stock
        product.stock -= item.quantity;
        product.soldCount += item.quantity;

        // Update variant stock if applicable
        if (item.variant && item.variant.name && product.variants && product.variants.length > 0) {
          const vIndex = product.variants.findIndex(v => v.name === item.variant.name);
          if (vIndex !== -1) {
            product.variants[vIndex].stock -= item.quantity;
          }
        }
        await product.save();
      }
    }

    // Clear user cart & update stats
    await User.findByIdAndUpdate(req.user.id, {
      $set: { cart: [] },
      $inc: { totalSpent: totalPrice, orderCount: 1 }
    });

    if (!isCOD) {
      await Transaction.create({
        type: 'Cash In',
        amount: totalPrice,
        description: `Order payment: ${order.orderNumber}`,
        category: 'sales',
        reference: order.orderNumber,
        referenceId: order._id,
        referenceModel: 'Order',
        paymentMethod,
        status: 'completed',
        user: req.user.id
      });
    }

    const populatedOrder = await Order.findById(order._id)
      .populate('user', 'name email phoneNumber')
      .populate('items.product', 'name image sellingPrice');

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order: populatedOrder
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, message: 'Failed to create order: ' + error.message });
  }
};

// @desc    Get user orders
// @route   GET /api/orders/my-orders
// @access  Private
exports.getMyOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    let query = { user: req.user.id };
    if (status) query.status = status;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('items.product', 'name image sellingPrice')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Order.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      orders,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
    });
  } catch (error) {
    console.error('Get my orders error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch orders: ' + error.message });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phoneNumber profilePic')
      .populate('items.product', 'name image sellingPrice description')
      .populate('items.seller', 'name shopName phoneNumber')
      .populate('statusHistory.updatedBy', 'name role');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const isOwner = order.user._id.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    const isSeller = order.sellers.some(s => s.sellerId.toString() === req.user.id);

    if (!isOwner && !isAdmin && !isSeller) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch order: ' + error.message });
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (!['pending', 'confirmed', 'processing'].includes(order.status)) {
      return res.status(400).json({ success: false, message: `Cannot cancel ${order.status} order` });
    }

    // Restore stock and user stats
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock += item.quantity;
        product.soldCount -= item.quantity;

        if (item.variant && item.variant.name && product.variants && product.variants.length > 0) {
          const vIndex = product.variants.findIndex(v => v.name === item.variant.name);
          if (vIndex !== -1) {
            product.variants[vIndex].stock += item.quantity;
          }
        }
        await product.save();
      }
    }

    await User.findByIdAndUpdate(req.user.id, {
      $inc: { totalSpent: -order.totalPrice, orderCount: -1 }
    });

    order.status = 'cancelled';
    order.cancellationReason = req.body.reason || 'Cancelled by customer';
    order.statusHistory.push({
      status: 'cancelled',
      date: new Date(),
      note: req.body.reason || 'Cancelled by customer',
      updatedBy: req.user.id
    });

    await order.save();

    res.status(200).json({ success: true, message: 'Order cancelled successfully', order });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel order: ' + error.message });
  }
};

// @desc    Track order (public)
// @route   GET /api/orders/track/:orderNumber
// @access  Public
exports.trackOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber })
      .select('orderNumber status statusHistory trackingNumber courier estimatedDeliveryDate actualDeliveryDate shippingAddress')
      .populate('items.product', 'name image');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    res.status(200).json({ success: true, tracking: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to track order: ' + error.message });
  }
};

// @desc    Update order status (Admin/Seller)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin/Seller
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, trackingNumber, courier, note } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (req.user.role === 'seller') {
      const isSeller = order.sellers.some(s => s.sellerId.toString() === req.user.id);
      if (!isSeller) return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (status) order.status = status;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (courier) order.courier = courier;

    // Auto-confirm payment for COD on delivery
    if (status === 'delivered' && (order.paymentMethod === 'Cash on Delivery' || order.paymentMethod === 'cash')) {
      order.paymentStatus = 'paid';
      order.isPaid = true;
      order.paidAt = new Date();

      await Transaction.create({
        type: 'Cash In',
        amount: order.totalPrice,
        description: `COD collected: ${order.orderNumber}`,
        category: 'sales',
        reference: order.orderNumber,
        referenceId: order._id,
        referenceModel: 'Order',
        paymentMethod: 'cash',
        status: 'completed',
        user: req.user.id
      });
    }

    order.statusHistory.push({
      status: status || order.status,
      date: new Date(),
      note: note || `Updated by ${req.user.role}`,
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

    res.status(200).json({ success: true, message: 'Order status updated', order });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update order status: ' + error.message });
  }
};

// @desc    Get seller orders
// @route   GET /api/orders/seller/list
// @access  Private/Seller
exports.getSellerOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const sellerId = new mongoose.Types.ObjectId(req.user.id);

    const query = { 'sellers.sellerId': sellerId, adminConfirmedPayment: true }; // Only confirmed by admin
    if (status) query.status = status;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('user', 'name email phoneNumber')
        .populate('items.product', 'name image')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Order.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      orders,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
    });
  } catch (error) {
    console.error('Get seller orders error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch seller orders: ' + error.message });
  }
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders/admin/all
// @access  Private/Admin
exports.getAllOrders = async (req, res) => {
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
    if (search) query.$or = [{ orderNumber: { $regex: search, $options: 'i' } }];

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('user', 'name email phoneNumber')
        .populate('items.product', 'name image')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Order.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      orders,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch orders: ' + error.message });
  }
};

// @desc    Admin confirms order payment (Manual flow)
// @route   PUT /api/orders/admin/:id/confirm-payment
// @access  Private/Admin
exports.adminConfirmOrderPayment = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.adminConfirmedPayment = true;
    order.adminConfirmedAt = new Date();
    order.paymentStatus = 'paid';
    order.isPaid = true;
    order.paidAt = new Date();

    order.statusHistory.push({
      status: order.status,
      date: new Date(),
      note: 'Payment confirmed by Admin',
      updatedBy: req.user.id
    });

    await order.save();

    // Notify sellers via Socket.io
    const socketAction = require('../utils/socketAction');
    order.sellers.forEach(s => {
      socketAction.emitToUser(s.sellerId.toString(), 'new_order_confirmed', {
        orderId: order._id,
        orderNumber: order.orderNumber
      });
    });

    res.status(200).json({ success: true, message: 'Payment confirmed. Order now visible to sellers.', order });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ success: false, message: 'Failed to confirm payment: ' + error.message });
  }
};

// @desc    Admin fails order payment (Manual flow)
// @route   PUT /api/orders/admin/:id/fail-payment
// @access  Private/Admin
exports.adminFailOrderPayment = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.adminConfirmedPayment = false;
    order.paymentStatus = 'failed';
    order.isPaid = false;

    order.statusHistory.push({
      status: order.status,
      date: new Date(),
      note: 'Payment marked as failed by Admin',
      updatedBy: req.user.id
    });

    await order.save();

    res.status(200).json({ success: true, message: 'Payment marked as failed.', order });
  } catch (error) {
    console.error('Fail payment error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark payment as failed: ' + error.message });
  }
};