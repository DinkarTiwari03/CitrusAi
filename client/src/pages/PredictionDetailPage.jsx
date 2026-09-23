import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, FileText, Image as ImageIcon, Copy, Check } from 'lucide-react';
import api from '../services/api.js';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import ErrorMessage from '../components/common/ErrorMessage.jsx';
import PredictionBadge from '../components/results/PredictionBadge.jsx';
import SeverityCard from '../components/results/SeverityCard.jsx';
import PriorityBadge from '../components/results/PriorityBadge.jsx';
import RecommendationsList from '../components/results/RecommendationsList.jsx';
import LocalSources from '../components/results/LocalSources.jsx';
import WebSources from '../components/results/WebSources.jsx';

export default function PredictionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchPrediction() {
      setLoading(true);
      setError(null);
      try {
        const response = await api.getPredictionById(id);
        if (isMounted) {
          setPrediction(response?.data ?? response);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (id) {
      fetchPrediction();
    }

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleCopyAdvisory = async () => {
    if (!prediction?.advisory) return;
    try {
      await navigator.clipboard.writeText(prediction.advisory);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const formattedDate = prediction?.createdAt
    ? new Date(prediction.createdAt).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Unknown Date';

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="app-container">
      <main id="main-content" className="main-content" tabIndex={-1} style={{ maxWidth: 1040, margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Navigation Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
          <button
            onClick={() => navigate('/history')}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
          >
            <ArrowLeft size={16} />
            Back to History
          </button>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to="/analyze" className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '0.45rem 1rem' }}>
              New Scan
            </Link>
          </div>
        </div>

        {loading && <LoadingSpinner message="Retrieving stored analysis record..." />}

        {error && (
          <ErrorMessage
            statusCode={error.statusCode}
            message={error.message || 'Failed to retrieve prediction record'}
            onRetry={() => window.location.reload()}
          />
        )}

        {!loading && !error && prediction && (
          <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Title & Date Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.25rem' }}>
              <div>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  {prediction.disease} Analysis
                </h1>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Record ID: {prediction._id}
                </span>
              </div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.4rem 0.85rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                }}
              >
                <Calendar size={14} color="var(--primary)" />
                {formattedDate}
              </div>
            </div>

            {/* Image Metadata Bar */}
            {prediction.imageReference && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  padding: '0.85rem 1.25rem',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <ImageIcon size={18} color="var(--primary)" />
                  <strong style={{ color: 'var(--text-primary)' }}>
                    {prediction.imageReference.originalName || 'Citrus Leaf Image'}
                  </strong>
                </div>
                <div style={{ display: 'flex', gap: '1.25rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  {prediction.imageReference.mimeType && (
                    <span>Type: {prediction.imageReference.mimeType}</span>
                  )}
                  {prediction.imageReference.size && (
                    <span>Size: {formatFileSize(prediction.imageReference.size)}</span>
                  )}
                </div>
              </div>
            )}

            {/* Core Metrics: Disease + Severity */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              <PredictionBadge data={prediction} />
              <SeverityCard data={prediction} />
            </div>

            {/* Action Priority Banner */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem 1.5rem',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Intervention Priority Level:
              </span>
              <PriorityBadge priority={prediction.priority} compact />
            </div>

            {/* Recommendations List */}
            <RecommendationsList recommendations={prediction.recommendations} />

            {/* RAG Citations */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
              <LocalSources sources={prediction.localSources} />
              <WebSources sources={prediction.webSources} />
            </div>

            {/* Complete Advisory Text */}
            {prediction.advisory && (
              <div
                style={{
                  padding: '1.5rem',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={18} color="var(--primary)" />
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                      Stored Crop Advisory Text
                    </h3>
                  </div>
                  <button
                    className="btn btn-secondary"
                    onClick={handleCopyAdvisory}
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                  >
                    {copied ? <Check size={14} color="var(--primary)" /> : <Copy size={14} />}
                    {copied ? 'Copied to Clipboard' : 'Copy Advisory'}
                  </button>
                </div>
                <pre
                  style={{
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '0.85rem',
                    lineHeight: 1.65,
                    color: 'var(--text-secondary)',
                    background: 'rgba(0, 0, 0, 0.35)',
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-sm)',
                    maxHeight: 320,
                    overflowY: 'auto',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  {prediction.advisory}
                </pre>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
