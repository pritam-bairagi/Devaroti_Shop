const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Review = require('../models/Review');
const mongoose = require('mongoose');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -otp -otpExpire -resetPasswordToken -resetPasswordExpires')
      .populate({
        path: 'cart.product',
        select: 'name price sellingPrice image stock category liveStatus user',
        populate: { path: 'user', select: 'name shopName' }
      })
      .populate({
        path: 'favorites',
        select: 'name price sellingPrice image stock category liveStatus user',
        populate: { path: 'user', select: 'name shopName' }
      });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const [orderStats, reviewCount] = await Promise.all([
      Order.aggregate([
        { $match: { user: user._id } },
        { $group: {
            _id: null,
            totalOrders:    { $sum: 1 },
            totalSpent:     { $sum: '$totalPrice' },
            pendingOrders:  { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
            deliveredOrders:{ $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } }
          }}
      ]),
      Review.countDocuments({ userId: user._id })
    ]);

    res.status(200).json({
      success: true,
      user,
      stats: {
        totalOrders:     orderStats[0]?.totalOrders    || 0,
        totalSpent:      orderStats[0]?.totalSpent     || 0,
        pendingOrders:   orderStats[0]?.pendingOrders  || 0,
        deliveredOrders: orderStats[0]?.deliveredOrders|| 0,
        totalReviews:    reviewCount
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch profile: ' + error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const updates = {};
    const updateFields = [
      'name', 'phoneNumber', 'address', 'location',
      'bio', 'profilePic', 'shopName', 'shopDescription',
      'paymentMethod', 'paymentDetails'
    ];
    
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (req.body.email && req.body.email !== user.email) {
      const existingUser = await User.findOne({ email: req.body.email });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email already in use' });
      }
      updates.email = req.body.email;
      updates.isEmailVerified = false;
    }

    await User.findByIdAndUpdate(user._id, { $set: updates }, { new: false });

    const updatedUser = await User.findById(user._id)
      .select('-password -otp -otpExpire -resetPasswordToken -resetPasswordExpires')
      .populate({ path: 'cart.product', select: 'name price mrp sellingPrice image stock category user', populate: { path: 'user', select: 'name shopName' } })
      .populate({ path: 'favorites', select: 'name price mrp sellingPrice image stock category user', populate: { path: 'user', select: 'name shopName' } });

    res.status(200).json({ success: true, message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Update profile error:', error);
    const message = error.name === 'ValidationError' 
      ? Object.values(error.errors).map(val => val.message).join(', ')
      : error.message || 'Failed to update profile';
    res.status(400).json({ success: false, message });
  }
};

// @desc    Add to cart
// @route   POST /api/users/cart
// @access  Private
// FIX: "Failed to add to cart" was caused by:
//   1. productId not validated as ObjectId before DB query
//   2. liveStatus check — seeded products need liveStatus:'live'
//   3. mongoose $inc on user.save() sometimes triggering validation errors on address sub-docs
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1, variant } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    // FIX: validate ObjectId format first
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }

    const qty = Number(quantity);
    if (isNaN(qty) || qty < 1) {
      return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // FIX: check liveStatus without being strict — archived products should be blocked
    if (product.liveStatus === 'archived') {
      return res.status(400).json({ success: false, message: 'This product is no longer available' });
    }

    if (product.stock < qty) {
      return res.status(400).json({ success: false, message: `Only ${product.stock} units available` });
    }

    // FIX: use findByIdAndUpdate with $set on cart array to avoid triggering
    //      address sub-document validators on the full user save
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const cartItemIndex = user.cart.findIndex(
      item => item.product && item.product.toString() === productId && 
              ((!variant && !item.variant?.name) || (variant?.name === item.variant?.name))
    );

    const variantPrice = (variant && variant.name) 
      ? product.variants.find(v => v.name === variant.name)?.price 
      : null;
    const finalPrice = variantPrice || product.sellingPrice;

    // Get stock for specific variant if applicable
    let availableStock = product.stock;
    if (variant && variant.name) {
      const v = product.variants.find(v => v.name === variant.name);
      if (v) availableStock = v.stock;
    }

    if (cartItemIndex > -1) {
      const newQty = user.cart[cartItemIndex].quantity + qty;
      if (availableStock < newQty) {
        return res.status(400).json({ success: false, message: `Only ${availableStock} units available for this variant` });
      }
      user.cart[cartItemIndex].quantity = newQty;
      user.cart[cartItemIndex].price = finalPrice;
    } else {
      if (availableStock < qty) {
        return res.status(400).json({ success: false, message: `Only ${availableStock} units available for this variant` });
      }
      user.cart.push({ product: productId, quantity: qty, variant, price: finalPrice });
    }

    // FIX: save only cart field using $set to bypass address validators
    await User.findByIdAndUpdate(req.user.id, { $set: { cart: user.cart } });

    const updatedUser = await User.findById(req.user.id)
      .populate({ 
        path: 'cart.product', 
        select: 'name price sellingPrice image stock category user', 
        populate: { path: 'user', select: 'name shopName' } 
      });

    res.status(200).json({
      success: true,
      message: 'Product added to cart',
      cart: updatedUser.cart
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ success: false, message: 'Failed to add to cart: ' + error.message });
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/users/cart/:productId
// @access  Private
exports.updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const { cartItemId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(cartItemId)) {
      return res.status(400).json({ success: false, message: 'Invalid cart item ID' });
    }

    const qty = Number(quantity);
    if (!qty || qty < 1) {
      return res.status(400).json({ success: false, message: 'Valid quantity is required' });
    }

    const user = await User.findById(req.user.id);
    const cartItem = user.cart.id(cartItemId);

    if (!cartItem) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }

    const product = await Product.findById(cartItem.product);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product no longer exists' });
    }

    // CHECK VARIANT STOCK IF APPLICABLE
    if (cartItem.variant && cartItem.variant.name) {
      const variant = product.variants.find(v => v.name === cartItem.variant.name);
      if (variant && variant.stock < qty) {
        return res.status(400).json({ success: false, message: `Only ${variant.stock} units of ${variant.name} available` });
      }
    } else if (product.stock < qty) {
      return res.status(400).json({ success: false, message: `Only ${product.stock} units available` });
    }

    cartItem.quantity = qty;
    
    // Update price too just in case it changed in DB
    const variantPrice = (cartItem.variant && cartItem.variant.name) 
      ? product.variants.find(v => v.name === cartItem.variant.name)?.price 
      : null;
    cartItem.price = variantPrice || product.sellingPrice;

    // FIX: use atomic update to avoid sub-document validation issues
    await User.findByIdAndUpdate(req.user.id, { $set: { cart: user.cart } });

    const updatedUser = await User.findById(req.user.id)
      .populate({ 
        path: 'cart.product', 
        select: 'name price sellingPrice image stock category user', 
        populate: { path: 'user', select: 'name shopName' } 
      });

    res.status(200).json({ success: true, message: 'Cart updated', cart: updatedUser.cart });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ success: false, message: 'Failed to update cart: ' + error.message });
  }
};

