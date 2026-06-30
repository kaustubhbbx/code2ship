import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Design System Colors
        background: '#000000',
        surface: '#0A0A0A',
        card: '#141414',
        primary: '#FF6600',
        success: '#FF8800',
        warning: '#FFAA00',
        danger: '#FF3300',
        text: '#FFFFFF',
        muted: '#A3A3A3',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
      boxShadow: {
        'sm-dark': '0 1px 2px 0 rgba(0, 0, 0, 0.5)',
        'md-dark': '0 4px 6px -1px rgba(0, 0, 0, 0.6)',
        'lg-dark': '0 10px 15px -3px rgba(0, 0, 0, 0.7)',
        'xl-dark': '0 20px 25px -5px rgba(0, 0, 0, 0.8)',
      },
    },
  },
  plugins: [],
};

export default config;
