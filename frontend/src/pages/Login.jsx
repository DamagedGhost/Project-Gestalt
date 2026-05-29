import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/login', form);
      navigate('/devola', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Error de autenticación.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel auth-panel">
      <h1 className="title">Acceso Devola</h1>
      <p className="subtitle mono">Autenticación protegida. HitL activo.</p>

      <form onSubmit={handleSubmit} className="form">
        <label className="label">
          Email
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
            required
          />
        </label>
        <label className="label">
          Password
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            autoComplete="current-password"
            required
          />
        </label>

        {error && <p className="error mono">{error}</p>}

        <button type="submit" className="button primary" disabled={loading}>
          {loading ? 'Validando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
}

export default Login;
