// Dashboard.jsx - Complete Fixed Version
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Package,
  ShoppingBag,
  Heart,
  LogOut,
  Settings,
  Clock,
  MapPin,
  Phone,
  Mail,
  Edit2,
  X,
  TrendingUp,
  Award,
  ChevronRight,
  Truck,
  CheckCircle,
  AlertCircle,
  Home,
  Plus,
  Trash2,
  Star,
  Camera,
  Download,
  Search,
  RefreshCw,
  Crown,
  Gem,
  Shield,
  Zap,
  DollarSign
} from 'lucide-react';
import Navbar from '../components/Navbar';
// import Footer from './Footer';
import { useAuth } from '../contexts/useAuth';
import { userAPI, orderAPI } from '../services/api';
import toast from 'react-hot-toast';
import AddressFormModal from '../components/AddressFormModal';

// ==================== CONSTANTS ====================
const ORANGE = '#ff5500';

const USER_LEVELS = {
  Bronze: {
    name: 'Bronze',
    color: '#CD7F32',
    icon: Zap,
    minSpent: 0,
    maxSpent: 9999,
    benefits: ['Basic Support', 'Standard Delivery', '2% Membership Discount']
  },
  Silver: {
    name: 'Silver',
    color: '#C0C0C0',
    icon: Award,
    minSpent: 10000,
    maxSpent: 49999,
    benefits: ['Live Support', '3% Membership Discount', 'Standard Delivery', 'Exclusive Offers']
  },
  Gold: {
    name: 'Gold',
    color: '#FFD700',
    icon: Crown,
    minSpent: 50000,
    maxSpent: 99999,
    benefits: ['24/7 Premium Support', '4% Membership Discount', 'Express Delivery', 'Early Access']
  },
  Platinum: {
    name: 'Platinum',
    color: '#E5E4E2',
    icon: Gem,
    minSpent: 100000,
    maxSpent: 499999,
    benefits: ['Dedicated Account Manager', '5% Membership Discount', 'Free Delivery', 'Birthday Gifts']
  },
  VIP: {
    name: 'VIP',
    color: '#8B4513',
    icon: Crown,
    minSpent: 500000,
    maxSpent: Infinity,
    benefits: ['Personal Shopper', '6% Membership Discount', 'Free Premium Delivery', 'Invite-only Events']
  }
};

const STATUS_COLORS = {
  pending: { bg: 'bg-orange-100', text: 'text-orange-700', icon: Clock },
  confirmed: { bg: 'bg-blue-100', text: 'text-blue-700', icon: CheckCircle },
  processing: { bg: 'bg-purple-100', text: 'text-purple-700', icon: RefreshCw },
  shipped: { bg: 'bg-indigo-100', text: 'text-indigo-700', icon: Truck },
  delivered: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
  cancelled: { bg: 'bg-red-100', text: 'text-red-700', icon: X }
};

const PAYMENT_METHODS = {
  cash: 'Cash on Delivery',
  card: 'Credit/Debit Card',
  bkash: 'bKash',
  nagad: 'Nagad',
  rocket: 'Rocket'
};

