const express = require('express');
const router = express.Router();
const { getDeliveries, updateDeliveryStatus, getCourierStats } = require('../controllers/courierController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('courier', 'admin'));

router.route('/deliveries')
  .get(getDeliveries);

router.route('/deliveries/:id/status')
  .put(updateDeliveryStatus);

router.route('/stats')
  .get(getCourierStats);

module.exports = router;
