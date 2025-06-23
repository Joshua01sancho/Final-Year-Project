import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { UserPlus, Camera, CheckCircle, XCircle, Shield } from 'lucide-react';
import FaceRegistration from '../../components/auth/FaceRegistration';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';

const SignupPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    blockchainAddress: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationStep, setRegistrationStep] = useState('form'); // form, face, success

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
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
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

    if (!formData.blockchainAddress.trim()) {
      newErrors.blockchainAddress = 'Blockchain address is required';
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(formData.blockchainAddress)) {
      newErrors.blockchainAddress = 'Please enter a valid Ethereum address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      setRegistrationStep('face');
    }
  };

  const handleFaceRegistration = async (faceImage) => {
    setIsSubmitting(true);

    try {
      // Call the API to register the user with face data
      const response = await fetch('/api/auth/face-signup/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          faceImage
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setRegistrationStep('success');
      } else {
        setErrors({ general: data.error || 'Registration failed. Please try again.' });
        setRegistrationStep('form');
      }
    } catch (error) {
      setErrors({ general: 'Network error. Please try again.' });
      setRegistrationStep('form');
    } finally {
      setIsSubmitting(false);
    }
  };

  const goBackToForm = () => {
    setRegistrationStep('form');
    setErrors({});
  };

  if (registrationStep === 'success') {
    return (
      <>
        <Head>
          <title>Registration Successful - E-Vote System</title>
          <meta name="description" content="Your account has been created successfully" />
        </Head>

        <div className="min-h-screen flex flex-col">
          <Navbar />
          
          <main className="flex-grow flex items-center justify-center py-12">
            <div className="container-responsive">
              <div className="max-w-md mx-auto text-center">
                <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-success-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  Registration Successful!
                </h1>
                <p className="text-gray-600 mb-8">
                  Your account has been created successfully. You can now login with your face recognition.
                </p>
                
                <div className="space-y-4">
                  <Link href="/auth/login" className="w-full btn-primary">
                    Login with Face Recognition
                  </Link>
                  <Link href="/" className="w-full btn-secondary">
                    Go to Homepage
                  </Link>
                </div>
              </div>
            </div>
          </main>

          <Footer />
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Sign Up - E-Vote System</title>
        <meta name="description" content="Create your secure E-Vote account with face recognition" />
      </Head>

      <div className="min-h-screen flex flex-col">
        <Navbar />
        
        <main className="flex-grow flex items-center justify-center py-12">
          <div className="container-responsive">
            <div className="max-w-4xl mx-auto">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                    <UserPlus className="h-8 w-8 text-primary-600" />
                  </div>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Create Your Secure Account
                </h1>
                <p className="text-gray-600">
                  Join the E-Vote system with privacy-first face recognition authentication
                </p>
              </div>

              {registrationStep === 'form' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Registration Form */}
                  <div className="card">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">
                      Personal Information
                    </h2>
                    
                    {errors.general && (
                      <div className="mb-4 p-3 bg-error-50 border border-error-200 rounded-md flex items-center space-x-2">
                        <XCircle className="h-5 w-5 text-error-500" />
                        <span className="text-error-700 text-sm">{errors.general}</span>
                      </div>
                    )}

                    <form onSubmit={handleFormSubmit} className="space-y-4">
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
                            className={`input ${errors.firstName ? 'border-error-300' : ''}`}
                            placeholder="John"
                          />
                          {errors.firstName && (
                            <p className="text-error-600 text-sm mt-1">{errors.firstName}</p>
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
                            className={`input ${errors.lastName ? 'border-error-300' : ''}`}
                            placeholder="Doe"
                          />
                          {errors.lastName && (
                            <p className="text-error-600 text-sm mt-1">{errors.lastName}</p>
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
                          className={`input ${errors.username ? 'border-error-300' : ''}`}
                          placeholder="johndoe"
                        />
                        {errors.username && (
                          <p className="text-error-600 text-sm mt-1">{errors.username}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className={`input ${errors.email ? 'border-error-300' : ''}`}
                          placeholder="john@example.com"
                        />
                        {errors.email && (
                          <p className="text-error-600 text-sm mt-1">{errors.email}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="blockchainAddress" className="block text-sm font-medium text-gray-700 mb-1">
                          Blockchain Address *
                        </label>
                        <input
                          type="text"
                          id="blockchainAddress"
                          name="blockchainAddress"
                          value={formData.blockchainAddress}
                          onChange={handleInputChange}
                          className={`input ${errors.blockchainAddress ? 'border-error-300' : ''}`}
                          placeholder="0x1234567890abcdef..."
                        />
                        {errors.blockchainAddress && (
                          <p className="text-error-600 text-sm mt-1">{errors.blockchainAddress}</p>
                        )}
                        <p className="text-gray-500 text-xs mt-1">
                          This will be used for secure voting on the blockchain
                        </p>
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
                          className={`input ${errors.password ? 'border-error-300' : ''}`}
                          placeholder="••••••••"
                        />
                        {errors.password && (
                          <p className="text-error-600 text-sm mt-1">{errors.password}</p>
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
                          className={`input ${errors.confirmPassword ? 'border-error-300' : ''}`}
                          placeholder="••••••••"
                        />
                        {errors.confirmPassword && (
                          <p className="text-error-600 text-sm mt-1">{errors.confirmPassword}</p>
                        )}
                      </div>

                      <button type="submit" className="w-full btn-primary">
                        Continue to Face Registration
                      </button>
                    </form>
                  </div>

                  {/* Privacy Information */}
                  <div className="card">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">
                      Privacy & Security
                    </h2>
                    
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <Shield className="h-5 w-5 text-primary-600 mt-0.5" />
                        <div>
                          <h3 className="font-medium text-gray-900">Your Face Data is Private</h3>
                          <p className="text-sm text-gray-600">
                            Your face image is encrypted and stored securely. Only you can access it for authentication.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="h-5 w-5 text-success-600 mt-0.5" />
                        <div>
                          <h3 className="font-medium text-gray-900">No Admin Access</h3>
                          <p className="text-sm text-gray-600">
                            Administrators cannot see or access your face data. You control your own biometric information.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <Camera className="h-5 w-5 text-warning-600 mt-0.5" />
                        <div>
                          <h3 className="font-medium text-gray-900">Secure Authentication</h3>
                          <p className="text-sm text-gray-600">
                            Face recognition provides secure, convenient login without passwords.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">What happens next?</h4>
                      <ol className="text-sm text-blue-800 space-y-1">
                        <li>1. Fill out your personal information</li>
                        <li>2. Register your face for secure authentication</li>
                        <li>3. Your account will be created with face recognition</li>
                        <li>4. You can login using your face from then on</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}

              {registrationStep === 'face' && (
                <div className="max-w-2xl mx-auto">
                  <div className="card">
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Face Registration
                      </h2>
                      <p className="text-gray-600">
                        Register your face for secure biometric authentication. This step ensures only you can access your account.
                      </p>
                    </div>
                    
                    <FaceRegistration 
                      onRegistrationComplete={handleFaceRegistration}
                      isSubmitting={isSubmitting}
                    />
                    
                    <div className="mt-6 text-center">
                      <button
                        onClick={goBackToForm}
                        className="text-primary-600 hover:text-primary-700 font-medium"
                        disabled={isSubmitting}
                      >
                        ← Back to Form
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Login Link */}
        <div className="text-center py-8 bg-gray-50">
          <div className="container-responsive">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Login here
              </Link>
            </p>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default SignupPage; 