const path = require('path')

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    path.join(__dirname, 'libs/reactive-artboard/**/*.{js,ts,jsx,tsx}'),
    path.join(__dirname, 'components/**/*.{js,ts,jsx,tsx}'),
    path.join(__dirname, 'app/**/*.{js,ts,jsx,tsx}'),
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        primary: 'var(--color-primary)',
        'primary-foreground': 'var(--color-primary-foreground)',
        muted: 'var(--color-muted)',
        'muted-foreground': 'var(--color-muted-foreground)',
        accent: 'var(--color-accent)',
        'accent-foreground': 'var(--color-accent-foreground)',
      },
      spacing: {
        custom: 'var(--margin)',
      },
      lineHeight: {
        tight: 'calc(var(--line-height) - 0.5)',
        snug: 'calc(var(--line-height) - 0.3)',
        normal: 'var(--line-height)',
        relaxed: 'calc(var(--line-height) + 0.3)',
        loose: 'calc(var(--line-height) + 0.5)',
      },
    },
  },
  plugins: [],
}
