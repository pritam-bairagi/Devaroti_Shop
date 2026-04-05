const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');

router.get('/public/:key', configController.getPublicConfig);

module.exports = router;
