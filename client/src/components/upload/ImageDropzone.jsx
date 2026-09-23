import { useCallback, useRef, useState } from 'react';
import { Upload, ImagePlus } from 'lucide-react';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * ImageDropzone — Drag-and-drop + click-to-upload zone.
 * Validates MIME type and file size before calling onFileSelect.
 * @param {Function} onFileSelect - Receives a valid File object
 * @param {Function} [onError]    - Receives an error string
 * @param {boolean}  [disabled]   - Disables interaction
 */
export default function ImageDropzone({ onFileSelect, onError, disabled = false }) {
  const inputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const validate = useCallback(
    (file) => {
      if (!file) return;
      if (!ALLOWED_TYPES.includes(file.type)) {
        onError?.(`Unsupported file type "${file.type}". Please upload a JPG, PNG, or WebP image.`);
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        onError?.(`File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum size is 10 MB.`);
        return;
      }
      onFileSelect(file);
    },
    [onFileSelect, onError]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled) return;
      const file = e.dataTransfer.files?.[0];
      validate(file);
    },
    [disabled, validate]
  );

  const handleDragOver = (e) => { e.preventDefault(); if (!disabled) setIsDragOver(true); };
  const handleDragLeave = () => setIsDragOver(false);

  const handleInputChange = (e) => {
    validate(e.target.files?.[0]);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
      e.preventDefault();
      inputRef.current?.click();
    }
  };

  return (
    <div
      className={`dropzone-container${isDragOver ? ' is-dragover' : ''}${disabled ? ' disabled' : ''}`}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="Upload citrus leaf image. Drag and drop or press Enter to browse."
      aria-disabled={disabled}
      onClick={() => !disabled && inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onKeyDown={handleKeyDown}
      style={{ cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1 }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleInputChange}
        style={{ display: 'none' }}
        aria-hidden="true"
        tabIndex={-1}
        disabled={disabled}
      />

      <div className="dropzone-icon-wrapper" aria-hidden="true">
        {isDragOver ? <Upload size={28} /> : <ImagePlus size={28} />}
      </div>

      <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
        {isDragOver ? 'Drop the image here' : 'Drag & drop a citrus leaf image'}
      </p>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
        or <span style={{ color: 'var(--primary)', fontWeight: 600 }}>click to browse</span>
      </p>

      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}
        aria-label="Supported formats: JPG, PNG, WebP. Maximum size: 10 MB"
      >
        {['JPG', 'PNG', 'WebP'].map((fmt) => (
          <span key={fmt} className="badge badge-disease" style={{ fontSize: '0.7rem', padding: '0.2rem 0.55rem' }}>
            {fmt}
          </span>
        ))}
        <span
          style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            padding: '0.2rem 0.6rem',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-full)',
          }}
        >
          max 10 MB
        </span>
      </div>
    </div>
  );
}
