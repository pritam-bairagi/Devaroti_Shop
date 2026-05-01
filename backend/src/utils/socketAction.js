const socketIO = require('socket.io');

let io;
const userSockets = new Map(); // userId -> socketId

const initSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
  });

  io.on('connection', (socket) => {
    const socketId = socket.id;
    
    // Join user-specific room for notifications
    socket.on('join', (userId) => {
      if (userId) {
        userSockets.set(userId, socketId);
        socket.join(userId);
        console.log(`[Socket] User ${userId} connected as ${socketId}`);
      }
    });

    // Join specific chat room for real-time messaging
    socket.on('join_chat', (chatId) => {
      if (chatId) {
        socket.join(`chat_${chatId}`);
        console.log(`[Socket] Socket ${socketId} joined chat room: chat_${chatId}`);
      }
    });

    // Handle typing indicator
    socket.on('typing', ({ chatId, userId, userName }) => {
      if (chatId) {
        socket.to(`chat_${chatId}`).emit('user_typing', { chatId, userId, userName });
      }
    });

    socket.on('stop_typing', ({ chatId, userId }) => {
      if (chatId) {
        socket.to(`chat_${chatId}`).emit('user_stop_typing', { chatId, userId });
      }
    });

    socket.on('disconnect', () => {
      let disconnectedUser = null;
      for (const [userId, sId] of userSockets.entries()) {
        if (sId === socketId) {
          disconnectedUser = userId;
          userSockets.delete(userId);
          break;
        }
      }
      console.log(`[Socket] Client ${socketId} (${disconnectedUser || 'anonymous'}) disconnected`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

const emitToUser = (userId, event, data) => {
  if (io && userId) {
    io.to(userId).emit(event, data);
  }
};

const emitToRoom = (roomId, event, data) => {
  if (io && roomId) {
    io.to(roomId).emit(event, data);
  }
};

const emitToRoles = (roles, event, data) => {
  if (io) {
    // This could be enhanced to filter by roles if we tracked socket roles
    io.emit(event, data);
  }
};

module.exports = { initSocket, getIO, emitToUser, emitToRoom, emitToRoles };
