// Protect route - requires authentication
router.get('/profile', protect, getProfile);

// Admin only
router.delete('/user/:id', protect, admin, deleteUser);

// Seller only (approved sellers)
router.get('/products', protect, seller, approvedSeller, getSellerProducts);

// Admin or Seller
router.get('/orders', protect, adminOrSeller, getOrders);

// Flexible role checking
router.post('/admin/action', protect, authorize('admin'), adminAction);

// Optional auth (for public routes that can show user-specific data)
router.get('/public-data', optionalAuth, getPublicData);