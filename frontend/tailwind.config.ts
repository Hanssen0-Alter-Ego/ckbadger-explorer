import type { Config } from 'tailwindcss';

export default {
  content: {
    relative: true,
    files: [
      './app/**/*.{js,ts,jsx,tsx,mdx}',
      './components/**/*.{js,ts,jsx,tsx,mdx}',
      './site/pages/**/*.{js,ts,jsx,tsx,mdx}',
      './src/**/*.{js,ts,jsx,tsx,mdx}',
    ],
  },
  darkMode: 'class',
  theme: {
    container: {
      center: true,
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
      },
    },
    extend: {
      colors: {
        // Explorer surfaces inspired by the CCC App console. Keep chart categories distinct.
        base: {
          void: 'rgb(var(--surface-recess-rgb) / <alpha-value>)',
          bg: 'rgb(var(--background-rgb) / <alpha-value>)',
          surface: 'rgb(var(--color-surface-rgb) / <alpha-value>)',
          elevated: 'rgb(var(--color-elevated-rgb) / <alpha-value>)',
          border: 'rgb(var(--color-border-rgb) / <alpha-value>)',
          'border-subtle': 'rgb(var(--color-border-subtle-rgb) / <alpha-value>)',
        },
        text: {
          bright: 'rgb(var(--foreground-rgb) / <alpha-value>)',
          DEFAULT: 'rgb(var(--text-body-rgb) / <alpha-value>)',
          dim: 'rgb(var(--text-muted-rgb) / <alpha-value>)',
          ghost: 'rgb(var(--text-muted-rgb) / <alpha-value>)',
        },
        interactive: {
          DEFAULT: 'rgb(var(--color-interactive-rgb) / <alpha-value>)',
          hover: 'rgb(var(--color-interactive-hover-rgb) / <alpha-value>)',
          muted: '#5bcefa20',
          dim: '#91a7b2',
        },
        emphasis: {
          DEFAULT: 'rgb(var(--color-interactive-rgb) / <alpha-value>)',
          dim: '#a99d85',
          glow: '#5bcefa40',
          bright: 'rgb(var(--color-interactive-hover-rgb) / <alpha-value>)',
        },
        positive: {
          DEFAULT: 'rgb(var(--tone-positive-rgb) / <alpha-value>)',
          dim: '#819c90',
          bright: '#bacfc4',
        },
        negative: {
          DEFAULT: '#d6a1a9',
          dim: '#b38a91',
          bright: '#e8bac1',
        },
        warning: {
          DEFAULT: 'rgb(var(--tone-warning-rgb) / <alpha-value>)',
          dim: '#a99d85',
          bright: '#ded4bd',
        },
        info: {
          DEFAULT: 'rgb(var(--color-interactive-rgb) / <alpha-value>)',
          dim: '#91a7b2',
          bright: '#c3d5de',
        },
        // Chinese traditional named colors
        jade: {
          DEFAULT: 'rgb(var(--color-interactive-rgb) / <alpha-value>)',
          dim: '#8da4af',
        },
        rouge: {
          DEFAULT: '#d6a1a9',
          dim: '#b38a91',
        },
        aqua: {
          DEFAULT: 'rgb(var(--color-interactive-rgb) / <alpha-value>)',
          dim: '#91a7b2',
        },
        gold: {
          DEFAULT: 'rgb(var(--tone-warning-rgb) / <alpha-value>)',
          dim: '#a99d85',
        },
        lavender: {
          DEFAULT: '#b5bec4',
          dim: '#909fa8',
        },
        amber: {
          DEFAULT: '#c2ae97',
          dim: '#a3917c',
        },
        // Activity type semantic colors
        token: {
          DEFAULT: '#c4b0b5',
          bright: '#ddc9ce',
        },
        // Chart accent palette (12 colors)
        'accent-1': '#9eb9ac',
        'accent-2': '#d6a1a9',
        'accent-3': 'rgb(var(--color-interactive-rgb) / <alpha-value>)',
        'accent-4': '#d0bd96',
        'accent-5': '#b5bec4',
        'accent-6': '#c2ae97',
        'accent-7': '#819c90',
        'accent-8': '#b38a91',
        'accent-9': '#91a7b2',
        'accent-10': '#a99d85',
        'accent-11': '#909fa8',
        'accent-12': '#a3917c',
      },
      fontFamily: {
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
      },
      fontFeatureSettings: {
        tnum: '"tnum"',
      },
      boxShadow: {
        glow: '0 0 8px #9eb9ac20, 0 0 20px #9eb9ac12',
        'glow-strong': '0 0 8px #9eb9ac30, 0 0 20px #9eb9ac20',
        'glow-inset': 'inset 0 1px 10px #9eb9ac10',
        'glow-jade': '0 0 10px #9eb9ac28, 0 0 20px #9eb9ac14',
        'glow-rouge': '0 0 10px #d6a1a928, 0 0 20px #d6a1a914',
        'glow-aqua': '0 0 10px #5bcefa28, 0 0 20px #5bcefa14',
        'glow-gold': '0 0 10px #d0bd9628, 0 0 20px #d0bd9614',
        'glow-lavender': '0 0 10px #b5bec428, 0 0 20px #b5bec414',
        'glow-amber': '0 0 10px #c2ae9728, 0 0 20px #c2ae9714',
      },
      animation: {
        'terminal-flicker': 'terminal-flicker 0.15s infinite',
        'terminal-glow-pulse': 'terminal-glow-pulse 4s ease-in-out infinite',
        'digit-tick': 'digit-tick 0.2s ease-out',
        'scan-line': 'scan-line 8s linear infinite',
        'text-reveal': 'text-reveal 0.5s ease-out forwards',
        // Micro-interactions
        'glow-pulse': 'glow-pulse 1.5s ease-in-out infinite',
        'confirm-fade': 'confirm-fade 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
        glitch: 'glitch 0.3s ease-out',
      },
      keyframes: {
        'terminal-flicker': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.99' },
          '25%, 75%': { opacity: '0.98' },
        },
        'terminal-glow-pulse': {
          '0%, 100%': { filter: 'brightness(1)' },
          '50%': { filter: 'brightness(1.05)' },
        },
        'digit-tick': {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        'text-reveal': {
          '0%': { opacity: '0', filter: 'blur(4px)' },
          '100%': { opacity: '1', filter: 'blur(0)' },
        },
        // Micro-interaction keyframes
        'glow-pulse': {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        'confirm-fade': {
          '0%': { opacity: '0', transform: 'translateY(2px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glitch: {
          '0%': { transform: 'translate(0)', opacity: '1' },
          '20%': { transform: 'translate(-1px, 1px)', opacity: '0.9' },
          '40%': { transform: 'translate(1px, -1px)', opacity: '0.95' },
          '60%': { transform: 'translate(-0.5px, 0.5px)', opacity: '0.9' },
          '80%': { transform: 'translate(0.5px, -0.5px)', opacity: '0.95' },
          '100%': { transform: 'translate(0)', opacity: '1' },
        },
      },
      // Japanese poster inspired spacing rhythm
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
    },
  },
  plugins: [],
} satisfies Config;
