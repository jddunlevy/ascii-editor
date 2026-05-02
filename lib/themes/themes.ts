export const THEMES = [
  'notebook',
  'avocado',
  'sakura',
  'blood-orange',
  'blue-bird',
] as const;

export type ThemeName = (typeof THEMES)[number];

export type ThemeTokens = {
  bg: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
};

export const themeTokens: Record<ThemeName, ThemeTokens> = {
  notebook: {
    bg: '#f5f1e8',
    surface: '#ffffff',
    text: '#1a1a1a',
    muted: '#666666',
    accent: '#000000',
  },
  avocado: {
    bg: '#d4e3c0',
    surface: '#e8efd9',
    text: '#2d3a1f',
    muted: '#5a6b46',
    accent: '#3d5a2a',
  },
  sakura: {
    bg: '#fce4ec',
    surface: '#fdeef3',
    text: '#3a1f2e',
    muted: '#7a4a60',
    accent: '#d9869f',
  },
  'blood-orange': {
    bg: '#ffb380',
    surface: '#ffd9b3',
    text: '#2a0f00',
    muted: '#8a3a1a',
    accent: '#c91540',
  },
  'blue-bird': {
    bg: '#bcd4e6',
    surface: '#d4e2ee',
    text: '#3a2820',
    muted: '#7a5a48',
    accent: '#6e4030',
  },
};

export const THEME_LABELS: Record<ThemeName, string> = {
  notebook: 'Notebook',
  avocado: 'Avocado',
  sakura: 'Sakura',
  'blood-orange': 'Blood Orange',
  'blue-bird': 'Blue Bird',
};

export const DEFAULT_THEME: ThemeName = 'notebook';

export const THEME_STORAGE_KEY = 'ascii-editor-theme';
