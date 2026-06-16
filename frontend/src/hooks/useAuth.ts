import { useState, useEffect } from 'react';
import { authApi } from '../services/apiClient';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(authApi.isAuthenticated());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      await authApi.login(email, password);
      setIsAuthenticated(true);
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || 'Login failed';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      await authApi.register(email, password);
      await login(email, password);
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || 'Registration failed';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await authApi.logout();
    setIsAuthenticated(false);
  };

  return { isAuthenticated, loading, error, login, register, logout };
};
