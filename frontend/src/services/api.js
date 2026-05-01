import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
  withCredentials: true,
});

// ==================== INTERCEPTORS ====================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    // FIX: let browser set Content-Type automatically for FormData (includes boundary)
    if (config.data instanceof FormData) delete config.headers['Content-Type'];
    return config;
  },
  (error) => Promise.reject(error)
);

// Track if a token refresh is already in progress to avoid parallel refresh calls
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) { prom.reject(error); }
    else { prom.resolve(token); }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthPage = window.location.pathname.includes('/login') ||
      window.location.pathname.includes('/register');

    let errorMessage = 'An error occurred. Please try again.';

    if (error.response) {
      errorMessage = error.response.data?.message || errorMessage;

      // FIX: deduplicate refresh calls with a queue
      if (error.response.status === 401 && !originalRequest._retry && !isAuthPage) {
        const refreshToken = localStorage.getItem('refreshToken');

        if (refreshToken) {
          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            }).then(token => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return api(originalRequest);
            }).catch(err => Promise.reject(err));
          }

          originalRequest._retry = true;
          isRefreshing = true;

          try {
            const res = await axios.post(`${API_URL}/api/auth/refresh-token`, { refreshToken });
            const newToken = res.data.token;
            const newRefresh = res.data.refreshToken;
            localStorage.setItem('token', newToken);
            if (newRefresh) localStorage.setItem('refreshToken', newRefresh);
            api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
            processQueue(null, newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          } catch (refreshError) {
            processQueue(refreshError, null);
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
            return Promise.reject(refreshError);
          } finally {
            isRefreshing = false;
          }
        } else {
          localStorage.removeItem('token');
          if (!isAuthPage) window.location.href = '/login';
        }
      }
    } else if (error.request) {
      errorMessage = 'Network error. Please check your connection.';
    }

    // FIX: Don't show toast for 401 on auth pages (avoids "Not authorized" flash on login)
    if (!(error.response?.status === 401 && isAuthPage)) {
      toast.error(errorMessage);
    }

    return Promise.reject(error);
  }
);

// ==================== AUTH API ====================
export const authAPI = {
  register:        (data)            => api.post('/api/auth/register', data),
  verify:          (data)            => api.post('/api/auth/verify', data),
  resendOTP:       (data)            => api.post('/api/auth/resend-otp', data),
  login:           (data)            => api.post('/api/auth/login', data),
  logout:          ()                => api.post('/api/auth/logout'),
  forgotPassword:  (email)           => api.post('/api/auth/forgot-password', { email }),
  resetPassword:   (token, password) => api.put(`/api/auth/reset-password/${token}`, { password }),
  changePassword:  (data)            => api.put('/api/auth/change-password', data),
  getMe:           ()                => api.get('/api/auth/me'),
  checkAuth:       ()                => api.get('/api/auth/check'),
  refreshToken:    (refreshToken)    => api.post('/api/auth/refresh-token', { refreshToken }),
};

// ==================== USER API ====================
export const userAPI = {
  getProfile:     ()                         => api.get('/api/users/profile'),
  updateProfile:  (data)                     => api.put('/api/users/profile', data),
  deleteAccount:  ()                         => api.delete('/api/users/account'),
  uploadProfileImage: (formData)             => api.post('/api/upload', formData),
  // Cart
  addToCart:      (data)                     => api.post('/api/users/cart', data),
  updateCartItem: (cartItemId, data)         => api.put(`/api/users/cart/${cartItemId}`, data),
  removeFromCart: (cartItemId)               => api.delete(`/api/users/cart/${cartItemId}`),
  clearCart:      ()                         => api.delete('/api/users/cart'),
  // Favorites
  getFavorites:   ()                         => api.get('/api/users/favorites'),
  toggleFavorite: (productId)                => api.post(`/api/users/favorites/${productId}`),
  // Address
  getAddresses:   ()                         => api.get('/api/users/addresses'),
  addAddress:     (data)                     => api.post('/api/users/address', { address: data }),
  updateAddress:  (id, data)                 => api.put(`/api/users/address/${id}`, { address: data }),
  deleteAddress:  (id)                       => api.delete(`/api/users/address/${id}`),
  setDefaultAddress: (id)                    => api.put(`/api/users/address/${id}/default`),
};

