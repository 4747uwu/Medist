import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  SET_USER: 'SET_USER',
  UPDATE_PROFILE: 'UPDATE_PROFILE',
  SET_LOADING: 'SET_LOADING',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Initial state
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: true,
  error: null
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        loading: true,
        error: null
      };
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        error: null
      };
    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload
      };
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null
      };
    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false
      };
    case AUTH_ACTIONS.UPDATE_PROFILE:
      return {
        ...state,
        user: action.payload,
        loading: false
      };
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is logged in on app start
  useEffect(() => {
    checkAuth();
  }, []); // Empty dependency array - only run once

  // Set auth token in localStorage and API headers
  const setAuthToken = useCallback((token) => {
    if (token) {
      localStorage.setItem('token', token);
      authAPI.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('token');
      delete authAPI.defaults.headers.common['Authorization'];
    }
  }, []);

  // Check authentication status
  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.log('AuthContext - No token found, setting loading to false');
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      return;
    }

    try {
      console.log('AuthContext - Checking auth with token');
      setAuthToken(token);
      const response = await authAPI.get('/auth/me');
      
      console.log('AuthContext - Auth check response:', response.data);
      
      // The /auth/me endpoint returns { success: true, data: user }
      const user = response.data.data;
      
      if (!user) {
        console.error('AuthContext - No user data in auth check');
        throw new Error('No user data received');
      }

      console.log('AuthContext - Auth check successful, user:', user);
      
      dispatch({
        type: AUTH_ACTIONS.SET_USER,
        payload: user
      });
    } catch (error) {
      console.error('AuthContext - Auth check failed:', error);
      localStorage.removeItem('token');
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  }, [setAuthToken]);

  // Login function
  const login = useCallback(async (email, password) => {
    try {
      console.log('AuthContext - Login started for:', email);
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });

      const response = await authAPI.post('/auth/login', {
        email,
        password
      });

      console.log('AuthContext - Login response:', response.data);

      // Fix: The response structure is { success: true, message: '...', token: '...', data: user }
      const { token, data: user } = response.data; // Get token and data (user) from response.data

      console.log('AuthContext - Extracted data:', { token: !!token, user });

      if (!user) {
        console.error('AuthContext - No user data received');
        throw new Error('No user data received from server');
      }

      setAuthToken(token);

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user, token }
      });

      console.log('AuthContext - Login success dispatched with user:', user);
      return { success: true };
    } catch (error) {
      console.error('AuthContext - Login error:', error);
      const errorMessage = error.response?.data?.message || 'Login failed';
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage
      });

      return { success: false, error: errorMessage };
    }
  }, [setAuthToken]);

  // Register function
  const register = useCallback(async (userData) => {
    try {
      console.log('AuthContext - Register started');
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });

      const response = await authAPI.post('/auth/register', userData);

      console.log('AuthContext - Register response:', response.data);

      // Fix: The response structure is { success: true, message: '...', token: '...', data: user }
      const { token, data: user } = response.data; // Get token and data (user) from response.data

      console.log('AuthContext - Extracted data:', { token: !!token, user });

      if (!user) {
        console.error('AuthContext - No user data received');
        throw new Error('No user data received from server');
      }

      setAuthToken(token);

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user, token }
      });

      console.log('AuthContext - Register success dispatched with user:', user);
      return { success: true };
    } catch (error) {
      console.error('AuthContext - Register error:', error);
      const errorMessage = error.response?.data?.message || 'Registration failed';
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage
      });

      return { success: false, error: errorMessage };
    }
  }, [setAuthToken]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await authAPI.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setAuthToken(null);
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  }, [setAuthToken]);

  // Update profile function
  const updateProfile = useCallback(async (profileData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

      const response = await authAPI.put('/auth/profile', profileData);

      dispatch({
        type: AUTH_ACTIONS.UPDATE_PROFILE,
        payload: response.data.data
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Profile update failed';
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage
      });

      return { success: false, error: errorMessage };
    }
  }, []);

  // Change password function
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      await authAPI.put('/auth/password', {
        currentPassword,
        newPassword
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Password change failed';
      return { success: false, error: errorMessage };
    }
  }, []);

  // Clear error function - Fixed with useCallback
  const clearError = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  }, []);

  const value = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    clearError,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;