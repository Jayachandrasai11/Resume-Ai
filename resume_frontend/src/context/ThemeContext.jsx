import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

const colorMappings = {
  blue: {
    primary: '#3B82F6',
    primaryLight: '#60A5FA',
    primaryDark: '#2563EB',
    ring: '#3B82F6',
  },
  indigo: {
    primary: '#6366F1',
    primaryLight: '#818CF8',
    primaryDark: '#4F46E5',
    ring: '#6366F1',
  },
  purple: {
    primary: '#A855F7',
    primaryLight: '#C084FC',
    primaryDark: '#9333EA',
    ring: '#A855F7',
  },
  emerald: {
    primary: '#10B981',
    primaryLight: '#34D399',
    primaryDark: '#059669',
    ring: '#10B981',
  },
  rose: {
    primary: '#F43F5E',
    primaryLight: '#FB7185',
    primaryDark: '#E11D48',
    ring: '#F43F5E',
  },
};

const densityMappings = {
  compact: {
    spacing: '0.375rem',
    padding: '0.5rem',
    borderRadius: '0.25rem',
    fontSize: '0.875rem',
  },
  comfortable: {
    spacing: '0.75rem',
    padding: '0.75rem',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
  },
  relaxed: {
    spacing: '1rem',
    padding: '1rem',
    borderRadius: '0.75rem',
    fontSize: '1rem',
  },
};

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState({
    darkMode: true,
    primaryColor: 'blue',
    density: 'comfortable',
    isLoaded: false,
  });

  const applyTheme = (themeConfig) => {
    const root = document.documentElement;
    const colors = colorMappings[themeConfig.primaryColor] || colorMappings.blue;
    const density = densityMappings[themeConfig.density] || densityMappings.comfortable;

    // Apply dark mode
    if (themeConfig.darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Apply CSS variables
    root.style.setProperty('--theme-primary', colors.primary);
    root.style.setProperty('--theme-primary-light', colors.primaryLight);
    root.style.setProperty('--theme-primary-dark', colors.primaryDark);
    root.style.setProperty('--theme-ring', colors.ring);
    root.style.setProperty('--theme-spacing', density.spacing);
    root.style.setProperty('--theme-padding', density.padding);
    root.style.setProperty('--theme-radius', density.borderRadius);
    root.style.setProperty('--theme-font-size', density.fontSize);

    // Apply accent color classes globally
    document.body.style.setProperty('--accent-color', colors.primary);
  };

  const setTheme = async (newTheme) => {
    const updatedTheme = { ...theme, ...newTheme };
    setThemeState(updatedTheme);
    applyTheme(updatedTheme);

    // Only persist to backend if user is authenticated
    const hasToken = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (hasToken) {
      try {
        await api.updatePreferences({
          ui_prefs: updatedTheme,
        });
      } catch (error) {
        console.warn('Failed to persist theme preferences:', error);
      }
    }
  };

  useEffect(() => {
    const loadTheme = async () => {
      try {
        // Load from localStorage first for instant UI
        const stored = localStorage.getItem('theme-prefs');
        if (stored) {
          const storedTheme = JSON.parse(stored);
          setThemeState({ ...storedTheme, isLoaded: true });
          applyTheme(storedTheme);
        }

        // Only load from backend if user is authenticated
        const hasToken = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (hasToken) {
          const res = await api.getPreferences();
          if (res.data?.ui_prefs) {
            const serverTheme = res.data.ui_prefs;
            setThemeState({ ...serverTheme, isLoaded: true });
            applyTheme(serverTheme);
            localStorage.setItem('theme-prefs', JSON.stringify(serverTheme));
          }
        }
      } catch (error) {
        console.warn('Failed to load theme preferences:', error);
        // Use system preference as fallback
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setThemeState({ darkMode: prefersDark, primaryColor: 'blue', density: 'comfortable', isLoaded: true });
        applyTheme({ darkMode: prefersDark, primaryColor: 'blue', density: 'comfortable' });
      }
    };

    loadTheme();
  }, []);

  // Persist theme changes to localStorage immediately
  useEffect(() => {
    if (theme.isLoaded) {
      localStorage.setItem('theme-prefs', JSON.stringify(theme));
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
