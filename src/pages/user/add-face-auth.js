import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Camera, Shield, CheckCircle, ArrowLeft } from 'lucide-react';
import PageLayout from '../../components/layout/PageLayout';
import { useAuth } from '../../contexts/AuthProvider';
import { apiClient } from '../../lib/api';
import toast from 'react-hot-toast';
import FaceRegistration from '../../components/auth/FaceRegistration';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';

function AddFaceAuthPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasFaceAuth, setHasFaceAuth] = useState(false);

  // Check if user already has face authentication
  React.useEffect(() => {
    const checkFaceAuth = async () => {
      try {
        // You can add an API endpoint to check if user has face auth
        // For now, we'll assume they don't have it
        setHasFaceAuth(false);
      } catch (error) {
        console.error('Error checking face auth status:', error);
      }
    };

    if (user) {
      checkFaceAuth();
    }
  }, [user]);

  const handleFaceRegistration = async (capturedImage) => {
    setIsSubmitting(true);
    try {
      // Call the API to add face authentication to existing user
      await apiClient.addFaceAuthToUser(capturedImage);
      
      toast.success('Face authentication added successfully!');
      setHasFaceAuth(true);
      
      // Redirect back to dashboard after a short delay
      setTimeout(() => {
        router.push('/user/dashboard');
      }, 2000);
      
    } catch (error) {
      console.error('Error adding face authentication:', error);
      toast.error('Failed to add face authentication. Please try again.');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    router.push('/auth/login');
    return null;
  }

  return (
    <>
      <Head>
        <title>Add Face Authentication | E-Vote</title>
        <meta name="description" content="Add face authentication to your account" />
      </Head>

      <PageLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Add Face Authentication
                </h1>
                <p className="text-gray-600">
                  Enhance your account security with biometric login
                </p>
              </div>
            </div>
          </div>

          {/* Success Message if already has face auth */}
          {hasFaceAuth && (
            <Card className="mb-6 border-green-200 bg-green-50">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-900">
                    Face Authentication Active
                  </h3>
                  <p className="text-green-700 text-sm">
                    Your account already has face authentication enabled.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Information */}
            <div className="space-y-6">
              <Card>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Why Add Face Authentication?
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-semibold text-primary-600">1</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Faster Login</h3>
                      <p className="text-sm text-gray-600">
                        Access your account quickly with just a glance
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-semibold text-primary-600">2</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Enhanced Security</h3>
                      <p className="text-sm text-gray-600">
                        Biometric authentication is more secure than passwords
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-semibold text-primary-600">3</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Convenient Access</h3>
                      <p className="text-sm text-gray-600">
                        No need to remember complex passwords
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  How It Works
                </h2>
                <div className="space-y-3 text-sm text-gray-600">
                  <p>1. Position your face in front of the camera</p>
                  <p>2. Ensure good lighting and clear visibility</p>
                  <p>3. Capture your face image securely</p>
                  <p>4. Your face data is encrypted and stored safely</p>
                  <p>5. Use face login on the login page</p>
                </div>
              </Card>

              <Card>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Security & Privacy
                </h2>
                <div className="space-y-3 text-sm text-gray-600">
                  <p>• Your face data is encrypted and stored securely</p>
                  <p>• We use local processing for enhanced privacy</p>
                  <p>• You can still use traditional login anytime</p>
                  <p>• Face data can be removed from your account</p>
                </div>
              </Card>
            </div>

            {/* Right Column - Face Registration */}
            <div>
              <Card>
                <div className="text-center mb-6">
                  <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                    <Camera className="h-8 w-8 text-primary-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Register Your Face
                  </h2>
                  <p className="text-gray-600">
                    Add face authentication to your existing account
                  </p>
                </div>

                <FaceRegistration
                  onRegistrationComplete={handleFaceRegistration}
                  isSubmitting={isSubmitting}
                />
              </Card>
            </div>
          </div>
        </div>
      </PageLayout>
    </>
  );
}

export default AddFaceAuthPage; 