// @desc    Remove from cart
// @route   DELETE /api/users/cart/:productId
// @access  Private
exports.removeFromCart = async (req, res) => {
  try {
    const { cartItemId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(cartItemId)) {
      return res.status(400).json({ success: false, message: 'Invalid cart item ID' });
    }

    const user = await User.findById(req.user.id);
    user.cart.pull(cartItemId);

    await User.findByIdAndUpdate(req.user.id, { $set: { cart: user.cart } });

    const updatedUser = await User.findById(req.user.id)
      .populate({ 
        path: 'cart.product', 
        select: 'name price sellingPrice image stock category user', 
        populate: { path: 'user', select: 'name shopName' } 
      });

    res.status(200).json({ success: true, message: 'Item removed from cart', cart: updatedUser.cart });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove from cart: ' + error.message });
  }
};

// @desc    Clear cart
// @route   DELETE /api/users/cart
// @access  Private
exports.clearCart = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { $set: { cart: [] } });
    res.status(200).json({ success: true, message: 'Cart cleared', cart: [] });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ success: false, message: 'Failed to clear cart: ' + error.message });
  }
};

// @desc    Toggle favorite
// @route   POST /api/users/favorites/:productId
// @access  Private
exports.toggleFavorite = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const user = await User.findById(req.user.id);
    const index = user.favorites.findIndex(id => id.toString() === productId);
    let message;

    if (index > -1) {
      user.favorites.splice(index, 1);
      message = 'Removed from favorites';
    } else {
      user.favorites.push(productId);
      message = 'Added to favorites';
    }

    await User.findByIdAndUpdate(req.user.id, { $set: { favorites: user.favorites } });

    const updatedUser = await User.findById(req.user.id)
      .populate({ path: 'favorites', select: 'name price mrp sellingPrice image stock category user', populate: { path: 'user', select: 'name shopName' } });

    res.status(200).json({ success: true, message, favorites: updatedUser.favorites });
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ success: false, message: 'Failed to update favorites: ' + error.message });
  }
};

