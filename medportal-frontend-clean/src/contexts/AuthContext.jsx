// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, handleApiError } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state on app load
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('medportal_token');
      const savedUser = localStorage.getItem('medportal_user');
      
      if (token && savedUser) {
        try {
          // Verify token is still valid
          const response = await authService.getMe();
          const userData = response.data;
          
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          // Token is invalid, clear storage
          localStorage.removeItem('medportal_token');
          localStorage.removeItem('medportal_refresh_token');
          localStorage.removeItem('medportal_user');
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials) => {
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Get tokens from Django login endpoint
      const response = await authService.login(credentials);
      const { access, refresh } = response.data;
      
      // Store tokens first
      localStorage.setItem('medportal_token', access);
      if (refresh) {
        localStorage.setItem('medportal_refresh_token', refresh);
      }
      
      // Step 2: Fetch user data using the new token
      const userResponse = await authService.getMe();
      const userData = userResponse.data;
      
      // Store user data
      localStorage.setItem('medportal_user', JSON.stringify(userData));
      
      setUser(userData);
      setIsAuthenticated(true);

      return { success: true };
    } catch (error) {
      // Clear any partial data if login fails
      localStorage.removeItem('medportal_token');
      localStorage.removeItem('medportal_refresh_token');
      localStorage.removeItem('medportal_user');
      
      const errorMessage = handleApiError(error);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Prepare data for Django API
      const registrationData = {
        username: userData.username,
        email: userData.email,
        password: userData.password,
        first_name: userData.firstName,
        last_name: userData.lastName,
        role: userData.role
      };

      const response = await authService.register(registrationData);
      
      // Auto-login after registration
      const loginResult = await login({
        username: userData.username,
        password: userData.password
      });

      return loginResult;
    } catch (error) {
      const errorMessage = handleApiError(error);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Clear all stored auth data
    localStorage.removeItem('medportal_token');
    localStorage.removeItem('medportal_refresh_token');
    localStorage.removeItem('medportal_user');

    setUser(null);
    setIsAuthenticated(false);
    setError(null);
  };

  const clearError = () => {
    setError(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('medportal_user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};