// ==================== ADDRESS CARD COMPONENT ====================
const AddressCard = ({ address, isSelected, onSelect, onEdit, onDelete, onSetDefault }) => {
  const hasAllRequired = () => {
    const required = ['name', 'phone', 'addressLine1', 'city', 'postalCode'];
    return required.every(field => address[field] && address[field].trim() !== '');
  };

  const isValid = hasAllRequired();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border rounded-xl p-4 transition-all ${
        !isValid ? 'border-red-300 bg-red-50' :
        isSelected ? 'border-[#ff5500] bg-orange-50/30 shadow-md' : 'border-gray-200 hover:border-[#ff5500]/30'
      }`}
    >
      {!isValid && (
        <div className="mb-3 p-2 bg-red-100 text-red-700 text-xs rounded-lg flex items-center gap-1">
          <AlertCircle size={14} />
          <span>This address is incomplete. Please update it.</span>
        </div>
      )}
      
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            address.isDefault ? 'bg-[#ff5500] text-white' : 'bg-gray-100 text-gray-600'
          }`}>
            <Home size={16} />
          </div>
          <div>
            <p className="font-semibold text-slate-900">
              {address.label || 'Home'}
              {address.isDefault && (
                <span className="ml-2 text-xs bg-[#ff5500]/10 text-[#ff5500] px-2 py-0.5 rounded-full">
                  Default
                </span>
              )}
            </p>
          </div>
        </div>
        
        <div className="flex gap-1">
          <button
            onClick={() => onSelect(address)}
            disabled={!isValid}
            className={`p-1.5 rounded-lg transition ${
              isSelected 
                ? 'bg-[#ff5500] text-white' 
                : isValid ? 'hover:bg-gray-100 text-gray-500' : 'text-gray-300 cursor-not-allowed'
            }`}
          >
            <CheckCircle size={16} />
          </button>
          <button
            onClick={() => onEdit(address)}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition"
          >
            <Edit2 size={16} />
          </button>
          {!address.isDefault && (
            <button
              onClick={() => onDelete(address._id || address.id)}
              className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
      
      <div className="space-y-1 text-sm">
        <p className="font-medium text-slate-900">{address.name}</p>
        <p className="text-gray-600">{address.phone}</p>
        <p className="text-gray-600">
          {address.addressLine1}
          {address.addressLine2 && `, ${address.addressLine2}`}
        </p>
        <p className="text-gray-600">
          {address.city}, {address.state} - {address.postalCode}
        </p>
        <p className="text-gray-600">{address.country}</p>
      </div>
      
      {!address.isDefault && !isSelected && isValid && (
        <button
          onClick={() => onSetDefault(address._id || address.id)}
          className="mt-3 text-xs text-[#ff5500] hover:underline"
        >
          Set as default
        </button>
      )}
    </motion.div>
  );
};

