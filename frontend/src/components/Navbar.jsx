import React, { useState, useEffect, lazy, Suspense, memo, useCallback, useMemo } from 'react';
import { Link, useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import {
  ShoppingBag,
  ShoppingCart,
  Heart,
  User,
  LogOut,
  Menu,
  X,
  Search,
  Settings,
  Home,
  Package,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Lazy load heavy components
const ShowOptions = lazy(() => import('./SearchBox'));

// Predefined nav links
const NAV_LINKS = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/shop', label: 'Shop', icon: ShoppingBag },
];

// Memoized icons component for mobile
const NavIcons = memo(({ wishlistCount, cartCount, onMenuOpen, onSearchOpen }) => (
  <>
    <button
      onClick={onSearchOpen}
      className="p-2 text-gray-600 hover:text-[#088178] transition-colors"
      aria-label="Search"
    >
      <Search size={22} />
    </button>

    <Link to="/cart" className="relative p-2 text-gray-600" aria-label="Cart">
      <ShoppingCart size={22} />
      {cartCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-[#088178] text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
          {cartCount}
        </span>
      )}
    </Link>

    <Link to="/favorites" className="relative p-2 text-gray-600" aria-label="Wishlist">
      <Heart size={22} />
      {wishlistCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
          {wishlistCount}
        </span>
      )}
    </Link>

    <button
      onClick={onMenuOpen}
      className="p-2 text-gray-600 hover:text-[#088178] transition-colors"
      aria-label="Menu"
    >
      <Menu size={24} />
    </button>
  </>
));

// User Menu Component
const UserMenu = memo(({ user, isOpen, onToggle, onLogout }) => (
  <div className="relative ml-2">
    <button
      onClick={onToggle}
      className="flex items-center gap-2 p-1.5 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
      aria-label="User menu"
      aria-expanded={isOpen}
    >
      <div className="w-8 h-8 bg-gradient-to-br from-[#088178] to-teal-400 rounded-full flex items-center justify-center text-white font-bold">
        {user.name?.charAt(0).toUpperCase()}
      </div>
      <ChevronDown size={16} className="text-gray-600 mr-1" />
    </button>

    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
        >
          <div className="p-4 bg-gradient-to-r from-[#088178] to-teal-500 text-white">
            <p className="font-bold">{user.name}</p>
            <p className="text-xs opacity-90">{user.email}</p>
          </div>
          
          <div className="p-2">
            <Link
              to="/dashboard"
              onClick={onToggle}
              className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors"
            >
              <User size={18} className="text-gray-600" />
              <span className="text-sm font-medium">Dashboard</span>
            </Link>

            {user.role === 'admin' && (
              <Link
                to="/admin"
                onClick={onToggle}
                className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors"
              >
                <Settings size={18} className="text-purple-600" />
                <span className="text-sm font-medium">Admin Panel</span>
              </Link>
            )}

            {user.role === 'seller' && (
              <Link
                to="/seller"
                onClick={onToggle}
                className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors"
              >
                <Package size={18} className="text-orange-600" />
                <span className="text-sm font-medium">Seller Panel</span>
              </Link>
            )}

            <hr className="my-2 border-gray-100" />

            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 p-3 hover:bg-red-50 rounded-xl transition-colors text-red-600"
            >
              <LogOut size={18} />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
));

