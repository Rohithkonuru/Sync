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
      logout();
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (error) => {
    const detail = error.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      return detail.map(err => err.msg || JSON.stringify(err)).join(', ');
    }
    if (typeof detail === 'object' && detail !== null) {
      return JSON.stringify(detail);
    }
    return null;
  };

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      setToken(response.access_token);
      setUser(response.user);
      localStorage.setItem('token', response.access_token);
      toast.success('Login successful!');
      return response;
    } catch (error) {
      toast.error(getErrorMessage(error) || 'Login failed');
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

