import React, { createContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import socketService from '../services/socket';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // Fetch authenticated user using the token stored in localStorage
  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const response = await authAPI.getMe();
      setUser(response.data.user);
      socketService.connect(token);
    } catch {
      // Token invalid or expired — clear storage
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      setUser(null);
      socketService.disconnect();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const verify = async (verifyData) => {
    try {
      const response = await authAPI.verify(verifyData);
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
        setUser(response.data.user);
        toast.success('Email verified successfully!');
        return response.data;
      }
    } catch (error) {
      // FIX: don't show a duplicate toast here — api.js interceptor already shows it
      throw error;
    }
  };

  const resendOTP = async (data) => {
    try {
      const response = await authAPI.resendOTP(data);
      if (response.data.success) {
        toast.success('New OTP sent to your email');
        return response.data;
      }
    } catch (error) {
      throw error;
    }
  };

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
        setUser(response.data.user);
        socketService.connect(response.data.token);
        return response.data;
      }
    } catch (error) {
      // Pass requiresVerification back to the calling component
      if (error.response?.data?.requiresVerification) {
        return {
          requiresVerification: true,
          userId: error.response.data.userId
        };
      }
      throw error;
    }
  };

  const logout = async () => {
    try { await authAPI.logout(); } catch { /* ignore */ }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setUser(null);
    socketService.disconnect();
    toast.success('Logged out successfully');
  };

  const forgotPassword = async (email) => {
    try {
      const response = await authAPI.forgotPassword(email);
      toast.success(response.data.message || 'Reset link sent to email');
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const resetPassword = async (token, password) => {
    try {
      const response = await authAPI.resetPassword(token, password);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
        await fetchUser();
      }
      toast.success('Password reset successful');
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const changePassword = async (data) => {
    try {
      const response = await authAPI.changePassword(data);
      toast.success('Password changed successfully');
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  // Merge partial user updates into local state without a full re-fetch
  const updateUser = (updatedUser) => {
    setUser(prev => ({ ...prev, ...updatedUser }));
  };

  const refreshUser = fetchUser;

  return (
    <AuthContext.Provider value={{
      user, setUser, loading, error,
      register, verify, resendOTP,
      login, logout,
      forgotPassword, resetPassword, changePassword,
      updateUser, refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};