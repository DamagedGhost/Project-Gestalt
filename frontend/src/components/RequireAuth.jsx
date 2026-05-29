import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import api from '../lib/api';

function RequireAuth() {
  const [state, setState] = useState({ status: 'loading', user: null });

  useEffect(() => {
    let active = true;
    api
      .get('/auth/me')
      .then((response) => {
        if (active) {
          setState({ status: 'ok', user: response.data.user });
        }
      })
      .catch(() => {
        if (active) {
          setState({ status: 'unauth', user: null });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  if (state.status === 'loading') {
    return (
      <div className="panel subtle">
        <p className="mono">Verificando acceso...</p>
      </div>
    );
  }

  if (state.status === 'unauth') {
    return <Navigate to="/login" replace />;
  }

  return <Outlet context={{ user: state.user }} />;
}

export default RequireAuth;
