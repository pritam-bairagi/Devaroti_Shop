import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, Truck, CheckCircle2, Clock, MapPin, 
  Navigation, DollarSign, LayoutDashboard, History,
  User, LucideLogOut, RefreshCw, Eye, Search,
  Phone, Calendar, AlertCircle, TrendingUp
} from "lucide-react";
import { useAuth } from "../contexts/useAuth";
import api from "../services/api";
import toast from "react-hot-toast";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Calculator from "../components/Calculator";
import { Calculator as CalcIcon, Camera } from "lucide-react";
import { resizeImage } from "../utils/imageUtils";
import { courierAPI, uploadAPI } from "../services/api";

const PRIMARY = '#ff5500';

const StatCard = ({ title, value, icon: Icon, color = PRIMARY, loading }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }} 
    animate={{ opacity: 1, y: 0 }}
    className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-2xl p-6 hover:border-orange-500/40 transition-all shadow-xl"
  >
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 rounded-xl" style={{ backgroundColor: color + '20' }}>
        <Icon size={24} style={{ color }} />
      </div>
    </div>
    {loading ? (
      <div className="h-8 bg-slate-700/50 rounded animate-pulse mb-1" />
    ) : (
      <p className="text-3xl font-black text-white mb-1">{value}</p>
    )}
    <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
  </motion.div>
);

