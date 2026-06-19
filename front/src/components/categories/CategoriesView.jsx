import React from 'react';
import { Card } from '../ui/Card';
import { Spinner } from '../ui/Spinner';
import { CategoryForm } from './CategoryForm';

export const CategoriesView = ({ categories, loadingCategories, onCategoryCreated, showToast }) => {
  return (
    <div className="view-split">
      <Card title="Crear Nueva Categoría" icon="🏷">
        <p className="page-subtitle" style={{ marginBottom: '1.5rem' }}>
          Define un nuevo catálogo para estructurar tu conocimiento
        </p>
        <CategoryForm onCategoryCreated={onCategoryCreated} showToast={showToast} />
      </Card>

      <Card title="Listado Completo" icon="📋">
        {loadingCategories ? (
          <Spinner />
        ) : categories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'hsl(var(--text-secondary))' }}>
            <p>No hay categorías registradas en la base de datos.</p>
          </div>
        ) : (
          <div className="category-badges-detailed">
            {categories.map((cat) => (
              <div key={cat.id} className="category-badge-detailed">
                <h4>🏷 {cat.name}</h4>
                <p>{cat.description || 'Sin descripción proporcionada.'}</p>
                <small>ID: {cat.id}</small>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
