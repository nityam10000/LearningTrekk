import React from 'react';
import { useNotifications, NOTIFICATION_TYPES } from '../contexts/NotificationContext';
import '../css/NotificationContainer.css';

const NotificationContainer = () => {
  const { notifications, removeNotification } = useNotifications();

  const getIcon = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return 'fas fa-check-circle';
      case NOTIFICATION_TYPES.ERROR:
        return 'fas fa-exclamation-circle';
      case NOTIFICATION_TYPES.WARNING:
        return 'fas fa-exclamation-triangle';
      case NOTIFICATION_TYPES.INFO:
      default:
        return 'fas fa-info-circle';
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="notification-container">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`notification notification--${notification.type} ${
            notification.duration === 0 ? 'notification--persistent' : ''
          }`}
        >
          <div className="notification__content">
            <div className="notification__icon">
              <i className={getIcon(notification.type)}></i>
            </div>
            <div className="notification__text">
              {notification.title && (
                <h4 className="notification__title">{notification.title}</h4>
              )}
              <p className="notification__message">{notification.message}</p>
            </div>
          </div>
          
          <div className="notification__actions">
            {notification.action && (
              <button
                className="notification__action-btn"
                onClick={notification.action.onClick}
              >
                {notification.action.label}
              </button>
            )}
            <button
              className="notification__close-btn"
              onClick={() => removeNotification(notification.id)}
              aria-label="Close notification"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationContainer;