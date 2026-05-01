import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import SocketProvider from './contexts/SocketContext.jsx';
import { useSocket } from './contexts/useSocket';
import { useAuth } from './contexts/useAuth';

// Components
import FloatingShape from './components/FloatingShape';
import Loader from './components/Loader';

// Lazy Loaded Pages
const Home = lazy(() => import('./pages/Home'));
const Shop = lazy(() => import('./pages/Shop'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Profile = lazy(() => import('./pages/Profile'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const EmailVerification = lazy(() => import('./pages/EmailVerification'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Cart = lazy(() => import('./pages/Cart'));
const Favorites = lazy(() => import('./pages/Favorites'));
const SellerRegister = lazy(() => import('./pages/SellerRegister'));
const CourierRegister = lazy(() => import('./pages/CourierRegister'));
const SellerPanel = lazy(() => import('./pages/SellerPanel'));
const CourierPanel = lazy(() => import('./pages/CourierPanel'));

// Global Socket Listener Component
const SocketListener = () => {
  const { user } = useAuth();
  const { on, off } = useSocket();

  useEffect(() => {
    if (!user || !on) return;

    const handleNewOrder = (data) => {
      if (user.role === 'admin') toast(`New Order #${data.orderNumber} placed!`, { icon: '📦', duration: 5000 });
    };

    const handlePaymentConfirmed = (data) => {
      // If seller, check if it's their order
      if (user.role === 'seller') {
         toast(`Order #${data.orderNumber} payment confirmed by Admin! You can now process it.`, { icon: '✅', duration: 8000 });
      }
    };

    const handleWithdrawalStatus = (data) => {
      if (user.role === 'seller') {
        const icon = data.status === 'completed' ? '💰' : '❌';
        toast(`Your withdrawal request was ${data.status === 'completed' ? 'approved' : 'rejected'}.`, { icon, duration: 8000 });
      }
    };

    const handleMessageNotification = (data) => {
      // Don't show toast if user is already on the dashboard/messages tab (we could refine this)
      if (window.location.pathname !== '/dashboard' || !document.querySelector('[data-active-tab="messages"]')) {
        toast(`${data.senderName}: ${data.lastMessage}`, { 
          icon: '💬',
          duration: 5000,
          onClick: () => window.location.href = '/dashboard'
        });
      }
    };

    // Attach listeners
    on('new_order', handleNewOrder);
    on('payment_confirmed', handlePaymentConfirmed);
    on('withdrawal_status_changed', handleWithdrawalStatus);
    on('message_notification', handleMessageNotification);

    return () => {
      off('new_order', handleNewOrder);
      off('payment_confirmed', handlePaymentConfirmed);
      off('withdrawal_status_changed', handleWithdrawalStatus);
      off('message_notification', handleMessageNotification);
    };
  }, [user, on, off]);

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
  if (user.role === 'seller' && !user.isSellerApproved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 flex-col gap-4 p-4 text-center">
        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center">
          <Store className="text-yellow-600" size={40} />
        </div>
        <h2 className="text-2xl font-bold">Account Pending Approval</h2>
        <p className="text-gray-600 max-w-md">Your seller account is currently under review by our administration team. You will be notified once it is approved.</p>
        <Link to="/" className="text-primary hover:underline mt-2">Return to Home</Link>
      </div>
    );
  }
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
      <SocketProvider>
        <SocketListener />
        <Router>
          <Suspense fallback={<Loader fullScreen />}>
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
          </Suspense>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;