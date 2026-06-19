import React from 'react';

export const RawTextForm = ({ rawText, onTextChange }) => {
  return (
    <div className="form-group">
      <label htmlFor="raw-text">Contenido de Texto</label>
      <textarea
        id="raw-text"
        className="form-control"
        rows="8"
        placeholder="Escribe o pega aquí el contenido de texto que deseas vectorizar e indexar..."
        value={rawText}
        onChange={(e) => onTextChange(e.target.value)}
        required
      />
    </div>
  );
};
