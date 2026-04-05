const { body, validationResult } = require('express-validator');

// Common validation rules
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

// Product validation
exports.productValidation = [
  body('name').notEmpty().withMessage('Product name is required').trim(),
  body('description').notEmpty().withMessage('Description is required'),
  body('sellingPrice').isNumeric().withMessage('Valid selling price is required'),
  body('purchasePrice').isNumeric().withMessage('Valid purchase price is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('image').notEmpty().withMessage('Product image is required'),
  body('stock').isInt({ min: 0 }).withMessage('Valid stock is required')
];

// Order validation
exports.orderValidation = [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('shippingAddress.fullName').notEmpty().withMessage('Full name is required'),
  body('shippingAddress.addressLine1').notEmpty().withMessage('Address is required'),
  body('shippingAddress.city').notEmpty().withMessage('City is required'),
  body('shippingAddress.phoneNumber').notEmpty().withMessage('Phone number is required'),
  body('paymentMethod').notEmpty().withMessage('Payment method is required'),
  body('totalPrice').isNumeric().withMessage('Valid total price is required')
];

// User registration validation
exports.registerValidation = [
  body('name').notEmpty().withMessage('Name is required').trim(),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phoneNumber').notEmpty().withMessage('Phone number is required')
];

// Login validation
exports.loginValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
];

// Cart validation
exports.cartValidation = [
  body('productId').notEmpty().withMessage('Product ID is required'),
  body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1')
];