// Desktop Icons Component
const DesktopIcons = memo(({ user, counts, isProfileDropdownOpen, onToggleProfile, onLogout }) => (
  <div className="hidden md:flex items-center gap-3">
    {/* Desktop Navigation Links */}
    <div className="hidden md:flex items-center gap-6 lg:gap-8 mr-4">
      {NAV_LINKS.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            `font-medium transition-colors relative group ${
              isActive ? 'text-[#f7644f]' : 'text-gray-600 hover:text-[#f7644f]'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {link.label}
              <span 
                className={`absolute -bottom-1 left-0 h-0.5 bg-[#f7644f] transition-all ${
                  isActive ? 'w-full' : 'w-0 group-hover:w-full'
                }`}
              />
            </>
          )}
        </NavLink>
      ))}
    </div>

    {/* Wishlist */}
    <Link
      to="/favorites"
      className="relative p-2 text-gray-600 hover:text-red-500 transition-colors group"
      aria-label="Wishlist"
    >
      <Heart size={22} />
      {counts.wishlist > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
          {counts.wishlist}
        </span>
      )}
      <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        Wishlist
      </span>
    </Link>

    {/* Cart */}
    <Link
      to="/cart"
      className="relative p-2 text-gray-600 hover:text-[#088178] transition-colors group"
      aria-label="Cart"
    >
      <ShoppingCart size={22} />
      {counts.cart > 0 && (
        <span className="absolute -top-1 -right-1 bg-[#088178] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
          {counts.cart}
        </span>
      )}
      <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        Cart
      </span>
    </Link>

    {/* User Menu */}
    {user ? (
      <UserMenu 
        user={user}
        isOpen={isProfileDropdownOpen}
        onToggle={onToggleProfile}
        onLogout={onLogout}
      />
    ) : (
      <div className="flex items-center gap-2 ml-2">
        <Link
          to="/login"
          className="relative px-5 py-2 text-white font-medium rounded-lg shadow-xl overflow-hidden bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 animate-gradient"
          style={{ backgroundSize: '300% 300%' }}
        >
          <span className="relative z-10">Login</span>
        </Link>
      </div>
    )}
  </div>
));

// Mobile Search Component
const MobileSearch = memo(({ searchQuery, onSearchChange, onSearch, onClose, navigate }) => {
  const handleQuickSearch = useCallback((term) => {
    navigate(`/shop?search=${term}`);
    onClose();
  }, [navigate, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed inset-0 bg-white/95 backdrop-blur-md z-[60] p-4 md:hidden"
    >
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onClose}
          className="p-2 text-gray-600 hover:text-red-500 transition-colors"
          aria-label="Close search"
        >
          <X size={24} />
        </button>
        <h2 className="text-lg font-bold text-gray-800">Search Products</h2>
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder="What are you looking for?"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearch(e)}
          className="w-full p-4 pr-12 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#088178] outline-none text-lg"
          autoFocus
        />
        <button
          onClick={onSearch}
          className="absolute right-3 top-3 p-2 bg-[#088178] text-white rounded-xl"
          aria-label="Submit search"
        >
          <Search size={20} />
        </button>
      </div>

      {/* Quick Suggestions */}
      <div className="mt-6">
        <p className="text-sm text-gray-500 mb-3">Popular Searches</p>
        <div className="flex flex-wrap gap-2">
          {['Electronics', 'Fashion', 'House', 'Books', 'Toys'].map((item) => (
            <button
              key={item}
              onClick={() => handleQuickSearch(item)}
              className="px-4 py-2 bg-gray-100 rounded-full text-sm hover:bg-[#088178] hover:text-white transition-colors"
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
});

// Mobile Menu Component - FIXED with proper isActive handling
const MobileMenu = memo(({ user, counts, onClose, onLogout }) => (
  <>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-[70]"
      onClick={onClose}
    />
    
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'tween', duration: 0.3 }}
      className="fixed right-0 top-0 h-full w-80 bg-white z-[80] shadow-2xl overflow-y-auto"
    >
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <img src="/12.png" alt="Logo" className="h-10 w-full" loading="lazy" />
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {user && (
          <div className="mb-6 p-4 bg-gradient-to-r from-[#088178]/10 to-teal-50 rounded-xl border border-[#088178]/20">
            <p className="font-bold text-gray-800">{user.name}</p>
            <p className="text-sm text-gray-600">{user.email}</p>
            <p className="text-xs text-[#088178] mt-1 capitalize">{user.role}</p>
          </div>
        )}

        <div className="space-y-1">
          {/* Navigation Links */}
          <NavLink
            to="/"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 p-3 rounded-xl transition-colors ${
                isActive 
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`
            }
          >
            <Home size={20} />
            <span className="font-medium">Home</span>
          </NavLink>

          <NavLink
            to="/shop"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 p-3 rounded-xl transition-colors ${
                isActive 
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`
            }
          >
            <ShoppingBag size={20} />
            <span className="font-medium">Shop</span>
          </NavLink>

          <NavLink
            to="/favorites"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center justify-between p-3 rounded-xl transition-colors ${
                isActive 
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-3">
                  <Heart size={20} />
                  <span className="font-medium">Wishlist</span>
                </div>
                {counts.wishlist > 0 && (
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    isActive ? 'bg-white text-red-500' : 'bg-red-500 text-white'
                  }`}>
                    {counts.wishlist}
                  </span>
                )}
              </>
            )}
          </NavLink>

          <NavLink
            to="/cart"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center justify-between p-3 rounded-xl transition-colors ${
                isActive 
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-3">
                  <ShoppingCart size={20} />
                  <span className="font-medium">Cart</span>
                </div>
                {counts.cart > 0 && (
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    isActive ? 'bg-white text-red-500' : 'bg-[#088178] text-white'
                  }`}>
                    {counts.cart}
                  </span>
                )}
              </>
            )}
          </NavLink>

          {/* User Links */}
          {user ? (
            <>
              <NavLink
                to="/dashboard"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 p-3 rounded-xl transition-colors ${
                    isActive 
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`
                }
              >
                <User size={20} />
                <span className="font-medium">Dashboard</span>
              </NavLink>

              {user.role === 'admin' && (
                <NavLink
                  to="/admin"
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 p-3 rounded-xl transition-colors ${
                      isActive 
                        ? 'bg-purple-500 text-white'
                        : 'text-purple-600 hover:bg-purple-50'
                    }`
                  }
                >
                  <Settings size={20} />
                  <span className="font-medium">Admin Panel</span>
                </NavLink>
              )}

              {user.role === 'seller' && (
                <NavLink
                  to="/seller"
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 p-3 rounded-xl transition-colors ${
                      isActive 
                        ? 'bg-orange-500 text-white'
                        : 'text-orange-600 hover:bg-orange-50'
                    }`
                  }
                >
                  <Package size={20} />
                  <span className="font-medium">Seller Panel</span>
                </NavLink>
              )}

              <button
                onClick={onLogout}
                className="w-full mt-4 p-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
              >
                <LogOut size={20} />
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              onClick={onClose}
              className="block w-full p-3 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 animate-gradient text-white text-center font-bold rounded-xl hover:bg-opacity-90 transition-colors mb-2"
            >
              Log In
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  </>
));

