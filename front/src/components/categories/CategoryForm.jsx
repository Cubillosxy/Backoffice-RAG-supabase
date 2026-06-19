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
      showToast(`Category '${name}' successfully created.`, 'success');
      setName('');
      setDescription('');
      onCategoryCreated();
    } catch (err) {
      showToast(err.message || 'Error creating the category.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="category-name">Category Name *</label>
        <input
          id="category-name"
          type="text"
          className="form-control"
          placeholder="e.g. education, projects, faqs"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="category-desc">Description</label>
        <textarea
          id="category-desc"
          className="form-control"
          rows="4"
          placeholder="Briefly describe what kind of information this category will contain..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <Button type="submit" variant="primary" loading={loading} disabled={loading}>
        Create Category
      </Button>
    </form>
  );
};
