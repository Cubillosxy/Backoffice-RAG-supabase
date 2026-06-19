import React from 'react';

export const Spinner = ({ className = '', size = 'medium' }) => {
  const sizeStyle = size === 'small' ? { width: '16px', height: '16px', borderWidth: '2px' } : 
                    size === 'large' ? { width: '36px', height: '36px', borderWidth: '4px' } : 
                    {};
  return (
    <div className="spinner-container" style={{ display: 'flex', justifyContent: 'center', padding: '1rem 0' }}>
      <div className={`spinner ${className}`} style={sizeStyle}></div>
    </div>
  );
};
