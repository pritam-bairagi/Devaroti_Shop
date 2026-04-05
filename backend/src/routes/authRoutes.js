const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Validation rules
const registerValidation = [
  body('name').notEmpty().withMessage('Name is required').trim(),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phoneNumber').notEmpty().withMessage('Phone number is required'),
  body('role').optional().isIn(['user', 'seller', 'courier']).withMessage('Invalid role')
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
];

const verifyValidation = [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('Valid 6-digit OTP is required')
];

// Public routes
router.post('/register', registerValidation, authController.register);
router.post('/verify', verifyValidation, authController.verifyOTP);
router.post('/resend-otp', authController.resendOTP);
router.post('/login', loginValidation, authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', authController.forgotPassword);
router.put('/reset-password/:token', authController.resetPassword);

// Protected routes
router.get('/me', protect, authController.getMe);
router.put('/change-password', protect, authController.changePassword);
router.post('/logout', protect, authController.logout);
router.get('/check', protect, authController.checkAuth);

// Phone OTP (protected)
router.post('/phone/send-otp', protect, authController.sendPhoneOTP);
router.post('/phone/verify-otp', protect, authController.verifyPhoneOTP);

module.exports = router;