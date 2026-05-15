import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback
} from 'react';

import { api } from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('atv_token'));
  const [loading, setLoading] = useState(true);

  // 💾 sync token to localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem('atv_token', token);
    } else {
      localStorage.removeItem('atv_token');
    }
  }, [token]);

  // 🔑 sync token to axios default headers
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // 🔐 validate session on app start / token change
  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/api/auth/me');
        setUser(res.data.user);
      } catch (err) {
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    validateToken();
  }, [token]);

  // 🔑 LOGIN
  const login = useCallback(async (email, password) => {
    const res = await api.post('/api/auth/login', {
      email,
      password
    });

    setToken(res.data.token);
    setUser(res.data.user);

    return res.data;
  }, []);

  // 📝 REGISTER
  const register = useCallback(async (name, email, password) => {
    const res = await api.post('/api/auth/register', {
      name,
      email,
      password
    });

    setToken(res.data.token);
    setUser(res.data.user);

    return res.data;
  }, []);

  // 🚪 LOGOUT
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}