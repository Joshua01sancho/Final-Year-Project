import React from 'react';
import { User, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthProvider';

const RoleSwitcher = () => {
  const { user, updateUser } = useAuth();

  const switchToVoter = () => {
    updateUser({
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      role: 'voter',
      isVerified: true,
      dateOfBirth: '1990-01-01',
      nationalId: '123456789',
      address: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      biometricSetup: {
        faceRegistered: true,
        fingerprintRegistered: false,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  };

  const switchToAdmin = () => {
    updateUser({
      id: '2',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@evote.com',
      phone: '+1234567890',
      role: 'admin',
      isVerified: true,
      dateOfBirth: '1985-01-01',
      nationalId: '987654321',
      address: '456 Admin Ave',
      city: 'Washington',
      state: 'DC',
      zipCode: '20001',
      biometricSetup: {
        faceRegistered: true,
        fingerprintRegistered: true,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  };

  return (
    <div className="fixed top-4 right-4 z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-4">
      <div className="text-sm font-medium text-gray-700 mb-3">Role Switcher (Dev)</div>
      <div className="flex gap-2">
        <button
          onClick={switchToVoter}
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            user?.role === 'voter'
              ? 'bg-primary-100 text-primary-700 border border-primary-300'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <User className="h-4 w-4" />
          Voter
        </button>
        <button
          onClick={switchToAdmin}
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            user?.role === 'admin'
              ? 'bg-warning-100 text-warning-700 border border-warning-300'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Shield className="h-4 w-4" />
          Admin
        </button>
      </div>
      <div className="mt-2 text-xs text-gray-500">
        Current: {user?.firstName} ({user?.role})
      </div>
    </div>
  );
};

export default RoleSwitcher; 