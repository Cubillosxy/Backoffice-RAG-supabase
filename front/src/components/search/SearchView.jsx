import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { SearchResultItem } from './SearchResultItem';
import { api } from '../../services/api';

export const SearchView = ({ categories, showToast }) => {
  const [query, setQuery] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [threshold, setThreshold] = useState(0.4);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);

    try {
      const searchResults = await api.searchSemantic(query, categoryName, threshold);
      setResults(searchResults || []);
    } catch (err) {
      showToast('Error al conectar con la base de datos vectorial.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Card title="Búsqueda Semántica Vectorial" icon="🔍">
        <p className="page-subtitle" style={{ marginBottom: '1.5rem' }}>
          Busca por el significado conceptual de tu consulta usando similitud de coseno en pgvector
        </p>

        <form onSubmit={handleSearch}>
          <div className="form-group" style={{ position: 'relative' }}>
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Escribe tu consulta (Ej: qué experiencia tengo desarrollando con Node.js?)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              required
            />
            <span style={{ position: 'absolute', left: '1rem', top: '0.75rem', color: 'var(--text-muted)' }}>
              🔍
            </span>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ flex: '1 1 200px' }}>
              <label htmlFor="search-category" className="stat-label" style={{ display: 'block', marginBottom: '0.25rem' }}>
                Filtrar por Categoría
              </label>
              <select
                id="search-category"
                className="form-control"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
              >
                <option value="">Buscar en todas las categorías</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1.25rem' }}>
              <label htmlFor="search-threshold" className="stat-label">Umbral:</label>
              <input
                id="search-threshold"
                type="number"
                className="form-control"
                style={{ width: '80px', textAlign: 'center' }}
                min="0.1"
                max="0.9"
                step="0.05"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
              />
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.05"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                style={{ accentColor: 'hsl(var(--accent))' }}
              />
            </div>

            <div style={{ marginTop: '1.25rem' }}>
              <Button type="submit" variant="primary" loading={loading} disabled={loading}>
                Buscar
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {searched && (
        <Card title="Resultados de la Búsqueda" icon="📋" className="search-results-section" style={{ marginTop: '2rem' }}>
          {loading ? (
            <Spinner />
          ) : results.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'hsl(var(--text-secondary))' }}>
              <p>No se encontraron resultados que superen la similitud mínima de {threshold}.</p>
            </div>
          ) : (
            <div className="search-results">
              {results.map((res, index) => (
                <SearchResultItem key={index} result={res} />
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
