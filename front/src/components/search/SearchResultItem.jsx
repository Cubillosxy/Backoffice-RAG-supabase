import React from 'react';

export const SearchResultItem = ({ result }) => {
  const simPercentage = (result.similarity * 100).toFixed(1);
  const scoreClass = result.similarity >= 0.65 ? 'high' : 'mid';

  return (
    <div className="search-result-card">
      <div className="search-result-header">
        <span 
          style={{
            fontSize: '0.75rem',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '0.25rem 0.5rem',
            borderRadius: '4px',
            color: '#818cf8',
            fontWeight: '600'
          }}
        >
          🏷 Chunks
        </span>
        <span className={`similarity-badge ${scoreClass}`}>
          {simPercentage}% Match
        </span>
      </div>

      <div className="result-content">
        {result.content}
      </div>

      {result.metadata && Object.keys(result.metadata).length > 0 && (
        <div className="metadata-tags">
          {Object.entries(result.metadata).map(([key, val]) => (
            <span key={key} className="metadata-tag">
              <strong>{key}:</strong> {String(val)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