const CourierPanel = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalDeliveries: 0, pendingTasks: 0, totalEarnings: 0 });
  const [deliveries, setDeliveries] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const statsRes = await api.courierAPI.getStats();
      setStats(statsRes.data.data);
      
      const delRes = await api.courierAPI.getDeliveries();
      // Map it to match the expected format used in the UI
      const formatted = delRes.data.data.map(d => ({
        _id: d._id,
        orderNumber: d.orderNumber,
        status: d.status,
        customer: d.user?.name || 'Customer',
        address: d.shippingAddress ? `${d.shippingAddress.addressLine1}, ${d.shippingAddress.city}` : 'Unknown Address',
        phone: d.shippingAddress?.phone || d.user?.phoneNumber || 'N/A',
        date: d.createdAt
      }));
      setDeliveries(formatted);
    } catch (err) {
      toast.error("Failed to fetch courier data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.courierAPI.updateDeliveryStatus(id, status);
      toast.success(`Status updated to ${status}`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    }
  };

  const tabs = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'deliveries', label: 'My Deliveries', icon: Truck },
    { id: 'earnings', label: 'Earnings', icon: History },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-orange-500/30">
      {/* Sidebar / Topbar */}
      <div className="bg-slate-800/40 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Truck size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white leading-none">COURIER CENTER</h1>
              <p className="text-[10px] font-bold text-orange-500 uppercase tracking-[0.2em] mt-1">Devaroti Shop Logistics</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={fetchData} 
              className="p-2 hover:bg-slate-700/50 rounded-xl transition-all text-slate-400 hover:text-orange-500"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <div className="h-6 w-px bg-slate-700/50 hidden sm:block" />
            <div className="flex items-center gap-3 bg-slate-700/30 px-3 py-1.5 rounded-2xl border border-slate-600/30">
              <div className="text-right hidden sm:block">
                <p className="text-[11px] font-bold text-white leading-none">{user?.name}</p>
                <p className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">Verified Courier</p>
              </div>
              <img 
                src={user?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "C")}&background=ff5500&color=fff`} 
                className="w-7 h-7 rounded-lg object-cover ring-2 ring-orange-500/20" 
                alt="Avatar"
              />
            </div>
            <button onClick={logout} className="p-2 text-slate-400 hover:text-red-500 transition-all">
              <LucideLogOut size={18} />
            </button>
          </div>
        </div>

        {/* Dynamic Tabs */}
        <div className="max-w-7xl mx-auto px-4 overflow-x-auto no-scrollbar">
          <div className="flex gap-2">
            {tabs.map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-all relative ${
                  activeTab === tab.id 
                    ? 'border-orange-500 text-orange-500' 
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                <tab.icon size={14} />
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="activeTab" 
                    className="absolute inset-0 bg-orange-500/5 -z-10 rounded-t-xl"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* ================= OVERVIEW ================= */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard title="Total Completed" value={stats.totalDeliveries} icon={CheckCircle2} color="#10b981" loading={loading} />
              <StatCard title="Active Tasks" value={stats.pendingTasks} icon={Clock} color="#f59e0b" loading={loading} />
              <StatCard title="Wallet Balance" value={`৳${stats.totalEarnings}`} icon={DollarSign} color="#ff5500" loading={loading} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Active Task List Snippet */}
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Navigation size={18} className="text-orange-500" />
                    Priority Deliveries
                  </h3>
                  <button onClick={() => setActiveTab('deliveries')} className="text-xs font-bold text-orange-500 hover:underline">See All</button>
                </div>
                <div className="space-y-4">
                  {deliveries.filter(d => d.status !== 'delivered').map(d => (
                    <div key={d._id} className="bg-slate-900/50 border border-slate-700/30 p-4 rounded-2xl flex items-center justify-between group transition-all hover:bg-slate-800/50">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                          <Package size={24} />
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm">{d.orderNumber}</p>
                          <p className="text-xs text-slate-400 flex items-center gap-1">
                            <MapPin size={10} /> {d.address}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${
                          d.status === 'out-for-delivery' ? 'bg-orange-500/20 text-orange-500' : 'bg-blue-500/20 text-blue-500'
                        }`}>
                          {d.status.replace(/-/g, ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Earnings Small Analytics */}
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <TrendingUp size={18} className="text-emerald-500" />
                    Performance Analytics
                  </h3>
                </div>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[
                      { day: 'Mon', deliveries: 12 }, { day: 'Tue', deliveries: 18 },
                      { day: 'Wed', deliveries: 15 }, { day: 'Thu', deliveries: 25 },
                      { day: 'Fri', deliveries: 22 }, { day: 'Sat', deliveries: 30 },
                      { day: 'Sun', deliveries: 10 },
                    ]}>
                      <defs>
                        <linearGradient id="colorDl" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis dataKey="day" stroke="#94a3b8" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }} />
                      <Area type="monotone" dataKey="deliveries" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorDl)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= DELIVERIES ================= */}
        {activeTab === 'deliveries' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-2xl font-black text-white">Logistics Management</h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input 
                    type="text" 
                    placeholder="Search by Order ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-2xl pl-10 pr-4 py-2 text-sm focus:border-orange-500 outline-none w-64"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {deliveries.filter(d => !searchQuery || d.orderNumber.includes(searchQuery)).map(d => (
                <motion.div 
                  key={d._id} 
                  layout
                  className="bg-slate-800/50 border border-slate-700/50 rounded-3xl overflow-hidden group shadow-xl"
                >
                  <div className="p-5 border-b border-slate-700/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center">
                        <Package size={20} className="text-orange-500" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white">{d.orderNumber}</h4>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">{new Date(d.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <button className="p-2 hover:bg-slate-700 rounded-xl transition-all text-slate-400">
                      <Eye size={16} />
                    </button>
                  </div>
                  
                  <div className="p-5 space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <User size={14} className="text-slate-500 mt-1" />
                        <div>
                          <p className="text-xs font-bold text-white">{d.customer}</p>
                          <p className="text-[10px] text-slate-500">Customer</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin size={14} className="text-slate-500 mt-1" />
                        <div>
                          <p className="text-xs font-bold text-white">{d.address}</p>
                          <p className="text-[10px] text-slate-500">Drop-off Point</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Phone size={14} className="text-slate-500 mt-1" />
                        <div>
                          <p className="text-xs font-bold text-white">{d.phone}</p>
                          <p className="text-[10px] text-slate-500">Contact</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Update Delivery Progress</p>
                      <div className="flex gap-2">
                        {d.status === 'shipped' && (
                          <button 
                            onClick={() => handleUpdateStatus(d._id, 'out-for-delivery')}
                            className="flex-1 bg-orange-500 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
                          >
                            Set Out for Delivery
                          </button>
                        )}
                        {d.status === 'out-for-delivery' && (
                          <button 
                            onClick={() => handleUpdateStatus(d._id, 'delivered')}
                            className="flex-1 bg-emerald-500 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                          >
                            Mark as Delivered
                          </button>
                        )}
                        {d.status === 'delivered' && (
                          <div className="flex-1 bg-slate-900 border border-emerald-500/30 text-emerald-500 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                            <CheckCircle2 size={14} /> Completed
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ================= EARNINGS ================= */}
        {activeTab === 'earnings' && (
          <div className="space-y-6">
             <div className="bg-slate-800 border border-slate-700 rounded-3xl p-8 relative overflow-hidden">
               <div className="relative z-10">
                 <p className="text-slate-400 font-bold uppercase text-xs tracking-widest mb-2">Wallet Summary</p>
                 <h2 className="text-5xl font-black text-white mb-6">৳8,520.00</h2>
                 <div className="flex gap-4">
                    <button className="bg-orange-500 text-white px-6 py-3 rounded-2xl font-bold text-sm hover:scale-105 transition-transform shadow-xl shadow-orange-500/30">
                      Withdraw Funds
                    </button>
                    <button className="bg-slate-700 text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-slate-600 transition-all">
                      Billing History
                    </button>
                 </div>
               </div>
               {/* Decorative background circle */}
               <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
             </div>

             <div className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-6">
               <h3 className="font-bold mb-6">Recent Payouts</h3>
               <div className="space-y-3">
                 {[...Array(5)].map((_, i) => (
                   <div key={i} className="flex items-center justify-between p-4 bg-slate-900/30 rounded-2xl border border-slate-700/20">
                     <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                         <DollarSign size={20} />
                       </div>
                       <div>
                         <p className="text-sm font-bold text-white">Delivery Commission #443{i}</p>
                         <p className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">OCT {20-i}, 2026 • SUCCESS</p>
                       </div>
                     </div>
                     <p className="text-sm font-black text-emerald-500">+৳60.00</p>
                   </div>
                 ))}
               </div>
             </div>
          </div>
        )}

        {/* ================= PROFILE ================= */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl mx-auto space-y-6 text-center">
            <div className="relative inline-block group">
              <img 
                src={user?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "C")}&background=ff5500&color=fff&size=128`} 
                className="w-32 h-32 rounded-3xl object-cover ring-4 ring-orange-500/20 shadow-2xl mx-auto group-hover:ring-orange-500 transition-all" 
                alt="Profile"
              />
              <label className="absolute -bottom-2 -right-2 bg-orange-500 p-2 rounded-xl text-white shadow-lg cursor-pointer hover:bg-orange-600 active:scale-95 transition-all">
                <Camera size={20} />
                <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                   const file = e.target.files[0];
                   if (!file) return;
                   const loadingToast = toast.loading('Resizing & Uploading...');
                   try {
                      const resized = await resizeImage(file, { maxSizeKB: 512, maxWidth: 512, maxHeight: 512 });
                      const fd = new FormData();
                      fd.append('images', resized);
                      const res = await uploadAPI.uploadImages(fd);
                      if (res.data.success) {
                         const newPic = res.data.urls[0];
                         await courierAPI.updateProfile({ profilePic: newPic });
                         toast.success('Profile updated!', { id: loadingToast });
                         window.location.reload();
                      }
                   } catch (err) {
                      toast.error('Failed to upload', { id: loadingToast });
                   }
                }} />
              </label>
            </div>
            
            <div>
              <h2 className="text-3xl font-black text-white">{user?.name}</h2>
              <p className="text-orange-500 font-bold uppercase tracking-widest text-xs mt-2">Logistics Specialist</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
              <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
                <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Email Address</p>
                <p className="text-sm font-bold text-white">{user?.email}</p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
                <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Phone Number</p>
                <p className="text-sm font-bold text-white">{user?.phoneNumber || 'Not provided'}</p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
                <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Joined Date</p>
                <p className="text-sm font-bold text-white">{new Date(user?.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
                <p className="text-[10px] font-black text-slate-500 uppercase mb-1">NID Verified</p>
                <p className="text-sm font-bold text-emerald-500 flex items-center gap-1">
                  <CheckCircle2 size={14} /> Yes
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button className="flex-1 bg-slate-700 text-white py-4 rounded-2xl font-bold hover:bg-slate-600 transition-all border border-slate-600">
                Edit Settings
              </button>
              <button onClick={logout} className="flex-1 bg-red-500/10 text-red-500 py-4 rounded-2xl font-bold hover:bg-red-500/20 transition-all border border-red-500/20">
                Sign Out
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Calculator Overlay Placeholder */}
      <motion.button 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-8 right-8 w-14 h-14 bg-white text-slate-900 rounded-2xl shadow-2xl flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all group z-[100]"
      >
        <span className="text-xl font-bold group-hover:scale-125 transition-transform">∑</span>
      </motion.button>
    </div>
  );
};

export default CourierPanel;
