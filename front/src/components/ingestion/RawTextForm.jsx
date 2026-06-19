import React from 'react';

export const RawTextForm = ({ rawText, onTextChange }) => {
  return (
    <div className="form-group">
      <label htmlFor="raw-text">Text Content</label>
      <textarea
        id="raw-text"
        className="form-control"
        rows="8"
        placeholder="Write or paste the text content you wish to vectorize and index here..."
        value={rawText}
        onChange={(e) => onTextChange(e.target.value)}
      />
    </div>
  );
};
