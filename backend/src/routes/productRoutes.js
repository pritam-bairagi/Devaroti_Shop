const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const productController = require('../controllers/productController');
const { protect, admin, adminOrSeller } = require('../middleware/authMiddleware');
const { upload, handleUploadError } = require('../middleware/uploadMiddleware');

const productValidation = [
  body('name').notEmpty().withMessage('Product name is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('sellingPrice').isNumeric().withMessage('Valid selling price is required'),
  body('purchasePrice').isNumeric().withMessage('Valid purchase price is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('image').notEmpty().withMessage('Product image is required'),
  body('stock').isInt({ min: 0 }).withMessage('Valid stock is required')
];

// FIX: Specific static routes must come BEFORE parameterised /:id
// Otherwise Express matches 'categories', 'featured', 'seller' as :id values

// Public routes
router.get('/', productController.getProducts);
router.get('/categories/all', productController.getCategories);
router.get('/featured', productController.getFeaturedProducts);

// Protected seller/admin routes (static paths — before /:id)
router.get('/seller', protect, adminOrSeller, productController.getSellerProducts);

// Admin only
router.post('/bulk', protect, admin, productController.bulkImport);

// Parameterised public route
router.get('/:id', productController.getProductById);

// Protected parameterised routes
router.post('/', protect, adminOrSeller, productValidation, productController.createProduct);
router.put('/:id', protect, adminOrSeller, productController.updateProduct);
router.delete('/:id', protect, adminOrSeller, productController.deleteProduct);
router.put('/:id/stock', protect, adminOrSeller, productController.updateStock);

module.exports = router;