// ==================== ORDER DETAILS MODAL ====================
const OrderDetailsModal = ({ order, onClose }) => {
  if (!order) return null;

  const StatusIcon = STATUS_COLORS[order.status]?.icon || Package;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">Order Details</h3>
              <p className="text-gray-500 text-sm mt-1">#{order.orderNumber}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <X size={20} />
            </button>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full ${STATUS_COLORS[order.status]?.bg} flex items-center justify-center`}>
                <StatusIcon size={20} className={STATUS_COLORS[order.status]?.text} />
              </div>
              <div>
                <p className="font-semibold text-slate-900 capitalize">{order.status}</p>
                <p className="text-sm text-gray-500">
                  Last updated: {new Date(order.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-200" />
              {['pending', 'confirmed', 'processing', 'shipped', 'delivered'].map((status, index) => {
                const statusOrder = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
                const isCompleted = statusOrder.indexOf(order.status) >= index;
                
                return (
                  <div key={status} className="relative flex gap-3 mb-4 last:mb-0">
                    <div className={`w-4 h-4 rounded-full mt-1 z-10 ${
                      isCompleted ? 'bg-[#ff5500]' : 'bg-gray-300'
                    }`} />
                    <div>
                      <p className={`font-medium capitalize ${isCompleted ? 'text-slate-900' : 'text-gray-400'}`}>
                        {status}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mb-6">
            <h4 className="font-bold text-slate-900 mb-3">Items ({order.items?.length || 0})</h4>
            <div className="space-y-3">
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex gap-3 p-3 border border-gray-200 rounded-xl">
                  <img
                    src={item.image || '/placeholder.png'}
                    alt={item.name}
                    className="w-16 h-16 object-contain bg-gray-50 rounded-lg"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{item.name}</p>
                    <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                    <p className="text-[#ff5500] font-bold mt-1">৳{item.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h4 className="font-bold text-slate-900 mb-3">Shipping Address</h4>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="font-medium text-slate-900">{order.shippingAddress?.name}</p>
              <p className="text-sm text-gray-600 mt-1">{order.shippingAddress?.phone}</p>
              <p className="text-sm text-gray-600 mt-1">
                {order.shippingAddress?.addressLine1}
                {order.shippingAddress?.addressLine2 && `, ${order.shippingAddress?.addressLine2}`}
                <br />
                {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.postalCode}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="font-bold text-slate-900 mb-3">Payment Information</h4>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Payment Method</span>
                <span className="font-medium text-slate-900">{PAYMENT_METHODS[order.paymentMethod] || order.paymentMethod}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Payment Status</span>
                <span className={`font-medium ${
                  order.paymentStatus === 'paid' ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {order.paymentStatus}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
                <span className="font-bold text-slate-900">Total Amount</span>
                <span className="font-bold text-[#ff5500] text-xl">৳{order.totalPrice}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => window.print()}
              className="flex-1 flex items-center justify-center gap-2 border border-gray-300 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 transition"
            >
              <Download size={18} />
              Download Invoice
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ==================== STATS CARD COMPONENT ====================
const StatsCard = ({ icon: Icon, label, value, color, trend }) => (
  <motion.div
    whileHover={{ y: -2 }}
    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all"
  >
    <div className="flex items-center justify-between mb-3">
      <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>
        <Icon size={24} className="text-white" />
      </div>
      {trend && (
        <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
          +{trend}%
        </span>
      )}
    </div>
    <p className="text-sm text-gray-600 mb-1">{label}</p>
    <p className="text-2xl font-bold text-slate-900">{value}</p>
  </motion.div>
);

// ==================== MAIN DASHBOARD COMPONENT ====================
const Dashboard = () => {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [profileImage, setProfileImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    wishlistCount: 0,
    averageOrderValue: 0
  });

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || ''
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      let ordersData = [];
      let addressesData = [];

      try {
        const ordersRes = await orderAPI.getMyOrders({ limit: 50 });
        if (ordersRes.data.success) {
          ordersData = ordersRes.data.orders || [];
          setOrders(ordersData);
          
          const totalSpent = ordersData.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
          const pendingOrders = ordersData.filter(o => o.status === 'pending').length;
          const deliveredOrders = ordersData.filter(o => o.status === 'delivered').length;
          
          setStats(prev => ({
            ...prev,
            totalOrders: ordersData.length,
            totalSpent,
            pendingOrders,
            deliveredOrders,
            averageOrderValue: ordersData.length > 0 
              ? Math.round(totalSpent / ordersData.length) 
              : 0,
            wishlistCount: user?.favorites?.length || 0
          }));
        }
      } catch (error) {
        console.warn('Using mock orders data');
        ordersData = [
          {
            _id: '1',
            orderNumber: 'ORD-2401-0001',
            status: 'delivered',
            totalPrice: 12500,
            items: [
              { name: 'Wireless Headphones', quantity: 1, price: 8500, image: '/placeholder.png' },
              { name: 'Phone Case', quantity: 2, price: 2000, image: '/placeholder.png' }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            paymentMethod: 'bkash',
            paymentStatus: 'paid',
            shippingAddress: {
              name: user?.name || 'Customer',
              phone: user?.phoneNumber || '01712345678',
              addressLine1: '123 Main Street',
              city: 'Dhaka',
              state: 'Dhaka',
              postalCode: '1212'
            }
          }
        ];
        setOrders(ordersData);
      }

      try {
        const addressesRes = await userAPI.getAddresses();
        if (addressesRes.data.success) {
          addressesData = addressesRes.data.addresses || [];
          setAddresses(addressesData);
          
          const defaultAddress = addressesData.find(addr => addr.isDefault);
          if (defaultAddress) {
            setSelectedAddress(defaultAddress);
          } else if (addressesData.length > 0) {
            setSelectedAddress(addressesData[0]);
          }
        }
      } catch (error) {
        console.warn('Using mock addresses data');
        addressesData = [
          {
            id: '1',
            label: 'Home',
            name: user?.name || 'Customer',
            phone: user?.phoneNumber || '01712345678',
            addressLine1: '123 Main Street',
            addressLine2: 'Apt 4B',
            city: 'Dhaka',
            state: 'Dhaka',
            postalCode: '1212',
            country: 'Bangladesh',
            isDefault: true
          }
        ];
        setAddresses(addressesData);
        setSelectedAddress(addressesData[0]);
      }

    } catch (error) {
      console.error('Error in dashboard:', error);
      toast.error('Failed to load some data. Showing available information.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const response = await userAPI.updateProfile(formData);
      if (response.data.success) {
        setUser({ ...user, ...response.data.user });
        setEditing(false);
        toast.success('Profile updated successfully');
      } else {
        toast.error(response.data.message || 'Update failed');
      }
    } catch (error) {
      // Error toast is already shown by api.js interceptor
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, or WebP)');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size should be less than 2MB');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    setUploadingImage(true);
    const loadingToast = toast.loading('Uploading image...');

    try {
      const response = await userAPI.uploadProfileImage(formData);
      if (response.data.success) {
        setUser({ ...user, profilePic: response.data.imageUrl });
        setProfileImage(response.data.imageUrl);
        toast.success('Profile image updated', { id: loadingToast });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload image', { id: loadingToast });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveAddress = async (addressData) => {
    try {
      if (editingAddress) {
        const response = await userAPI.updateAddress(editingAddress._id || editingAddress.id, addressData);
        if (response.data.success) {
          setAddresses(response.data.addresses);
          const updated = response.data.addresses.find(a => (a._id || a.id) === (editingAddress._id || editingAddress.id));
          if (updated?.isDefault) setSelectedAddress(updated);
          toast.success('Address updated');
        }
      } else {
        const response = await userAPI.addAddress(addressData);
        if (response.data.success) {
          setAddresses(response.data.addresses);
          if (addressData.isDefault || response.data.addresses.length === 1) {
            const newDefault = response.data.addresses.find(a => a.isDefault) || response.data.addresses[0];
            setSelectedAddress(newDefault);
          }
          toast.success('Address added');
        }
      }
      setShowAddressForm(false);
      setEditingAddress(null);
    } catch (error) {
      toast.error('Failed to save address');
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      const response = await userAPI.deleteAddress(addressId);
      if (response.data.success) {
        setAddresses(response.data.addresses);
        if ((selectedAddress?._id || selectedAddress?.id) === addressId) {
          setSelectedAddress(response.data.addresses.find(a => a.isDefault) || response.data.addresses[0] || null);
        }
        toast.success('Address deleted');
      }
    } catch { toast.error('Failed to delete address'); }
  };

  const handleSetDefaultAddress = async (addressId) => {
    try {
      const response = await userAPI.setDefaultAddress(addressId);
      if (response.data.success) {
        setAddresses(response.data.addresses);
        setSelectedAddress(response.data.addresses.find(a => (a._id || a.id) === addressId));
        toast.success('Default address updated');
      }
    } catch { toast.error('Failed to set default address'); }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchQuery === '' || 
      order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items?.some(item => item.name?.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    let matchesDate = true;
    if (dateRange !== 'all' && order.createdAt) {
      const orderDate = new Date(order.createdAt);
      const now = new Date();
      const daysDiff = Math.floor((now - orderDate) / (1000 * 60 * 60 * 24));
      
      switch(dateRange) {
        case '7days': matchesDate = daysDiff <= 7; break;
        case '30days': matchesDate = daysDiff <= 30; break;
        case '90days': matchesDate = daysDiff <= 90; break;
        default: matchesDate = true;
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const userLevel = user?.level || 'Bronze';
  const levelConfig = USER_LEVELS[userLevel] || USER_LEVELS.Bronze;
  const LevelIcon = levelConfig.icon;

  const levelKeys = Object.keys(USER_LEVELS);
  const currentIndex = levelKeys.indexOf(userLevel);
  const nextLevel = currentIndex < levelKeys.length - 1 ? levelKeys[currentIndex + 1] : null;
  const nextLevelConfig = nextLevel ? USER_LEVELS[nextLevel] : null;
  
  const progress = nextLevelConfig 
    ? ((stats.totalSpent - levelConfig.minSpent) / (nextLevelConfig.minSpent - levelConfig.minSpent)) * 100
    : 100;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner with Level */}
        <div 
          className="rounded-2xl p-6 mb-8 text-white relative overflow-hidden"
          style={{ 
            background: `linear-gradient(135deg, ${levelConfig.color} 0%, ${levelConfig.color}dd 100%)`
          }}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24" />
          
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <LevelIcon size={32} className="text-white/90" />
                <h1 className="text-2xl font-bold">
                  Welcome back, {user?.name || 'Customer'}! 👋
                </h1>
              </div>
              <p className="text-white/90 mb-3">
                {levelConfig.name} Member • Total Spent: ৳{stats.totalSpent.toLocaleString()}
              </p>
              <div className="flex gap-2">
                {levelConfig.benefits.map((benefit, index) => (
                  <span key={index} className="text-xs bg-white/20 px-3 py-1 rounded-full">
                    {benefit}
                  </span>
                ))}
              </div>
            </div>
            <div className="hidden md:block text-right">
              <p className="text-4xl font-black mb-1">{levelConfig.name}</p>
              <p className="text-sm text-white/80">Member Level</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
              {/* Profile Summary with Level Badge */}
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 overflow-hidden ring-4 ring-white shadow-lg">
                    {profileImage || user?.profilePic ? (
                      <img 
                        src={profileImage || user?.profilePic} 
                        alt={user?.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="text-gray-400" size={40} />
                    )}
                  </div>
                  <label 
                    className="absolute bottom-0 right-0 w-8 h-8 bg-[#ff5500] rounded-full flex items-center justify-center cursor-pointer hover:bg-opacity-90 transition shadow-lg"
                    style={{ backgroundColor: levelConfig.color }}
                  >
                    <Camera size={14} className="text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>
                </div>
                
                <h3 className="font-bold text-slate-900 text-lg">{user?.name}</h3>
                <p className="text-sm text-gray-500 mb-2">{user?.email}</p>
                
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-3"
                  style={{ 
                    backgroundColor: `${levelConfig.color}15`,
                    color: levelConfig.color,
                    border: `1px solid ${levelConfig.color}30`
                  }}
                >
                  <LevelIcon size={16} />
                  <span>{levelConfig.name} Member</span>
                </div>

                {nextLevelConfig && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Current: ৳{stats.totalSpent.toLocaleString()}</span>
                      <span>Next: ৳{nextLevelConfig.minSpent.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${Math.min(Math.max(progress, 0), 100)}%`,
                          backgroundColor: levelConfig.color
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      ৳{(nextLevelConfig.minSpent - stats.totalSpent).toLocaleString()} more to reach {nextLevel}
                    </p>
                  </div>
                )}
              </div>

              <nav className="space-y-1">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                      activeTab === tab.id
                        ? 'bg-[#ff5500] text-white'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <tab.icon size={18} />
                      <span className="font-medium">{tab.label}</span>
                    </div>
                    {activeTab === tab.id && <ChevronRight size={16} />}
                  </button>
                ))}

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all mt-4"
                >
                  <LogOut size={18} />
                  <span className="font-medium">Logout</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ff5500]"></div>
              </div>
            ) : (
              <>
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <StatsCard
                        icon={ShoppingBag}
                        label="Total Orders"
                        value={stats.totalOrders}
                        color="bg-[#ff5500]"
                      />
                      <StatsCard
                        icon={DollarSign}
                        label="Total Spent"
                        value={`৳${stats.totalSpent.toLocaleString()}`}
                        color="bg-green-500"
                      />
                      <StatsCard
                        icon={Clock}
                        label="Pending Orders"
                        value={stats.pendingOrders}
                        color="bg-yellow-500"
                      />
                      <StatsCard
                        icon={Award}
                        label="Avg. Order"
                        value={`৳${stats.averageOrderValue.toLocaleString()}`}
                        color="bg-purple-500"
                      />
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-slate-900">
                          Recent Orders
                        </h3>
                        <button
                          onClick={() => setActiveTab('orders')}
                          className="text-sm text-[#ff5500] hover:underline"
                        >
                          View All
                        </button>
                      </div>
                      
                      {orders.length === 0 ? (
                        <div className="text-center py-12">
                          <ShoppingBag className="mx-auto text-gray-300 mb-3" size={48} />
                          <p className="text-gray-500 mb-4">No orders yet</p>
                          <Link
                            to="/shop"
                            className="inline-block bg-[#ff5500] text-white font-bold px-6 py-3 rounded-xl hover:bg-opacity-90 transition"
                          >
                            Start Shopping
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {orders.slice(0, 5).map(order => (
                            <button
                              key={order._id}
                              onClick={() => setSelectedOrder(order)}
                              className="w-full text-left p-4 border border-gray-100 rounded-xl hover:border-[#ff5500]/20 hover:bg-gray-50 transition"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-mono text-sm text-gray-500">
                                  #{order.orderNumber}
                                </span>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[order.status]?.bg} ${STATUS_COLORS[order.status]?.text}`}>
                                  {order.status}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-gray-600">
                                    {order.items?.length || 0} items
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-BD', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    }) : 'N/A'}
                                  </p>
                                </div>
                                <span className="font-bold text-[#ff5500]">
                                  ৳{(order.totalPrice || 0).toLocaleString()}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {selectedAddress && (
                      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold text-slate-900">
                            Default Shipping Address
                          </h3>
                          <button
                            onClick={() => setActiveTab('addresses')}
                            className="text-sm text-[#ff5500] hover:underline"
                          >
                            Manage Addresses
                          </button>
                        </div>
                        <AddressCard
                          address={selectedAddress}
                          isSelected={true}
                          onSelect={() => {}}
                          onEdit={(addr) => {
                            setEditingAddress(addr);
                            setShowAddressForm(true);
                          }}
                          onDelete={handleDeleteAddress}
                          onSetDefault={handleSetDefaultAddress}
                        />
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Orders Tab */}
                {activeTab === 'orders' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                      <h3 className="text-lg font-bold text-slate-900">
                        Order History
                      </h3>
                      
                      <div className="flex flex-wrap gap-3">
                        <div className="relative">
                          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search orders..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#ff5500] outline-none"
                          />
                        </div>

                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#ff5500] outline-none"
                        >
                          <option value="all">All Status</option>
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>

                        <select
                          value={dateRange}
                          onChange={(e) => setDateRange(e.target.value)}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#ff5500] outline-none"
                        >
                          <option value="all">All Time</option>
                          <option value="7days">Last 7 Days</option>
                          <option value="30days">Last 30 Days</option>
                          <option value="90days">Last 90 Days</option>
                        </select>
                      </div>
                    </div>
                    
                    {filteredOrders.length === 0 ? (
                      <div className="text-center py-12">
                        <Package className="mx-auto text-gray-300 mb-3" size={48} />
                        <p className="text-gray-500 mb-4">No orders found</p>
                        {searchQuery || statusFilter !== 'all' || dateRange !== 'all' ? (
                          <button
                            onClick={() => {
                              setSearchQuery('');
                              setStatusFilter('all');
                              setDateRange('all');
                            }}
                            className="text-[#ff5500] hover:underline"
                          >
                            Clear filters
                          </button>
                        ) : (
                          <Link
                            to="/shop"
                            className="inline-block bg-[#ff5500] text-white font-bold px-6 py-3 rounded-xl hover:bg-opacity-90 transition"
                          >
                            Browse Products
                          </Link>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredOrders.map(order => {
                          const StatusIcon = STATUS_COLORS[order.status]?.icon || Package;
                          return (
                            <motion.div
                              key={order._id}
                              whileHover={{ scale: 1.01 }}
                              className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition cursor-pointer"
                              onClick={() => setSelectedOrder(order)}
                            >
                              <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                                <div className="flex items-start gap-3">
                                  <div className={`w-10 h-10 rounded-full ${STATUS_COLORS[order.status]?.bg} flex items-center justify-center`}>
                                    <StatusIcon size={18} className={STATUS_COLORS[order.status]?.text} />
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-500">Order Number</p>
                                    <p className="font-mono font-bold text-slate-900">#{order.orderNumber}</p>
                                  </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[order.status]?.bg} ${STATUS_COLORS[order.status]?.text}`}>
                                  {order.status?.toUpperCase()}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-3">
                                <div>
                                  <p className="text-xs text-gray-500">Date</p>
                                  <p className="text-sm font-medium text-slate-900">
                                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-BD', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    }) : 'N/A'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Items</p>
                                  <p className="text-sm font-medium text-slate-900">{order.items?.length || 0}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Payment</p>
                                  <p className="text-sm font-medium text-slate-900">{PAYMENT_METHODS[order.paymentMethod] || order.paymentMethod}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Total</p>
                                  <p className="text-sm font-bold text-[#ff5500]">৳{(order.totalPrice || 0).toLocaleString()}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 mt-2">
                                {order.items?.slice(0, 3).map((item, idx) => (
                                  <div key={idx} className="relative">
                                    <img
                                      src={item.image || '/placeholder.png'}
                                      alt={item.name}
                                      className="w-10 h-10 object-contain bg-gray-50 rounded-lg border border-gray-200"
                                    />
                                    {item.quantity > 1 && (
                                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#ff5500] text-white text-xs rounded-full flex items-center justify-center">
                                        {item.quantity}
                                      </span>
                                    )}
                                  </div>
                                ))}
                                {order.items?.length > 3 && (
                                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-600 font-bold">
                                    +{order.items.length - 3}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Addresses Tab */}
                {activeTab === 'addresses' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-slate-900">
                        Shipping Addresses
                      </h3>
                      <button
                        onClick={() => {
                          setEditingAddress(null);
                          setShowAddressForm(true);
                        }}
                        className="flex items-center gap-2 bg-[#ff5500] text-white font-bold px-4 py-2 rounded-lg hover:bg-opacity-90 transition"
                      >
                        <Plus size={16} />
                        Add New Address
                      </button>
                    </div>

                    {addresses.length === 0 ? (
                      <div className="text-center py-12">
                        <MapPin className="mx-auto text-gray-300 mb-3" size={48} />
                        <p className="text-gray-500 mb-4">No addresses saved yet</p>
                        <button
                          onClick={() => {
                            setEditingAddress(null);
                            setShowAddressForm(true);
                          }}
                          className="inline-flex items-center gap-2 bg-[#ff5500] text-white font-bold px-6 py-3 rounded-xl hover:bg-opacity-90 transition"
                        >
                          <Plus size={18} />
                          Add Your First Address
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {addresses.map(address => (
                          <AddressCard
                            key={address._id || address.id}
                            address={address}
                            isSelected={selectedAddress?._id === address._id || selectedAddress?.id === address.id}
                            onSelect={setSelectedAddress}
                            onEdit={(addr) => {
                              setEditingAddress(addr);
                              setShowAddressForm(true);
                            }}
                            onDelete={handleDeleteAddress}
                            onSetDefault={handleSetDefaultAddress}
                          />
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Wishlist Tab */}
                {activeTab === 'wishlist' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
                  >
                    <h3 className="text-lg font-bold text-slate-900 mb-4">
                      My Wishlist
                    </h3>
                    
                    {!user?.favorites || user.favorites.length === 0 ? (
                      <div className="text-center py-12">
                        <Heart className="mx-auto text-gray-300 mb-3" size={48} />
                        <p className="text-gray-500 mb-4">Your wishlist is empty</p>
                        <Link
                          to="/shop"
                          className="inline-block bg-[#ff5500] text-white font-bold px-6 py-3 rounded-xl hover:bg-opacity-90 transition"
                        >
                          Explore Products
                        </Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {user.favorites.map(product => (
                          <motion.div
                            key={product._id}
                            whileHover={{ y: -2 }}
                            className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition"
                          >
                            <div className="relative mb-3">
                              <img
                                src={product.image || '/placeholder.png'}
                                alt={product.name}
                                className="w-full h-32 object-contain bg-gray-50 rounded-lg"
                              />
                              <button
                                onClick={async () => {
                                  try {
                                    const updatedFavorites = user.favorites.filter(f => f._id !== product._id);
                                    setUser({ ...user, favorites: updatedFavorites });
                                    toast.success('Removed from wishlist');
                                  } catch (error) {
                                    toast.error('Failed to remove');
                                  }
                                }}
                                className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-red-50 transition"
                              >
                                <Heart size={14} className="text-[#ff5500]" fill="#ff5500" />
                              </button>
                            </div>
                            <h4 className="font-bold text-slate-900 mb-2 line-clamp-2">
                              {product.name}
                            </h4>
                            <div className="flex items-center gap-1 mb-2">
                              <Star size={14} className="text-yellow-400 fill-current" />
                              <span className="text-sm text-gray-600">{product.rating || 4.5}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[#ff5500] text-lg">
                                ৳{(product.sellingPrice || product.price || 0).toLocaleString()}
                              </span>
                              <Link
                                to={`/product/${product._id}`}
                                className="text-sm bg-[#ff5500] text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition"
                              >
                                View
                              </Link>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-slate-900">
                        Profile Settings
                      </h3>
                      {!editing && (
                        <button
                          onClick={() => setEditing(true)}
                          className="flex items-center gap-2 text-[#ff5500] hover:underline"
                        >
                          <Edit2 size={16} />
                          Edit Profile
                        </button>
                      )}
                    </div>

                    {editing ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Full Name
                          </label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff5500] outline-none"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                          </label>
                          <input
                            type="email"
                            value={formData.email}
                            disabled
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg cursor-not-allowed"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Email cannot be changed
                          </p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            value={formData.phoneNumber}
                            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff5500] outline-none"
                          />
                        </div>
                        
                        <div className="flex gap-3 pt-4">
                          <button
                            onClick={handleUpdateProfile}
                            className="flex-1 bg-[#ff5500] text-white font-bold py-3 rounded-xl hover:bg-opacity-90 transition"
                          >
                            Save Changes
                          </button>
                          <button
                            onClick={() => {
                              setEditing(false);
                              setFormData({
                                name: user?.name || '',
                                email: user?.email || '',
                                phoneNumber: user?.phoneNumber || ''
                              });
                            }}
                            className="flex-1 border border-gray-300 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                          <User className="text-gray-400 shrink-0 mt-1" size={18} />
                          <div>
                            <p className="text-sm text-gray-500">Full Name</p>
                            <p className="font-medium text-slate-900">{user?.name}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                          <Mail className="text-gray-400 shrink-0 mt-1" size={18} />
                          <div>
                            <p className="text-sm text-gray-500">Email</p>
                            <p className="font-medium text-slate-900">{user?.email}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                          <Phone className="text-gray-400 shrink-0 mt-1" size={18} />
                          <div>
                            <p className="text-sm text-gray-500">Phone</p>
                            <p className="font-medium text-slate-900">{user?.phoneNumber || 'Not set'}</p>
                          </div>
                        </div>
                        
                        <div className="pt-4 border-t border-gray-100">
                          <p className="text-sm text-gray-500 mb-1">Member Since</p>
                          <p className="font-medium text-slate-900">
                            {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            }) : 'N/A'}
                          </p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <OrderDetailsModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
          />
        )}
      </AnimatePresence>

      {/* Address Form Modal */}
      <AnimatePresence>
        {showAddressForm && (
          <AddressFormModal
            address={editingAddress}
            onClose={() => {
              setShowAddressForm(false);
              setEditingAddress(null);
            }}
            onSave={handleSaveAddress}
          />
        )}
      </AnimatePresence>

    </div>
  );
};

export default Dashboard;