import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { User, Camera, Shield, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthProvider';
import { apiClient } from '../../lib/api';
import toast from 'react-hot-toast';
import FaceLogin from '../../components/auth/FaceLogin';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';

function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [loginMethod, setLoginMethod] = useState('choice'); // 'choice', 'traditional', 'face'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
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

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTraditionalLogin = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      console.log('Attempting login with:', formData);
      const response = await apiClient.loginWithCredentials(formData.username, formData.password);
      console.log('Login response:', response);
      
      if (response.access && response.user) {
        console.log('DEBUG: Login successful, user:', response.user);
        await login(response.user, response.access);
        toast.success('Login successful!');
        router.push('/user/dashboard');
      } else {
        console.log('Login failed, response:', response);
        // Check if face registration is required
        if (response.error && response.error.includes('Face registration required')) {
          toast.error('Face registration required. Please complete face registration first.');
          // Redirect to signup page for face registration
          router.push('/auth/signup');
        } else {
          setErrors({ general: response.error || 'Login failed' });
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error details:', error.response?.data);
      setErrors({ general: 'Login failed. Please check your credentials.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFaceLogin = async (capturedImage) => {
    setIsSubmitting(true);
    try {
      const response = await apiClient.loginWithFaceLocal(capturedImage);
      
      if (response.access && response.user) {
        await login(response.user, response.access);
        toast.success('Face login successful!');
        router.push('/user/dashboard');
      } else {
        toast.error(response.error || 'Face login failed');
      }
    } catch (error) {
      console.error('Face login error:', error);
      toast.error('Face login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const goBackToChoice = () => {
    setLoginMethod('choice');
    setErrors({});
  };

  return (
    <>
      <Head>
        <title>Sign In | E-Vote</title>
        <meta name="description" content="Sign in to your E-Vote account" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-primary-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-600">
              Choose your preferred login method
            </p>
          </div>

          {/* Login Method Choice */}
          {loginMethod === 'choice' && (
            <div className="space-y-4">
              <Card>
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    How would you like to sign in?
                  </h3>
                  <p className="text-gray-600">
                    Choose between traditional or face authentication
                  </p>
                </div>

                <div className="space-y-4">
                  <Button
                    onClick={() => setLoginMethod('traditional')}
                    variant="outline"
                    className="w-full justify-center py-4"
                  >
                    <User className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Traditional Login</div>
                      <div className="text-sm text-gray-500">Username & Password</div>
                    </div>
                    <ArrowRight className="h-5 w-5 ml-auto" />
                  </Button>

                  <Button
                    onClick={() => setLoginMethod('face')}
                    variant="outline"
                    className="w-full justify-center py-4"
                  >
                    <Camera className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Face Login</div>
                      <div className="text-sm text-gray-500">Biometric Authentication</div>
                    </div>
                    <ArrowRight className="h-5 w-5 ml-auto" />
                  </Button>
                </div>
              </Card>

              <div className="text-center">
                <p className="text-sm text-gray-500">
                  Don't have an account?{' '}
                  <button
                    onClick={() => router.push('/auth/signup')}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Sign up
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* Traditional Login */}
          {loginMethod === 'traditional' && (
            <Card>
              <div className="text-center mb-6">
                <Button
                  variant="ghost"
                  onClick={goBackToChoice}
                  className="mb-4"
                >
                  ← Back to Login Options
                </Button>
                
                <div className="mx-auto w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                  <User className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Traditional Login
                </h3>
                <p className="text-gray-600">
                  Sign in with your username and password
                </p>
              </div>

              <form onSubmit={handleTraditionalLogin} className="space-y-6">
                {errors.general && (
                  <div className="p-3 bg-error-50 border border-error-200 rounded-md">
                    <p className="text-error-700 text-sm">{errors.general}</p>
                  </div>
                )}

                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                    Username
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
                    placeholder="Enter your username"
                  />
                  {errors.username && (
                    <p className="text-error-600 text-xs mt-1">{errors.username}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
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
                    placeholder="Enter your password"
                  />
                  {errors.password && (
                    <p className="text-error-600 text-xs mt-1">{errors.password}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                  loading={isSubmitting}
                >
                  <Shield className="h-5 w-5 mr-2" />
                  {isSubmitting ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>
            </Card>
          )}

          {/* Face Login */}
          {loginMethod === 'face' && (
            <Card>
              <div className="text-center mb-6">
                <Button
                  variant="ghost"
                  onClick={goBackToChoice}
                  className="mb-4"
                >
                  ← Back to Login Options
                </Button>
                
                <div className="mx-auto w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                  <Camera className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Face Login
                </h3>
                <p className="text-gray-600">
                  Sign in with your face
                </p>
              </div>

              <FaceLogin onLoginComplete={handleFaceLogin} isSubmitting={isSubmitting} />
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

export default LoginPage; 