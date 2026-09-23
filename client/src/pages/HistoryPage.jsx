import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  History,
  Search,
  Filter,
  Download,
  RotateCcw,
  Eye,
  ChevronLeft,
  ChevronRight,
  ScanLine,
  Image as ImageIcon,
  ArrowUpDown,
  X
} from 'lucide-react';
import api from '../services/api.js';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import ErrorMessage from '../components/common/ErrorMessage.jsx';
import PredictionDetailModal from '../components/history/PredictionDetailModal.jsx';
import PriorityBadge from '../components/results/PriorityBadge.jsx';

const DISEASE_OPTIONS = [
  { value: '', label: 'All Diseases' },
  { value: 'Black spot', label: 'Black spot' },
  { value: 'Melanose', label: 'Melanose' },
  { value: 'canker', label: 'Citrus Canker' },
  { value: 'greening', label: 'Citrus Greening (HLB)' },
  { value: 'healthy', label: 'Healthy Leaf' },
];

const SEVERITY_OPTIONS = [
  { value: '', label: 'All Severities' },
  { value: 'Mild', label: 'Mild' },
  { value: 'Moderate', label: 'Moderate' },
  { value: 'Severe', label: 'Severe' },
  { value: 'Critical', label: 'Critical' },
];

const PRIORITY_OPTIONS = [
  { value: '', label: 'All Priorities' },
  { value: 'LOW', label: 'Low Urgency' },
  { value: 'MEDIUM', label: 'Medium Urgency' },
  { value: 'HIGH', label: 'High Urgency' },
  { value: 'URGENT', label: 'Urgent' },
];

const SORT_OPTIONS = [
  { value: 'createdAt-desc', label: 'Date: Newest First', sortBy: 'createdAt', order: 'desc' },
  { value: 'createdAt-asc', label: 'Date: Oldest First', sortBy: 'createdAt', order: 'asc' },
  { value: 'confidence-desc', label: 'Confidence: Highest', sortBy: 'confidence', order: 'desc' },
  { value: 'confidence-asc', label: 'Confidence: Lowest', sortBy: 'confidence', order: 'asc' },
  { value: 'affectedArea-desc', label: 'Affected Area: Highest', sortBy: 'affectedArea', order: 'desc' },
];

