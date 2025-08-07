import React from 'react';
import { User, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthProvider';

function RoleSwitcher() {
  const { user, switchRole } = useAuth();

  const switchToVoter = () => {
    switchRole('voter');
  };

  const switchToAdmin = () => {
    switchRole('admin');
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