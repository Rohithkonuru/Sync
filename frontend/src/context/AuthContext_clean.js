/**
 * Clean authentication context
 */

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { userService } from '../services/api_clean';

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  UPDATE_USER: 'UPDATE_USER',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Initial state
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  loading: false,
  error: null,
  isAuthenticated: false,
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null,
        isAuthenticated: true,
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
        user: null,
        token: null,
        isAuthenticated: false,
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: null,
        isAuthenticated: false,
      };

    case AUTH_ACTIONS.REGISTER_START:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case AUTH_ACTIONS.REGISTER_SUCCESS:
      return {
        ...state,
        loading: false,
        error: null,
      };

    case AUTH_ACTIONS.REGISTER_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
};

// Create context
const AuthContext = createContext(null);

// Provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await userService.getProfile();
          if (response.success && response.data) {
            dispatch({
              type: AUTH_ACTIONS.LOGIN_SUCCESS,
              payload: {
                user: response.data,
                token,
              },
            });
          } else {
            // Invalid token, clear it
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            dispatch({ type: AUTH_ACTIONS.LOGOUT });
          }
        } catch (error) {
          // Token is invalid, clear it
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          dispatch({ type: AUTH_ACTIONS.LOGOUT });
        }
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });
      
      const response = await userService.login(email, password);
      
      if (response.success && response.data) {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: {
            user: response.data,
            token: response.data.token || 'temp_token',
          },
        });
        
        // Store in localStorage
        localStorage.setItem('token', response.data.token || 'temp_token');
        localStorage.setItem('user', JSON.stringify(response.data));
        
        return response;
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: error.message || 'Login failed',
      });
      throw error;
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.REGISTER_START });
      
      const response = await userService.register(userData);
      
      if (response.success) {
        dispatch({ type: AUTH_ACTIONS.REGISTER_SUCCESS });
        return response;
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      dispatch({
        type: AUTH_ACTIONS.REGISTER_FAILURE,
        payload: error.message || 'Registration failed',
      });
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
  };

  // Update user function
  const updateUser = async (userData) => {
    try {
      const response = await userService.updateProfile(userData);
      
      if (response.success && response.data) {
        dispatch({
          type: AUTH_ACTIONS.UPDATE_USER,
          payload: response.data,
        });
        
        // Update localStorage
        localStorage.setItem('user', JSON.stringify(response.data));
        
        return response;
      } else {
        throw new Error(response.message || 'Update failed');
      }
    } catch (error) {
      throw error;
    }
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Check if user is recruiter
  const isRecruiter = () => {
    return state.user?.user_type === 'recruiter';
  };

  // Check if user is candidate
  const isCandidate = () => {
    return ['student', 'job_seeker', 'professional'].includes(state.user?.user_type);
  };

  // Get user display name
  const getDisplayName = () => {
    if (!state.user) return '';
    return `${state.user.first_name} ${state.user.last_name}`.trim();
  };

  // Get user initials
  const getInitials = () => {
    if (!state.user) return '';
    const firstName = state.user.first_name || '';
    const lastName = state.user.last_name || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Get user profile picture
  const getProfilePicture = () => {
    return state.user?.profile_picture || null;
  };

  // Check if user has completed profile
  const hasCompletedProfile = () => {
    if (!state.user) return false;
    
    const requiredFields = ['first_name', 'last_name', 'email'];
    const hasRequired = requiredFields.every(field => state.user[field]);
    
    const hasOptional = state.user.headline || state.user.bio || state.user.skills?.length > 0;
    
    return hasRequired && hasOptional;
  };

  // Check if user is verified
  const isVerified = () => {
    return state.user?.email_verified || false;
  };

  // Get user permissions
  const getPermissions = () => {
    const permissions = {
      canPostJobs: isRecruiter(),
      canApplyToJobs: isCandidate(),
      canViewApplications: isRecruiter(),
      canUpdateApplications: isRecruiter(),
      canViewConnections: true,
      canSendMessages: true,
      canViewAnalytics: isRecruiter(),
    };
    
    return permissions;
  };

  const value = {
    // State
    ...state,
    
    // Actions
    login,
    register,
    logout,
    updateUser,
    clearError,
    
    // Helpers
    isRecruiter,
    isCandidate,
    getDisplayName,
    getInitials,
    getProfilePicture,
    hasCompletedProfile,
    isVerified,
    getPermissions,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Higher-order component for protected routes
export const withAuth = (Component) => {
  return function AuthenticatedComponent(props) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
            <p className="text-gray-600 mb-4">Please login to access this page</p>
            <button
              onClick={() => (window.location.href = '/login')}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Go to Login
            </button>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
};

// Higher-order component for role-based access
export const withRole = (allowedRoles) => {
  return function RoleBasedComponent(Component) {
    return function AuthenticatedRoleComponent(props) {
      const { user, isAuthenticated, loading } = useAuth();

      if (loading) {
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        );
      }

      if (!isAuthenticated) {
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
              <p className="text-gray-600 mb-4">Please login to access this page</p>
              <button
                onClick={() => (window.location.href = '/login')}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Go to Login
              </button>
            </div>
          </div>
        );
      }

      if (!allowedRoles.includes(user?.user_type)) {
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
              <p className="text-gray-600 mb-4">You don't have permission to access this page</p>
              <button
                onClick={() => (window.location.href = '/dashboard')}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        );
      }

      return <Component {...props} />;
    };
  };
};

export default AuthContext;
