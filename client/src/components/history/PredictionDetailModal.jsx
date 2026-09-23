import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Calendar, FileText, Image as ImageIcon, Copy, Check, ExternalLink } from 'lucide-react';
import PredictionBadge from '../results/PredictionBadge.jsx';
import SeverityCard from '../results/SeverityCard.jsx';
import PriorityBadge from '../results/PriorityBadge.jsx';
import RecommendationsList from '../results/RecommendationsList.jsx';
import LocalSources from '../results/LocalSources.jsx';
import WebSources from '../results/WebSources.jsx';

export default function PredictionDetailModal({ prediction, onClose }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!prediction) return null;

  const handleCopyAdvisory = async () => {
    if (!prediction.advisory) return;
    try {
      await navigator.clipboard.writeText(prediction.advisory);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard API is restricted
    }
  };

  const formattedDate = prediction.createdAt
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
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h2 id="modal-title" style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
              Analysis Report
            </h2>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '0.2rem 0.6rem',
                borderRadius: 'var(--radius-full)',
              }}
            >
              <Calendar size={12} />
              {formattedDate}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Link
              to={`/history/${prediction._id}`}
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', gap: '0.35rem', textDecoration: 'none' }}
              title="Open full page view"
              onClick={onClose}
            >
              <ExternalLink size={13} />
              Full Page
            </Link>
            <button
              className="modal-close-btn"
              onClick={onClose}
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* File Metadata Banner */}
          {prediction.imageReference && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ImageIcon size={16} color="var(--primary)" />
                <strong style={{ color: 'var(--text-primary)' }}>
                  {prediction.imageReference.originalName || 'Leaf Image'}
                </strong>
              </div>
              <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)' }}>
                {prediction.imageReference.mimeType && (
                  <span>{prediction.imageReference.mimeType}</span>
                )}
                {prediction.imageReference.size && (
                  <span>{formatFileSize(prediction.imageReference.size)}</span>
                )}
                <span style={{ fontFamily: 'monospace', fontSize: '0.72rem' }}>
                  ID: {prediction._id}
                </span>
              </div>
            </div>
          )}

          {/* Core Metrics: Disease + Severity */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1rem',
            }}
          >
            <PredictionBadge data={prediction} />
            <SeverityCard data={prediction} />
          </div>

          {/* Action Priority Banner */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.9rem 1.25rem',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Assigned Intervention Urgency:
            </span>
            <PriorityBadge priority={prediction.priority} compact />
          </div>

          {/* Recommendations */}
          <RecommendationsList recommendations={prediction.recommendations} />

          {/* RAG Citations */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1rem',
            }}
          >
            <LocalSources sources={prediction.localSources} />
            <WebSources sources={prediction.webSources} />
          </div>

          {/* Complete Advisory Text */}
          {prediction.advisory && (
            <div
              className="glass-card"
              style={{
                padding: '1.25rem',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={16} color="var(--primary)" />
                  <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>
                    Full Agentic Crop Advisory
                  </h4>
                </div>
                <button
                  className="btn btn-secondary"
                  onClick={handleCopyAdvisory}
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                >
                  {copied ? <Check size={13} color="var(--primary)" /> : <Copy size={13} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre
                style={{
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '0.8rem',
                  lineHeight: 1.6,
                  color: 'var(--text-secondary)',
                  background: 'rgba(0, 0, 0, 0.3)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  maxHeight: 280,
                  overflowY: 'auto',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                {prediction.advisory}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
