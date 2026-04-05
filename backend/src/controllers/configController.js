const SystemConfig = require('../models/SystemConfig');

// @desc    Get public configuration by key
// @route   GET /api/config/public/:key
// @access  Public
const getPublicConfig = async (req, res) => {
  try {
    const { key } = req.params;
    
    // Whitelist public keys for security
    const publicKeys = [
      'bkash_number', 'nagad_number', 'rocket_number', 'bank_details',
      'site_name', 'contact_email', 'contact_phone',
      'delivery_charge', 'vat_percentage', 
      'membership_bronze_discount', 'membership_silver_discount', 
      'membership_gold_discount', 'membership_platinum_discount',
      'membership_bronze_delivery_discount', 'membership_silver_delivery_discount', 
      'membership_gold_delivery_discount', 'membership_platinum_delivery_discount'
    ];
    
    if (!publicKeys.includes(key)) {
      return res.status(403).json({ success: false, message: 'Access denied to this configuration' });
    }

    const config = await SystemConfig.findOne({ key });
    return res.status(200).json({ success: true, value: config ? config.value : null });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getPublicConfig };
