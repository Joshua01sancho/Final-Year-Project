import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { User, Shield, Camera, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import PageLayout from '../../components/layout/PageLayout';
import { useAuth } from '../../contexts/AuthProvider';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';

function UserProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [hasFaceAuth, setHasFaceAuth] = useState(false);

  if (!user) {
    router.push('/auth/login');
    return null;
  }

  return (
    <>
      <Head>
        <title>Profile | E-Vote</title>
        <meta name="description" content="Your profile and account settings" />
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
                <User className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Your Profile
                </h1>
                <p className="text-gray-600">
                  Manage your account settings and authentication methods
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Profile Information */}
            <div className="space-y-6">
              <Card>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Account Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Username</label>
                    <p className="text-gray-900">{user.username}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <p className="text-gray-900">{user.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">First Name</label>
                    <p className="text-gray-900">{user.firstName || user.first_name || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Last Name</label>
                    <p className="text-gray-900">{user.lastName || user.last_name || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Account Created</label>
                    <p className="text-gray-900">{user.dateJoined ? new Date(user.dateJoined).toLocaleDateString() : 'Unknown'}</p>
                  </div>
                </div>
              </Card>

              <Card>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Authentication Methods
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <h3 className="font-medium text-green-900">Password Login</h3>
                        <p className="text-sm text-green-700">Traditional username/password</p>
                      </div>
                    </div>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Active
                    </span>
                  </div>

                  <div className={`flex items-center justify-between p-3 border rounded-lg ${
                    hasFaceAuth 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center space-x-3">
                      {hasFaceAuth ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-gray-400" />
                      )}
                      <div>
                        <h3 className={`font-medium ${
                          hasFaceAuth ? 'text-green-900' : 'text-gray-700'
                        }`}>
                          Face Authentication
                        </h3>
                        <p className={`text-sm ${
                          hasFaceAuth ? 'text-green-700' : 'text-gray-500'
                        }`}>
                          Biometric face login
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      hasFaceAuth 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {hasFaceAuth ? 'Active' : 'Not Set'}
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Actions */}
            <div className="space-y-6">
              <Card>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Quick Actions
                </h2>
                <div className="space-y-4">
                  <Button
                    href="/user/add-face-auth"
                    variant="primary"
                    icon={Shield}
                    className="w-full justify-center"
                  >
                    Add Face Authentication
                  </Button>
                  
                  <Button
                    href="/user/settings"
                    variant="outline"
                    icon={User}
                    className="w-full justify-center"
                  >
                    Edit Profile
                  </Button>
                  
                  <Button
                    href="/user/change-password"
                    variant="outline"
                    icon={Shield}
                    className="w-full justify-center"
                  >
                    Change Password
                  </Button>
                </div>
              </Card>

              <Card>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Security Tips
                </h2>
                <div className="space-y-3 text-sm text-gray-600">
                  <p>• Use a strong, unique password</p>
                  <p>• Enable face authentication for convenience</p>
                  <p>• Never share your login credentials</p>
                  <p>• Log out when using shared devices</p>
                  <p>• Keep your face data updated</p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </PageLayout>
    </>
  );
}

export default UserProfilePage; 