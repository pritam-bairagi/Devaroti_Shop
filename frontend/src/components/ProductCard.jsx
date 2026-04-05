import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import { ShoppingCart, Heart, Eye, Star } from 'lucide-react';
import { userAPI } from '../services/api';
import toast from 'react-hot-toast';

const ProductCard = ({ product, onAddToCart, onToggleFavorite }) => {
  const { user, setUser } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const discount = product.mrp && product.mrp > product.sellingPrice
    ? Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100)
    : 0;

  const isFavorite = user?.favorites?.some(fav => 
    typeof fav === 'string' ? fav === product._id : fav._id === product._id
  );

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('Please login to add items to cart');
      return;
    }

    if (product.stock <= 0) {
      toast.error('Product out of stock');
      return;
    }

    setIsLoading(true);
    try {
      const response = await userAPI.addToCart({
        productId: product._id,
        quantity: 1
      });

      if (response.data.success) {
        setUser({ ...user, cart: response.data.cart });
        onAddToCart?.(product);
        toast.success(response.data.message || 'Added to cart successfully!');
      } else {
        toast.error(response.data.message || 'Failed to add to cart');
      }
    } catch (error) {
      console.error('Cart error:', error);
      toast.error(error.response?.data?.message || 'Error adding to cart');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('Please login to add to favorites');
      return;
    }

    setIsLoading(true);
    try {
      const response = await userAPI.toggleFavorite(product._id);
      if (response.data.success) {
        setUser({ ...user, favorites: response.data.favorites });
        onToggleFavorite?.(product._id);
        const isNowFavorite = response.data.favorites.some(fav => 
          typeof fav === 'string' ? fav === product._id : fav._id === product._id
        );
        toast.success(isNowFavorite ? 'Added to wishlist' : 'Removed from wishlist');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update wishlist');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Badges */}
      {discount > 0 && (
        <span className="absolute top-3 left-3 z-10 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
          -{discount}%
        </span>
      )}
      
      {product.isNewArrival && (
        <span className="absolute top-3 right-3 z-10 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
          New
        </span>
      )}

      {/* Image */}
      <Link to={`/product/${product._id}`} className="block overflow-hidden bg-gray-50">
        <img
          src={product.image || 'https://via.placeholder.com/300'}
          alt={product.name}
          className="w-full h-64 object-contain p-4 group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/300';
          }}
        />
      </Link>

      {/* Quick Actions */}
      <div
        className={`absolute top-3 right-3 flex flex-col gap-2 transition-all duration-300 ${
          isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
        }`}
      >
        <button
          onClick={handleToggleFavorite}
          disabled={isLoading}
          className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all ${
            isFavorite
              ? 'bg-red-500 text-white'
              : 'bg-white text-gray-600 hover:text-red-500'
          }`}
        >
          <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
        
        <Link
          to={`/product/${product._id}`}
          className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:text-primary transition-all"
        >
          <Eye size={18} />
        </Link>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-gray-400 uppercase tracking-wider">
            {product.category}
          </span>
          {product.brand && (
            <>
              <span className="text-gray-300">•</span>
              <span className="text-xs text-gray-500">{product.brand}</span>
            </>
          )}
        </div>

        <Link to={`/product/${product._id}`}>
          <h3 className="font-bold text-gray-800 mb-2 line-clamp-2 hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex text-yellow-400">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={14}
                fill={i < Math.floor(product.averageRating || 0) ? 'currentColor' : 'none'}
                className={i < Math.floor(product.averageRating || 0) ? 'text-yellow-400' : 'text-gray-300'}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500">
            ({product.reviewCount || 0})
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <div>
            {product.mrp && (
              <p className="text-sm text-gray-400 line-through">
                ৳{product.mrp}
              </p>
            )}
            <p className="text-2xl font-black text-primary">
              ৳{product.sellingPrice}
            </p>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isLoading || product.stock <= 0}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
              product.stock > 0
                ? 'bg-primary text-white hover:bg-opacity-90 hover:scale-105'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <ShoppingCart size={20} />
          </button>
        </div>

        {/* Stock Status */}
        <div className="mt-2 flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              product.stock > 10
                ? 'bg-green-500'
                : product.stock > 0
                ? 'bg-yellow-500'
                : 'bg-red-500'
            }`}
          />
          <span className="text-xs text-gray-500">
            {product.stock > 0
              ? `${product.stock} in stock`
              : 'Out of stock'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;