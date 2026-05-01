const cloudinary = require('cloudinary').v2;
const fs = require('fs');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload an image to Cloudinary and optimize it
 * @param {string} filePath Local path to the file
 * @param {string} folder Cloudinary folder name
 * @returns {Promise<object>} Upload result
 */
const uploadToCloudinary = async (filePath, folder = 'chats') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: `devaroti/${folder}`,
      resource_type: 'auto',
      transformation: [
        { width: 1000, crop: "limit" }, // Resize if larger than 1000px
        { quality: "auto" }, // Automatic quality optimization
        { fetch_format: "auto" } // Automatic format (WebP/AVIF if supported)
      ]
    });

    // Delete local file after upload
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return result;
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw error;
  }
};

/**
 * Delete an image from Cloudinary
 * @param {string} publicId Cloudinary public ID
 * @returns {Promise<object>} Delete result
 */
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary Delete Error:', error);
    throw error;
  }
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary
};
