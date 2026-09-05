/**
 * PeopleOS — AuthContext
 * Central Authentication Context for managing current user, token, and session state.
 */
import React, { createContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/auth/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize session state from localStorage on application mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('peopleos_token');
        const storedUser = localStorage.getItem('peopleos_user');

        if (storedToken && storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);

            // Attempt session verification with backend if supported
            const remoteUser = await authService.getCurrentUser();
            if (remoteUser && remoteUser.user) {
              setUser(remoteUser.user);
              localStorage.setItem('peopleos_user', JSON.stringify(remoteUser.user));
            }
          } catch {
            localStorage.removeItem('peopleos_token');
            localStorage.removeItem('peopleos_user');
            setUser(null);
          }
        }
      } catch (err) {
        console.error('Failed to restore authentication session:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const signin = useCallback(async (credentials) => {
    setLoading(true);
    try {
      const response = await authService.signin(credentials);
      const sessionUser = response.user || {
        email: credentials.email,
        name: credentials.email.split('@')[0],
        role: 'admin',
      };
      const sessionToken = response.token || `session_${Date.now()}`;

      localStorage.setItem('peopleos_token', sessionToken);
      localStorage.setItem('peopleos_user', JSON.stringify(sessionUser));
      setUser(sessionUser);
      return response;
    } finally {
      setLoading(false);
    }
  }, []);

  const signup = useCallback(async (userData) => {
    setLoading(true);
    try {
      const response = await authService.signup(userData);
      const sessionUser = response.user || {
        email: userData.email,
        name: userData.name || userData.email.split('@')[0],
        role: userData.role || 'employee',
      };
      const sessionToken = response.token || `session_${Date.now()}`;

      localStorage.setItem('peopleos_token', sessionToken);
      localStorage.setItem('peopleos_user', JSON.stringify(sessionUser));
      setUser(sessionUser);
      return response;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await authService.logout();
    } finally {
      localStorage.removeItem('peopleos_token');
      localStorage.removeItem('peopleos_user');
      setUser(null);
      setLoading(false);
    }
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    signin,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
