const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect, admin } = require('../middleware/authMiddleware');

// bKash
router.post('/bkash/create', protect, paymentController.bkashCreatePayment);
router.post('/bkash/execute', protect, paymentController.bkashExecutePayment);

// Stripe / Card
router.post('/stripe/create-intent', protect, paymentController.stripeCreateIntent);
router.post('/stripe/confirm', protect, paymentController.stripeConfirmPayment);

// FIX: Stripe webhook is registered in server.js BEFORE express.json() with raw body middleware.
// It is intentionally NOT registered here to keep the raw body intact.
// server.js handles: app.use('/api/payment/stripe/webhook', express.raw(...), ...)
// Then it flows to paymentRoutes → this route:
router.post('/stripe/webhook', paymentController.stripeWebhook);

// Bank transfer
router.post('/bank/submit', protect, paymentController.bankTransferSubmit);
router.put('/bank/verify/:orderId', protect, admin, paymentController.verifyBankPayment);
router.get('/bank/accounts', paymentController.getBankAccounts);

module.exports = router;