// ==================== PRODUCT API ====================
export const productAPI = {
  getProducts:        (params) => api.get('/api/products', { params }),
  getProduct:         (id)     => api.get(`/api/products/${id}`),
  getCategories:      ()       => api.get('/api/products/categories/all'),
  getFeatured:        ()       => api.get('/api/products/featured'),
  getSellerProducts:  (params) => api.get('/api/products/seller', { params }),
  createProduct:      (data)   => api.post('/api/products', data),
  updateProduct:      (id, data) => api.put(`/api/products/${id}`, data),
  deleteProduct:      (id)     => api.delete(`/api/products/${id}`),
  updateStock:        (id, data) => api.put(`/api/products/${id}/stock`, data),
  // Reviews
  addReview:          (id, data) => api.post('/api/reviews', { ...data, productId: id }),
  getReviews:         (id, params) => api.get(`/api/reviews/product/${id}`, { params }),
};

// ==================== ORDER API ====================
export const orderAPI = {
  createOrder:       (data)            => api.post('/api/orders', data),
  checkout:          (data)            => api.post('/api/orders', data), // Assuming /api/orders for checkout
  getPublicConfig:   (key)             => api.get(`/api/config/public/${key}`),
  getPublicConfigs:  ()                => api.get('/api/config/public'),
  getMyOrders:       (params)          => api.get('/api/orders/my-orders', { params }),
  getOrder:          (id)              => api.get(`/api/orders/${id}`),
  cancelOrder:       (id, reason)      => api.put(`/api/orders/${id}/cancel`, { reason }),
  trackOrder:        (orderNumber)     => api.get(`/api/orders/track/${orderNumber}`),
  // FIX: route is /seller/list (matches orderRoutes.js)
  updateOrderStatus: (id, data)          => api.put(`/api/orders/${id}/status`, data),
  // Coupons
  validateCoupon:    (data)            => api.post('/api/coupons/validate', data),
};

// ==================== PAYMENT API ====================
export const paymentAPI = {
  bkashCreate:        (data) => api.post('/api/payment/bkash/create', data),
  bkashExecute:       (data) => api.post('/api/payment/bkash/execute', data),
  stripeCreateIntent: (data) => api.post('/api/payment/stripe/create-intent', data),
  stripeConfirm:      (data) => api.post('/api/payment/stripe/confirm', data),
  bankSubmit:         (data) => api.post('/api/payment/bank/submit', data),
  getBankAccounts:    ()     => api.get('/api/payment/bank/accounts'),
};

// ==================== ADMIN API ====================
export const adminAPI = {
  getStats:          (params)      => api.get('/api/admin/stats', { params }),
  getAnalytics:      (params)      => api.get('/api/admin/analytics', { params }),
  getInventory:      (params)      => api.get('/api/admin/inventory', { params }),
  exportData:        (type, params)=> api.get(`/api/admin/export/${type}`, { params }),
  googleDriveAuth:   ()            => api.get('/api/admin/google/auth'),
  backupToGoogleDrive: (data)      => api.post('/api/admin/google/backup', data),

  getUsers:          (params)      => api.get('/api/admin/users', { params }),
  getUserDetails:    (id)          => api.get(`/api/admin/users/${id}`),
  updateUser:        (id, data)    => api.put(`/api/admin/users/${id}`, data),
  deleteUser:        (id)          => api.delete(`/api/admin/users/${id}`),
  approveSeller:     (id, data)    => api.put(`/api/admin/approve-seller/${id}`, data),
  getSellerRequests: (params)      => api.get('/api/admin/seller-requests', { params }),

  getOrders:         (params)      => api.get('/api/admin/orders', { params }),
  updateOrder:       (id, data)    => api.put(`/api/admin/orders/${id}`, data),
  confirmOrderPayment: (id)        => api.put(`/api/orders/admin/${id}/confirm-payment`),
  failOrderPayment:  (id)          => api.put(`/api/orders/admin/${id}/fail-payment`),
  verifyBankPayment: (orderId, data) => api.put(`/api/payment/bank/verify/${orderId}`, data),

  getProducts:       (params)      => api.get('/api/admin/products', { params }),
  createProduct:     (data)        => api.post('/api/admin/products', data),
  updateProduct:     (id, data)    => api.put(`/api/admin/products/${id}`, data),
  deleteProduct:     (id)          => api.delete(`/api/admin/products/${id}`),

  getTransactions:   (params)      => api.get('/api/admin/transactions', { params }),
  createTransaction: (data)        => api.post('/api/admin/transactions', data),

  getSales:          (params)      => api.get('/api/admin/sales', { params }),
  createSale:        (data)        => api.post('/api/admin/sales', data),

  getPurchases:      (params)      => api.get('/api/admin/purchases', { params }),
  createPurchase:    (data)        => api.post('/api/admin/purchases', data),

  getSystemLogs:     (params)      => api.get('/api/admin/logs', { params }),
  
  // Config
  getConfig:         ()            => api.get('/api/admin/config'),
  updateConfig:      (data)        => api.put('/api/admin/config', data),
  updateHeaderContent: (data)      => api.post('/api/admin/header-content', data),
  getHeaderHistory:  ()            => api.get('/api/admin/header-history'),
  
  // Withdrawals (New Controller)
  getWithdrawals:    (params)      => api.get('/api/withdrawals/admin/all', { params }),
  updateWithdrawal:  (id, data)    => api.put(`/api/withdrawals/admin/${id}/status`, data),
  
  // Coupons
  getCoupons:        ()            => api.get('/api/coupons'),
  createCoupon:      (data)        => api.post('/api/coupons', data),
  updateCoupon:      (id, data)    => api.put(`/api/coupons/${id}`, data),
  deleteCoupon:      (id)          => api.delete(`/api/coupons/${id}`),
};