// Main Navbar Component
const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Optimize state management
  const [uiState, setUiState] = useState({
    isScrolled: false,
    isMobileMenuOpen: false,
    isSearchOpen: false,
    isHidden: false,
    isProfileDropdownOpen: false,
    lastScrollY: 0,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [counts, setCounts] = useState({
    cart: 0,
    wishlist: 0
  });

  // Optimize scroll handler with RAF
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          
          setUiState(prev => ({
            ...prev,
            isScrolled: currentScrollY > 20,
            isHidden: currentScrollY > prev.lastScrollY + 5 && currentScrollY > 0 
              ? true 
              : currentScrollY < prev.lastScrollY - 5 ? false : prev.isHidden,
            lastScrollY: currentScrollY
          }));
          
          ticking = false;
        });
        
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update counts only when user changes
  useEffect(() => {
    if (user) {
      setCounts({
        cart: user.cart?.length || 0,
        wishlist: user.favorites?.length || 0
      });
    }
  }, [user]);

  // Memoize handlers
  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/login');
    setUiState(prev => ({ ...prev, isProfileDropdownOpen: false, isMobileMenuOpen: false }));
  }, [logout, navigate]);

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${searchQuery}`);
      setUiState(prev => ({ ...prev, isSearchOpen: false }));
      setSearchQuery('');
    }
  }, [searchQuery, navigate]);

  const handleMobileMenuOpen = useCallback(() => {
    setUiState(prev => ({ ...prev, isMobileMenuOpen: true }));
  }, []);

  const handleMobileMenuClose = useCallback(() => {
    setUiState(prev => ({ ...prev, isMobileMenuOpen: false }));
  }, []);

  const handleSearchOpen = useCallback(() => {
    setUiState(prev => ({ ...prev, isSearchOpen: true }));
  }, []);

  const handleSearchClose = useCallback(() => {
    setUiState(prev => ({ ...prev, isSearchOpen: false }));
    setSearchQuery('');
  }, []);

  const toggleProfileDropdown = useCallback(() => {
    setUiState(prev => ({ ...prev, isProfileDropdownOpen: !prev.isProfileDropdownOpen }));
  }, []);

  // Memoized class names
  const navbarClasses = useMemo(() => 
    `fixed top-0 w-full py-3 bg-white backdrop-blur-md z-50 transition-transform duration-100 ease-out shadow-md border-t border-gray-200 ${
      uiState.isHidden ? '-translate-y-14' : 'translate-y-11'
    }`,
    [uiState.isHidden]
  );

  return (
    <>
      <nav className={navbarClasses}>
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo - Optimized image loading */}
            <Link to="/" className="flex items-center">
              <img
                src="/12.png"
                alt="Devaroti Shop"
                className="h-10 w-60 object-contain"
                loading="eager"
                width="240"
                height="40"
              />
            </Link>

            {/* Desktop Search - Lazy load ShowOptions */}
            <div className="hidden md:block flex-1 max-w-md mx-6 lg:mx-8">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-5 py-2.5 bg-gray-50 border border-gray-200 rounded-full focus:ring-2 focus:ring-[#f7644f] focus:border-transparent outline-none text-sm pr-24"
                />
                <div className="absolute right-1 top-1 flex items-center gap-1">
                  <Suspense fallback={<div className="w-8 h-8" />}>
                    <ShowOptions 
                      onImageSelect={(file) => {
                        console.log('Image selected:', file);
                      }}
                      onCameraCapture={() => {
                        console.log('Camera opened');
                      }}
                    />
                  </Suspense>
                  <Search className="mr-9 p-1 m-1 text-gray-300" size={30} />
                </div>
              </form>
            </div>

            {/* Desktop Icons with Navigation */}
            <DesktopIcons 
              user={user}
              counts={counts}
              isProfileDropdownOpen={uiState.isProfileDropdownOpen}
              onToggleProfile={toggleProfileDropdown}
              onLogout={handleLogout}
            />

            {/* Mobile Icons */}
            <div className="flex md:hidden items-center gap-2">
              <NavIcons 
                wishlistCount={counts.wishlist}
                cartCount={counts.cart}
                onMenuOpen={handleMobileMenuOpen}
                onSearchOpen={handleSearchOpen}
              />
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Search Overlay */}
      <AnimatePresence>
        {uiState.isSearchOpen && (
          <MobileSearch
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearch={handleSearch}
            onClose={handleSearchClose}
            navigate={navigate}
          />
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {uiState.isMobileMenuOpen && (
          <MobileMenu
            user={user}
            counts={counts}
            onClose={handleMobileMenuClose}
            onLogout={handleLogout}
          />
        )}
      </AnimatePresence>

      {/* Spacer */}
      <div className="h-20" />
    </>
  );
};

// Add display names for better debugging
NavIcons.displayName = 'NavIcons';
DesktopIcons.displayName = 'DesktopIcons';
UserMenu.displayName = 'UserMenu';
MobileSearch.displayName = 'MobileSearch';
MobileMenu.displayName = 'MobileMenu';

export default Navbar;