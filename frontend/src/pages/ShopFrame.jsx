// ShopFrame.jsx - Navigation, Categories, and Filter Components
import React, { useState, useCallback, useMemo, memo } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { 
  Smartphone, Tag, BookOpen, Star, X, Heart, ShoppingCart, 
  User, Settings, LogOut, Package, House, Search, Menu, Filter,
  ChevronDown, LogIn, Flame, Zap, Gift, Truck, Gem, Sparkles,
  Crown, Award, TrendingUp, Clock, Shield, Star as StarIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { debounce } from 'lodash';

// ==================== CONSTANTS ====================
export const CATEGORIES = [
  {
    id: "electronics", label: "Electronics", icon: <Smartphone size={16} />,
    sub: [
      { name: "Mobile Phones", count: 120, slug: "mobile-phones" }, 
      { name: "Laptops", count: 80, slug: "laptops" },
      { name: "Desktops", count: 120, slug: "desktops" },
      { name: "Circuit Boards", count: 80, slug: "circuit-boards" },
      { name: "Cable / Connectors", count: 120, slug: "cables" },
      { name: "Accessories", count: 80, slug: "accessories" },
      { name: "Headphones", count: 150, slug: "headphones" },
      { name: "Cameras", count: 60, slug: "cameras" }
    ]
  },
  {
    id: "fashion", label: "Fashion", icon: <Tag size={16} />,
    sub: [
      { name: "Dress", count: 300, slug: "dress" },
      { name: "Shoes", count: 60, slug: "shoes" },
      { name: "Jewelry", count: 50, slug: "jewelry" },
      { name: "Perfume", count: 87, slug: "perfume" },
      { name: "Cosmetics", count: 50, slug: "cosmetics" },
      { name: "Glasses", count: 87, slug: "glasses" },
      { name: "Bags", count: 50, slug: "bags" },
      { name: "Watch", count: 87, slug: "watches" }
    ]
  },
  {
    id: "books", label: "Books", icon: <BookOpen size={16} />,
    sub: [
      { name: "Fiction", count: 300, slug: "fiction" },
      { name: "Non-Fiction", count: 60, slug: "non-fiction" },
      { name: "Religion", count: 300, slug: "religion" },
      { name: "PDF", count: 60, slug: "pdf" },
      { name: "Academic", count: 50, slug: "academic" },
      { name: "Children", count: 87, slug: "children" }
    ]
  },
  {
    id: "pujarUporikoron",
    label: "পূজার উপকরণ",
    icon: <Star size={16} />,
    sub: [
      { name: "চন্দন গুঁড়া / চন্দন পেস্ট", count: 120, slug: "chandan" },
      { name: "কস্তুরী / সুগন্ধি দ্রব্য", count: 80, slug: "kasturi" },
      { name: "ধূপকাঠি / ধুনো", count: 200, slug: "dhup" },
      { name: "প্রদীপ / মাটির দীপ / পিতলের প্রদীপ", count: 150, slug: "pradip" },
      { name: "তুলোর বাতি", count: 120, slug: "bati" },
      { name: "পূজার থালা / পিতলের পাত্র", count: 100, slug: "thala" },
      { name: "ঘণ্টা / শঙ্খ", count: 60, slug: "ghanta" },
      { name: "ফল (কলা, আপেল, নারকেল)", count: 200, slug: "fol" },
      { name: "দুধ / দই / ঘি/ মধু", count: 150, slug: "dudh" },
      { name: "মিষ্টি / পায়েস / ক্ষীর", count: 120, slug: "mishti" },
      { name: "মধুপর্ক (মধু, দই, ঘি, দুধ, চিনি)", count: 70, slug: "modhuporko" },
      { name: "ফুল (জবা, গাঁদা, পদ্ম)", count: 200, slug: "ful" },
      { name: "পাতা (বেল, তুলসী, জগডুমুর)", count: 150, slug: "pata" },
      { name: "শাড়ি / ধুতি / উত্তরি / পাঞ্জাবি", count: 90, slug: "sharee" },
      { name: "গুড় / চিনি", count: 80, slug: "gur" },
      { name: "আচমনীয় জল / গঙ্গা জল", count: 50, slug: "achmaniya" },
      { name: "অর্ঘ্য দ্রব্য (ফুল, চাল, দই, দূর্বা)", count: 100, slug: "orgho" },
      { name: "সিঁদুর / হলুদ / মেহেদী / কুমকুম", count: 150, slug: "sindur" },
      { name: "পঞ্চগব্য / পঞ্চামৃত", count: 40, slug: "panchgobbo" },
      { name: "যজ্ঞের উপকরণ", count: 40, slug: "jojno" }
    ]
  },
];

// Fixed NAV_LINKS with proper icons
export const NAV_LINKS = [
  { name: "Home", path: "/", icon: <House size={14} />, color: "#ff5500" },
  { name: "Discounts", path: "/discounts", icon: <Flame size={14} />, color: "#ef4444" },
  { name: "Flash Sale", path: "/flash-sale", icon: <Zap size={14} />, color: "#f59e0b" },
  { name: "Wholesale", path: "/wholesale", icon: <Package size={14} />, color: "#10b981" },
  { name: "Buy 1 Get 1", path: "/bogo", icon: <Gift size={14} />, color: "#ec4899" },
  { name: "1-99 shop", path: "/ninety-nine", icon: <Tag size={14} />, color: "#06b6d4" },
  { name: "Hot Offers", path: "/hot-offers", icon: <TrendingUp size={14} />, color: "#ff5500" },
  { name: "GiveWays", path: "/giveaways", icon: <Sparkles size={14} />, color: "#8b5cf6" }
];

export const FILTER_GROUPS = {
  brand: { 
    label: "Brand", 
    options: ["Local", "National", "Traditional", "Professional", "International", "Devotional", "Global", "Exclusive", "Experimental", "Imported"],
    // icons: { Local: "🇧🇩", National: "🇮🇳", International: "🌍", Global: "🌎" }
  },
  material: { 
    label: "Material", 
    options: ["Aluminum", "Glass", "Wood", "Fabric", "Fiber", "Steel", "Copper", "Bronze", "Silver", "Gold"],
    // icons: { Gold: "🥇", Silver: "🥈", Bronze: "🥉" }
  },
  color: { 
    label: "Color", 
    options: ["Black", "White", "Red", "Green", "Blue", "Silver", "Gold", "Purple", "Yellow", "Orange", "Pink", "Other"],
    colorCodes: { Black: "#000", White: "#fff", Red: "#ef4444", Green: "#10b981", Blue: "#3b82f6", Silver: "#94a3b8", Gold: "#fbbf24", Purple: "#8b5cf6", Yellow: "#eab308", Orange: "#f97316", Pink: "#ec4899", Other: "#6b7280" }
  },
  area: { 
    label: "Area", 
    options: ["Dhaka", "Chittagong", "Khulna", "Rajshahi", "Rangpur", "Sylhet", "Mymensingh", "Cumilla", "Barisal"],
    // icons: { Dhaka: "🏙️", Chittagong: "🏖️", Sylhet: "⛰️" }
  },
};

// ==================== ENHANCED STAR RATING COMPONENT ====================
const StarRating = memo(({ rating, onRate, showText = true, size = 20, interactive = true }) => {
  const [hover, setHover] = useState(0);
  
  const handleRate = useCallback((star) => {
    if (interactive && onRate) {
      onRate(star === rating ? 0 : star);
    }
  }, [rating, onRate, interactive]);
  
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => handleRate(star)}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
          className={`focus:outline-none transition-transform hover:scale-110 ${!interactive ? 'cursor-default' : ''}`}
          disabled={!interactive}
        >
          <StarIcon
            size={size}
            className={`transition-all duration-200 ${
              (hover || rating) >= star
                ? "fill-orange-500 text-orange-500 drop-shadow-sm"
                : "text-gray-300 fill-none"
            }`}
          />
        </button>
      ))}
      {showText && rating > 0 && (
        <motion.span 
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xs text-gray-500 ml-2 font-medium"
        >
          {rating.toFixed(1)} ({getRatingLabel(rating)})
        </motion.span>
      )}
    </div>
  );
});

