import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Error fetching user:', error);
      // Only logout if there's actually an auth error, not network issues
      if (error.response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (error) => {
    // Network error
    if (!error.response) {
      console.error('Network error:', error.message);
      return `Network error: ${error.message || 'Unable to connect to server'}`;
    }

    const detail = error.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      return detail.map(err => {
        if (typeof err === 'string') return err;
        if (typeof err === 'object' && err?.msg) return err.msg;
        return 'Validation error';
      }).join(', ');
    }
    if (typeof detail === 'object' && detail !== null) {
      // Extract string messages from object
      const messages = Object.values(detail).flat();
      return messages
        .filter(msg => typeof msg === 'string')
        .join(', ') || 'Validation error occurred';
    }
    
    // Check for other error response structures
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    
    return null;
  };

  const login = async (email, password) => {
    try {
      console.log('Attempting login with email:', email);
      // Clear any existing token to ensure clean state
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
      
      const response = await authService.login(email, password);
      console.log('Login response:', response);
      
      if (!response.access_token) {
        throw new Error('No access token in response');
      }
      
      setToken(response.access_token);
      setUser(response.user);
      localStorage.setItem('token', response.access_token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      return response;
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = getErrorMessage(error) || 'Login failed. Please check your email and password.';
      toast.error(errorMessage);
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      setToken(response.access_token);
      setUser(response.user);
      localStorage.setItem('token', response.access_token);
      toast.success('Registration successful!');
      return response;
    } catch (error) {
      toast.error(getErrorMessage(error) || 'Registration failed');
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    toast.success('Logged out successfully');
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateUser,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

