import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setTheme, updateSystemTheme } from '../store/slices/themeSlice';
import { ThemeMode } from '../types';

export function useTheme() {
  const dispatch = useAppDispatch();
  const { mode, resolvedTheme } = useAppSelector((state) => state.theme);

  useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [resolvedTheme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      dispatch(updateSystemTheme());
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [dispatch]);

  const changeTheme = (newTheme: ThemeMode) => {
    dispatch(setTheme(newTheme));
  };

  const toggleTheme = () => {
    const next = resolvedTheme === 'dark' ? 'light' : 'dark';
    dispatch(setTheme(next));
  };

  return {
    theme: mode,
    resolvedTheme,
    setTheme: changeTheme,
    toggleTheme,
    isDark: resolvedTheme === 'dark',
  };
}
