import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Phone, Store, AlertCircle, Loader } from 'lucide-react';
import Input from '../components/Input';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';
import { useAuth } from '../contexts/useAuth';
import toast from 'react-hot-toast';

const SellerRegister = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    shopName: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { register } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    
    if (!formData.phoneNumber) newErrors.phoneNumber = 'Phone number is required';
    else if (!/^01[3-9]\d{8}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Invalid Bangladeshi phone number';
    }
    
    if (!formData.shopName) newErrors.shopName = 'Shop name is required';

    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    return newErrors;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const { confirmPassword, ...userData } = formData;
      const result = await register({ ...userData, role: 'seller' });
      
      if (result.userId) {
        toast.success("Seller registration successful! Please verify your email.");
        navigate('/verify-email', { 
          state: { userId: result.userId, email: formData.email } 
        });
      }
    } catch (error) {
      if (error.response?.data?.errors) {
        const apiErrors = {};
        error.response.data.errors.forEach(err => {
          apiErrors[err.param] = err.msg;
        });
        setErrors(apiErrors);
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-md w-full bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden my-8"
    >
      <div className="p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="text-primary" size={32} />
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-2">Become a Seller</h2>
          <p className="text-gray-600">Join Devaroti Shop and start selling</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            icon={User}
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            disabled={isLoading}
          />

          <Input
            icon={Mail}
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            disabled={isLoading}
          />

          <Input
            icon={Phone}
            type="tel"
            name="phoneNumber"
            placeholder="Phone Number (01XXXXXXXXX)"
            value={formData.phoneNumber}
            onChange={handleChange}
            error={errors.phoneNumber}
            disabled={isLoading}
          />

          <Input
            icon={Store}
            type="text"
            name="shopName"
            placeholder="Shop/Business Name"
            value={formData.shopName}
            onChange={handleChange}
            error={errors.shopName}
            disabled={isLoading}
          />

          <Input
            icon={Lock}
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            disabled={isLoading}
          />

          <Input
            icon={Lock}
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            disabled={isLoading}
          />

          {formData.password && (
            <PasswordStrengthMeter password={formData.password} />
          )}

          {Object.keys(errors).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
              <p className="text-sm text-red-600">
                Please fix the errors above
              </p>
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-white font-bold py-3 px-4 rounded-xl hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader className="w-6 h-6 animate-spin" />
            ) : (
              'Register as Seller'
            )}
          </motion.button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-bold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default SellerRegister;