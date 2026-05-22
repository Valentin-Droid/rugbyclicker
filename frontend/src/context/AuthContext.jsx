import { createContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Restaurer la session au montage
  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const response = await authService.getMe();
          setUser(response.joueur || response.data?.joueur || response);
          setToken(storedToken);
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    restoreSession();
  }, []);

  const login = useCallback(async (data) => {
    const response = await authService.login(data);
    const { token: newToken, joueur } = response;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(joueur);
    return joueur;
  }, []);

  const register = useCallback(async (data) => {
    const response = await authService.register(data);
    const { token: newToken, joueur } = response;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(joueur);
    return joueur;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout, isAuthenticated }}
    >
      {children}
    </AuthContext.Provider>
  );
}
