import React, { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './useAuth';
import { SocketContext } from './socketContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (user && token) {
      const newSocket = io(API_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      newSocket.on('connect', () => {
        setIsConnected(true);
        console.log('[Socket] Connected:', newSocket.id);
        newSocket.emit('join', user._id || user.id);
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
        console.log('[Socket] Disconnected');
      });

      newSocket.on('connect_error', (err) => {
        console.error('[Socket] Connection Error:', err.message);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
        setSocket(null);
        setIsConnected(false);
      };
    } else {
      setSocket(null);
      setIsConnected(false);
    }
  }, [user?._id, user?.id]);

  const emit = useCallback((event, data) => {
    if (socket) socket.emit(event, data);
  }, [socket]);

  const on = useCallback((event, callback) => {
    if (socket) socket.on(event, callback);
  }, [socket]);

  const off = useCallback((event, callback) => {
    if (socket) socket.off(event, callback);
  }, [socket]);

  const joinChat = useCallback((chatId) => {
    if (socket && chatId) socket.emit('join_chat', chatId);
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, emit, on, off, joinChat }}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;