export default function HistoryPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [predictions, setPredictions] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPrediction, setSelectedPrediction] = useState(null);

  // Filter values
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [diseaseFilter, setDiseaseFilter] = useState(searchParams.get('disease') || '');
  const [severityFilter, setSeverityFilter] = useState(searchParams.get('severity') || '');
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get('priority') || '');
  const [sortKey, setSortKey] = useState(searchParams.get('sort') || 'createdAt-desc');
  const [page, setPage] = useState(parseInt(searchParams.get('page'), 10) || 1);

  const fetchPredictions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const activeSort = SORT_OPTIONS.find((s) => s.value === sortKey) || SORT_OPTIONS[0];

      const params = {
        page,
        limit: 10,
        sortBy: activeSort.sortBy,
        order: activeSort.order,
      };

      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (diseaseFilter) params.disease = diseaseFilter;
      if (severityFilter) params.severity = severityFilter;
      if (priorityFilter) params.priority = priorityFilter;

      const res = await api.getPredictions(params);
      const data = res?.data ?? res;

      setPredictions(data.predictions || []);
      setPagination(data.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 });
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, diseaseFilter, severityFilter, priorityFilter, sortKey]);

  useEffect(() => {
    fetchPredictions();
  }, [fetchPredictions]);

  // Handle filter changes
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPredictions();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setDiseaseFilter('');
    setSeverityFilter('');
    setPriorityFilter('');
    setSortKey('createdAt-desc');
    setPage(1);
  };

  const handleExportCsv = () => {
    api.exportPredictionsCsv(predictions);
  };

  const hasActiveFilters = Boolean(
    searchTerm.trim() || diseaseFilter || severityFilter || priorityFilter || sortKey !== 'createdAt-desc'
  );

  return (
    <div className="app-container">
      <main id="main-content" className="main-content" tabIndex={-1} style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Page Title & Stats Heading */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.75rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
              <History size={26} color="var(--primary)" />
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>
                Prediction History
              </h1>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
              Audit trail of all recorded citrus disease classifications, severity calculations, and advisories.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={handleExportCsv}
              disabled={predictions.length === 0}
              className="btn btn-secondary"
              style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              aria-label="Export current page to CSV"
            >
              <Download size={15} />
              Export CSV
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

        {/* Filter and Search Toolbar */}
        <div className="filter-toolbar">
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: '1 1 240px' }}>
            <div className="search-input-wrapper">
              <Search size={15} className="search-icon-pos" />
              <input
                type="text"
                placeholder="Search disease or filename..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search past predictions"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                  aria-label="Clear search input"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button type="submit" className="btn btn-secondary" style={{ padding: '0.6rem 0.9rem' }}>
              Search
            </button>
          </form>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
            {/* Disease Filter */}
            <select
              className="filter-select"
              value={diseaseFilter}
              onChange={(e) => {
                setDiseaseFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by disease"
            >
              {DISEASE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Severity Filter */}
            <select
              className="filter-select"
              value={severityFilter}
              onChange={(e) => {
                setSeverityFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by severity"
            >
              {SEVERITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              className="filter-select"
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by priority urgency"
            >
              {PRIORITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Sort Control */}
            <select
              className="filter-select"
              value={sortKey}
              onChange={(e) => {
                setSortKey(e.target.value);
                setPage(1);
              }}
              aria-label="Sort predictions"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="btn"
                style={{ padding: '0.6rem 0.85rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}
                title="Reset all filters"
                aria-label="Reset all filters"
              >
                <RotateCcw size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Loading and Error States */}
        {loading && <LoadingSpinner message="Fetching scan history..." />}

        {error && (
          <ErrorMessage
            statusCode={error.statusCode}
            message={error.message || 'Failed to load scan history'}
            onRetry={fetchPredictions}
          />
        )}

        {/* Empty State: No predictions exist at all */}
        {!loading && !error && predictions.length === 0 && !hasActiveFilters && (
          <div
            className="glass-card"
            style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              maxWidth: 540,
              margin: '3rem auto',
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
                color: 'var(--primary)',
              }}
            >
              <History size={36} />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              No Analyses Recorded Yet
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              Upload a citrus leaf photo to start generating diagnoses and building your agricultural health history.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/analyze')}
              style={{ padding: '0.75rem 1.5rem' }}
            >
              <ScanLine size={16} />
              Run Your First Scan
            </button>
          </div>
        )}

        {/* Empty State: Active filters returned 0 results */}
        {!loading && !error && predictions.length === 0 && hasActiveFilters && (
          <div
            className="glass-card"
            style={{
              textAlign: 'center',
              padding: '3rem 2rem',
              margin: '2rem 0',
            }}
          >
            <Search size={36} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              No Matching Records
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              No historical predictions matched your selected query and filters.
            </p>
            <button onClick={handleResetFilters} className="btn btn-secondary">
              <RotateCcw size={14} />
              Clear Filters
            </button>
          </div>
        )}

        {/* Predictions Data Table */}
        {!loading && !error && predictions.length > 0 && (
          <div className="table-responsive">
            <table className="history-table" aria-label="Citrus predictions history">
              <thead>
                <tr>
                  <th scope="col">Date / Time</th>
                  <th scope="col">Image</th>
                  <th scope="col">Disease</th>
                  <th scope="col">Confidence</th>
                  <th scope="col">Severity</th>
                  <th scope="col">Affected Area</th>
                  <th scope="col">Priority</th>
                  <th scope="col" style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map((p) => {
                  const dateStr = p.createdAt
                    ? new Date(p.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : '—';

                  const timeStr = p.createdAt
                    ? new Date(p.createdAt).toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '';

                  const severityBadgeClass =
                    p.severity === 'Mild'
                      ? 'badge-mild'
                      : p.severity === 'Severe' || p.severity === 'Critical'
                      ? 'badge-severe'
                      : 'badge-moderate';

                  return (
                    <tr
                      key={p._id}
                      onClick={() => setSelectedPrediction(p)}
                      title="Click to view full analysis"
                    >
                      {/* Date */}
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{dateStr}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{timeStr}</div>
                      </td>

                      {/* Image Filename */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <ImageIcon size={15} color="var(--primary)" />
                          <span
                            style={{
                              maxWidth: 160,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              fontSize: '0.8rem',
                              color: 'var(--text-secondary)',
                            }}
                            title={p.imageReference?.originalName}
                          >
                            {p.imageReference?.originalName || 'leaf.png'}
                          </span>
                        </div>
                      </td>

                      {/* Disease */}
                      <td>
                        <span className="badge badge-disease" style={{ fontWeight: 700 }}>
                          {p.disease}
                        </span>
                      </td>

                      {/* Confidence */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 80 }}>
                          <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.85rem' }}>
                            {p.confidence != null ? `${Number(p.confidence).toFixed(1)}%` : '—'}
                          </div>
                          <div className="progress-bar-bg" style={{ height: 4, width: 70 }}>
                            <div
                              className="progress-bar-fill"
                              style={{ width: `${Math.min(100, Math.max(0, p.confidence || 0))}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Severity */}
                      <td>
                        <span className={`badge ${severityBadgeClass}`}>
                          {p.severity || 'Unknown'}
                        </span>
                      </td>

                      {/* Affected Area */}
                      <td>
                        <span style={{ fontWeight: 600 }}>
                          {p.affectedArea != null ? `${Number(p.affectedArea).toFixed(1)}%` : '—'}
                        </span>
                      </td>

                      {/* Priority */}
                      <td>
                        <PriorityBadge priority={p.priority} compact />
                      </td>

                      {/* Action */}
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
        )}

        {/* Pagination Bar */}
        {!loading && !error && pagination.totalPages > 1 && (
          <div className="pagination-bar">
            <span>
              Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} total records)
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-secondary"
                disabled={!pagination.hasPrevPage}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                aria-label="Previous page"
              >
                <ChevronLeft size={14} />
                Previous
              </button>
              <button
                className="btn btn-secondary"
                disabled={!pagination.hasNextPage}
                onClick={() => setPage((prev) => prev + 1)}
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                aria-label="Next page"
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
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
