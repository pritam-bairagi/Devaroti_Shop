const socketIO = require('socket.io');

let io;
const userSockets = new Map(); // userId -> socketId

const initSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('join', (userId) => {
      if (userId) {
        userSockets.set(userId, socket.id);
        socket.join(userId);
        console.log(`User ${userId} joined their channel`);
      }
    });

    socket.on('disconnect', () => {
      for (const [userId, socketId] of userSockets.entries()) {
        if (socketId === socket.id) {
          userSockets.delete(userId);
          break;
        }
      }
      console.log('Client disconnected:', socket.id);
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
  if (io) {
    io.to(userId).emit(event, data);
  }
};

const emitToRoles = (roles, event, data) => {
    // This requires a bit more logic if we want to store role-based socket groups
    // For now, simple broadcast to all if admin/seller
    if (io) {
        io.emit(event, data);
    }
}

module.exports = { initSocket, getIO, emitToUser, emitToRoles };
