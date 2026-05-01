const Chat = require('../models/Chat');
const User = require('../models/User');
const mongoose = require('mongoose');
const { emitToUser, emitToRoom } = require('../utils/socketAction');
const { uploadToCloudinary } = require('../utils/cloudinary');

// @desc    Get all chats for current user
// @route   GET /api/chats
const getChats = async (req, res) => {
  try {
    const userId = req.user.id;
    const chats = await Chat.find({
      $or: [
        { user: userId },
        { seller: userId },
        { participants: userId }
      ]
    })
    .populate('user', 'name profilePic shopName shopLogo role')
    .populate('seller', 'name profilePic shopName shopLogo role')
    .populate('participants', 'name profilePic shopName role')
    .sort({ updatedAt: -1 });

    // Refine chats to handle unread count specifically for the requesting user
    const processedChats = chats.map(chat => {
      const lastMsg = chat.messages && chat.messages.length > 0 
        ? chat.messages[chat.messages.length - 1] 
        : null;
      
      let displayUnreadCount = chat.unreadCount || 0;
      if (lastMsg && lastMsg.sender && lastMsg.sender.toString() === userId.toString()) {
        displayUnreadCount = 0;
      }
      
      return {
        ...chat.toObject(),
        unreadCount: displayUnreadCount
      };
    });

    res.status(200).json({ success: true, chats: processedChats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch chats: ' + error.message });
  }
};

// @desc    Get messages for a specific chat
// @route   GET /api/chats/:id
const getChatMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Chat ID' });
    }

    const chat = await Chat.findById(id)
      .populate('messages.sender', 'name profilePic')
      .populate('messages.product', 'name price sellingPrice image')
      .populate('user', 'name profilePic role')
      .populate('seller', 'name profilePic shopName role');

    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    // Security: Check if user is participant
    if (!chat.participants.some(p => p.toString() === userId)) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this chat' });
    }

    // Mark messages as read if the current user is a recipient of unread messages
    let updated = false;
    chat.messages.forEach(msg => {
      if (msg.sender && msg.sender._id.toString() !== userId && !msg.read) {
        msg.read = true;
        updated = true;
      }
    });

    if (updated) {
      chat.unreadCount = 0; // Reset for the user viewing the chat
      await chat.save();
    }

    res.status(200).json({ success: true, messages: chat.messages, chat });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch messages: ' + error.message });
  }
};

// @desc    Get or find a chat with a specific user
// @route   GET /api/chats/with/:receiverId
const getChatWithUser = async (req, res) => {
  try {
    const { receiverId } = req.params;
    const senderId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({ success: false, message: 'Invalid Receiver ID' });
    }

    const chat = await Chat.findOne({
      participants: { $all: [senderId, receiverId] }
    })
    .populate('messages.sender', 'name profilePic')
    .populate('messages.product', 'name price sellingPrice image')
    .populate('user', 'name profilePic role')
    .populate('seller', 'name profilePic shopName role');

    if (!chat) {
      return res.status(200).json({ success: true, chat: null });
    }

    res.status(200).json({ success: true, chat });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to find chat: ' + error.message });
  }
};


// @desc    Send a message (create chat if not exists)
// @route   POST /api/chats/send
const sendMessage = async (req, res) => {
  try {
    const { receiverId, message, orderId, chatId, productId } = req.body;
    const senderId = req.user.id;

    if (!receiverId && !chatId) {
      return res.status(400).json({ success: false, message: 'Receiver or Chat ID is required' });
    }

    if (!message && !req.file && !productId) {
      return res.status(400).json({ success: false, message: 'Message, image, or product is required' });
    }

    // Handle Image Upload if present
    let imageUrl = null;
    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.path, 'chats');
        imageUrl = result.secure_url;
      } catch (uploadError) {
        return res.status(500).json({ success: false, message: 'Image upload failed' });
      }
    }

    // Find chat by ID or by participants
    let chat;
    if (chatId && mongoose.Types.ObjectId.isValid(chatId)) {
      chat = await Chat.findById(chatId);
    } else {
      chat = await Chat.findOne({
        participants: { $all: [senderId, receiverId] }
      });
    }

    if (!chat) {
      if (!receiverId) return res.status(400).json({ success: false, message: 'Receiver ID required to start new chat' });
      chat = await Chat.create({
        user: senderId,
        seller: receiverId,
        participants: [senderId, receiverId],
        order: orderId || null
      });
    }

    const newMessage = {
      sender: senderId,
      senderModel: 'User',
      message: message || (imageUrl ? 'Image' : 'Product'),
      image: imageUrl,
      product: productId || null,
      read: false,
      createdAt: new Date()
    };

    chat.messages.push(newMessage);
    chat.lastMessage = message || (imageUrl ? 'Sent an image' : 'Shared a product');
    chat.unreadCount += 1;
    chat.updatedAt = new Date();

    await chat.save();

    // Populate for response and socket
    const populatedChat = await Chat.findById(chat._id)
      .populate('messages.sender', 'name profilePic')
      .populate('messages.product', 'name price sellingPrice image')
      .populate('user', 'name profilePic role')
      .populate('seller', 'name profilePic shopName role');

    const lastMsg = populatedChat.messages[populatedChat.messages.length - 1];
    const targetReceiverId = receiverId || chat.participants.find(p => p.toString() !== senderId.toString());

    // Emit via Socket.io to the specific chat room
    emitToRoom(`chat_${chat._id}`, 'new_message', {
      chatId: chat._id,
      message: lastMsg,
      senderName: req.user.name
    });

    // Also emit a notification to the receiver's personal room
    emitToRoom(targetReceiverId.toString(), 'message_notification', {
      chatId: chat._id,
      lastMessage: chat.lastMessage,
      senderName: req.user.name,
      senderId: senderId
    });

    res.status(200).json({ success: true, message: lastMsg, chat: populatedChat });
  } catch (error) {
    console.error('Send Message Error:', error);
    res.status(500).json({ success: false, message: 'Failed to send message: ' + error.message });
  }
};

// @desc    Get Admin for seller-to-admin chat
// @route   GET /api/chats/admin
const getAdmin = async (req, res) => {
  try {
    const admin = await User.findOne({ role: 'admin' }).select('name profilePic _id');
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });
    res.status(200).json({ success: true, admin });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch admin: ' + error.message });
  }
};

// @desc    Update a chat message (Edit)
// @route   PUT /api/chats/:id/message/:messageId
const updateChatMessage = async (req, res) => {
  try {
    const { id, messageId } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    const chat = await Chat.findById(id);
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });

    const msgIndex = chat.messages.findIndex(m => m._id.toString() === messageId);
    if (msgIndex === -1) return res.status(404).json({ success: false, message: 'Message not found' });

    const msg = chat.messages[msgIndex];
    if (msg.sender.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this message' });
    }

    // Only allow editing text messages
    if (msg.image || msg.product) {
      return res.status(400).json({ success: false, message: 'Only text messages can be edited' });
    }

    msg.message = message;
    msg.isEdited = true;
    chat.updatedAt = new Date();

    await chat.save();

    // Emit event
    emitToRoom(`chat_${chat._id}`, 'message_updated', {
      chatId: chat._id,
      messageId: messageId,
      newContent: message
    });

    res.status(200).json({ success: true, message: msg });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update message: ' + error.message });
  }
};

module.exports = { getChats, getChatMessages, getChatWithUser, sendMessage, getAdmin, updateChatMessage };
