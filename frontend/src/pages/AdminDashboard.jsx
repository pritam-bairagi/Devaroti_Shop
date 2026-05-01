import React, { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Package, ShoppingCart, LayoutDashboard, Banknote,
  ShoppingBag, FileText, Download, BarChart3, TrendingUp, TrendingDown,
  Filter, Calendar, Eye, Check, AlertCircle, Clock, CreditCard,
  X, Plus, Edit, Trash2, Search, RefreshCw, ArrowUpRight,
  FileSpreadsheet, Printer, Store, Activity, Warehouse,
  CloudUpload, CheckCircle2, XCircle, Loader2, Ticket, History, Copy,
  Code, Calculator as CalcIcon, MessageSquare, Headset, Megaphone,
  Image as ImageIcon, Layers, Menu, ChevronLeft, Bell, LogOut,
  Settings, MoreVertical, Send, Phone, Globe, Hash, Lock,
  Shield, Database, Zap, Link, Tag, Package2, Star, Award, Camera
} from "lucide-react";
import { useAuth } from "../contexts/useAuth";
import { adminAPI, chatAPI, uploadAPI } from "../services/api";
import { resizeImage } from "../utils/imageUtils";
import ChatWindow from "../components/ChatWindow";
import { useSocket } from "../contexts/useSocket";
import toast from "react-hot-toast";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, LineChart, Line, Legend, ComposedChart
} from "recharts";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

// ─── Constants ───────────────────────────────────────────────────────────────
const COLORS = ["#ff5500", "#0ea5e9", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];
const PRIMARY = "#ff5500";

const TABS = [
  { id: "overview",         label: "Overview",         icon: LayoutDashboard },
  { id: "orders",           label: "Orders",           icon: ShoppingCart },
  { id: "payments",         label: "Verify Payments",  icon: CreditCard },
  { id: "inventory",        label: "Inventory",        icon: Warehouse },
  { id: "users",            label: "Users",            icon: Users },
  { id: "cashbox",          label: "Cash Box",         icon: Banknote },
  { id: "chats",            label: "Chats",            icon: MessageSquare },
  { id: "sellerRequests",   label: "Seller Requests",  icon: Store },
  { id: "withdrawals",      label: "Withdrawals",      icon: CreditCard },
  { id: "payouts",          label: "Payout History",   icon: History },
  { id: "analytics",        label: "Analytics",        icon: BarChart3 },
  { id: "settings",         label: "Settings",         icon: Settings },
  { id: "developer",        label: "Developer",        icon: Code },
];

// ─── Utility ─────────────────────────────────────────────────────────────────
const fmt = (n) => `৳${(n || 0).toLocaleString("en-BD", { maximumFractionDigits: 0 })}`;

