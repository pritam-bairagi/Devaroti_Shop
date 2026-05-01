import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShoppingBag, Truck, RotateCcw, CreditCard, Headset, Shield, 
  Leaf, HeartHandshake, ArrowRight, Sparkles, Store,
  Clock, Award, Zap
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from './Footer';
import HeaderTop from './HeaderTop';
import Marquee from './Marquee';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';
import AnimatedSlideshow from '../components/AnimatedSlideshow';
import ImageSlider from '../components/animateSlide';
import CountingNumber from '../components/CountingNumber';
import TestimonialsSection from '../components/CustomersComment';
import { productAPI } from '../services/api';
import SEO from '../components/SEO';

// Home Page JSON-LD for AEO/GEO/AIO
const homeJsonLd = [
  {
    "@type": "WebSite",
    "name": "Devaroti Shop",
    "url": "https://devarotishop.com",
    "description": "Premium multi-vendor e-commerce platform in Bangladesh for traditional, professional, and devotional wear.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://devarotishop.com/shop?search={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  },
  {
    "@type": "Organization",
    "name": "Devaroti Shop",
    "url": "https://devarotishop.com",
    "logo": "https://devarotishop.com/logo.png",
    "sameAs": [
      "https://facebook.com/devarotishop",
      "https://twitter.com/devarotishop",
      "https://instagram.com/devarotishop"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+880123456789",
      "contactType": "customer service",
      "areaServed": "BD",
      "availableLanguage": "Bengali"
    }
  }
];

// Static features data - no animations
const features = [
  { icon: Leaf, title: "Eco Friendly", desc: "Sustainable materials" },
  { icon: HeartHandshake, title: "Authentic Deals", desc: "Direct from source" },
  { icon: Truck, title: "Free Shipping", desc: "On orders ৳5000+" },
  { icon: RotateCcw, title: "Easy Returns", desc: "7-day policy" },
  { icon: CreditCard, title: "Secure Payment", desc: "100% encrypted" },
  { icon: Headset, title: "24/7 Support", desc: "Always here" },
  { icon: Shield, title: "Trust & Safety", desc: "Verified sellers" },
];

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('featured');

  // Fetch data - optimized
  useEffect(() => {
    let isMounted = true;

    const fetchHomeData = async () => {
      try {
        const [featuredRes, categoriesRes] = await Promise.all([
          productAPI.getFeatured(),
          productAPI.getCategories()
        ]);

        if (!isMounted) return;

        if (featuredRes?.data?.success) {
          const products = featuredRes.data.products || [];
          setFeaturedProducts(products);
          setNewArrivals(products.slice(0, 4));
          setBestSellers(products.slice(4, 8));
        }

        if (categoriesRes?.data?.success) {
          setCategories(categoriesRes.data.categories || []);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchHomeData();
    return () => { isMounted = false; };
  }, []);

  if (loading) return <Loader />;

  return (
    <>
      <SEO 
        title="Devaroti Shop - Premium Fashion & Accessories in Bangladesh"
        description="Shop the latest traditional, professional, and devotional wear at Devaroti Shop. Experience premium quality, secure payments, and fast delivery."
        keywords="Devaroti Shop, online shopping Bangladesh, traditional wear, professional clothing, devotional items, premium fashion"
        jsonLd={homeJsonLd}
      />
      <div className="min-h-screen bg-white">
        <HeaderTop />
        <Navbar />
        <AnimatedSlideshow />

        {/* Hero Section - No animations */}
        <section className="bg-orange-100 pt-16 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              
              {/* Left Content */}
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full mb-6">
                  <Sparkles className="w-4 h-4 text-[#ff4800]" />
                  <span className="text-sm font-semibold text-[#ff4800]">Summer Collection 2026</span>
                </div>

                <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
                  <span style={{ backgroundImage: 'linear-gradient(to right, #ff0000, #115708)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Traditional -</span>
                  <br />
                  <span style={{ backgroundImage: 'linear-gradient(to right, #ff4800, #1e3a8a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Professional -</span>
                  <br />
                  <span style={{ backgroundImage: 'linear-gradient(to right, #ffc800, #ff4d00)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Devotional.</span>
                </h1>

                <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto lg:mx-0">
                  Discover premium quality fashion and accessories curated for the modern professional. 
                  Timeless designs meet exceptional craftsmanship.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                  <Link
                    to="/shop"
                    className="inline-flex items-center justify-center gap-2 bg-[#ff4800] text-white font-bold py-3 px-6 rounded-full hover:bg-[#e04000] transition-colors"
                  >
                    <ShoppingBag size={18} />
                    Shop Now
                    <ArrowRight size={14} />
                  </Link>

                  <Link
                    to="/seller-signup"
                    className="inline-flex items-center gap-2 bg-white text-gray-800 font-bold py-3 px-6 rounded-full border-2 border-gray-200 hover:border-[#ff4800] hover:text-[#ff4800] transition-colors"
                  >
                    <Store size={18} />
                    Become a Seller
                  </Link>
                </div>

                <CountingNumber />
              </div>

              {/* Right Image - Optimized */}
              {/* <div className="">
                <div className="relative rounded-2xl overflow-hidden shadow-xl">
                  <img
                    src="https://sudathi.com/cdn/shop/files/4769S291_1.jpg?v=1756409986&width=750"
                    alt="Premium fashion collection - traditional and professional wear"
                    className="w-full h-auto"
                    loading="eager"
                    width="750"
                    height="500"
                  />
                  <div className="absolute bottom-4 left-4 right-4 bg-white/90 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-[#ff4800]" />
                      <span className="text-sm font-semibold">100% Authentic Product with Guarantee</span>
                    </div>
                  </div>
                </div>
              </div> */}
              <ImageSlider />
            </div>
          </div>
        </section>

        {/* Features Bar - Simplified */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 mb-16">
          <div className="bg-gray-100 rounded-2xl shadow-lg border border-orange-600 p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="text-center group">
                    <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-gray-50 group-hover:bg-[#ff4800]/10 flex items-center justify-center transition-colors">
                      <Icon size={18} className="text-[#ff4800]" />
                    </div>
                    <h5 className="text-xs font-semibold text-gray-800">{feature.title}</h5>
                    <p className="text-xs text-gray-500">{feature.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Categories Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Shop by <span className="text-[#ff4800]">Category</span>
            </h2>
          </div>

          {categories.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.slice(0, 6).map((category) => (
                <Link
                  key={category._id}
                  to={`/shop?category=${category._id}`}
                  className="group block"
                >
                  <div className="bg-white rounded-xl border border-gray-400 p-4 text-center hover:bg-[#ff4800]/10 hover:border-[#ff4800] hover:shadow-md transition-all">
                    <img
                      src={category.image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&h=200&fit=crop'}
                      alt={`${category._id} category - shop online`}
                      className="w-20 h-20 object-cover rounded-lg mx-auto mb-3 group-hover:scale-105 transition-transform"
                      loading="lazy"
                      width="80"
                      height="80"
                    />
                    <h3 className="font-semibold text-gray-800 text-sm group-hover:text-[#ff4800] transition-colors">
                      {category._id}
                    </h3>
                    <p className="text-xs text-gray-500">{category.count} items</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Products Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-gray-50">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Featured <span className="text-[#ff4800]">Collection</span>
            </h2>
            
            {/* Tabs - No animations */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {[
                { id: 'featured', label: 'Featured', icon: Sparkles },
                { id: 'new', label: 'New Arrivals', icon: Clock },
                { id: 'bestsellers', label: 'Best Sellers', icon: Award }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-all text-sm ${
                    activeTab === tab.id
                      ? 'bg-[#ff4800] text-white shadow-md'
                      : 'bg-white text-gray-600 hover:text-[#ff4800] shadow-sm'
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(activeTab === 'featured' ? featuredProducts :
              activeTab === 'new' ? newArrivals : bestSellers).length > 0 ? (
              (activeTab === 'featured' ? featuredProducts :
                activeTab === 'new' ? newArrivals : bestSellers).map((product) => (
                <ProductCard key={product._id} product={product} />
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-gray-500">
                <ShoppingBag className="mx-auto w-12 h-12 mb-3 opacity-50" />
                <p>No products found in this category.</p>
              </div>
            )}
          </div>

          <div className="text-center mt-10">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 bg-[#ff4800] text-white font-semibold py-3 px-8 rounded-full hover:bg-[#e04000] transition-colors"
            >
              View All Products
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>

{/* Flash Sale Banner - Enhanced */}
<section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-[#ff4800] to-[#1e3a8a] overflow-hidden">
  {/* Background Image */}
  <div 
    className="absolute inset-0"
    style={{
      backgroundImage: 'url("https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      mixBlendMode: 'overlay',
      opacity: 0.3
    }}
  />
  
  {/* Content */}
  <div className="relative max-w-4xl mx-auto text-center text-white z-10">
    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full mb-6 animate-pulse">
      <Zap className="w-4 h-4 fill-yellow-300" />
      <span className="text-sm font-bold tracking-wide">🔥 LIMITED TIME OFFER</span>
    </div>

    <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4">
      Flash Sale: Up to{' '}
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500">
        70% Off
      </span>
    </h2>

    <p className="text-lg mb-8 text-white/90">
      on Summer Collection. Hurry, limited stock available! <b>use code : <b className='text-green-600'>F L A S H 7 0</b></b>
    </p>

    <Link
      to="/shop"
      className="inline-flex items-center gap-2 bg-white text-[#ff4800] font-bold py-3 px-8 rounded-full hover:bg-gray-100 hover:scale-105 transition-all duration-300 shadow-lg group"
    >
      Shop Now & Save
      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
    </Link>
    
    {/* Optional: Countdown Timer */}
    <div className="mt-8 flex justify-center gap-4 text-center">
      <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
        <div className="text-2xl font-bold">00</div>
        <div className="text-xs uppercase">Hours</div>
      </div>
      <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
        <div className="text-2xl font-bold">00</div>
        <div className="text-xs uppercase">Mins</div>
      </div>
      <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
        <div className="text-2xl font-bold">00</div>
        <div className="text-xs uppercase">Secs</div>
      </div>
    </div>
  </div>
</section>

        <TestimonialsSection />
        <Marquee />
        <Footer />
      </div>
    </>
  );
};

export default Home;