/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0B0F19',
          darker: '#070A10',
          card: 'rgba(255, 255, 255, 0.04)',
          elevated: 'rgba(255, 255, 255, 0.06)',
          primary: '#4F8CFF',
          purple: '#7A5CFF',
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
          border: 'rgba(255, 255, 255, 0.08)',
          text: {
            primary: '#F8FAFC',
            secondary: '#A0AEC0',
            muted: '#718096',
          }
        },
        accent: {
          blue: '#4F8CFF',
          purple: '#7A5CFF',
        },
      },
      spacing: {
        'xs': '0.25rem',
        'sm': '0.5rem',
        'md': '1rem',
        'lg': '1.5rem',
        'xl': '2rem',
        '2xl': '3rem',
        theme: 'var(--theme-spacing)',
      },
      padding: {
        theme: 'var(--theme-padding)',
      },
      borderRadius: {
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
        theme: 'var(--theme-radius)',
      },
      fontSize: {
        theme: 'var(--theme-font-size)',
        'xs': '0.75rem',
        'sm': '0.875rem',
        'base': '1rem',
        'lg': '1.125rem',
        'xl': '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
      },
      boxShadow: {
        'glow-blue': '0 0 40px rgba(79, 140, 255, 0.3)',
        'glow-purple': '0 0 40px rgba(122, 92, 255, 0.3)',
        'glow-success': '0 0 20px rgba(16, 185, 129, 0.3)',
        'glow-warning': '0 0 20px rgba(245, 158, 11, 0.3)',
        'glow-error': '0 0 20px rgba(239, 68, 68, 0.3)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.2)',
      },
      backdropBlur: {
        'xs': '2px',
        '2xl': '20px',
        '3xl': '24px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'typing': 'typing 1.4s infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(79, 140, 255, 0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(79, 140, 255, 0.4)' },
        },
        typing: {
          '0%, 60%, 100%': { opacity: '0.2' },
          '30%': { opacity: '1' },
        }
      },
      transitionTimingFunction: {
        'bounce-smooth': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      }
    },
  },
  darkMode: 'class',
  plugins: [],
}
