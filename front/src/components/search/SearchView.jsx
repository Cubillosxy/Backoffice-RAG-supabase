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
  const [searchStep, setSearchStep] = useState(0); // 0 = idle, 1 = embedding, 2 = matching

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    setResults([]);
    setSearchStep(1);

    const start = Date.now();

    try {
      const searchResults = await api.searchSemantic(query, categoryName, threshold);
      
      // Minimum duration for step 1 (embedding generation display)
      const elapsed1 = Date.now() - start;
      if (elapsed1 < 700) {
        await new Promise(resolve => setTimeout(resolve, 700 - elapsed1));
      }

      setSearchStep(2);
      const startStep2 = Date.now();

      // Minimum duration for step 2 (matching process display)
      const elapsed2 = Date.now() - startStep2;
      if (elapsed2 < 800) {
        await new Promise(resolve => setTimeout(resolve, 800 - elapsed2));
      }

      setResults(searchResults || []);
    } catch (err) {
      showToast('Error connecting to the vector database.', 'error');
    } finally {
      setSearchStep(0);
      setLoading(false);
    }
  };

  return (
    <div>
      <Card title="Vector Semantic Search" icon="🔍">
        <p className="page-subtitle" style={{ marginBottom: '1.5rem' }}>
          Search by the conceptual meaning of your query using cosine similarity in pgvector
        </p>

        <form onSubmit={handleSearch}>
          <div className="form-group search-input-wrap">
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Type your query (e.g. what experience do I have developing with Node.js?)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              required
            />
            <span className="search-input-icon">🔍</span>
          </div>

          <div className="search-controls">
            <div className="filter-group">
              <label htmlFor="search-category" className="stat-label" style={{ display: 'block', marginBottom: '0.25rem' }}>
                Filter by Category
              </label>
              <select
                id="search-category"
                className="form-control"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
              >
                <option value="">Search all categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="threshold-group">
              <label htmlFor="search-threshold" className="stat-label">Threshold:</label>
              <input
                id="search-threshold"
                type="number"
                className="form-control threshold-input"
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

            <div className="action-group">
              <Button type="submit" variant="primary" loading={loading} disabled={loading}>
                Search
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {searched && (
        <Card title="Search Results" icon="📋" className="search-results-section" style={{ marginTop: '2rem' }}>
          {loading ? (
            <div className="progress-tracker" style={{ margin: '1rem 0' }}>
              <div className={`progress-step-item ${searchStep === 1 ? 'active' : searchStep > 1 ? 'completed' : 'pending'}`}>
                <div className={`progress-step-icon ${searchStep === 1 ? 'active' : searchStep > 1 ? 'completed' : 'pending'}`}>
                  {searchStep > 1 ? '✓' : '1'}
                </div>
                <div className="progress-step-details">
                  <h4>Generating Query Embedding</h4>
                  <p>Running sentence-transformers locally (Google Gemma-300m model)</p>
                </div>
              </div>

              <div className={`progress-step-item ${searchStep === 2 ? 'active' : searchStep > 2 ? 'completed' : 'pending'}`}>
                <div className={`progress-step-icon ${searchStep === 2 ? 'active' : searchStep > 2 ? 'completed' : 'pending'}`}>
                  {searchStep > 2 ? '✓' : '2'}
                </div>
                <div className="progress-step-details">
                  <h4>Executing Vector Similarity Match</h4>
                  <p>Comparing embeddings in Supabase pgvector using threshold {threshold}</p>
                </div>
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="search-empty">
              <p>No results found that exceed the minimum similarity of {threshold}.</p>
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
