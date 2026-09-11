/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        editor: {
          bg:      '#0d1117',
          sidebar: '#161b22',
          panel:   '#1c2128',
          border:  '#30363d',
          text:    '#e6edf3',
          muted:   '#7d8590',
          accent:  '#58a6ff',
        },
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(6,182,212,0.3)',
        'glow-blue': '0 0 20px rgba(59,130,246,0.3)',
      },
    },
  },
  plugins: [],
};
