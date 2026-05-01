const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const orderController = require('../controllers/orderController');
const { protect, seller, admin, adminOrSeller } = require('../middleware/authMiddleware');

const orderValidation = [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('shippingAddress').notEmpty().withMessage('Shipping address is required'),
  body('shippingAddress.addressLine1').notEmpty().withMessage('Address line 1 is required'),
  body('shippingAddress.city').notEmpty().withMessage('City is required'),
  body('paymentMethod').notEmpty().withMessage('Payment method is required')
];

// FIX: Static routes must come BEFORE parameterised /:id routes
// to avoid Express treating 'my-orders', 'seller', 'admin', 'track' as order IDs

// Public
router.get('/track/:orderNumber', orderController.trackOrder);

// Admin only (static — before /:id)
router.get('/admin/all', protect, admin, orderController.getAllOrders);
router.put('/admin/:id/confirm-payment', protect, admin, orderController.adminConfirmOrderPayment);
router.put('/admin/:id/fail-payment', protect, admin, orderController.adminFailOrderPayment);

// Seller (static — before /:id)
router.get('/seller/list', protect, seller, orderController.getSellerOrders);
router.put('/seller/:id/status', protect, adminOrSeller, orderController.updateOrderStatus);

// User (static — before /:id)
router.get('/my-orders', protect, orderController.getMyOrders);

// User parameterised
router.post('/', protect, orderValidation, orderController.createOrder);
router.get('/:id', protect, orderController.getOrderById);
router.put('/:id/cancel', protect, orderController.cancelOrder);

// Admin/Seller parameterised
router.put('/:id/status', protect, adminOrSeller, orderController.updateOrderStatus);

module.exports = router;