// @desc    Get favorites
// @route   GET /api/users/favorites
// @access  Private
exports.getFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({ path: 'favorites', select: 'name price mrp sellingPrice image stock category liveStatus user', populate: { path: 'user', select: 'name shopName' } });

    res.status(200).json({ success: true, favorites: user.favorites });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch favorites: ' + error.message });
  }
};

// @desc    Add shipping address
// @route   POST /api/users/address
// @access  Private
exports.addAddress = async (req, res) => {
  try {
    // FIX: Handle both nested { address: {...} } and flat {...} payloads
    const address = req.body.address || req.body;
    
    // Basic validation to distinguish between a flat object and an empty body
    if (!address || (!address.addressLine1 && !address.name)) {
      return res.status(400).json({ success: false, message: 'Address details are required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // If it's the first address, make it default
    if (user.addresses.length === 0) address.isDefault = true;
    else if (address.isDefault) {
      user.addresses.forEach(a => a.isDefault = false);
    }

    user.addresses.push(address);
    await user.save();

    res.status(200).json({ success: true, message: 'Address added', addresses: user.addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add address: ' + error.message });
  }
};

// @desc    Update shipping address
// @route   PUT /api/users/address/:addressId
// @access  Private
exports.updateAddress = async (req, res) => {
  try {
    // FIX: Handle both nested { address: {...} } and flat {...} payloads
    const address = req.body.address || req.body;
    const { addressId } = req.params;

    if (!address || (!address.addressLine1 && !address.name)) {
      return res.status(400).json({ success: false, message: 'Updated address details are required' });
    }

    const user = await User.findById(req.user.id);
    const index = user.addresses.findIndex(a => a._id.toString() === addressId);
    if (index === -1) return res.status(404).json({ success: false, message: 'Address not found' });

    if (address.isDefault) {
      user.addresses.forEach(a => a.isDefault = false);
    }

    user.addresses[index] = { ...user.addresses[index].toObject(), ...address };
    await user.save();

    res.status(200).json({ success: true, message: 'Address updated', addresses: user.addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update address: ' + error.message });
  }
};

// @desc    Delete shipping address
// @route   DELETE /api/users/address/:addressId
// @access  Private
exports.deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const user = await User.findById(req.user.id);
    
    user.addresses = user.addresses.filter(a => a._id.toString() !== addressId);
    
    // If we deleted the default, make another one default if available
    if (user.addresses.length > 0 && !user.addresses.some(a => a.isDefault)) {
      user.addresses[0].isDefault = true;
    }
    
    await user.save();
    res.status(200).json({ success: true, message: 'Address deleted', addresses: user.addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete address: ' + error.message });
  }
};

// @desc    Set default shipping address
// @route   PUT /api/users/address/:addressId/default
// @access  Private
exports.setDefaultAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const user = await User.findById(req.user.id);
    
    const exists = user.addresses.some(a => a._id.toString() === addressId);
    if (!exists) return res.status(404).json({ success: false, message: 'Address not found' });

    user.addresses.forEach(a => {
      a.isDefault = a._id.toString() === addressId;
    });

    await user.save();
    res.status(200).json({ success: true, message: 'Default address updated', addresses: user.addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to set default address: ' + error.message });
  }
};

// @desc    Get all addresses
// @route   GET /api/users/addresses
// @access  Private
exports.getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('addresses');
    res.status(200).json({ success: true, addresses: user.addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user by ID (admin only)
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUserById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    const user = await User.findById(req.params.id)
      .select('-password -otp -otpExpire -resetPasswordToken -resetPasswordExpires')
      .populate({ path: 'cart.product', select: 'name price mrp sellingPrice image stock category user', populate: { path: 'user', select: 'name shopName' } })
      .populate('favorites');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const orderStats = await Order.aggregate([
      { $match: { user: user._id } },
      { $group: { _id: null, totalOrders: { $sum: 1 }, totalSpent: { $sum: '$totalPrice' } } }
    ]);

    res.status(200).json({
      success: true,
      user,
      stats: {
        totalOrders: orderStats[0]?.totalOrders || 0,
        totalSpent:  orderStats[0]?.totalSpent  || 0
      }
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user: ' + error.message });
  }
};

// @desc    Deactivate user account
// @route   DELETE /api/users/account
// @access  Private
exports.deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const pendingOrders = await Order.findOne({
      user: user._id,
      status: { $in: ['pending', 'confirmed', 'processing'] }
    });

    if (pendingOrders) {
      return res.status(400).json({ success: false, message: 'Cannot delete account with pending orders' });
    }

    user.isActive = false;
    user.deactivatedAt = new Date();
    await user.save();

    res.status(200).json({ success: true, message: 'Account deactivated successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete account: ' + error.message });
  }
};