import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { User, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthProvider';
import { apiClient } from '../../lib/api';
import toast from 'react-hot-toast';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';

function SignupPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Clear any old tokens to prevent premature login
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      console.log('DEBUG: Cleared all auth tokens to prevent premature login');
      console.log('DEBUG: localStorage after clearing:', {
        auth_token: localStorage.getItem('auth_token'),
        refresh_token: localStorage.getItem('refresh_token'),
        user: localStorage.getItem('user')
      });
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      console.log('DEBUG: Starting signup with data:', formData);
      console.log('DEBUG: Current localStorage before signup:', localStorage.getItem('auth_token'));
      
      const response = await apiClient.signupWithCredentials(formData);
      console.log('DEBUG: Signup response:', response);
      console.log('DEBUG: localStorage after signup:', localStorage.getItem('auth_token'));
      
      if (response.success) {
        console.log('DEBUG: Signup successful, redirecting to face registration');
        console.log('DEBUG: User ID from response:', response.data.user_id);
        toast.success('Account created! Now complete face registration for security.');
        
        // Redirect to face signup page with user_id
        router.push(`/auth/face-signup?user_id=${response.data.user_id}`);
      } else {
        console.log('DEBUG: Signup failed:', response.error);
        setErrors({ general: response.error || 'Registration failed' });
      }
    } catch (error) {
      console.error('DEBUG: Signup error:', error);
      console.error('DEBUG: Error response:', error.response?.data);
      setErrors({ general: 'Registration failed. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Sign Up | E-Vote</title>
        <meta name="description" content="Create your E-Vote account" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
              <User className="h-8 w-8 text-primary-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Create Your Account
            </h2>
            <p className="text-gray-600">
              Start with traditional registration, then add face authentication
            </p>
          </div>

          <Card>
            <form onSubmit={handleCredentialsSubmit} className="space-y-6">
              {errors.general && (
                <div className="p-3 bg-error-50 border border-error-200 rounded-md">
                  <p className="text-error-700 text-sm">{errors.general}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.firstName ? 'border-error-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter your first name"
                  />
                  {errors.firstName && (
                    <p className="text-error-600 text-xs mt-1">{errors.firstName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.lastName ? 'border-error-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter your last name"
                  />
                  {errors.lastName && (
                    <p className="text-error-600 text-xs mt-1">{errors.lastName}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.username ? 'border-error-300' : 'border-gray-300'
                  }`}
                  placeholder="Choose a username"
                />
                {errors.username && (
                  <p className="text-error-600 text-xs mt-1">{errors.username}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.email ? 'border-error-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className="text-error-600 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.password ? 'border-error-300' : 'border-gray-300'
                  }`}
                  placeholder="Create a password"
                />
                {errors.password && (
                  <p className="text-error-600 text-xs mt-1">{errors.password}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.confirmPassword ? 'border-error-300' : 'border-gray-300'
                  }`}
                  placeholder="Confirm your password"
                />
                {errors.confirmPassword && (
                  <p className="text-error-600 text-xs mt-1">{errors.confirmPassword}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
                loading={isSubmitting}
              >
                <Shield className="h-5 w-5 mr-2" />
                {isSubmitting ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Already have an account?{' '}
                <button
                  onClick={() => router.push('/auth/login')}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Sign in
                </button>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

export default SignupPage; 