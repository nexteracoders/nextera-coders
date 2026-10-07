import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ThemeMode } from '../../types';
import { THEME_STORAGE_KEY } from '../../constants/theme';
import { storage } from '../../utils/storage';

interface ThemeState {
  mode: ThemeMode;
  resolvedTheme: 'light' | 'dark';
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getInitialTheme(): ThemeMode {
  return storage.get<ThemeMode>(THEME_STORAGE_KEY, 'dark');
}

const initialMode = getInitialTheme();
const initialResolved = initialMode === 'system' ? getSystemTheme() : initialMode;

const initialState: ThemeState = {
  mode: initialMode,
  resolvedTheme: initialResolved,
};

export const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<ThemeMode>) => {
      state.mode = action.payload;
      state.resolvedTheme = action.payload === 'system' ? getSystemTheme() : action.payload;
      storage.set(THEME_STORAGE_KEY, action.payload);
    },
    updateSystemTheme: (state) => {
      if (state.mode === 'system') {
        state.resolvedTheme = getSystemTheme();
      }
    },
  },
});

export const { setTheme, updateSystemTheme } = themeSlice.actions;
export default themeSlice.reducer;
