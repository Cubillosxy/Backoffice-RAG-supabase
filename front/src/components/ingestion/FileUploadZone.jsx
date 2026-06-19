import React, { useRef, useState } from 'react';

export const FileUploadZone = ({ selectedFile, onFileSelect, onClearFile, showToast }) => {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSelectFile(e.target.files[0]);
    }
  };

  const validateAndSelectFile = (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'md', 'txt'].includes(ext)) {
      if (showToast) {
        showToast('File format not supported. Upload PDF, MD or TXT.', 'error');
      }
      return;
    }
    onFileSelect(file);
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div 
      className={`dropzone ${dragActive ? 'active' : ''}`}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={onButtonClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        accept=".pdf,.md,.txt"
        onChange={handleChange}
      />
      
      {!selectedFile ? (
        <>
          <span className="dropzone-icon" style={{ fontSize: '2.5rem' }}>☁</span>
          <p style={{ fontWeight: '500' }}>Drag and drop your files here or click to browse</p>
          <p className="page-subtitle" style={{ fontSize: '0.85rem' }}>Supports PDF, MD and TXT (Max. 10MB)</p>
        </>
      ) : (
        <div className="file-badge" onClick={(e) => e.stopPropagation()}>
          <span>🗎</span>
          <span>{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
          <button type="button" className="btn-remove-file" onClick={onClearFile}>
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
