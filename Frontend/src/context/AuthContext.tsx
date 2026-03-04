import React, { createContext, useContext, useState, ReactNode } from 'react';
import { LoginResponse } from '../types';

const SESSION_DURATION_MS = 4 * 60 * 60 * 1000; // 4 heures

interface AuthContextType {
  user: LoginResponse | null;
  login: (userData: LoginResponse) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Restore user from localStorage, checking 4h expiry */
const getStoredUser = (): LoginResponse | null => {
  try {
    const stored = localStorage.getItem('user');
    const loginTime = localStorage.getItem('loginTime');
    if (!stored) return null;

    // Check 4h expiry
    if (loginTime) {
      const elapsed = Date.now() - Number(loginTime);
      if (elapsed > SESSION_DURATION_MS) {
        localStorage.removeItem('user');
        localStorage.removeItem('loginTime');
        return null;
      }
    }

    return JSON.parse(stored);
  } catch {
    localStorage.removeItem('user');
    localStorage.removeItem('loginTime');
    return null;
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize directly from localStorage — no flash of unauthenticated state
  const [user, setUser] = useState<LoginResponse | null>(getStoredUser);

  const login = (userData: LoginResponse) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('loginTime', String(Date.now()));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('loginTime');
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
