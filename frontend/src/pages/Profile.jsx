import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Package,
  ShoppingBag,
  Heart,
  Clock,
  Edit2,
  Save,
  X,
  Camera,
  Award,
  TrendingUp
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from './Footer';
import { useAuth } from '../contexts/useAuth';
import { userAPI, orderAPI } from '../services/api';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    wishlistCount: 0,
    memberSince: ''
  });
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    address: '',
    location: '',
    bio: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phoneNumber: user.phoneNumber || '',
        address: user.address || '',
        location: user.location || '',
        bio: user.bio || ''
      });
    }
    fetchProfileData();
  }, [user]);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const [profileRes, ordersRes] = await Promise.all([
        userAPI.getProfile(),
        orderAPI.getMyOrders({ limit: 5 })
      ]);

      if (profileRes.data.success) {
        setUser(profileRes.data.user);
        setStats({
          totalOrders: profileRes.data.stats?.totalOrders || 0,
          totalSpent: profileRes.data.stats?.totalSpent || 0,
          wishlistCount: profileRes.data.user?.favorites?.length || 0,
          memberSince: profileRes.data.user?.createdAt
        });
      }

      if (ordersRes.data.success) {
        setOrders(ordersRes.data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile data');
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
      // Error toast already shown by api.js interceptor
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700',
      confirmed: 'bg-blue-100 text-blue-700',
      processing: 'bg-purple-100 text-purple-700',
      shipped: 'bg-indigo-100 text-indigo-700',
      delivered: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
                {user?.profilePic ? (
                  <img
                    src={user.profilePic}
                    alt={user.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <User className="text-primary" size={40} />
                )}
              </div>
              <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition">
                <Camera size={16} className="text-gray-600" />
              </button>
            </div>
            
            <div className="flex-1">
              <h1 className="text-2xl font-black text-gray-900 mb-1">
                {user?.name}
              </h1>
              <p className="text-gray-600 mb-3">{user?.email}</p>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">
                  {user?.role}
                </span>
                {user?.isVerified && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                    Verified
                  </span>
                )}
              </div>
            </div>
            
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-opacity-90 transition"
              >
                <Edit2 size={18} />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-2">
              <ShoppingBag className="text-primary" size={24} />
              <span className="text-2xl font-black text-gray-900">
                {stats.totalOrders}
              </span>
            </div>
            <p className="text-gray-600">Total Orders</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="text-green-500" size={24} />
              <span className="text-2xl font-black text-gray-900">
                ৳{stats.totalSpent.toLocaleString()}
              </span>
            </div>
            <p className="text-gray-600">Total Spent</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-2">
              <Heart className="text-red-500" size={24} />
              <span className="text-2xl font-black text-gray-900">
                {stats.wishlistCount}
              </span>
            </div>
            <p className="text-gray-600">Wishlist Items</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-2">
              <Award className="text-purple-500" size={24} />
              <span className="text-2xl font-black text-gray-900">
                {new Date(stats.memberSince).getFullYear()}
              </span>
            </div>
            <p className="text-gray-600">Member Since</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Profile Information
              </h2>

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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bio
                    </label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      rows="2"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleUpdateProfile}
                      className="flex-1 bg-primary text-white font-bold py-2 rounded-lg hover:bg-opacity-90 transition"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditing(false);
                        setFormData({
                          name: user?.name || '',
                          phoneNumber: user?.phoneNumber || '',
                          address: user?.address || '',
                          location: user?.location || '',
                          bio: user?.bio || ''
                        });
                      }}
                      className="flex-1 border border-gray-300 text-gray-700 font-bold py-2 rounded-lg hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <User className="text-gray-400 shrink-0 mt-1" size={18} />
                    <div>
                      <p className="text-sm text-gray-500">Full Name</p>
                      <p className="font-medium text-gray-900">{user?.name}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="text-gray-400 shrink-0 mt-1" size={18} />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium text-gray-900">{user?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="text-gray-400 shrink-0 mt-1" size={18} />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium text-gray-900">{user?.phoneNumber || 'Not set'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="text-gray-400 shrink-0 mt-1" size={18} />
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-medium text-gray-900">{user?.address || 'Not set'}</p>
                    </div>
                  </div>

                  {user?.location && (
                    <div className="flex items-start gap-3">
                      <MapPin className="text-gray-400 shrink-0 mt-1" size={18} />
                      <div>
                        <p className="text-sm text-gray-500">Location</p>
                        <p className="font-medium text-gray-900">{user.location}</p>
                      </div>
                    </div>
                  )}

                  {user?.bio && (
                    <div className="flex items-start gap-3">
                      <User className="text-gray-400 shrink-0 mt-1" size={18} />
                      <div>
                        <p className="text-sm text-gray-500">Bio</p>
                        <p className="font-medium text-gray-900">{user.bio}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Recent Orders
              </h2>

              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="mx-auto text-gray-300 mb-3" size={48} />
                  <p className="text-gray-500 mb-4">No orders yet</p>
                  <a
                    href="/shop"
                    className="inline-block bg-primary text-white font-bold px-6 py-3 rounded-xl hover:bg-opacity-90 transition"
                  >
                    Start Shopping
                  </a>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order._id}
                      className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                        <div>
                          <p className="text-sm text-gray-500">Order Number</p>
                          <p className="font-mono font-medium">#{order.orderNumber}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-gray-500">Date</p>
                          <p className="text-sm font-medium">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Items</p>
                          <p className="text-sm font-medium">{order.items?.length || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Payment</p>
                          <p className="text-sm font-medium">{order.paymentMethod}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Total</p>
                          <p className="text-sm font-bold text-primary">৳{order.totalPrice}</p>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button className="text-sm text-primary hover:underline">
                          View Details →
                        </button>
                      </div>
                    </div>
                  ))}

                  {orders.length >= 5 && (
                    <div className="text-center mt-4">
                      <button className="text-primary font-medium hover:underline">
                        View All Orders
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Profile;