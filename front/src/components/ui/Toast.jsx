import React from 'react';

export const ToastOutlet = ({ toasts }) => {
  return (
    <div className="toast-outlet">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-item ${toast.type}`}>
          <span className="toast-icon" style={{ fontSize: '1.2rem', marginRight: '0.25rem' }}>
            {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✗' : 'ℹ'}
          </span>
          <span className="toast-message">{toast.message}</span>
        </div>
      ))}
    </div>
  );
};
