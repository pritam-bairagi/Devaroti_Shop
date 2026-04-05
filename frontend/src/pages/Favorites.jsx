import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ShoppingCart, X, Trash2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/useAuth';
import { userAPI } from '../services/api';
import toast from 'react-hot-toast';

const Favorites = () => {
  const { user, setUser } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const response = await userAPI.getFavorites();
      if (response.data.success) {
        setFavorites(response.data.favorites || []);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
      toast.error('Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  const removeFromFavorites = async (productId) => {
    try {
      const response = await userAPI.toggleFavorite(productId);
      if (response.data.success) {
        setFavorites(favorites.filter(item => item._id !== productId));
        setUser({ ...user, favorites: response.data.favorites });
        toast.success('Removed from favorites');
      }
    } catch (error) {
      toast.error('Failed to remove from favorites');
    }
  };

  const addToCart = async (product) => {
    try {
      const response = await userAPI.addToCart({
        productId: product._id,
        quantity: 1
      });
      
      if (response.data.success) {
        setUser({ ...user, cart: response.data.cart });
        toast.success('Added to cart');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add to cart');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <Heart className="text-red-500 fill-red-500" />
            My Favorites ({favorites.length})
          </h1>
          
          {favorites.length > 0 && (
            <Link
              to="/shop"
              className="text-primary hover:underline"
            >
              Continue Shopping →
            </Link>
          )}
        </div>

        {favorites.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center"
          >
            <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="text-red-400" size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Your wishlist is empty
            </h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Save products you love and they will appear here. Start exploring our collection!
            </p>
            <Link
              to="/shop"
              className="inline-block bg-primary text-white font-bold px-8 py-3 rounded-xl hover:bg-opacity-90 transition"
            >
              Discover Products
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map((product) => (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition group"
              >
                <div className="relative">
                  <Link to={`/product/${product._id}`}>
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-48 object-contain p-4 bg-gray-50 group-hover:scale-105 transition duration-300"
                    />
                  </Link>
                  
                  <button
                    onClick={() => removeFromFavorites(product._id)}
                    className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition"
                  >
                    <X size={16} className="text-gray-400 hover:text-red-500" />
                  </button>
                </div>

                <div className="p-4">
                  <Link to={`/product/${product._id}`}>
                    <h3 className="font-bold text-gray-800 mb-2 line-clamp-2 hover:text-primary transition">
                      {product.name}
                    </h3>
                  </Link>

                  <p className="text-sm text-gray-500 mb-3">
                    {product.category}
                  </p>

                  <div className="flex items-center justify-between">
                    <div>
                      {product.mrp && (
                        <p className="text-sm text-gray-400 line-through">
                          ৳{product.mrp}
                        </p>
                      )}
                      <p className="text-xl font-black text-primary">
                        ৳{product.sellingPrice}
                      </p>
                    </div>

                    <button
                      onClick={() => addToCart(product)}
                      className="p-3 bg-primary text-white rounded-xl hover:bg-opacity-90 transition"
                    >
                      <ShoppingCart size={18} />
                    </button>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        product.stock > 0 ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <span className="text-xs text-gray-500">
                        {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;