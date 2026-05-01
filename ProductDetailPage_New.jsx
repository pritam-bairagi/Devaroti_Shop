function ProductDetailPage({ product, allProducts, onAddCart, onWishlist, wishlisted, wishlist, onBack, user, setUser }) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [showChat, setShowChat] = useState(false);

  const images = product.images?.length ? product.images : [product.image || '/placeholder.png'];
  const discount = product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : null;
  const maxQuantity = product.quantity || 99;

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

  const avgRating = reviews.length > 0
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
    : product.rating || 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <button onClick={onBack} className="flex items-center gap-1 text-orange-500 hover:text-orange-600 font-semibold transition group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back
          </button>
          <span>›</span>
          <span className="text-gray-400">{product.category}</span>
          <span>›</span>
          <span className="text-gray-800 font-medium truncate max-w-[300px]">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <div className="space-y-3">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden aspect-square relative group">
              <img src={images[selectedImage]} alt={product.name} className="w-full h-full object-contain p-4" />
              {discount > 0 && <span className="absolute top-4 right-4 bg-orange-500 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-lg z-10">-{discount}%</span>}
              {!product.inStock && <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20"><span className="bg-gray-800 text-white text-lg font-bold px-6 py-3 rounded-full shadow-lg">Out of Stock</span></div>}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button key={idx} onClick={() => setSelectedImage(idx)} className={`flex-shrink-0 w-20 h-20 rounded-xl border-2 overflow-hidden transition-all ${selectedImage === idx ? "border-orange-500 shadow-md" : "border-gray-200 hover:border-gray-300"}`}>
                    <img src={img} alt={`thumb ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div>
              <span className="text-sm text-orange-500 font-bold uppercase tracking-wider">{product.category}</span>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 leading-tight">{product.name}</h1>
              <div className="flex items-center gap-4 mb-4">
                <Stars rating={avgRating} size="text-lg" showNumber count={reviews.length} />
                <button onClick={() => setActiveTab("reviews")} className="text-sm text-orange-500 hover:text-orange-600 font-medium">{reviews.length} Reviews</button>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-100 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {getSellerName(product).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800">{getSellerName(product)}</p>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <Stars rating={product.sellerRating || 4.5} size="text-xs" />
                      <span>{product.sellerReviews || 0} reviews</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setShowChat(true)} className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-orange-200 text-orange-500 rounded-xl font-bold text-sm hover:bg-orange-50 transition shadow-sm">
                  <MessageCircle size={16} /> Contact Seller
                </button>
              </div>

              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 mb-6">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-orange-500">{formatPrice(product.price)}</span>
                  {product.oldPrice && <span className="text-lg text-gray-400 line-through">{formatPrice(product.oldPrice)}</span>}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${product.inStock ? "bg-green-500 animate-pulse" : "bg-gray-300"}`} />
                  <span className={`font-semibold ${product.inStock ? "text-green-600" : "text-gray-500"}`}>{product.inStock ? "In Stock" : "Out of Stock"}</span>
                </div>
                {product.inStock && (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                      <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-orange-50 transition text-orange-500"><Minus size={16} /></button>
                      <span className="w-12 text-center font-bold text-gray-800">{quantity}</span>
                      <button onClick={() => setQuantity(q => Math.min(maxQuantity, q + 1))} className="w-10 h-10 flex items-center justify-center hover:bg-orange-50 transition text-orange-500"><Plus size={16} /></button>
                    </div>
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <button onClick={handleAddToCart} disabled={!product.inStock} className={`flex-1 font-bold py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-lg ${product.inStock ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-500"}`}>
                    <ShoppingCart size={22} /> {product.inStock ? "Add to Cart" : "Out of Stock"}
                  </button>
                  <button onClick={handleToggleWishlist} className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center transition-all ${wishlisted ? 'border-orange-500 text-orange-500 bg-orange-50' : 'border-gray-200 text-gray-400'}`}>
                    <Heart size={22} fill={wishlisted ? "currentColor" : "none"} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-10 p-6">
          <p className="text-gray-600 leading-relaxed whitespace-pre-line">{product.description || "No description available."}</p>
        </div>

        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">You might also like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {relatedProducts.map(p => (
                <RelatedProductCard key={p._id} product={p} onAddCart={onAddCart} onWishlist={onWishlist} wishlisted={(wishlist || []).includes(p._id)} user={user} setUser={setUser} />
              ))}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showChat && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-lg h-[600px] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl relative">
              <ChatWindow receiver={product.user} onClose={() => setShowChat(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
