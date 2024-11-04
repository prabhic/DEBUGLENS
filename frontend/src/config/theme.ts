export const EDITOR_THEME = {
  // Base colors
  background: {
    primary: '#1e1e1e',
    secondary: '#252526',
    tertiary: '#2d2d2d',
    hover: '#2a2a2a',
  },
  border: {
    primary: '#3e3e42',
  },
  text: {
    primary: '#d4d4d4',
    secondary: '#cccccc',
    muted: '#858585',
  },
  // Syntax highlighting
  syntax: {
    variable: '#9cdcfe',
    type: '#4ec9b0',
    keyword: '#569cd6',
  },
  // Debug colors
  debug: {
    currentLine: 'rgba(38, 79, 120, 0.5)',
    breakpoint: {
      background: 'rgba(90, 29, 29, 0.4)',
      indicator: '#e51400',
    }
  },
  // Button colors
  button: {
    start: { base: '#388a34', hover: '#369432' },
    continue: { base: '#007acc', hover: '#0066aa' },
    step: { base: '#795e26', hover: '#8f6c2c' },
    stop: { base: '#a1260d', hover: '#bf2b0d' },
    neutral: { base: '#4d4d4d', hover: '#5a5a5a' },
  }
} as const; 