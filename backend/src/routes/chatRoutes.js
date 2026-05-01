const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getChats,
  getChatMessages,
  getChatWithUser,
  sendMessage,
  getAdmin,
  updateChatMessage
} = require('../controllers/chatController');

const { upload } = require('../middleware/uploadMiddleware');

router.use(protect);

router.get('/admin', getAdmin);
router.get('/', getChats);
router.get('/with/:receiverId', getChatWithUser);
router.get('/:id', getChatMessages);
router.put('/:id/message/:messageId', updateChatMessage);
router.post('/send', upload.single('image'), sendMessage);
router.post('/upload-image', upload.single('image'), (req, res, next) => {
  // Pass to chatController if needed, or handle directly
  next();
}, sendMessage);

module.exports = router;
