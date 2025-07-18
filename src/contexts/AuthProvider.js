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
    set({ isLoading: true, authError: null });
    let token = null;
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('auth_token');
      console.log('[AuthProvider] initializeAuth: token from localStorage:', token);
    }
    console.log('Raw token from localStorage:', token);
    
    if (token) {
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
            // Fetch user details from backend using user_id
            const response = await fetch(`http://localhost:8000/api/user/me/`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (response.ok) {
              const userData = await response.json();
              console.log('[AuthProvider] User data from backend:', userData);
              
              set({
                user: {
                  id: userData.id,
                  username: userData.username,
                  email: userData.email,
                  firstName: userData.first_name,
                  lastName: userData.last_name,
                },
                isAuthenticated: true,
                token,
                isLoading: false,
                jwtDebug: decoded,
                authError: null,
              });
              console.log('[AuthProvider] User context set:', {
                id: userData.id,
                username: userData.username,
                email: userData.email,
                firstName: userData.first_name,
                lastName: userData.last_name,
              });
            } else {
              set({ authError: 'Failed to fetch user data from backend.' });
              throw new Error('Failed to fetch user data');
            }
          } catch (fetchError) {
            set({ authError: 'Failed to fetch user data from backend.' });
            console.error('Failed to fetch user data:', fetchError);
            // Fallback to just user_id from JWT
            set({
              user: {
                id: decoded.user_id,
                username: `user_${decoded.user_id}`,
                firstName: `User ${decoded.user_id}`,
              },
              isAuthenticated: true,
              token,
              isLoading: false,
              jwtDebug: decoded,
            });
          }
        } else {
          set({ authError: 'No user_id in JWT.' });
          throw new Error('No user_id in JWT');
        }
      } catch (e) {
        set({ authError: 'JWT decode error or invalid token.' });
        console.error('JWT decode error:', e);
        console.error('Token that failed to decode:', token);
        set({ user: null, isAuthenticated: false, token: null, isLoading: false, jwtDebug: {} });
      }
    } else {
      set({ authError: 'No token found in localStorage.' });
      console.log('No token found in localStorage');
      set({ user: null, isAuthenticated: false, token: null, isLoading: false, jwtDebug: {} });
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