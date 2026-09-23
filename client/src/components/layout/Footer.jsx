import { Leaf, Code2 } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer-container" role="contentinfo">
      <div className="footer-content">
        <div
          className="footer-disclaimer"
          role="note"
          aria-label="Research disclaimer"
        >
          ⚠️ <strong>Research Prototype</strong> — This tool is intended for
          academic research and development purposes only. AI-generated disease
          classifications should not be used as the sole basis for agricultural
          or commercial decisions. Always consult a qualified agronomist.
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Leaf size={14} color="var(--primary)" aria-hidden="true" />
            <span style={{ fontSize: '0.8rem' }}>
              <strong style={{ color: 'var(--text-secondary)' }}>CitrusAI</strong>{' '}
              — Intelligent Disease Classification &amp; Agentic Advisory
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.78rem' }}>
            <span>ConvNeXt · OpenCV · FAISS RAG · Agentic LLM</span>
            <span
              style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Code2 size={14} />
              Final Year Project
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
