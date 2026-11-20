import { createContext, useContext, useEffect, useState, useCallback } from 'react';

// Theme values
const THEME_LIGHT = 'light';
const THEME_DARK = 'dark';
const THEME_SYSTEM = 'system';

const ThemeContext = createContext({
  theme: THEME_LIGHT,
  resolvedTheme: THEME_LIGHT,
  setTheme: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children, defaultTheme = THEME_SYSTEM }) {
  const [theme, setThemeState] = useState(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState(THEME_LIGHT);
  const [mounted, setMounted] = useState(false);

  const setTheme = useCallback((nextTheme) => {
    setThemeState(nextTheme);
    localStorage.setItem('theme', nextTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === THEME_LIGHT ? THEME_DARK : THEME_LIGHT;
      localStorage.setItem('theme', next);
      return next;
    });
  }, []);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('theme');
    if (stored) {
      setThemeState(stored);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const resolve = () => {
      if (theme === THEME_SYSTEM) {
        setResolvedTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? THEME_DARK : THEME_LIGHT);
      } else {
        setResolvedTheme(theme);
      }
    };

    resolve();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', resolve);
    return () => mediaQuery.removeEventListener('change', resolve);
  }, [theme, mounted]);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (resolvedTheme === THEME_DARK) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [resolvedTheme, mounted]);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};