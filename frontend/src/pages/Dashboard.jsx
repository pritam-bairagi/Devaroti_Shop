import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  CreditCard,
  Hash,
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
  Zap,
  DollarSign,
  MessageSquare,
  Menu,
  ArrowUp
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/useAuth';
import { userAPI, orderAPI, chatAPI } from '../services/api';
import { resizeImage } from '../utils/imageUtils';
import toast from 'react-hot-toast';
import AddressFormModal from '../components/AddressFormModal';
import ChatWindow from '../components/ChatWindow';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ==================== CONSTANTS ====================
const ORANGE = '#ff5500';

const USER_LEVELS = {
  Bronze: {
    name: 'Bronze',
    color: '#CD7F32',
    icon: Zap,
    minSpent: 0,
    maxSpent: 9999,
    benefits: ['Basic Support', 'Standard Delivery', '2% Discount']
  },
  Silver: {
    name: 'Silver',
    color: '#C0C0C0',
    icon: Award,
    minSpent: 10000,
    maxSpent: 49999,
    benefits: ['Live Support', '3% Discount', 'Express Delivery']
  },
  Gold: {
    name: 'Gold',
    color: '#FFD700',
    icon: Crown,
    minSpent: 50000,
    maxSpent: 99999,
    benefits: ['24/7 Support', '4% Discount', 'Express Delivery']
  },
  Platinum: {
    name: 'Platinum',
    color: '#E5E4E2',
    icon: Gem,
    minSpent: 100000,
    maxSpent: 499999,
    benefits: ['Account Manager', '5% Discount', 'Free Delivery']
  },
  VIP: {
    name: 'VIP',
    color: '#8B4513',
    icon: Crown,
    minSpent: 500000,
    maxSpent: Infinity,
    benefits: ['Personal Shopper', '6% Discount', 'Premium Support']
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

// ==================== ANIMATION VARIANTS ====================
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
};

// ==================== ADDRESS CARD COMPONENT ====================
const AddressCard = React.memo(({ 
  address = {}, 
  isSelected = false, 
  onSelect = () => {}, 
  onEdit = () => {}, 
  onDelete = () => {}, 
  onSetDefault = () => {} 
}) => {
  const hasAllRequired = useCallback(() => {
    if (!address) return false;
    const required = ['name', 'phone', 'addressLine1', 'city', 'postalCode'];
    return required.every(field => address[field] && String(address[field]).trim() !== '');
  }, [address]);

  const isValid = useMemo(() => hasAllRequired(), [hasAllRequired]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border rounded-2xl p-4 sm:p-6 transition-all duration-300 ${
        !isValid 
          ? 'border-red-300 bg-red-50' 
          : isSelected 
            ? 'border-[#ff5500] bg-orange-50/30 shadow-lg' 
            : 'border-gray-200 hover:border-[#ff5500]/50 hover:shadow-md'
      }`}
    >
      {!isValid && (
        <div className="mb-3 p-3 bg-red-100 text-red-700 text-xs sm:text-sm rounded-lg flex items-center gap-2">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span>Address incomplete. Please update it.</span>
        </div>
      )}
      
      <div className="flex items-start justify-between mb-3 sm:mb-4 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            address.isDefault ? 'bg-[#ff5500] text-white' : 'bg-gray-100 text-gray-600'
          }`}>
            <Home size={18} />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 text-sm sm:text-base truncate">
              {address.label || 'Home'}
              {address.isDefault && (
                <span className="ml-2 text-xs bg-[#ff5500]/10 text-[#ff5500] px-2 py-0.5 rounded-full">
                  Default
                </span>
              )}
            </p>
          </div>
        </div>
        
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={() => onSelect?.(address)}
            disabled={!isValid}
            title={isValid ? "Select this address" : "Complete address first"}
            className={`p-2 rounded-lg transition-all ${
              isSelected 
                ? 'bg-[#ff5500] text-white' 
                : isValid 
                  ? 'hover:bg-gray-100 text-gray-500 active:scale-95' 
                  : 'text-gray-300 cursor-not-allowed'
            }`}
          >
            <CheckCircle size={18} />
          </button>
          <button
            onClick={() => onEdit?.(address)}
            title="Edit address"
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-all active:scale-95"
          >
            <Edit2 size={18} />
          </button>
          {!address.isDefault && (
            <button
              onClick={() => onDelete?.(address._id || address.id)}
              title="Delete address"
              className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-all active:scale-95"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>
      
      <div className="space-y-1 text-xs sm:text-sm">
        <p className="font-medium text-slate-900">{address.name || 'N/A'}</p>
        <p className="text-gray-600">{address.phone || 'N/A'}</p>
        <p className="text-gray-600 break-words">
          {address.addressLine1 || 'N/A'}
          {address.addressLine2 && `, ${address.addressLine2}`}
        </p>
        <p className="text-gray-600">
          {address.city || 'N/A'}, {address.state || 'N/A'} - {address.postalCode || 'N/A'}
        </p>
        <p className="text-gray-600">{address.country || 'N/A'}</p>
      </div>
      
      {!address.isDefault && !isSelected && isValid && (
        <button
          onClick={() => onSetDefault?.(address._id || address.id)}
          className="mt-3 text-xs text-[#ff5500] hover:underline font-medium transition-all active:scale-95"
        >
          Set as default
        </button>
      )}
    </motion.div>
  );
});

AddressCard.displayName = 'AddressCard';

// ==================== INVOICE GENERATOR ====================
const generateInvoice = (order) => {
  if (!order) {
    toast.error('Order data not found');
    return;
  }
  
  try {
    const doc = new jsPDF();
    const orange = [255, 85, 0];
    
    // Header
    doc.setFillColor(245, 245, 245);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(...orange);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('DEVAROTI SHOP', 14, 25);
    
    doc.setTextColor(100);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Multi-Vendor Marketplace', 14, 32);
    
    doc.setTextColor(50);
    doc.setFontSize(16);
    doc.text('INVOICE', 160, 25);
    doc.setFontSize(9);
    doc.text(`Order: #${order.orderNumber}`, 160, 32);
    
    // Info Section
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', 14, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(order.shippingAddress?.name || 'N/A', 14, 60);
    doc.text(order.shippingAddress?.phone || '', 14, 65);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Order Info:', 110, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 110, 60);
    doc.text(`Status: ${order.status?.toUpperCase()}`, 110, 65);
    doc.text(`Payment: ${order.paymentMethod?.toUpperCase()}`, 110, 70);

    // Table
    const tableData = order.items?.map(item => [
      item.name,
      item.quantity,
      `৳${item.price.toLocaleString()}`,
      `৳${(item.price * item.quantity).toLocaleString()}`
    ]) || [];

    autoTable(doc, {
      startY: 85,
      head: [['Product', 'Qty', 'Unit Price', 'Total']],
      body: tableData,
      headStyles: { fillColor: orange, textColor: 255 },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        // Optional: footer or header on each page
      }
    });

    const finalY = doc.lastAutoTable?.finalY || 150;
    
    // Totals
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 140, finalY + 10);
    doc.setFont('helvetica', 'normal');
    const summaryY = finalY + 17;
    doc.text(`Subtotal:`, 140, summaryY);
    doc.text(`৳${order.subtotal?.toLocaleString() || '0'}`, 185, summaryY, { align: 'right' });
    doc.text(`Shipping:`, 140, summaryY + 5);
    doc.text(`৳${order.shippingCost?.toLocaleString() || '0'}`, 185, summaryY + 5, { align: 'right' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...orange);
    doc.text(`GRAND TOTAL:`, 140, summaryY + 15);
    doc.text(`৳${order.totalPrice?.toLocaleString() || '0'}`, 185, summaryY + 15, { align: 'right' });

    // Footer
    doc.setTextColor(150);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Thank you for shopping with Devaroti!', 105, 280, { align: 'center' });
    doc.text('This is a computer generated invoice.', 105, 285, { align: 'center' });

    doc.save(`Invoice_${order.orderNumber}.pdf`);
    toast.success('Invoice downloaded');
  } catch (error) {
    console.error('PDF error:', error);
    toast.error('Failed to generate PDF');
  }
};

// ==================== ORDER DETAILS MODAL ====================
const OrderDetailsModal = React.memo(({ order = null, onClose = () => {} }) => {
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
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6 gap-4">
            <div className="min-w-0">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">
                Order Details
              </h3>
              <p className="text-gray-500 text-xs sm:text-sm mt-1">
                #{order.orderNumber || 'N/A'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all flex-shrink-0 active:scale-95"
            >
              <X size={20} />
            </button>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4 sm:p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-full flex-shrink-0 ${STATUS_COLORS[order.status]?.bg} flex items-center justify-center`}>
                <StatusIcon size={24} className={STATUS_COLORS[order.status]?.text} />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 capitalize text-sm sm:text-base">
                  {order.status || 'Unknown'}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">
                  Last updated: {order.updatedAt ? new Date(order.updatedAt).toLocaleString('en-BD') : 'N/A'}
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-200" />
              {['pending', 'confirmed', 'processing', 'shipped', 'delivered'].map((status, index) => {
                const statusOrder = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
                const isCompleted = statusOrder.indexOf(order.status) >= index;
                
                return (
                  <div key={status} className="relative flex gap-3 mb-4 last:mb-0 pl-6">
                    <div className={`w-4 h-4 rounded-full -left-2 absolute top-1 z-10 ${
                      isCompleted ? 'bg-[#ff5500]' : 'bg-gray-300'
                    }`} />
                    <div>
                      <p className={`font-medium capitalize text-xs sm:text-sm ${isCompleted ? 'text-slate-900' : 'text-gray-400'}`}>
                        {status}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {order.trackingNumber && (
            <div className="mb-6 bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="bg-blue-500 p-2 rounded-lg text-white shrink-0">
                   <Truck size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Tracking Number</p>
                  <p className="text-sm font-bold text-slate-800 font-mono select-all bg-white px-2 py-0.5 rounded border border-blue-200 mt-0.5 truncate">{order.trackingNumber}</p>
                </div>
              </div>
              {order.courier && (
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Courier</p>
                  <p className="text-sm font-semibold text-slate-700">{order.courier}</p>
                </div>
              )}
            </div>
          )}

          <div className="mb-6">
            <h4 className="font-bold text-slate-900 mb-3 text-sm sm:text-base">
              Items ({order.items?.length || 0})
            </h4>
            <div className="space-y-3">
              {order.items && order.items.length > 0 ? (
                order.items.map((item, idx) => (
                  <div key={idx} className="flex gap-3 p-3 sm:p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all">
                    <img
                      src={item.image || '/placeholder.png'}
                      alt={item.name || 'Product'}
                      className="w-16 h-16 sm:w-20 sm:h-20 object-contain bg-gray-50 rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm sm:text-base truncate">
                        {item.name || 'N/A'}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        Quantity: {item.quantity || 0}
                      </p>
                      <p className="text-[#ff5500] font-bold mt-1 text-sm sm:text-base">
                        ৳{(item.price || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No items found</p>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h4 className="font-bold text-slate-900 mb-3 text-sm sm:text-base">Shipping Address</h4>
            <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
              <p className="font-medium text-slate-900 text-sm sm:text-base">
                {order.shippingAddress?.name || 'N/A'}
              </p>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 break-all">
                {order.shippingAddress?.phone || 'N/A'}
              </p>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 break-words">
                {order.shippingAddress?.addressLine1 || 'N/A'}
                {order.shippingAddress?.addressLine2 && `, ${order.shippingAddress.addressLine2}`}
                <br />
                {order.shippingAddress?.city || 'N/A'}, {order.shippingAddress?.state || 'N/A'} - {order.shippingAddress?.postalCode || 'N/A'}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="font-bold text-slate-900 mb-3 text-sm sm:text-base">Payment Information</h4>
            <div className="bg-gray-50 rounded-xl p-4 sm:p-6 space-y-2">
              <div className="flex justify-between text-xs sm:text-sm items-center">
                <div className="flex items-center gap-2 text-gray-600">
                  <CreditCard size={14} />
                  <span>Payment Method</span>
                </div>
                <span className="font-medium text-slate-900">
                  {PAYMENT_METHODS[order.paymentMethod] || order.paymentMethod || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm items-center">
                <div className="flex items-center gap-2 text-gray-600">
                  <CheckCircle size={14} />
                  <span>Payment Status</span>
                </div>
                <span className={`font-medium capitalize ${
                  order.paymentStatus === 'paid' ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {order.paymentStatus || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200 mt-3">
                <span className="font-bold text-slate-900 text-sm sm:text-base">Total Amount</span>
                <span className="font-bold text-[#ff5500] text-lg sm:text-xl">
                  ৳{(order.totalPrice || 0).toLocaleString()}
                </span>
              </div>
              {order.paymentDetails?.transactionId && (
                <div className="flex justify-between items-center pt-2 border-t border-gray-100 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 text-gray-500 font-medium">
                    <Hash size={14} />
                    <span>Transaction ID</span>
                  </div>
                  <span className="font-mono text-cyan-600 font-bold bg-cyan-50 px-2 py-0.5 rounded border border-cyan-100">
                    {order.paymentDetails.transactionId}
                  </span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => generateInvoice(order)}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-900/10"
          >
            <Download size={18} />
            <span className="text-sm sm:text-base">Download Invoice (PDF)</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
});

OrderDetailsModal.displayName = 'OrderDetailsModal';

// ==================== STATS CARD COMPONENT ====================
const StatsCard = React.memo(({ 
  icon: Icon, 
  label = '', 
  value = 0, 
  color = 'bg-gray-500', 
  trend = null 
}) => (
  <motion.div
    whileHover={{ y: -2 }}
    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-lg transition-all duration-300"
  >
    <div className="flex items-center justify-between mb-3">
      <div className={`w-12 h-12 sm:w-14 sm:h-14 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
        {Icon && <Icon size={24} className="text-white" />}
      </div>
      {trend && (
        <span className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded-full font-medium flex items-center gap-1">
          <ArrowUp size={14} />
          +{trend}%
        </span>
      )}
    </div>
    <p className="text-xs sm:text-sm text-gray-600 mb-1">{label}</p>
    <p className="text-xl sm:text-2xl font-bold text-slate-900 truncate">{value}</p>
  </motion.div>
));

StatsCard.displayName = 'StatsCard';

// ==================== MAIN DASHBOARD COMPONENT ====================
const Dashboard = () => {
  const { user = {}, setUser = () => {}, logout = () => {} } = useAuth() || {};
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
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
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

  useEffect(() => {
    if (activeTab === 'messages') {
      fetchChats();
    }
  }, [activeTab]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [activeTab]);

  const fetchChats = useCallback(async () => {
    setChatsLoading(true);
    try {
      if (typeof chatAPI?.getChats === 'function') {
        const response = await chatAPI.getChats();
        if (response?.data?.success) {
          setChats(response.data.chats || []);
        }
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
      toast.error('Failed to load messages');
    } finally {
      setChatsLoading(false);
    }
  }, []);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      let ordersData = [];
      let addressesData = [];

      try {
        if (typeof orderAPI?.getMyOrders === 'function') {
          const ordersRes = await orderAPI.getMyOrders({ limit: 50 });
          if (ordersRes?.data?.success) {
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
        }
      } catch (error) {
        console.warn('Order fetch failed:', error);
        setOrders([]);
      }

      try {
        if (typeof userAPI?.getAddresses === 'function') {
          const addressesRes = await userAPI.getAddresses();
          if (addressesRes?.data?.success) {
            addressesData = addressesRes.data.addresses || [];
            setAddresses(addressesData);
            
            const defaultAddress = addressesData.find(addr => addr.isDefault);
            if (defaultAddress) {
              setSelectedAddress(defaultAddress);
            } else if (addressesData.length > 0) {
              setSelectedAddress(addressesData[0]);
            }
          }
        }
      } catch (error) {
        console.warn('Address fetch failed:', error);
        setAddresses([]);
      }
    } catch (error) {
      console.error('Error in dashboard:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [user?.favorites?.length]);

  const handleUpdateProfile = useCallback(async () => {
    try {
      if (typeof userAPI?.updateProfile === 'function') {
        const response = await userAPI.updateProfile(formData);
        if (response?.data?.success) {
          setUser({ ...user, ...response.data.user });
          setEditing(false);
          toast.success('Profile updated successfully');
        } else {
          toast.error(response?.data?.message || 'Update failed');
        }
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile');
    }
  }, [formData, user, setUser]);

  const handleImageUpload = useCallback(async (e) => {
    const file = e.target?.files?.[0];
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

    const formDataImg = new FormData();
    formDataImg.append('image', file);
 
    try {
      setUploadingImage(true);
      // Resize client-side to < 512KB if needed
      const resizedFile = await resizeImage(file, { maxSizeKB: 512, maxWidth: 512, maxHeight: 512 });
      
      const formData = new FormData();
      formData.append('images', resizedFile);
 
      const res = await userAPI.uploadProfileImage(formData);
      if (res.data.success) {
        setUser({ ...user, profilePic: res.data.urls[0] });
        toast.success('Profile picture updated');
      }
    } catch (err) {
      console.error(err);
      toast.error('Upload failed');
    } finally {
      setUploadingImage(false);
    }
  }, [user, setUser]);

  const handleSaveAddress = useCallback(async (addressData) => {
    try {
      if (editingAddress) {
        if (typeof userAPI?.updateAddress === 'function') {
          const response = await userAPI.updateAddress(editingAddress._id || editingAddress.id, addressData);
          if (response?.data?.success) {
            setAddresses(response.data.addresses || []);
            const updated = (response.data.addresses || []).find(a => (a._id || a.id) === (editingAddress._id || editingAddress.id));
            if (updated?.isDefault) setSelectedAddress(updated);
            toast.success('Address updated');
          }
        }
      } else {
        if (typeof userAPI?.addAddress === 'function') {
          const response = await userAPI.addAddress(addressData);
          if (response?.data?.success) {
            setAddresses(response.data.addresses || []);
            if (addressData.isDefault || (response.data.addresses || []).length === 1) {
              const newDefault = (response.data.addresses || []).find(a => a.isDefault) || (response.data.addresses || [])[0];
              setSelectedAddress(newDefault);
            }
            toast.success('Address added');
          }
        }
      }
      setShowAddressForm(false);
      setEditingAddress(null);
    } catch (error) {
      console.error('Save address error:', error);
      toast.error('Failed to save address');
    }
  }, [editingAddress]);

  const handleDeleteAddress = useCallback(async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      if (typeof userAPI?.deleteAddress === 'function') {
        const response = await userAPI.deleteAddress(addressId);
        if (response?.data?.success) {
          setAddresses(response.data.addresses || []);
          if ((selectedAddress?._id || selectedAddress?.id) === addressId) {
            const newSelected = (response.data.addresses || []).find(a => a.isDefault) || (response.data.addresses || [])[0];
            setSelectedAddress(newSelected || null);
          }
          toast.success('Address deleted');
        }
      }
    } catch (error) {
      console.error('Delete address error:', error);
      toast.error('Failed to delete address');
    }
  }, [selectedAddress]);

  const handleSetDefaultAddress = useCallback(async (addressId) => {
    try {
      if (typeof userAPI?.setDefaultAddress === 'function') {
        const response = await userAPI.setDefaultAddress(addressId);
        if (response?.data?.success) {
          setAddresses(response.data.addresses || []);
          setSelectedAddress((response.data.addresses || []).find(a => (a._id || a.id) === addressId));
          toast.success('Default address updated');
        }
      }
    } catch (error) {
      console.error('Set default address error:', error);
      toast.error('Failed to set default address');
    }
  }, []);

  const handleLogout = useCallback(() => {
    if (typeof logout === 'function') {
      logout();
    }
    navigate('/login');
  }, [logout, navigate]);

  const filteredOrders = useMemo(() => {
    if (!Array.isArray(orders)) return [];
    
    return orders.filter(order => {
      const matchesSearch = !searchQuery || 
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
  }, [orders, searchQuery, statusFilter, dateRange]);

  const tabs = useMemo(() => [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
    { id: 'settings', label: 'Settings', icon: Settings }
  ], []);

  const userLevel = user?.level || 'Bronze';
  const levelConfig = USER_LEVELS[userLevel] || USER_LEVELS.Bronze;
  const LevelIcon = levelConfig.icon;

  const levelKeys = Object.keys(USER_LEVELS);
  const currentIndex = levelKeys.indexOf(userLevel);
  const nextLevel = currentIndex < levelKeys.length - 1 ? levelKeys[currentIndex + 1] : null;
  const nextLevelConfig = nextLevel ? USER_LEVELS[nextLevel] : null;
  
  const progress = useMemo(() => {
    if (!nextLevelConfig) return 100;
    const spent = stats.totalSpent || 0;
    const minSpent = levelConfig.minSpent || 0;
    const maxSpent = nextLevelConfig.minSpent || 0;
    return ((spent - minSpent) / (maxSpent - minSpent)) * 100;
  }, [stats.totalSpent, levelConfig, nextLevelConfig]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ff5500]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white" style={{ marginTop: '50px' }}>
      <Navbar />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {/* Welcome Banner */}
        <motion.div 
          className="rounded-2xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 text-white relative overflow-hidden"
          style={{ 
            background: `linear-gradient(135deg, ${levelConfig.color} 0%, ${levelConfig.color}dd 100%)`
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-0 w-32 h-32 sm:w-48 sm:h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24" />
          
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <LevelIcon size={28} className="text-white/90 flex-shrink-0" />
                <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold">
                  Welcome back, {user.name || 'Customer'}! 👋
                </h1>
              </div>
              <p className="text-white/90 mb-2 sm:mb-3 text-xs sm:text-sm">
                {levelConfig.name} Member • Total Spent: ৳{(stats.totalSpent || 0).toLocaleString()}
              </p>
              <div className="flex flex-wrap gap-2">
                {(levelConfig.benefits || []).map((benefit, index) => (
                  <span key={index} className="text-xs bg-white/20 px-2 sm:px-3 py-1 rounded-full line-clamp-1">
                    {benefit}
                  </span>
                ))}
              </div>
            </div>
            <div className="hidden md:block text-right">
              <p className="text-3xl sm:text-4xl font-black mb-1">{levelConfig.name}</p>
              <p className="text-xs sm:text-sm text-white/80">Member Level</p>
            </div>
          </div>
        </motion.div>

        {/* Main Layout - Fixed for laptop view */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Mobile Sidebar Toggle - Only visible on mobile */}
          <div className="lg:hidden mb-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-all active:scale-95"
            >
              <Menu size={18} />
              <span>Menu</span>
            </button>
          </div>

          {/* Sidebar Overlay for mobile */}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="lg:hidden fixed inset-0 bg-black/50 z-40"
                onClick={() => setSidebarOpen(false)}
              />
            )}
          </AnimatePresence>

          {/* Sidebar - Always visible on laptop, hidden on mobile unless toggled */}
          <div className={`
            ${sidebarOpen ? 'fixed inset-y-0 left-0 z-50 w-80 overflow-y-auto' : 'hidden'} 
            lg:block lg:relative lg:w-80 lg:flex-shrink-0
          `}>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 sticky top-24">
              {/* Close button for mobile sidebar */}
              <div className="flex items-center justify-between mb-6 lg:hidden">
                <h3 className="font-bold text-slate-900 text-lg">Menu</h3>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Profile Section */}
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 overflow-hidden ring-4 ring-white shadow-lg">
                    <img
                      src={user?.profilePic || "https://ui-avatars.com/api/?name=" + encodeURIComponent(user?.name || "User") + "&background=random"}
                      alt={user?.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <label 
                    className="absolute bottom-0 right-0 w-8 h-8 flex items-center justify-center cursor-pointer hover:opacity-90 transition shadow-lg rounded-full"
                    style={{ backgroundColor: levelConfig.color }}
                    title="Upload profile picture"
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
                
                <h3 className="font-bold text-slate-900 text-base sm:text-lg mt-3">
                  {user.name || 'User'}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 mb-3 break-all">
                  {user.email || 'N/A'}
                </p>
                
                <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold mb-4"
                  style={{ 
                    backgroundColor: `${levelConfig.color}15`,
                    color: levelConfig.color,
                    border: `1px solid ${levelConfig.color}30`
                  }}
                >
                  <LevelIcon size={14} className="flex-shrink-0" />
                  <span>{levelConfig.name} Member</span>
                </div>

                {nextLevelConfig && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-2">
                      <span className="line-clamp-1">Current: ৳{(stats.totalSpent || 0).toLocaleString()}</span>
                      <span className="line-clamp-1">Next: ৳{nextLevelConfig.minSpent.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full rounded-full"
                        style={{ backgroundColor: levelConfig.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
                        transition={{ duration: 0.8 }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      ৳{Math.max(0, (nextLevelConfig.minSpent - (stats.totalSpent || 0))).toLocaleString()} to {nextLevel}
                    </p>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <nav className="space-y-1 mb-6">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setSidebarOpen(false); // Close sidebar on mobile after selection
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-sm sm:text-base ${
                      activeTab === tab.id
                        ? 'bg-[#ff5500] text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-50 hover:scale-105 transition-transform'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <tab.icon size={18} className="flex-shrink-0" />
                      <span className="font-medium">{tab.label}</span>
                    </div>
                    {activeTab === tab.id && <ChevronRight size={16} />}
                  </button>
                ))}

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all mt-4 text-sm sm:text-base hover:scale-105 transition-transform"
                >
                  <LogOut size={18} className="flex-shrink-0" />
                  <span className="font-medium">Logout</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content - Always visible */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ff5500]"></div>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <motion.div
                    key="overview"
                    variants={fadeInUp}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      <StatsCard
                        icon={ShoppingBag}
                        label="Total Orders"
                        value={stats.totalOrders}
                        color="bg-[#ff5500]"
                      />
                      <StatsCard
                        icon={DollarSign}
                        label="Total Spent"
                        value={`৳${(stats.totalSpent || 0).toLocaleString()}`}
                        color="bg-green-500"
                      />
                      <StatsCard
                        icon={Clock}
                        label="Pending"
                        value={stats.pendingOrders}
                        color="bg-yellow-500"
                      />
                      <StatsCard
                        icon={Award}
                        label="Avg. Order"
                        value={`৳${(stats.averageOrderValue || 0).toLocaleString()}`}
                        color="bg-purple-500"
                      />
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                        <h3 className="text-base sm:text-lg font-bold text-slate-900">
                          Recent Orders
                        </h3>
                        <button
                          onClick={() => setActiveTab('orders')}
                          className="text-xs sm:text-sm text-[#ff5500] hover:underline font-medium transition-all active:scale-95"
                        >
                          View All
                        </button>
                      </div>
                      
                      {!Array.isArray(orders) || orders.length === 0 ? (
                        <div className="text-center py-12">
                          <ShoppingBag className="mx-auto text-gray-300 mb-3" size={48} />
                          <p className="text-gray-500 mb-4 text-sm">No orders yet</p>
                          <Link
                            to="/shop"
                            className="inline-block bg-[#ff5500] text-white font-bold px-6 py-3 rounded-xl hover:bg-opacity-90 transition text-sm active:scale-95"
                          >
                            Start Shopping
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {orders.slice(0, 5).map((order, idx) => (
                            <motion.button
                              key={order._id || idx}
                              onClick={() => setSelectedOrder(order)}
                              whileHover={{ scale: 1.02 }}
                              className="w-full text-left p-3 sm:p-4 border border-gray-100 rounded-xl hover:border-[#ff5500]/20 hover:bg-gray-50 transition-all active:scale-95"
                            >
                              <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                                <span className="font-mono text-xs sm:text-sm text-gray-500 truncate">
                                  #{order.orderNumber || 'N/A'}
                                </span>
                                <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-bold flex-shrink-0 ${STATUS_COLORS[order.status]?.bg || 'bg-gray-100'} ${STATUS_COLORS[order.status]?.text || 'text-gray-700'}`}>
                                  {order.status || 'Unknown'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <div>
                                  <p className="text-xs sm:text-sm text-gray-600">
                                    {(order.items?.length || 0)} items
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-BD', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    }) : 'N/A'}
                                  </p>
                                </div>
                                <span className="font-bold text-[#ff5500] text-xs sm:text-sm flex-shrink-0">
                                  ৳{((order.totalPrice || 0)).toLocaleString()}
                                </span>
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      )}
                    </div>

                    {selectedAddress && (
                      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                          <h3 className="text-base sm:text-lg font-bold text-slate-900">
                            Default Address
                          </h3>
                          <button
                            onClick={() => setActiveTab('addresses')}
                            className="text-xs sm:text-sm text-[#ff5500] hover:underline font-medium transition-all active:scale-95"
                          >
                            Manage
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
                    key="orders"
                    variants={fadeInUp}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-all"
                  >
                    <div className="flex flex-col gap-4 mb-6">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900">
                        Order History
                      </h3>
                      
                      <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                        <div className="flex-1 min-w-[200px] relative">
                          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 flex-shrink-0 pointer-events-none" />
                          <input
                            type="text"
                            placeholder="Search orders..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#ff5500] outline-none transition-all"
                          />
                        </div>

                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#ff5500] outline-none transition-all"
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
                          className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#ff5500] outline-none transition-all"
                        >
                          <option value="all">All Time</option>
                          <option value="7days">Last 7 Days</option>
                          <option value="30days">Last 30 Days</option>
                          <option value="90days">Last 90 Days</option>
                        </select>
                      </div>
                    </div>
                    
                    {!Array.isArray(filteredOrders) || filteredOrders.length === 0 ? (
                      <div className="text-center py-12">
                        <Package className="mx-auto text-gray-300 mb-3" size={48} />
                        <p className="text-gray-500 mb-4 text-sm">No orders found</p>
                        {searchQuery || statusFilter !== 'all' || dateRange !== 'all' ? (
                          <button
                            onClick={() => {
                              setSearchQuery('');
                              setStatusFilter('all');
                              setDateRange('all');
                            }}
                            className="text-[#ff5500] hover:underline text-xs sm:text-sm font-medium transition-all active:scale-95"
                          >
                            Clear filters
                          </button>
                        ) : (
                          <Link
                            to="/shop"
                            className="inline-block bg-[#ff5500] text-white font-bold px-6 py-3 rounded-xl hover:bg-opacity-90 transition text-sm active:scale-95"
                          >
                            Browse Products
                          </Link>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredOrders.map((order, idx) => {
                          const StatusIcon = STATUS_COLORS[order.status]?.icon || Package;
                          return (
                            <motion.div
                              key={order._id || idx}
                              whileHover={{ scale: 1.01 }}
                              className="border border-gray-200 rounded-xl p-3 sm:p-4 hover:shadow-md transition-all cursor-pointer active:scale-95"
                              onClick={() => setSelectedOrder(order)}
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                                <div className="flex items-start gap-3 min-w-0">
                                  <div className={`w-10 h-10 rounded-full flex-shrink-0 ${STATUS_COLORS[order.status]?.bg || 'bg-gray-100'} flex items-center justify-center`}>
                                    <StatusIcon size={18} className={STATUS_COLORS[order.status]?.text || 'text-gray-700'} />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs sm:text-sm text-gray-500">Order #</p>
                                    <p className="font-mono font-bold text-slate-900 text-xs sm:text-base truncate">
                                      {order.orderNumber || 'N/A'}
                                    </p>
                                  </div>
                                </div>
                                <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-bold flex-shrink-0 ${STATUS_COLORS[order.status]?.bg || 'bg-gray-100'} ${STATUS_COLORS[order.status]?.text || 'text-gray-700'}`}>
                                  {(order.status || 'unknown').toUpperCase()}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                                <div>
                                  <p className="text-xs text-gray-500">Date</p>
                                  <p className="text-xs sm:text-sm font-medium text-slate-900">
                                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-BD', {
                                      month: 'short',
                                      day: 'numeric'
                                    }) : 'N/A'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Items</p>
                                  <p className="text-xs sm:text-sm font-medium text-slate-900">
                                    {order.items?.length || 0}
                                  </p>
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                  <p className="text-xs text-gray-500 truncate">Payment</p>
                                  <p className="text-xs sm:text-sm font-medium text-slate-900 truncate">
                                    {PAYMENT_METHODS[order.paymentMethod]?.split('/')[0] || order.paymentMethod || 'N/A'}
                                  </p>
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                  <p className="text-xs text-gray-500">Total</p>
                                  <p className="text-xs sm:text-sm font-bold text-[#ff5500]">
                                    ৳{((order.totalPrice || 0)).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 mt-3">
                                {Array.isArray(order.items) && order.items.slice(0, 3).map((item, itemIdx) => (
                                  <div key={itemIdx} className="relative flex-shrink-0">
                                    <img
                                      src={item.image || '/placeholder.png'}
                                      alt={item.name || 'Product'}
                                      className="w-10 h-10 object-contain bg-gray-50 rounded-lg border border-gray-200"
                                      onError={(e) => {
                                        e.target.src = '/placeholder.png';
                                      }}
                                    />
                                    {item.quantity > 1 && (
                                      <span className="absolute -top-2 -right-2 w-4 h-4 bg-[#ff5500] text-white text-xs rounded-full flex items-center justify-center font-bold">
                                        {item.quantity}
                                      </span>
                                    )}
                                  </div>
                                ))}
                                {Array.isArray(order.items) && order.items.length > 3 && (
                                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-600 font-bold flex-shrink-0">
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
                    key="addresses"
                    variants={fadeInUp}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900">
                        Shipping Addresses
                      </h3>
                      <button
                        onClick={() => {
                          setEditingAddress(null);
                          setShowAddressForm(true);
                        }}
                        className="flex items-center gap-2 bg-[#ff5500] text-white font-bold px-3 sm:px-4 py-2 rounded-lg hover:bg-opacity-90 transition text-xs sm:text-sm active:scale-95"
                      >
                        <Plus size={16} />
                        <span className="hidden sm:inline">Add New Address</span>
                        <span className="sm:hidden">Add</span>
                      </button>
                    </div>

                    {!Array.isArray(addresses) || addresses.length === 0 ? (
                      <div className="text-center py-12">
                        <MapPin className="mx-auto text-gray-300 mb-3" size={48} />
                        <p className="text-gray-500 mb-4 text-sm">No addresses saved yet</p>
                        <button
                          onClick={() => {
                            setEditingAddress(null);
                            setShowAddressForm(true);
                          }}
                          className="inline-flex items-center gap-2 bg-[#ff5500] text-white font-bold px-6 py-3 rounded-xl hover:bg-opacity-90 transition text-sm active:scale-95"
                        >
                          <Plus size={18} />
                          Add Your First Address
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {addresses.map((address, idx) => (
                          <AddressCard
                            key={address._id || address.id || idx}
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
                    key="wishlist"
                    variants={fadeInUp}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-all"
                  >
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-4">
                      My Wishlist
                    </h3>
                    
                    {!Array.isArray(user?.favorites) || user.favorites.length === 0 ? (
                      <div className="text-center py-12">
                        <Heart className="mx-auto text-gray-300 mb-3" size={48} />
                        <p className="text-gray-500 mb-4 text-sm">Your wishlist is empty</p>
                        <Link
                          to="/shop"
                          className="inline-block bg-[#ff5500] text-white font-bold px-6 py-3 rounded-xl hover:bg-opacity-90 transition text-sm active:scale-95"
                        >
                          Explore Products
                        </Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {user.favorites.map((product, idx) => (
                          <motion.div
                            key={product._id || idx}
                            whileHover={{ y: -2 }}
                            className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all"
                          >
                            <div className="relative mb-3">
                              <img
                                src={product.image || '/placeholder.png'}
                                alt={product.name || 'Product'}
                                className="w-full h-32 object-contain bg-gray-50 rounded-lg"
                                onError={(e) => {
                                  e.target.src = '/placeholder.png';
                                }}
                              />
                              <button
                                onClick={async () => {
                                  try {
                                    const updatedFavorites = (user.favorites || []).filter(f => f._id !== product._id);
                                    setUser({ ...user, favorites: updatedFavorites });
                                    toast.success('Removed from wishlist');
                                  } catch (error) {
                                    toast.error('Failed to remove');
                                  }
                                }}
                                className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-red-50 transition-all active:scale-95"
                              >
                                <Heart size={14} className="text-[#ff5500]" fill="#ff5500" />
                              </button>
                            </div>
                            <h4 className="font-bold text-slate-900 mb-2 line-clamp-2 text-xs sm:text-sm">
                              {product.name || 'Product'}
                            </h4>
                            <div className="flex items-center gap-1 mb-3">
                              <Star size={14} className="text-yellow-400 fill-current flex-shrink-0" />
                              <span className="text-xs sm:text-sm text-gray-600">
                                {product.rating || 4.5}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-[#ff5500] text-sm sm:text-base">
                                ৳{((product.sellingPrice || product.price || 0)).toLocaleString()}
                              </span>
                              <Link
                                to={`/product/${product._id}`}
                                className="text-xs bg-[#ff5500] text-white px-3 py-1.5 rounded-lg hover:bg-opacity-90 transition active:scale-95"
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
                    key="settings"
                    variants={fadeInUp}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900">
                        Profile Settings
                      </h3>
                      {!editing && (
                        <button
                          onClick={() => setEditing(true)}
                          className="flex items-center gap-2 text-[#ff5500] hover:underline font-medium text-xs sm:text-sm transition-all active:scale-95"
                        >
                          <Edit2 size={16} />
                          <span className="hidden sm:inline">Edit Profile</span>
                          <span className="sm:hidden">Edit</span>
                        </button>
                      )}
                    </div>

                    {editing ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                            Full Name
                          </label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff5500] outline-none transition-all text-xs sm:text-sm"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                            Email
                          </label>
                          <input
                            type="email"
                            value={formData.email}
                            disabled
                            className="w-full px-3 sm:px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg cursor-not-allowed text-xs sm:text-sm"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Email cannot be changed
                          </p>
                        </div>
                        
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            value={formData.phoneNumber}
                            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                            className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff5500] outline-none transition-all text-xs sm:text-sm"
                          />
                        </div>
                        
                        <div className="flex gap-3 pt-4">
                          <button
                            onClick={handleUpdateProfile}
                            className="flex-1 bg-[#ff5500] text-white font-bold py-3 rounded-xl hover:bg-opacity-90 transition text-xs sm:text-sm active:scale-95"
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
                            className="flex-1 border border-gray-300 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 transition text-xs sm:text-sm active:scale-95"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-start gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl">
                          <User className="text-gray-400 shrink-0 mt-1" size={18} />
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm text-gray-500">Full Name</p>
                            <p className="font-medium text-slate-900 text-xs sm:text-sm break-words">
                              {user?.name || 'N/A'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl">
                          <Mail className="text-gray-400 shrink-0 mt-1" size={18} />
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm text-gray-500">Email</p>
                            <p className="font-medium text-slate-900 text-xs sm:text-sm break-all">
                              {user?.email || 'N/A'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl">
                          <Phone className="text-gray-400 shrink-0 mt-1" size={18} />
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm text-gray-500">Phone</p>
                            <p className="font-medium text-slate-900 text-xs sm:text-sm">
                              {user?.phoneNumber || 'Not set'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="pt-4 border-t border-gray-100">
                          <p className="text-xs sm:text-sm text-gray-500 mb-1">Member Since</p>
                          <p className="font-medium text-slate-900 text-xs sm:text-sm">
                            {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-BD', {
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

                {/* Messages Tab */}
                {activeTab === 'messages' && (
                  <motion.div
                    key="messages"
                    variants={fadeInUp}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                    style={{ height: 'calc(100vh - 250px)', minHeight: '500px' }}
                  >
                    <div className="flex h-full flex-col sm:flex-row">
                      {/* Sidebar - Chat List */}
                      <div className="w-full sm:w-1/3 lg:w-1/4 border-b sm:border-b-0 sm:border-r border-gray-100 flex flex-col">
                        <div className="p-4 border-b border-gray-100">
                          <h3 className="font-bold text-slate-900 text-sm sm:text-base">Messages</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                          {chatsLoading ? (
                            <div className="flex justify-center py-10">
                              <RefreshCw className="animate-spin text-gray-300" size={24} />
                            </div>
                          ) : !Array.isArray(chats) || chats.length === 0 ? (
                            <div className="text-center py-12 px-4">
                              <MessageSquare className="mx-auto text-gray-200 mb-3" size={40} />
                              <p className="text-xs sm:text-sm text-gray-500">No conversations yet</p>
                              <Link to="/shop" className="text-xs text-[#ff5500] hover:underline mt-2 inline-block">
                                Browse products
                              </Link>
                            </div>
                          ) : (
                            <div className="divide-y divide-gray-50">
                              {chats.map((chat, idx) => {
                                if (!chat) return null;
                                const otherParticipant = chat.participants?.find(p => p && (p._id || p) !== user?._id);
                                const lastMsg = chat.lastMessage || '';
                                const isSelected = selectedChat?._id === chat._id;

                                return (
                                  <motion.button
                                    key={chat._id || idx}
                                    onClick={() => setSelectedChat(chat)}
                                    whileHover={{ backgroundColor: '#fafafa' }}
                                    className={`w-full text-left p-3 sm:p-4 transition-all flex items-center gap-3 ${isSelected ? 'bg-orange-50 border-l-4 border-[#ff5500]' : 'hover:bg-gray-50'}`}
                                  >
                                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-slate-500 text-xs overflow-hidden">
                                      {otherParticipant?.profilePic ? (
                                        <img 
                                          src={otherParticipant.profilePic} 
                                          alt="" 
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            e.target.style.display = 'none';
                                          }}
                                        />
                                      ) : (
                                        (otherParticipant?.shopName || otherParticipant?.name || '?').charAt(0).toUpperCase()
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between gap-2 max-w-full">
                                        <p className="font-bold text-slate-900 truncate text-xs sm:text-sm">
                                          {otherParticipant?.shopName || otherParticipant?.name || 'Store'}
                                        </p>
                                        {chat.unreadCount > 0 && (
                                          <span className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 animate-pulse" />
                                        )}
                                      </div>
                                      <p className="text-xs text-gray-500 truncate mt-0.5">
                                        {lastMsg || 'No messages'}
                                      </p>
                                    </div>
                                  </motion.button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Active Chat Area */}
                      <div className="hidden sm:flex flex-1 flex-col bg-slate-50">
                        {selectedChat ? (
                          <div className="flex-1 relative">
                            {typeof ChatWindow !== 'undefined' && (
                              <ChatWindow
                                chatId={selectedChat._id}
                                receiver={selectedChat.user?._id === user?._id ? selectedChat.seller : selectedChat.user}
                                onClose={() => setSelectedChat(null)}
                              />
                            )}
                          </div>
                        ) : (
                          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                            <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-4">
                              <MessageSquare size={32} className="text-gray-200" />
                            </div>
                            <h4 className="font-bold text-slate-800 mb-1 text-xs sm:text-sm">Your Messages</h4>
                            <p className="text-xs max-w-xs">Select a conversation to start chatting.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Mobile Chat Overlay */}
                    <AnimatePresence>
                      {selectedChat && (
                        <motion.div
                          initial={{ x: '100vw' }}
                          animate={{ x: 0 }}
                          exit={{ x: '100vw' }}
                          className="sm:hidden fixed inset-0 z-[60] bg-white"
                        >
                          <div className="h-full relative">
                            {typeof ChatWindow !== 'undefined' && (
                              <ChatWindow
                                chatId={selectedChat._id}
                                receiver={selectedChat.user?._id === user?._id ? selectedChat.seller : selectedChat.user}
                                onClose={() => setSelectedChat(null)}
                              />
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
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
        {showAddressForm && AddressFormModal && (
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