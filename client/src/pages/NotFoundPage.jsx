import { useNavigate } from 'react-router-dom';
import { Leaf, Home, ScanLine } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div
      className="app-container"
      style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <main
        id="main-content"
        tabIndex={-1}
        aria-label="Page not found"
        style={{ textAlign: 'center', padding: '3rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}
      >
        <Leaf size={42} color="var(--primary)" style={{ opacity: 0.4 }} aria-hidden="true" />

        <span
          style={{
            display: 'block',
            fontSize: 'clamp(5rem, 15vw, 9rem)',
            fontWeight: 800,
            letterSpacing: '-0.05em',
            lineHeight: 1,
            opacity: 0.1,
            color: 'var(--text-primary)',
            marginBottom: '-1rem',
          }}
          aria-hidden="true"
        >
          404
        </span>

        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Page Not Found</h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: 340, lineHeight: 1.6 }}>
          The page you're looking for doesn't exist or may have been moved.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.5rem' }}>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/')}
            aria-label="Go to home page"
          >
            <Home size={15} aria-hidden="true" />
            Go Home
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/analyze')}
            aria-label="Go to analysis page"
          >
            <ScanLine size={15} aria-hidden="true" />
            Analyse a Leaf
          </button>
        </div>
      </main>
    </div>
  );
}
