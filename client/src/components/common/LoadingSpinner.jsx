/**
 * LoadingSpinner — Animated loading indicator with step messages for the AI pipeline.
 * @param {string} label - Primary loading message
 * @param {string} [sub]  - Secondary sub-message
 * @param {number} [uploadProgress] - 0-100 upload progress, shown as bar
 */
export default function LoadingSpinner({ label = 'Processing…', sub, uploadProgress }) {
  return (
    <div className="loading-steps-container" role="status" aria-live="polite" aria-label={label}>
      {/* Spinner ring */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
        <div
          style={{
            width: 52,
            height: 52,
            border: '3px solid rgba(16,185,129,0.15)',
            borderTopColor: 'var(--primary)',
            borderRadius: '50%',
            animation: 'citrus-spin 0.9s linear infinite',
          }}
          aria-hidden="true"
        />
      </div>

      <style>{`
        @keyframes citrus-spin { to { transform: rotate(360deg); } }
      `}</style>

      <p
        style={{
          textAlign: 'center',
          fontWeight: 600,
          fontSize: '1rem',
          color: 'var(--text-primary)',
          marginBottom: sub ? '0.35rem' : 0,
        }}
      >
        {label}
      </p>

      {sub && (
        <p style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          {sub}
        </p>
      )}

      {typeof uploadProgress === 'number' && (
        <div style={{ marginTop: '1.25rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              marginBottom: '0.4rem',
            }}
          >
            <span>Uploading image</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="progress-bar-bg">
            <div
              className="progress-bar-fill"
              style={{ width: `${uploadProgress}%` }}
              role="progressbar"
              aria-valuenow={uploadProgress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      )}

      {/* AI pipeline steps */}
      <div style={{ marginTop: '1.75rem' }}>
        {[
          { label: 'ConvNeXt Classification', active: true },
          { label: 'OpenCV Severity Assessment', active: uploadProgress >= 100 },
          { label: 'FAISS RAG Retrieval', active: false },
          { label: 'Agentic Advisory Generation', active: false },
        ].map((step, i) => (
          <div
            key={i}
            className={`step-item${step.active ? ' active' : ''}`}
          >
            <div className="step-indicator" aria-hidden="true">
              {step.active ? (
                <span style={{ fontSize: 10 }}>⟳</span>
              ) : (
                <span style={{ fontSize: 11 }}>{i + 1}</span>
              )}
            </div>
            <div style={{ paddingTop: 5 }}>
              <p
                style={{
                  fontSize: '0.85rem',
                  fontWeight: step.active ? 600 : 400,
                  color: step.active ? 'var(--text-primary)' : 'var(--text-muted)',
                }}
              >
                {step.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
