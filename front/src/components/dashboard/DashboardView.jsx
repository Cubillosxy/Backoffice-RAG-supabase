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
        showToast('Error loading statistics from server.', 'error');
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, [showToast]);

  return (
    <div>
      <div className="dashboard-grid">
        <StatCard
          label="Categories"
          value={loadingStats ? '...' : stats.categories_count}
          icon="🏷"
          variant="categories"
        />
        <StatCard
          label="Document Chunks"
          value={loadingStats ? '...' : `${stats.chunks_count} Chunks`}
          icon="🗎"
          variant="chunks"
        />
        <StatCard
          label="Embedding Dimension"
          value="768d"
          icon="⚙"
          variant="dimension"
        />
      </div>

      <div className="dashboard-sections">
        <Card title="Active Categories" icon="🏷">
          {loadingCategories ? (
            <Spinner size="small" />
          ) : categories.length === 0 ? (
            <p className="page-subtitle">No categories created yet. Go to the Categories tab to create one.</p>
          ) : (
            <div className="category-tags-wrap">
              {categories.map((cat) => (
                <span key={cat.id} className="category-tag-badge">
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
