import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  Brain,
  Microscope,
  AlertTriangle,
  ScanLine,
  ChevronRight,
  Eye,
  History,
  TrendingUp,
  ShieldCheck,
  RefreshCw,
  Image as ImageIcon
} from 'lucide-react';
import api from '../services/api.js';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import ErrorMessage from '../components/common/ErrorMessage.jsx';
import PredictionDetailModal from '../components/history/PredictionDetailModal.jsx';
import PriorityBadge from '../components/results/PriorityBadge.jsx';

const DISEASE_COLORS = {
  'Black spot': 'var(--accent-amber)',
  'Melanose': '#f97316', // orange
  'canker': 'var(--accent-red)',
  'greening': '#eab308', // yellow
  'healthy': 'var(--primary)',
};

const SEVERITY_COLORS = {
  'Mild': 'var(--primary)',
  'Moderate': 'var(--accent-amber)',
  'Severe': '#f97316',
  'Critical': 'var(--accent-red)',
  'Unknown': 'var(--text-muted)',
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPrediction, setSelectedPrediction] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getStats();
      setStats(res?.data ?? res);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const totalScans = stats?.total || 0;

  // Calculate High + Urgent count
  const urgentCount = (stats?.priorityDistribution || [])
    .filter((p) => p.priority === 'HIGH' || p.priority === 'URGENT')
    .reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="app-container">
      <main id="main-content" className="main-content" tabIndex={-1} style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Header Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
              <LayoutDashboard size={26} color="var(--primary)" />
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>
                Analytics Dashboard
              </h1>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
              Real-time citrus crop health statistics aggregated directly from recorded MongoDB diagnoses.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={fetchStats}
              className="btn btn-secondary"
              style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              aria-label="Refresh statistics"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
            <button
              onClick={() => navigate('/analyze')}
              className="btn btn-primary"
              style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <ScanLine size={15} />
              New Scan
            </button>
          </div>
        </div>

        {/* Loading and Error States */}
        {loading && <LoadingSpinner message="Aggregating MongoDB diagnostics..." />}

        {error && (
          <ErrorMessage
            statusCode={error.statusCode}
            message={error.message || 'Failed to retrieve analytics'}
            onRetry={fetchStats}
          />
        )}

        {/* Empty State: Zero records in MongoDB */}
        {!loading && !error && totalScans === 0 && (
          <div
            className="glass-card"
            style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              maxWidth: 580,
              margin: '3rem auto',
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                color: 'var(--primary)',
              }}
            >
              <LayoutDashboard size={40} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem' }}>
              No Diagnostic Data Recorded
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.65, marginBottom: '1.75rem' }}>
              Statistics on disease frequency, severity breakdown, and AI model confidence will populate dynamically
              as leaf photos are uploaded and analyzed.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/analyze')}
              style={{ padding: '0.8rem 1.75rem', fontSize: '0.95rem' }}
            >
              <ScanLine size={17} />
              Start First Leaf Analysis
            </button>
          </div>
        )}

        {/* Populated Dashboard */}
        {!loading && !error && totalScans > 0 && (
          <>
            {/* Top 4 Metric Cards */}
            <div className="stats-grid">
              {/* Card 1: Total Scans */}
              <div className="stat-card">
                <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.12)', color: 'var(--primary)' }}>
                  <Activity size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{totalScans}</div>
                  <div className="stat-label">Total Analyses</div>
                  <div className="stat-sub">Cumulative leaf diagnoses</div>
                </div>
              </div>

              {/* Card 2: Average Confidence */}
              <div className="stat-card">
                <div className="stat-icon-wrapper" style={{ background: 'rgba(14, 165, 233, 0.12)', color: 'var(--accent-sky)' }}>
                  <Brain size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{stats.confidenceStats?.avg || 0}%</div>
                  <div className="stat-label">Avg AI Confidence</div>
                  <div className="stat-sub">
                    Min {stats.confidenceStats?.min || 0}% · Max {stats.confidenceStats?.max || 0}%
                  </div>
                </div>
              </div>

              {/* Card 3: Avg Affected Area */}
              <div className="stat-card">
                <div className="stat-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.12)', color: 'var(--accent-amber)' }}>
                  <Microscope size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{stats.avgAffectedArea || 0}%</div>
                  <div className="stat-label">Avg Affected Leaf Area</div>
                  <div className="stat-sub">OpenCV pixel ratio</div>
                </div>
              </div>

              {/* Card 4: Urgent / High Cases */}
              <div className="stat-card">
                <div className="stat-icon-wrapper" style={{ background: 'rgba(239, 68, 68, 0.12)', color: 'var(--accent-red)' }}>
                  <AlertTriangle size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{urgentCount}</div>
                  <div className="stat-label">High / Urgent Alerts</div>
                  <div className="stat-sub">Require immediate action</div>
                </div>
              </div>
            </div>

            {/* Distribution Charts Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem',
              }}
            >
              {/* Disease Prevalence */}
              <div className="glass-card" style={{ padding: '1.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                    Disease Prevalence
                  </h2>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {stats.diseaseDistribution?.length || 0} classes detected
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {(stats.diseaseDistribution || []).map((item) => {
                    const color = DISEASE_COLORS[item.disease] || 'var(--primary)';
                    return (
                      <div key={item.disease} className="dist-item">
                        <div className="dist-header">
                          <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span
                              style={{ width: 8, height: 8, borderRadius: '50%', background: color }}
                              aria-hidden="true"
                            />
                            {item.disease}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            <strong>{item.count}</strong> ({item.percentage}%) ·{' '}
                            <span style={{ color: 'var(--text-muted)' }}>{item.avgConfidence}% conf</span>
                          </span>
                        </div>
                        <div className="dist-bar-track">
                          <div
                            className="dist-bar-fill"
                            style={{
                              width: `${Math.min(100, Math.max(0, item.percentage))}%`,
                              background: color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Severity & Urgency Spectrum */}
              <div className="glass-card" style={{ padding: '1.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                    Severity Assessment
                  </h2>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    OpenCV classification
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {(stats.severityDistribution || []).map((item) => {
                    const color = SEVERITY_COLORS[item.severity] || 'var(--text-muted)';
                    return (
                      <div key={item.severity} className="dist-item">
                        <div className="dist-header">
                          <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span
                              style={{ width: 8, height: 8, borderRadius: '50%', background: color }}
                              aria-hidden="true"
                            />
                            {item.severity}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            <strong>{item.count}</strong> cases ({item.percentage}%)
                          </span>
                        </div>
                        <div className="dist-bar-track">
                          <div
                            className="dist-bar-fill"
                            style={{
                              width: `${Math.min(100, Math.max(0, item.percentage))}%`,
                              background: color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Recent Analyses Section */}
            <div className="glass-card" style={{ padding: '1.75rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  marginBottom: '1.25rem',
                }}
              >
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                    Recent Leaf Analyses
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                    Last 5 diagnoses recorded in the system
                  </p>
                </div>

                <Link
                  to="/history"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <History size={14} />
                  View All History
                  <ChevronRight size={13} />
                </Link>
              </div>

              {/* Recent Analyses Table */}
              <div className="table-responsive">
                <table className="history-table" aria-label="Recent predictions table">
                  <thead>
                    <tr>
                      <th scope="col">Date / Time</th>
                      <th scope="col">Image</th>
                      <th scope="col">Disease</th>
                      <th scope="col">Confidence</th>
                      <th scope="col">Severity</th>
                      <th scope="col">Priority</th>
                      <th scope="col" style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stats.recentAnalyses || []).map((p) => {
                      const dateStr = p.createdAt
                        ? new Date(p.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })
                        : '—';

                      return (
                        <tr
                          key={p._id}
                          onClick={() => setSelectedPrediction(p)}
                          style={{ cursor: 'pointer' }}
                          title="Click to view full analysis"
                        >
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{dateStr}</div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <ImageIcon size={14} color="var(--primary)" />
                              <span
                                style={{
                                  maxWidth: 140,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  fontSize: '0.8rem',
                                  color: 'var(--text-secondary)',
                                }}
                              >
                                {p.imageReference?.originalName || 'leaf.png'}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className="badge badge-disease">{p.disease}</span>
                          </td>
                          <td>
                            <strong style={{ color: 'var(--primary)', fontSize: '0.85rem' }}>
                              {p.confidence != null ? `${Number(p.confidence).toFixed(1)}%` : '—'}
                            </strong>
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                p.severity === 'Mild'
                                  ? 'badge-mild'
                                  : p.severity === 'Severe' || p.severity === 'Critical'
                                  ? 'badge-severe'
                                  : 'badge-moderate'
                              }`}
                            >
                              {p.severity}
                            </span>
                          </td>
                          <td>
                            <PriorityBadge priority={p.priority} compact />
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPrediction(p);
                              }}
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', gap: 4 }}
                              aria-label={`View analysis for ${p.disease}`}
                            >
                              <Eye size={13} />
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Detail Inspection Modal */}
        {selectedPrediction && (
          <PredictionDetailModal
            prediction={selectedPrediction}
            onClose={() => setSelectedPrediction(null)}
          />
        )}
      </main>
    </div>
  );
}
