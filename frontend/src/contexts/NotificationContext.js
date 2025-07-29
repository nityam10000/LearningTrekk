import React, { createContext, useContext, useReducer, useCallback } from 'react';

// Notification types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// Initial state
const initialState = {
  notifications: []
};

// Action types
const ACTIONS = {
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  CLEAR_ALL: 'CLEAR_ALL'
};

// Reducer
const notificationReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [...state.notifications, action.payload]
      };
    case ACTIONS.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload)
      };
    case ACTIONS.CLEAR_ALL:
      return {
        ...state,
        notifications: []
      };
    default:
      return state;
  }
};

// Create context
const NotificationContext = createContext();

// Provider component
export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  const addNotification = useCallback((type, message, options = {}) => {
    const id = Date.now() + Math.random();
    const notification = {
      id,
      type,
      message,
      title: options.title,
      duration: options.duration || (type === NOTIFICATION_TYPES.ERROR ? 0 : 5000),
      action: options.action,
      ...options
    };

    dispatch({ type: ACTIONS.ADD_NOTIFICATION, payload: notification });

    // Auto-remove notification after duration (if not 0)
    if (notification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    dispatch({ type: ACTIONS.REMOVE_NOTIFICATION, payload: id });
  }, []);

  const clearAll = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_ALL });
  }, []);

  // Convenience methods
  const showSuccess = useCallback((message, options) => 
    addNotification(NOTIFICATION_TYPES.SUCCESS, message, options), [addNotification]);

  const showError = useCallback((message, options) => 
    addNotification(NOTIFICATION_TYPES.ERROR, message, options), [addNotification]);

  const showWarning = useCallback((message, options) => 
    addNotification(NOTIFICATION_TYPES.WARNING, message, options), [addNotification]);

  const showInfo = useCallback((message, options) => 
    addNotification(NOTIFICATION_TYPES.INFO, message, options), [addNotification]);

  const value = {
    notifications: state.notifications,
    addNotification,
    removeNotification,
    clearAll,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;