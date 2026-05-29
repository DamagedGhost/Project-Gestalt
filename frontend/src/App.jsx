import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import DevolaDashboard from './pages/DevolaDashboard';
import LaBiblioteca from './pages/LaBiblioteca';
import RequireAuth from './components/RequireAuth';

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell scanlines">
        <header className="app-header">
          <div>
            <p className="mono small">Proyecto Gestalt</p>
            <h1 className="title">Gestalt Node</h1>
          </div>
          <nav className="nav">
            <Link to="/" className="link">
              La Biblioteca
            </Link>
            <Link to="/devola" className="link">
              Devola
            </Link>
            <Link to="/login" className="link">
              Acceso
            </Link>
          </nav>
        </header>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<LaBiblioteca />} />
            <Route path="/login" element={<Login />} />
            <Route element={<RequireAuth />}>
              <Route path="/devola" element={<DevolaDashboard />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
