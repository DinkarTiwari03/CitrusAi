import { X, FileImage } from 'lucide-react';

/**
 * ImagePreview — Displays a preview of the selected image with metadata and a clear button.
 * @param {File} file - The File object to preview
 * @param {Function} onClear - Called when the user removes the image
 */
export default function ImagePreview({ file, onClear }) {
  if (!file) return null;

  const objectUrl = URL.createObjectURL(file);
  const sizeMB = (file.size / 1024 / 1024).toFixed(2);
  const sizeKB = (file.size / 1024).toFixed(0);
  const displaySize = file.size >= 1024 * 1024 ? `${sizeMB} MB` : `${sizeKB} KB`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      <div className="preview-card">
        <img
          className="preview-img"
          src={objectUrl}
          alt={`Preview of ${file.name}`}
          onLoad={() => URL.revokeObjectURL(objectUrl)}
          style={{ maxHeight: 360, objectFit: 'contain' }}
        />

        <div className="preview-overlay" style={{ position: 'absolute', top: 10, right: 10, zIndex: 5 }}>
          <button
            className="btn"
            onClick={onClear}
            aria-label="Remove selected image"
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'rgba(239,68,68,0.18)',
              color: 'var(--accent-red)',
              border: '1px solid rgba(239,68,68,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              transition: 'var(--transition)',
            }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* File metadata bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.55rem 0.9rem',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          minWidth: 0,
        }}
        aria-label={`Selected file: ${file.name}, size: ${displaySize}`}
      >
        <FileImage size={14} color="var(--primary)" aria-hidden="true" style={{ flexShrink: 0 }} />
        <span
          style={{
            flex: 1,
            fontSize: '0.78rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {file.name}
        </span>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', flexShrink: 0 }}>
          {displaySize}
        </span>
      </div>
    </div>
  );
}
