import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Shield, Camera, Fingerprint, Smartphone, CheckCircle } from 'lucide-react';
import FaceLogin from '../../components/auth/FaceLogin';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const [selectedMethod, setSelectedMethod] = useState('face');
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();

  // Check for success message from URL params
  useEffect(() => {
    if (router.query.message) {
      setSuccessMessage(router.query.message);
      toast.success(router.query.message);
      // Clear the message from URL
      router.replace('/auth/login', undefined, { shallow: true });
    }
  }, [router.query.message, router]);

  const authMethods = [
    {
      id: 'face',
      title: 'Face Recognition',
      description: 'Login using facial recognition technology',
      icon: Camera,
      color: 'primary',
    },
    {
      id: 'fingerprint',
      title: 'Fingerprint',
      description: 'Login using your fingerprint (mobile devices)',
      icon: Fingerprint,
      color: 'success',
    },
    {
      id: '2fa',
      title: 'Two-Factor Authentication',
      description: 'Login with SMS or authenticator app',
      icon: Smartphone,
      color: 'warning',
    },
  ];

  const getColorClasses = (color) => {
    switch (color) {
      case 'primary':
        return 'bg-primary-50 border-primary-200 text-primary-700';
      case 'success':
        return 'bg-success-50 border-success-200 text-success-700';
      case 'warning':
        return 'bg-warning-50 border-warning-200 text-warning-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  return (
    <>
      <Head>
        <title>Login - E-Vote System</title>
        <meta name="description" content="Secure login to the E-Vote system using biometric authentication" />
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
                    <Shield className="h-8 w-8 text-primary-600" />
                  </div>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Secure Login
                </h1>
                <p className="text-gray-600">
                  Choose your preferred authentication method to access the E-Vote system
                </p>
              </div>

              {/* Success Message */}
              {successMessage && (
                <div className="mb-6 p-4 bg-success-50 border border-success-200 rounded-lg flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-success-500" />
                  <span className="text-success-700">{successMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Authentication Methods */}
                <div className="lg:col-span-1">
                  <div className="card">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      Choose Authentication Method
                    </h2>
                    <div className="space-y-3">
                      {authMethods.map((method) => {
                        const Icon = method.icon;
                        const isSelected = selectedMethod === method.id;
                        
                        return (
                          <button
                            key={method.id}
                            onClick={() => setSelectedMethod(method.id)}
                            className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                              isSelected 
                                ? getColorClasses(method.color)
                                : 'bg-white border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-lg ${
                                isSelected 
                                  ? 'bg-white bg-opacity-50' 
                                  : 'bg-gray-100'
                              }`}>
                                <Icon className="h-5 w-5" />
                              </div>
                              <div>
                                <h3 className="font-medium">{method.title}</h3>
                                <p className="text-sm opacity-75">{method.description}</p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Help Section */}
                  <div className="card mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Need Help?
                    </h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>• Ensure good lighting for face recognition</p>
                      <p>• Keep your face centered in the camera</p>
                      <p>• Use a supported browser (Chrome, Firefox, Safari)</p>
                      <p>• Contact support if you encounter issues</p>
                    </div>
                    <div className="mt-4">
                      <Link 
                        href="/help" 
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        View Help Center →
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Authentication Interface */}
                <div className="lg:col-span-2">
                  {selectedMethod === 'face' && <FaceLogin />}
                  
                  {selectedMethod === 'fingerprint' && (
                    <div className="card">
                      <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mb-4">
                          <Fingerprint className="h-8 w-8 text-success-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                          Fingerprint Login
                        </h2>
                        <p className="text-gray-600 mb-6">
                          Place your finger on the sensor to authenticate
                        </p>
                        <div className="bg-gray-100 rounded-lg p-8 mb-6">
                          <Fingerprint className="h-16 w-16 text-gray-400 mx-auto" />
                          <p className="text-gray-500 mt-2">Fingerprint sensor not available</p>
                        </div>
                        <p className="text-sm text-gray-500">
                          Fingerprint authentication is only available on supported mobile devices.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {selectedMethod === '2fa' && (
                    <div className="card">
                      <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-warning-100 rounded-full flex items-center justify-center mb-4">
                          <Smartphone className="h-8 w-8 text-warning-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                          Two-Factor Authentication
                        </h2>
                        <p className="text-gray-600 mb-6">
                          Enter the verification code sent to your device
                        </p>
                        <div className="max-w-sm mx-auto">
                          <input
                            type="text"
                            placeholder="Enter 6-digit code"
                            className="input text-center text-2xl tracking-widest"
                            maxLength={6}
                          />
                          <button className="w-full btn-primary mt-4">
                            Verify Code
                          </button>
                          <button className="w-full btn-secondary mt-2">
                            Resend Code
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Signup Link */}
        <div className="text-center py-8 bg-gray-50">
          <div className="container-responsive">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link href="/auth/signup" className="text-primary-600 hover:text-primary-700 font-medium">
                Create your account here
              </Link>
            </p>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default LoginPage; 