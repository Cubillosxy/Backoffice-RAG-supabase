import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { ToastOutlet } from './components/ui/Toast';
import { DashboardView } from './components/dashboard/DashboardView';
import { IngestionView } from './components/ingestion/IngestionView';
import { SearchView } from './components/search/SearchView';
import { CategoriesView } from './components/categories/CategoriesView';
import { api } from './services/api';
import './styles/main.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toasts, setToasts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [apiStatus, setApiStatus] = useState('connecting');

  // Toast helper
  const showToast = (message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto remove
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Check backend server status
  const checkAPIStatus = async () => {
    const online = await api.checkHealth();
    if (online) {
      setApiStatus('online');
    } else {
      setApiStatus('offline');
      showToast('No se pudo conectar con el servidor API local.', 'error');
    }
  };

  // Fetch categories list
  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const data = await api.getCategories();
      setCategories(data || []);
    } catch (err) {
      showToast('Error al cargar las categorías desde la API.', 'error');
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    checkAPIStatus();
    loadCategories();

    // Set interval to poll api health
    const healthInterval = setInterval(() => {
      api.checkHealth().then(online => {
        setApiStatus(online ? 'online' : 'offline');
      });
    }, 10000);

    return () => clearInterval(healthInterval);
  }, []);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'dashboard') {
      loadCategories();
    }
  };

  // Tab router
  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView
            categories={categories}
            loadingCategories={loadingCategories}
            showToast={showToast}
          />
        );
      case 'ingestion':
        return (
          <IngestionView
            categories={categories}
            showToast={showToast}
          />
        );
      case 'search':
        return (
          <SearchView
            categories={categories}
            showToast={showToast}
          />
        );
      case 'categories':
        return (
          <CategoriesView
            categories={categories}
            loadingCategories={loadingCategories}
            onCategoryCreated={loadCategories}
            showToast={showToast}
          />
        );
      default:
        return null;
    }
  };

  // Header info dynamic based on active tab
  const getHeaderInfo = () => {
    switch (activeTab) {
      case 'dashboard':
        return {
          title: 'Panel de Control',
          subtitle: 'Gestiona la base de conocimientos vectorial en Supabase'
        };
      case 'ingestion':
        return {
          title: 'Ingesta de Conocimiento',
          subtitle: 'Indexa nuevos textos, archivos PDF o Markdown'
        };
      case 'search':
        return {
          title: 'Búsqueda Semántica',
          subtitle: 'Consulta tus documentos utilizando vectores pgvector'
        };
      case 'categories':
        return {
          title: 'Categorías de Información',
          subtitle: 'Estructura los tipos de contenidos del RAG'
        };
      default:
        return { title: 'Backoffice', subtitle: '' };
    }
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className="app-layout">
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        apiStatus={apiStatus}
      />

      <main className="app-main">
        <header className="app-header">
          <div>
            <h1 className="page-title">{headerInfo.title}</h1>
            <p className="page-subtitle">{headerInfo.subtitle}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span
              style={{
                fontSize: '0.85rem',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                padding: '0.4rem 0.8rem',
                borderRadius: '8px',
                color: '#2dd4bf',
                fontWeight: '600',
              }}
            >
              🚀 Gemma-300m Active
            </span>
          </div>
        </header>

        {renderView()}

        <ToastOutlet toasts={toasts} />
      </main>
    </div>
  );
}

export default App;
