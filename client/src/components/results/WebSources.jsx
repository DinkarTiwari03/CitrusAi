import { Globe, ExternalLink } from 'lucide-react';

/**
 * WebSources — Displays live web search results retrieved by the agentic RAG browser.
 * @param {Array<{title: string, url: string, snippet: string}>} sources
 */
export default function WebSources({ sources = [] }) {
  if (!sources.length) {
    return (
      <section aria-label="Web Knowledge Sources">
        <div style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          No web sources retrieved. The AI agent may have been unable to reach the internet.
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Web Knowledge Sources">
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
          style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-lime-light)', color: 'var(--accent-lime)' }}
          aria-hidden="true"
        >
          <Globe size={15} />
        </div>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>
          Web Knowledge · Browser RAG
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: '0.72rem',
            fontWeight: 600,
            padding: '0.15rem 0.5rem',
            background: 'var(--accent-lime-light)',
            color: 'var(--accent-lime)',
            borderRadius: 'var(--radius-full)',
          }}
        >
          {sources.length} results
        </span>
      </div>

      <ul style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', listStyle: 'none' }}>
        {sources.map((src, i) => (
          <li key={i} className="source-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <a
              href={src.url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'var(--accent-lime)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                textDecoration: 'none',
              }}
              aria-label={`Web source: ${src.title}. Opens in new tab.`}
            >
              {src.title || 'Untitled Source'}
              {src.url && <ExternalLink size={12} aria-hidden="true" style={{ flexShrink: 0 }} />}
            </a>

            {src.url && (
              <p
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--text-muted)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {src.url}
              </p>
            )}

            {src.snippet && (
              <p
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.55,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {src.snippet}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
