// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify token
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id)
        .select('-password -otp -otpExpire -resetPasswordToken -resetPasswordExpires');

      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      // Check if account is active
      if (req.user.isActive === false) {
        return res.status(403).json({
          success: false,
          message: 'Account deactivated. Please contact support.'
        });
      }

      next();
    } catch (error) {
      console.error('Auth middleware error:', error);

      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          success: false, 
          message: 'Token expired. Please login again.' 
        });
      }

      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid token. Please login again.' 
        });
      }

      return res.status(401).json({ 
        success: false, 
        message: 'Not authorized. Authentication failed.' 
      });
    }
  }

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Not authorized, no token provided' 
    });
  }
};

// Admin only middleware
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Admin privileges required.' 
    });
  }
};

// Seller only middleware (allows both seller and admin)
const seller = (req, res, next) => {
  if (req.user && (req.user.role === 'seller' || req.user.role === 'admin')) {
    next();
  } else {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Seller privileges required.' 
    });
  }
};

// Approved seller middleware - seller must be approved by admin (admins bypass)
const approvedSeller = (req, res, next) => {
  // Admin bypass - admins have full access
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  
  // Check if user is seller and approved
  if (req.user && req.user.role === 'seller' && req.user.isSellerApproved === true) {
    return next();
  }
  
  // Seller exists but not approved
  if (req.user && req.user.role === 'seller' && req.user.isSellerApproved !== true) {
    return res.status(403).json({
      success: false,
      message: 'Your seller account is pending admin approval. Please wait for confirmation.'
    });
  }
  
  // Not a seller or admin
  return res.status(403).json({
    success: false,
    message: 'Access denied. Seller account required.'
  });
};

// Courier only middleware
const courier = (req, res, next) => {
  if (req.user && req.user.role === 'courier') {
    next();
  } else {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Courier privileges required.' 
    });
  }
};

// Admin or Seller middleware (either role)
const adminOrSeller = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'seller')) {
    next();
  } else {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Admin or Seller privileges required.' 
    });
  }
};

// Admin or Courier middleware
const adminOrCourier = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'courier')) {
    next();
  } else {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Admin or Courier privileges required.' 
    });
  }
};

// Optional auth - doesn't require token but attaches user if present
const optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch (error) {
      // Ignore token errors for optional auth
      console.log('Optional auth: Invalid token provided');
    }
  }

  next();
};

// General authorize by roles (flexible role checking)
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. Please login.'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user.role}' is not authorized. Required roles: ${roles.join(', ')}`
      });
    }
    
    next();
  };
};

// Check if user is verified
const isVerified = (req, res, next) => {
  if (req.user && req.user.isVerified === true) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Please verify your email address to access this resource.'
    });
  }
};

// Check if seller has completed profile
const hasCompleteProfile = (req, res, next) => {
  if (req.user.role !== 'seller') {
    return next();
  }
  
  const requiredFields = ['shopName', 'shopAddress', 'phoneNumber'];
  const missingFields = requiredFields.filter(field => !req.user[field]);
  
  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Please complete your seller profile first',
      missingFields
    });
  }
  
  next();
};

// Rate limiting middleware wrapper (can be combined with express-rate-limit)
const apiLimiter = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
};

// Export all middleware
module.exports = {
  protect,
  admin,
  seller,
  approvedSeller,
  courier,
  adminOrSeller,
  adminOrCourier,
  optionalAuth,
  authorize,
  isVerified,
  hasCompleteProfile,
  apiLimiter
};