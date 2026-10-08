import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function RequireAuth() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="panel subtle" style={{ margin: '40px auto', maxWidth: '480px', textAlign: 'center' }}>
        <p className="mono">// PROTOCOLO GESTALT: Verificando autorización...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet context={{ user }} />;
}

export default RequireAuth;