// ─── Reusable UI Components ───────────────────────────────────────────────────
const StatCard = ({ title, value, icon: Icon, trend, color = PRIMARY, subtitle, loading }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-slate-800 border border-slate-700 rounded-xl p-4 hover:border-orange-500/40 transition-all"
  >
    <div className="flex items-start justify-between mb-3">
      <div className="p-2.5 rounded-lg" style={{ backgroundColor: color + "20" }}>
        <Icon size={18} style={{ color }} />
      </div>
      {trend !== undefined && (
        <span className={`text-xs font-medium flex items-center gap-1 ${trend >= 0 ? "text-emerald-400" : "text-red-400"}`}>
          {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    {loading ? (
      <div className="h-7 bg-slate-700 rounded animate-pulse mb-1" />
    ) : (
      <p className="text-xl font-bold text-white mb-0.5">{value}</p>
    )}
    <p className="text-xs text-slate-400">{title}</p>
    {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
  </motion.div>
);

const Badge = ({ status }) => {
  const map = {
    pending:    "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    confirmed:  "bg-blue-500/20 text-blue-400 border-blue-500/30",
    processing: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    shipped:    "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    delivered:  "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    cancelled:  "bg-red-500/20 text-red-400 border-red-500/30",
    paid:       "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    failed:     "bg-red-500/20 text-red-400 border-red-500/30",
    live:       "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    draft:      "bg-slate-500/20 text-slate-400 border-slate-500/30",
    active:     "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    inactive:   "bg-red-500/20 text-red-400 border-red-500/30",
    seller:     "bg-orange-500/20 text-orange-400 border-orange-500/30",
    admin:      "bg-purple-500/20 text-purple-400 border-purple-500/30",
    user:       "bg-slate-500/20 text-slate-400 border-slate-500/30",
    approved:   "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    rejected:   "bg-red-500/20 text-red-400 border-red-500/30",
    completed:  "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    expired:    "bg-slate-500/20 text-slate-400 border-slate-500/30",
    courier:    "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${map[status] || map.user}`}>
      {status}
    </span>
  );
};

const Modal = ({ open, onClose, title, children, size = "md" }) => {
  const sizes = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };
  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          className={`relative bg-slate-800 border border-slate-700 rounded-2xl w-full ${sizes[size]} max-h-[92vh] overflow-y-auto z-10`}
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0 }}
        >
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-700 sticky top-0 bg-slate-800 z-10">
            <h3 className="text-base sm:text-lg font-semibold text-white">{title}</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 transition-colors">
              <X size={16} />
            </button>
          </div>
          <div className="p-4 sm:p-5">{children}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const Input = ({ label, ...props }) => (
  <div>
    {label && <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">{label}</label>}
    <input
      {...props}
      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-500
        focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-all"
    />
  </div>
);

const Select = ({ label, children, ...props }) => (
  <div>
    {label && <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">{label}</label>}
    <select
      {...props}
      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm
        focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-all"
    >
      {children}
    </select>
  </div>
);

const TextArea = ({ label, ...props }) => (
  <div>
    {label && <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">{label}</label>}
    <textarea
      {...props}
      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-500
        focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-all resize-none"
    />
  </div>
);

const Btn = ({ children, variant = "primary", size = "md", loading, className = "", ...props }) => {
  const base = "inline-flex items-center justify-center gap-1.5 font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary:   "bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white shadow-lg shadow-orange-500/20",
    secondary: "bg-slate-700 hover:bg-slate-600 text-white border border-slate-600",
    danger:    "bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30",
    success:   "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30",
    ghost:     "hover:bg-slate-700/80 text-slate-400 hover:text-white",
    outline:   "border border-orange-500/50 text-orange-400 hover:bg-orange-500/10",
  };
  const sizes = { xs: "px-2 py-1 text-xs", sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm", lg: "px-5 py-2.5 text-base" };
  return (
    <button {...props} disabled={loading || props.disabled} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}>
      {loading && <Loader2 size={13} className="animate-spin" />}
      {children}
    </button>
  );
};

const SectionHeader = ({ title, actions }) => (
  <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">{title}</h2>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

const TableWrapper = ({ children }) => (
  <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
    <div className="overflow-x-auto">{children}</div>
  </div>
);

const Th = ({ children }) => (
  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{children}</th>
);
const Td = ({ children, className = "" }) => (
  <td className={`px-4 py-3 text-sm ${className}`}>{children}</td>
);

const EmptyRow = ({ cols, message = "No data found" }) => (
  <tr><td colSpan={cols} className="px-4 py-12 text-center text-slate-500 text-sm">{message}</td></tr>
);

const SkeletonRow = ({ cols }) => (
  <tr className="border-b border-slate-700/50">
    {Array(cols).fill(0).map((_, j) => (
      <td key={j} className="px-4 py-3"><div className="h-4 bg-slate-700/80 rounded animate-pulse" /></td>
    ))}
  </tr>
);

// ─── Search Bar ───────────────────────────────────────────────────────────────
const SearchBar = ({ value, onChange, placeholder = "Search..." }) => (
  <div className="relative">
    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-slate-500 w-44 sm:w-56 focus:outline-none focus:border-orange-500 transition-colors"
    />
  </div>
);

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
const AdminDashboard = () => {
  console.log("AdminDashboard rendering...");
  const { user: currentUser, logout } = useAuth();
  const { socket, on, off } = useSocket();
  const [activeTab, setActiveTab] = useState("overview");

  // ── Core Data ─────────────────────────────────────────────────────────────
  const [stats,        setStats]        = useState({});
  const [analytics,    setAnalytics]    = useState({});
  const [users,        setUsers]        = useState([]);
  const [products,     setProducts]     = useState([]);
  const [orders,       setOrders]       = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [withdrawals,  setWithdrawals]  = useState([]);
  const [configs,      setConfigs]      = useState({});
  const [coupons,      setCoupons]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [dateRange,    setDateRange]    = useState("30d");
  const [filterStatus, setFilterStatus] = useState("");
  const [searchQuery,  setSearchQuery]  = useState("");
  const [sidebarOpen,  setSidebarOpen]  = useState(false);


  // ── Developer Section ─────────────────────────────────────────────────────
  const [categories,  setCategories]  = useState([]);
  const [slides,      setSlides]      = useState([]);
  const [apiKeys,     setApiKeys]     = useState([]);
  const [webhooks,    setWebhooks]    = useState([]);
  const [hotlines,    setHotlines]    = useState([]);
  const [marquee,     setMarquee]     = useState({ text: "", isActive: true });
  const [headerHistory, setHeaderHistory] = useState([]);


  // ── Messenger ─────────────────────────────────────────────────────────────
  const [chats,        setChats]        = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [newMessage,   setNewMessage]   = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const chatEndRef = useRef(null);

  // ── Seller Requests ───────────────────────────────────────────────────────
  const [sellerRequests, setSellerRequests] = useState([]);
  
  // ── User Details View ─────────────────────────────────────────────────────


  // ── Modals ────────────────────────────────────────────────────────────────
  const [modals, setModals] = useState({
    orderDetail: false, editOrder: false,
    addProduct: false, editProduct: false,
    addTransaction: false, editUser: false,
    backup: false, coupon: false,
    addCategory: false, editCategory: false,
    addSlide: false, editSlide: false,
    sellerChat: false, profile: false,
  });
  const [selectedItem, setSelectedItem] = useState(null);

  // ── Forms ─────────────────────────────────────────────────────────────────
  const [orderForm, setOrderForm] = useState({ status: "", paymentStatus: "", trackingNumber: "", courier: "", adminNotes: "" });
  const [productForm, setProductForm] = useState({ name: "", sellingPrice: "", purchasePrice: "", description: "", category: "General", image: "", stock: 0, unit: "পিস", liveStatus: "live", brand: "", sku: "" });
  const [transactionForm, setTransactionForm] = useState({ type: "Cash In", amount: "", description: "", category: "sales", paymentMethod: "Cash" });
  const [userForm, setUserForm] = useState({ role: "user", isActive: true, isSellerApproved: false });
  const [couponForm, setCouponForm] = useState({ code: "", discountType: "percentage", discountValue: 0, minPurchase: 0, maxDiscount: 0, endDate: "", usageLimit: 0, isActive: true });
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ name: "", image: null, imagePreview: "" });
  const [slideForm, setSlideForm] = useState({ title: "", image: null, imagePreview: "", link: "", order: 0 });
  const [hotlineForm, setHotlineForm] = useState({ number: "", label: "" });
  const [marqueeForm, setMarqueeForm] = useState({ text: "", isActive: true });
  const [backupState, setBackupState] = useState({ loading: false, token: "" });
  const [newApiKeyName, setNewApiKeyName] = useState("");
  const [newWebhook, setNewWebhook] = useState({ event: "", url: "" });

  const [viewingUser, setViewingUser] = useState(null);
  const [viewingOrders, setViewingOrders] = useState([]);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);

  // ── Open / Close Modal ────────────────────────────────────────────────────
  const openModal = (name, item = null) => {
    setSelectedItem(item);
    if (item && name === "editOrder") setOrderForm({ status: item.status || "", paymentStatus: item.paymentStatus || "", trackingNumber: item.trackingNumber || "", courier: item.courier || "", adminNotes: item.adminNotes || "" });
    if (item && name === "editUser")  setUserForm({ role: item.role, isActive: item.isActive, isSellerApproved: item.isSellerApproved });
    if (item && name === "editProduct") setProductForm({ ...item });
    if (item && name === "editCategory") setCategoryForm({ name: item.name, image: null, imagePreview: item.image || "" });
    if (item && name === "editSlide") setSlideForm({ title: item.title || "", image: null, imagePreview: item.image || "", link: item.link || "", order: item.order || 0 });
    setModals(p => ({ ...p, [name]: true }));
  };
  const closeModal = (name) => setModals(p => ({ ...p, [name]: false }));

  // ── Fetch All Data ────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const safe = (promise) => promise.catch(() => ({ data: {} }));

      // Common requirements for sidebar badges and basic stats
      const reqs = {
        stats: safe(adminAPI.getStats({ period: dateRange })),
        sellerReqs: safe(adminAPI.getSellerRequests?.({ limit: 100 }) ?? Promise.resolve({ data: {} })),
        chats: safe(chatAPI.getChats?.({ limit: 100 }) ?? Promise.resolve({ data: {} }))
      };

      // Tab-specific requirements
      if (activeTab === "users" || activeTab === "chats") {
        reqs.users = safe(adminAPI.getUsers({ limit: 200 }));
      } else if (activeTab === "inventory") {
        reqs.products = safe(adminAPI.getProducts({ limit: 500 }));
      } else if (activeTab === "orders" || activeTab === "payments") {
        reqs.orders = safe(adminAPI.getOrders({ limit: 200, status: filterStatus || undefined }));
      } else if (activeTab === "cashbox") {
        reqs.transactions = safe(adminAPI.getTransactions({ limit: 200 }));
      } else if (activeTab === "withdrawals" || activeTab === "payouts") {
        reqs.withdrawals = safe(adminAPI.getWithdrawals({ status: "all", limit: 200 }));
      } else if (activeTab === "analytics") {
        reqs.analytics = safe(adminAPI.getAnalytics({ period: dateRange }));
      } else if (activeTab === "settings") {
        reqs.config = safe(adminAPI.getConfig());
        reqs.coupons = safe(adminAPI.getCoupons());
      } else if (activeTab === "developer") {
        reqs.categories = safe(adminAPI.getCategories?.() ?? Promise.resolve({ data: {} }));
        reqs.slides = safe(adminAPI.getSlides?.() ?? Promise.resolve({ data: {} }));
        reqs.apiKeys = safe(adminAPI.getApiKeys?.() ?? Promise.resolve({ data: {} }));
        reqs.webhooks = safe(adminAPI.getWebhooks?.() ?? Promise.resolve({ data: {} }));
        reqs.hotlines = safe(adminAPI.getHotlines?.() ?? Promise.resolve({ data: {} }));
        reqs.marquee = safe(adminAPI.getMarquee?.() ?? Promise.resolve({ data: {} }));
        reqs.headerHistory = safe(adminAPI.getHeaderHistory?.() ?? Promise.resolve({ data: {} }));
      } else if (activeTab === "overview") {
        reqs.products = safe(adminAPI.getProducts({ limit: 10 }));
        reqs.orders = safe(adminAPI.getOrders({ limit: 10 }));
      }

      const keys = Object.keys(reqs);
      const results = await Promise.all(Object.values(reqs));
      const res = {};
      keys.forEach((key, i) => { res[key] = results[i].data; });

      if (res.stats?.stats) setStats(res.stats.stats);
      if (res.users?.users) setUsers(res.users.users);
      if (res.products?.products) setProducts(res.products.products);
      if (res.orders?.orders) setOrders(res.orders.orders);
      if (res.transactions?.transactions) setTransactions(res.transactions.transactions);
      if (res.withdrawals?.withdrawals) setWithdrawals(res.withdrawals.withdrawals);
      if (res.config?.configs) setConfigs(res.config.configs);
      if (res.coupons?.coupons) setCoupons(res.coupons.coupons);
      if (res.sellerReqs?.users) setSellerRequests(res.sellerReqs.users);
      else if (res.sellerReqs?.sellerRequests) setSellerRequests(res.sellerReqs.sellerRequests);
      if (res.chats?.chats) {
        setChats(res.chats.chats);
        
        // If we have a selected chat, refresh its data from the new list
        if (selectedChat) {
          const updated = res.chats.chats.find(c => c._id === selectedChat._id);
          if (updated) setSelectedChat(updated);
        }
      }
      if (res.analytics?.analytics) setAnalytics(res.analytics.analytics);
      if (res.categories?.categories) setCategories(res.categories.categories);
      if (res.slides?.slides) setSlides(res.slides.slides);
      if (res.apiKeys?.apiKeys) setApiKeys(res.apiKeys.apiKeys);
      if (res.webhooks?.webhooks) setWebhooks(res.webhooks.webhooks);
      if (res.hotlines?.hotlines) setHotlines(res.hotlines.hotlines);
      if (res.headerHistory?.history) setHeaderHistory(res.headerHistory.history);
      if (res.marquee?.marquee) {
        const m = res.marquee.marquee;
        setMarquee(m);
        setMarqueeForm({ text: m.text || "", isActive: m.isActive ?? true });
      }
    } catch (err) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [activeTab, dateRange, filterStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Export Utilities ──────────────────────────────────────────────────────
  const exportToExcel = (data, fileName) => {
    if (!data?.length) return toast.error("No data to export");
    try {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
      XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success("Excel exported!");
    } catch { toast.error("Export failed"); }
  };

  const exportToPDF = (data, fileName, title, columns) => {
    if (!data?.length) return toast.error("No data to export");
    try {
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
        alternateRowStyles: { fillColor: [248, 250, 252] },
      });
      doc.save(`${fileName}_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success("PDF exported!");
    } catch { toast.error("PDF export failed"); }
  };

  // ── Computed & Filters ──────────────────────────────────────────────────

  const filteredOrders   = orders.filter(o => !searchQuery || o.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) || o.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredUsers    = users.filter(u => !searchQuery || u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredProducts = products.filter(p => !searchQuery || p.name?.toLowerCase().includes(searchQuery.toLowerCase()));

  const cashIn      = transactions.filter(t => t.type === "Cash In").reduce((s, t) => s + (t.amount || 0), 0);
  const cashOut     = transactions.filter(t => t.type === "Cash Out").reduce((s, t) => s + (t.amount || 0), 0);
  const cashBalance = cashIn - cashOut;

  const scrollToChatBottom = () => {

    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Socket listeners for real-time chat
  useEffect(() => {
    if (!on || !socket) return;

    const handleNewMessage = (data) => {
      // Update the chats list (last message, unread count, etc.)
      setChats(prev => {
        const index = prev.findIndex(c => c._id === data.chatId);
        if (index === -1) {
          // If chat not in list, we might need to re-fetch or ignore
          fetchData();
          return prev;
        }
        const updated = [...prev];
        const chat = { ...updated[index] };
        chat.lastMessage = data.message.message;
        chat.messages = [...(chat.messages || []), data.message];
        chat.updatedAt = new Date();
        // If not the selected chat, increment unread locally
        if (!selectedChat || selectedChat._id !== data.chatId) {
          chat.unreadCount = (chat.unreadCount || 0) + 1;
        }
        updated.splice(index, 1);
        return [chat, ...updated];
      });

      // Update active chat window if it's the one receiving the message
      if (selectedChat && selectedChat._id === data.chatId) {
        setSelectedChat(prev => {
           if (!prev) return prev;
           if (prev.messages && prev.messages.some(m => m._id === data.message._id)) return prev;
           return {
             ...prev,
             messages: [...(prev.messages || []), data.message]
           };
        });
        setTimeout(scrollToChatBottom, 100);
      }
    };

    on('new_message', handleNewMessage);
    on('message_notification', (data) => {
       // Optional: show a toast or highlight the sidebar
       if (!selectedChat || selectedChat._id !== data.chatId) {
         toast(`New message from ${data.senderName}`, { icon: '💬' });
       }
    });

    return () => {
      off('new_message', handleNewMessage);
      off('message_notification');
    };
  }, [on, off, socket, selectedChat?._id]);


  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  const handleUserSearch = async (val) => {
    setUserSearch(val);
    if (!val.trim()) { setUserSearchResults([]); return; }
    setIsSearchingUser(true);
    try {
      const res = await adminAPI.getUsers({ search: val, limit: 10 });
      setUserSearchResults(res.data.users || []);
    } catch {
       // Silent error to prevent toast spam during typing
    } finally {
      setIsSearchingUser(false);
    }
  };

  const startChatWithUser = async (user) => {
    try {
       const res = await chatAPI.getChatWithUser(user._id);
       if (res.data.chat) {
         setSelectedChat(res.data.chat);
         if (!chats.find(c => c._id === res.data.chat._id)) {
            setChats(prev => [res.data.chat, ...prev]);
         }
       } else {
         // Start a new chat locally
         setSelectedChat({
           _id: null,
           user: user,
           seller: user, // Set as both fallback
           messages: [],
           participants: [currentUser.id || currentUser._id, user._id]
         });
       }
       // If on mobile, might need different behavior, but for now just clear search
       setUserSearch("");
       setUserSearchResults([]);
    } catch (err) {
       toast.error("Failed to load chat with user");
    }
  };

  const handleUpdateOrder = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.updateOrder(selectedItem._id, orderForm);
      toast.success("Order updated successfully");
      closeModal("editOrder");
      fetchData();
    } catch { toast.error("Failed to update order"); }
  };

  const handleConfirmPayment = async (orderId) => {
    try {
      await adminAPI.confirmOrderPayment(orderId);
      toast.success("Payment verified! Order is now visible to sellers.");
      fetchData();
    } catch (e) { toast.error(e?.response?.data?.message || "Failed to confirm payment"); }
  };

  const handleFailPayment = async (orderId) => {
    if (!confirm("Are you sure you want to mark this payment as failed?")) return;
    try {
      await adminAPI.failOrderPayment(orderId);
      toast.success("Payment marked as failed.");
      fetchData();
    } catch (e) { toast.error(e?.response?.data?.message || "Failed to mark payment as failed"); }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.createTransaction(transactionForm);
      toast.success("Transaction recorded");
      closeModal("addTransaction");
      setTransactionForm({ type: "Cash In", amount: "", description: "", category: "sales", paymentMethod: "Cash" });
      fetchData();
    } catch { toast.error("Failed to add transaction"); }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      const data = { ...productForm, price: productForm.sellingPrice };
      if (selectedItem?._id) {
        await adminAPI.updateProduct(selectedItem._id, data);
        toast.success("Product updated");
        closeModal("editProduct");
      } else {
        await adminAPI.createProduct(data);
        toast.success("Product created");
        closeModal("addProduct");
      }
      setProductForm({ name: "", sellingPrice: "", purchasePrice: "", description: "", category: "General", image: "", stock: 0, unit: "পিস", liveStatus: "live", brand: "", sku: "" });
      fetchData();
    } catch (e) { toast.error(e?.response?.data?.message || "Failed to save product"); }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm("Permanently delete this product?")) return;
    try { await adminAPI.deleteProduct(id); toast.success("Product deleted"); fetchData(); }
    catch { toast.error("Failed to delete product"); }
  };

  const handleViewUser = async (userId) => {
    setLoadingUserDetails(true);
    try {
      const { data } = await adminAPI.getUserDetails(userId);
      if (data.success) {
        setViewingUser(data.user);
        setViewingOrders(data.orders);
        openModal("viewUserDetails");
      }
    } catch {
      toast.error("Failed to load user details");
    } finally {
      setLoadingUserDetails(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try { await adminAPI.updateUser(selectedItem._id, userForm); toast.success("User updated"); closeModal("editUser"); fetchData(); }
    catch { toast.error("Failed to update user"); }
  };

  const handleApproveSeller = async (id, approved) => {
    try { await adminAPI.approveSeller(id, { approved }); toast.success(approved ? "Seller approved!" : "Request rejected"); fetchData(); }
    catch { toast.error("Failed to update seller status"); }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm("Deactivate this user?")) return;
    try { await adminAPI.deleteUser(id); toast.success("User deactivated"); fetchData(); }
    catch { toast.error("Failed to deactivate user"); }
  };

  const handleUpdateWithdrawal = async (id, status) => {
    try {
      const adminNote   = prompt("Admin note (optional):") || "";
      const transactionId = status === "approved" ? (prompt("Transaction / Reference ID:") || "") : "";
      await adminAPI.updateWithdrawal(id, { status, adminNote, transactionId });
      toast.success(`Withdrawal ${status}`);
      fetchData();
    } catch { toast.error("Failed to update withdrawal"); }
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    try {
      if (editingCoupon) { await adminAPI.updateCoupon(editingCoupon._id, couponForm); toast.success("Coupon updated"); }
      else { await adminAPI.createCoupon(couponForm); toast.success("Coupon created"); }
      closeModal("coupon"); setEditingCoupon(null); fetchData();
    } catch (e) { toast.error(e?.response?.data?.message || "Failed to save coupon"); }
  };

  const handleDeleteCoupon = async (id) => {
    if (!confirm("Delete this coupon?")) return;
    try { await adminAPI.deleteCoupon(id); toast.success("Coupon deleted"); fetchData(); }
    catch { toast.error("Failed to delete coupon"); }
  };

  const handleUpdateSpecificConfig = async (key, value) => {
    try { await adminAPI.updateConfig({ key, value }); toast.success("Saved"); fetchData(); }
    catch { toast.error("Failed to save config"); }
  };

  const handleSaveAllConfigs = async (keys) => {
    try {
      for (const k of keys) {
        const value = configs[k] !== undefined && configs[k] !== null ? configs[k] : "";
        await adminAPI.updateConfig({ key: k, value });
      }
      toast.success("Settings saved");
      fetchData();
    } catch (error) { toast.error("Failed to save settings"); }
  };

  const handleUpdateHeaderContent = async () => {
    try {
      await adminAPI.updateHeaderContent({ 
        hotline: configs.header_hotline || "", 
        notice: configs.header_notice || "" 
      });
      toast.success("Header content updated and history saved");
      fetchData();
    } catch {
      toast.error("Failed to update header content");
    }
  };

  const handleSendReply = async () => {
    if (!newMessage.trim() || !selectedChat) return;
    try {
      const payload = selectedChat._id 
        ? { chatId: selectedChat._id, message: newMessage }
        : { receiverId: selectedChat.user?._id || selectedChat.seller?._id, message: newMessage };
        
      const res = await chatAPI.sendMessage(payload);
      if (res.data.success) {
        setNewMessage("");
        if (res.data.chat) {
          setSelectedChat(res.data.chat);
        }
        fetchData();
      }
    } catch { toast.error("Failed to send reply"); }
  };

  // Category
  const handleSaveCategory = async (e, isEdit = false) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      fd.append("name", categoryForm.name);
      if (categoryForm.image) fd.append("image", categoryForm.image);
      if (isEdit) { await adminAPI.updateCategory(selectedItem._id, fd); toast.success("Category updated"); closeModal("editCategory"); }
      else { await adminAPI.createCategory(fd); toast.success("Category added"); closeModal("addCategory"); }
      setCategoryForm({ name: "", image: null, imagePreview: "" });
      fetchData();
    } catch (e) { toast.error(e?.response?.data?.message || "Failed"); }
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm("Delete category?")) return;
    try { await adminAPI.deleteCategory(id); toast.success("Category deleted"); fetchData(); }
    catch { toast.error("Failed"); }
  };

  // Slides
  const handleSaveSlide = async (e, isEdit = false) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      fd.append("title", slideForm.title);
      if (slideForm.image) fd.append("image", slideForm.image);
      fd.append("link", slideForm.link || "");
      fd.append("order", slideForm.order || 0);
      if (isEdit) { await adminAPI.updateSlide(selectedItem._id, fd); toast.success("Slide updated"); closeModal("editSlide"); }
      else { await adminAPI.createSlide(fd); toast.success("Slide added"); closeModal("addSlide"); }
      setSlideForm({ title: "", image: null, imagePreview: "", link: "", order: 0 });
      fetchData();
    } catch (e) { toast.error(e?.response?.data?.message || "Failed"); }
  };

  const handleDeleteSlide = async (id) => {
    if (!confirm("Delete slide?")) return;
    try { await adminAPI.deleteSlide(id); toast.success("Slide deleted"); fetchData(); }
    catch { toast.error("Failed"); }
  };

  // Hotline
  const handleAddHotline = async () => {
    if (!hotlineForm.number) return toast.error("Enter a phone number");
    try { await adminAPI.createHotline(hotlineForm); toast.success("Hotline added"); setHotlineForm({ number: "", label: "" }); fetchData(); }
    catch { toast.error("Failed to add hotline"); }
  };

  const handleDeleteHotline = async (id) => {
    if (!confirm("Remove hotline?")) return;
    try { await adminAPI.deleteHotline(id); toast.success("Removed"); fetchData(); }
    catch { toast.error("Failed"); }
  };

  const handleUpdateMarquee = async () => {
    try { await adminAPI.updateMarquee(marqueeForm); toast.success("Marquee updated"); fetchData(); }
    catch { toast.error("Failed to update marquee"); }
  };

  const handleGoogleDriveBackup = async () => {
    if (!backupState.token) {
      try {
        const res = await adminAPI.googleDriveAuth();
        window.open(res.data.authUrl, "_blank", "width=500,height=600");
        toast("Authorize Google Drive, then paste your access token below", { icon: "🔗" });
      } catch { toast.error("Google Drive auth failed"); }
      return;
    }
    setBackupState(p => ({ ...p, loading: true }));
    try {
      const res = await adminAPI.backupToGoogleDrive({ accessToken: backupState.token, backupType: "all" });
      toast.success(`Backup uploaded: ${res.data.fileName}`);
      closeModal("backup");
    } catch { toast.error("Backup failed"); }
    finally { setBackupState(p => ({ ...p, loading: false })); }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // SIDEBAR NAV
  // ═══════════════════════════════════════════════════════════════════════════
  const Sidebar = () => (
    <>
      {/* Overlay for mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={`fixed top-0 left-0 h-full w-64 bg-slate-900 border-r border-slate-700/80 z-50 flex flex-col shadow-2xl
          lg:translate-x-0 transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="p-5 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Store size={18} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white text-sm leading-tight">Devaroti</h1>
              <p className="text-[10px] text-orange-400 font-medium uppercase tracking-widest">Admin Panel</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700">
            <X size={16} />
          </button>
        </div>

        {/* Admin badge */}
        <div className="px-4 py-3 border-b border-slate-700/50">
          <button onClick={() => openModal("profile")} className="w-full flex items-center gap-2.5 bg-slate-800 rounded-xl p-2.5 hover:bg-slate-700 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-xs font-bold">
              {currentUser?.name?.[0] || "A"}
            </div>
            <div className="min-w-0 text-left">
              <p className="text-white text-xs font-semibold truncate">{currentUser?.name || "Admin"}</p>
              <p className="text-[10px] text-slate-400 truncate">{currentUser?.email || ""}</p>
            </div>
            <Badge status="admin" />
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); setSearchQuery(""); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group
                  ${isActive
                    ? "bg-orange-500/15 text-orange-400 border border-orange-500/25"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent"
                  }`}
              >
                <tab.icon size={15} className={isActive ? "text-orange-400" : "text-slate-500 group-hover:text-white"} />
                <span>{tab.label}</span>
                {tab.id === "chats" && chats.length > 0 && (
                  <span className="ml-auto bg-orange-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none">
                    {chats.filter(c => c.unreadCount > 0).length || ""}
                  </span>
                )}
                {tab.id === "sellerRequests" && sellerRequests.length > 0 && (
                  <span className="ml-auto bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none">
                    {sellerRequests.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-700/80 space-y-2">
          <div className="flex gap-2">
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
              className="flex-1 bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-orange-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <Btn size="xs" variant="secondary" onClick={fetchData} disabled={loading}>
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            </Btn>
          </div>
          <Btn size="sm" variant="secondary" className="w-full" onClick={() => openModal("backup")}>
            <CloudUpload size={13} /> Drive Backup
          </Btn>
        </div>
      </motion.aside>
    </>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // TOP BAR (mobile)
  // ═══════════════════════════════════════════════════════════════════════════
  const TopBar = () => (
    <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/80 flex items-center justify-between px-4 py-3">
      <button onClick={() => setSidebarOpen(true)} className="text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 transition-colors">
        <Menu size={20} />
      </button>
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center">
          <Store size={15} className="text-white" />
        </div>
        <span className="font-bold text-white text-sm">Devaroti Admin</span>
      </div>
      <Btn size="xs" variant="ghost" onClick={fetchData} disabled={loading}>
        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
      </Btn>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER TABS
  // ═══════════════════════════════════════════════════════════════════════════

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard title="Total Users"     value={stats.totalUsers  || 0}      icon={Users}       color="#0ea5e9" loading={loading} />
        <StatCard title="Products"        value={stats.totalProducts || 0}     icon={Package}     color="#10b981" loading={loading} />
        <StatCard title="Total Orders"    value={stats.totalOrders || 0}       icon={ShoppingCart} color={PRIMARY} loading={loading} />
        <StatCard title="Total Sales"     value={fmt(stats.totalSales)}        icon={ShoppingBag} color="#f59e0b" loading={loading} />
        <StatCard title="Platform Rev."   value={fmt(stats.totalRevenue)}      icon={TrendingUp}  color="#8b5cf6" loading={loading} />
        <StatCard title="Pending Orders"  value={stats.pendingOrders || 0}     icon={Clock}       color="#ef4444" loading={loading} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white text-sm">Monthly Sales Overview</h3>
            <Btn size="xs" variant="ghost" onClick={() => exportToExcel(stats.monthlySales || [], "monthly_sales")}>
              <FileSpreadsheet size={12} /> Export
            </Btn>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <ComposedChart data={stats.monthlySales || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="_id" tick={{ fontSize: 10, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 10 }} labelStyle={{ color: "#f1f5f9" }} formatter={v => [`৳${(v || 0).toLocaleString()}`, ""]} />
              <Legend />
              <Bar dataKey="total" fill={PRIMARY} name="Sales (৳)" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="orders" stroke="#0ea5e9" strokeWidth={2} name="Orders" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <h3 className="font-semibold text-white text-sm mb-4">Category Split</h3>
          <ResponsiveContainer width="100%" height={210}>
            <PieChart>
              <Pie data={(stats.categoryStats || []).slice(0, 6)} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {(stats.categoryStats || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-white text-sm">Recent Orders</h3>
            <Btn size="xs" variant="ghost" onClick={() => setActiveTab("orders")}><ArrowUpRight size={12} /> All</Btn>
          </div>
          <div className="space-y-1.5">
            {(stats.recentOrders || []).slice(0, 5).map(order => (
              <div key={order._id} className="flex items-center justify-between py-2 border-b border-slate-700/50">
                <div>
                  <p className="text-sm font-medium text-white">{order.orderNumber}</p>
                  <p className="text-xs text-slate-500">{order.user?.name} · {new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-orange-400">{fmt(order.totalPrice)}</p>
                  <Badge status={order.status} />
                </div>
              </div>
            ))}
            {!(stats.recentOrders?.length) && <p className="text-slate-500 text-xs py-4 text-center">No recent orders</p>}
          </div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-white text-sm flex items-center gap-1.5"><AlertCircle size={14} className="text-yellow-400" /> Low Stock Alert</h3>
            <Btn size="xs" variant="ghost" onClick={() => setActiveTab("inventory")}><ArrowUpRight size={12} /> Inventory</Btn>
          </div>
          <div className="space-y-1.5">
            {(stats.lowStockProducts || []).slice(0, 5).map(p => (
              <div key={p._id} className="flex items-center justify-between py-2 border-b border-slate-700/50">
                <div className="flex items-center gap-2">
                  {p.image && <img src={p.image} className="w-8 h-8 rounded-lg object-cover border border-slate-700" alt="" />}
                  <div>
                    <p className="text-sm text-white">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.user?.shopName || p.user?.name}</p>
                  </div>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${p.stock === 0 ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                  {p.stock === 0 ? "Out" : `${p.stock} left`}
                </span>
              </div>
            ))}
            {!(stats.lowStockProducts?.length) && <p className="text-slate-500 text-xs py-4 text-center">All stock levels healthy ✓</p>}
          </div>
        </div>
      </div>
    </div>
  );

  const renderOrders = () => (
    <div className="space-y-4">
      <SectionHeader
        title="Order Management"
        actions={<>
          <SearchBar value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search orders..." />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500">
            <option value="">All Status</option>
            {["pending","confirmed","processing","shipped","delivered","cancelled"].map(s => <option key={s}>{s}</option>)}
          </select>
          <Btn size="sm" variant="secondary" onClick={() => exportToExcel(filteredOrders.map(o => ({ OrderNo: o.orderNumber, Customer: o.user?.name, Total: o.totalPrice, Status: o.status, Payment: o.paymentStatus, Date: new Date(o.createdAt).toLocaleDateString() })), "orders")}>
            <FileSpreadsheet size={12} /> Excel
          </Btn>
          <Btn size="sm" variant="secondary" onClick={() => exportToPDF(filteredOrders, "orders", "Orders Report", [
            { header: "Order #",   accessor: r => r.orderNumber },
            { header: "Customer",  accessor: r => r.user?.name },
            { header: "Total",     accessor: r => `৳${r.totalPrice}` },
            { header: "Status",    accessor: r => r.status },
            { header: "Date",      accessor: r => new Date(r.createdAt).toLocaleDateString() },
          ])}>
            <Printer size={12} /> PDF
          </Btn>
        </>}
      />
      <TableWrapper>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-900/60">
              {["Order #","Customer","Items","Total","Payment","Global Status","Seller Status","Date & Time","Actions"].map(h => <Th key={h}>{h}</Th>)}
            </tr>
          </thead>
          <tbody>
            {loading ? Array(5).fill(0).map((_, i) => <SkeletonRow key={i} cols={8} />) :
              filteredOrders.length === 0 ? <EmptyRow cols={8} message="No orders found" /> :
              filteredOrders.map(order => (
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
                    <div className="flex flex-col gap-1">
                      {order.sellers?.length > 0 ? order.sellers.map((s, si) => (
                        <div key={si} className="flex items-center gap-1.5 whitespace-nowrap">
                          <span className="text-[10px] text-slate-400 max-w-[70px] truncate" title={s.sellerId?.shopName || s.sellerId?.name || 'Seller'}>
                            {s.sellerId?.shopName || s.sellerId?.name || 'Seller'}
                          </span>
                          <Badge status={s.status || order.status} />
                        </div>
                      )) : (
                        <span className="text-slate-600 text-[10px]">—</span>
                      )}
                    </div>
                  </Td>
                  <Td className="text-slate-500 text-xs">{new Date(order.createdAt).toLocaleString()}</Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <Btn size="xs" variant="ghost" onClick={() => openModal("orderDetail", order)}><Eye size={12} /></Btn>
                      <Btn size="xs" variant="ghost" onClick={() => openModal("editOrder", order)}><Edit size={12} /></Btn>
                    </div>
                  </Td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </TableWrapper>
    </div>
  );

  const renderPayments = () => {
    const unverified = orders.filter(o => !o.adminConfirmedPayment && o.paymentStatus !== 'failed');
    const paymentHistory = orders.filter(o => o.adminConfirmedPayment || o.paymentStatus === 'failed');

    return (
      <div className="space-y-8">
        <div className="space-y-4">
          <SectionHeader title="Payment Verification" />
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 flex items-start gap-3">
            <Shield size={20} className="text-orange-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-orange-400 font-semibold text-sm">Security Protocol Active</p>
              <p className="text-slate-400 text-xs mt-0.5">Sellers only see orders AFTER admin payment confirmation. Verify transaction IDs before approving.</p>
            </div>
          </div>
          <TableWrapper>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-900/60">
                  {["Order #","Customer","Method","Transaction ID","Amount","Payment Status","Date & Time","Action"].map(h => <Th key={h}>{h}</Th>)}
                </tr>
              </thead>
              <tbody>
                {unverified.length === 0
                  ? <EmptyRow cols={8} message="✓ All payments are verified" />
                  : unverified.map(order => (
                      <tr key={order._id} className="border-b border-slate-700/40 hover:bg-slate-700/25 transition-colors">
                        <Td><span className="font-mono text-orange-400 text-xs font-bold">{order.orderNumber}</span></Td>
                        <Td className="text-white">{order.user?.name}</Td>
                        <Td><span className="uppercase text-xs font-bold text-slate-300 bg-slate-700 px-2 py-0.5 rounded">{order.paymentMethod}</span></Td>
                        <Td><span className="font-mono text-cyan-400 font-bold text-xs">{order.paymentDetails?.transactionId || "—"}</span></Td>
                        <Td><span className="font-bold text-white">{fmt(order.totalPrice)}</span></Td>
                        <Td><Badge status={order.paymentStatus} /></Td>
                        <Td className="text-slate-500 text-xs">{new Date(order.createdAt).toLocaleString()}</Td>
                        <Td>
                          <div className="flex items-center gap-2">
                            <Btn size="sm" variant="success" onClick={() => handleConfirmPayment(order._id)}>
                              <Check size={13} /> Verify
                            </Btn>
                            <Btn size="sm" variant="danger" onClick={() => handleFailPayment(order._id)}>
                              <X size={13} /> Failed
                            </Btn>
                          </div>
                        </Td>
                      </tr>
                    ))
                }
              </tbody>
            </table>
          </TableWrapper>
        </div>

        <div className="space-y-4">
          <SectionHeader title="Payment History" />
          <TableWrapper>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-900/60">
                  {["Order #","Customer","Method","Transaction ID","Amount","Payment Status","Date & Time"].map(h => <Th key={h}>{h}</Th>)}
                </tr>
              </thead>
              <tbody>
                {paymentHistory.length === 0
                  ? <EmptyRow cols={7} message="No payment history found" />
                  : paymentHistory.map(order => (
                      <tr key={order._id} className="border-b border-slate-700/40 hover:bg-slate-700/25 transition-colors">
                        <Td><span className="font-mono text-orange-400 text-xs font-bold">{order.orderNumber}</span></Td>
                        <Td className="text-white">{order.user?.name}</Td>
                        <Td><span className="uppercase text-xs font-bold text-slate-300 bg-slate-700 px-2 py-0.5 rounded">{order.paymentMethod}</span></Td>
                        <Td><span className="font-mono text-cyan-400 font-bold text-xs">{order.paymentDetails?.transactionId || "—"}</span></Td>
                        <Td><span className="font-bold text-white">{fmt(order.totalPrice)}</span></Td>
                        <Td><Badge status={order.paymentStatus} /></Td>
                        <Td className="text-slate-500 text-xs">{new Date(order.createdAt).toLocaleString()}</Td>
                      </tr>
                    ))
                }
              </tbody>
            </table>
          </TableWrapper>
        </div>
      </div>
    );
  };

  const renderInventory = () => (
    <div className="space-y-4">
      <SectionHeader
        title="Inventory Management"
        actions={<>
          <SearchBar value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search products..." />
          <Btn size="sm" variant="secondary" onClick={() => exportToExcel(filteredProducts.map(p => ({ Name: p.name, Category: p.category, Stock: p.stock, Sell: p.sellingPrice, Buy: p.purchasePrice, Status: p.liveStatus })), "inventory")}>
            <FileSpreadsheet size={12} /> Excel
          </Btn>
          <Btn size="sm" onClick={() => openModal("addProduct")}><Plus size={12} /> Add Product</Btn>
        </>}
      />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard title="Total Products"   value={products.length}                                           icon={Package}    color="#0ea5e9" />
        <StatCard title="Low Stock"        value={products.filter(p => p.stock > 0 && p.stock <= 5).length} icon={AlertCircle} color="#f59e0b" />
        <StatCard title="Out of Stock"     value={products.filter(p => p.stock === 0).length}               icon={XCircle}    color="#ef4444" />
        <StatCard title="Stock Value"      value={fmt(products.reduce((s, p) => s + ((p.purchasePrice || 0) * (p.stock || 0)), 0))} icon={Banknote} color="#10b981" />
      </div>
      <TableWrapper>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-900/60">
              {["Product","Category","Stock","Buy","Sell","Status","Seller","Actions"].map(h => <Th key={h}>{h}</Th>)}
            </tr>
          </thead>
          <tbody>
            {loading ? Array(5).fill(0).map((_, i) => <SkeletonRow key={i} cols={8} />) :
              filteredProducts.map(p => (
                <tr key={p._id} className="border-b border-slate-700/40 hover:bg-slate-700/25 transition-colors">
                  <Td>
                    <div className="flex items-center gap-3">
                      {p.image && <img src={p.image} className="w-9 h-9 rounded-lg object-cover border border-slate-700" alt="" />}
                      <div>
                        <p className="text-white font-medium text-sm leading-tight">{p.name}</p>
                        <p className="text-xs text-slate-500">{p.sku || "—"}</p>
                      </div>
                    </div>
                  </Td>
                  <Td className="text-slate-400 text-xs">{p.category}</Td>
                  <Td>
                    <span className={`font-bold ${p.stock === 0 ? "text-red-400" : p.stock <= 5 ? "text-yellow-400" : "text-emerald-400"}`}>
                      {p.stock}
                    </span>
                    <span className="text-xs text-slate-600 ml-1">{p.unit}</span>
                  </Td>
                  <Td className="text-slate-400 text-xs">{fmt(p.purchasePrice)}</Td>
                  <Td className="font-semibold text-white">{fmt(p.sellingPrice)}</Td>
                  <Td><Badge status={p.liveStatus} /></Td>
                  <Td className="text-slate-500 text-xs">{p.user?.shopName || p.user?.name || "—"}</Td>
                  <Td>
                    <div className="flex gap-1">
                      <Btn size="xs" variant="ghost" onClick={() => openModal("editProduct", p)}><Edit size={12} /></Btn>
                      <Btn size="xs" variant="danger" onClick={() => handleDeleteProduct(p._id)}><Trash2 size={12} /></Btn>
                    </div>
                  </Td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </TableWrapper>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-4">
      <SectionHeader
        title="User Management"
        actions={<>
          <SearchBar value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search users..." />
          <Btn size="sm" variant="secondary" onClick={() => exportToExcel(filteredUsers.map(u => ({ Name: u.name, Email: u.email, Phone: u.phoneNumber, Role: u.role, Active: u.isActive, Joined: new Date(u.createdAt).toLocaleDateString() })), "users")}>
            <FileSpreadsheet size={12} /> Excel
          </Btn>
        </>}
      />
      <TableWrapper>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-900/60">
              {["User","Phone","Role","Status","Verified","Joined","Actions"].map(h => <Th key={h}>{h}</Th>)}
            </tr>
          </thead>
          <tbody>
            {loading ? Array(5).fill(0).map((_, i) => <SkeletonRow key={i} cols={7} />) :
              filteredUsers.map(u => (
                <tr key={u._id} className="border-b border-slate-700/40 hover:bg-slate-700/25 transition-colors">
                  <Td>
                    <div className="flex items-center gap-3">
                      <img src={u.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || "U")}&background=1e293b&color=ff5500`}
                        className="w-8 h-8 rounded-full object-cover border border-slate-700" alt="" />
                      <div>
                        <p className="text-white font-medium">{u.name}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                    </div>
                  </Td>
                  <Td className="text-slate-400 text-xs">{u.phoneNumber}</Td>
                  <Td><Badge status={u.role} /></Td>
                  <Td><Badge status={u.isActive ? "active" : "inactive"} /></Td>
                  <Td>{u.isVerified ? <CheckCircle2 size={15} className="text-emerald-400" /> : <XCircle size={15} className="text-red-400" />}</Td>
                  <Td className="text-slate-500 text-xs">{new Date(u.createdAt).toLocaleDateString()}</Td>
                  <Td>
                    <div className="flex gap-1">
                      <Btn size="xs" variant="ghost" onClick={() => handleViewUser(u._id)} loading={loadingUserDetails && viewingUser?._id === u._id}><Eye size={12} /></Btn>
                      <Btn size="xs" variant="ghost" onClick={() => openModal("editUser", u)}><Edit size={12} /></Btn>
                      {u.role === "seller" && !u.isSellerApproved && (
                        <Btn size="xs" variant="success" onClick={() => handleApproveSeller(u._id, true)}><Check size={12} /></Btn>
                      )}
                      <Btn size="xs" variant="danger" onClick={() => handleDeleteUser(u._id)}><Trash2 size={12} /></Btn>
                    </div>
                  </Td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </TableWrapper>
    </div>
  );

  const renderCashBox = () => (
    <div className="space-y-4">
      <SectionHeader
        title="Cash Box"
        actions={<>
          <Btn size="sm" variant="secondary" onClick={() => exportToExcel(transactions.map(t => ({ Type: t.type, Amount: t.amount, Desc: t.description, Method: t.paymentMethod, Date: new Date(t.date || t.createdAt).toLocaleDateString() })), "cashbox")}>
            <FileSpreadsheet size={12} /> Excel
          </Btn>
          <Btn size="sm" onClick={() => openModal("addTransaction")}><Plus size={12} /> Add Entry</Btn>
        </>}
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard title="Total Cash In"  value={fmt(cashIn)}      icon={TrendingUp}   color="#10b981" />
        <StatCard title="Total Cash Out" value={fmt(cashOut)}     icon={TrendingDown} color="#ef4444" />
        <StatCard title="Net Balance"    value={fmt(cashBalance)} icon={Banknote}     color={cashBalance >= 0 ? "#10b981" : "#ef4444"} />
      </div>
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
        <h3 className="font-semibold text-white text-sm mb-4">Transaction Flow</h3>
        <ResponsiveContainer width="100%" height={180}>
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
              {["Type","Amount","Description","Method","Date"].map(h => <Th key={h}>{h}</Th>)}
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? <EmptyRow cols={5} message="No transactions yet" /> :
              transactions.map(t => (
                <tr key={t._id} className="border-b border-slate-700/40 hover:bg-slate-700/25 transition-colors">
                  <Td><span className={`text-xs font-semibold ${t.type === "Cash In" ? "text-emerald-400" : "text-red-400"}`}>{t.type}</span></Td>
                  <Td><span className={`font-bold ${t.type === "Cash In" ? "text-emerald-400" : "text-red-400"}`}>{t.type === "Cash In" ? "+" : "-"}{fmt(t.amount)}</span></Td>
                  <Td className="text-slate-400 max-w-xs truncate">{t.description}</Td>
                  <Td className="text-slate-500 text-xs">{t.paymentMethod}</Td>
                  <Td className="text-slate-500 text-xs">{new Date(t.date || t.createdAt).toLocaleString()}</Td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </TableWrapper>
    </div>
  );

  const renderChats = () => (
    <div className="space-y-4">
      <SectionHeader title="Global Messenger" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ height: "calc(100vh - 220px)", minHeight: 500 }}>
        {/* Chat List */}
        <div className="lg:col-span-1 bg-slate-800 border border-slate-700 rounded-xl flex flex-col relative">
          <div className="p-3 border-b border-slate-700 bg-slate-900/50 flex flex-col gap-3">
            <p className="text-sm font-semibold text-white">Conversations <span className="text-slate-500 font-normal">({chats.length})</span></p>
            {/* Search Input */}
            <div className="relative z-50">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search users to chat (name or email)..."
                  value={userSearch}
                  onChange={(e) => handleUserSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
                />
                {isSearchingUser && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-500 animate-spin" />}
              </div>
              {/* Search Results Dropdown */}
              {userSearch.trim() && (
                <div className="absolute top-full left-0 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl overflow-hidden max-h-80 overflow-y-auto z-[100]">
                  {isSearchingUser ? (
                    <div className="p-4 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin text-orange-500" /> Searching...
                    </div>
                  ) : userSearchResults.length > 0 ? (
                    userSearchResults.map(u => (
                      <button
                        key={u._id}
                        className="w-full text-left p-3 hover:bg-slate-700 border-b border-slate-700 last:border-0 transition-colors flex items-center gap-3"
                        onClick={() => startChatWithUser(u)}
                      >
                        <img 
                          src={u.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || "U")}&background=1e293b&color=ff5500`}
                          className="w-9 h-9 rounded-full object-cover border border-slate-600" 
                          alt="" 
                        />
                        <div className="min-w-0">
                          <p className="text-sm text-white font-semibold truncate">{u.shopName || u.name}</p>
                          <p className="text-[11px] text-slate-400 truncate">{u.email} <span className="text-[10px] opacity-60">({u.role})</span></p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-sm text-slate-500 bg-slate-900/50">
                      No users found for "{userSearch}"
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Horizontal User List (Small Icons) */}
            <div className="px-1 py-1 flex gap-2 overflow-x-auto no-scrollbar">
              {users.slice(0, 20).map(u => (
                <button 
                  key={u._id} 
                  title={u.shopName || u.name}
                  onClick={() => startChatWithUser(u)}
                  className="flex-shrink-0 relative group"
                >
                  <img 
                    src={u.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || "U")}&background=1e293b&color=ff5500`}
                    className="w-10 h-10 rounded-full object-cover border-2 border-slate-700 group-hover:border-orange-500 transition-all" 
                    alt={u.name} 
                  />
                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 border-2 border-slate-800 rounded-full ${u.role === 'seller' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-y-auto flex-1 divide-y divide-slate-700/50">
              {chats.length === 0
                ? <div className="p-8 text-center text-slate-500 text-sm">No messages yet</div>
                : chats.map(chat => {
                    const otherUser = chat.seller?._id !== currentUser.id ? chat.seller : chat.user;
                    return (
                      <button
                        key={chat._id}
                        className={`w-full p-3 hover:bg-slate-700/40 transition-colors text-left ${selectedChat?._id === chat._id ? "bg-orange-500/10 border-l-2 border-orange-500" : ""}`}
                        onClick={() => setSelectedChat(chat)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
                              {otherUser?.profilePic ? (
                                <img src={otherUser.profilePic} className="w-full h-full object-cover" alt="" />
                              ) : (
                                <span>{otherUser?.name?.[0] || "?"}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-white text-sm font-medium truncate">{otherUser?.shopName || otherUser?.name || "Anonymous"}</p>
                              <p className="text-xs text-slate-500 truncate">{chat.lastMessage || chat.messages?.[chat.messages.length - 1]?.message || "…"}</p>
                            </div>
                          </div>
                          {(chat.unreadCount > 0) && (
                            <span className="bg-orange-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">{chat.unreadCount}</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-600 mt-1.5 ml-10">{new Date(chat.updatedAt || chat.createdAt).toLocaleString()}</p>
                      </button>
                    );
                  })
              }
          </div>
        </div>

            <div className="flex-1 min-w-0 bg-slate-900 border-l border-slate-700 relative overflow-hidden flex flex-col">
              {selectedChat ? (
                <ChatWindow 
                  chatId={selectedChat._id} 
                  receiver={selectedChat.seller?._id !== (currentUser.id || currentUser._id) ? selectedChat.seller : selectedChat.user}
                  onClose={() => setSelectedChat(null)}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-900/50">
                  <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 text-slate-600 shadow-inner">
                    <MessageSquare size={32} />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">Global Messenger</h3>
                  <p className="text-slate-500 text-sm max-w-xs">Select a user from the left or utilize the search bar to start a new conversation.</p>
                </div>
              )}
            </div>
      </div>
    </div>
  );

  const renderSellerRequests = () => (
    <div className="space-y-4">
      <SectionHeader title="Seller Registration Requests" />
      {sellerRequests.length > 0 && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex items-center gap-2">
          <Bell size={15} className="text-blue-400" />
          <p className="text-blue-400 text-sm">{sellerRequests.length} pending seller request{sellerRequests.length > 1 ? "s" : ""} awaiting review.</p>
        </div>
      )}
      <TableWrapper>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-900/60">
              {["Name","Email","Phone","Shop Name","Address","Requested","Actions"].map(h => <Th key={h}>{h}</Th>)}
            </tr>
          </thead>
          <tbody>
            {sellerRequests.length === 0
              ? <EmptyRow cols={7} message="No pending seller requests" />
              : sellerRequests.map(r => (
                  <tr key={r._id} className="border-b border-slate-700/40 hover:bg-slate-700/25 transition-colors">
                    <Td className="text-white font-medium">{r.name}</Td>
                    <Td className="text-slate-400 text-xs">{r.email}</Td>
                    <Td className="text-slate-400 text-xs">{r.phoneNumber}</Td>
                    <Td><span className="font-semibold text-orange-400">{r.shopName}</span></Td>
                    <Td className="text-slate-500 text-xs max-w-[180px] truncate">{r.shopAddress}</Td>
                    <Td className="text-slate-500 text-xs">{new Date(r.createdAt).toLocaleDateString()}</Td>
                    <Td>
                      <div className="flex gap-1.5">
                        <Btn size="sm" variant="success" onClick={() => handleApproveSeller(r.userId || r._id, true)}><Check size={13} /> Approve</Btn>
                        <Btn size="sm" variant="danger"  onClick={() => handleApproveSeller(r.userId || r._id, false)}><X size={13} /> Reject</Btn>
                        <Btn size="sm" variant="secondary" onClick={() => { setSelectedItem(r); openModal("sellerChat"); }}>
                          <MessageSquare size={13} /> Chat
                        </Btn>
                      </div>
                    </Td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </TableWrapper>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-5">
      <SectionHeader title="Analytics & Reports" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {[
          { title: "Daily Revenue", data: analytics.dailySales || [], key: "revenue", color: PRIMARY, type: "area" },
          { title: "User Growth",   data: analytics.userGrowth || [], key: "users",   color: "#0ea5e9", type: "line" },
        ].map(({ title, data, key, color, type }) => (
          <div key={title} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white text-sm">{title}</h3>
              <Btn size="xs" variant="ghost" onClick={() => exportToExcel(data, title.toLowerCase().replace(/ /g, "_"))}><Download size={12} /> Export</Btn>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              {type === "area"
                ? <AreaChart data={data}>
                    <defs><linearGradient id={`g${key}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={color} stopOpacity={0.25}/><stop offset="95%" stopColor={color} stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="_id" tick={{ fontSize: 9, fill: "#64748b" }} />
                    <YAxis tick={{ fontSize: 9, fill: "#64748b" }} />
                    <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 10 }} formatter={v => [`৳${(v||0).toLocaleString()}`, ""]} />
                    <Area type="monotone" dataKey={key} stroke={color} fillOpacity={1} fill={`url(#g${key})`} />
                  </AreaChart>
                : <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="_id" tick={{ fontSize: 9, fill: "#64748b" }} />
                    <YAxis tick={{ fontSize: 9, fill: "#64748b" }} />
                    <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 10 }} />
                    <Line type="monotone" dataKey={key} stroke={color} strokeWidth={2} dot={{ fill: color, r: 3 }} />
                  </LineChart>
              }
            </ResponsiveContainer>
          </div>
        ))}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <h3 className="font-semibold text-white text-sm mb-4">Payment Methods</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={analytics.paymentMethods || []} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={85} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {(analytics.paymentMethods || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 10 }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <h3 className="font-semibold text-white text-sm mb-4">Revenue by Category</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={(analytics.categoryRevenue || []).slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="_id" tick={{ fontSize: 9, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 9, fill: "#64748b" }} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 10 }} formatter={v => [`৳${(v||0).toLocaleString()}`, ""]} />
              <Bar dataKey="revenue" fill={PRIMARY} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderWithdrawals = () => (
    <div className="space-y-4">
      <SectionHeader title="Withdrawal Requests" />
      <TableWrapper>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-900/60">
              {["Seller","Gross / Fee","Net Payout","Method","Account","Status","Date","Actions"].map(h => <Th key={h}>{h}</Th>)}
            </tr>
          </thead>
          <tbody>
            {withdrawals.filter(w => w.status === "pending").length === 0
              ? <EmptyRow cols={8} message="No pending withdrawal requests" />
              : withdrawals.filter(w => w.status === "pending").map(w => (
                  <tr key={w._id} className="border-b border-slate-700/40 hover:bg-slate-700/25 transition-colors">
                    <Td>
                      <p className="text-white font-medium">{w.seller?.shopName || w.seller?.name}</p>
                      <p className="text-xs text-slate-500">{w.seller?.email}</p>
                    </Td>
                    <Td>
                      <p className="text-slate-400 text-xs">{fmt(w.amount)}</p>
                      <p className="text-red-400 text-xs">-{fmt(w.serviceCharge)}</p>
                    </Td>
                    <Td><span className="font-bold text-emerald-400">{fmt(w.netAmount)}</span></Td>
                    <Td><span className="uppercase text-xs font-bold text-slate-300 bg-slate-700 px-2 py-0.5 rounded">{w.paymentMethod}</span></Td>
                    <Td className="font-mono text-cyan-400 text-xs font-bold">{w.accountNumber}</Td>
                    <Td><Badge status={w.status} /></Td>
                    <Td className="text-slate-500 text-xs">{new Date(w.createdAt).toLocaleDateString()}</Td>
                    <Td>
                      <div className="flex gap-1">
                        <Btn size="xs" variant="success" onClick={() => handleUpdateWithdrawal(w._id, "approved")}><Check size={12} /></Btn>
                        <Btn size="xs" variant="danger"  onClick={() => handleUpdateWithdrawal(w._id, "rejected")}><X size={12} /></Btn>
                      </div>
                    </Td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </TableWrapper>
    </div>
  );

  const renderPayouts = () => {
    const completed = withdrawals.filter(w => w.status === "approved" || w.status === "completed");
    return (
      <div className="space-y-4">
        <SectionHeader
          title="Payout History"
          actions={<>
            <Btn size="sm" variant="secondary" onClick={() => exportToExcel(completed.map(w => ({ Seller: w.seller?.shopName, Amount: w.netAmount, Method: w.paymentMethod, Account: w.accountNumber, Date: new Date(w.updatedAt).toLocaleDateString() })), "payouts")}>
              <FileSpreadsheet size={12} /> Export
            </Btn>
          </>}
        />
        <TableWrapper>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900/60">
                {["Seller","Amount Paid","Method","Account","Date","Transaction ID"].map(h => <Th key={h}>{h}</Th>)}
              </tr>
            </thead>
            <tbody>
              {completed.length === 0
                ? <EmptyRow cols={6} message="No completed payouts" />
                : completed.map(w => (
                    <tr key={w._id} className="border-b border-slate-700/40 hover:bg-slate-700/25 transition-colors">
                      <Td>
                        <p className="text-white font-medium">{w.seller?.shopName || w.seller?.name}</p>
                        <p className="text-xs text-slate-500">{w.seller?.email}</p>
                      </Td>
                      <Td><span className="font-bold text-emerald-400">{fmt(w.netAmount)}</span></Td>
                      <Td><span className="uppercase text-xs font-bold text-slate-300 bg-slate-700 px-2 py-0.5 rounded">{w.paymentMethod}</span></Td>
                      <Td className="font-mono text-xs text-cyan-400">{w.accountNumber}</Td>
                      <Td className="text-slate-500 text-xs">{new Date(w.updatedAt).toLocaleDateString()}</Td>
                      <Td className="font-mono text-slate-600 text-xs">{w.transactionId || w._id}</Td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </TableWrapper>
      </div>
    );
  };

  const renderSettings = () => (
    <div className="space-y-6">
      <SectionHeader title="System Settings" />
      {/* Payment */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <p className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-4">Payment Numbers</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="bKash Number"  value={configs.bkash_number  || ""} onChange={e => setConfigs(c => ({ ...c, bkash_number:  e.target.value }))} placeholder="017XXXXXXXXX" />
          <Input label="Nagad Number"  value={configs.nagad_number  || ""} onChange={e => setConfigs(c => ({ ...c, nagad_number:  e.target.value }))} placeholder="018XXXXXXXXX" />
          <Input label="Rocket Number" value={configs.rocket_number || ""} onChange={e => setConfigs(c => ({ ...c, rocket_number: e.target.value }))} placeholder="019XXXXXXXXX" />
          <Input label="Bank Details"  value={configs.bank_details  || ""} onChange={e => setConfigs(c => ({ ...c, bank_details:  e.target.value }))} placeholder="Bank Name, Acc, Branch" />
        </div>
        <Btn className="mt-4" onClick={() => handleSaveAllConfigs(["bkash_number","nagad_number","rocket_number","bank_details"])}>Save Payment Details</Btn>
      </div>
      {/* Fees */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <p className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-4">Fees & Delivery</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input label="Delivery Charge (৳)" type="number" value={configs.delivery_charge || ""} onChange={e => setConfigs(c => ({ ...c, delivery_charge: e.target.value }))} placeholder="60" />
          <Input label="VAT / Tax (%)"       type="number" value={configs.vat_percentage  || ""} onChange={e => setConfigs(c => ({ ...c, vat_percentage:  e.target.value }))} placeholder="5" />
          <Input label="Platform Commission (%)" type="number" value={configs.platform_commission_rate || ""} onChange={e => setConfigs(c => ({ ...c, platform_commission_rate: e.target.value }))} placeholder="2" />
        </div>
        <Btn className="mt-4" onClick={() => handleSaveAllConfigs(["delivery_charge","vat_percentage","platform_commission_rate"])}>Save Fees</Btn>
      </div>
      {/* Membership */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <p className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-4">Membership Discounts (%)</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          {["bronze","silver","gold","platinum"].map(tier => (
            <div key={tier} className="space-y-2">
              <p className="text-xs text-slate-500 capitalize font-semibold">{tier}</p>
              <Input label="Product %" type="number" value={configs[`membership_${tier}_discount`] || 0} onChange={e => setConfigs(c => ({ ...c, [`membership_${tier}_discount`]: e.target.value }))} />
              <Input label="Delivery %" type="number" value={configs[`membership_${tier}_delivery_discount`] || 0} onChange={e => setConfigs(c => ({ ...c, [`membership_${tier}_delivery_discount`]: e.target.value }))} />
            </div>
          ))}
        </div>
        <Btn onClick={() => handleSaveAllConfigs(["bronze","silver","gold","platinum"].flatMap(t => [`membership_${t}_discount`,`membership_${t}_delivery_discount`]))}>Save Membership</Btn>
      </div>
      {/* Coupons */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold text-orange-400 uppercase tracking-widest flex items-center gap-2"><Ticket size={14} /> Coupon Management</p>
          <Btn size="sm" onClick={() => { setEditingCoupon(null); setCouponForm({ code: "", discountType: "percentage", discountValue: 0, minPurchase: 0, maxDiscount: 0, endDate: "", usageLimit: 0, isActive: true }); openModal("coupon"); }}><Plus size={12} /> New Coupon</Btn>
        </div>
        <TableWrapper>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900/60">
                {["Code","Discount","Min. Buy","Usage","Expiry","Status","Actions"].map(h => <Th key={h}>{h}</Th>)}
              </tr>
            </thead>
            <tbody>
              {coupons.length === 0 ? <EmptyRow cols={7} message="No coupons yet" /> :
                coupons.map(c => (
                  <tr key={c._id} className="border-b border-slate-700/40 hover:bg-slate-700/25 transition-colors">
                    <Td><span className="font-mono font-bold text-orange-400">{c.code}</span></Td>
                    <Td className="text-white font-medium">{c.discountType === "percentage" ? `${c.discountValue}%` : fmt(c.discountValue)}</Td>
                    <Td className="text-slate-400 text-xs">{fmt(c.minPurchase)}</Td>
                    <Td><span className="text-white">{c.usedCount}</span><span className="text-slate-500"> / {c.usageLimit || "∞"}</span></Td>
                    <Td className="text-slate-400 text-xs">{c.endDate ? new Date(c.endDate).toLocaleDateString() : "—"}</Td>
                    <Td><Badge status={(c.isActive && c.endDate && new Date() < new Date(c.endDate)) ? "active" : "expired"} /></Td>
                    <Td>
                      <div className="flex gap-1">
                        <Btn size="xs" variant="ghost" onClick={() => { setEditingCoupon(c); setCouponForm(c); openModal("coupon"); }}><Edit size={12} /></Btn>
                        <Btn size="xs" variant="danger" onClick={() => handleDeleteCoupon(c._id)}><Trash2 size={12} /></Btn>
                      </div>
                    </Td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </TableWrapper>
      </div>
    </div>
  );

  const renderDeveloper = () => (
    <div className="space-y-6">
      <SectionHeader title="Developer Center" />

      {/* Categories */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold text-white flex items-center gap-2"><Layers size={16} className="text-orange-500" /> Product Categories</p>
          <Btn size="sm" onClick={() => { setCategoryForm({ name: "", image: null, imagePreview: "" }); openModal("addCategory"); }}><Plus size={12} /> Add</Btn>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {categories.length === 0
            ? <p className="col-span-full text-slate-500 text-sm text-center py-6">No categories yet</p>
            : categories.map(cat => (
                <div key={cat._id} className="bg-slate-900 border border-slate-700 rounded-xl p-3 flex flex-col items-center gap-2 group hover:border-orange-500/40 transition-all">
                  {cat.image
                    ? <img src={cat.image} className="w-14 h-14 rounded-xl object-cover border border-slate-700" alt={cat.name} />
                    : <div className="w-14 h-14 rounded-xl bg-slate-700 flex items-center justify-center"><Package2 size={22} className="text-slate-500" /></div>
                  }
                  <p className="text-white text-xs font-medium text-center truncate w-full">{cat.name}</p>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Btn size="xs" variant="ghost" onClick={() => openModal("editCategory", cat)}><Edit size={11} /></Btn>
                    <Btn size="xs" variant="danger" onClick={() => handleDeleteCategory(cat._id)}><Trash2 size={11} /></Btn>
                  </div>
                </div>
              ))
          }
        </div>
      </div>

      {/* Slideshow */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold text-white flex items-center gap-2"><ImageIcon size={16} className="text-orange-500" /> Homepage Slideshow</p>
          <Btn size="sm" onClick={() => { setSlideForm({ title: "", image: null, imagePreview: "", link: "", order: 0 }); openModal("addSlide"); }}><Plus size={12} /> Add Slide</Btn>
        </div>
        {slides.length === 0
          ? <p className="text-slate-500 text-sm text-center py-6">No slides added</p>
          : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[...slides].sort((a, b) => (a.order || 0) - (b.order || 0)).map(slide => (
                <div key={slide._id} className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden group hover:border-orange-500/40 transition-all">
                  {slide.image
                    ? <div className="relative"><img src={slide.image} className="w-full h-28 object-cover" alt={slide.title} /><div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"><Btn size="xs" variant="ghost" onClick={() => openModal("editSlide", slide)} className="bg-black/60"><Edit size={12} /></Btn><Btn size="xs" variant="danger" onClick={() => handleDeleteSlide(slide._id)} className="bg-black/60"><Trash2 size={12} /></Btn></div></div>
                    : <div className="w-full h-28 bg-slate-800 flex items-center justify-center"><ImageIcon size={28} className="text-slate-600" /></div>
                  }
                  <div className="p-2.5">
                    <p className="text-white text-xs font-medium truncate">{slide.title || "Untitled"}</p>
                    <p className="text-slate-500 text-[10px] mt-0.5">Order: {slide.order ?? 0} {slide.link ? `· ${slide.link.slice(0, 30)}…` : ""}</p>
                  </div>
                </div>
              ))}
            </div>
        }
      </div>

      {/* Hotlines & Marquee Settings */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <p className="text-sm font-bold text-white flex items-center gap-2 mb-4"><Megaphone size={16} className="text-orange-500" /> Header Content (Notice & Hotline)</p>
        <div className="space-y-4">
          <Input label="Header Hotline Number" value={configs.header_hotline || ""} onChange={e => setConfigs(c => ({ ...c, header_hotline: e.target.value }))} placeholder="+8801XXXXXXXXX" />
          <TextArea label="Header Notice (Marquee)" value={configs.header_notice || ""} onChange={e => setConfigs(c => ({ ...c, header_notice: e.target.value }))} placeholder="Enter notice text/HTML..." rows={3} />
          
          <Btn onClick={handleUpdateHeaderContent}>Save Header Content</Btn>

          {(configs.header_notice || configs.header_hotline) && (
            <div className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 mt-4">
              <p className="text-xs text-slate-500 uppercase font-bold mb-2">Preview</p>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <Headset size={16} className="text-slate-400" />
                <span className="text-white">{configs.header_hotline}</span>
              </div>
              {configs.header_notice && (
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-2 overflow-hidden relative h-8 flex items-center">
                  <div 
                    className="absolute whitespace-nowrap animate-marquee uppercase text-red-400 text-sm"
                    dangerouslySetInnerHTML={{ __html: configs.header_notice }}
                  />
                </div>
              )}
            </div>
          )}
          
          <div className="mt-8">
            <p className="text-xs text-slate-400 uppercase font-bold mb-3 flex items-center gap-1.5"><History size={14} /> Notice History</p>
            <TableWrapper>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-900/60">
                    <Th>Date</Th>
                    <Th>Admin</Th>
                    <Th>Hotline</Th>
                    <Th>Notice</Th>
                  </tr>
                </thead>
                <tbody>
                  {headerHistory && headerHistory.length > 0 ? (
                    headerHistory.map((h, i) => (
                      <tr key={h._id || i} className="border-b border-slate-700/40 hover:bg-slate-700/25 transition-colors">
                        <Td className="whitespace-nowrap text-xs text-slate-400">{new Date(h.createdAt).toLocaleString()}</Td>
                        <Td className="text-slate-300 font-medium">{h.updatedBy?.name || "System"}</Td>
                        <Td className="text-slate-300">{h.hotline || "—"}</Td>
                        <Td className="text-slate-400 text-xs max-w-xs truncate">{h.notice || "—"}</Td>
                      </tr>
                    ))
                  ) : (
                    <EmptyRow cols={4} message="No history found" />
                  )}
                </tbody>
              </table>
            </TableWrapper>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Tab Render Map ────────────────────────────────────────────────────────
  const TAB_CONTENT = {
    overview:       renderOverview,
    orders:         renderOrders,
    payments:       renderPayments,
    inventory:      renderInventory,
    users:          renderUsers,
    cashbox:        renderCashBox,
    chats:          renderChats,
    sellerRequests: renderSellerRequests,
    withdrawals:    renderWithdrawals,
    payouts:        renderPayouts,
    analytics:      renderAnalytics,
    settings:       renderSettings,
    developer:      renderDeveloper,
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      <Sidebar />
      <TopBar />

      {/* Main Content */}
      <div className="lg:pl-64 pt-14 lg:pt-0">
        <div className="min-h-screen p-4 sm:p-5 lg:p-6">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {(TAB_CONTENT[activeTab] || (() => null))()}
          </motion.div>
        </div>
      </div>

      {/* ── MODALS ─────────────────────────────────────────────────────────── */}

      {/* Order Detail */}
      <Modal open={modals.orderDetail} onClose={() => closeModal("orderDetail")} title={`Order: ${selectedItem?.orderNumber}`} size="lg">
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
                <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Shipping</p>
                <p className="text-white">{selectedItem.shippingAddress?.fullName}</p>
                <p className="text-slate-400 text-xs">{selectedItem.shippingAddress?.addressLine1}</p>
                <p className="text-slate-400 text-xs">{selectedItem.shippingAddress?.city}, {selectedItem.shippingAddress?.country}</p>
              </div>
            </div>
            <div className="bg-slate-900 rounded-xl p-3">
              <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Items</p>
              {selectedItem.items?.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                  <div className="flex items-center gap-3">
                    {item.image && <img src={item.image} className="w-9 h-9 rounded-lg object-cover border border-slate-700" alt="" />}
                    <div>
                      <p className="text-white text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-slate-500">{item.product?.user?.shopName || "—"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-300 text-xs">{item.quantity} × {fmt(item.price)}</p>
                    <p className="text-orange-400 font-bold text-sm">{fmt(item.quantity * item.price)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-slate-900 rounded-xl p-3 border border-orange-500/20">
               <p className="text-xs text-orange-400 uppercase font-bold mb-3 flex items-center gap-2">
                 <Store size={14} /> Seller Action Requests / Progress
               </p>
               <div className="space-y-3">
                 {selectedItem.sellers?.length > 0 ? selectedItem.sellers.map((s, i) => (
                   <div key={i} className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg border border-slate-700">
                     <div>
                       <p className="text-white text-xs font-bold">
                         {s.sellerId?.shopName || s.sellerId?.name || 'Unknown Seller'}
                       </p>
                       <p className="text-[10px] text-slate-500">{s.sellerId?.email || '—'}</p>
                       <p className="text-[10px] text-slate-600">
                         Items: {s.items?.length ?? 0} &nbsp;·&nbsp; Subtotal: ৳{(s.subtotal || 0).toLocaleString()}
                       </p>
                     </div>
                     <div className="flex flex-col items-end gap-1">
                       {/* Seller-level status falls back to global order status */}
                       <Badge status={s.status || selectedItem.status} />
                       {s.trackingNumber && <span className="text-[9px] font-mono text-cyan-400">TRK: {s.trackingNumber}</span>}
                       <span className={`text-[9px] font-semibold ${s.isPaid ? 'text-emerald-400' : 'text-yellow-400'}`}>
                         {s.isPaid ? '✓ Paid' : 'Awaiting'}
                       </span>
                     </div>
                   </div>
                 )) : (
                   <p className="text-slate-600 text-xs text-center py-2">No seller breakdown available</p>
                 )}
               </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-900 rounded-xl p-3 space-y-1.5">
                {[["Subtotal", fmt(selectedItem.subtotal)], ["Shipping", fmt(selectedItem.shippingCost)], ["VAT", fmt(selectedItem.vatAmount)], ["Discount", `-${fmt(selectedItem.discount)}`]].map(([k, v]) => (
                  <div key={k} className="flex justify-between"><span className="text-slate-500">{k}</span><span className="text-white">{v}</span></div>
                ))}
                <div className="flex justify-between border-t border-slate-800 pt-1.5"><span className="text-white font-bold">Total</span><span className="text-orange-400 font-bold">{fmt(selectedItem.totalPrice)}</span></div>
              </div>
              <div className="bg-slate-900 rounded-xl p-3 space-y-2">
                <div className="flex justify-between items-center"><span className="text-slate-500 text-xs uppercase tracking-wider">Method</span><span className="text-white font-bold uppercase text-xs">{selectedItem.paymentMethod}</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-500 text-xs uppercase tracking-wider">Payment</span><Badge status={selectedItem.paymentStatus} /></div>
                <div className="flex justify-between items-center"><span className="text-slate-500 text-xs uppercase tracking-wider">Status</span><Badge status={selectedItem.status} /></div>
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

      {/* Edit Order */}
      <Modal open={modals.editOrder} onClose={() => closeModal("editOrder")} title="Update Order">
        <form onSubmit={handleUpdateOrder} className="space-y-4">
          <Select label="Order Status" value={orderForm.status} onChange={e => setOrderForm(p => ({ ...p, status: e.target.value }))}>
            {["pending","confirmed","processing","shipped","out-for-delivery","delivered","cancelled","returned","refunded"].map(s => <option key={s}>{s}</option>)}
          </Select>
          <Select label="Payment Status" value={orderForm.paymentStatus} onChange={e => setOrderForm(p => ({ ...p, paymentStatus: e.target.value }))}>
            {["pending","paid","failed","refunded","processing"].map(s => <option key={s}>{s}</option>)}
          </Select>
          <Input label="Tracking Number" value={orderForm.trackingNumber} onChange={e => setOrderForm(p => ({ ...p, trackingNumber: e.target.value }))} placeholder="BD123456789" />
          <Input label="Courier" value={orderForm.courier} onChange={e => setOrderForm(p => ({ ...p, courier: e.target.value }))} placeholder="Pathao, Redx, Steadfast…" />
          <TextArea label="Admin Notes" value={orderForm.adminNotes} onChange={e => setOrderForm(p => ({ ...p, adminNotes: e.target.value }))} rows={3} />
          <div className="flex gap-2 justify-end pt-2">
            <Btn type="button" variant="secondary" onClick={() => closeModal("editOrder")}>Cancel</Btn>
            <Btn type="submit">Update Order</Btn>
          </div>
        </form>
      </Modal>

      {/* Add Transaction */}
      <Modal open={modals.addTransaction} onClose={() => closeModal("addTransaction")} title="Record Transaction">
        <form onSubmit={handleAddTransaction} className="space-y-4">
          <Select label="Type" value={transactionForm.type} onChange={e => setTransactionForm(p => ({ ...p, type: e.target.value }))}>
            {["Cash In","Cash Out","Sale","Purchase","Expense","Withdrawal","Refund"].map(t => <option key={t}>{t}</option>)}
          </Select>
          <Input label="Amount (৳)" type="number" min="0" required value={transactionForm.amount} onChange={e => setTransactionForm(p => ({ ...p, amount: e.target.value }))} />
          <Input label="Description" required value={transactionForm.description} onChange={e => setTransactionForm(p => ({ ...p, description: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Category" value={transactionForm.category} onChange={e => setTransactionForm(p => ({ ...p, category: e.target.value }))}>
              {["sales","purchases","expenses","withdrawals","others"].map(c => <option key={c}>{c}</option>)}
            </Select>
            <Select label="Method" value={transactionForm.paymentMethod} onChange={e => setTransactionForm(p => ({ ...p, paymentMethod: e.target.value }))}>
              {["Cash","bKash","Nagad","Rocket","Bank","Card"].map(m => <option key={m}>{m}</option>)}
            </Select>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Btn type="button" variant="secondary" onClick={() => closeModal("addTransaction")}>Cancel</Btn>
            <Btn type="submit">Save</Btn>
          </div>
        </form>
      </Modal>

      {/* Add / Edit Product */}
      {[["addProduct","Add New Product",false],["editProduct","Edit Product",true]].map(([name, title, isEdit]) => (
        <Modal key={name} open={modals[name]} onClose={() => closeModal(name)} title={title} size="lg">
          <form onSubmit={handleSaveProduct} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Product Name" required value={productForm.name} onChange={e => setProductForm(p => ({ ...p, name: e.target.value }))} />
              <Input label="SKU" value={productForm.sku} onChange={e => setProductForm(p => ({ ...p, sku: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Selling Price (৳)" type="number" required value={productForm.sellingPrice} onChange={e => setProductForm(p => ({ ...p, sellingPrice: e.target.value }))} />
              <Input label="Purchase Price (৳)" type="number" required value={productForm.purchasePrice} onChange={e => setProductForm(p => ({ ...p, purchasePrice: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Stock" type="number" required value={productForm.stock} onChange={e => setProductForm(p => ({ ...p, stock: e.target.value }))} />
              <Input label="Unit" value={productForm.unit} onChange={e => setProductForm(p => ({ ...p, unit: e.target.value }))} placeholder="পিস / কেজি / লিটার" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Category" value={productForm.category} onChange={e => setProductForm(p => ({ ...p, category: e.target.value }))} />
              <Input label="Brand" value={productForm.brand} onChange={e => setProductForm(p => ({ ...p, brand: e.target.value }))} />
            </div>
            <TextArea label="Description" value={productForm.description} onChange={e => setProductForm(p => ({ ...p, description: e.target.value }))} rows={3} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Image URL" value={productForm.image} onChange={e => setProductForm(p => ({ ...p, image: e.target.value }))} placeholder="https://…" />
              <Select label="Status" value={productForm.liveStatus} onChange={e => setProductForm(p => ({ ...p, liveStatus: e.target.value }))}>
                <option value="live">Live</option>
                <option value="draft">Draft</option>
              </Select>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Btn type="button" variant="secondary" onClick={() => closeModal(name)}>Cancel</Btn>
              <Btn type="submit">{isEdit ? "Update" : "Create"} Product</Btn>
            </div>
          </form>
        </Modal>
      ))}

      {/* Profile Modal */}
      <Modal open={modals.profile} onClose={() => closeModal("profile")} title="Admin Profile" size="sm">
        <div className="text-center">
            <div className="relative inline-block mb-4 group">
              <img 
                src={currentUser?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || "A")}&background=orange&color=white`}
                className="w-24 h-24 rounded-full object-cover border-4 border-slate-700 shadow-xl group-hover:border-orange-500 transition-all"
                alt="" 
              />
              <label className="absolute bottom-0 right-0 p-2 bg-orange-500 rounded-full cursor-pointer hover:bg-orange-600 transition-all shadow-lg active:scale-90">
                  <Camera size={14} className="text-white" />
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
                          await adminAPI.updateProfile({ profilePic: newPic });
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
              <Badge status="admin" />
              <Badge status="active" />
            </div>
            <div className="p-3 bg-slate-900 rounded-xl text-left space-y-2 mt-4">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Permissions</p>
              <div className="flex flex-wrap gap-1">
                  {["Orders", "Users", "Payments", "System"].map(p => (
                    <span key={p} className="px-2 py-0.5 bg-orange-500/10 text-orange-400 text-[10px] rounded border border-orange-500/20">{p}</span>
                  ))}
              </div>
            </div>
        </div>
      </Modal>

      {/* View User Details */}
      <Modal open={modals.viewUserDetails} onClose={() => closeModal("viewUserDetails")} title={`User Details: ${viewingUser?.name}`} size="lg">
        {viewingUser && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
                <h4 className="text-sm font-bold text-orange-500 mb-3 border-b border-slate-700/50 pb-2 flex items-center gap-2">
                  <Activity size={14} /> Profile Overview
                </h4>
                <div className="space-y-2 text-sm text-slate-300">
                  <p><span className="text-slate-500">Name:</span> {viewingUser.name}</p>
                  <p><span className="text-slate-500">Email:</span> {viewingUser.email}</p>
                  <p><span className="text-slate-500">Phone:</span> {viewingUser.phoneNumber || 'N/A'}</p>
                  <p><span className="text-slate-500">Role:</span> <Badge status={viewingUser.role} /></p>
                  <p><span className="text-slate-500">Joined:</span> {new Date(viewingUser.createdAt).toLocaleDateString()}</p>
                  <p><span className="text-slate-500">Total Spent:</span> <span className="text-emerald-400 font-bold">{fmt(viewingUser.totalAmountSpent || 0)}</span></p>
                  <p><span className="text-slate-500">Member Level:</span> <span className="text-orange-400 font-bold">{viewingUser.membershipLevel || 'Bronze'}</span></p>
                </div>
              </div>
              
              <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
                <h4 className="text-sm font-bold text-orange-500 mb-3 border-b border-slate-700/50 pb-2 flex items-center gap-2">
                  <Warehouse size={14} /> Shipping Addresses
                </h4>
                <div className="space-y-3 max-h-[150px] overflow-y-auto pr-2">
                  {viewingUser.addresses?.length > 0 ? viewingUser.addresses.map((addr, i) => (
                    <div key={i} className="text-xs bg-slate-800/50 p-2 rounded border border-slate-700/30">
                      <p className="font-bold text-slate-200">{addr.label} {addr.isDefault && <span className="text-[10px] bg-orange-500/20 text-orange-400 px-1 rounded ml-1">Default</span>}</p>
                      <p className="text-slate-400">{addr.addressLine}</p>
                      <p className="text-slate-400">{addr.city}, {addr.state}, {addr.zipCode}</p>
                    </div>
                  )) : <p className="text-xs text-slate-500">No addresses saved</p>}
                </div>
              </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
              <h4 className="text-sm font-bold text-orange-500 mb-3 border-b border-slate-700/50 pb-2 flex items-center gap-2">
                <History size={14} /> Order History ({viewingOrders.length})
              </h4>
              <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-800 text-slate-400 sticky top-0">
                    <tr>
                      <th className="p-2">Order #</th>
                      <th className="p-2">Date</th>
                      <th className="p-2">Items</th>
                      <th className="p-2">Total</th>
                      <th className="p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/30">
                    {viewingOrders.map(order => (
                      <tr key={order._id} className="hover:bg-slate-800/30 cursor-pointer" onClick={() => { setSelectedItem(order); setModals(p => ({ ...p, editOrder: true, viewUserDetails: false })); }}>
                        <td className="p-2 font-mono">#{order.orderNumber}</td>
                        <td className="p-2">{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td className="p-2 text-slate-500">{order.items?.length || 0}</td>
                        <td className="p-2 font-bold">{fmt(order.totalPrice)}</td>
                        <td className="p-2"><Badge status={order.status} /></td>
                      </tr>
                    ))}
                    {viewingOrders.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-slate-600">No orders found</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end">
              <Btn variant="secondary" onClick={() => closeModal("viewUserDetails")}>Close</Btn>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit User */}
      <Modal open={modals.editUser} onClose={() => closeModal("editUser")} title={`Edit: ${selectedItem?.name}`}>
        <form onSubmit={handleUpdateUser} className="space-y-4">
          <Select label="Role" value={userForm.role} onChange={e => setUserForm(p => ({ ...p, role: e.target.value }))}>
            {["user","seller","courier","admin"].map(r => <option key={r}>{r}</option>)}
          </Select>
          <Select label="Account Status" value={String(userForm.isActive)} onChange={e => setUserForm(p => ({ ...p, isActive: e.target.value === "true" }))}>
            <option value="true">Active</option>
            <option value="false">Deactivated</option>
          </Select>
          {(selectedItem?.role === "seller" || userForm.role === "seller") && (
            <Select label="Seller Approved" value={String(userForm.isSellerApproved)} onChange={e => setUserForm(p => ({ ...p, isSellerApproved: e.target.value === "true" }))}>
              <option value="true">Approved</option>
              <option value="false">Pending</option>
            </Select>
          )}
          <div className="flex gap-2 justify-end pt-2">
            <Btn type="button" variant="secondary" onClick={() => closeModal("editUser")}>Cancel</Btn>
            <Btn type="submit">Update User</Btn>
          </div>
        </form>
      </Modal>

      {/* Coupon */}
      <Modal open={modals.coupon} onClose={() => closeModal("coupon")} title={editingCoupon ? "Edit Coupon" : "Create Coupon"}>
        <form onSubmit={handleSaveCoupon} className="space-y-4">
          <Input label="Coupon Code" required value={couponForm.code} onChange={e => setCouponForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="SAVE20" />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Discount Type" value={couponForm.discountType} onChange={e => setCouponForm(p => ({ ...p, discountType: e.target.value }))}>
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (৳)</option>
            </Select>
            <Input label="Value" type="number" required value={couponForm.discountValue} onChange={e => setCouponForm(p => ({ ...p, discountValue: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Min Purchase (৳)" type="number" value={couponForm.minPurchase} onChange={e => setCouponForm(p => ({ ...p, minPurchase: e.target.value }))} />
            <Input label="Max Discount (৳)" type="number" value={couponForm.maxDiscount} onChange={e => setCouponForm(p => ({ ...p, maxDiscount: e.target.value }))} disabled={couponForm.discountType === "fixed"} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Expiry Date" type="date" required value={couponForm.endDate ? new Date(couponForm.endDate).toISOString().split("T")[0] : ""} onChange={e => setCouponForm(p => ({ ...p, endDate: e.target.value }))} />
            <Input label="Usage Limit (0 = ∞)" type="number" value={couponForm.usageLimit} onChange={e => setCouponForm(p => ({ ...p, usageLimit: e.target.value }))} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={couponForm.isActive} onChange={e => setCouponForm(p => ({ ...p, isActive: e.target.checked }))} className="w-4 h-4 rounded accent-orange-500" />
            <span className="text-sm text-slate-300">Active</span>
          </label>
          <div className="flex gap-2 justify-end pt-2">
            <Btn type="button" variant="secondary" onClick={() => closeModal("coupon")}>Cancel</Btn>
            <Btn type="submit">{editingCoupon ? "Update" : "Create"}</Btn>
          </div>
        </form>
      </Modal>

      {/* Add Category */}
      <Modal open={modals.addCategory} onClose={() => closeModal("addCategory")} title="Add Category">
        <form onSubmit={e => handleSaveCategory(e, false)} className="space-y-4">
          <Input label="Category Name" required value={categoryForm.name} onChange={e => setCategoryForm(p => ({ ...p, name: e.target.value }))} placeholder="Electronics, Fashion…" />
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Image</label>
            <input type="file" accept="image/*" onChange={e => { const f = e.target.files[0]; if (f) setCategoryForm(p => ({ ...p, image: f, imagePreview: URL.createObjectURL(f) })); }}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm file:mr-3 file:bg-orange-500 file:border-0 file:text-white file:rounded-lg file:px-2 file:py-1 file:text-xs" />
            {categoryForm.imagePreview && <img src={categoryForm.imagePreview} className="mt-2 w-16 h-16 rounded-xl object-cover border border-slate-700" alt="" />}
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Btn type="button" variant="secondary" onClick={() => closeModal("addCategory")}>Cancel</Btn>
            <Btn type="submit">Add Category</Btn>
          </div>
        </form>
      </Modal>

      {/* Edit Category */}
      <Modal open={modals.editCategory} onClose={() => closeModal("editCategory")} title="Edit Category">
        <form onSubmit={e => handleSaveCategory(e, true)} className="space-y-4">
          <Input label="Category Name" required value={categoryForm.name} onChange={e => setCategoryForm(p => ({ ...p, name: e.target.value }))} />
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Image</label>
            {categoryForm.imagePreview && <img src={categoryForm.imagePreview} className="mb-2 w-16 h-16 rounded-xl object-cover border border-slate-700" alt="" />}
            <input type="file" accept="image/*" onChange={e => { const f = e.target.files[0]; if (f) setCategoryForm(p => ({ ...p, image: f, imagePreview: URL.createObjectURL(f) })); }}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm file:mr-3 file:bg-orange-500 file:border-0 file:text-white file:rounded-lg file:px-2 file:py-1 file:text-xs" />
            <p className="text-xs text-slate-600 mt-1">Leave empty to keep current image</p>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Btn type="button" variant="secondary" onClick={() => closeModal("editCategory")}>Cancel</Btn>
            <Btn type="submit">Update</Btn>
          </div>
        </form>
      </Modal>

      {/* Add Slide */}
      <Modal open={modals.addSlide} onClose={() => closeModal("addSlide")} title="Add Slide">
        <form onSubmit={e => handleSaveSlide(e, false)} className="space-y-4">
          <Input label="Title (Optional)" value={slideForm.title} onChange={e => setSlideForm(p => ({ ...p, title: e.target.value }))} placeholder="Summer Sale" />
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Slide Image *</label>
            <input type="file" accept="image/*" required onChange={e => { const f = e.target.files[0]; if (f) setSlideForm(p => ({ ...p, image: f, imagePreview: URL.createObjectURL(f) })); }}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm file:mr-3 file:bg-orange-500 file:border-0 file:text-white file:rounded-lg file:px-2 file:py-1 file:text-xs" />
            {slideForm.imagePreview && <img src={slideForm.imagePreview} className="mt-2 w-full h-24 rounded-xl object-cover border border-slate-700" alt="" />}
          </div>
          <Input label="Link URL (Optional)" value={slideForm.link} onChange={e => setSlideForm(p => ({ ...p, link: e.target.value }))} placeholder="https://…" />
          <Input label="Display Order" type="number" value={slideForm.order} onChange={e => setSlideForm(p => ({ ...p, order: parseInt(e.target.value) || 0 }))} />
          <div className="flex gap-2 justify-end pt-2">
            <Btn type="button" variant="secondary" onClick={() => closeModal("addSlide")}>Cancel</Btn>
            <Btn type="submit">Add Slide</Btn>
          </div>
        </form>
      </Modal>

      {/* Edit Slide */}
      <Modal open={modals.editSlide} onClose={() => closeModal("editSlide")} title="Edit Slide">
        <form onSubmit={e => handleSaveSlide(e, true)} className="space-y-4">
          <Input label="Title" value={slideForm.title} onChange={e => setSlideForm(p => ({ ...p, title: e.target.value }))} />
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Slide Image</label>
            {slideForm.imagePreview && <img src={slideForm.imagePreview} className="mb-2 w-full h-24 rounded-xl object-cover border border-slate-700" alt="" />}
            <input type="file" accept="image/*" onChange={e => { const f = e.target.files[0]; if (f) setSlideForm(p => ({ ...p, image: f, imagePreview: URL.createObjectURL(f) })); }}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm file:mr-3 file:bg-orange-500 file:border-0 file:text-white file:rounded-lg file:px-2 file:py-1 file:text-xs" />
            <p className="text-xs text-slate-600 mt-1">Leave empty to keep current image</p>
          </div>
          <Input label="Link URL" value={slideForm.link} onChange={e => setSlideForm(p => ({ ...p, link: e.target.value }))} />
          <Input label="Display Order" type="number" value={slideForm.order} onChange={e => setSlideForm(p => ({ ...p, order: parseInt(e.target.value) || 0 }))} />
          <div className="flex gap-2 justify-end pt-2">
            <Btn type="button" variant="secondary" onClick={() => closeModal("editSlide")}>Cancel</Btn>
            <Btn type="submit">Update Slide</Btn>
          </div>
        </form>
      </Modal>

      {/* Backup */}
      <Modal open={modals.backup} onClose={() => closeModal("backup")} title="Google Drive Backup">
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
            <p className="text-sm text-slate-300 mb-3">Back up all store data (orders, users, products, transactions) to Google Drive as a JSON file.</p>
            <ol className="text-xs text-slate-500 space-y-1 list-decimal list-inside">
              <li>Click "Get Auth URL" to open Google authorization</li>
              <li>Authorize and copy your access token</li>
              <li>Paste token below and click "Upload Backup"</li>
            </ol>
          </div>
          <Btn variant="secondary" className="w-full" onClick={handleGoogleDriveBackup}>
            <CloudUpload size={14} /> Step 1: Get Google Auth URL
          </Btn>
          <Input label="Access Token" value={backupState.token} onChange={e => setBackupState(p => ({ ...p, token: e.target.value }))} placeholder="Paste your access token…" />
          <Btn className="w-full" loading={backupState.loading} disabled={!backupState.token} onClick={handleGoogleDriveBackup}>
            <CloudUpload size={14} /> Upload Backup to Drive
          </Btn>
          <p className="text-xs text-slate-600 text-center">Requires GOOGLE_CLIENT_ID in .env + googleapis package</p>
        </div>
      </Modal>
      {/* Seller Chat Modal */}
      <Modal open={modals.sellerChat} onClose={() => closeModal("sellerChat")} title={`Chat with ${selectedItem?.name || "Seller"}`} size="lg">
        <div style={{ height: "500px" }}>
          <ChatWindow 
            receiver={selectedItem} 
            onClose={() => closeModal("sellerChat")} 
          />
        </div>
      </Modal>
    </div>
  );
};

export default AdminDashboard;