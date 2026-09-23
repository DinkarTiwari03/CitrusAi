import PredictionBadge from './PredictionBadge.jsx';
import SeverityCard from './SeverityCard.jsx';
import PriorityBadge from './PriorityBadge.jsx';
import RecommendationsList from './RecommendationsList.jsx';
import LocalSources from './LocalSources.jsx';
import WebSources from './WebSources.jsx';
import { FileText } from 'lucide-react';

/**
 * ResultsPanel — Orchestrates all six result sections for a prediction.
 * @param {Object} data - Full prediction object from the API
 */
export default function ResultsPanel({ data }) {
  if (!data) return null;

  const sections = [
    {
      component: <PredictionBadge data={data} />,
      key: 'prediction',
    },
    {
      component: <SeverityCard data={data} />,
      key: 'severity',
    },
    {
      component: <PriorityBadge priority={data.priority} />,
      key: 'priority',
    },
    {
      component: <RecommendationsList recommendations={data.recommendations} />,
      key: 'recommendations',
    },
    {
      component: <LocalSources sources={data.localSources} />,
      key: 'local',
    },
    {
      component: <WebSources sources={data.webSources} />,
      key: 'web',
    },
  ];

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
      aria-label="Analysis results"
    >
      {sections.map(({ component, key }) => (
        <div
          key={key}
          className="glass-card"
          style={{ overflow: 'hidden' }}
        >
          {component}
        </div>
      ))}

      {/* Full advisory text — collapsible */}
      {data.advisory && (
        <details
          className="glass-card"
          style={{ overflow: 'hidden' }}
        >
          <summary
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.9rem 1.25rem',
              cursor: 'pointer',
              listStyle: 'none',
              userSelect: 'none',
            }}
            aria-label="Toggle full advisory text"
          >
            <div
              style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(148,163,184,0.1)', color: 'var(--text-muted)' }}
              aria-hidden="true"
            >
              <FileText size={15} />
            </div>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>
              Full Advisory Text
            </span>
            <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Click to expand
            </span>
          </summary>
          <pre
            style={{
              padding: '1rem 1.25rem',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.75,
              whiteSpace: 'pre-wrap',
              maxHeight: 300,
              overflowY: 'auto',
              fontFamily: '"Courier New", monospace',
              background: 'rgba(255,255,255,0.02)',
              borderTop: '1px solid var(--border-subtle)',
              margin: 0,
            }}
            aria-label="Full advisory text"
          >
            {data.advisory}
          </pre>
        </details>
      )}

      {/* Timestamp */}
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right', paddingRight: '0.25rem' }}>
        Analysed on {new Date(data.createdAt).toLocaleString()}
        {data._id && ` · ID: ${data._id}`}
      </p>
    </div>
  );
}
