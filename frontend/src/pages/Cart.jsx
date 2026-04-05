import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag, Copy, RefreshCw, Truck, AlertCircle, Store, ClipboardPaste
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/useAuth';
import { userAPI, orderAPI } from "../services/api";
import toast from 'react-hot-toast';

const Cart = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [couponDeliveryDiscount, setCouponDeliveryDiscount] = useState(0);
  const [selectedItems, setSelectedItems] = useState([]);
  const [configs, setConfigs] = useState({
    bkash_number: '', nagad_number: '', rocket_number: '', bank_details: '',
    delivery_charge: 110, vat_percentage: 2,
    membership_bronze_discount: 0, membership_silver_discount: 0, membership_gold_discount: 0, membership_platinum_discount: 0,
    membership_bronze_delivery_discount: 0, membership_silver_delivery_discount: 0, membership_gold_delivery_discount: 0, membership_platinum_delivery_discount: 0
  });

  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    combinedAddress: '',
    phoneNumber: ''
  });

  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');
  const [transactionId, setTransactionId] = useState('');
  const [useSavedAddress, setUseSavedAddress] = useState(true);
  const [userAddresses, setUserAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');

  // Fetch user addresses
  useEffect(() => {
    const fetchAddresses = async () => {
      if (user) {
        try {
          const res = await userAPI.getAddresses();
          if (res.data.success) {
            setUserAddresses(res.data.addresses || []);
            const def = res.data.addresses?.find(a => a.isDefault) || res.data.addresses?.[0];
            if (def && !selectedAddressId) {
              setSelectedAddressId(def._id);
              setShippingAddress({
                fullName: def.name || user.name || '',
                combinedAddress: `${def.addressLine1}${def.addressLine2 ? ', ' + def.addressLine2 : ''}, ${def.city}, ${def.state || ''}, ${def.postalCode}`,
                phoneNumber: def.phone || user.phoneNumber || ''
              });
            }
          }
        } catch (err) { console.error("Failed to fetch addresses", err); }
      }
    };
    fetchAddresses();
  }, [user]);

  // Handle address selection change
  useEffect(() => {
    if (useSavedAddress && selectedAddressId) {
      const addr = userAddresses.find(a => String(a._id) === String(selectedAddressId));
      if (addr) {
        setShippingAddress({
          fullName: addr.name || user.name || '',
          combinedAddress: `${addr.addressLine1}${addr.addressLine2 ? ', ' + addr.addressLine2 : ''}, ${addr.city}, ${addr.state || ''}, ${addr.postalCode}`,
          phoneNumber: addr.phone || user.phoneNumber || ''
        });
      }
    }
  }, [selectedAddressId, useSavedAddress, userAddresses]);

  useEffect(() => {
    if (user?.cart) {
      setCartItems(user.cart.filter(item => item.product));
    }

    // Select all by default
    if (user?.cart && selectedItems.length === 0) {
      setSelectedItems(user.cart.filter(it => it.product).map(it => it.product._id));
    }

    const fetchConfigs = async () => {
      try {
        const keys = Object.keys(configs);
        const newConfigs = { ...configs };
        await Promise.all(keys.map(async (key) => {
          const res = await orderAPI.getPublicConfig(key).catch(() => ({ data: { value: null } }));
          if (res.data.value !== null && res.data.value !== undefined) newConfigs[key] = res.data.value;
        }));
        setConfigs(newConfigs);
      } catch (err) { console.error("Config load error", err); }
    };
    fetchConfigs();
  }, [user]);

  // Get selected items only
  const selectedCartItems = cartItems.filter(item => selectedItems.includes(item.product._id));

  // Calculate unique sellers from selected items
  const getUniqueSellers = () => {
    const sellers = new Map();
    selectedCartItems.forEach(item => {
      const sellerId = item.product.user?._id || item.product.user;
      const sellerName = item.product.user?.shopName || item.product.user?.name || 'Store';
      if (!sellers.has(sellerId)) {
        sellers.set(sellerId, {
          id: sellerId,
          name: sellerName,
          items: [],
          subtotal: 0
        });
      }
      const seller = sellers.get(sellerId);
      seller.items.push(item);
      seller.subtotal += item.product.sellingPrice * item.quantity;
    });
    return sellers;
  };

  const uniqueSellers = getUniqueSellers();
  const uniqueSellersCount = uniqueSellers.size;

  // Calculate subtotal
  const calculateSubtotal = () => selectedCartItems.reduce((sum, item) => sum + (item.product.sellingPrice * item.quantity), 0);

  // Calculate VAT
  const calculateVAT = () => calculateSubtotal() * (Number(configs.vat_percentage) / 100);

  // Calculate shipping - PER SELLER
  const calculateShipping = () => {
    if (selectedCartItems.length === 0) return 0;
    const deliveryChargePerSeller = Number(configs.delivery_charge) || 110;
    return deliveryChargePerSeller * uniqueSellersCount;
  };

  // Calculate per-seller shipping breakdown
  const getPerSellerShipping = () => {
    const deliveryCharge = Number(configs.delivery_charge) || 110;
    const sellers = [];
    uniqueSellers.forEach((seller, id) => {
      sellers.push({
        id,
        name: seller.name,
        itemCount: seller.items.length,
        subtotal: seller.subtotal,
        shippingCharge: deliveryCharge
      });
    });
    return sellers;
  };

  // Membership discounts
  const membershipLevel = (user?.membershipLevel || 'bronze').toLowerCase();
  const membershipDiscountPercent = Number(configs[`membership_${membershipLevel}_discount`]) || 0;
  const membershipDiscountAmount = (calculateSubtotal() * membershipDiscountPercent) / 100;

  const membershipDeliveryDiscountPercent = Number(configs[`membership_${membershipLevel}_delivery_discount`]) || 0;
  const totalDeliveryDiscountPercent = Math.min(100, (Number(couponDeliveryDiscount) || 0) + membershipDeliveryDiscountPercent);
  const deliveryDiscountAmount = (calculateShipping() * totalDeliveryDiscountPercent) / 100;

  // Calculate total
  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const vat = calculateVAT();
    const shipping = calculateShipping() - deliveryDiscountAmount;
    const totalDiscount = (discount || 0) + membershipDiscountAmount;
    return Math.max(0, subtotal + vat + shipping - totalDiscount);
  };

  const updateQuantity = async (productId, q) => {
    if (q < 1) return;
    setUpdatingId(productId);
    try {
      const res = await userAPI.updateCartItem(productId, { quantity: q });
      if (res.data.success) {
        setCartItems(res.data.cart);
        setUser({ ...user, cart: res.data.cart });
      }
    } catch (e) { toast.error('Update failed'); } finally { setUpdatingId(null); }
  };

  const removeItem = async (productId) => {
    setUpdatingId(productId);
    try {
      const res = await userAPI.removeFromCart(productId);
      if (res.data.success) {
        setCartItems(res.data.cart);
        setUser({ ...user, cart: res.data.cart });
        // Remove from selected items if needed
        if (selectedItems.includes(productId)) {
          setSelectedItems(selectedItems.filter(id => id !== productId));
        }
        toast.success('Removed');
      }
    } catch (e) { toast.error('Remove failed'); } finally { setUpdatingId(null); }
  };

  const toggleSelectItem = (productId) => {
    if (selectedItems.includes(productId)) {
      setSelectedItems(selectedItems.filter(id => id !== productId));
    } else {
      setSelectedItems([...selectedItems, productId]);
    }
  };

  const selectAllItems = () => {
    if (selectedItems.length === cartItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(cartItems.map(item => item.product._id));
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsApplyingCoupon(true);
    try {
      const sellerIds = Array.from(uniqueSellers.keys());
      const res = await orderAPI.validateCoupon({
        code: couponCode,
        subtotal: calculateSubtotal(),
        sellerIds
      });
      if (res.data.success) {
        setDiscount(Number(res.data.coupon.discountAmount) || 0);
        setCouponDeliveryDiscount(Number(res.data.coupon.deliveryDiscount) || 0);
        setCouponApplied(true);
        toast.success('Coupon applied');
      } else {
        toast.error(res.data.message || 'Invalid coupon');
        setDiscount(0);
        setCouponDeliveryDiscount(0);
        setCouponApplied(false);
      }
    } catch (e) {
      toast.error('Coupon validation failed');
      setDiscount(0);
      setCouponApplied(false);
    } finally { setIsApplyingCoupon(false); }
  };

  const handleCheckout = async () => {
    // Validation
    if (selectedCartItems.length === 0) {
      toast.error('Please select at least one item');
      return;
    }

    if (!shippingAddress.fullName || !shippingAddress.combinedAddress || !shippingAddress.phoneNumber) {
      toast.error('Please fill in all shipping address fields');
      return;
    }

    if (paymentMethod !== 'Cash on Delivery' && !transactionId) {
      toast.error('Transaction ID is required for online payment');
      return;
    }

    setLoading(true);
    try {
      // Prepare order data with multi-seller structure
      const orderData = {
        items: selectedCartItems.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
          price: item.product.sellingPrice,
          seller: item.product.user?._id || item.product.user
        })),
        subtotal: calculateSubtotal(),
        vatPercentage: configs.vat_percentage,
        vatAmount: calculateVAT(),
        discount: (discount || 0) + membershipDiscountAmount,
        shippingCost: calculateShipping(),
        deliveryDiscount: deliveryDiscountAmount,
        totalPrice: calculateTotal(),
        shippingAddress: {
          fullName: shippingAddress.fullName,
          addressLine1: shippingAddress.combinedAddress,
          addressLine2: '',
          city: 'Dhaka',
          state: 'Dhaka',
          postalCode: '1000',
          country: 'Bangladesh',
          phoneNumber: shippingAddress.phoneNumber
        },
        paymentMethod,
        paymentDetails: {
          transactionId: transactionId || null,
          gateway: paymentMethod
        },
        sellerBreakdown: Array.from(uniqueSellers.values()).map(seller => ({
          sellerId: seller.id,
          sellerName: seller.name,
          subtotal: seller.subtotal,
          itemCount: seller.items.length,
          shippingCharge: Number(configs.delivery_charge) || 110
        }))
      };

      const response = await orderAPI.createOrder(orderData);
      if (response.data.success) {
        toast.success('Order placed successfully!');
        setUser({ ...user, cart: [] });
        setTimeout(() => navigate('/dashboard?tab=orders'), 1500);
      } else {
        toast.error(response.data.message || 'Order failed');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <ShoppingBag className="mx-auto text-gray-200 mb-4" size={80} />
          <h2 className="text-xl font-bold text-gray-700">Your cart is empty</h2>
          <p className="text-gray-500 mt-2">Add some products to your cart and they will appear here</p>
          <Link to="/shop" className="mt-6 inline-block bg-primary text-white py-2 px-6 rounded-lg text-sm font-bold hover:bg-primary-dark transition">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Shopping Cart</h1>
        <p className="text-gray-500 text-sm mb-8">{cartItems.length} item(s) in your cart</p>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Items List */}
          <div className="flex-1">
            {/* Select All */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 mb-4 flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedItems.length === cartItems.length && cartItems.length > 0}
                  onChange={selectAllItems}
                  className="w-5 h-5 accent-primary"
                />
                <span className="text-sm font-medium text-gray-700">Select All Items</span>
              </label>
              <span className="text-sm text-gray-500">{selectedItems.length} of {cartItems.length} selected</span>
            </div>

            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.product._id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex gap-4">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.product._id)}
                      onChange={() => toggleSelectItem(item.product._id)}
                      className="w-5 h-5 accent-primary mt-1"
                    />
                    <img
                      src={item.product.image || '/api/placeholder/80/80'}
                      alt={item.product.name}
                      className="w-20 h-20 object-cover rounded-lg border"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 text-base">{item.product.name}</h3>

                      {/* Seller Info */}
                      <div className="flex items-center gap-1">
                        <Store size={12} className="text-gray-400" />
                        <span className="text-xs text-gray-600">
                          {item.product.user?.shopName || item.product.user?.name || 'Devaroti Store'}
                        </span>
                      </div>
