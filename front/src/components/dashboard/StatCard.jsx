import React from 'react';

export const StatCard = ({ label, value, icon, variant }) => {
  return (
    <div className="card stat-card">
      <div className={`stat-icon ${variant}`}>
        {icon}
      </div>
      <div>
        <span className="stat-label">{label}</span>
        <h3 className="stat-value">{value}</h3>
      </div>
    </div>
  );
};
