const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const sendEmail = require('../utils/sendEmail');

// ==================== HELPER FUNCTIONS ====================

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

const generateRefreshToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + 'refresh',
    { expiresIn: '30d' }
  );
};

const getPopulatedUser = async (userId) => {
  return await User.findById(userId)
    .select('-password -otp -otpExpire -resetPasswordToken -resetPasswordExpires -reactivationToken -reactivationExpires')
    .populate({ path: 'cart.product', select: 'name price sellingPrice image stock category' })
    .populate({ path: 'favorites', select: 'name price sellingPrice image stock category rating' });
};

const validatePhoneNumber = (phone) => /^01[3-9]\d{8}$/.test(phone);

// ==================== AUTH CONTROLLERS ====================

const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password, phoneNumber, role, shopName, location, bio } = req.body;

    if (!validatePhoneNumber(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid Bangladesh phone number (01XXXXXXXXX)'
      });
    }

    const userExists = await User.findOne({ $or: [{ email }, { phoneNumber }] });

    if (userExists) {
      const field = userExists.email === email ? 'Email' : 'Phone number';
      return res.status(400).json({ success: false, message: `${field} already registered` });
    }

    const validRole = ['user', 'seller', 'courier'].includes(role) ? role : 'user';

    const userData = { name, email, password, phoneNumber, role: validRole, location, bio };

    if (validRole === 'seller') {
      if (!shopName) {
        return res.status(400).json({ success: false, message: 'Shop name is required for sellers' });
      }
      userData.shopName = shopName;
      userData.isSellerApproved = false;
    }

    const user = new User(userData);
    const otp = user.generateOTP();
    await user.save();

    // Send verification email
    try {
      await sendEmail({
        email: user.email,
        subject: 'Email Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #088178; text-align: center;">Verify Your Email</h2>
            <p>Welcome to ${process.env.APP_NAME || 'Devaroti Shop'}! Use the following 6-digit code to verify your email address:</p>
            <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #333; border-radius: 5px; margin: 20px 0;">
              ${otp}
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't create this account, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #888; text-align: center;">&copy; 2026 ${process.env.APP_NAME || 'Devaroti Shop'}. All rights reserved.</p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Email sending failed during registration:', emailError);
      // We still registered the user, they can use 'resend OTP' later
    }
    
    console.log(`OTP for ${email}: ${otp}`);

    return res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email with the OTP sent.',
      userId: user._id,
      requiresVerification: true
    });
  } catch (error) {
    console.error('Registration error:', error);
    // FIX: Handle duplicate key from race condition gracefully
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ success: false, message: `${field} already registered` });
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'Registration failed. Please try again.'
    });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({ success: false, message: 'User ID and OTP are required' });
    }

    // FIX: explicitly select otp + otpExpire since they are select:false
    const user = await User.findById(userId).select('+otp +otpExpire');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Account already verified' });
    }

    if (!user.otp || user.otp !== otp || user.otpExpire < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    user.isVerified = true;
    user.isEmailVerified = true;
    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save();

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    const populatedUser = await getPopulatedUser(user._id);

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      token,
      refreshToken,
      user: populatedUser
    });
  } catch (error) {
    console.error('Verification error:', error);
    return res.status(500).json({ success: false, message: 'Verification failed. Please try again.' });
  }
};

