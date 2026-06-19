import React from 'react';

export const Button = ({ 
  children, 
  onClick, 
  type = 'button', 
  variant = 'primary', 
  disabled = false, 
  loading = false,
  className = ''
}) => {
  return (
    <button
      type={type}
      className={`btn btn-${variant} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <>
          <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
          <span>Cargando...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};