<div className='flex gap-6' >
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-primary font-bold text-lg">৳{item.product.sellingPrice}</span>
                        {item.product.sellingPrice < item.product.price && (
                          <span className="text-gray-400 line-through text-sm">৳{item.product.price}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-right">
                        <div className="flex items-center border rounded-lg">
                          <button
                            onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                            className="p-2 hover:bg-gray-50 transition disabled:opacity-50"
                            disabled={updatingId === item.product._id}
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-10 text-center text-sm font-medium">
                            {updatingId === item.product._id ? '...' : item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                            className="p-2 hover:bg-gray-50 transition"
                            disabled={updatingId === item.product._id}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.product._id)}
                          className="text-red-400 hover:text-red-600 p-2 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
</div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">
                        ৳{(item.product.sellingPrice * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary Panel */}
          <div className="w-full lg:w-[400px]">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 sticky top-24">
              <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b">Order Summary</h2>

              {/* Coupon Section */}
              <div className="mb-6">
                <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Have a coupon?</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter coupon code"
                    className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={isApplyingCoupon}
                    className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-black transition disabled:opacity-50"
                  >
                    {isApplyingCoupon ? 'Applying...' : 'Apply'}
                  </button>
                </div>
                {couponApplied && (
                  <p className="text-xs text-green-600 mt-2">✓ Coupon applied successfully!</p>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 text-sm mb-6 pb-4 border-b">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-800">৳{calculateSubtotal().toFixed(2)}</span>
                </div>

                {/* Multi-Seller Shipping Breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <Truck size={16} className="text-gray-400" />
                      <span className="text-gray-600 font-medium">Delivery Fee</span>
                      {uniqueSellersCount > 1 && (
                        <div className="relative group">
                          <AlertCircle size={14} className="text-orange-500 cursor-help" />
                          <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-xs p-3 rounded-lg w-64 z-10 shadow-xl">
                            <p className="font-bold mb-1">Multi-Seller Shipping</p>
                            <p>Your order contains items from <strong>{uniqueSellersCount} different stores</strong>.
                              Each store requires a separate delivery fee of ৳{configs.delivery_charge}.</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <span className="font-medium text-gray-800">৳{calculateShipping().toFixed(2)}</span>
                  </div>

                  {/* Per-seller breakdown */}
                  {uniqueSellersCount > 1 && (
                    <div className="ml-6 pl-4 border-l-2 border-orange-200 space-y-1">
                      <p className="text-xs text-orange-600 font-semibold">Breakdown:</p>
                      {getPerSellerShipping().map((seller, idx) => (
                        <div key={idx} className="flex justify-between text-xs">
                          <span className="text-gray-500">{seller.name}</span>
                          <span className="text-gray-600">৳{seller.shippingCharge}</span>
                        </div>
                      ))}
                      <p className="text-xs text-gray-500 mt-1">
                        {uniqueSellersCount} stores × ৳{configs.delivery_charge}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">VAT ({configs.vat_percentage}%)</span>
                  <span className="font-medium text-gray-600">৳{calculateVAT().toFixed(2)}</span>
                </div>

                {membershipDiscountAmount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Membership Discount ({membershipDiscountPercent}%)</span>
                    <span>- ৳{membershipDiscountAmount.toFixed(2)}</span>
                  </div>
                )}

                {deliveryDiscountAmount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Delivery Discount ({totalDeliveryDiscountPercent}%)</span>
                    <span>- ৳{deliveryDiscountAmount.toFixed(2)}</span>
                  </div>
                )}

                {discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Coupon Discount</span>
                    <span>- ৳{discount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="flex justify-between items-center mb-6 pb-4 border-b">
                <span className="text-lg font-bold text-gray-800">Total</span>
                <span className="text-2xl font-bold text-primary">৳{calculateTotal().toFixed(2)}</span>
              </div>

              {/* Shipping Address */}
              <div className="space-y-4 mb-6">
                <h3 className="text-sm font-bold text-gray-700 uppercase">Shipping Address</h3>

                <div className="flex gap-2">
                  <button
                    onClick={() => setUseSavedAddress(true)}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${useSavedAddress ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}
                  >
                    Saved Address
                  </button>
                  <button
                    onClick={() => setUseSavedAddress(false)}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${!useSavedAddress ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}
                  >
                    New Address
                  </button>
                </div>

                {useSavedAddress && userAddresses.length > 0 ? (
                  <select
                    value={selectedAddressId}
                    onChange={(e) => setSelectedAddressId(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
                  >
                    {userAddresses.map(addr => (
                      <option key={addr._id} value={addr._id}>
                        {addr.name} - {addr.addressLine1}, {addr.city}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={shippingAddress.fullName}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, fullName: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                    <textarea
                      rows="3"
                      placeholder="Full Address (Street, Area, City, Postal Code)"
                      value={shippingAddress.combinedAddress}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, combinedAddress: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary resize-none"
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={shippingAddress.phoneNumber}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, phoneNumber: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="mb-6">
                <label className="text-sm font-bold text-gray-700 uppercase block mb-2">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
                >
                  <option className='text-gray-500' value="">--Select Payment Method--</option>
                  {/* <option value="Cash on Delivery">Cash on Delivery</option> */}
                  <option className='text-pink-600' value="bKash">BKash</option>
                  <option className='text-orange-600' value="Nagad">Nagad</option>
                  <option className='text-[#5C059E]' value="Rocket">Rocket</option>
                  <option className='text-green-600' value="Bank">Bank Transfer</option>
                </select>
              </div>

              {/* Online Payment Details */}
              {['bKash', 'Nagad', 'Rocket', 'Bank'].includes(paymentMethod) && (
                <div className="mb-6 p-4 bg-green-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-2">Send money to:</p>
                  <div className="flex justify-between items-center bg-white p-2 rounded border border-green-600">
                    <span className="text-lg font-mono">
                      {configs[`${paymentMethod.toLowerCase()}_number`] || configs[`${paymentMethod.toLowerCase()}_details`] || 'N/A'}
                    </span>
                    <button
                      onClick={() => {
                        const number = configs[`${paymentMethod.toLowerCase()}_number`] || configs[`${paymentMethod.toLowerCase()}_details`];
                        if (number) {
                          navigator.clipboard.writeText(number);
                          toast.success('Copied!');
                        }
                      }}
                      className="text-primary hover:bg-primary/5 p-1 rounded"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                  <div className="flex gap-2 mt-3">
      <input
        type="text"
        placeholder="Transaction ID"
        value={transactionId}
        onChange={(e) => setTransactionId(e.target.value)}
        className="flex-1 border border-green-300 rounded px-2 py-2 text-lg font-mono outline-none focus:border-primary focus:ring-1 focus:ring-primary"
      />
      <button
        type="button"
        onClick={async () => {
          try {
            const text = await navigator.clipboard.readText();
            if (text) {
              setTransactionId(text);
              toast.success('Transaction ID pasted!');
            }
          } catch (err) {
            toast.error('Unable to paste from clipboard');
          }
        }}
        className="px-3 py-2 bg-green-500 text-white rounded border-none hover:bg-green-700 transition-colors flex items-center"
      >
        <ClipboardPaste size={16} />
        Paste
      </button>
    </div>
                </div>
              )}

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={loading || selectedItems.length === 0}
                className="w-full bg-primary text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : `Place Order • ৳${calculateTotal().toFixed(2)}`}
              </button>

              {selectedItems.length === 0 && (
                <p className="text-center text-xs text-red-500 mt-3">Please select at least one item to checkout</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;