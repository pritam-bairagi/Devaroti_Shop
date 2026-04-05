const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

// All admin routes require authentication + admin role
router.use(protect, admin);

// Dashboard
router.get('/stats', adminController.getStats);
router.get('/analytics', adminController.getAnalytics);
router.get('/logs', adminController.getSystemLogs);
router.get('/inventory', adminController.getInventoryReport);

// User Management
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserDetails);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.put('/approve-seller/:id', adminController.approveSeller);

// Order Management
router.get('/orders', adminController.getAllOrders);
router.put('/orders/:id', adminController.updateOrder);

// Product Management
router.get('/products', adminController.getAllProducts);
router.post('/products', adminController.createProduct);
router.put('/products/:id', adminController.updateProduct);
router.delete('/products/:id', adminController.deleteProduct);

// Transactions
router.get('/transactions', adminController.getTransactions);
router.post('/transactions', adminController.createTransaction);

// Sales & Purchases
router.get('/sales', adminController.getSales);
router.post('/sales', adminController.createSale);
router.get('/purchases', adminController.getPurchases);
router.post('/purchases', adminController.createPurchase);

// System Configuration
router.get('/config', adminController.getSystemConfig);
router.put('/config', adminController.updateSystemConfig);

// Withdrawal Management
router.get('/withdrawals', adminController.getWithdrawalRequests);
router.put('/withdrawals/:id', adminController.updateWithdrawalStatus);

module.exports = router;