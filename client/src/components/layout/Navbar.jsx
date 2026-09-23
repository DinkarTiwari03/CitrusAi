import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Leaf, ScanLine, History, LayoutDashboard, Menu, X } from 'lucide-react';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu on route change
  useEffect(() => setMenuOpen(false), [location]);

  return (
    <header
      className="navbar-container"
      style={{ boxShadow: scrolled ? '0 4px 24px rgba(0,0,0,0.4)' : 'none' }}
    >
      <NavLink to="/" className="nav-brand" aria-label="CitrusAI Home">
        <div className="brand-icon" aria-hidden="true">
          <Leaf size={20} strokeWidth={2.5} />
        </div>
        <span>
          Citrus<span style={{ color: 'var(--primary)' }}>AI</span>
        </span>
      </NavLink>

      <nav aria-label="Main navigation">
        <ul className={`nav-links${menuOpen ? ' mobile-open' : ''}`}>
          <li>
            <NavLink
              to="/"
              end
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              Home
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/analyze"
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <ScanLine size={14} style={{ display: 'inline', marginRight: 4 }} />
              Analyze
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/dashboard"
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <LayoutDashboard size={14} style={{ display: 'inline', marginRight: 4 }} />
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/history"
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <History size={14} style={{ display: 'inline', marginRight: 4 }} />
              History
            </NavLink>
          </li>
        </ul>
      </nav>

      <div className="nav-actions">
        <NavLink to="/analyze" className="btn btn-primary" style={{ padding: '0.5rem 1.1rem', fontSize: '0.85rem' }}>
          <ScanLine size={15} />
          Scan Leaf
        </NavLink>
        <button
          className="btn"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ display: 'none' }}
          id="mobile-menu-toggle"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .nav-links { display: none; flex-direction: column; position: absolute; top: 72px; left: 0; right: 0; background: rgba(8,12,20,0.97); border-bottom: 1px solid var(--border-subtle); padding: 1rem; gap: 0.25rem; }
          .nav-links.mobile-open { display: flex; }
          .nav-links .nav-link { width: 100%; justify-content: flex-start; padding: 0.75rem 1rem; }
          #mobile-menu-toggle { display: flex !important; }
        }
      `}</style>
    </header>
  );
}
