export interface Theme {
  name: string;
  label: string;
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  error: string;
  warning: string;
  muted: string;
  border: string;
  bg: string;
  userMsg: string;
  assistantMsg: string;
  toolMsg: string;
  cmdPaletteBg: string;
  statusBg: string;
}

export const themes: Record<string, Theme> = {
  dracula: {
    name: 'dracula',
    label: 'Dracula',
    primary: '#bd93f9',
    secondary: '#8be9fd',
    accent: '#ff79c6',
    success: '#50fa7b',
    error: '#ff5555',
    warning: '#ffb86c',
    muted: '#6272a4',
    border: '#44475a',
    bg: '#282a36',
    userMsg: '#f8f8f2',
    assistantMsg: '#bd93f9',
    toolMsg: '#ffb86c',
    cmdPaletteBg: '#44475a',
    statusBg: '#44475a',
  },

  tokyonight: {
    name: 'tokyonight',
    label: 'Tokyo Night',
    primary: '#7aa2f7',
    secondary: '#bb9af7',
    accent: '#73daca',
    success: '#9ece6a',
    error: '#f7768e',
    warning: '#e0af68',
    muted: '#565f89',
    border: '#3b4261',
    bg: '#1a1b26',
    userMsg: '#c0caf5',
    assistantMsg: '#7aa2f7',
    toolMsg: '#e0af68',
    cmdPaletteBg: '#24283b',
    statusBg: '#24283b',
  },

  monokai: {
    name: 'monokai',
    label: 'Monokai',
    primary: '#66d9e8',
    secondary: '#a6e22e',
    accent: '#f92672',
    success: '#a6e22e',
    error: '#f92672',
    warning: '#fd971f',
    muted: '#75715e',
    border: '#49483e',
    bg: '#272822',
    userMsg: '#f8f8f2',
    assistantMsg: '#66d9e8',
    toolMsg: '#fd971f',
    cmdPaletteBg: '#3e3d32',
    statusBg: '#49483e',
  },

  catppuccin: {
    name: 'catppuccin',
    label: 'Catppuccin',
    primary: '#cba6f7',
    secondary: '#89dceb',
    accent: '#f38ba8',
    success: '#a6e3a1',
    error: '#f38ba8',
    warning: '#fab387',
    muted: '#585b70',
    border: '#45475a',
    bg: '#1e1e2e',
    userMsg: '#cdd6f4',
    assistantMsg: '#cba6f7',
    toolMsg: '#fab387',
    cmdPaletteBg: '#313244',
    statusBg: '#313244',
  },

  nord: {
    name: 'nord',
    label: 'Nord',
    primary: '#88c0d0',
    secondary: '#81a1c1',
    accent: '#b48ead',
    success: '#a3be8c',
    error: '#bf616a',
    warning: '#ebcb8b',
    muted: '#4c566a',
    border: '#3b4252',
    bg: '#2e3440',
    userMsg: '#eceff4',
    assistantMsg: '#88c0d0',
    toolMsg: '#ebcb8b',
    cmdPaletteBg: '#3b4252',
    statusBg: '#3b4252',
  },

  light: {
    name: 'light',
    label: 'Light',
    primary: '#5c6bc0',
    secondary: '#0097a7',
    accent: '#e91e63',
    success: '#43a047',
    error: '#e53935',
    warning: '#f57c00',
    muted: '#9e9e9e',
    border: '#e0e0e0',
    bg: '#fafafa',
    userMsg: '#212121',
    assistantMsg: '#5c6bc0',
    toolMsg: '#f57c00',
    cmdPaletteBg: '#f5f5f5',
    statusBg: '#e0e0e0',
  },

  gruvbox: {
    name: 'gruvbox',
    label: 'Gruvbox',
    primary: '#fabd2f',
    secondary: '#83a598',
    accent: '#fe8019',
    success: '#b8bb26',
    error: '#fb4934',
    warning: '#d79921',
    muted: '#928374',
    border: '#504945',
    bg: '#282828',
    userMsg: '#ebdbb2',
    assistantMsg: '#fabd2f',
    toolMsg: '#d79921',
    cmdPaletteBg: '#3c3836',
    statusBg: '#3c3836',
  },

  solarizeddark: {
    name: 'solarizeddark',
    label: 'Solarized Dark',
    primary: '#268bd2',
    secondary: '#2aa198',
    accent: '#b58900',
    success: '#859900',
    error: '#dc322f',
    warning: '#cb4b16',
    muted: '#586e75',
    border: '#073642',
    bg: '#002b36',
    userMsg: '#93a1a1',
    assistantMsg: '#268bd2',
    toolMsg: '#cb4b16',
    cmdPaletteBg: '#073642',
    statusBg: '#073642',
  },

  githubdark: {
    name: 'githubdark',
    label: 'GitHub Dark',
    primary: '#58a6ff',
    secondary: '#79c0ff',
    accent: '#a371f7',
    success: '#3fb950',
    error: '#f85149',
    warning: '#d29922',
    muted: '#8b949e',
    border: '#30363d',
    bg: '#0d1117',
    userMsg: '#c9d1d9',
    assistantMsg: '#58a6ff',
    toolMsg: '#d29922',
    cmdPaletteBg: '#161b22',
    statusBg: '#161b22',
  },
};

export function getTheme(name: string): Theme {
  return themes[name] ?? themes['dracula']!;
}

export const themeNames = Object.keys(themes);
