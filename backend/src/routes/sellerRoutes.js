// routes/sellerRoutes.js
const express = require('express');
const router = express.Router();
const { protect, seller, approvedSeller } = require('../middleware/authMiddleware');
const sellerController = require('../controllers/sellerController');
const {
  getSellerStats, getSellerProfile, updateSellerProfile, getSellerEarnings, syncBalance,
  getSellerProducts, createSellerProduct, updateSellerProduct, deleteSellerProduct,
  getSellerOrders, updateSellerOrder,
  getSellerCustomers,
  requestWithdrawal, getSellerTransactions,
  getSellerSales, createSellerSale, updateSellerSale, deleteSellerSale,
  getSellerPurchases, createSellerPurchase,
  createSellerTransaction, getSellerWithdrawals} = require('../controllers/sellerController');

// All seller routes require authentication + seller role + seller approval
router.use(protect, seller, approvedSeller);

// ==================== DASHBOARD & STATS ====================
router.get('/stats', getSellerStats);
router.get('/profile', getSellerProfile);
router.put('/profile', updateSellerProfile);
router.get('/earnings', getSellerEarnings);
router.get('/sync-balance', syncBalance);

// ==================== PRODUCT MANAGEMENT ====================
router.get('/products', getSellerProducts);
router.post('/products', createSellerProduct);
router.put('/products/:id', updateSellerProduct);
router.delete('/products/:id', deleteSellerProduct);

// ==================== ORDER MANAGEMENT ====================
router.get('/orders', getSellerOrders);
router.put('/orders/:id', updateSellerOrder);

// ==================== CUSTOMERS ====================
router.get('/customers', getSellerCustomers);

// ==================== WITHDRAWALS ====================
router.post('/withdraw', requestWithdrawal);
router.get('/withdrawals', getSellerWithdrawals);

// ==================== SALES (In-shop offline/direct sales) ====================
router.get('/sales', getSellerSales);
router.post('/sales', createSellerSale);
router.put('/sales/:id', updateSellerSale);
router.delete('/sales/:id', deleteSellerSale);

// ==================== PURCHASES (In-shop inventory purchases) ====================
router.get('/purchases', getSellerPurchases);
router.post('/purchases', createSellerPurchase);

// ==================== TRANSACTIONS ====================
router.get('/transactions', getSellerTransactions);
router.post('/transactions', createSellerTransaction);

// ==================== CHATS ====================
// These are currently handled by the universal ChatController for better consistency
// but keeping these here for backward compatibility or seller-specific filtering if needed.
const { getChats } = require('../controllers/chatController');
router.get('/chats', getChats);

module.exports = router;