const resendOTP = async (req, res) => {
  try {
    const { userId, email } = req.body;

    let user;
    if (userId) {
      user = await User.findById(userId);
    } else if (email) {
      user = await User.findOne({ email });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Account already verified' });
    }

    const otp = user.generateOTP();
    await user.save();

    // Send email
    try {
      await sendEmail({
        email: user.email,
        subject: 'Your New Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #088178; text-align: center;">Verification Code</h2>
            <p>You requested a new verification code. Use the following code to verify your account:</p>
            <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #333; border-radius: 5px; margin: 20px 0;">
              ${otp}
            </div>
            <p>This code will expire in 10 minutes.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #888; text-align: center;">&copy; 2026 ${process.env.APP_NAME || 'Parash Feri'}. All rights reserved.</p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Email resend failed:', emailError);
    }

    console.log(`New OTP for ${user.email}: ${otp}`);

    return res.status(200).json({ success: true, message: 'New OTP sent successfully' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    return res.status(500).json({ success: false, message: 'Failed to resend OTP' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // FIX: must select('+password') because password is select:false in schema
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    if (!user.isVerified || !user.isEmailVerified) {
      const otp = user.generateOTP();
      await user.save();
      console.log(`OTP for verification: ${otp}`);
      
      try {
        await sendEmail({
          email: user.email,
          subject: 'Please Verify Your Email',
          html: `<p>Your verification code is: <b>${otp}</b></p>`
        });
      } catch (e) {}
      return res.status(401).json({
        success: false,
        message: 'Please verify your email first',
        userId: user._id,
        requiresVerification: true
      });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    await user.updateLastLogin();

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    const populatedUser = await getPopulatedUser(user._id);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      refreshToken,
      user: populatedUser
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Login failed. Please try again.'
    });
  }
};

const loginWithPhone = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;

    if (!phoneNumber || !password) {
      return res.status(400).json({ success: false, message: 'Phone number and password are required' });
    }

    if (!validatePhoneNumber(phoneNumber)) {
      return res.status(400).json({ success: false, message: 'Invalid phone number format' });
    }

    const user = await User.findOne({ phoneNumber }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your account first',
        userId: user._id,
        requiresVerification: true
      });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    await user.updateLastLogin();

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    const populatedUser = await getPopulatedUser(user._id);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      refreshToken,
      user: populatedUser
    });
  } catch (error) {
    console.error('Phone login error:', error);
    return res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Refresh token required' });
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + 'refresh'
      );

      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }

      if (!user.isActive) {
        return res.status(403).json({ success: false, message: 'Account is deactivated' });
      }

      const newToken = generateToken(user._id);
      // FIX: also issue a new refresh token to extend session
      const newRefreshToken = generateRefreshToken(user._id);

      return res.status(200).json({ success: true, token: newToken, refreshToken: newRefreshToken });
    } catch (jwtError) {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(500).json({ success: false, message: 'Token refresh failed' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await getPopulatedUser(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('Get me error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch user data' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email });

    // FIX: Always return 200 to prevent email enumeration attacks
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists with that email, a password reset link has been sent.'
      });
    }

    const resetToken = user.generateResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset Request',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #088178; text-align: center;">Password Reset</h2>
            <p>You requested to reset your password. Please click the button below to set a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: #088178; color: white; padding: 12px 25px; text-decoration: none; font-weight: bold; border-radius: 5px;">Reset Password</a>
            </div>
            <p>If you cannot click the button, copy and paste this link into your browser:</p>
            <p style="font-size: 12px; color: #888; background: #f9f9f9; padding: 10px; word-break: break-all;">${resetUrl}</p>
            <p>This link will expire in 10 minutes.</p>
            <p>If you didn't request a password reset, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #888; text-align: center;">&copy; 2026 ${process.env.APP_NAME || 'Parash Feri'}. All rights reserved.</p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Forgot password email failed:', emailError);
    }

    console.log(`Reset password link for ${email}: ${resetUrl}`);

    return res.status(200).json({ success: true, message: 'Password reset link sent to email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ success: false, message: 'Password reset request failed' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ success: false, message: 'Token and new password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    // FIX: select reset token fields since they are select:false
    const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() }
    }).select('+resetPasswordToken +resetPasswordExpires');

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    const authToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    return res.status(200).json({
      success: true,
      message: 'Password reset successful',
      token: authToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ success: false, message: 'Password reset failed' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    // FIX: must select('+password') since it is select:false
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ success: false, message: 'Failed to change password' });
  }
};

const logout = async (req, res) => {
  return res.status(200).json({ success: true, message: 'Logged out successfully' });
};

const checkAuth = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -otp -otpExpire -resetPasswordToken -resetPasswordExpires');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        isVerified: user.isVerified,
        profilePic: user.profilePic,
        level: user.level,
        levelColor: user.levelColor,
        addresses: user.addresses
      }
    });
  } catch (error) {
    console.error('Check auth error:', error);
    return res.status(500).json({ success: false, message: 'Authentication check failed' });
  }
};

const sendPhoneOTP = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!validatePhoneNumber(phoneNumber)) {
      return res.status(400).json({ success: false, message: 'Invalid phone number format' });
    }

    const existingUser = await User.findOne({ phoneNumber, _id: { $ne: user._id } });

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Phone number already registered' });
    }

    const otp = user.generateOTP();
    user.phoneNumber = phoneNumber;
    await user.save();

    try {
      await sendEmail({
        email: user.email,
        subject: 'Phone Verification Code',
        html: `<p>Your verification code for phone number update is: <b>${otp}</b></p>`
      });
    } catch (e) {}

    console.log(`Phone OTP for ${phoneNumber}: ${otp}`);

    return res.status(200).json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Send phone OTP error:', error);
    return res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
};

const verifyPhoneOTP = async (req, res) => {
  try {
    const { otp } = req.body;
    // FIX: select otp + otpExpire since they are select:false
    const user = await User.findById(req.user.id).select('+otp +otpExpire');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.otp || user.otp !== otp || user.otpExpire < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    user.isPhoneVerified = true;
    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save();

    return res.status(200).json({ success: true, message: 'Phone number verified successfully' });
  } catch (error) {
    console.error('Verify phone OTP error:', error);
    return res.status(500).json({ success: false, message: 'Verification failed' });
  }
};

module.exports = {
  register,
  verifyOTP,
  resendOTP,
  login,
  loginWithPhone,
  refreshToken,
  getMe,
  forgotPassword,
  resetPassword,
  changePassword,
  logout,
  checkAuth,
  sendPhoneOTP,
  verifyPhoneOTP
};