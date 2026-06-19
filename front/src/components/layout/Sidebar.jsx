import React from 'react';

export const Sidebar = ({ activeTab, onTabChange, apiStatus }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '⊞' },
    { id: 'ingestion', label: 'Ingesta', icon: '⏏' },
    { id: 'search', label: 'Búsqueda', icon: '⌕' },
    { id: 'categories', label: 'Categorías', icon: '🏷' }
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">⚙</div>
        <h2 className="brand-text">RAG Admin</h2>
      </div>

      <nav className="nav-links">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`nav-button ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => onTabChange(item.id)}
          >
            <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="status-panel">
        <div className={`status-dot ${apiStatus}`} />
        <div className="status-info">
          <p className="status-label">API Server</p>
          <p className="status-val">
            {apiStatus === 'online' ? 'Online' : apiStatus === 'offline' ? 'Offline' : 'Conectando...'}
          </p>
        </div>
      </div>
    </aside>
  );
};
