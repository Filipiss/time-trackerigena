import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiGetProfile, apiLogin, apiRegister } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('auth_token'));
  const [loading, setLoading] = useState(!!localStorage.getItem('auth_token'));

  // Carrega perfil do user ao iniciar se já tiver token
  useEffect(() => {
    if (token) {
      apiGetProfile(token)
        .then((u) => setUser(u))
        .catch(() => {
          localStorage.removeItem('auth_token');
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = useCallback(async (identifier, password) => {
    const data = await apiLogin(identifier, password);
    localStorage.setItem('auth_token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
  }, []);

  const register = useCallback(async (username, email, password, phone) => {
    return apiRegister(username, email, password, phone);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    const u = await apiGetProfile(token);
    setUser(u);
    return u;
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, register, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
