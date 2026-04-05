// Shop.jsx - Complete E-Commerce Shop Page
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/useAuth';
import {
  ShoppingBag, ShoppingCart, Heart, Star, Filter, Grid, List,
  ArrowLeft, ChevronLeft, ChevronRight, X, Eye, Plus, Minus,
  Truck, RotateCcw, Shield, Package, CheckCircle, AlertCircle,
  Camera, Flame, Clock, MessageCircle, User as UserIcon,
  ChevronDown, LogOut, Settings, Menu, Search, Tag, BookOpen,
  Smartphone, Home, Award, Gift, Percent, Zap, ThumbsUp,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Header, MobileMenu, FilterSidebar, CategorySidebar,
  CATEGORIES, NAV_LINKS, FILTER_GROUPS
} from './ShopFrame';

// ==================== HELPER FUNCTIONS ====================
const formatPrice = (n) => "৳ " + n.toLocaleString("en-BD");

// FIX: Helper to safely resolve seller display name from a product object
const getSellerName = (product) =>
  product?.user?.shopName ||
  product?.user?.name ||
  product?.sellerShopName ||
  product?.sellerName ||
  'Devaroti Store';

const Stars = ({ rating = 4.5, size = "text-sm", showNumber = false, count }) => {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <div className="flex items-center gap-1">
      <span className={`inline-flex items-center gap-0.5 ${size}`}>
        {[...Array(5)].map((_, i) => (
          <span key={i} className={
            i < full ? "text-orange-400" :
              (i === full && half ? "text-orange-300" : "text-gray-300")
          }>★</span>
        ))}
      </span>
      {showNumber && (
        <span className="text-xs text-gray-500 ml-1">
          {rating.toFixed(1)} {count && `(${count})`}
        </span>
      )}
    </div>
  );
};

