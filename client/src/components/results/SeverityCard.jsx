import { Microscope } from 'lucide-react';

const SEVERITY_STYLES = {
  Mild:     { color: '#34d399', bg: 'rgba(16,185,129,0.15)', bar: '#10b981' },
  Moderate: { color: '#fbbf24', bg: 'rgba(245,158,11,0.15)', bar: '#f59e0b' },
  Severe:   { color: '#f87171', bg: 'rgba(239,68,68,0.15)',  bar: '#ef4444' },
  Critical: { color: '#fca5a5', bg: 'rgba(220,38,38,0.25)',  bar: '#dc2626' },
  Unknown:  { color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.05)', bar: 'var(--text-muted)' },
};

/**
 * SeverityCard — OpenCV severity assessment results.
 * Accepts either { data } or direct props { severity, affectedArea }.
 */
export default function SeverityCard(props) {
  const data = props.data || props;
  const { severity = 'Unknown', affectedArea = 0 } = data;
  const numArea = typeof affectedArea === 'number' ? affectedArea : parseFloat(affectedArea) || 0;
  const style = SEVERITY_STYLES[severity] || SEVERITY_STYLES.Unknown;

  return (
    <section aria-label="Severity Assessment">
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
          style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(245,158,11,0.12)', color: 'var(--accent-amber)' }}
          aria-hidden="true"
        >
          <Microscope size={15} />
        </div>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>
          Severity Assessment · OpenCV
        </span>
      </div>

      <div style={{ padding: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '1rem', alignItems: 'start' }}>
          {/* Big severity badge */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 12,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: style.bg,
              border: `1px solid ${style.color}33`,
              gap: '0.2rem',
              flexShrink: 0,
            }}
            aria-label={`Severity: ${severity}`}
          >
            <span style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: style.color, opacity: 0.8 }}>
              Severity
            </span>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: style.color, textAlign: 'center', lineHeight: 1.1 }}>
              {severity}
            </span>
          </div>

          {/* Affected area */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
                Affected Area
              </span>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: style.color }}>
                {numArea.toFixed(2)}%
              </span>
            </div>
            <div className="progress-bar-bg">
              <div
                style={{ height: '100%', borderRadius: 'var(--radius-full)', background: style.bar, width: `${Math.min(numArea, 100)}%`, transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)' }}
                role="progressbar"
                aria-valuenow={Math.round(numArea)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${numArea.toFixed(2)}% of leaf affected`}
              />
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.5rem', lineHeight: 1.5 }}>
              {numArea < 10
                ? 'Minimal infection — early stage or localized.'
                : numArea < 30
                ? 'Moderate spread — monitor and treat promptly.'
                : numArea < 60
                ? 'Significant infection — treatment is recommended.'
                : 'Severe infection — immediate intervention required.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
