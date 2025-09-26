// src/components/common/Notification.jsx
import React, { useEffect } from 'react';
import { CheckCircle, X, AlertCircle, Info } from 'lucide-react';
import styles from './Notification.module.css';

const Notification = ({ type = 'success', message, onClose, duration = 5000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} />;
      case 'error':
        return <AlertCircle size={20} />;
      case 'info':
        return <Info size={20} />;
      default:
        return <CheckCircle size={20} />;
    }
  };

  const getClassName = () => {
    return `${styles.notification} ${styles[type]}`;
  };

  return (
    <div className={getClassName()}>
      <div className={styles.content}>
        <div className={styles.icon}>
          {getIcon()}
        </div>
        <div className={styles.message}>
          {message}
        </div>
        <button onClick={onClose} className={styles.closeButton}>
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default Notification;