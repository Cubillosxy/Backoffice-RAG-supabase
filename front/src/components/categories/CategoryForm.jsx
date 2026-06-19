import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { api } from '../../services/api';

export const CategoryForm = ({ onCategoryCreated, showToast }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);

    try {
      await api.createCategory(name.trim(), description.trim());
      showToast(`Categoría '${name}' creada exitosamente.`, 'success');
      setName('');
      setDescription('');
      onCategoryCreated();
    } catch (err) {
      showToast(err.message || 'Error al crear la categoría.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="category-name">Nombre de la Categoría *</label>
        <input
          id="category-name"
          type="text"
          className="form-control"
          placeholder="Ej: educacion, proyectos, faqs"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="category-desc">Descripción</label>
        <textarea
          id="category-desc"
          className="form-control"
          rows="4"
          placeholder="Describe brevemente qué tipo de información contendrá esta categoría..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <Button type="submit" variant="primary" loading={loading} disabled={loading}>
        Crear Categoría
      </Button>
    </form>
  );
};
