import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Lock,
  Phone,
  Truck,
  MapPin,
  AlertCircle
} from 'lucide-react';
import Input from '../components/Input';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';
import { useAuth } from '../contexts/useAuth';
import toast from 'react-hot-toast';

const CourierRegister = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    vehicleType: '',
    serviceArea: '',
    experience: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { register } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name) newErrors.name = 'Full name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    
    if (!formData.phoneNumber) newErrors.phoneNumber = 'Phone number is required';
    else if (!/^01[3-9]\d{8}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Invalid Bangladeshi phone number';
    }
    
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.vehicleType) newErrors.vehicleType = 'Vehicle type is required';
    if (!formData.serviceArea) newErrors.serviceArea = 'Service area is required';
    
    return newErrors;
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    
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

    try {
      const { confirmPassword, ...userData } = formData;
      const result = await register({
        ...userData,
        role: 'courier'
      });

      if (result.userId) {
        navigate('/verify-email', {
          state: {
            userId: result.userId,
            email: formData.email
          }
        });
      }
    } catch (error) {
      if (error.response?.data?.errors) {
        const apiErrors = {};
        error.response.data.errors.forEach(err => {
          apiErrors[err.param] = err.msg;
        });
        setErrors(apiErrors);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md w-full bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden"
    >
      <div className="p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Truck className="text-orange-600" size={32} />
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-2">
            Join as Courier
          </h2>
          <p className="text-gray-600">
            Deliver happiness to customers' doorsteps
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            icon={User}
            type="text"
            name="name"
            placeholder="Full Name *"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            disabled={isLoading}
          />

          <Input
            icon={Mail}
            type="email"
            name="email"
            placeholder="Email Address *"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            disabled={isLoading}
          />

          <Input
            icon={Phone}
            type="tel"
            name="phoneNumber"
            placeholder="Phone Number *"
            value={formData.phoneNumber}
            onChange={handleChange}
            error={errors.phoneNumber}
            disabled={isLoading}
          />

          <div className="grid grid-cols-2 gap-4">
            <select
              name="vehicleType"
              value={formData.vehicleType}
              onChange={handleChange}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary outline-none"
              disabled={isLoading}
            >
              <option value="">Vehicle Type *</option>
              <option value="bike">Motorcycle</option>
              <option value="cycle">Bicycle</option>
              <option value="car">Car</option>
              <option value="van">Van</option>
            </select>

            <Input
              icon={MapPin}
              type="text"
              name="serviceArea"
              placeholder="Service Area *"
              value={formData.serviceArea}
              onChange={handleChange}
              error={errors.serviceArea}
              disabled={isLoading}
            />
          </div>

          <div>
            <select
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary outline-none"
              disabled={isLoading}
            >
              <option value="">Years of Experience</option>
              <option value="0-1">Less than 1 year</option>
              <option value="1-3">1-3 years</option>
              <option value="3-5">3-5 years</option>
              <option value="5+">5+ years</option>
            </select>
          </div>

          <Input
            icon={Lock}
            type="password"
            name="password"
            placeholder="Password *"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            disabled={isLoading}
          />

          <Input
            icon={Lock}
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password *"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            disabled={isLoading}
          />

          <PasswordStrengthMeter password={formData.password} />

          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <h4 className="font-bold text-orange-800 mb-2">Courier Benefits</h4>
            <ul className="text-sm text-orange-700 space-y-1">
              <li>✓ Flexible working hours</li>
              <li>✓ Competitive pay</li>
              <li>✓ Weekly payouts</li>
              <li>✓ Insurance coverage</li>
              <li>✓ Training provided</li>
            </ul>
          </div>

          {Object.keys(errors).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
              <div className="text-sm text-red-600">
                Please fix the errors above
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-orange-600 text-white font-bold py-3 rounded-xl hover:bg-orange-700 transition-all disabled:opacity-70"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
            ) : (
              'Register as Courier'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have a courier account?{' '}
            <Link to="/login" className="text-orange-600 font-bold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default CourierRegister;