import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Camera, ArrowLeft } from 'lucide-react';
import { apiClient } from '../../lib/api';
import toast from 'react-hot-toast';
import Card from '../../components/common/Card';
import FaceRegistration from '../../components/auth/FaceRegistration';

function FaceSignupPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState(null);
  
  // Get user_id from query parameters
  React.useEffect(() => {
    const { user_id } = router.query;
    if (user_id) {
      setUserId(user_id);
    }
  }, [router.query]);

  const handleFaceRegistration = async (faceImage) => {
    setIsSubmitting(true);
    try {
      const response = await apiClient.addFaceAuthToUser(faceImage, userId);
      
      if (response.success) {
        toast.success('Face registration completed! Your account is now ready. You can login with your credentials or face.');
        router.push('/auth/login');
      } else {
        toast.error(response.error || 'Face registration failed');
      }
    } catch (error) {
      console.error('Face registration error:', error);
      toast.error('Face registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToSignup = () => {
    router.push('/auth/signup');
  };

  if (!userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Card>
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mb-4">
              <Camera className="h-8 w-8 text-error-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Request</h2>
            <p className="text-gray-600 mb-6">
              Please complete the traditional signup first before proceeding to face registration.
            </p>
            <button
              onClick={handleBackToSignup}
              className="btn-primary"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Signup
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Face Registration | E-Vote</title>
        <meta name="description" content="Complete your face registration" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
              <Camera className="h-8 w-8 text-primary-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Face Registration Required
            </h2>
            <p className="text-gray-600">
              For security purposes, face authentication is mandatory to complete your registration
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold bg-green-600 text-white">
                ✓
              </div>
              <span className="ml-2 text-sm font-medium text-green-600">Credentials</span>
            </div>
            <div className="w-8 h-1 bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold bg-primary-600 text-white">
                2
              </div>
              <span className="ml-2 text-sm font-medium text-primary-600">Face Auth</span>
            </div>
          </div>

          <Card>
            <div className="text-center mb-6">
              <div className="mx-auto w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <Camera className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Register Your Face
              </h3>
              <p className="text-gray-600">
                This will be used for secure biometric authentication when you login
              </p>
            </div>

            <FaceRegistration onRegistrationComplete={handleFaceRegistration} isSubmitting={isSubmitting} />
          </Card>

          <div className="text-center">
            <button
              onClick={handleBackToSignup}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              <ArrowLeft className="h-4 w-4 inline mr-1" />
              Back to Traditional Signup
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default FaceSignupPage; 