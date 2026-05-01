// components/SellerPanel.jsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, ShoppingCart, LayoutDashboard, Banknote,
  ShoppingBag, TrendingUp, TrendingDown, BarChart3, Plus, X,
  Edit, Trash2, Search, Eye, ArrowUpRight, RefreshCw,
  FileSpreadsheet, AlertCircle, Clock, CheckCircle2,
  Wallet, Activity, Loader2, Store, CreditCard, DollarSign,
  MessageSquare, Send, LogOut, Settings, HelpCircle, ChevronRight,
  Star, Award, Target, Calendar, Filter, Download, Printer,
  MapPin, Phone, Mail, User, Users, Shield, Check, MinusCircle, Menu
} from "lucide-react";
import { useAuth } from "../contexts/useAuth";
import ChatWindow from "../components/ChatWindow";
import { sellerAPI, chatAPI, uploadAPI } from "../services/api";
import { resizeImage } from "../utils/imageUtils";
import toast from "react-hot-toast";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, Legend, ComposedChart
} from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const COLORS = ['#ff5500', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
const PRIMARY = '#ff5500';

const fmt = (n) => `৳${(n || 0).toLocaleString('en-BD', { maximumFractionDigits: 0 })}`;

// Utility Components
const StatCard = ({ title, value, icon: Icon, color = PRIMARY, subtitle, loading, trend }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
    className="bg-slate-800 border border-slate-700 rounded-xl p-4 hover:border-orange-500/40 transition-all group">
    <div className="flex items-start justify-between mb-3">
      <div className="p-2.5 rounded-lg" style={{ backgroundColor: color + '20' }}>
        <Icon size={18} style={{ color }} />
      </div>
      {trend !== undefined && (
        <span className={`text-xs font-medium flex items-center gap-1 ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {trend >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    {loading ? <div className="h-7 bg-slate-700 rounded animate-pulse mb-1" /> : <p className="text-xl font-bold text-white mb-0.5">{value}</p>}
    <p className="text-xs text-slate-400">{title}</p>
    {subtitle && <p className="text-[10px] text-slate-500 mt-1">{subtitle}</p>}
  </motion.div>
);

const Badge = ({ status }) => {
  const map = {
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    confirmed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    processing: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    shipped: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    delivered: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
    paid: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    live: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    draft: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
    completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    inactive: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${map[status] || map.pending}`}>{status}</span>;
};

const Modal = ({ open, onClose, title, children, size = 'md' }) => {
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
        <motion.div className={`relative bg-slate-800 border border-slate-700 rounded-2xl w-full ${sizes[size]} max-h-[90vh] overflow-y-auto z-10`}
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}>
          <div className="flex items-center justify-between p-4 border-b border-slate-700 sticky top-0 bg-slate-800 z-10">
            <h3 className="text-base font-semibold text-white">{title}</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700">
              <X size={16} />
            </button>
          </div>
          <div className="p-5">{children}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const Input = ({ label, ...props }) => (
  <div>
    {label && <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">{label}</label>}
    <input {...props} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-all" />
  </div>
);


const Select = ({ label, children, ...props }) => (
  <div>
    {label && <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">{label}</label>}
    <select {...props} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-all">
      {children}
    </select>
  </div>
);

const TextArea = ({ label, ...props }) => (
  <div>
    {label && <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">{label}</label>}
    <textarea {...props} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-all resize-none" />
  </div>
);

const Btn = ({ children, variant = 'primary', size = 'md', loading, className = '', ...props }) => {
  const base = 'inline-flex items-center justify-center gap-1.5 font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white shadow-lg shadow-orange-500/20',
    secondary: 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-600',
    danger: 'bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30',
    success: 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30',
    ghost: 'hover:bg-slate-700/80 text-slate-400 hover:text-white',
    outline: 'border border-orange-500/50 text-orange-400 hover:bg-orange-500/10',
  };
  const sizes = { xs: 'px-2 py-1 text-xs', sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-5 py-2.5 text-base' };
  return (
    <button {...props} disabled={loading || props.disabled} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}>
      {loading && <Loader2 size={13} className="animate-spin" />}
      {children}
    </button>
  );
};

const TableWrapper = ({ children }) => (
  <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
    <div className="overflow-x-auto">{children}</div>
  </div>
);

const Th = ({ children }) => (
  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{children}</th>
);

const Td = ({ children, className = '' }) => (
  <td className={`px-4 py-3 text-sm ${className}`}>{children}</td>
);

const VerificationPending = ({ user, fetchData }) => {
  const [admin, setAdmin] = useState(null);
  const [loadingAdmin, setLoadingAdmin] = useState(true);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const res = await chatAPI.getAdmin();
        if (res.data.success) setAdmin(res.data.admin);
      } catch (err) {
        console.error("Failed to load admin info", err);
      } finally {
        setLoadingAdmin(false);
      }
    };
    fetchAdmin();
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-amber-500" />
        
        <div className="w-20 h-20 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Shield size={40} className="text-orange-500" />
        </div>
        
        <h2 className="text-2xl font-black text-white mb-3">Verification Pending</h2>
        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
          Hi <span className="text-white font-bold">{user?.name}</span>, your seller registration for <span className="text-orange-400 font-bold">"{user?.shopName}"</span> is currently being reviewed by our administration team.
          <br /><br />
          This usually takes <span className="text-white uppercase font-bold">12-24 hours</span>. You will be notified once your account is activated.
        </p>

        <div className="space-y-4">
          <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-700/50 text-left">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Need help?</h4>
            {loadingAdmin ? (
              <div className="flex items-center gap-3 animate-pulse">
                <div className="w-10 h-10 bg-slate-800 rounded-full" />
                <div className="flex-1"><div className="h-3 bg-slate-800 rounded w-1/2 mb-2" /><div className="h-2 bg-slate-800 rounded w-1/3" /></div>
              </div>
            ) : admin ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={admin.profilePic || `https://ui-avatars.com/api/?name=Admin&background=ff5500&color=fff`} className="w-10 h-10 rounded-full object-cover border border-slate-700" alt="" />
                  <div>
                    <p className="text-sm font-bold text-white">Contact Portal Admin</p>
                    <p className="text-[10px] text-emerald-400 font-medium">Online for support</p>
                  </div>
                </div>
                <Btn size="sm" variant="primary" className="rounded-full px-4" onClick={() => setShowChat(true)}>
                  Chat Now
                </Btn>
              </div>
            ) : (
              <p className="text-xs text-slate-500">Support chat unavailable</p>
            )}
          </div>
          
          <Btn variant="secondary" className="w-full py-3 rounded-2xl" onClick={fetchData}>
            <RefreshCw size={16} /> Check Status
          </Btn>
          
          <button onClick={() => window.location.href = '/'} className="text-xs text-slate-500 hover:text-white transition-colors mt-2 underline underline-offset-4">
            Back to Home
          </button>
        </div>
      </motion.div>

      <Modal open={showChat} onClose={() => setShowChat(false)} title="Chat with Admin" size="lg">
        <div style={{ height: "450px" }}>
          <ChatWindow receiver={admin} onClose={() => setShowChat(false)} />
        </div>
      </Modal>
      
      <p className="text-[10px] text-slate-600 mt-8 uppercase tracking-[0.2em]">Devaroti Shop Seller Verification System</p>
    </div>
  );
};

// Main Seller Panel Component
const SellerPanel = () => {
  const { user: currentUser, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({ overview: {} });
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState("30d");
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const chatEndRef = useRef(null);

  // Modals
  const [modals, setModals] = useState({
    addProduct: false, editProduct: false, orderDetail: false,
    updateOrder: false, withdrawal: false, chat: false, transaction: false,
    profile: false, addSale: false, editSale: false, viewSale: false
  });
  const [selectedItem, setSelectedItem] = useState(null);
  const [saleForm, setSaleForm] = useState({
    product: '', quantity: 1, totalAmount: '', paymentMethod: 'Cash',
    customerName: '', customerPhone: '', description: ''
  });
  const [productForm, setProductForm] = useState({
    name: '', sellingPrice: '', purchasePrice: '', description: '',
    category: 'General', image: '', images: [], stock: 0, unit: 'পিস',
    liveStatus: 'live', brand: '', sku: '', variants: []
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [orderUpdateForm, setOrderUpdateForm] = useState({ status: '', trackingNumber: '', courier: '' });

  const handleImageUpload = async (e, isMultiple = false) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;
    
    setUploadingImage(true);
    const loadingToast = toast.loading(isMultiple ? 'Processing & uploading images...' : 'Uploading image...');
    
    try {
      const formData = new FormData();
      for (const file of files) {
         // Resize to < 800KB for product images, 1024px max
         const resized = await resizeImage(file, { maxSizeKB: 800, maxWidth: 1024, maxHeight: 1024 });
         formData.append('images', resized);
      }
      
      const res = await uploadAPI.uploadImages(formData);
      if (res.data.success) {
        if (isMultiple) {
          setProductForm(prev => ({ ...prev, images: [...(prev.images || []), ...res.data.urls].slice(0, 4) }));
        } else {
          setProductForm(prev => ({ ...prev, image: res.data.urls[0] }));
        }
        toast.success(isMultiple ? 'Additional images uploaded' : 'Main image uploaded', { id: loadingToast });
      }
    } catch (err) {
      toast.error('Image upload failed (Check file sizes)', { id: loadingToast });
    } finally {
      setUploadingImage(false);
    }
  };
  const [withdrawalForm, setWithdrawalForm] = useState({ amount: '', paymentMethod: 'bKash', accountNumber: '', accountName: '' });
  const [transactionForm, setTransactionForm] = useState({ type: 'Cash In', amount: '', description: '', paymentMethod: 'Cash' });

  const openModal = (name, item = null) => {
    setSelectedItem(item);
    if (item && name === 'editProduct') setProductForm({ ...item });
    if (item && name === 'updateOrder') setOrderUpdateForm({ status: item.status, trackingNumber: item.trackingNumber || '', courier: item.courier || '' });
    if (item && name === 'orderDetail') setSelectedItem(item);
    setModals(p => ({ ...p, [name]: true }));
  };
  const closeModal = (name) => { setModals(p => ({ ...p, [name]: false })); setSelectedItem(null); };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const safe = (p, def) => p.catch(() => ({ data: def }));

      // Essential for badges and basic overview
      const reqs = {
        stats: safe(sellerAPI.getStats({ period: dateRange }), { stats: { overview: {} } }),
        chats: safe(chatAPI.getChats({ limit: 50 }), { chats: [] })
      };

      if (activeTab === "inventory") {
        reqs.products = safe(sellerAPI.getProducts({ limit: 200 }), { products: [] });
      } else if (activeTab === "orders" || activeTab === "customers") {
        reqs.orders = safe(sellerAPI.getOrders({ limit: 100 }), { orders: [] });
      } else if (activeTab === "cashbox") {
        reqs.transactions = safe(sellerAPI.getTransactions({ limit: 100 }), { transactions: [] });
      } else if (activeTab === "withdrawals") {
        reqs.withdrawals = safe(sellerAPI.getWithdrawals({ limit: 100 }), { withdrawals: [] });
      } else if (activeTab === "sales") {
        reqs.sales = safe(sellerAPI.getSales({ limit: 100 }), { sales: [] });
        reqs.products = safe(sellerAPI.getProducts({ limit: 200 }), { products: [] });
      } else if (activeTab === "overview") {
        reqs.products = safe(sellerAPI.getProducts({ limit: 10 }), { products: [] });
        reqs.orders = safe(sellerAPI.getOrders({ limit: 10 }), { orders: [] });
      }

      const keys = Object.keys(reqs);
      const results = await Promise.all(Object.values(reqs));
      const res = {};
      keys.forEach((key, i) => { res[key] = results[i].data; });

      if (res.stats?.stats) setStats(res.stats.stats);
      if (res.products?.products) setProducts(res.products.products);
      if (res.orders?.orders) {
        const o = res.orders.orders;
        setOrders(o);
        // Extract unique customers from orders
        const uniqueCustomers = new Map();
        o.forEach(order => {
          if (order.user && !uniqueCustomers.has(order.user._id)) {
            uniqueCustomers.set(order.user._id, { ...order.user, orderCount: 1 });
          } else if (order.user) {
            const existing = uniqueCustomers.get(order.user._id);
            existing.orderCount++;
          }
        });
        setCustomers(Array.from(uniqueCustomers.values()));
      }
      if (res.transactions?.transactions) setTransactions(res.transactions.transactions);
      if (res.withdrawals?.withdrawals) setWithdrawals(res.withdrawals.withdrawals);
      if (res.sales?.sales) setSales(res.sales.sales);
      if (res.chats?.chats) setChats(res.chats.chats);
    } catch (err) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [activeTab, dateRange]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [selectedChat]);

  const overview = stats.overview || {};
  const cashIn = transactions.filter(t => t.type === 'Cash In' || t.type === 'Sale').reduce((s, t) => s + (t.amount || t.totalAmount || 0), 0);
  const cashOut = transactions.filter(t => t.type === 'Cash Out' || t.type === 'Purchase').reduce((s, t) => s + (t.amount || t.totalAmount || 0), 0);

  const exportToExcel = (data, fileName) => {
    if (!data?.length) return toast.error('No data to export');
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success('Excel exported!');
  };

  const exportToPDF = (data, fileName, title, columns) => {
    if (!data?.length) return toast.error('No data to export');
    const doc = new jsPDF();
    doc.setTextColor(255, 85, 0);
    doc.setFontSize(16);
    doc.text(title, 14, 18);
    doc.setTextColor(120);
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 25);
    doc.autoTable({
      head: [columns.map(c => c.header)],
      body: data.map(row => columns.map(c => c.accessor(row) ?? "-")),
      startY: 31,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [255, 85, 0], textColor: 255 },
    });
    doc.save(`${fileName}_${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success('PDF exported!');
  };

  const handleChatWithAdmin = async () => {
    try {
      const res = await chatAPI.getAdmin();
      if (res.data.success) {
        openModal('chat', res.data.admin);
      } else {
        toast.error("Admin portal currently unavailable");
      }
    } catch (err) {
      toast.error("Failed to initiate chat with Admin");
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      const data = { ...productForm, price: productForm.sellingPrice };
      if (selectedItem?._id) {
        await sellerAPI.updateProduct(selectedItem._id, data);
        toast.success('Product updated');
        closeModal('editProduct');
      } else {
        await sellerAPI.createProduct(data);
        toast.success('Product added');
        closeModal('addProduct');
      }
      setProductForm({ name: '', sellingPrice: '', purchasePrice: '', description: '', category: 'General', image: '', images: [], stock: 0, unit: 'পিস', liveStatus: 'live', brand: '', sku: '' });
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save product'); }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await sellerAPI.deleteProduct(id);
      toast.success('Product deleted');
      fetchData();
    } catch { toast.error('Failed to delete product'); }
  };

  const handleUpdateOrder = async (e) => {
    e.preventDefault();
    try {
      await sellerAPI.updateOrder(selectedItem._id, orderUpdateForm);
      toast.success('Order updated');
      closeModal('updateOrder');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update order'); }
  };

  const handleWithdrawal = async (e) => {
    e.preventDefault();
    try {
      await sellerAPI.requestWithdrawal(withdrawalForm);
      toast.success('Withdrawal request submitted! Will be processed within 1-3 business days.');
      closeModal('withdrawal');
      setWithdrawalForm({ amount: '', paymentMethod: 'bKash', accountNumber: '', accountName: '' });
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to submit request'); }
  };

  const handleCreateTransaction = async (e) => {
    e.preventDefault();
    try {
      await sellerAPI.createTransaction(transactionForm);
      toast.success('Transaction added successfully!');
      closeModal('transaction');
      setTransactionForm({ type: 'Cash In', amount: '', description: '', paymentMethod: 'Cash' });
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to add transaction'); }
  };

  const handleCreateSale = async (e) => {
    e.preventDefault();
    if (!saleForm.product) return toast.error('Please select a product');
    if (!saleForm.quantity || Number(saleForm.quantity) < 1) return toast.error('Quantity must be at least 1');
    if (!saleForm.totalAmount || Number(saleForm.totalAmount) <= 0) return toast.error('Please enter a valid total amount');
    try {
      await sellerAPI.createSale(saleForm);
      toast.success('Sale recorded successfully!');
      closeModal('addSale');
      setSaleForm({ product: '', quantity: 1, totalAmount: '', paymentMethod: 'Cash', customerName: '', customerPhone: '', description: '' });
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to record sale'); }
  };

  const handleUpdateSale = async (e) => {
    e.preventDefault();
    try {
      await sellerAPI.updateSale(selectedItem._id, saleForm);
      toast.success('Sale updated successfully!');
      closeModal('editSale');
      setSaleForm({ product: '', quantity: 1, totalAmount: '', paymentMethod: 'Cash', customerName: '', customerPhone: '', description: '' });
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update sale'); }
  };

  const handleDeleteSale = async (id) => {
    if (!confirm('Delete this sale? Stock will be restored.')) return;
    try {
      await sellerAPI.deleteSale(id);
      toast.success('Sale deleted, stock restored');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete sale'); }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;
    try {
      await chatAPI.sendMessage({ chatId: selectedChat._id, message: newMessage });
      setNewMessage("");
      fetchData();
    } catch { toast.error("Failed to send message"); }
  };

  const filteredProducts = products.filter(p => !searchQuery || p.name?.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredOrders = orders.filter(o => !searchQuery || o.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()));

  // GUARD: Access restricted until approved
  if (currentUser && !currentUser.isSellerApproved) {
    return <VerificationPending user={currentUser} fetchData={fetchData} />;
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, color: PRIMARY },
    { id: 'orders', label: 'Orders', icon: ShoppingCart, color: '#0ea5e9' },
    { id: 'inventory', label: 'Inventory', icon: Package, color: '#10b981' },
    { id: 'sales', label: 'My Sales', icon: ShoppingBag, color: '#f97316' },
    { id: 'customers', label: 'Customers', icon: Users, color: '#8b5cf6' },
    { id: 'withdrawals', label: 'Withdrawals', icon: CreditCard, color: '#f59e0b' },
    { id: 'earnings', label: 'Earnings', icon: DollarSign, color: '#10b981' },
    { id: 'cashbox', label: 'Cash Box', icon: Banknote, color: '#ec4899' },
    { id: 'chats', label: 'Chats', icon: MessageSquare, color: '#06b6d4' },
  ];

  // Sidebar Component
  const Sidebar = () => (
    <>
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div className="fixed inset-0 bg-black/60 z-40 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSidebarOpen(false)} />
        )}
      </AnimatePresence>
      <motion.aside className={`fixed top-0 left-0 h-full w-64 bg-slate-900 border-r border-slate-700/80 z-50 flex flex-col shadow-2xl lg:translate-x-0 transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        <div className="p-5 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Store size={18} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white text-sm leading-tight">{currentUser?.shopName || 'My Shop'}</h1>
              <p className="text-[10px] text-orange-400 font-medium uppercase tracking-widest">Seller Panel</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700">
            <X size={16} />
          </button>
        </div>

        <div className="px-4 py-3 border-b border-slate-700/50">
          <button onClick={() => openModal("profile")} className="w-full flex items-center gap-2.5 bg-slate-800 rounded-xl p-2.5 hover:bg-slate-700 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center text-white text-xs font-bold">
              {currentUser?.name?.[0] || "S"}
            </div>
            <div className="min-w-0 text-left">
              <p className="text-white text-xs font-semibold truncate">{currentUser?.name || "Seller"}</p>
              <p className="text-[10px] text-slate-400 truncate">{currentUser?.email || ""}</p>
            </div>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          <button
            onClick={handleChatWithAdmin}
            className="w-full mb-3 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold bg-orange-500 text-white hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
          >
            <MessageSquare size={15} /> Chat with Admin
          </button>
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${isActive ? 'bg-orange-500/15 text-orange-400 border border-orange-500/25' : 'text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent'}`}>
                <tab.icon size={15} className={isActive ? "text-orange-400" : "text-slate-500 group-hover:text-white"} />
                <span>{tab.label}</span>
                {tab.id === 'chats' && chats.filter(c => c.unreadCount > 0).length > 0 && (
                  <span className="ml-auto bg-orange-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                    {chats.filter(c => c.unreadCount > 0).length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-700/80 space-y-2">
          <div className="flex gap-2">
            <select value={dateRange} onChange={e => setDateRange(e.target.value)} className="flex-1 bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-orange-500">
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <Btn size="xs" variant="secondary" onClick={fetchData} disabled={loading}>
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            </Btn>
          </div>
          <Btn size="sm" variant="danger" className="w-full" onClick={logout}>
            <LogOut size={13} /> Logout
          </Btn>
        </div>
      </motion.aside>
    </>
  );

  const TopBar = () => (
    <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/80 flex items-center justify-between px-4 py-3">
      <button onClick={() => setSidebarOpen(true)} className="text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-slate-700">
        <Menu size={20} />
      </button>
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center">
          <Store size={15} className="text-white" />
        </div>
        <span className="font-bold text-white text-sm">Seller Dashboard</span>
      </div>
      <Btn size="xs" variant="ghost" onClick={fetchData} disabled={loading}>
        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
      </Btn>
    </div>
  );

  // Render Overview Tab
  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard title="Total Products" value={overview.totalProducts || 0} icon={Package} color="#0ea5e9" loading={loading} />
        <StatCard title="Total Orders" value={overview.totalOrders || 0} icon={ShoppingCart} color={PRIMARY} loading={loading} />
        <StatCard title="Total Earnings" value={fmt(overview.totalEarnings)} icon={DollarSign} color="#10b981" loading={loading} subtitle="After platform commission" />
        <StatCard title="Available Balance" value={fmt(overview.cashBox)} icon={Wallet} color="#f59e0b" loading={loading} />
        <StatCard title="Withdrawn" value={fmt(overview.totalWithdrawn)} icon={CheckCircle2} color="#8b5cf6" loading={loading} />
        <StatCard title="Pending" value={fmt(overview.pendingWithdrawals)} icon={Clock} color="#ef4444" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white text-sm">Sales Overview</h3>
            <Btn size="xs" variant="ghost" onClick={() => exportToExcel(stats.salesChart || [], "sales_chart")}>
              <Download size={12} /> Export
            </Btn>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={stats.salesChart || []}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={PRIMARY} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={PRIMARY} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="_id" tick={{ fontSize: 9, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 9, fill: "#64748b" }} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 10 }} formatter={v => [fmt(v), "Sales"]} />
              <Area type="monotone" dataKey="sales" stroke={PRIMARY} fillOpacity={1} fill="url(#colorSales)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <h3 className="font-semibold text-white text-sm mb-4">Top Products</h3>
          <div className="space-y-3">
            {(stats.topProducts || []).slice(0, 5).map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-4">#{i+1}</span>
                {p.image && <img src={p.image} className="w-8 h-8 rounded-lg object-cover border border-slate-700" alt="" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{p.name}</p>
                  <p className="text-xs text-slate-400">{p.totalSold || 0} sold</p>
                </div>
                <span className="text-xs text-orange-400 font-medium">{fmt(p.totalRevenue)}</span>
              </div>
            ))}
            {(!stats.topProducts?.length) && <p className="text-slate-500 text-sm text-center py-4">No sales yet</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-white text-sm">Recent Orders</h3>
            <Btn size="xs" variant="ghost" onClick={() => setActiveTab("orders")}><ArrowUpRight size={12} /> View All</Btn>
          </div>
          <div className="space-y-2">
            {(stats.recentOrders || []).slice(0, 5).map(order => (
              <div key={order._id} className="flex items-center justify-between py-2 border-b border-slate-700/50">
                <div>
                  <p className="text-sm font-medium text-white">{order.orderNumber}</p>
                  <p className="text-xs text-slate-500">{order.user?.name} • {new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-orange-400">{fmt(order.totalPrice)}</p>
                  <Badge status={order.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-white text-sm flex items-center gap-1.5"><AlertCircle size={14} className="text-yellow-400" /> Low Stock Alert</h3>
            <Btn size="xs" variant="ghost" onClick={() => setActiveTab("inventory")}><ArrowUpRight size={12} /> Inventory</Btn>
          </div>
          <div className="space-y-2">
            {products.filter(p => p.stock <= 5 && p.stock > 0).slice(0, 5).map(p => (
              <div key={p._id} className="flex items-center justify-between py-2 border-b border-slate-700/50">
                <div className="flex items-center gap-2">
                  {p.image && <img src={p.image} className="w-8 h-8 rounded-lg object-cover border border-slate-700" alt="" />}
                  <div>
                    <p className="text-sm text-white">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.category}</p>
                  </div>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${p.stock === 0 ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                  {p.stock === 0 ? "Out" : `${p.stock} left`}
                </span>
              </div>
            ))}
            {products.filter(p => p.stock <= 5 && p.stock > 0).length === 0 && (
              <p className="text-slate-500 text-xs py-4 text-center">All stock levels healthy ✓</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Render Orders Tab
  const renderOrders = () => (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg sm:text-xl font-bold text-white">Order Management</h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search orders..."
              className="bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-slate-500 w-44 sm:w-56 focus:outline-none focus:border-orange-500" />
          </div>
          <Btn size="sm" variant="secondary" onClick={() => exportToExcel(filteredOrders.map(o => ({ OrderNo: o.orderNumber, Customer: o.user?.name, Total: o.totalPrice, Status: o.status, Date: new Date(o.createdAt).toLocaleDateString() })), "orders")}>
            <FileSpreadsheet size={12} /> Excel
          </Btn>
        </div>
      </div>

      <TableWrapper>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-900/60">
              {["Order #", "Customer", "Items", "Total", "Payment", "Global Status", "My Status", "Date", "Actions"].map(h => <Th key={h}>{h}</Th>)}
            </tr>
          </thead>
          <tbody>
            {loading ? Array(5).fill(0).map((_, i) => (
              <tr key={i} className="border-b border-slate-700/50">
                {Array(7).fill(0).map((_, j) => (<td key={j} className="px-4 py-3"><div className="h-4 bg-slate-700/80 rounded animate-pulse" /></td>))}
              </tr>
            )) : filteredOrders.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-500">No orders found</td></tr>
            ) : filteredOrders.map(order => (
              <tr key={order._id} className="border-b border-slate-700/40 hover:bg-slate-700/25 transition-colors">
                <Td><span className="font-mono text-orange-400 text-xs font-bold">{order.orderNumber}</span></Td>
                <Td>
                  <p className="text-white font-medium">{order.user?.name}</p>
                  <p className="text-xs text-slate-500">{order.user?.phoneNumber}</p>
                </Td>
                <Td className="text-slate-400">{order.items?.length ?? 0}</Td>
                <Td><span className="font-bold text-white">{fmt(order.totalPrice)}</span></Td>
                <Td><Badge status={order.paymentStatus} /></Td>
                <Td><Badge status={order.status} /></Td>
                <Td>
                   {(() => {
                      const myRec = order.sellers?.find(s => (s.sellerId?._id || s.sellerId) === (currentUser?._id || currentUser?.id));
                      return <Badge status={myRec?.status || order.status} variant={myRec?.status ? "secondary" : "primary"} />;
                   })()}
                </Td>
                <Td className="text-slate-500 text-xs">{new Date(order.createdAt).toLocaleDateString()}</Td>
                <Td>
                  <div className="flex gap-1">
                    <Btn size="xs" variant="ghost" onClick={() => openModal("orderDetail", order)}><Eye size={12} /></Btn>
                    {['pending', 'confirmed', 'processing'].includes(order.status) && (
                      <Btn size="xs" variant="ghost" onClick={() => openModal("updateOrder", order)}><Edit size={12} /></Btn>
                    )}
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrapper>
    </div>
  );

  // Render Inventory Tab
  const renderInventory = () => (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg sm:text-xl font-bold text-white">Product Inventory</h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search products..."
              className="bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-slate-500 w-44 sm:w-56 focus:outline-none focus:border-orange-500" />
          </div>
          <Btn size="sm" variant="secondary" onClick={() => exportToExcel(filteredProducts.map(p => ({ Name: p.name, Category: p.category, Stock: p.stock, SellPrice: p.sellingPrice, BuyPrice: p.purchasePrice, Status: p.liveStatus })), "inventory")}>
            <FileSpreadsheet size={12} /> Excel
          </Btn>
          <Btn size="sm" onClick={() => openModal("addProduct")}><Plus size={12} /> Add Product</Btn>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard title="Total Products" value={products.length} icon={Package} color="#0ea5e9" />
        <StatCard title="Low Stock" value={products.filter(p => p.stock > 0 && p.stock <= 5).length} icon={AlertCircle} color="#f59e0b" />
        <StatCard title="Out of Stock" value={products.filter(p => p.stock === 0).length} icon={AlertCircle} color="#ef4444" />
        <StatCard title="Stock Value" value={fmt(products.reduce((s, p) => s + ((p.purchasePrice || 0) * (p.stock || 0)), 0))} icon={Banknote} color="#10b981" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map(p => (
          <motion.div key={p._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:border-orange-500/40 transition-all group">
            <div className="relative">
              {p.image ? <img src={p.image} className="w-full h-40 object-cover" alt={p.name} /> : <div className="w-full h-40 bg-slate-700 flex items-center justify-center"><Package size={32} className="text-slate-500" /></div>}
              <div className="absolute top-2 right-2 flex gap-1"><Badge status={p.liveStatus} /></div>
              <div className="absolute bottom-2 left-2"><Badge status={p.stock === 0 ? 'out of stock' : p.stock <= 5 ? 'low stock' : 'in stock'} /></div>
            </div>
            <div className="p-4">
              <h4 className="font-medium text-white mb-1 truncate">{p.name}</h4>
              <p className="text-xs text-slate-400 mb-3">{p.category} • {p.unit}</p>
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div className="bg-slate-900 rounded-lg p-2">
                  <p className="text-slate-500">Buy Price</p>
                  <p className="text-white font-medium">{fmt(p.purchasePrice)}</p>
                </div>
                <div className="bg-slate-900 rounded-lg p-2">
                  <p className="text-slate-500">Sell Price</p>
                  <p className="text-orange-400 font-medium">{fmt(p.sellingPrice)}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-sm font-bold ${p.stock === 0 ? 'text-red-400' : p.stock <= 5 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                  Stock: {p.stock} {p.unit}
                </span>
                <span className="text-xs text-slate-400">Sold: {p.soldCount || 0}</span>
              </div>
              <p className="text-[10px] text-slate-500 mb-3 uppercase tracking-wider">
                Upload Date: {new Date(p.createdAt).toLocaleDateString()}
              </p>
              <div className="flex gap-2">
                <Btn size="sm" variant="secondary" className="flex-1" onClick={() => openModal("editProduct", p)}><Edit size={12} /> Edit</Btn>
                <Btn size="sm" variant="danger" onClick={() => handleDeleteProduct(p._id)}><Trash2 size={12} /></Btn>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  // Render Customers Tab
  const renderCustomers = () => (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg sm:text-xl font-bold text-white">My Customers</h2>
        <Btn size="sm" variant="secondary" onClick={() => exportToExcel(customers.map(c => ({ Name: c.name, Email: c.email, Phone: c.phoneNumber, Orders: c.orderCount })), "customers")}>
          <FileSpreadsheet size={12} /> Excel
        </Btn>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.map(c => (
          <div key={c._id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center gap-4 hover:border-orange-500/40 transition-all group">
            <img src={c.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name || "C")}&background=ff5500&color=fff`} className="w-12 h-12 rounded-full object-cover border-2 border-slate-600 group-hover:border-orange-500 transition-all" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white truncate">{c.name}</p>
              <p className="text-xs text-slate-400 truncate">{c.email}</p>
              <p className="text-xs text-slate-400">{c.phoneNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-orange-400 font-bold text-lg">{c.orderCount}</p>
              <p className="text-[10px] text-slate-500">orders</p>
            </div>
          </div>
        ))}
        {customers.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-500">No customers yet</div>
        )}
      </div>
    </div>
  );

  // Render Withdrawals Tab
  const renderWithdrawals = () => (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg sm:text-xl font-bold text-white">Withdrawal Management</h2>
        <Btn size="sm" onClick={() => openModal("withdrawal")}><Wallet size={12} /> Request Withdrawal</Btn>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-xl p-5">
          <p className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Available Balance</p>
          <h3 className="text-2xl font-black text-emerald-400">{fmt(overview.cashBox || 0)}</h3>
          <p className="text-[10px] text-slate-500 mt-2">Ready for withdrawal</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/20 rounded-xl p-5">
          <p className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Pending Requests</p>
          <h3 className="text-2xl font-black text-yellow-400">{fmt(overview.pendingWithdrawals || 0)}</h3>
          <p className="text-[10px] text-slate-500 mt-2">Awaiting admin approval</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-xl p-5">
          <p className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Total Withdrawn</p>
          <h3 className="text-2xl font-black text-purple-400">{fmt(overview.totalWithdrawn || 0)}</h3>
          <p className="text-[10px] text-slate-500 mt-2">Lifetime payouts</p>
        </div>
      </div>

      <TableWrapper>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-900/60">
              {["Date", "Amount", "Method", "Account", "Status", "Transaction ID"].map(h => <Th key={h}>{h}</Th>)}
            </tr>
          </thead>
          <tbody>
            {withdrawals.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500">No withdrawal requests yet</td></tr>
            ) : withdrawals.map(w => (
              <tr key={w._id} className="border-b border-slate-700/40 hover:bg-slate-700/25 transition-colors">
                <Td className="text-slate-500 text-xs">{new Date(w.createdAt).toLocaleDateString()}</Td>
                <Td><span className="font-bold text-white">{fmt(w.amount)}</span></Td>
                <Td><span className="uppercase text-xs font-bold text-slate-300 bg-slate-700 px-2 py-0.5 rounded">{w.paymentMethod}</span></Td>
                <Td className="font-mono text-cyan-400 text-xs">{w.metadata?.accountNumber || w.accountNumber || 'N/A'}</Td>
                <Td><Badge status={w.status} /></Td>
                <Td className="font-mono text-slate-600 text-xs">{w.transactionId || w._id.slice(-8)}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrapper>
    </div>
  );

  // Render Earnings Tab
  const renderEarnings = () => (
    <div className="space-y-6">
      <h2 className="text-lg sm:text-xl font-bold text-white">Earnings Analytics</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Lifetime Earnings" value={fmt(overview.totalEarnings)} icon={DollarSign} color="#10b981" subtitle="Total earnings after platform commission" />
        <StatCard title="This Month" value={fmt(stats.monthlyEarnings)} icon={TrendingUp} color={PRIMARY} />
        <StatCard title="Platform Commission Paid" value={fmt(overview.totalCommission || 0)} icon={Activity} color="#f59e0b" subtitle="Total paid to platform" />
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <h3 className="font-semibold text-white mb-4">Monthly Earnings Breakdown</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats.monthlySalesChart || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#64748b" }} />
            <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
            <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 10 }} formatter={v => [fmt(v), "Earnings"]} />
            <Legend />
            <Bar dataKey="earnings" fill={PRIMARY} name="Net Earnings (৳)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="commission" fill="#f59e0b" name="Commission (৳)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <p className="text-sm text-slate-400 leading-relaxed flex items-start gap-3">
          <Shield size={18} className="text-orange-400 flex-shrink-0 mt-0.5" />
          <span><strong className="text-white">How earnings work:</strong> When an order is delivered, you earn the product price (Selling Price) minus platform commission. Withdrawal requests are processed within 1-3 business days to your bKash/Nagad/Bank account. Minimum withdrawal amount is ৳100.</span>
        </p>
      </div>
    </div>
  );

  // Render Cash Box Tab
  const renderCashBox = () => {
    const cashBalance = cashIn - cashOut;
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg sm:text-xl font-bold text-white">Cash Box</h2>
          <div className="flex gap-2">
            <Btn size="sm" onClick={() => { setTransactionForm(p => ({ ...p, type: 'Cash In' })); openModal("transaction"); }} className="bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20">
              <TrendingUp size={12} /> Cash In
            </Btn>
            <Btn size="sm" onClick={() => { setTransactionForm(p => ({ ...p, type: 'Cash Out' })); openModal("transaction"); }} className="bg-red-500 hover:bg-red-600 shadow-red-500/20">
              <TrendingDown size={12} /> Cash Out
            </Btn>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Total Cash In" value={fmt(cashIn)} icon={TrendingUp} color="#10b981" />
          <StatCard title="Total Cash Out" value={fmt(cashOut)} icon={TrendingDown} color="#ef4444" />
          <StatCard title="Net Balance" value={fmt(cashBalance)} icon={Banknote} color={cashBalance >= 0 ? "#10b981" : "#ef4444"} />
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <h3 className="font-semibold text-white text-sm mb-4">Transaction Flow</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={transactions.slice(-30).map(t => ({ date: new Date(t.date || t.createdAt).toLocaleDateString(), amount: t.type === "Cash In" ? t.amount : -(t.amount || 0) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 9, fill: "#64748b" }} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 10 }} formatter={v => [`৳${Math.abs(v || 0).toLocaleString()}`, ""]} />
              <Area type="monotone" dataKey="amount" stroke={PRIMARY} fill={PRIMARY + "25"} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <TableWrapper>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900/60">
                {["Type", "Amount", "Description", "Method", "Date"].map(h => <Th key={h}>{h}</Th>)}
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-500">No transactions yet</td></tr>
              ) : transactions.map(t => (
                <tr key={t._id} className="border-b border-slate-700/40 hover:bg-slate-700/25 transition-colors">
                  <Td><span className={`text-xs font-semibold ${t.type === "Cash In" ? "text-emerald-400" : "text-red-400"}`}>{t.type}</span></Td>
                  <Td><span className={`font-bold ${t.type === "Cash In" ? "text-emerald-400" : "text-red-400"}`}>{t.type === "Cash In" ? "+" : "-"}{fmt(t.amount)}</span></Td>
                  <Td className="text-slate-400 max-w-xs truncate">{t.description}</Td>
                  <Td className="text-slate-500 text-xs">{t.paymentMethod}</Td>
                  <Td className="text-slate-500 text-xs">{new Date(t.date || t.createdAt).toLocaleString()}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrapper>
      </div>
    );
  };

  // Render Chats Tab
  const renderChats = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-bold text-white">Customer Messages</h2>
        {chats.some(c => c.unreadCount > 0) && (
          <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded-full animate-pulse">
            New Messages
          </span>
        )}
      </div>
      
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden flex flex-col lg:flex-row" style={{ height: "calc(100vh - 250px)", minHeight: 500 }}>
        {/* Chat List Sidebar */}
        <div className="w-full lg:w-80 border-r border-slate-700 flex flex-col bg-slate-900/30">
          <div className="p-4 border-b border-slate-700 bg-slate-900/50">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search conversations..." 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 transition-all"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto divide-y divide-slate-700/30">
            {chats.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="mx-auto text-slate-700 mb-3 opacity-20" size={40} />
                <p className="text-slate-500 text-sm">No messages yet</p>
              </div>
            ) : (
              chats.map(chat => {
                const otherParticipant = chat.participants.find(p => p._id !== currentUser._id);
                const isSelected = selectedChat?._id === chat._id;
                
                return (
                  <button 
                    key={chat._id} 
                    onClick={() => setSelectedChat(chat)} 
                    className={`w-full p-4 flex items-center gap-3 hover:bg-slate-700/30 transition-all text-left ${isSelected ? "bg-orange-500/10 border-l-4 border-orange-500" : ""}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold overflow-hidden border border-slate-600">
                      {otherParticipant?.profilePic ? (
                        <img src={otherParticipant.profilePic} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (otherParticipant?.name || "?").charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-sm font-semibold text-white truncate">{otherParticipant?.name || "Customer"}</p>
                        {chat.unreadCount > 0 && (
                          <span className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate">
                        {chat.lastMessage?.sender?._id === currentUser._id ? 'You: ' : ''}
                        {chat.lastMessage?.text || "Started a conversation"}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Window Area */}
        <div className="flex-1 flex flex-col bg-slate-900/10 relative">
          {selectedChat ? (
            <ChatWindow 
              chatId={selectedChat._id}
              receiver={selectedChat.user?._id === currentUser?._id ? selectedChat.seller : selectedChat.user}
              onClose={() => setSelectedChat(null)}
              className="h-full"
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
              <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mb-4 shadow-xl border border-slate-700/50">
                <MessageSquare size={32} className="text-slate-600" />
              </div>
              <h3 className="text-white font-bold mb-1">Select a customer to message</h3>
              <p className="text-sm max-w-xs mx-auto">Click on a conversation from the list to view history and send replies.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Render Sales Tab (Manual / Local Sales)
  const renderSales = () => {
    const filteredSales = sales.filter(s => !searchQuery || s.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || s.customerName?.toLowerCase().includes(searchQuery.toLowerCase()));
    const totalSalesRevenue = sales.reduce((s, sale) => s + (sale.totalAmount || 0), 0);
    const totalProfit = sales.reduce((s, sale) => s + (sale.profit || 0), 0);
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg sm:text-xl font-bold text-white">My Sales <span className="text-sm font-normal text-slate-400">(Local / Manual)</span></h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search sales..."
                className="bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-slate-500 w-44 sm:w-56 focus:outline-none focus:border-orange-500" />
            </div>
            <Btn size="sm" onClick={() => { setSaleForm({ product: '', quantity: 1, totalAmount: '', paymentMethod: 'Cash', customerName: '', customerPhone: '', description: '' }); openModal('addSale'); }}>
              <Plus size={12} /> Record Sale
            </Btn>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Total Sales" value={sales.length} icon={ShoppingBag} color="#f97316" loading={loading} />
          <StatCard title="Total Revenue" value={fmt(totalSalesRevenue)} icon={DollarSign} color="#10b981" loading={loading} />
          <StatCard title="Total Profit" value={fmt(totalProfit)} icon={TrendingUp} color="#0ea5e9" loading={loading} />
        </div>

        <TableWrapper>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900/60">
                {["#", "Product", "Unit/Qty", "Total Taka", "Profit", "Payment", "Date & Time", "Actions"].map(h => <Th key={h}>{h}</Th>)}
              </tr>
            </thead>
            <tbody>
              {loading ? Array(5).fill(0).map((_, i) => (
                <tr key={i} className="border-b border-slate-700/50">
                  {Array(8).fill(0).map((_, j) => (<td key={j} className="px-4 py-3"><div className="h-4 bg-slate-700/80 rounded animate-pulse" /></td>))}
                </tr>
              )) : filteredSales.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                  <ShoppingBag className="mx-auto mb-3 opacity-20" size={40} />
                  <p>No sales recorded yet</p>
                  <p className="text-xs mt-1">Click "Record Sale" to add your first manual sale</p>
                </td></tr>
              ) : filteredSales.map((sale, idx) => (
                <tr key={sale._id} className="border-b border-slate-700/40 hover:bg-slate-700/25 transition-colors">
                  <Td className="text-slate-500 text-xs font-mono">{idx + 1}</Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      {sale.product?.image && <img src={sale.product.image} className="w-8 h-8 rounded-lg object-cover border border-slate-700" alt="" />}
                      <div>
                        <p className="text-white font-medium text-sm">{sale.product?.name || 'Unknown Product'}</p>
                        {sale.customerName && <p className="text-xs text-slate-500">{sale.customerName}</p>}
                      </div>
                    </div>
                  </Td>
                  <Td><span className="font-bold text-white">{sale.quantity}</span> <span className="text-xs text-slate-400">{sale.product?.unit || 'পিস'}</span></Td>
                  <Td><span className="font-bold text-orange-400">{fmt(sale.totalAmount)}</span></Td>
                  <Td><span className={`font-semibold text-sm ${(sale.profit || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{(sale.profit || 0) >= 0 ? '+' : '-'}{fmt(Math.abs(sale.profit || 0))}</span></Td>
                  <Td><span className="uppercase text-xs font-bold text-slate-300 bg-slate-700 px-2 py-0.5 rounded">{sale.paymentMethod}</span></Td>
                  <Td className="text-slate-500 text-xs">{new Date(sale.createdAt).toLocaleString('en-BD', { dateStyle: 'short', timeStyle: 'short' })}</Td>
                  <Td>
                    <div className="flex gap-1">
                      <Btn size="xs" variant="ghost" title="View Details" onClick={() => openModal('viewSale', sale)}><Eye size={12} /></Btn>
                      <Btn size="xs" variant="ghost" title="Edit" onClick={() => {
                        setSaleForm({ product: sale.product?._id || '', quantity: sale.quantity, totalAmount: sale.totalAmount, paymentMethod: sale.paymentMethod, customerName: sale.customerName || '', customerPhone: sale.customerPhone || '', description: sale.notes || '' });
                        openModal('editSale', sale);
                      }}><Edit size={12} /></Btn>
                      <Btn size="xs" variant="danger" title="Delete" onClick={() => handleDeleteSale(sale._id)}><Trash2 size={12} /></Btn>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrapper>
      </div>
    );
  };

  // Tab content mapping
  const tabContent = {
    overview: renderOverview,
    orders: renderOrders,
    inventory: renderInventory,
    sales: renderSales,
    customers: renderCustomers,
    withdrawals: renderWithdrawals,
    earnings: renderEarnings,
    cashbox: renderCashBox,
    chats: renderChats,
  };

  // Pending approval screen
  if (currentUser && !currentUser.isSellerApproved) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <Clock size={40} className="text-yellow-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Account Pending Approval</h2>
          <p className="text-slate-400 text-sm mb-6">
            Your seller account is waiting for admin approval. You'll receive an email notification once approved.<br />
            This usually takes 24-48 hours.
          </p>
          <div className="bg-slate-700/50 rounded-xl p-4 mb-6">
            <p className="text-xs text-slate-400">Shop Name</p>
            <p className="text-white font-medium">{currentUser?.shopName}</p>
            <p className="text-xs text-slate-400 mt-2">Requested On</p>
            <p className="text-white text-sm">{new Date(currentUser?.createdAt).toLocaleDateString()}</p>
          </div>
          <Btn variant="secondary" className="w-full" onClick={() => window.location.href = '/'}>
            Back to Home
          </Btn>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      <Sidebar />
      <TopBar />

      <div className="lg:pl-64 pt-14 lg:pt-0">
        <div className="min-h-screen p-4 sm:p-5 lg:p-6">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            {tabContent[activeTab]?.()}
          </motion.div>
        </div>
      </div>

      {/* Modals */}
      <Modal open={modals.addProduct || modals.editProduct} onClose={() => { closeModal('addProduct'); closeModal('editProduct'); }} title={selectedItem ? 'Edit Product' : 'Add New Product'} size="lg">
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Input label="Product Name" required value={productForm.name} onChange={e => setProductForm(p => ({ ...p, name: e.target.value }))} /></div>
            <Input label="Selling Price (৳)" type="number" required value={productForm.sellingPrice} onChange={e => setProductForm(p => ({ ...p, sellingPrice: e.target.value }))} />
            <Input label="Purchase Price (৳)" type="number" required value={productForm.purchasePrice} onChange={e => setProductForm(p => ({ ...p, purchasePrice: e.target.value }))} />
            <Input label="Stock Quantity" type="number" required value={productForm.stock} onChange={e => setProductForm(p => ({ ...p, stock: e.target.value }))} />
            <Select label="Unit" value={productForm.unit} onChange={e => setProductForm(p => ({ ...p, unit: e.target.value }))}>
              {['পিস', 'কেজি', 'লিটার', 'ডজন', 'হালি', 'প্যাকেট', 'গ্রাম'].map(u => <option key={u}>{u}</option>)}
            </Select>
            <Input label="Category" required value={productForm.category} onChange={e => setProductForm(p => ({ ...p, category: e.target.value }))} />
            <Input label="Brand" value={productForm.brand} onChange={e => setProductForm(p => ({ ...p, brand: e.target.value }))} />
            <div className="col-span-2 space-y-4 bg-slate-900 p-4 rounded-xl border border-slate-700">
              <div>
                <p className="text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Main Product Image *</p>
                <div className="flex gap-2 mb-2">
                  <Input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => handleImageUpload(e, false)} 
                    disabled={uploadingImage}
                    className="flex-1"
                  />
                  <div className="flex-[2]">
                    <Input value={productForm.image} onChange={e => setProductForm(p => ({ ...p, image: e.target.value }))} placeholder="Or paste image URL..." />
                  </div>
                </div>
                {productForm.image && <img src={productForm.image} className="h-24 w-24 object-cover rounded-lg border border-slate-600" alt="Main preview" />}
              </div>
              
              <div>
                <p className="text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Additional Images (Max 4)</p>
                <div className="flex gap-2 mb-2">
                  <Input 
                    type="file" 
                    accept="image/*" 
                    multiple
                    onChange={(e) => handleImageUpload(e, true)} 
                    disabled={uploadingImage || productForm.images?.length >= 4}
                    className="flex-1"
                  />
                </div>
                {/* 4 Inputs for additional URLs */}
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {[0, 1, 2, 3].map(i => (
                    <Input 
                      key={i} 
                      placeholder={`Additional Image URL ${i+1}`} 
                      value={productForm.images?.[i] || ''} 
                      onChange={e => {
                        const newImages = [...(productForm.images || [])];
                        newImages[i] = e.target.value;
                        setProductForm(p => ({ ...p, images: newImages.filter(Boolean) }));
                      }} 
                    />
                  ))}
                </div>
                {productForm.images?.length > 0 && (
                  <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
                    {productForm.images.map((img, idx) => (
                      <div key={idx} className="relative group shrink-0">
                        <img src={img} className="h-16 w-16 object-cover rounded-lg border border-slate-600" alt={`preview ${idx}`} />
                        <button type="button" onClick={() => setProductForm(p => ({...p, images: p.images.filter((_, i) => i !== idx)}))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hidden group-hover:block"><X size={12} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="col-span-2"><TextArea label="Description" rows={3} required value={productForm.description} onChange={e => setProductForm(p => ({ ...p, description: e.target.value }))} /></div>

            {/* Variants Section */}
            <div className="col-span-2 space-y-3 bg-slate-900 p-4 rounded-xl border border-slate-700">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Product Variants/Sizes (Optional)</p>
                <Btn size="xs" variant="secondary" type="button" onClick={() => setProductForm(p => ({ ...p, variants: [...(p.variants || []), { name: '', price: '', stock: '' }] }))}>
                  <Plus size={10} /> Add Variant
                </Btn>
              </div>
              
              {(productForm.variants || []).length > 0 ? (
                <div className="space-y-2">
                  {productForm.variants.map((v, i) => (
                    <div key={i} className="flex gap-2 items-end group">
                      <div className="flex-1"><Input label="Variant Name (e.g. XL, Red)" value={v.name} onChange={e => {
                        const nv = [...productForm.variants];
                        nv[i].name = e.target.value;
                        setProductForm(p => ({ ...p, variants: nv }));
                      }} /></div>
                      <div className="w-24"><Input label="Price Override" type="number" value={v.price} onChange={e => {
                        const nv = [...productForm.variants];
                        nv[i].price = e.target.value;
                        setProductForm(p => ({ ...p, variants: nv }));
                      }} /></div>
                      <div className="w-24"><Input label="Stock" type="number" value={v.stock} onChange={e => {
                        const nv = [...productForm.variants];
                        nv[i].stock = e.target.value;
                        setProductForm(p => ({ ...p, variants: nv }));
                      }} /></div>
                      <Btn size="sm" variant="danger" type="button" className="p-2 mb-0.5" onClick={() => setProductForm(p => ({ ...p, variants: p.variants.filter((_, idx) => idx !== i) }))}>
                        <X size={14} />
                      </Btn>
                    </div>
                  ))}
                  <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                    <AlertCircle size={10} /> If variant price is left blank, the base selling price will be used.
                  </p>
                </div>
              ) : (
                <p className="text-[10px] text-slate-600 italic">No variants added. Click "Add Variant" for size/color options.</p>
              )}
            </div>
            <Select label="Status" value={productForm.liveStatus} onChange={e => setProductForm(p => ({ ...p, liveStatus: e.target.value }))}>
              {['live', 'draft'].map(s => <option key={s}>{s}</option>)}
            </Select>
            <Input label="SKU" value={productForm.sku} onChange={e => setProductForm(p => ({ ...p, sku: e.target.value }))} />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Btn type="button" variant="secondary" onClick={() => { closeModal('addProduct'); closeModal('editProduct'); }}>Cancel</Btn>
            <Btn type="submit">{selectedItem ? 'Update' : 'Add'} Product</Btn>
          </div>
        </form>
      </Modal>

      <Modal open={modals.orderDetail} onClose={() => closeModal('orderDetail')} title={`Order: ${selectedItem?.orderNumber}`} size="lg">
        {selectedItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-900 rounded-xl p-3 text-sm">
                <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Customer</p>
                <p className="text-white font-medium">{selectedItem.user?.name}</p>
                <p className="text-slate-400 text-xs mt-0.5">{selectedItem.user?.email}</p>
                <p className="text-slate-400 text-xs">{selectedItem.user?.phoneNumber}</p>
              </div>
              <div className="bg-slate-900 rounded-xl p-3 text-sm">
                <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Shipping Address</p>
                <p className="text-white">{selectedItem.shippingAddress?.fullName}</p>
                <p className="text-slate-400 text-xs">{selectedItem.shippingAddress?.addressLine1}</p>
                <p className="text-slate-400 text-xs">{selectedItem.shippingAddress?.city}, {selectedItem.shippingAddress?.country}</p>
              </div>
            </div>
            <div className="bg-slate-900 rounded-xl p-3">
              <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Items</p>
              <div className="space-y-2">
                {selectedItem.items?.map((item, i) => {
                  const isMyProduct = (item.seller?._id || item.seller) === (currentUser?._id || currentUser?.id);
                  return (
                  <div key={i} className={`flex items-center justify-between py-2 border-b border-slate-800 last:border-0 ${!isMyProduct ? 'opacity-50 blur-[2px] grayscale select-none' : ''}`}>
                    <div className="flex items-center gap-3">
                      {item.image && <img src={item.image} className="w-9 h-9 rounded-lg object-cover border border-slate-700" alt="" />}
                      <div>
                        <p className="text-white text-sm font-medium">{item.name}{!isMyProduct && <span className="text-[10px] text-slate-500 ml-2">(Other Seller)</span>}</p>
                        {item.variant?.name && <p className="text-[10px] text-orange-400 font-bold uppercase tracking-wider mt-0.5">Variant: {item.variant.name}</p>}
                        <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <p className="text-orange-400 font-bold text-sm">{fmt(item.price * item.quantity)}</p>
                  </div>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-900 rounded-xl p-3 space-y-1.5">
                <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="text-white">{fmt(selectedItem.subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Shipping</span><span className="text-white">{fmt(selectedItem.shippingCost)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">VAT</span><span className="text-white">{fmt(selectedItem.vatAmount)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Discount</span><span className="text-white">-{fmt(selectedItem.discount)}</span></div>
                <div className="flex justify-between border-t border-slate-800 pt-1.5"><span className="text-white font-bold">Total</span><span className="text-orange-400 font-bold">{fmt(selectedItem.totalPrice)}</span></div>
              </div>
              <div className="bg-slate-900 rounded-xl p-3 space-y-2">
                <div className="flex justify-between items-center"><span className="text-slate-500 text-xs uppercase tracking-wider">Payment Method</span><span className="text-white font-bold uppercase text-xs">{selectedItem.paymentMethod}</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-500 text-xs uppercase tracking-wider">Payment Status</span><Badge status={selectedItem.paymentStatus} /></div>
                <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-lg">
                  <span className="text-slate-500 text-xs uppercase tracking-wider">My Status</span>
                  {(() => {
                    const myRec = selectedItem.sellers?.find(s => (s.sellerId?._id || s.sellerId) === (currentUser?._id || currentUser?.id));
                    return <Badge status={myRec?.status || selectedItem.status} />;
                  })()}
                </div>
                <div className="flex justify-between items-center"><span className="text-slate-500 text-xs uppercase tracking-wider">Global Status</span><Badge status={selectedItem.status} /></div>
                {selectedItem.paymentDetails?.transactionId && (
                  <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                    <span className="text-slate-500 text-[10px] uppercase font-bold">Transaction ID</span>
                    <span className="text-cyan-400 text-[10px] font-mono select-all bg-cyan-400/10 px-1.5 py-0.5 rounded">{selectedItem.paymentDetails.transactionId}</span>
                  </div>
                )}
                {selectedItem.trackingNumber && (
                  <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                    <span className="text-slate-500 text-[10px] uppercase font-bold">Tracking</span>
                    <span className="text-blue-400 text-[10px] font-mono select-all bg-blue-400/10 px-1.5 py-0.5 rounded">{selectedItem.trackingNumber}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={modals.updateOrder} onClose={() => closeModal('updateOrder')} title="Update Order Status">
        <form onSubmit={handleUpdateOrder} className="space-y-4">
          <Select label="Order Status" value={orderUpdateForm.status} onChange={e => setOrderUpdateForm(p => ({ ...p, status: e.target.value }))}>
            {['confirmed', 'processing', 'shipped', 'out-for-delivery', 'cancelled'].map(s => <option key={s}>{s}</option>)}
          </Select>
          <Input label="Tracking Number" value={orderUpdateForm.trackingNumber} onChange={e => setOrderUpdateForm(p => ({ ...p, trackingNumber: e.target.value }))} placeholder="e.g. PATH123456" />
          <Input label="Courier Name" value={orderUpdateForm.courier} onChange={e => setOrderUpdateForm(p => ({ ...p, courier: e.target.value }))} placeholder="Pathao, Redx, Sundarban..." />
          <div className="flex gap-2 justify-end pt-2">
            <Btn type="button" variant="secondary" onClick={() => closeModal('updateOrder')}>Cancel</Btn>
            <Btn type="submit">Update Order</Btn>
          </div>
        </form>
      </Modal>

      <Modal open={modals.withdrawal} onClose={() => closeModal('withdrawal')} title="Request Withdrawal">
        <div className="mb-5 bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-4 border border-slate-700">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-slate-400 uppercase font-bold">Total Earnings</span>
            <span className="text-white font-mono">{fmt(overview.totalEarnings)}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-slate-400 uppercase font-bold">Already Withdrawn</span>
            <span className="text-slate-300 font-mono">{fmt(overview.totalWithdrawn)}</span>
          </div>
          {overview.pendingWithdrawals > 0 && (
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-slate-400 uppercase font-bold">Pending</span>
              <span className="text-orange-400 font-mono">{fmt(overview.pendingWithdrawals)}</span>
            </div>
          )}
          <div className="h-px bg-slate-700 my-2" />
          <div className="flex justify-between items-center">
            <span className="text-sm text-emerald-400 font-bold uppercase">Available</span>
            <span className="text-emerald-400 font-black text-xl">{fmt(overview.cashBox)}</span>
          </div>
        </div>
        <form onSubmit={handleWithdrawal} className="space-y-4">
          <Input label="Amount (৳)" type="number" min="100" required value={withdrawalForm.amount} onChange={e => setWithdrawalForm(p => ({ ...p, amount: e.target.value }))} placeholder="Minimum ৳100" />
          <Select label="Payment Method" value={withdrawalForm.paymentMethod} onChange={e => setWithdrawalForm(p => ({ ...p, paymentMethod: e.target.value }))}>
            {['bKash', 'Nagad', 'Rocket', 'Bank'].map(m => <option key={m}>{m}</option>)}
          </Select>
          <Input label="Account Number" required value={withdrawalForm.accountNumber} onChange={e => setWithdrawalForm(p => ({ ...p, accountNumber: e.target.value }))} placeholder="01XXXXXXXXX" />
          <Input label="Account Holder Name" required value={withdrawalForm.accountName} onChange={e => setWithdrawalForm(p => ({ ...p, accountName: e.target.value }))} placeholder="Full name as per account" />
          <div className="flex gap-2 justify-end pt-2">
            <Btn type="button" variant="secondary" onClick={() => closeModal('withdrawal')}>Cancel</Btn>
            <Btn type="submit">Submit Request</Btn>
          </div>
        </form>
      </Modal>

      {/* Transaction Modal */}
      <Modal title={`Add New ${transactionForm.type}`} open={modals.transaction} onClose={() => closeModal('transaction')}>
        <form onSubmit={handleCreateTransaction} className="space-y-4">
          <Select label="Transaction Type" value={transactionForm.type} onChange={e => setTransactionForm({...transactionForm, type: e.target.value})}>
            <option value="Cash In">Cash In</option>
            <option value="Cash Out">Cash Out</option>
          </Select>
          <Input label="Amount (BDT)" type="number" min="1" required value={transactionForm.amount} onChange={e => setTransactionForm({...transactionForm, amount: e.target.value})} placeholder="e.g. 5000" />
          <Select label="Payment Method" value={transactionForm.paymentMethod} onChange={e => setTransactionForm({...transactionForm, paymentMethod: e.target.value})}>
            <option value="Cash">Cash</option>
            <option value="bKash">bKash</option>
            <option value="Nagad">Nagad</option>
            <option value="Bank">Bank Transfer</option>
            <option value="Card">Card</option>
            <option value="Other">Other</option>
          </Select>
          <TextArea label="Description" required value={transactionForm.description} onChange={e => setTransactionForm({...transactionForm, description: e.target.value})} placeholder="Reason for transaction, notes etc..." rows={3} />
          <div className="flex justify-end gap-2 mt-6">
            <Btn type="button" variant="secondary" onClick={() => closeModal('transaction')}>Cancel</Btn>
            <Btn type="submit" className={transactionForm.type === 'Cash In' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}>
              Record {transactionForm.type}
            </Btn>
          </div>
        </form>
      </Modal>
 
      {/* Profile Modal */}
      <Modal open={modals.profile} onClose={() => closeModal("profile")} title="Seller Profile" size="sm">
        <div className="text-center">
            <div className="relative inline-block mb-4 group">
              <img 
                src={currentUser?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || "S")}&background=ff5500&color=white`}
                className="w-24 h-24 rounded-full object-cover border-4 border-slate-700 shadow-xl group-hover:border-orange-500 transition-all"
                alt="" 
              />
              <label className="absolute bottom-0 right-0 p-2 bg-orange-500 rounded-full cursor-pointer hover:bg-orange-600 transition-all shadow-lg active:scale-90">
                  <Package size={14} className="text-white" />
                  <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const loadingToast = toast.loading('Uploading profile...');
                    try {
                      const resized = await resizeImage(file, { maxSizeKB: 512, maxWidth: 512, maxHeight: 512 });
                      const fd = new FormData();
                      fd.append('images', resized);
                      const res = await uploadAPI.uploadImages(fd);
                      if (res.data.success) {
                          const newPic = res.data.urls[0];
                          await sellerAPI.updateProfile({ profilePic: newPic });
                          toast.success('Done! Refreshing...', { id: loadingToast });
                          window.location.reload();
                      }
                    } catch (err) {
                      toast.error('Upload failed', { id: loadingToast });
                    }
                  }} />
              </label>
            </div>
            <p className="text-white font-bold text-lg">{currentUser?.name}</p>
            <p className="text-slate-400 text-sm mb-4">{currentUser?.email}</p>
            <div className="flex justify-center gap-2 mb-2">
              <Badge status={currentUser?.isSellerApproved ? "approved" : "pending"} />
              <Badge status="seller" />
            </div>
            
            <div className="bg-slate-900 rounded-xl p-4 text-left space-y-3 mt-4 border border-slate-700">
               <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Shop Details</p>
                  <p className="text-white font-medium">{currentUser?.shopName}</p>
                  <p className="text-xs text-slate-400">{currentUser?.shopAddress}</p>
               </div>
               <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Wallet Info</p>
                  <p className="text-emerald-400 font-bold">Balance: {fmt(overview.cashBox)}</p>
               </div>
            </div>
        </div>
      </Modal>

      {/* Add Sale Modal */}
      <Modal open={modals.addSale} onClose={() => closeModal('addSale')} title="Record New Sale" size="md">
        <form onSubmit={handleCreateSale} className="space-y-4">
          <Select label="Product *" value={saleForm.product} onChange={e => setSaleForm(p => ({ ...p, product: e.target.value }))} required>
            <option value="">-- Select Product --</option>
            {products.filter(p => p.liveStatus !== 'archived' && p.stock > 0).map(p => (
              <option key={p._id} value={p._id}>{p.name} (Stock: {p.stock} {p.unit})</option>
            ))}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Quantity *" type="number" min="1" required value={saleForm.quantity}
              onChange={e => {
                const qty = parseInt(e.target.value) || 1;
                const selectedProduct = products.find(p => p._id === saleForm.product);
                const autoPrice = selectedProduct ? (selectedProduct.sellingPrice * qty).toFixed(0) : saleForm.totalAmount;
                setSaleForm(p => ({ ...p, quantity: qty, totalAmount: autoPrice }));
              }} />
            <Input label="Total Amount (৳) *" type="number" min="1" required value={saleForm.totalAmount}
              onChange={e => setSaleForm(p => ({ ...p, totalAmount: e.target.value }))} placeholder="Auto-filled from price" />
          </div>
          {saleForm.product && saleForm.quantity && (
            <div className="bg-slate-900 rounded-lg p-3 text-xs space-y-1">
              {(() => {
                const prod = products.find(p => p._id === saleForm.product);
                if (!prod) return null;
                const cost = (prod.purchasePrice || 0) * Number(saleForm.quantity);
                const profit = Number(saleForm.totalAmount || 0) - cost;
                return (
                  <>
                    <div className="flex justify-between"><span className="text-slate-400">Cost Price:</span><span className="text-white">{fmt(cost)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Expected Profit:</span><span className={profit >= 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>{fmt(profit)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Available Stock:</span><span className="text-white">{prod.stock} {prod.unit}</span></div>
                  </>
                );
              })()}
            </div>
          )}
          <Select label="Payment Method" value={saleForm.paymentMethod} onChange={e => setSaleForm(p => ({ ...p, paymentMethod: e.target.value }))}>
            {['Cash', 'bKash', 'Nagad', 'Rocket', 'Bank', 'Card', 'due'].map(m => <option key={m}>{m}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Customer Name" value={saleForm.customerName} onChange={e => setSaleForm(p => ({ ...p, customerName: e.target.value }))} placeholder="Optional" />
            <Input label="Customer Phone" value={saleForm.customerPhone} onChange={e => setSaleForm(p => ({ ...p, customerPhone: e.target.value }))} placeholder="01XXXXXXXXX" />
          </div>
          <TextArea label="Notes / Description" rows={2} value={saleForm.description} onChange={e => setSaleForm(p => ({ ...p, description: e.target.value }))} placeholder="Any notes about this sale..." />
          <div className="flex gap-2 justify-end pt-2">
            <Btn type="button" variant="secondary" onClick={() => closeModal('addSale')}>Cancel</Btn>
            <Btn type="submit" variant="success"><Check size={13} /> Record Sale</Btn>
          </div>
        </form>
      </Modal>

      {/* Edit Sale Modal */}
      <Modal open={modals.editSale} onClose={() => closeModal('editSale')} title="Edit Sale" size="md">
        <form onSubmit={handleUpdateSale} className="space-y-4">
          {selectedItem && (
            <div className="bg-slate-900 rounded-lg p-3 flex items-center gap-3 border border-slate-700">
              {selectedItem.product?.image && <img src={selectedItem.product.image} className="w-10 h-10 rounded-lg object-cover" alt="" />}
              <div>
                <p className="text-white font-semibold text-sm">{selectedItem.product?.name}</p>
                <p className="text-xs text-slate-400">Original Qty: {selectedItem.quantity} | Total: {fmt(selectedItem.totalAmount)}</p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Input label="Quantity" type="number" min="1" value={saleForm.quantity} onChange={e => setSaleForm(p => ({ ...p, quantity: parseInt(e.target.value) || 1 }))} />
            <Input label="Total Amount (৳)" type="number" min="0" value={saleForm.totalAmount} onChange={e => setSaleForm(p => ({ ...p, totalAmount: e.target.value }))} />
          </div>
          <Select label="Payment Method" value={saleForm.paymentMethod} onChange={e => setSaleForm(p => ({ ...p, paymentMethod: e.target.value }))}>
            {['Cash', 'bKash', 'Nagad', 'Rocket', 'Bank', 'Card', 'due'].map(m => <option key={m}>{m}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Customer Name" value={saleForm.customerName} onChange={e => setSaleForm(p => ({ ...p, customerName: e.target.value }))} placeholder="Optional" />
            <Input label="Customer Phone" value={saleForm.customerPhone} onChange={e => setSaleForm(p => ({ ...p, customerPhone: e.target.value }))} placeholder="01XXXXXXXXX" />
          </div>
          <TextArea label="Notes / Description" rows={2} value={saleForm.description} onChange={e => setSaleForm(p => ({ ...p, description: e.target.value }))} placeholder="Update notes..." />
          <div className="flex gap-2 justify-end pt-2">
            <Btn type="button" variant="secondary" onClick={() => closeModal('editSale')}>Cancel</Btn>
            <Btn type="submit"><Check size={13} /> Update Sale</Btn>
          </div>
        </form>
      </Modal>

      {/* View Sale Modal */}
      <Modal open={modals.viewSale} onClose={() => closeModal('viewSale')} title="Sale Details" size="md">
        {selectedItem && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-slate-900 rounded-xl p-4">
              {selectedItem.product?.image && <img src={selectedItem.product.image} className="w-16 h-16 rounded-xl object-cover border border-slate-700" alt="" />}
              <div>
                <p className="text-white font-bold text-base">{selectedItem.product?.name || 'Unknown Product'}</p>
                <p className="text-xs text-slate-400 mt-0.5">{selectedItem.saleNumber || selectedItem._id?.slice(-8)}</p>
                <Badge status={selectedItem.paymentMethod?.toLowerCase() === 'due' ? 'pending' : 'paid'} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-900 rounded-xl p-3 space-y-2">
                <p className="text-xs text-slate-500 uppercase font-bold mb-2">Sale Info</p>
                <div className="flex justify-between"><span className="text-slate-400">Quantity</span><span className="text-white font-bold">{selectedItem.quantity} {selectedItem.product?.unit || 'পিস'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Unit Price</span><span className="text-white">{fmt(selectedItem.unitPrice)}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Total Amount</span><span className="text-orange-400 font-bold">{fmt(selectedItem.totalAmount)}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Cost Price</span><span className="text-white">{fmt(selectedItem.purchasePrice)}</span></div>
                <div className="flex justify-between border-t border-slate-800 pt-2">
                  <span className="text-slate-400">Profit</span>
                  <span className={`font-bold ${(selectedItem.profit || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmt(selectedItem.profit)}</span>
                </div>
              </div>
              <div className="bg-slate-900 rounded-xl p-3 space-y-2">
                <p className="text-xs text-slate-500 uppercase font-bold mb-2">Customer & Payment</p>
                <div className="flex justify-between"><span className="text-slate-400">Payment</span><span className="text-white font-semibold uppercase">{selectedItem.paymentMethod}</span></div>
                {selectedItem.customerName ? (
                  <>
                    <div className="flex justify-between"><span className="text-slate-400">Name</span><span className="text-white">{selectedItem.customerName}</span></div>
                    {selectedItem.customerPhone && <div className="flex justify-between"><span className="text-slate-400">Phone</span><span className="text-cyan-400 font-mono">{selectedItem.customerPhone}</span></div>}
                  </>
                ) : (
                  <p className="text-slate-600 text-xs italic">No customer info</p>
                )}
                <div className="border-t border-slate-800 pt-2">
                  <p className="text-slate-400 text-xs">Date & Time</p>
                  <p className="text-white text-xs mt-0.5">{new Date(selectedItem.createdAt).toLocaleString('en-BD')}</p>
                </div>
              </div>
            </div>

            {selectedItem.notes && (
              <div className="bg-slate-900 rounded-xl p-3">
                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Notes</p>
                <p className="text-slate-300 text-sm">{selectedItem.notes}</p>
              </div>
            )}
            <div className="flex gap-2 justify-end pt-1">
              <Btn variant="secondary" onClick={() => closeModal('viewSale')}>Close</Btn>
              <Btn variant="ghost" onClick={() => {
                setSaleForm({ product: selectedItem.product?._id || '', quantity: selectedItem.quantity, totalAmount: selectedItem.totalAmount, paymentMethod: selectedItem.paymentMethod, customerName: selectedItem.customerName || '', customerPhone: selectedItem.customerPhone || '', description: selectedItem.notes || '' });
                closeModal('viewSale');
                openModal('editSale', selectedItem);
              }}><Edit size={13} /> Edit</Btn>
            </div>
          </div>
        )}
      </Modal>

      {/* Chat Modal */}
      <Modal open={modals.chat} onClose={() => closeModal('chat')} title="Admin Support Chat" size="lg">
        <div className="h-[500px]">
          <ChatWindow 
            receiver={selectedItem} 
            onClose={() => closeModal('chat')} 
          />
        </div>
      </Modal>
    </div>
  );
};


export default SellerPanel;