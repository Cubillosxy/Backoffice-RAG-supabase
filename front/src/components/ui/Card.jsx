import React from 'react';

export const Card = ({ children, className = '', title, icon }) => {
  return (
    <div className={`card ${className}`}>
      {title && (
        <h3 className="card-title">
          {icon && <span className="card-icon-slot">{icon}</span>}
          {title}
        </h3>
      )}
      {children}
    </div>
  );
};