// ==================== PRODUCT DETAIL PAGE ====================
// FIX: Added `wishlist` prop so RelatedProductCard can correctly derive its own wishlisted state
function ProductDetailPage({ product, allProducts, onAddCart, onWishlist, wishlisted, wishlist, onBack, user, setUser }) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);

  const images = product.images?.length ? product.images : [product.image || '/placeholder.png'];
  const discount = product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : null;
  // FIX: Max quantity from available stock
  const maxQuantity = product.quantity || 99;

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await axios.get(`/api/products/${product._id}/reviews`);
        if (response.data.success) {
          setReviews(response.data.reviews);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
        setReviews([]);
      }
    };
    fetchReviews();
  }, [product._id]);

  // Fetch related products
  useEffect(() => {
    const fetchRelated = async () => {
      try {
        const response = await axios.get(`/api/products?category=${product.category}&limit=4&exclude=${product._id}`);
        if (response.data.success) {
          setRelatedProducts(response.data.products);
        }
      } catch (error) {
        console.error('Error fetching related products:', error);
        setRelatedProducts([]);
      }
    };
    fetchRelated();
  }, [product._id, product.category]);

  // FIX: Reset selected image and quantity when product changes
  useEffect(() => {
    setSelectedImage(0);
    setQuantity(1);
  }, [product._id]);

  const handleAddReview = async () => {
    if (!user) {
      toast.error('Please login to review');
      return;
    }

    if (!newReview.comment.trim()) {
      toast.error('Please write a comment');
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.post(`/api/products/${product._id}/reviews`, newReview, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.data.success) {
        setReviews([response.data.review, ...reviews]);
        setNewReview({ rating: 5, comment: '' });
        toast.success('Review added successfully');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      toast.error('Please login to add items to cart');
      return;
    }

    if (!product.inStock) {
      toast.error('Product out of stock');
      return;
    }

    try {
      const response = await axios.post('/api/users/cart', {
        productId: product._id,
        quantity: quantity
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.data.success) {
        toast.success('Added to cart');
        setUser({ ...user, cart: response.data.cart });
        onAddCart(product);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add to cart');
    }
  };

  const handleToggleWishlist = async () => {
    if (!user) {
      toast.error('Please login to add to wishlist');
      return;
    }

    try {
      const response = await axios.post(`/api/users/favorites/${product._id}`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.data.success) {
        setUser({ ...user, favorites: response.data.favorites });
        onWishlist(product._id);
        toast.success(response.data.favorites.includes(product._id) ? 'Added to wishlist' : 'Removed from wishlist');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating wishlist');
    }
  };

  // Calculate average rating
  const avgRating = reviews.length > 0
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
    : product.rating || 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-orange-500 hover:text-orange-600 font-semibold transition group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back
          </button>
          <span>›</span>
          <span className="text-gray-400">{product.category}</span>
          <span>›</span>
          <span className="text-gray-800 font-medium truncate max-w-[300px]">{product.name}</span>
        </nav>

        {/* Main product section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* Images Section */}
          <div className="space-y-3">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden aspect-square relative group">
              <img
                src={images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-contain p-4"
                onError={(e) => e.target.src = 'https://via.placeholder.com/500x500?text=Product+Image'}
              />

              {discount > 0 && (
                <span className="absolute top-4 right-4 bg-orange-500 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-lg z-10">
                  -{discount}%
                </span>
              )}

              {product.badge && (
                <span className={`absolute top-4 left-4 ${product.badgeColor || 'bg-green-500'} text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-lg z-10`}>
                  {product.badge}
                </span>
              )}

              {!product.inStock && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20">
                  <span className="bg-gray-800 text-white text-lg font-bold px-6 py-3 rounded-full shadow-lg">
                    Out of Stock
                  </span>
                </div>
              )}

              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImage(i => (i - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full shadow-lg flex items-center justify-center hover:bg-white transition opacity-0 group-hover:opacity-100 z-10"
                  >
                    <ChevronLeft size={20} className="text-gray-600" />
                  </button>
                  <button
                    onClick={() => setSelectedImage(i => (i + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full shadow-lg flex items-center justify-center hover:bg-white transition opacity-0 group-hover:opacity-100 z-10"
                  >
                    <ChevronRight size={20} className="text-gray-600" />
                  </button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`flex-shrink-0 w-20 h-20 rounded-xl border-2 overflow-hidden transition-all ${selectedImage === idx ? "border-orange-500 shadow-md" : "border-gray-200 hover:border-gray-300"
                      }`}
                  >
                    <img src={img} alt={`thumb ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 flex items-center gap-2">
              <Camera size={16} className="text-orange-500 flex-shrink-0" />
              <p className="text-xs text-orange-700 font-medium">
                <span className="font-bold">{images.length}</span> photos uploaded by seller — actual product may vary slightly
              </p>
            </div>
          </div>

          {/* Product Info Section */}
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-orange-500 font-bold uppercase tracking-wider">{product.category}</span>
                {product.brand && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="text-sm text-gray-500">{product.brand}</span>
                  </>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 leading-tight">{product.name}</h1>

              <div className="flex items-center gap-4 mb-4">
                <Stars rating={avgRating} size="text-lg" showNumber count={reviews.length} />
                <button
                  onClick={() => setActiveTab("reviews")}
                  className="text-sm text-orange-500 hover:text-orange-600 font-medium"
                >
                  {reviews.length} Reviews
                </button>
              </div>

              {/* Seller Information — FIX: use getSellerName() instead of undefined `item` */}
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {getSellerName(product).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-gray-800">{getSellerName(product)}</p>
                      {product.verifiedSeller && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-600 text-xs rounded-full flex items-center gap-1">
                          <CheckCircle size={10} /> Verified
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Stars rating={product.sellerRating || 4.5} size="text-xs" />
                      <span className="text-gray-500">• {product.sellerReviews || 0} reviews</span>
                      <span className="text-gray-500">• Since {product.sellerSince || '2024'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Price Section */}
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-3xl font-bold text-orange-500">{formatPrice(product.price)}</span>
                {product.oldPrice && (
                  <>
                    <span className="text-lg text-gray-400 line-through">{formatPrice(product.oldPrice)}</span>
                    <span className="bg-green-100 text-green-600 font-bold text-sm px-3 py-1 rounded-full">
                      Save {formatPrice(product.oldPrice - product.price)}
                    </span>
                  </>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <Shield size={12} /> Inclusive of all taxes • Free delivery available
              </p>
            </div>

            {/* Key Features/Specs Preview */}
            {product.specs && Object.keys(product.specs).length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(product.specs).slice(0, 4).map(([key, value]) => (
                  <div key={key} className="bg-white border border-gray-200 rounded-lg p-2">
                    <p className="text-xs text-gray-400 capitalize">{key}</p>
                    <p className="text-sm font-semibold text-gray-800">{value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Stock & Actions */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${product.inStock ? "bg-green-500 animate-pulse" : "bg-gray-300"}`} />
                <span className={`font-semibold ${product.inStock ? "text-green-600" : "text-gray-500"}`}>
                  {product.inStock ? "In Stock" : "Out of Stock"}
                </span>
                {product.quantity > 0 && (
                  <span className="text-sm text-gray-500">({product.quantity} units available)</span>
                )}
              </div>

              {/* FIX: Quantity capped at available stock */}
              {product.inStock && (
                <div className="flex items-center gap-4">
                  <span className="text-gray-700 font-medium">Quantity:</span>
                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="w-10 h-10 flex items-center justify-center hover:bg-orange-50 transition text-orange-500"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-12 text-center font-bold text-gray-800">{quantity}</span>
                    <button
                      onClick={() => setQuantity(q => Math.min(maxQuantity, q + 1))}
                      className="w-10 h-10 flex items-center justify-center hover:bg-orange-50 transition text-orange-500"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <span className="text-gray-600">
                    Total: <span className="font-bold text-orange-500">{formatPrice(product.price * quantity)}</span>
                  </span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                  className={`flex-1 font-bold py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-lg ${product.inStock
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-200"
                      : "bg-gray-200 text-gray-500 cursor-not-allowed"
                    }`}
                >
                  <ShoppingCart size={22} />
                  {product.inStock ? "Add to Cart" : "Out of Stock"}
                </button>
                <button
                  onClick={handleToggleWishlist}
                  className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center transition-all ${wishlisted
                      ? 'border-orange-500 bg-orange-50 text-orange-500'
                      : 'border-gray-200 text-gray-400 hover:border-orange-300 hover:text-orange-400'
                    }`}
                >
                  <Heart size={22} fill={wishlisted ? "currentColor" : "none"} />
                </button>
              </div>
            </div>

            {/* Delivery & Service Badges */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: <Truck size={18} />, text: "Free Delivery", sub: "over ৳5,000" },
                { icon: <RotateCcw size={18} />, text: "Easy Returns", sub: "7-day policy" },
                { icon: <Shield size={18} />, text: "Secure", sub: "Payment" },
                { icon: <Package size={18} />, text: "Original", sub: "Products" },
              ].map(s => (
                <div key={s.text} className="flex items-center gap-3 bg-white rounded-xl px-3 py-2.5 border border-gray-200 hover:border-orange-200 transition">
                  <span className="text-orange-400">{s.icon}</span>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{s.text}</p>
                    <p className="text-xs text-gray-500">{s.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-10">
          <div className="flex overflow-x-auto border-b border-gray-200">
            {[
              { id: "description", label: "Description" },
              { id: "specifications", label: "Specifications" },
              { id: "reviews", label: `Reviews (${reviews.length})` }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 text-sm font-bold capitalize transition border-b-2 -mb-px whitespace-nowrap ${activeTab === tab.id ? "border-orange-500 text-orange-500" : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === "description" && (
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-3">About this product</h3>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                  {product.description || "No description available."}
                </p>
                {product.features && product.features.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-bold text-gray-800 mb-2">Key Features:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {product.features.map((feature, idx) => (
                        <li key={idx} className="text-gray-600 text-sm">{feature}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === "specifications" && (
              <div>
                {product.specs && Object.keys(product.specs).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(product.specs).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <span className="text-sm font-semibold text-gray-500 capitalize min-w-[100px]">{key}:</span>
                        <span className="text-sm font-medium text-gray-800">{value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No specifications provided.</p>
                )}
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="space-y-6">
                {reviews.length > 0 && (
                  <div className="flex items-center gap-6 p-4 bg-orange-50 rounded-xl">
                    <div className="text-center">
                      <span className="text-3xl font-bold text-orange-500">{avgRating.toFixed(1)}</span>
                      <Stars rating={avgRating} size="text-sm" />
                      <p className="text-xs text-gray-500 mt-1">Based on {reviews.length} reviews</p>
                    </div>
                    <div className="flex-1">
                      {[5, 4, 3, 2, 1].map(star => {
                        const count = reviews.filter(r => Math.floor(r.rating) === star).length;
                        const percentage = (count / reviews.length) * 100;
                        return (
                          <div key={star} className="flex items-center gap-2 text-sm">
                            <span className="text-gray-600 w-8">{star} ★</span>
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-orange-400 rounded-full" style={{ width: `${percentage}%` }} />
                            </div>
                            <span className="text-gray-500 w-8">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {user ? (
                  <div className="bg-white rounded-xl p-5 border border-gray-200">
                    <h4 className="font-bold text-gray-800 mb-3">Write a Review</h4>
                    <div className="flex items-center gap-2 mb-3">
                      {[1, 2, 3, 4, 5].map(r => (
                        <button
                          key={r}
                          onClick={() => setNewReview({ ...newReview, rating: r })}
                          className={`text-2xl transition hover:scale-110 ${r <= newReview.rating ? 'text-orange-400' : 'text-gray-300'
                            }`}
                        >
                          ★
                        </button>
                      ))}
                      <span className="text-sm text-gray-500 ml-2">
                        {newReview.rating} out of 5
                      </span>
                    </div>
                    <textarea
                      value={newReview.comment}
                      onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                      placeholder="Share your experience with this product... What did you like or dislike?"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-400 mb-3"
                      rows="4"
                    />
                    <button
                      onClick={handleAddReview}
                      disabled={submitting || !newReview.comment.trim()}
                      className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-lg hover:from-orange-600 hover:to-amber-600 transition disabled:opacity-50"
                    >
                      {submitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-6 text-center border border-gray-200">
                    <MessageCircle size={40} className="mx-auto mb-3 text-gray-400" />
                    <p className="text-gray-600 mb-3">Login to write a review</p>
                    <Link
                      to="/login"
                      className="inline-block px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                    >
                      Login
                    </Link>
                  </div>
                )}

                {reviews.length > 0 ? (
                  <div className="space-y-4">
                    <h4 className="font-bold text-gray-800">Customer Reviews</h4>
                    {reviews.map((review, idx) => (
                      <div key={idx} className="border-b border-gray-200 pb-4 last:border-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {review.user?.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800">{review.user?.name || 'Anonymous'}</p>
                              <Stars rating={review.rating} size="text-xs" />
                            </div>
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(review.createdAt).toLocaleDateString('en-BD', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm ml-13">{review.comment}</p>
                        {review.images && review.images.length > 0 && (
                          <div className="flex gap-2 mt-2 ml-13">
                            {review.images.map((img, i) => (
                              <img key={i} src={img} alt="review" className="w-16 h-16 object-cover rounded-lg" />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageCircle size={48} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Related Products Section — FIX: wishlisted per-product from wishlist array */}
        {relatedProducts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">You might also like</h2>
              <Link to={`/category/${product.category}`} className="text-sm text-orange-500 hover:text-orange-600 font-semibold">
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {relatedProducts.map(p => (
                <RelatedProductCard
                  key={p._id}
                  product={p}
                  onAddCart={onAddCart}
                  onWishlist={onWishlist}
                  wishlisted={(wishlist || []).includes(p._id)}
                  user={user}
                  setUser={setUser}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== RELATED PRODUCT CARD ====================
// FIX: Added user + setUser props so add-to-cart actually calls the API
function RelatedProductCard({ product, onAddCart, onWishlist, wishlisted, user, setUser }) {
  const discount = product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : null;

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    if (!user) {
      toast.error('Please login to add items to cart');
      return;
    }
    if (!product.inStock) {
      toast.error('Product out of stock');
      return;
    }
    try {
      const response = await axios.post('/api/users/cart', {
        productId: product._id,
        quantity: 1
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.data.success) {
        toast.success('Added to cart');
        setUser({ ...user, cart: response.data.cart });
        onAddCart(product);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error adding to cart');
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all group">
      <div className="bg-gray-50 p-4 flex items-center justify-center h-36 relative">
        <img
          src={product.image || '/placeholder.png'}
          alt={product.name}
          className="max-h-24 object-contain group-hover:scale-105 transition"
        />
        {discount > 0 && (
          <span className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            -{discount}%
          </span>
        )}
        {!product.inStock && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] flex items-center justify-center">
            <span className="bg-gray-800 text-white text-xs font-bold px-3 py-1.5 rounded-full">
              Out of Stock
            </span>
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-xs text-orange-500 font-semibold mb-1 truncate">{product.category}</p>
        <h3 className="text-sm font-bold text-gray-800 mb-1 line-clamp-2 h-10">{product.name}</h3>
        <Stars rating={product.rating || 4.5} size="text-xs" />
        <div className="flex items-center justify-between mt-2">
          <p className="text-orange-500 font-bold">{formatPrice(product.price)}</p>
          <button
            onClick={handleAddToCart}
            disabled={!product.inStock}
            className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition disabled:bg-gray-200"
          >
            <ShoppingCart size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== PRODUCT CARD ====================
function ProductCard({ product, view, onAddCart, onWishlist, wishlisted, onProductClick, user, setUser }) {
  const [hovered, setHovered] = useState(false);
  const discount = product.oldPrice ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : null;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('Please login to add items to cart');
      return;
    }

    if (!product.inStock) {
      toast.error('Product out of stock');
      return;
    }

    try {
      const response = await axios.post('/api/users/cart', {
        productId: product._id,
        quantity: 1
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.data.success) {
        toast.success('Added to cart');
        setUser({ ...user, cart: response.data.cart });
        onAddCart(product);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error adding to cart');
    }
  };

  const handleToggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('Please login to add to wishlist');
      return;
    }

    try {
      const response = await axios.post(`/api/users/favorites/${product._id}`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.data.success) {
        setUser({ ...user, favorites: response.data.favorites });
        onWishlist(product._id);
        toast.success(response.data.favorites.includes(product._id) ? 'Added to wishlist' : 'Removed from wishlist');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating wishlist');
    }
  };

  // FIX: Check both user.favorites (normalized) and local wishlist state
  const isFavorite = user?.favorites?.some(fav =>
    (typeof fav === 'string' ? fav === product._id : fav._id === product._id)
  ) || wishlisted;

  // List View
  if (view === "list") {
    return (
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all flex">
        <div
          onClick={() => onProductClick(product)}
          className="w-36 sm:w-48 flex-shrink-0 bg-gray-50 flex items-center justify-center relative cursor-pointer p-4"
        >
          <img
            src={product.image || '/placeholder.png'}
            alt={product.name}
            className="max-h-24 object-contain"
            onError={(e) => e.target.src = 'https://via.placeholder.com/200x200?text=Product'}
          />
          {discount > 0 && (
            <span className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              -{discount}%
            </span>
          )}
          {!product.inStock && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] flex items-center justify-center">
              <span className="bg-gray-800 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-xs text-orange-500 font-semibold mb-1">{product.category}</p>
              <h3
                onClick={() => onProductClick(product)}
                className="font-bold text-gray-900 cursor-pointer hover:text-orange-500 transition text-lg"
              >
                {product.name}
              </h3>
            </div>
            <button
              onClick={handleToggleWishlist}
              className={`p-2 rounded-lg border transition ${isFavorite ? "bg-orange-50 border-orange-300 text-orange-500" : "border-gray-200 text-gray-400 hover:border-orange-300"
                }`}
            >
              <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
            </button>
          </div>

          {/* FIX: use getSellerName() instead of undefined `item` */}
          <p className="text-sm text-gray-500 mb-2">by {getSellerName(product)}</p>

          <Stars rating={product.rating || 4.5} showNumber count={product.reviews} />

          {product.specs && (
            <div className="flex flex-wrap gap-2 my-3">
              {Object.entries(product.specs).slice(0, 3).map(([key, value]) => (
                <span key={key} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                  {key}: {value}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-orange-500">{formatPrice(product.price)}</span>
              {product.oldPrice && (
                <span className="text-sm text-gray-400 line-through">{formatPrice(product.oldPrice)}</span>
              )}
            </div>
            <button
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-bold rounded-lg hover:from-orange-600 hover:to-amber-600 transition disabled:opacity-50"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Grid View
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="bg-white rounded-xl border border-black/20 hover:border-orange-500 hover:shadow-xl transition-all overflow-hidden relative group"
    >
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
        {product.badge && (
          <span className={`${product.badgeColor || 'bg-green-500'} text-white text-xs font-bold px-2 py-1 rounded-full`}>
            {product.badge}
          </span>
        )}
      </div>

      {discount > 0 && (
        <span className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
          -{discount}%
        </span>
      )}

      <div
        onClick={() => onProductClick(product)}
        className="bg-gray-50 p-4 flex items-center justify-center h-48 cursor-pointer relative"
      >
        <img
          src={product.image || '/placeholder.png'}
          alt={product.name}
          className="max-h-36 object-contain group-hover:scale-105 transition duration-300"
          onError={(e) => e.target.src = 'https://via.placeholder.com/200x200?text=Product'}
        />

        <div className={`absolute top-2 left-2 flex flex-col gap-1.5 transition-all duration-200 ${hovered ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"}`}>
          <button
            onClick={handleToggleWishlist}
            className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-md transition ${isFavorite ? "bg-orange-500 text-white" : "bg-white text-gray-500 hover:bg-orange-50 hover:text-orange-500"
              }`}
          >
            <Heart size={14} fill={isFavorite ? "white" : "none"} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onProductClick(product); }}
            className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-md hover:bg-orange-50 hover:text-orange-500 transition text-gray-500"
          >
            <Eye size={14} />
          </button>
        </div>

        {!product.inStock && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] flex items-center justify-center">
            <span className="bg-gray-800 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      <div className="p-3">
        <p className="text-gray-400 text-[10px] font-bold uppercase mb-1">{product.category}</p>
        <h5
          onClick={() => onProductClick(product)}
          className="text-gray-800 font-bold text-sm line-clamp-2 min-h-[40px] cursor-pointer hover:text-orange-500 transition"
        >
          {product.name}
        </h5>

        {/* FIX: use getSellerName() instead of undefined `item` */}
        <p className="text-orange-500 text-xs font-medium truncate mb-1">{getSellerName(product)}</p>

        <div className="flex items-center justify-between mb-2">
          <Stars rating={product.rating || 4.5} size="text-xs" />
          <span className="text-xs text-gray-400">({product.reviews || 0})</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            {product.oldPrice && (
              <p className="text-xs text-gray-400 line-through">{formatPrice(product.oldPrice)}</p>
            )}
            <p className="text-orange-500 font-bold text-lg">{formatPrice(product.price)}</p>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={!product.inStock}
            className="w-9 h-9 rounded-lg bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition disabled:bg-gray-200 disabled:cursor-not-allowed"
          >
            <ShoppingCart size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== MAIN SHOP COMPONENT ====================
export default function Shop() {
  const location = useLocation();
  const urlSearchQuery = new URLSearchParams(location.search).get('search') || '';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState(urlSearchQuery);
  const [filters, setFilters] = useState({});
  const [priceRange, setPriceRange] = useState([0, 999999]);
  const [sortBy, setSortBy] = useState("best");
  const [view, setView] = useState("grid");
  const [page, setPage] = useState(1);
  const [wishlist, setWishlist] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [activeSidebarCat, setActiveSidebarCat] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [cartToast, setCartToast] = useState(null);
  const [categories, setCategories] = useState(CATEGORIES);

  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();
  const PER_PAGE = 12;

  // FIX: Sync wishlist state with user.favorites on login/change
  useEffect(() => {
    if (user?.favorites) {
      const ids = user.favorites.map(f => (typeof f === 'string' ? f : f._id));
      setWishlist(ids);
    } else {
      setWishlist([]);
    }
  }, [user]);

  // FIX: Sync searchQuery when URL search param changes (e.g. navigating from header search)
  useEffect(() => {
    setSearchQuery(urlSearchQuery);
  }, [urlSearchQuery]);

  useEffect(() => {
    const checkProducts = async () => {
      try {
        const response = await axios.get('/api/products?limit=1');
        if (!response.data.success || response.data.products.length === 0) {
          toast.info('No products available yet. Check back later!');
        }
      } catch (error) {
        console.log('No products in database');
      }
    };
    checkProducts();
  }, []);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`/api/products`, {
          params: {
            search: searchQuery,
            category: filters.category?.[0],
            minPrice: priceRange[0],
            maxPrice: priceRange[1],
            sort: sortBy,
            page: page,
            limit: PER_PAGE
          }
        });

        if (response.data.success && response.data.products.length > 0) {
          const productsWithDetails = response.data.products.map(product => ({
            ...product,
            inStock: product.inStock ?? (product.quantity > 0) ?? true,
            quantity: product.quantity || 10,
            // FIX: use getSellerName logic directly — no `item` reference
            sellerName: product.user?.shopName || product.user?.name || product.sellerName || product.seller?.name || 'Devaroti Store',
            sellerShopName: product.user?.shopName || product.user?.name || 'Devaroti Store',
            sellerRating: product.sellerRating || product.seller?.rating || 4.5,
            sellerReviews: product.sellerReviews || product.seller?.reviews || 0,
            verifiedSeller: product.verifiedSeller || product.seller?.verified || false,
            rating: product.rating || 4.5,
            reviews: product.reviews || Math.floor(Math.random() * 50) + 10,
            oldPrice: product.oldPrice || product.mrp || null,
            images: product.images?.length ? product.images : [product.image],
            image: product.image || product.images?.[0] || '/placeholder.png',
            specs: product.specs || {},
            features: product.features || []
          }));

          setProducts(productsWithDetails);
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        setProducts([]);
        setError('Failed to load products. Please try again later.');
        toast.error('Failed to load products. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchQuery, filters, priceRange, sortBy, page]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const filteredProducts = useMemo(() => {
    let list = [...products];

    list = list.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    if (filters.availability?.includes("In Stock")) {
      list = list.filter(p => p.inStock === true);
    }

    if (filters.category?.length) {
      list = list.filter(p => filters.category.includes(p.category));
    }

    if (filters.brand?.length) {
      list = list.filter(p => filters.brand.includes(p.brand));
    }

    if (filters.rating?.length) {
      const minRating = Math.min(...filters.rating.map(r => parseInt(r)));
      list = list.filter(p => (p.rating || 0) >= minRating);
    }

    switch (sortBy) {
      case "price-asc":
        list.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "newest":
        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case "popular":
        list.sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0));
        break;
      default:
        list.sort((a, b) => {
          const aScore = (a.rating * (a.reviews || 0)) + (a.soldCount || 0);
          const bScore = (b.rating * (b.reviews || 0)) + (b.soldCount || 0);
          return bScore - aScore;
        });
        break;
    }

    return list;
  }, [products, filters, priceRange, sortBy]);

  const totalPages = Math.ceil(filteredProducts.length / PER_PAGE);
  const paginatedProducts = filteredProducts.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const addToCart = (product) => {
    setCartToast(product);
  };

  // FIX: toggleWishlist keeps local state in sync after API calls from ProductCard
  const toggleWishlist = (id) => {
    setWishlist(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setSelectedProduct(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategoryClick = (category) => {
    setFilters({ ...filters, category: [category] });
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setPriceRange([0, 999999]);
    setSearchQuery('');
    setPage(1);
  };

  useEffect(() => {
    setPage(1);
  }, [searchQuery, filters, priceRange, sortBy]);

  const cartCount = user?.cart?.reduce((total, item) => total + (item.quantity || 1), 0) || 0;
  const activeFilterCount = Object.values(filters).flat().length;

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        @keyframes slide-in {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-in { animation: slide-in 0.3s ease; }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>

      <Header
        cartCount={cartCount}
        wishCount={wishlist.length}
        onMenuOpen={() => setMobileMenuOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        user={user}
        onLogout={handleLogout}
        onMobileMenuOpen={() => setIsMobileMenuOpen(true)}
      />

      <MobileMenu
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        categories={categories}
        navLinks={NAV_LINKS}
        onCategoryClick={handleCategoryClick}
      />

      {selectedProduct ? (
        <ProductDetailPage
          product={selectedProduct}
          allProducts={products}
          onAddCart={addToCart}
          onWishlist={toggleWishlist}
          wishlisted={wishlist.includes(selectedProduct._id)}
          wishlist={wishlist}
          onBack={handleBack}
          user={user}
          setUser={setUser}
        />
      ) : (
        <>
          <AnimatePresence>
            {mobileFilterOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                  onClick={() => setMobileFilterOpen(false)}
                />
                <motion.aside
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ type: 'tween' }}
                  className="fixed top-0 left-0 h-full w-72 bg-white z-50 shadow-2xl overflow-y-auto lg:hidden"
                >
                  <FilterSidebar
                    filters={filters}
                    setFilters={setFilters}
                    priceRange={priceRange}
                    setPriceRange={setPriceRange}
                    onClose={() => setMobileFilterOpen(false)}
                    isMobile
                  />
                </motion.aside>
              </>
            )}
          </AnimatePresence>

          <main className="max-w-7xl mx-auto px-4 py-6">
            <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
              <Link to="/" className="hover:text-orange-500 transition">Home</Link>
              <span>›</span>
              <span className="text-gray-800 font-medium">Shop</span>
            </nav>

            <div className="flex gap-6">
              <aside className="hidden lg:block w-64 flex-shrink-0">
                <CategorySidebar
                  categories={categories}
                  activeCat={activeSidebarCat}
                  setActiveCat={setActiveSidebarCat}
                />
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm sticky top-24">
                  <FilterSidebar
                    filters={filters}
                    setFilters={setFilters}
                    priceRange={priceRange}
                    setPriceRange={setPriceRange}
                    isMobile={false}
                  />
                </div>
              </aside>

              <div className="flex-1 min-w-0">
                <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap items-center gap-3 mb-4 shadow-sm">
                  <button
                    onClick={() => setMobileFilterOpen(true)}
                    className="lg:hidden flex items-center gap-2 bg-orange-50 text-orange-600 text-sm px-4 py-2 rounded-lg font-medium"
                  >
                    <Filter size={16} /> Filters
                    {activeFilterCount > 0 && (
                      <span className="bg-orange-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>

                  <p className="text-sm text-gray-600">
                    <span className="font-bold text-orange-500">{filteredProducts.length}</span> products found
                  </p>

                  <div className="ml-auto flex items-center gap-3">
                    <select
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-200"
                    >
                      <option value="best">Best Match</option>
                      <option value="popular">Most Popular</option>
                      <option value="newest">Newest First</option>
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
                      <option value="rating">Top Rated</option>
                    </select>

                    <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setView("grid")}
                        className={`px-3 py-2 transition ${view === "grid"
                            ? "bg-orange-500 text-white"
                            : "bg-white text-gray-500 hover:bg-orange-50"
                          }`}
                        title="Grid view"
                      >
                        <Grid size={16} />
                      </button>
                      <button
                        onClick={() => setView("list")}
                        className={`px-3 py-2 transition ${view === "list"
                            ? "bg-orange-500 text-white"
                            : "bg-white text-gray-500 hover:bg-orange-50"
                          }`}
                        title="List view"
                      >
                        <List size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {activeFilterCount > 0 && (
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className="text-sm text-gray-500">Active filters:</span>
                    {Object.entries(filters).map(([group, values]) =>
                      (values || []).map(val => (
                        <span
                          key={`${group}-${val}`}
                          className="inline-flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-orange-600 text-xs font-medium px-3 py-1.5 rounded-full"
                        >
                          {val}
                          <button
                            onClick={() => setFilters(prev => ({
                              ...prev,
                              [group]: prev[group].filter(v => v !== val)
                            }))}
                            className="hover:text-orange-800 transition"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))
                    )}
                    <button
                      onClick={clearFilters}
                      className="text-xs text-gray-500 hover:text-orange-500 underline ml-2"
                    >
                      Clear all
                    </button>
                  </div>
                )}

                {loading ? (
                  <div className="flex justify-center items-center py-20">
                    <div className="relative">
                      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ShoppingBag size={24} className="text-orange-500 opacity-50" />
                      </div>
                    </div>
                  </div>
                ) : error ? (
                  <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
                    <AlertCircle size={64} className="mx-auto mb-4 text-red-400" />
                    <h3 className="text-xl font-bold text-gray-700 mb-2">Oops! Something went wrong</h3>
                    <p className="text-gray-500 mb-6">{error}</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-bold"
                    >
                      Try Again
                    </button>
                  </div>
                ) : paginatedProducts.length === 0 ? (
                  <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Package size={40} className="text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-700 mb-2">No Products Available</h3>
                    <p className="text-gray-500 mb-6">
                      There are no products in the store yet. Products added by sellers and admin will appear here.
                    </p>
                    {user?.role === 'seller' && (
                      <Link
                        to="/seller/add-product"
                        className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-bold inline-block"
                      >
                        Add Your First Product
                      </Link>
                    )}
                    {user?.role === 'admin' && (
                      <Link
                        to="/admin/products/add"
                        className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-bold inline-block"
                      >
                        Add Products
                      </Link>
                    )}
                    {(!user || (user.role !== 'seller' && user.role !== 'admin')) && (
                      <p className="text-sm text-gray-400">
                        Please check back later for new products.
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    <div className={view === "grid"
                      ? "grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4"
                      : "flex flex-col gap-4"
                    }>
                      {paginatedProducts.map(product => (
                        <ProductCard
                          key={product._id}
                          product={product}
                          view={view}
                          onAddCart={addToCart}
                          onWishlist={toggleWishlist}
                          wishlisted={wishlist.includes(product._id)}
                          onProductClick={handleProductClick}
                          user={user}
                          setUser={setUser}
                        />
                      ))}
                    </div>

                    {totalPages > 1 && (
                      <div className="flex justify-center items-center gap-2 mt-8">
                        <button
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-orange-50 hover:border-orange-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                          ← Previous
                        </button>

                        <div className="flex gap-1">
                          {[...Array(totalPages)].map((_, i) => {
                            const pageNum = i + 1;
                            if (
                              pageNum === 1 ||
                              pageNum === totalPages ||
                              (pageNum >= page - 1 && pageNum <= page + 1)
                            ) {
                              return (
                                <button
                                  key={i}
                                  onClick={() => setPage(pageNum)}
                                  className={`w-10 h-10 rounded-lg text-sm font-bold transition ${page === pageNum
                                      ? "bg-orange-500 text-white shadow-md"
                                      : "border border-gray-300 text-gray-600 hover:bg-orange-50"
                                    }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            } else if (pageNum === page - 2 || pageNum === page + 2) {
                              return <span key={i} className="w-10 text-center text-gray-400">...</span>;
                            }
                            return null;
                          })}
                        </div>

                        <button
                          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                          disabled={page === totalPages}
                          className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-orange-50 hover:border-orange-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                          Next →
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {products.length > 0 && (
              <div className="mt-10">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Recently Viewed</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {products.slice(0, 6).map(product => (
                    <div
                      key={product._id}
                      onClick={() => handleProductClick(product)}
                      className="bg-white border border-gray-200 rounded-lg p-2 text-center cursor-pointer hover:shadow-md transition group"
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-16 mx-auto object-contain mb-2 group-hover:scale-105 transition"
                      />
                      <p className="text-xs font-medium text-gray-800 line-clamp-2">{product.name}</p>
                      <p className="text-orange-500 font-bold text-xs mt-1">{formatPrice(product.price)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>
        </>
      )}

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[1100]"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween' }}
              className="fixed inset-y-0 right-0 w-80 bg-white z-[1200] shadow-2xl overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                    <img
                      className="w-8 h-8 block md:hidden"
                      src="10.png"
                      alt="Devaroti Shop Logo Icon"
                      width="32"
                      height="32"
                      loading="eager"
                    />
                    <span className="font-bold text-lg text-gray-800">Menu</span>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <X size={20} />
                  </button>
                </div>

                {user && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{user.name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className="text-xs text-orange-500 mt-1 capitalize">{user.role}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-orange-50 transition text-gray-700">
                    <Home size={20} /><span className="font-medium">Home</span>
                  </Link>
                  <Link to="/shop" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl bg-orange-50 text-orange-600">
                    <ShoppingBag size={20} /><span className="font-medium">Shop</span>
                  </Link>
                  <Link to="/favorites" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-between p-3 rounded-xl hover:bg-orange-50 transition">
                    <div className="flex items-center gap-3"><Heart size={20} /><span className="font-medium">Wishlist</span></div>
                    {wishlist.length > 0 && <span className="text-xs px-2 py-1 bg-orange-500 text-white rounded-full">{wishlist.length}</span>}
                  </Link>
                  <Link to="/cart" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-between p-3 rounded-xl hover:bg-orange-50 transition">
                    <div className="flex items-center gap-3"><ShoppingCart size={20} /><span className="font-medium">Cart</span></div>
                    {cartCount > 0 && <span className="text-xs px-2 py-1 bg-orange-500 text-white rounded-full">{cartCount}</span>}
                  </Link>
                  <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-orange-50 transition">
                    <Package size={20} /><span className="font-medium">Orders</span>
                  </Link>

                  <hr className="my-3 border-gray-200" />

                  {user ? (
                    <>
                      <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-orange-50 transition">
                        <UserIcon size={20} /><span className="font-medium">Dashboard</span>
                      </Link>
                      {user.role === 'admin' && (
                        <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-purple-50 transition text-purple-600">
                          <Settings size={20} /><span className="font-medium">Admin Panel</span>
                        </Link>
                      )}
                      {user.role === 'seller' && (
                        <Link to="/seller" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-orange-50 transition text-orange-600">
                          <Award size={20} /><span className="font-medium">Seller Panel</span>
                        </Link>
                      )}
                      <button
                        onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                        className="w-full mt-4 p-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition flex items-center justify-center gap-2"
                      >
                        <LogOut size={20} /> Logout
                      </button>
                    </>
                  ) : (
                    <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="block w-full p-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-center font-bold rounded-lg hover:from-orange-600 hover:to-amber-600 transition">
                      Log In / Register
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex lg:hidden z-30 shadow-2xl">
        {[
          { icon: <Home size={20} />, to: "/", label: "Home" },
          { icon: <Search size={20} />, label: "Search", onClick: () => document.querySelector('input[type="search"]')?.focus() },
          { icon: <ShoppingCart size={20} />, to: "/cart", label: "Cart", count: cartCount },
          { icon: <Heart size={20} />, to: "/favorites", label: "Wishlist", count: wishlist.length },
          { icon: <UserIcon size={20} />, to: user ? "/dashboard" : "/login", label: "Account" },
        ].map(item => (
          <Link
            key={item.label}
            to={item.to || '#'}
            onClick={item.onClick}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 relative hover:bg-orange-50 transition"
          >
            <span className="text-gray-600">{item.icon}</span>
            <span className="text-xs text-gray-500 font-medium">{item.label}</span>
            {item.count > 0 && (
              <span className="absolute top-1 right-1/4 bg-orange-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {item.count}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* Cart Toast Notification */}
      <AnimatePresence>
        {cartToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-20 lg:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 flex items-center gap-3 p-4"
          >
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <img
                src={cartToast.image}
                alt={cartToast.name}
                className="w-10 h-10 object-contain"
                onError={(e) => e.target.src = 'https://via.placeholder.com/40'}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <CheckCircle size={12} className="text-green-500" /> Added to cart
              </p>
              <p className="text-sm font-bold text-gray-800 truncate">{cartToast.name}</p>
              <p className="text-sm font-bold text-orange-500">{formatPrice(cartToast.price)}</p>
            </div>
            <div className="flex gap-1">
              <Link
                to="/cart"
                onClick={() => setCartToast(null)}
                className="px-3 py-1.5 bg-orange-500 text-white text-xs font-bold rounded-lg hover:bg-orange-600 transition"
              >
                View Cart
              </Link>
              <button onClick={() => setCartToast(null)} className="p-1.5 text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll to Top */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 w-10 h-10 bg-orange-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-orange-600 transition z-40"
      >
        <ChevronUp size={20} />
      </button>

      <div className="h-16 lg:hidden" />
    </div>
  );
}