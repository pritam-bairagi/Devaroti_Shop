// frontend/src/App.jsx - Without Helmet
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/useAuth';

// Pages
import Home from './pages/Home';
import Shop from './pages/Shop';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import EmailVerification from './pages/EmailVerification';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AdminDashboard from './pages/AdminDashboard';
import Cart from './pages/Cart';
import Favorites from './pages/Favorites';
import Footer from './pages/Footer';
import SellerRegister from './pages/SellerRegister';
import CourierRegister from './pages/CourierRegister';
import SellerPanel from './pages/SellerPanel';
import CourierPanel from './pages/CourierPanel';

// Components
import FloatingShape from './components/FloatingShape';
import Loader from './components/Loader';
import socketService from './services/socket';

// Global Socket Listener Component
const SocketListener = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const handleNewOrder = (data) => {
      if (user.role === 'admin') toast(`New Order #${data.orderNumber} placed!`, { icon: '📦' });
    };

    const handlePaymentConfirmed = (data) => {
      // If seller, check if it's their order
      if (user.role === 'seller') {
         toast(`Order #${data.orderNumber} payment confirmed by Admin! You can now process it.`, { icon: '✅', duration: 6000 });
      }
    };

    const handleWithdrawalStatus = (data) => {
      if (user.role === 'seller') {
        const icon = data.status === 'completed' ? '💰' : '❌';
        toast(`Your withdrawal request was ${data.status === 'completed' ? 'approved' : 'rejected'}.`, { icon });
      }
    };

    // Attach listeners
    socketService.on('new_order', handleNewOrder);
    socketService.on('payment_confirmed', handlePaymentConfirmed);
    socketService.on('withdrawal_status_changed', handleWithdrawalStatus);

    return () => {
      socketService.off('new_order', handleNewOrder);
      socketService.off('payment_confirmed', handlePaymentConfirmed);
      socketService.off('withdrawal_status_changed', handleWithdrawalStatus);
    };
  }, [user]);

  return null;
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <Loader fullScreen />;
  if (!user) return <Navigate to='/login' replace />;
  return children;
};

// Redirect Authenticated User
const RedirectAuthenticatedUser = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <Loader fullScreen />;
  if (user && user.isVerified) return <Navigate to='/' replace />;
  return children;
};

// Admin Route
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <Loader fullScreen />;
  if (!user || user.role !== 'admin') return <Navigate to='/' replace />;
  return children;
};

// Seller Route
const SellerRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <Loader fullScreen />;
  if (!user || user.role !== 'seller') return <Navigate to='/' replace />;
  return children;
};

// Courier Route
const CourierRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <Loader fullScreen />;
  if (!user || user.role !== 'courier') return <Navigate to='/' replace />;
  return children;
};


function App() {
  return (
    <AuthProvider>
      <SocketListener />
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path='/' element={<Home />} />
          <Route path='/shop' element={<Shop />} />
          
          {/* Auth Routes - Dark Background */}
          <Route path='/login' element={
            <RedirectAuthenticatedUser>
              <div className='min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-primary/20 flex items-center justify-center relative overflow-hidden'>
                <FloatingShape color='bg-primary' size='w-64 h-64' top='-5%' left='10%' delay={0} />
                <FloatingShape color='bg-purple-500' size='w-48 h-48' top='70%' left='80%' delay={5} />
                <Login />
              </div>
            </RedirectAuthenticatedUser>
          } />
          
          <Route path='/register' element={
            <RedirectAuthenticatedUser>
              <div className='min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-primary/20 flex items-center justify-center relative overflow-hidden'>
                <FloatingShape color='bg-primary' size='w-64 h-64' top='-5%' left='10%' delay={0} />
                <FloatingShape color='bg-blue-500' size='w-32 h-32' top='40%' left='-10%' delay={2} />
                <Register />
              </div>
            </RedirectAuthenticatedUser>
          } />
          
          <Route path='/seller-signup' element={
            <RedirectAuthenticatedUser>
              <div className='min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-amber-500/20 flex items-center justify-center relative overflow-hidden'>
                <FloatingShape color='bg-amber-500' size='w-64 h-64' top='-5%' left='10%' delay={0} />
                <SellerRegister />
              </div>
            </RedirectAuthenticatedUser>
          } />
          
          <Route path='/courier-signup' element={
            <RedirectAuthenticatedUser>
              <div className='min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-orange-500/20 flex items-center justify-center relative overflow-hidden'>
                <FloatingShape color='bg-orange-500' size='w-64 h-64' top='-5%' left='10%' delay={0} />
                <CourierRegister />
              </div>
            </RedirectAuthenticatedUser>
          } />
          
          <Route path='/verify-email' element={
            <div className='min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-primary/20 flex items-center justify-center'>
              <EmailVerification />
            </div>
          } />
          
          <Route path='/forgot-password' element={
            <div className='min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-primary/20 flex items-center justify-center'>
              <ForgotPassword />
            </div>
          } />
          
          <Route path='/reset-password/:token' element={
            <div className='min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-primary/20 flex items-center justify-center'>
              <ResetPassword />
            </div>
          } />

          {/* Protected Routes */}
          <Route path='/cart' element={
            <ProtectedRoute>
              <Cart />
            </ProtectedRoute>
          } />
          
          <Route path='/favorites' element={
            <ProtectedRoute>
              <Favorites />
            </ProtectedRoute>
          } />
          
          <Route path='/dashboard' element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path='/profile' element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          
          <Route path='/admin/*' element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
          
          <Route path='/seller/*' element={
            <SellerRoute>
              <SellerPanel />
            </SellerRoute>
          } />
          
          <Route path='/courier/*' element={
            <CourierRoute>
              <CourierPanel />
            </CourierRoute>
          } />

          {/* 404 - Redirect to Home */}
          <Route path='*' element={<Navigate to='/' replace />} />
        </Routes>
        
        <Toaster 
          position='top-right'
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
              borderRadius: '10px',
            },
            success: {
              icon: '✅',
              style: {
                background: '#10b981',
              },
            },
            warning: {
              icon: '⚠️',
              style: {
                background: '#f59e0b',
              },
            },
            error: {
              icon: '❌',
              style: {
                background: '#ef4444',
              },
            },
          }}
        />
      </Router>
    </AuthProvider>
  );
}

export default App;