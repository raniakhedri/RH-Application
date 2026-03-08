import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { LoginResponse } from '../types';

const SESSION_DURATION_MS = 4 * 60 * 60 * 1000; // 4 heures

interface AuthContextType {
  user: LoginResponse | null;
  login: (userData: LoginResponse) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<LoginResponse | null>(() => {
    const stored = localStorage.getItem('user');
    const loginTime = localStorage.getItem('loginTime');
    if (stored && loginTime) {
      const elapsed = Date.now() - Number(loginTime);
      if (elapsed < SESSION_DURATION_MS) {
        try {
          return JSON.parse(stored);
        } catch {
          localStorage.removeItem('user');
          localStorage.removeItem('loginTime');
        }
      } else {
        // Session expirée
        localStorage.removeItem('user');
        localStorage.removeItem('loginTime');
      }
    }
    return null;
  });

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('loginTime');
  }, []);

  // Vérifier l'expiration périodiquement (toutes les 60 secondes)
  useEffect(() => {
    const interval = setInterval(() => {
      const loginTime = localStorage.getItem('loginTime');
      if (loginTime && Date.now() - Number(loginTime) >= SESSION_DURATION_MS) {
        logout();
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, [logout]);

  const login = (userData: LoginResponse) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('loginTime', String(Date.now()));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
