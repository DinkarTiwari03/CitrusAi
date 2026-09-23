import { Siren, AlertTriangle, AlertCircle, CheckCircle, ShieldAlert } from 'lucide-react';

const PRIORITY_CONFIG = {
  LOW:    { label: 'Low Priority',   color: '#34d399', bg: 'rgba(16,185,129,0.15)',  Icon: CheckCircle,   desc: 'No immediate action required. Continue routine monitoring.' },
  MEDIUM: { label: 'Medium Priority', color: '#60a5fa', bg: 'rgba(59,130,246,0.15)', Icon: AlertCircle,   desc: 'Prompt attention recommended within the next few days.' },
  HIGH:   { label: 'High Priority',  color: '#fbbf24', bg: 'rgba(245,158,11,0.2)',   Icon: AlertTriangle, desc: 'Requires treatment planning and timely intervention.' },
  URGENT: { label: 'Urgent',         color: '#f87171', bg: 'rgba(239,68,68,0.2)',    Icon: Siren,         desc: 'Immediate action required. Escalate to agronomist.' },
};

/**
 * PriorityBadge — Displays advisory priority level with description or compact pill.
 * @param {string} priority - 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
 * @param {boolean} compact - When true, renders a compact inline badge pill
 */
export default function PriorityBadge({ priority = 'MEDIUM', compact = false }) {
  const normalized = (priority || 'MEDIUM').toUpperCase();
  const config = PRIORITY_CONFIG[normalized] || PRIORITY_CONFIG.MEDIUM;
  const { label, color, bg, Icon, desc } = config;

  if (compact) {
    return (
      <span
        className={`badge badge-${normalized.toLowerCase()}`}
        style={{
          fontSize: '0.75rem',
          padding: '0.25rem 0.65rem',
          gap: '0.35rem',
          display: 'inline-flex',
          alignItems: 'center',
          fontWeight: 700,
          whiteSpace: 'nowrap',
        }}
        aria-label={`Priority: ${label}`}
      >
        <Icon size={13} aria-hidden="true" />
        {label}
      </span>
    );
  }

  return (
    <section aria-label="Advisory Priority">
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
          style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg, color }}
          aria-hidden="true"
        >
          <ShieldAlert size={15} />
        </div>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>
          Advisory Priority
        </span>
      </div>

      <div style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span
          className={`badge badge-${priority.toLowerCase()}`}
          style={{ fontSize: '0.9rem', padding: '0.5rem 1.2rem', gap: '0.45rem' }}
          aria-label={`Priority: ${label}`}
        >
          <Icon size={15} aria-hidden="true" />
          {label}
        </span>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {desc}
        </p>
      </div>
    </section>
  );
}
