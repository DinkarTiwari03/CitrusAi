import { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Leaf, Brain, Microscope, BookOpen, ScanLine, ChevronRight, LayoutDashboard, History } from 'lucide-react';
import ImageDropzone from '../components/upload/ImageDropzone.jsx';
import ImagePreview from '../components/upload/ImagePreview.jsx';
import ErrorMessage from '../components/common/ErrorMessage.jsx';

const FEATURES = [
  {
    icon: <Brain size={22} />,
    color: 'var(--primary)',
    bg: 'var(--primary-light)',
    title: 'ConvNeXt Classification',
    desc: 'State-of-the-art ConvNeXt deep learning model trained to classify 5 citrus diseases with high accuracy from leaf images.',
  },
  {
    icon: <Microscope size={22} />,
    color: 'var(--accent-amber)',
    bg: 'var(--accent-amber-light)',
    title: 'OpenCV Severity Assessment',
    desc: 'Pixel-level computer vision analysis quantifies the percentage of infected leaf area to determine disease severity.',
  },
  {
    icon: <BookOpen size={22} />,
    color: 'var(--accent-cyan)',
    bg: 'var(--accent-cyan-light)',
    title: 'Agentic RAG Advisory',
    desc: 'A LLM-powered advisory agent retrieves from a local FAISS knowledge base and live web sources to generate contextual crop management guidance.',
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [validationError, setValidationError] = useState(null);

  const handleFileSelect = useCallback((selectedFile) => {
    setFile(selectedFile);
    setValidationError(null);
  }, []);

  const handleError = useCallback((msg) => {
    setFile(null);
    setValidationError(msg);
  }, []);

  const handleAnalyze = () => {
    if (!file) return;
    navigate('/analyze', { state: { file } });
  };

  return (
    <div className="app-container">
      <main id="main-content" className="main-content" tabIndex={-1}>
        {/* ── Hero ───────────────────────────────────── */}
        <section
          className="home-hero"
          aria-label="CitrusAI — Intelligent Disease Classification"
          style={{ padding: '5rem 1.5rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
        >
          {/* Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 1rem',
              background: 'var(--primary-light)',
              border: '1px solid rgba(16,185,129,0.25)',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.78rem',
              fontWeight: 600,
              color: 'var(--primary)',
              letterSpacing: '0.04em',
              marginBottom: '1.75rem',
            }}
          >
            <Leaf size={13} aria-hidden="true" />
            Final Year Research Project — Deep Learning &amp; Agentic AI
          </div>

          <h1
            style={{
              fontSize: 'clamp(1.9rem, 5vw, 3.4rem)',
              fontWeight: 800,
              letterSpacing: '-0.04em',
              lineHeight: 1.1,
              maxWidth: 820,
              marginBottom: '1.25rem',
            }}
          >
            Intelligent Citrus Leaf{' '}
            <span className="gradient-text-emerald">Disease Classification</span>{' '}
            &amp;{' '}
            <span className="gradient-text-citrus">Severity Assessment</span>
          </h1>

          <p
            style={{
              fontSize: 'clamp(0.9rem, 2vw, 1.05rem)',
              color: 'var(--text-secondary)',
              maxWidth: 620,
              lineHeight: 1.7,
              marginBottom: '2rem',
            }}
          >
            Upload a citrus leaf photograph to receive an instant AI-powered disease diagnosis,
            pixel-level severity score, and an agentic crop management advisory — all from a
            single ConvNeXt model enriched with RAG.
          </p>

          {/* Tech pills */}
          <div
            style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '3rem' }}
            aria-label="Technologies used"
          >
            {['ConvNeXt', 'OpenCV', 'FAISS RAG', 'LLM Agent', 'FastAPI', 'MongoDB'].map((t) => (
              <span
                key={t}
                style={{
                  padding: '0.3rem 0.8rem',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                }}
              >
                {t}
              </span>
            ))}
          </div>

          {/* Upload card */}
          <div
            style={{
              width: '100%',
              maxWidth: 620,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xl)',
              padding: '2rem',
              backdropFilter: 'blur(16px)',
              boxShadow: 'var(--shadow-elevated)',
            }}
            aria-label="Image upload section"
          >
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
              Upload a Citrus Leaf Image
            </h2>

            {file ? (
              <ImagePreview file={file} onClear={() => setFile(null)} />
            ) : (
              <ImageDropzone onFileSelect={handleFileSelect} onError={handleError} />
            )}

            {validationError && (
              <div style={{ marginTop: '1rem' }}>
                <ErrorMessage message={validationError} />
              </div>
            )}

            <button
              id="analyze-btn"
              className="btn btn-primary"
              onClick={handleAnalyze}
              disabled={!file}
              aria-disabled={!file}
              style={{ width: '100%', marginTop: '1.25rem', padding: '0.9rem', fontSize: '1rem' }}
            >
              <ScanLine size={18} aria-hidden="true" />
              {file ? 'Analyze Leaf' : 'Select an image to continue'}
              {file && <ChevronRight size={16} aria-hidden="true" />}
            </button>

            {!file && (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem', textAlign: 'center' }}>
                Supported: JPG, PNG, WebP · Max 10 MB
              </p>
            )}
          </div>
        </section>

        {/* ── Features ─────────────────────────────── */}
        <section
          style={{ padding: '3rem 1.5rem 4rem' }}
          aria-label="AI capabilities"
        >
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.6rem' }}>
              Powered by a multi-stage AI pipeline
            </h2>
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2.5rem' }}>
              Each analysis runs through three independent AI subsystems working in sequence.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {FEATURES.map((f, i) => (
                <article
                  key={i}
                  className="glass-card"
                  style={{ padding: '1.75rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', transition: 'var(--transition)' }}
                >
                  <div
                    style={{ width: 46, height: 46, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: f.bg, color: f.color }}
                    aria-hidden="true"
                  >
                    {f.icon}
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{f.title}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{f.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── Dashboard & History Quick Access ──────── */}
        <section
          style={{ padding: '0 1.5rem 5rem' }}
          aria-label="Analytics and history navigation"
        >
          <div
            style={{
              maxWidth: 1100,
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {/* Dashboard card */}
            <div
              className="glass-card"
              style={{
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1.25rem',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
              }}
            >
              <div>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem',
                  }}
                  aria-hidden="true"
                >
                  <LayoutDashboard size={22} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.4rem' }}>
                  Analytics Dashboard
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Inspect real-time aggregate statistics from MongoDB: disease detection distributions, OpenCV severity breakdowns, and AI model confidence metrics.
                </p>
              </div>
              <Link
                to="/dashboard"
                className="btn btn-secondary"
                style={{ alignSelf: 'flex-start', fontSize: '0.85rem', gap: '0.4rem' }}
              >
                <LayoutDashboard size={15} />
                View Analytics
                <ChevronRight size={14} />
              </Link>
            </div>

            {/* History card */}
            <div
              className="glass-card"
              style={{
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1.25rem',
                border: '1px solid rgba(14, 165, 233, 0.25)',
                background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
              }}
            >
              <div>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: 'rgba(14, 165, 233, 0.15)',
                    color: 'var(--accent-sky)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem',
                  }}
                  aria-hidden="true"
                >
                  <History size={22} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.4rem' }}>
                  Prediction Audit History
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Search, filter, and inspect past leaf scans. Review full diagnostic records, severity assessments, RAG citations, and export data directly to CSV.
                </p>
              </div>
              <Link
                to="/history"
                className="btn btn-secondary"
                style={{ alignSelf: 'flex-start', fontSize: '0.85rem', gap: '0.4rem' }}
              >
                <History size={15} />
                Browse History
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
