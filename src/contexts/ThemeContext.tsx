'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { readStorage, writeStorage } from '@/utils/storage/jsonStorage';

type Theme = 'light' | 'dark';

interface ThemeActionsType {
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

interface ThemeContextType extends ThemeActionsType {
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const ThemeActionsContext = createContext<ThemeActionsType | undefined>(undefined);

const STORAGE_KEY = 'theme';
const THEME_TRANSITION_BLOCK_CLASS = 'theme-switching';

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const savedTheme = readStorage(window.localStorage, STORAGE_KEY);
  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyThemeToDocument(theme: Theme) {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
}

function temporarilyDisableThemeTransitions() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  root.classList.add(THEME_TRANSITION_BLOCK_CLASS);

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      root.classList.remove(THEME_TRANSITION_BLOCK_CLASS);
    });
  });
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const hasHydratedRef = useRef(false);

  const setTheme = useCallback((newTheme: Theme) => {
    temporarilyDisableThemeTransitions();
    applyThemeToDocument(newTheme);

    if (typeof window !== 'undefined') {
      writeStorage(window.localStorage, STORAGE_KEY, newTheme);
    }

    setThemeState(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((currentTheme) => {
      const nextTheme: Theme = currentTheme === 'light' ? 'dark' : 'light';
      temporarilyDisableThemeTransitions();
      applyThemeToDocument(nextTheme);
      if (typeof window !== 'undefined') {
        writeStorage(window.localStorage, STORAGE_KEY, nextTheme);
      }
      return nextTheme;
    });
  }, []);

  useEffect(() => {
    const hydratedTheme = getInitialTheme();
    hasHydratedRef.current = true;
    applyThemeToDocument(hydratedTheme);
    setThemeState((currentTheme) =>
      currentTheme === hydratedTheme ? currentTheme : hydratedTheme
    );
  }, []);

  useEffect(() => {
    if (!hasHydratedRef.current) {
      return;
    }

    applyThemeToDocument(theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (event: MediaQueryListEvent) => {
      const savedTheme = readStorage(window.localStorage, STORAGE_KEY);
      if (savedTheme === 'light' || savedTheme === 'dark') {
        return;
      }

      setThemeState(event.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, []);

  const actionsValue = useMemo<ThemeActionsType>(
    () => ({ toggleTheme, setTheme }),
    [toggleTheme, setTheme]
  );

  const contextValue = useMemo<ThemeContextType>(
    () => ({ theme, toggleTheme, setTheme }),
    [theme, toggleTheme, setTheme]
  );

  return (
    <ThemeActionsContext.Provider value={actionsValue}>
      <ThemeContext.Provider value={contextValue}>
        {children}
      </ThemeContext.Provider>
    </ThemeActionsContext.Provider>
  );
}

const NOOP_THEME_ACTIONS: ThemeActionsType = {
  toggleTheme: () => {},
  setTheme: () => {},
};

export function useThemeActions(): ThemeActionsType {
  return useContext(ThemeActionsContext) ?? NOOP_THEME_ACTIONS;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    return {
      theme: 'light' as Theme,
      ...NOOP_THEME_ACTIONS,
    };
  }
  return context;
}
