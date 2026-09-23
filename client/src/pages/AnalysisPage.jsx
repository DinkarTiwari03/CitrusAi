import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ScanLine, RotateCcw, ArrowLeft } from 'lucide-react';
import ImageDropzone from '../components/upload/ImageDropzone.jsx';
import ImagePreview from '../components/upload/ImagePreview.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import ErrorMessage from '../components/common/ErrorMessage.jsx';
import ResultsPanel from '../components/results/ResultsPanel.jsx';
import api from '../services/api.js';

export default function AnalysisPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // File state — seeded from Home navigation or selected here
  const [file, setFile] = useState(location.state?.file || null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Analysis state
  const [status, setStatus] = useState('idle'); // idle | uploading | loading | success | error
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [validationError, setValidationError] = useState(null);

  // Auto-run analysis if file was passed from Home
  const hasAutoRun = useRef(false);

  useEffect(() => {
    if (file && !hasAutoRun.current) {
      hasAutoRun.current = true;
      runAnalysis(file);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Generate preview URL
  useEffect(() => {
    if (!file) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const runAnalysis = useCallback(async (imageFile) => {
    if (!imageFile) return;

    setStatus('uploading');
    setUploadProgress(0);
    setError(null);
    setResult(null);

    try {
      const response = await api.analyzeImage(imageFile, (pct) => {
        setUploadProgress(pct);
        if (pct >= 100) setStatus('loading');
      });

      // Unwrap the { success, data } envelope
      const predictionData = response?.data ?? response;
      setResult(predictionData);
      setStatus('success');
    } catch (err) {
      setError({ message: err.message || 'An unexpected error occurred.', statusCode: err.statusCode });
      setStatus('error');
    }
  }, []);

  const handleFileSelect = useCallback((selectedFile) => {
    setFile(selectedFile);
    setValidationError(null);
    setResult(null);
    setStatus('idle');
    setError(null);
    hasAutoRun.current = false;
  }, []);

  const handleClear = useCallback(() => {
    setFile(null);
    setResult(null);
    setStatus('idle');
    setError(null);
    setValidationError(null);
    hasAutoRun.current = false;
  }, []);

  const isProcessing = status === 'uploading' || status === 'loading';

  return (
    <div className="app-container">
      <main
        id="main-content"
        className="main-content"
        tabIndex={-1}
        aria-label="Citrus leaf analysis"
      >
        {/* Page header */}
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            padding: '1.5rem 1.5rem 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.2rem' }}>
              Leaf Analysis
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Upload a citrus leaf image to run the full AI pipeline.
            </p>
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/')}
            style={{ gap: '0.4rem', fontSize: '0.85rem', padding: '0.5rem 1rem' }}
            aria-label="Go back to home page"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Back to Home
          </button>
        </div>

        {/* Two-column layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 380px) 1fr',
            gap: '2rem',
            alignItems: 'start',
            padding: '1.5rem',
            maxWidth: 1280,
            margin: '0 auto',
          }}
          className="analysis-layout-grid"
        >
          {/* ── Left Column: Upload ─────────────────── */}
          <aside
            aria-label="Image upload panel"
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'sticky', top: 86 }}
          >
            {/* Upload area */}
            <div
              className="glass-card"
              style={{ padding: '1.25rem', overflow: 'hidden' }}
            >
              <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
                Leaf Image
              </h2>

              {file ? (
                <ImagePreview file={file} onClear={isProcessing ? undefined : handleClear} />
              ) : (
                <ImageDropzone
                  onFileSelect={handleFileSelect}
                  onError={(msg) => setValidationError(msg)}
                  disabled={isProcessing}
                />
              )}

              {validationError && (
                <div style={{ marginTop: '0.75rem' }}>
                  <ErrorMessage message={validationError} />
                </div>
              )}
            </div>

            {/* Analyze button */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                id="analyze-submit-btn"
                className="btn btn-primary"
                onClick={() => runAnalysis(file)}
                disabled={!file || isProcessing}
                aria-disabled={!file || isProcessing}
                aria-label={isProcessing ? 'Analysis in progress' : 'Start AI analysis'}
                style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem' }}
              >
                {isProcessing ? (
                  <>
                    <span
                      style={{
                        width: 16,
                        height: 16,
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTopColor: '#fff',
                        borderRadius: '50%',
                        display: 'inline-block',
                        animation: 'citrus-spin 0.8s linear infinite',
                        flexShrink: 0,
                      }}
                      aria-hidden="true"
                    />
                    Analysing…
                  </>
                ) : (
                  <>
                    <ScanLine size={17} aria-hidden="true" />
                    {result ? 'Analyse Again' : 'Analyse Leaf'}
                  </>
                )}
              </button>

              {/* Upload progress bar */}
              {status === 'uploading' && (
                <div>
                  <div className="progress-bar-bg" style={{ height: 4 }}>
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${uploadProgress}%`, height: '100%' }}
                      role="progressbar"
                      aria-valuenow={uploadProgress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Upload progress: ${uploadProgress}%`}
                    />
                  </div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem', textAlign: 'right' }}>
                    Uploading… {uploadProgress}%
                  </p>
                </div>
              )}

              {result && !isProcessing && (
                <button
                  className="btn btn-secondary"
                  onClick={handleClear}
                  style={{ width: '100%', gap: '0.4rem', fontSize: '0.85rem' }}
                  aria-label="Reset and start a new analysis"
                >
                  <RotateCcw size={14} aria-hidden="true" />
                  New Analysis
                </button>
              )}
            </div>
          </aside>

          {/* ── Right Column: Results ───────────────── */}
          <section
            aria-label="Analysis results"
            aria-live="polite"
            style={{ minWidth: 0 }}
          >
            {/* Idle */}
            {status === 'idle' && !file && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '1rem',
                  padding: '4rem 2rem',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  border: '2px dashed var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                }}
                aria-label="Upload an image to start analysis"
              >
                <div
                  style={{ width: 56, height: 56, background: 'rgba(255,255,255,0.03)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  aria-hidden="true"
                >
                  <ScanLine size={26} />
                </div>
                <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Results will appear here
                </p>
                <p style={{ fontSize: '0.825rem', maxWidth: 300 }}>
                  Select a citrus leaf image on the left panel and click <strong>Analyse Leaf</strong>.
                </p>
              </div>
            )}

            {/* File selected, not yet analysed */}
            {status === 'idle' && file && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '1rem',
                  padding: '4rem 2rem',
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                  border: '2px dashed rgba(16,185,129,0.25)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--primary-light)',
                }}
              >
                <p style={{ fontSize: '0.95rem', fontWeight: 600 }}>Image ready!</p>
                <p style={{ fontSize: '0.825rem', maxWidth: 280 }}>
                  Click <strong>Analyse Leaf</strong> to run the AI pipeline.
                </p>
              </div>
            )}

            {/* Loading */}
            {isProcessing && (
              <LoadingSpinner
                label={status === 'uploading' ? 'Uploading image…' : 'Running AI pipeline…'}
                sub={
                  status === 'loading'
                    ? 'ConvNeXt classification · OpenCV severity · FAISS RAG · Agentic advisory'
                    : undefined
                }
                uploadProgress={status === 'uploading' ? uploadProgress : undefined}
              />
            )}

            {/* Error */}
            {status === 'error' && error && (
              <ErrorMessage
                message={error.message}
                statusCode={error.statusCode}
                onRetry={() => runAnalysis(file)}
              />
            )}

            {/* Results */}
            {status === 'success' && result && (
              <ResultsPanel data={result} />
            )}
          </section>
        </div>

        {/* Responsive override */}
        <style>{`
          @media (max-width: 1024px) {
            .analysis-layout-grid { grid-template-columns: 1fr !important; }
            aside { position: static !important; }
          }
          @keyframes citrus-spin { to { transform: rotate(360deg); } }
        `}</style>
      </main>
    </div>
  );
}
