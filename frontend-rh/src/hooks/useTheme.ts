import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

type Theme = 'light' | 'dark';
export type AppFont = 'Inter' | 'Roboto' | 'Outfit' | 'Poppins' | 'Plus Jakarta Sans';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  font: AppFont;
  setFont: (font: AppFont) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme') as Theme | null;
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [font, setFontState] = useState<AppFont>(() => {
    const stored = localStorage.getItem('app-font') as AppFont | null;
    if (stored) return stored;
    return 'Inter'; // Default font
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--app-font', `"${font}", sans-serif`);
    localStorage.setItem('app-font', font);
  }, [font]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  const setFont = useCallback((newFont: AppFont) => {
    setFontState(newFont);
  }, []);

  return React.createElement(ThemeContext.Provider, {
    value: { theme, toggleTheme, setTheme, font, setFont },
    children,
  });
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
