import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('atv_token'));
  const [loading, setLoading] = useState(true);

  // Set axios default Authorization header whenever token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('atv_token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('atv_token');
    }
  }, [token]);

  // Validate stored token on app load
  useEffect(() => {
    async function validateToken() {
      if (!token) { setLoading(false); return; }
      try {
        const res = await axios.get('/api/auth/me');
        setUser(res.data.user);
      } catch {
        // Token is invalid or expired
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    validateToken();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (email, password) => {
    const res = await axios.post('/api/auth/login', { email, password });
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const res = await axios.post('/api/auth/register', { name, email, password });
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
