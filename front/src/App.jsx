import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { ToastOutlet } from './components/ui/Toast';
import { DashboardView } from './components/dashboard/DashboardView';
import { IngestionView } from './components/ingestion/IngestionView';
import { SearchView } from './components/search/SearchView';
import { CategoriesView } from './components/categories/CategoriesView';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { api } from './services/api';
import './styles/main.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toasts, setToasts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [apiStatus, setApiStatus] = useState('connecting');

  // Toast helper
  const showToast = useCallback((message, type = 'info') => {
    const id = typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto remove
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // Check backend server status
  const checkAPIStatus = useCallback(async () => {
    const online = await api.checkHealth();
    if (online) {
      setApiStatus('online');
    } else {
      setApiStatus('offline');
      showToast('Could not connect to the local API server.', 'error');
    }
  }, [showToast]);

  // Fetch categories list
  const loadCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const data = await api.getCategories();
      setCategories(data || []);
    } catch (err) {
      showToast('Error loading categories from the API.', 'error');
    } finally {
      setLoadingCategories(false);
    }
  }, [showToast]);

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
  }, [checkAPIStatus, loadCategories]);

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
          title: 'Control Dashboard',
          subtitle: 'Manage the vector knowledge base in Supabase'
        };
      case 'ingestion':
        return {
          title: 'Knowledge Ingestion',
          subtitle: 'Index new text, PDF or Markdown files'
        };
      case 'search':
        return {
          title: 'Semantic Search',
          subtitle: 'Query your documents using pgvector vectors'
        };
      case 'categories':
        return {
          title: 'Information Categories',
          subtitle: 'Structure the content types for the RAG'
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
          <div>
            <span className="model-badge">🚀 Gemma-300m Active</span>
          </div>
        </header>

        {headerInfo && (
          <ErrorBoundary>
            {renderView()}
          </ErrorBoundary>
        )}

        <ToastOutlet toasts={toasts} />
      </main>
    </div>
  );
}

export default App;
