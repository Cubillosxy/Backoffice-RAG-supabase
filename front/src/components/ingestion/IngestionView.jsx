import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { FileUploadZone } from './FileUploadZone';
import { RawTextForm } from './RawTextForm';
import { api } from '../../services/api';

const DEFAULT_METADATA = JSON.stringify({ version: 1.0 }, null, 2);

export const IngestionView = ({ categories, showToast }) => {
  const [categoryName, setCategoryName] = useState('');
  const [ingestMode, setIngestMode] = useState('file'); // 'file' or 'raw'
  const [selectedFile, setSelectedFile] = useState(null);
  const [rawText, setRawText] = useState('');
  const [metadata, setMetadata] = useState(DEFAULT_METADATA);
  const [loading, setLoading] = useState(false);
  const [progressStep, setProgressStep] = useState(0); // 0 = idle, 1 = upload, 2 = chunking, 3 = embedding, 4 = database, 5 = complete
  const [ingestionResult, setIngestionResult] = useState(null);

  const handleFileSelect = (file) => {
    setSelectedFile(file);
  };

  const handleClearFile = () => {
    setSelectedFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoryName) {
      showToast('Select a category to index.', 'error');
      return;
    }

    let parsedMetadata = {};
    if (metadata.trim()) {
      try {
        parsedMetadata = JSON.parse(metadata);
      } catch (err) {
        showToast('The metadata field does not contain a valid JSON.', 'error');
        return;
      }
    }

    // Autofill filename if not present in file ingestion mode
    if (ingestMode === 'file' && selectedFile && !parsedMetadata.filename) {
      parsedMetadata.filename = selectedFile.name;
    }

    // Autofill created_at with current date (YYYY-MM-DD) if not present
    if (!parsedMetadata.created_at) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      parsedMetadata.created_at = `${yyyy}-${mm}-${dd}`;
    }

    setLoading(true);
    setProgressStep(1);
    setIngestionResult(null);

    const timer1 = setTimeout(() => setProgressStep(2), 600);
    const timer2 = setTimeout(() => setProgressStep(3), 1500);
    const timer3 = setTimeout(() => setProgressStep(4), 5000);

    try {
      if (ingestMode === 'file') {
        if (!selectedFile) {
          showToast('Select or drag a file first.', 'error');
          setLoading(false);
          setProgressStep(0);
          return;
        }

        const res = await api.uploadFile(categoryName, selectedFile, parsedMetadata);
        if (res.status === 'skipped') {
          showToast('Deduplicated: The file was already uploaded with the same content.', 'info');
        } else {
          showToast(`Successfully indexed ${res.chunks_count} vector chunks.`, 'success');
          setSelectedFile(null);
          setMetadata(DEFAULT_METADATA);
        }
        setIngestionResult(res);
      } else {
        if (!rawText.trim()) {
          showToast('Write plain text to be able to index it.', 'error');
          setLoading(false);
          setProgressStep(0);
          return;
        }

        const res = await api.ingestRawText(categoryName, rawText, parsedMetadata);
        showToast('Plain text successfully indexed in Supabase.', 'success');
        setRawText('');
        setMetadata(DEFAULT_METADATA);
        setIngestionResult({
          status: 'success',
          filename: 'N/A (Plain Text)',
          category_name: categoryName,
          created_at: new Date().toISOString(),
          chunks_count: 1
        });
      }
      
      setProgressStep(5);
      // Keep success state for 1.5 seconds before returning to idle
      await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (err) {
      showToast(err.message || 'Error during ingestion process.', 'error');
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setLoading(false);
      setProgressStep(0);
    }
  };

  return (
    <div className="view-split">
      <Card title="Upload Information" icon="📥">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="ingest-category">Category *</label>
            <select
              id="ingest-category"
              className="form-control"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              required
            >
              <option value="" disabled>Select a category...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Input Type</label>
            <div className="tab-headers">
              <button
                type="button"
                className={`tab-header ${ingestMode === 'file' ? 'active' : ''}`}
                onClick={() => setIngestMode('file')}
              >
                Upload File
              </button>
              <button
                type="button"
                className={`tab-header ${ingestMode === 'raw' ? 'active' : ''}`}
                onClick={() => setIngestMode('raw')}
              >
                Plain Text
              </button>
            </div>
          </div>

          {ingestMode === 'file' ? (
            <div className="form-group">
              <FileUploadZone
                selectedFile={selectedFile}
                onFileSelect={handleFileSelect}
                onClearFile={handleClearFile}
                showToast={showToast}
              />
            </div>
          ) : (
            <RawTextForm rawText={rawText} onTextChange={setRawText} />
          )}

          <div className="form-group">
            <label htmlFor="metadata-input">Optional Metadata (JSON Format)</label>
            <textarea
              id="metadata-input"
              className="form-control meta-textarea"
              rows="3"
              placeholder='{ "url": "https://my-portfolio.com", "author": "John", "version": "1.0.0" }'
              value={metadata}
              onChange={(e) => setMetadata(e.target.value)}
            />
          </div>

          <Button type="submit" variant="primary" loading={loading} disabled={loading}>
            Index in Supabase
          </Button>
        </form>
      </Card>

      {progressStep > 0 ? (
        <Card title="Ingestion Progress" icon="⚙">
          <div className="progress-tracker">
            <div className={`progress-step-item ${progressStep === 1 ? 'active' : progressStep > 1 ? 'completed' : 'pending'}`}>
              <div className={`progress-step-icon ${progressStep === 1 ? 'active' : progressStep > 1 ? 'completed' : 'pending'}`}>
                {progressStep > 1 ? '✓' : '1'}
              </div>
              <div className="progress-step-details">
                <h4>{ingestMode === 'file' ? 'Uploading file to server' : 'Reading text content'}</h4>
                <p>Transferring input data to FastAPI backend</p>
              </div>
            </div>

            <div className={`progress-step-item ${progressStep === 2 ? 'active' : progressStep > 2 ? 'completed' : 'pending'}`}>
              <div className={`progress-step-icon ${progressStep === 2 ? 'active' : progressStep > 2 ? 'completed' : 'pending'}`}>
                {progressStep > 2 ? '✓' : '2'}
              </div>
              <div className="progress-step-details">
                <h4>Extracting and chunking text</h4>
                <p>Parsing text content and splitting it into overlaps</p>
              </div>
            </div>

            <div className={`progress-step-item ${progressStep === 3 ? 'active' : progressStep > 3 ? 'completed' : 'pending'}`}>
              <div className={`progress-step-icon ${progressStep === 3 ? 'active' : progressStep > 3 ? 'completed' : 'pending'}`}>
                {progressStep > 3 ? '✓' : '3'}
              </div>
              <div className="progress-step-details">
                <h4>Generating Gemma-300m Embeddings</h4>
                <p>Running sentence-transformers locally (CPU calculations)</p>
              </div>
            </div>

            <div className={`progress-step-item ${progressStep === 4 ? 'active' : progressStep > 4 ? 'completed' : 'pending'}`}>
              <div className={`progress-step-icon ${progressStep === 4 ? 'active' : progressStep > 4 ? 'completed' : 'pending'}`}>
                {progressStep > 4 ? '✓' : '4'}
              </div>
              <div className="progress-step-details">
                <h4>Saving to Supabase pgvector</h4>
                <p>Storing vector embeddings and metadata index</p>
              </div>
            </div>

            {progressStep === 5 && (
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem 1rem',
                background: 'rgba(45, 212, 191, 0.08)',
                border: '1px solid rgba(45, 212, 191, 0.2)',
                borderRadius: '8px',
                color: '#2dd4bf',
                fontSize: '0.9rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span>✓</span> Ingestion completed successfully!
              </div>
            )}
          </div>
        </Card>
      ) : ingestionResult ? (
        <Card title="Ingestion Summary" icon="📋">
          <div className="summary-details">
            <div className="summary-item">
              <span className="summary-label">Status</span>
              <span className={`summary-badge ${ingestionResult.status === 'skipped' ? 'skipped' : 'success'}`}>
                {ingestionResult.status === 'skipped' ? 'Deduplicated (Skipped)' : 'Registered (Success)'}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Filename</span>
              <span className="summary-value">{ingestionResult.filename || 'N/A'}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Category</span>
              <span className="summary-value">{ingestionResult.category_name || 'N/A'}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Created At</span>
              <span className="summary-value">
                {ingestionResult.created_at
                  ? new Date(ingestionResult.created_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'N/A'}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Vector Chunks</span>
              <span className="summary-value">{ingestionResult.chunks_count ?? 0} chunks</span>
            </div>
          </div>
          <Button
            variant="secondary"
            className="clear-summary-btn"
            onClick={() => setIngestionResult(null)}
          >
            Clear Summary
          </Button>
        </Card>
      ) : (
        <Card title="Automatic Deduplication" icon="🗘">
          <div className="dedup-steps">
            <div className="dedup-step">
              <div className="dedup-step-icon" style={{ color: '#818cf8' }}>#</div>
              <div>
                <h4>MD5 Hashing</h4>
                <p className="page-subtitle">Each uploaded file generates a unique digital signature based on its binary content.</p>
              </div>
            </div>
            <div className="dedup-step">
              <div className="dedup-step-icon" style={{ color: '#2dd4bf' }}>🚫</div>
              <div>
                <h4>Avoid Duplicates</h4>
                <p className="page-subtitle">If you upload the exact same file, the system will prevent it to avoid duplicate vectors.</p>
              </div>
            </div>
            <div className="dedup-step">
              <div className="dedup-step-icon" style={{ color: '#f472b6' }}>↻</div>
              <div>
                <h4>Clean Overwrite</h4>
                <p className="page-subtitle">If you update your file content, the system will automatically delete previous vector chunks to avoid biases in the RAG.</p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
