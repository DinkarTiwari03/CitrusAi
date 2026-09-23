import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar.jsx';
import Footer from './components/layout/Footer.jsx';
import HomePage from './pages/HomePage.jsx';
import AnalysisPage from './pages/AnalysisPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import PredictionDetailPage from './pages/PredictionDetailPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      {/* Skip link for keyboard accessibility */}
      <a
        href="#main-content"
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 'auto',
          zIndex: 9999,
          background: 'var(--primary)',
          color: '#fff',
          padding: '0.75rem 1.25rem',
          fontWeight: 700,
          borderRadius: '0 0 8px 8px',
        }}
        onFocus={(e) => { e.target.style.left = '50%'; e.target.style.transform = 'translateX(-50%)'; }}
        onBlur={(e) => { e.target.style.left = '-9999px'; e.target.style.transform = 'none'; }}
      >
        Skip to main content
      </a>

      <Navbar />

      <Routes>
        <Route path="/"                 element={<HomePage />} />
        <Route path="/analyze"          element={<AnalysisPage />} />
        <Route path="/dashboard"        element={<DashboardPage />} />
        <Route path="/history"          element={<HistoryPage />} />
        <Route path="/history/:id"      element={<PredictionDetailPage />} />
        <Route path="/predictions/:id"  element={<PredictionDetailPage />} />
        <Route path="*"                 element={<NotFoundPage />} />
      </Routes>

      <Footer />
    </BrowserRouter>
  );
}
