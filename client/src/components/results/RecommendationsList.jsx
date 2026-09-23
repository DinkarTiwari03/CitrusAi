import { ClipboardList, CheckCircle2 } from 'lucide-react';

/**
 * RecommendationsList — Numbered actionable recommendations from the agentic advisory.
 * @param {string[]} recommendations - Array of recommendation strings
 */
export default function RecommendationsList({ recommendations = [] }) {
  if (!recommendations.length) {
    return (
      <section aria-label="Crop Advisory Recommendations">
        <div style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          No recommendations available.
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Crop Advisory Recommendations">
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
          <ClipboardList size={15} />
        </div>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>
          Agentic Crop Advisory
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: '0.72rem',
            fontWeight: 600,
            padding: '0.15rem 0.5rem',
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            borderRadius: 'var(--radius-full)',
          }}
          aria-label={`${recommendations.length} recommendations`}
        >
          {recommendations.length} actions
        </span>
      </div>

      <ul
        style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', listStyle: 'none' }}
        aria-label={`${recommendations.length} crop advisory recommendations`}
      >
        {recommendations.map((rec, i) => (
          <li
            key={i}
            className="source-card"
            style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem 1rem' }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                borderRadius: '50%',
                fontSize: '0.72rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: 1,
              }}
              aria-hidden="true"
            >
              {i + 1}
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {rec}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
