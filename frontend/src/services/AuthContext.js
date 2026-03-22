import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from './api';

const AuthContext = createContext(null);

// Normalize user object so `id` is always set regardless of whether
// the backend returned `id` (login/signup) or `_id` (profile reload)
const normalizeUser = (u) => {
  if (!u) return null;
  return { ...u, id: u.id || u._id };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authAPI.profile()
        .then((data) => setUser(normalizeUser(data.user)))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await authAPI.login({ email, password });
    localStorage.setItem('token', data.token);
    setUser(normalizeUser(data.user));
    return data;
  }, []);

  const signup = useCallback(async (name, email, password) => {
    const data = await authAPI.signup({ name, email, password });
    localStorage.setItem('token', data.token);
    setUser(normalizeUser(data.user));
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const data = await authAPI.profile();
      setUser(normalizeUser(data.user));
    } catch {
      logout();
    }
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
