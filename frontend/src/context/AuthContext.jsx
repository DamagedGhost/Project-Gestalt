import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { AuthContext } from './authContextInstance';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data.user);
    } catch {
      setUser(null);
      localStorage.removeItem('gestalt_token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data?.token) {
      localStorage.setItem('gestalt_token', response.data.token);
    }
    setUser(response.data.user);
    return response.data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Error al cerrar sesión en el servidor:', err);
    } finally {
      localStorage.removeItem('gestalt_token');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}
