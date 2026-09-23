import { Brain, Activity } from 'lucide-react';

const DISEASE_META = {
  'Black spot': { emoji: '🟤', color: '#a16207', bg: 'rgba(161,98,7,0.12)', tag: 'Fungal Disease' },
  'Melanose':   { emoji: '🟠', color: '#c2410c', bg: 'rgba(194,65,12,0.12)', tag: 'Fungal Disease' },
  'canker':     { emoji: '🔴', color: '#dc2626', bg: 'rgba(220,38,38,0.12)', tag: 'Bacterial Disease' },
  'greening':   { emoji: '🟡', color: '#d97706', bg: 'rgba(217,119,6,0.12)', tag: 'Systemic Disease' },
  'healthy':    { emoji: '🟢', color: '#16a34a', bg: 'rgba(22,163,74,0.12)', tag: 'No Disease' },
};

/**
 * PredictionBadge — Displays disease name, confidence bar, and pixel metrics.
 * Accepts either { data } or direct props { disease, confidence, totalLeafPixels, affectedPixels }.
 */
export default function PredictionBadge(props) {
  const data = props.data || props;
  const { disease = 'healthy', confidence = 0, totalLeafPixels, affectedPixels } = data;
  const numConfidence = typeof confidence === 'number' ? confidence : parseFloat(confidence) || 0;
  const meta = DISEASE_META[disease] || { emoji: '🔵', color: 'var(--accent-cyan)', bg: 'var(--accent-cyan-light)', tag: 'Unknown' };

  return (
    <section aria-label="AI Prediction">
      {/* Section header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          padding: '0.9rem 1.25rem',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div
          style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary-light)', color: 'var(--primary)' }}
          aria-hidden="true"
        >
          <Brain size={15} />
        </div>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>
          AI Prediction · ConvNeXt
        </span>
      </div>

      <div style={{ padding: '1.25rem' }}>
        {/* Disease name + emoji */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
          <div
            style={{ width: 58, height: 58, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', background: meta.bg, flexShrink: 0 }}
            aria-hidden="true"
          >
            {meta.emoji}
          </div>
          <div>
            <h2
              style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em', color: meta.color, lineHeight: 1.1, marginBottom: '0.3rem' }}
            >
              {disease.charAt(0).toUpperCase() + disease.slice(1)}
            </h2>
            <span className="badge badge-disease" style={{ fontSize: '0.7rem' }}>
              {meta.tag}
            </span>
          </div>
        </div>

        {/* Confidence */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
              Model Confidence
            </span>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>
              {numConfidence.toFixed(2)}%
            </span>
          </div>
          <div className="progress-bar-bg">
            <div
              className="progress-bar-fill"
              style={{ width: `${Math.min(100, Math.max(0, numConfidence))}%` }}
              role="progressbar"
              aria-valuenow={Math.round(numConfidence)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Confidence: ${numConfidence.toFixed(2)}%`}
            />
          </div>
        </div>

        {/* Pixel metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="metric-box" aria-label={`Total leaf pixels: ${totalLeafPixels?.toLocaleString()}`}>
            <p className="metric-label">Total Leaf Pixels</p>
            <p className="metric-value" style={{ fontSize: '1.2rem' }}>{totalLeafPixels?.toLocaleString() ?? '—'}</p>
          </div>
          <div className="metric-box" aria-label={`Affected pixels: ${affectedPixels?.toLocaleString()}`}>
            <p className="metric-label">Affected Pixels</p>
            <p className="metric-value" style={{ fontSize: '1.2rem', color: disease === 'healthy' ? 'var(--primary)' : 'var(--accent-red)' }}>
              {affectedPixels?.toLocaleString() ?? '—'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
