import React, { createContext, useContext, useEffect } from 'react';
import { create } from 'zustand';

// Mock API client for development
const apiClient = {
  logout: async () => {
    // Mock logout - just return success
    return { success: true };
  },
  healthCheck: async () => {
    // Mock health check
    return { success: true };
  }
};

// Mock user for development - bypass authentication
const mockUser = {
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
};

// Mock admin user for development
const mockAdmin = {
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
};

const useAuthStore = create((set, get) => ({
  user: mockUser, // Set mock user by default
  isAuthenticated: true, // Set to true to bypass authentication
  isLoading: false, // Set to false to skip loading
  token: 'mock-token-for-development',

  login: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
    set({
      user,
      isAuthenticated: true,
      token,
      isLoading: false,
    });
  },

  logout: async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
      }
      set({
        user: null,
        isAuthenticated: false,
        token: null,
        isLoading: false,
      });
    }
  },

  updateUser: (userData) => {
    const currentUser = get().user;
    if (currentUser) {
      set({
        user: { ...currentUser, ...userData },
      });
    }
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  initializeAuth: async () => {
    // Skip authentication for development - always use mock user
    set({
      user: mockUser,
      isAuthenticated: true,
      token: 'mock-token-for-development',
      isLoading: false,
    });
  },
}));

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const auth = useAuthStore();

  useEffect(() => {
    auth.initializeAuth();
  }, []);

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthProvider, useAuth };
export default useAuthStore; 