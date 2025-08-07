import React, { createContext, useContext, useEffect } from 'react';
import { create } from 'zustand';
import { jwtDecode } from 'jwt-decode';
import apiClient from '../lib/api';

const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  token: null,
  authError: null,

  login: (user, token) => {
    if (typeof window !== 'undefined') {
      console.log('[AuthProvider] Setting auth_token in localStorage:', token);
      localStorage.setItem('auth_token', token);
    }
    set({
      user,
      isAuthenticated: true,
      token,
      isLoading: false,
      authError: null,
    });
    console.log('[AuthProvider] User logged in:', user);
  },

  logout: async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      if (typeof window !== 'undefined') {
        console.log('[AuthProvider] Removing auth_token from localStorage');
        localStorage.removeItem('auth_token');
      }
      set({
        user: null,
        isAuthenticated: false,
        token: null,
        isLoading: false,
        authError: null,
      });
      console.log('[AuthProvider] User logged out');
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
    console.log('[AuthProvider] initializeAuth called');
    set({ isLoading: true, authError: null });
    let token = null;
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('auth_token');
      console.log('[AuthProvider] initializeAuth: token from localStorage:', token);
      console.log('[AuthProvider] Current pathname:', window.location.pathname);
      
      // Don't auto-login if user is on signup page
      if (window.location.pathname === '/auth/signup') {
        console.log('[AuthProvider] User is on signup page, skipping auto-login');
        set({ 
          user: null, 
          isAuthenticated: false, 
          token: null, 
          isLoading: false, 
          authError: null 
        });
        return;
      }
    }
    console.log('Raw token from localStorage:', token);
    
    if (!token) {
      console.log('[AuthProvider] No token found, user not authenticated');
      set({ 
        user: null, 
        isAuthenticated: false, 
        token: null, 
        isLoading: false, 
        authError: null 
      });
      return;
    }
    
    try {
      console.log('About to decode token:', token, typeof token);
      let decoded;
      try {
        decoded = jwtDecode(token);
      } catch (decodeError) {
        console.error('jwt_decode failed:', decodeError);
        set({ authError: 'JWT decode failed: ' + decodeError });
        set({ user: null, isAuthenticated: false, token: null, isLoading: false, jwtDebug: {} });
        return;
      }
      console.log('Decoded JWT:', decoded);
      
      // JWT only contains user_id, so we need to fetch user details
      if (decoded.user_id) {
        try {
          // Use the API client instead of direct fetch
          const userData = await apiClient.client.get('/user/me/');
          console.log('[AuthProvider] User data from backend:', userData.data);
          
          set({
            user: {
              id: userData.data.id,
              username: userData.data.username,
              email: userData.data.email,
              firstName: userData.data.first_name,
              lastName: userData.data.last_name,
            },
            isAuthenticated: true,
            token,
            isLoading: false,
            jwtDebug: decoded,
            authError: null,
          });
          console.log('[AuthProvider] User context set successfully');
        } catch (fetchError) {
          console.error('[AuthProvider] Network error fetching user data:', fetchError);
          set({ authError: 'Failed to fetch user data from backend.' });
          set({ user: null, isAuthenticated: false, token: null, isLoading: false });
        }
      } else {
        console.error('[AuthProvider] No user_id in JWT');
        set({ authError: 'No user_id in JWT.' });
        set({ user: null, isAuthenticated: false, token: null, isLoading: false });
      }
    } catch (e) {
      console.error('[AuthProvider] JWT decode error:', e);
      set({ authError: 'JWT decode error or invalid token.' });
      set({ user: null, isAuthenticated: false, token: null, isLoading: false });
    }
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