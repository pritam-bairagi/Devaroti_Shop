const express = require('express');
const router = express.Router();
const fs = require('fs');
const { protect } = require('../middleware/authMiddleware');
const { upload, uploadMultiple, handleUploadError } = require('../middleware/uploadMiddleware');
const { uploadToCloudinary } = require('../utils/cloudinary');

// @desc    Upload multiple images to Cloudinary
// @route   POST /api/upload
// @access  Private
router.post('/', protect, uploadMultiple, async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      // Check if it's a single file named 'image'
      if (req.file) {
        req.files = [req.file];
      } else {
        return res.status(400).json({ success: false, message: 'No images uploaded' });
      }
    }

    const uploadedUrls = [];
    
    // Upload each file to Cloudinary
    for (const file of req.files) {
      const result = await uploadToCloudinary(file.path, 'products');
      uploadedUrls.push(result.secure_url);
    }

    return res.status(200).json({
      success: true,
      message: 'Images uploaded successfully',
      urls: uploadedUrls
    });
  } catch (error) {
    console.error('Upload error:', error);
    // Cleanup any local files that failed
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      });
    }
    return res.status(500).json({ success: false, message: 'Failed to upload images' });
  }
}, handleUploadError);

module.exports = router;
