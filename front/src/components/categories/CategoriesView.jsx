import React from 'react';
import { Card } from '../ui/Card';
import { Spinner } from '../ui/Spinner';
import { CategoryForm } from './CategoryForm';

export const CategoriesView = ({ categories, loadingCategories, onCategoryCreated, showToast }) => {
  return (
    <div className="view-split">
      <Card title="Create New Category" icon="🏷">
        <p className="page-subtitle" style={{ marginBottom: '1.5rem' }}>
          Define a new catalog to structure your knowledge
        </p>
        <CategoryForm onCategoryCreated={onCategoryCreated} showToast={showToast} />
      </Card>

      <Card title="Complete List" icon="📋">
        {loadingCategories ? (
          <Spinner />
        ) : categories.length === 0 ? (
          <div className="search-empty">
            <p>No categories registered in the database.</p>
          </div>
        ) : (
          <div className="category-badges-detailed">
            {categories.map((cat) => (
              <div key={cat.id} className="category-badge-detailed">
                <h4>🏷 {cat.name}</h4>
                <p>{cat.description || 'No description provided.'}</p>
                <small>ID: {cat.id}</small>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
