import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFillDemo = () => {
    setForm({
      email: 'devola@gestalt.local',
      password: 'gestalt2026',
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(form.email, form.password);
      navigate('/devola', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Error de autenticación. Verifique sus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="panel auth-panel">
        <div className="panel-label">// AUTENTICACIÓN PROTOCOLO GESTALT</div>
        <h1 className="title" style={{ fontSize: '28px', marginBottom: '4px' }}>Acceso Unidad Devola</h1>
        <p className="subtitle mono" style={{ color: 'var(--fg-dim)', marginBottom: '24px', fontSize: '12px' }}>
          Consola editorial Human-in-the-Loop (HitL). Acceso restringido a operadores.
        </p>

        <form onSubmit={handleSubmit} className="form">
          <label className="label" htmlFor="login-email">
            <span>// IDENTIFICADOR / EMAIL</span>
            <input
              id="login-email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              autoComplete="username"
              placeholder="devola@gestalt.local"
              required
            />
          </label>

          <label className="label" htmlFor="login-password">
            <span>// CLAVE DE ACCESO</span>
            <input
              id="login-password"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
              placeholder="••••••••••••"
              required
            />
          </label>

          {error && <div className="error-box mono">{error}</div>}

          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button type="submit" className="button primary" disabled={loading} style={{ flex: 1 }}>
              {loading ? 'AUTENTICANDO...' : 'INICIAR SESIÓN'}
            </button>
            <button
              type="button"
              className="button ghost"
              onClick={handleFillDemo}
              title="Cargar credenciales predeterminadas"
            >
              Demo Devola
            </button>
          </div>
        </form>

        <div className="panel-hint mono">
          <small>
            Credenciales de operador configuradas en seed: <br />
            <code>devola@gestalt.local</code> / <code>gestalt2026</code>
          </small>
        </div>
      </div>
    </div>
  );
}

export default Login;
