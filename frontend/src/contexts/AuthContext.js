import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import { authAPI } from '../services/api';

// Initial state
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true,
  error: null,
};

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  LOAD_USER: 'LOAD_USER',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_USER: 'UPDATE_USER',
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
        isAuthenticated: true,
        loading: false,
        error: null,
      };
    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload,
      };
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      };
    case AUTH_ACTIONS.LOAD_USER:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
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
const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load user from localStorage on app start
  useEffect(() => {
    const loadUser = () => {
      try {
        const userData = localStorage.getItem('user-info');
        if (userData) {
          const parsedData = JSON.parse(userData);
          
          // Check if token is expired
          if (parsedData.token?.exp && Date.now() / 1000 > parsedData.token.exp) {
            localStorage.removeItem('user-info');
            dispatch({ type: AUTH_ACTIONS.LOGOUT });
            return;
          }
          
          dispatch({
            type: AUTH_ACTIONS.LOAD_USER,
            payload: {
              user: parsedData.token?.data || parsedData.user || parsedData,
              token: parsedData.token?.token || parsedData.token
            }
          });
        } else {
          dispatch({ type: AUTH_ACTIONS.LOGOUT });
        }
      } catch (error) {
        console.error('Error loading user from localStorage:', error);
        localStorage.removeItem('user-info');
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
      }
    };

    loadUser();
  }, []);

  // Login function - memoized to prevent recreation
  const login = useCallback(async (email, password) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });
      
      const response = await authAPI.login(email, password);
      
      // Store user data in localStorage
      localStorage.setItem('user-info', JSON.stringify(response));
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: {
          user: response.user || response.token?.data || response,
          token: response.token
        }
      });
      
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage
      });
      throw error;
    }
  }, []);

  // Register function - memoized to prevent recreation
  const register = useCallback(async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });
      
      const response = await authAPI.register(userData);
      
      // Store user data in localStorage
      localStorage.setItem('user-info', JSON.stringify(response));
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: {
          user: response.user || response.token?.data || response,
          token: response.token
        }
      });
      
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage
      });
      throw error;
    }
  }, []);

  // Logout function - memoized to prevent recreation
  const logout = useCallback(() => {
    localStorage.removeItem('user-info');
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
  }, []);

  // Update user function - memoized to prevent recreation
  const updateUser = useCallback((userData) => {
    try {
      const currentData = JSON.parse(localStorage.getItem('user-info') || '{}');
      const updatedData = {
        ...currentData,
        user: { ...currentData.user, ...userData },
        token: {
          ...currentData.token,
          data: { ...currentData.token?.data, ...userData }
        }
      };
      
      localStorage.setItem('user-info', JSON.stringify(updatedData));
      dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: userData });
    } catch (error) {
      console.error('Error updating user:', error);
    }
  }, []);

  // Clear error function - memoized to prevent recreation
  const clearError = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  }, []);

  // Check if user has specific role - memoized to prevent recreation
  const hasRole = useCallback((role) => {
    return state.user?.role === role || state.user?.role === 'admin';
  }, [state.user?.role]);

  // Check if user can access instructor features - memoized to prevent recreation
  const canAccessInstructor = useCallback(() => {
    return hasRole('instructor') || hasRole('admin');
  }, [hasRole]);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    ...state,
    login,
    register,
    logout,
    updateUser,
    clearError,
    hasRole,
    canAccessInstructor,
  }), [
    state,
    login,
    register,
    logout,
    updateUser,
    clearError,
    hasRole,
    canAccessInstructor,
  ]);

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