// ==================== SELLER API ====================
export const sellerAPI = {
  getStats:       (params) => api.get('/api/seller/stats', { params }),
  getProfile:     ()       => api.get('/api/seller/profile'),
  updateProfile:  (data)   => api.put('/api/seller/profile', data),
  getEarnings:    (params) => api.get('/api/seller/earnings', { params }),

  getProducts:    (params) => api.get('/api/seller/products', { params }),
  createProduct:  (data)   => api.post('/api/seller/products', data),
  updateProduct:  (id, data) => api.put(`/api/seller/products/${id}`, data),
  deleteProduct:  (id)     => api.delete(`/api/seller/products/${id}`),

  getOrders:      (params) => api.get('/api/seller/orders', { params }),
  updateOrder:    (id, data) => api.put(`/api/seller/orders/${id}`, data),

  getCustomers:   (params) => api.get('/api/seller/customers', { params }),
  
  // Withdrawals (New Controller)
  requestWithdrawal: (data) => api.post('/api/withdrawals', data),
  getWithdrawals: (params)  => api.get('/api/withdrawals/my', { params }),

  getSales:       (params) => api.get('/api/seller/sales', { params }),
  createSale:     (data)   => api.post('/api/seller/sales', data),
  updateSale:     (id, data) => api.put(`/api/seller/sales/${id}`, data),
  deleteSale:     (id)     => api.delete(`/api/seller/sales/${id}`),

  getPurchases:   (params) => api.get('/api/seller/purchases', { params }),
  createPurchase: (data)   => api.post('/api/seller/purchases', data),

  getTransactions: (params) => api.get('/api/seller/transactions', { params }),
  createTransaction: (data) => api.post('/api/seller/transactions', data),
  
  getChats:       (params) => api.get('/api/chats', { params }),
  getMessages:    (id)     => api.get(`/api/chats/${id}`),
  sendMessage:    (data)   => api.post('/api/chats/send', data),
};

// ==================== CHAT API ====================
export const chatAPI = {
  getChats:       (params) => api.get('/api/chats', { params }),
  getMessages:    (id)     => api.get(`/api/chats/${id}`),
  getChatWithUser: (receiverId) => api.get(`/api/chats/with/${receiverId}`),
  sendMessage:    (data)   => api.post('/api/chats/send', data),
  getAdmin:       ()       => api.get('/api/chats/admin'),
  editMessage:    (chatId, messageId, data) => api.put(`/api/chats/${chatId}/message/${messageId}`, data),
};

// ==================== COURIER API ====================
export const courierAPI = {
  getStats:           () => api.get('/api/courier/stats'),
  getDeliveries:      () => api.get('/api/courier/deliveries'),
  updateDeliveryStatus: (id, status) => api.put(`/api/courier/deliveries/${id}/status`, { status }),
};

// ==================== UPLOAD API ====================
export const uploadAPI = {
  uploadImages: (formData) => api.post('/api/upload', formData),
};

export default api;