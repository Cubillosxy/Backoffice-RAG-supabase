import React, { useEffect, useState } from 'react';
import { StatCard } from './StatCard';
import { Card } from '../ui/Card';
import { Spinner } from '../ui/Spinner';
import { api } from '../../services/api';

export const DashboardView = ({ categories, loadingCategories, showToast }) => {
  const [stats, setStats] = useState({ categories_count: 0, chunks_count: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.getStats();
        setStats(data);
      } catch (err) {
        showToast('Error al cargar estadísticas del servidor.', 'error');
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div>
      <div className="dashboard-grid">
        <StatCard
          label="Categorías"
          value={loadingStats ? '...' : stats.categories_count}
          icon="🏷"
          variant="categories"
        />
        <StatCard
          label="Documentos Chunks"
          value={loadingStats ? '...' : `${stats.chunks_count} Chunks`}
          icon="🗎"
          variant="chunks"
        />
        <StatCard
          label="Dimensión de Embedding"
          value="768d"
          icon="⚙"
          variant="dimension"
        />
      </div>

      <div className="dashboard-sections">
        <Card title="Categorías Activas" icon="🏷">
          {loadingCategories ? (
            <Spinner size="small" />
          ) : categories.length === 0 ? (
            <p className="page-subtitle">No hay categorías creadas aún. Dirígete a la sección de Categorías para crear una.</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.5rem' }}>
              {categories.map((cat) => (
                <span
                  key={cat.id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    color: '#2dd4bf',
                  }}
                >
                  🏷 {cat.name}
                </span>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
