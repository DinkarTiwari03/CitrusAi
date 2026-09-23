import { useState } from 'react';
import { Database, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * LocalSources — Displays FAISS RAG local knowledge citations.
 * @param {Array<{source: string, similarity: number, text: string}>} sources
 */
export default function LocalSources({ sources = [] }) {
  const [expanded, setExpanded] = useState({});

  const toggle = (i) => setExpanded((prev) => ({ ...prev, [i]: !prev[i] }));

  if (!sources.length) {
    return (
      <section aria-label="Local Knowledge Sources">
        <div style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          No local RAG sources retrieved.
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Local Knowledge Sources">
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
          style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-cyan-light)', color: 'var(--accent-cyan)' }}
          aria-hidden="true"
        >
          <Database size={15} />
        </div>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>
          Local Knowledge · FAISS RAG
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: '0.72rem',
            fontWeight: 600,
            padding: '0.15rem 0.5rem',
            background: 'var(--accent-cyan-light)',
            color: 'var(--accent-cyan)',
            borderRadius: 'var(--radius-full)',
          }}
        >
          {sources.length} sources
        </span>
      </div>

      <ul style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', listStyle: 'none' }}>
        {sources.map((src, i) => {
          const isOpen = !!expanded[i];
          const similarityPct = (src.similarity * 100).toFixed(1);

          return (
            <li key={i} className="source-card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Header row */}
              <button
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.9rem',
                  background: 'none',
                  cursor: 'pointer',
                  gap: '0.75rem',
                  textAlign: 'left',
                }}
                onClick={() => toggle(i)}
                aria-expanded={isOpen}
                aria-controls={`local-source-${i}`}
                aria-label={`Local source ${src.source}, similarity ${similarityPct}%. ${isOpen ? 'Collapse' : 'Expand'} to ${isOpen ? 'hide' : 'read'} excerpt.`}
              >
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-cyan)', fontFamily: 'monospace', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  📄 {src.source}
                </span>
                <span className="badge badge-disease" style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem', flexShrink: 0 }}>
                  {similarityPct}% match
                </span>
                {isOpen ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
              </button>

              {/* Expandable text */}
              {isOpen && (
                <div
                  id={`local-source-${i}`}
                  style={{
                    padding: '0.75rem 0.9rem',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.7,
                    borderTop: '1px solid var(--border-subtle)',
                    background: 'rgba(6,182,212,0.03)',
                  }}
                >
                  {src.text || 'No excerpt available.'}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