// Helper function to get rating label
const getRatingLabel = (rating) => {
  if (rating >= 4.5) return "Excellent";
  if (rating >= 4) return "Very Good";
  if (rating >= 3.5) return "Good";
  if (rating >= 3) return "Average";
  return "Below Average";
};

// ==================== ADVANCED RATING FILTER ====================
export const RatingFilter = memo(({ rating, setRating, onReset, counts = {} }) => {
  const stars = [
    { value: 5, label: "5*", min: 5, max: 5 },
    { value: 4, label: "4*+", min: 4, max: 5 },
    { value: 3, label: "3*+", min: 3, max: 5 },
    { value: 2, label: "2*+", min: 2, max: 5 },
    { value: 1, label: "1*+", min: 1, max: 5 }
  ];
  
  const handleRatingChange = useCallback((value) => {
    setRating(rating === value ? 0 : value);
  }, [rating, setRating]);
  
  return (
    <div className="py-3 flex flex-col gap-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
          <Star size={14} className="text-orange-500 fill-orange-500" />
          Customer Rating
        </h3>
        {rating > 0 && (
          <button 
            onClick={onReset}
            className="text-xs text-orange-500 hover:text-orange-600 font-medium transition"
          >
            Clear
          </button>
        )}
      </div>
      
      <div className="space-y-2">
        {stars.map((star) => (
          <motion.div 
            key={star.value}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleRatingChange(star.value)}
            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
              rating === star.value 
                ? 'bg-orange-50 border border-orange-200 shadow-sm' 
                : 'hover:bg-gray-50 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  className={`${i < star.value ? 'fill-orange-500 text-orange-500' : 'text-gray-300 fill-none'}`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-700 flex-1">{star.label}</span>
            {counts[star.value] > 0 && (
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {counts[star.value]}
              </span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
});

// ==================== OPTIMIZED HEADER COMPONENT ====================
export const Header = memo(({ 
  cartCount = 0, 
  wishCount = 0, 
  onMenuOpen, 
  searchQuery = "", 
  setSearchQuery, 
  user = null, 
  onLogout, 
  onMobileMenuOpen,
  onSearch 
}) => {
  const [searchFocused, setSearchFocused] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  
  // Debounced search handler
  const debouncedSearch = useMemo(
    () => debounce((value) => {
      if (onSearch) onSearch(value);
    }, 300),
    [onSearch]
  );
  
  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    if (setSearchQuery) setSearchQuery(value);
    debouncedSearch(value);
  }, [setSearchQuery, debouncedSearch]);
  
  const handleSearchSubmit = useCallback((e) => {
    e.preventDefault();
    if (searchQuery && onSearch) {
      onSearch(searchQuery);
      navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
    }
  }, [searchQuery, onSearch, navigate]);
  
  return (
    <header className="sticky top-0 z-40 bg-white shadow-md">
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white text-xs py-2 px-4 hidden sm:flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Truck size={12} />
            Free delivery on orders above <b className="text-orange-400 mx-1">৳ 5,000</b>
          </span>
          <span className="flex items-center gap-1">
            <Shield size={12} />
            Secure Payment
          </span>
        </div>
        <div className="flex gap-6">
          <a href="/track-order" className="hover:text-orange-400 transition flex items-center gap-1">
            <Package size={12} /> Track Order
          </a>
          <a href="/become-seller" className="hover:text-orange-400 transition flex items-center gap-1">
            <Store size={12} /> Become a Seller
          </a>
          <a href="/help" className="hover:text-orange-400 transition flex items-center gap-1">
            <Headset size={12} /> Help
          </a>
        </div>
      </div>
      
      {/* Main Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3 lg:gap-6">
          {/* Mobile Menu Button */}
          <button 
            onClick={onMenuOpen} 
            className="lg:hidden p-2 rounded-lg bg-orange-50 hover:bg-orange-100 transition text-orange-600"
            aria-label="Menu"
          >
            <Menu size={20} />
          </button>

          {/* Logo */}
          <Link to="/" className="flex-shrink-0" aria-label="Devaroti Shop - Home">
            <div className="flex items-center gap-1">
              <img 
                className="w-8 h-8 block md:hidden" 
                src="/10.png" 
                alt="Devaroti Shop" 
                width="32" 
                height="32"
                loading="eager"
              />
              <img 
                className="h-8 hidden sm:block" 
                src="/12.png" 
                alt="Devaroti Shop" 
                width="auto" 
                height="32"
                loading="eager"
              />
            </div>
          </Link>

          {/* Enhanced Search Bar */}
          <form onSubmit={handleSearchSubmit} className={`relative flex-1 flex items-center border-2 rounded-xl overflow-hidden transition-all duration-200 ${
            searchFocused ? "border-orange-400 shadow-lg shadow-orange-100 ring-2 ring-orange-200" : "border-gray-200"
          }`}>
            <select className="hidden md:block bg-gray-50 border-r border-gray-200 px-4 py-2.5 text-sm text-gray-600 font-medium focus:outline-none cursor-pointer hover:bg-gray-100 transition">
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>

            <input
              type="search"
              placeholder="Search products by name, category, or brand..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="flex-1 w-full px-5 py-2.5 text-sm text-gray-700 focus:outline-none bg-white"
              aria-label="Search products"
            />

            <button 
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 cursor-pointer text-orange-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition"
              aria-label="Search"
            >
              <Search size={18} />
            </button>
          </form>

          {/* Desktop Navigation Actions */}
          <div className="hidden md:flex items-center gap-6">
            {/* Wishlist */}
            <Link to="/favorites" className="relative hover:text-orange-500 transition group">
              <Heart size={22} className="group-hover:scale-110 transition-transform" />
              {wishCount > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-lg"
                >
                  {wishCount}
                </motion.span>
              )}
            </Link>
            
            {/* Cart */}
            <Link to="/cart" className="relative hover:text-orange-500 transition group">
              <ShoppingCart size={24} className="group-hover:scale-110 transition-transform" />
              {cartCount > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-lg"
                >
                  {cartCount}
                </motion.span>
              )}
            </Link>

            {/* User Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-orange-50 transition group"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold shadow-md">
                    {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                  </div>
                  <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
                    >
                      <div className="p-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white">
                        <p className="font-bold text-lg">{user.name || 'User'}</p>
                        <p className="text-xs opacity-90 mt-1">{user.email}</p>
                      </div>
                      
                      <div className="p-2">
                        <Link
                          to="/dashboard"
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-3 p-3 hover:bg-orange-50 rounded-xl transition-colors"
                        >
                          <User size={18} className="text-orange-500" />
                          <div>
                            <p className="text-sm font-medium">Dashboard</p>
                            <p className="text-xs text-gray-400">Manage your account</p>
                          </div>
                        </Link>

                        {user.role === 'admin' && (
                          <Link
                            to="/admin"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 p-3 hover:bg-purple-50 rounded-xl transition-colors"
                          >
                            <Settings size={18} className="text-purple-600" />
                            <div>
                              <p className="text-sm font-medium">Admin Panel</p>
                              <p className="text-xs text-gray-400">Manage store</p>
                            </div>
                          </Link>
                        )}

                        {user.role === 'seller' && (
                          <Link
                            to="/seller"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 p-3 hover:bg-orange-50 rounded-xl transition-colors"
                          >
                            <Package size={18} className="text-orange-600" />
                            <div>
                              <p className="text-sm font-medium">Seller Panel</p>
                              <p className="text-xs text-gray-400">Manage products & orders</p>
                            </div>
                          </Link>
                        )}

                        <hr className="my-2 border-gray-100" />

                        <button
                          onClick={() => {
                            setIsOpen(false);
                            onLogout();
                          }}
                          className="w-full flex items-center gap-3 p-3 hover:bg-red-50 rounded-xl transition-colors text-red-600"
                        >
                          <LogOut size={18} />
                          <div>
                            <p className="text-sm font-medium">Logout</p>
                            <p className="text-xs text-gray-400">Sign out of your account</p>
                          </div>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-6 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:from-orange-600 hover:to-amber-600 transition-all duration-200 flex items-center gap-2"
              >
                <LogIn size={16} /> Sign In
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={onMobileMenuOpen} 
            className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
            aria-label="Menu"
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* Navigation Links Bar */}
      <nav className="hidden lg:block bg-gradient-to-r from-orange-50 to-amber-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <ul className="flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.name}>
                <NavLink
                  to={link.path}
                  className={({ isActive }) => `
                    flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all duration-200 rounded-lg m-1
                    ${isActive 
                      ? 'bg-orange-500 text-white shadow-md' 
                      : 'text-gray-700 hover:bg-orange-100 hover:text-orange-600'
                    }
                  `}
                >
                  <span style={{ color: link.color }}>{link.icon}</span>
                  {link.name}
                  {link.name === "Flash Sale" && (
                    <motion.span 
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"
                    />
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  );
});

// ==================== OPTIMIZED MOBILE MENU ====================
export const MobileMenu = memo(({ open, onClose, categories = CATEGORIES, navLinks = NAV_LINKS }) => {
  const [expanded, setExpanded] = useState(null);
  
  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />
        )}
      </AnimatePresence>
      
      <motion.aside 
        initial={{ x: '-100%' }}
        animate={{ x: open ? 0 : '-100%' }}
        transition={{ type: 'spring', damping: 20 }}
        className="fixed top-0 left-0 h-full w-80 bg-white z-50 shadow-2xl overflow-y-auto"
      >
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white sticky top-0">
          <div>
            <span className="font-black text-lg">DEVAROTI SHOP</span>
            <p className="text-xs opacity-90">Your Trusted Store</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-white/20 rounded-lg transition"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>
        
        <ul className="py-2">
          {navLinks.map(link => (
            <li key={link.name} className="border-b border-gray-100">
              <NavLink
                to={link.path}
                onClick={onClose}
                className={({ isActive }) => `
                  flex items-center gap-3 px-5 py-3 text-sm transition-all
                  ${isActive 
                    ? 'bg-orange-50 text-orange-600 font-semibold border-l-4 border-orange-500' 
                    : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <span style={{ color: link.color }}>{link.icon}</span>
                {link.name}
              </NavLink>
            </li>
          ))}
        </ul>
        
        <div className="px-5 py-4 bg-gray-50 border-t border-gray-200">
          <p className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Tag size={12} /> All Categories
          </p>
          {categories.map(cat => (
            <div key={cat.id} className="mb-2">
              <button 
                onClick={() => setExpanded(expanded === cat.id ? null : cat.id)}
                className="w-full flex items-center justify-between py-2.5 text-sm text-gray-700 hover:text-orange-600 transition group"
              >
                <span className="flex items-center gap-2 group-hover:gap-3 transition-all">
                  {cat.icon} 
                  <span className="font-medium">{cat.label}</span>
                </span>
                <motion.span 
                  animate={{ rotate: expanded === cat.id ? 180 : 0 }}
                  className="text-gray-400 text-lg"
                >
                  {expanded === cat.id ? "−" : "+"}
                </motion.span>
              </button>
              
              <AnimatePresence>
                {expanded === cat.id && (
                  <motion.ul
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="ml-6 mb-2 overflow-hidden"
                  >
                    {cat.sub.map(s => (
                      <li 
                        key={s.name} 
                        className="flex justify-between py-2 text-xs text-gray-500 hover:text-orange-500 cursor-pointer border-b border-gray-100 last:border-0 transition"
                      >
                        <span>{s.name}</span>
                        <span className="text-gray-400 text-[10px]">{s.count}</span>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </motion.aside>
    </>
  );
});

// ==================== ADVANCED FILTER SIDEBAR ====================
export const FilterSidebar = memo(({ 
  filters = {}, 
  setFilters, 
  priceRange = [0, 999999], 
  setPriceRange, 
  rating = '', 
  setRating,
  ratingCounts = {},
  onClose, 
  isMobile = false,
  sortBy = '',
  setSortBy
}) => {
  const [expanded, setExpanded] = useState(Object.keys(FILTER_GROUPS));
  const [localPriceMin, setLocalPriceMin] = useState(priceRange[0]);
  const [localPriceMax, setLocalPriceMax] = useState(priceRange[1]);

  const toggleFilter = useCallback((group, value) => {
    setFilters(prev => {
      const current = prev[group] || [];
      const updated = current.includes(value) 
        ? current.filter(v => v !== value) 
        : [...current, value];
      return { ...prev, [group]: updated };
    });
  }, [setFilters]);

  const clearAll = useCallback(() => { 
    setFilters({}); 
    setPriceRange([0, 999999]);
    if (setRating) setRating('');
    if (setSortBy) setSortBy('');
  }, [setFilters, setPriceRange, setRating, setSortBy]);
  
  const resetRating = useCallback(() => {
    if (setRating) setRating('');
  }, [setRating]);
  
  const applyPriceRange = useCallback(() => {
    setPriceRange([localPriceMin, localPriceMax]);
  }, [localPriceMin, localPriceMax, setPriceRange]);
  
  const activeCount = Object.values(filters).flat().length + (rating ? 1 : 0);

  const sortOptions = [
    { value: 'newest', label: 'Newest First', icon: '🆕' },
    { value: 'price_asc', label: 'Price: Low to High', icon: '💰' },
    { value: 'price_desc', label: 'Price: High to Low', icon: '💸' },
    { value: 'rating', label: 'Highest Rated', icon: '⭐' },
    { value: 'popular', label: 'Most Popular', icon: '🔥' },
    { value: 'discount', label: 'Biggest Discount', icon: '🎯' }
  ];

  return (
    <div className="bg-white h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-orange-500" />
          <span className="font-bold text-gray-800">Filters & Sort</span>
          {activeCount > 0 && (
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-bold"
            >
              {activeCount}
            </motion.span>
          )}
        </div>
        <div className="flex gap-3">
          {activeCount > 0 && (
            <button 
              onClick={clearAll} 
              className="text-xs text-orange-500 hover:text-orange-600 font-medium transition px-2 py-1 hover:bg-orange-50 rounded-lg"
            >
              Clear all
            </button>
          )}
          {isMobile && (
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1">
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Sort By Section */}
      {setSortBy && (
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
            <TrendingUp size={14} /> Sort By
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {sortOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setSortBy(option.value === sortBy ? '' : option.value)}
                className={`px-3 py-2 text-xs rounded-lg transition-all flex items-center gap-2 justify-center ${
                  sortBy === option.value
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>{option.icon}</span>
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Price Range</h3>
        <div className="flex gap-3 items-center">
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">Min (৳)</label>
            <input 
              type="number" 
              value={localPriceMin} 
              onChange={e => setLocalPriceMin(+e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-200"
              placeholder="Min"
              min="0"
            />
          </div>
          <span className="text-gray-400 text-sm mt-4">—</span>
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">Max (৳)</label>
            <input 
              type="number" 
              value={localPriceMax} 
              onChange={e => setLocalPriceMax(+e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-200"
              placeholder="Max"
            />
          </div>
        </div>
        <button 
          onClick={applyPriceRange}
          className="w-full mt-3 px-4 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition font-medium"
        >
          Apply Price Range
        </button>
      </div>

      {/* Rating Filter */}
      <div className="px-5 py-4 border-b border-gray-100">
        <RatingFilter 
          rating={rating} 
          setRating={setRating} 
          onReset={resetRating}
          counts={ratingCounts}
        />
      </div>

      {/* Availability */}
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Clock size={14} /> Availability
        </h3>
        <div className="grid grid-cols-1 gap-2">
          {["In Stock", "Pre Order", "Up Coming", "Limited Edition"].map(opt => (
            <label key={opt} className="flex items-center gap-2 py-1.5 cursor-pointer group">
              <input 
                type="checkbox" 
                className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500 focus:ring-offset-0"
                onChange={() => toggleFilter("availability", opt)} 
                checked={(filters.availability || []).includes(opt)} 
              />
              <span className="text-sm text-gray-600 group-hover:text-gray-900 transition">{opt}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Filter Groups */}
      {Object.entries(FILTER_GROUPS).map(([key, group]) => (
        <div key={key} className="border-b border-gray-100">
          <button 
            onClick={() => setExpanded(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])}
            className="w-full flex items-center justify-between px-5 py-3 hover:bg-orange-50 transition"
          >
            <span className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
              {key === 'brand' && <Crown size={14} />}
              {key === 'material' && <Gem size={14} />}
              {key === 'color' && <Palette size={14} />}
              {key === 'area' && <MapPin size={14} />}
              {group.label}
            </span>
            <motion.span 
              animate={{ rotate: expanded.includes(key) ? 180 : 0 }}
              className="text-gray-400 text-lg"
            >
              {expanded.includes(key) ? "−" : "+"}
            </motion.span>
          </button>
          
          <AnimatePresence>
            {expanded.includes(key) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-4 pt-1 grid grid-cols-1 gap-2">
                  {group.options.map(opt => (
                    <label key={opt} className="flex items-center gap-2 py-1 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                        onChange={() => toggleFilter(key, opt)}
                        checked={(filters[key] || []).includes(opt)} 
                      />
                      <span className="text-sm text-gray-600 group-hover:text-gray-900 transition flex items-center gap-1">
                        {group.icons?.[opt] && <span>{group.icons[opt]}</span>}
                        {group.colorCodes?.[opt] && (
                          <span 
                            className="w-3 h-3 rounded-full inline-block" 
                            style={{ backgroundColor: group.colorCodes[opt] }}
                          />
                        )}
                        {opt}
                      </span>
                    </label>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
});

// ==================== OPTIMIZED CATEGORY SIDEBAR ====================
export const CategorySidebar = memo(({ categories = CATEGORIES, activeCat, setActiveCat, onCategorySelect }) => {
  const handleCategoryClick = useCallback((catId) => {
    setActiveCat(activeCat === catId ? null : catId);
  }, [activeCat, setActiveCat]);
  
  const handleSubCategoryClick = useCallback((subSlug, subName) => {
    if (onCategorySelect) {
      onCategorySelect(subSlug, subName);
    }
  }, [onCategorySelect]);
  
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="px-5 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white">
        <h2 className="font-bold text-sm flex items-center gap-2">
          <Tag size={16} /> Shop by Category
        </h2>
      </div>
      
      {categories.map(cat => (
        <div key={cat.id} className="border-b border-gray-100 last:border-0">
          <button 
            onClick={() => handleCategoryClick(cat.id)}
            className="w-full flex items-center justify-between px-5 py-3 hover:bg-orange-50 transition text-left group"
          >
            <span className="flex items-center gap-2.5 text-sm text-gray-700 font-medium group-hover:text-orange-600">
              <span className="text-orange-500">{cat.icon}</span>
              {cat.label}
            </span>
            <motion.span 
              animate={{ rotate: activeCat === cat.id ? 180 : 0 }}
              className="text-xs text-gray-400 group-hover:text-orange-500"
            >
              {activeCat === cat.id ? "−" : "+"}
            </motion.span>
          </button>
          
          <AnimatePresence>
            {activeCat === cat.id && (
              <motion.ul
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-gray-50 border-t border-gray-100 overflow-hidden"
              >
                {cat.sub.map(s => (
                  <li 
                    key={s.name} 
                    onClick={() => handleSubCategoryClick(s.slug, s.name)}
                    className="flex justify-between px-7 py-2.5 text-xs text-gray-600 hover:text-orange-500 cursor-pointer hover:bg-white transition border-b border-gray-100 last:border-0 group"
                  >
                    <span className="group-hover:translate-x-1 transition-transform">{s.name}</span>
                    <span className="text-gray-300 text-[10px]">{s.count}</span>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
});

// Import missing icons
import { Headset, Store, MapPin, Palette } from 'lucide-react';

export default {
  CATEGORIES,
  NAV_LINKS,
  FILTER_GROUPS,
  StarRating,
  RatingFilter,
  Header,
  MobileMenu,
  FilterSidebar,
  CategorySidebar
};