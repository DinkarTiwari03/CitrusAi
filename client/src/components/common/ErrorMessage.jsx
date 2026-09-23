import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * ErrorMessage — Displays an error state with optional retry callback.
 * @param {string} message - Error message to display
 * @param {Function} [onRetry] - Optional retry callback
 * @param {number} [statusCode] - HTTP status for specific messaging
 */
export default function ErrorMessage({ message, onRetry, statusCode }) {
  const title =
    statusCode === 503
      ? 'Service Unavailable'
      : statusCode === 504
      ? 'Request Timed Out'
      : statusCode === 415
      ? 'Unsupported File Type'
      : statusCode === 413
      ? 'File Too Large'
      : 'Analysis Failed';

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.9rem',
        padding: '2.5rem 2rem',
        textAlign: 'center',
        background: 'rgba(239,68,68,0.06)',
        border: '1px solid rgba(239,68,68,0.2)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          background: 'rgba(239,68,68,0.12)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--accent-red)',
          flexShrink: 0,
        }}
        aria-hidden="true"
      >
        <AlertTriangle size={22} />
      </div>

      <div>
        <p style={{ fontWeight: 700, color: 'var(--accent-red)', fontSize: '1rem', marginBottom: '0.35rem' }}>
          {title}
        </p>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 420 }}>
          {message}
        </p>
      </div>

      {statusCode === 503 && (
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: 360 }}>
          Make sure the Express backend and Python FastAPI AI service are running before retrying.
        </p>
      )}

      {onRetry && (
        <button
          className="btn btn-secondary"
          onClick={onRetry}
          style={{ marginTop: '0.25rem', gap: '0.4rem' }}
        >
          <RefreshCw size={14} />
          Retry Analysis
        </button>
      )}
    </div>
  );
}
