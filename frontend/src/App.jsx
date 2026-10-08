import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Link, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import DevolaDashboard from './pages/DevolaDashboard';
import LaBiblioteca from './pages/LaBiblioteca';
import RequireAuth from './components/RequireAuth';

function Header() {
  const { user, logout } = useAuth();
  const [clock, setClock] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const formatted = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(
        now.getHours()
      )}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      setClock(formatted);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sys-header">
      <Link to="/" className="logo">
        <div className="logo-main">La Biblioteca</div>
        <div className="logo-sub">Protocolo Gestalt // Periodismo Asistido por IA</div>
      </Link>

      <nav className="header-nav">
        <NavLink
          to="/"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          end
        >
          La Biblioteca
        </NavLink>
        <NavLink
          to="/devola"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          Devola (HitL)
        </NavLink>
      </nav>

      <div className="sys-info">
        <div className="sys-info-item">
          <div className="sys-info-label">Estado Nodo</div>
          <div className="sys-info-value">
            <span className="status-dot"></span>Online
          </div>
        </div>

        <div className="sys-info-item">
          <div className="sys-info-label">Timestamp</div>
          <div className="sys-info-value">{clock || '--'}</div>
        </div>

        <div className="sys-info-item">
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="mono" style={{ fontSize: '11px', color: 'var(--accent)' }}>
                {user.nombre}
              </span>
              <button
                type="button"
                onClick={logout}
                className="button ghost"
                style={{ padding: '2px 8px', fontSize: '9px' }}
                title="Cerrar sesión"
              >
                Salir
              </button>
            </div>
          ) : (
            <Link to="/login" className="nav-link" style={{ padding: '4px 8px', fontSize: '10px' }}>
              [Acceso]
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<LaBiblioteca />} />
            <Route path="/login" element={<Login />} />
            <Route element={<RequireAuth />}>
              <Route path="/devola" element={<DevolaDashboard />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
