const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

// Validation rules
const cartValidation = [
  body('productId').notEmpty().withMessage('Product ID is required'),
  body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1')
];

const profileValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email required'),
  body('phoneNumber').optional(),
  body('address').optional()
];

// Profile
router.get('/profile', protect, userController.getProfile);
router.put('/profile', protect, profileValidation, userController.updateProfile);

// Cart — FIX: DELETE /cart must come BEFORE DELETE /cart/:productId
// to avoid Express matching 'cart' as a productId param
router.delete('/cart', protect, userController.clearCart);
router.post('/cart', protect, cartValidation, userController.addToCart);
router.put('/cart/:cartItemId', protect, userController.updateCartItem);
router.delete('/cart/:cartItemId', protect, userController.removeFromCart);

// Favorites
router.get('/favorites', protect, userController.getFavorites);
router.post('/favorites/:productId', protect, userController.toggleFavorite);

// Address
router.get('/addresses', protect, userController.getAddresses);
router.post('/address', protect, userController.addAddress);
router.put('/address/:addressId', protect, userController.updateAddress);
router.delete('/address/:addressId', protect, userController.deleteAddress);
router.put('/address/:addressId/default', protect, userController.setDefaultAddress);

// Account management
router.delete('/account', protect, userController.deleteAccount);

// Admin only — must be LAST to avoid matching other routes as :id
router.get('/:id', protect, admin, userController.getUserById);

module.exports = router;