import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { FileUploadZone } from './FileUploadZone';
import { RawTextForm } from './RawTextForm';
import { api } from '../../services/api';

export const IngestionView = ({ categories, showToast }) => {
  const [categoryName, setCategoryName] = useState('');
  const [ingestMode, setIngestMode] = useState('file'); // 'file' or 'raw'
  const [selectedFile, setSelectedFile] = useState(null);
  const [rawText, setRawText] = useState('');
  const [metadata, setMetadata] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileSelect = (file) => {
    setSelectedFile(file);
  };

  const handleClearFile = () => {
    setSelectedFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoryName) {
      showToast('Selecciona una categoría para indexar.', 'error');
      return;
    }

    let parsedMetadata = {};
    if (metadata.trim()) {
      try {
        parsedMetadata = JSON.parse(metadata);
      } catch (err) {
        showToast('El campo metadatos no contiene un JSON válido.', 'error');
        return;
      }
    }

    setLoading(true);

    try {
      if (ingestMode === 'file') {
        if (!selectedFile) {
          showToast('Selecciona o arrastra un archivo primero.', 'error');
          setLoading(false);
          return;
        }

        const res = await api.uploadFile(categoryName, selectedFile, parsedMetadata);
        if (res.status === 'skipped') {
          showToast('Deduplicado: El archivo ya estaba subido con el mismo contenido.', 'info');
        } else {
          showToast(`Se indexaron ${res.chunks_count} fragmentos vectoriales exitosamente.`, 'success');
          setSelectedFile(null);
          setMetadata('');
        }
      } else {
        if (!rawText.trim()) {
          showToast('Escribe texto plano para poder indexarlo.', 'error');
          setLoading(false);
          return;
        }

        await api.ingestRawText(categoryName, rawText, parsedMetadata);
        showToast('Texto plano indexado exitosamente en Supabase.', 'success');
        setRawText('');
        setMetadata('');
      }
    } catch (err) {
      showToast(err.message || 'Error durante el proceso de ingesta.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="view-split">
      <Card title="Cargar Información" icon="📥">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="ingest-category">Categoría *</label>
            <select
              id="ingest-category"
              className="form-control"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              required
            >
              <option value="" disabled>Selecciona una categoría...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Tipo de Entrada</label>
            <div className="tab-headers">
              <button
                type="button"
                className={`tab-header ${ingestMode === 'file' ? 'active' : ''}`}
                onClick={() => setIngestMode('file')}
              >
                Subir Archivo
              </button>
              <button
                type="button"
                className={`tab-header ${ingestMode === 'raw' ? 'active' : ''}`}
                onClick={() => setIngestMode('raw')}
              >
                Texto Plano
              </button>
            </div>
          </div>

          {ingestMode === 'file' ? (
            <div className="form-group">
              <FileUploadZone
                selectedFile={selectedFile}
                onFileSelect={handleFileSelect}
                onClearFile={handleClearFile}
              />
            </div>
          ) : (
            <RawTextForm rawText={rawText} onTextChange={setRawText} />
          )}

          <div className="form-group">
            <label htmlFor="metadata-input">Metadatos Opcionales (Formato JSON)</label>
            <textarea
              id="metadata-input"
              className="form-control"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
              rows="3"
              placeholder='{ "url": "https://mi-portafolio.com", "autor": "Juan" }'
              value={metadata}
              onChange={(e) => setMetadata(e.target.value)}
            />
          </div>

          <Button type="submit" variant="primary" loading={loading} disabled={loading}>
            Indexar en Supabase
          </Button>
        </form>
      </Card>

      <Card title="Deduplicación Automática" icon="🗘">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ fontSize: '1.5rem', color: '#818cf8' }}>#</div>
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem' }}>Hashing MD5</h4>
              <p className="page-subtitle" style={{ fontSize: '0.9rem' }}>
                Cada archivo subido genera una firma digital única en base a su contenido binario.
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ fontSize: '1.5rem', color: '#2dd4bf' }}>🚫</div>
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem' }}>Evitar Duplicados</h4>
              <p className="page-subtitle" style={{ fontSize: '0.9rem' }}>
                Si subes el mismo archivo idéntico, el sistema detendrá la ejecución para no duplicar vectores.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ fontSize: '1.5rem', color: '#f472b6' }}>↻</div>
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem' }}>Sobreescritura Limpia</h4>
              <p className="page-subtitle" style={{ fontSize: '0.9rem' }}>
                Si actualizas la información de tu archivo, el sistema borrará automáticamente los chunks vectoriales anteriores para evitar sesgos en el RAG.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
