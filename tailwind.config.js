/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      // ═══════════════════════════════════════════════════════
      // PARADOX DESIGN SYSTEM COLORS
      // ═══════════════════════════════════════════════════════
      colors: {
        // Backgrounds
        'bg-base': '#0a0a0a',
        'bg-surface': '#1e1e1e',
        'bg-elevated': '#2a2a2a',

        // Accent (Neutral)
        'accent': {
          DEFAULT: '#00adef',
          bright: '#00d4ff',
          muted: '#0ea5e9',
        },

        // Degen Theme
        'degen': {
          DEFAULT: '#ff3333',
          accent: '#ff3366',
          secondary: '#ff9800',
          tertiary: '#ff6b6b',
        },

        // Regen Theme
        'regen': {
          DEFAULT: '#3399ff',
          accent: '#00d4ff',
          secondary: '#00ff88',
          tertiary: '#0066ff',
        },

        // Status Colors
        'success': {
          DEFAULT: '#10b981',
          bright: '#00c853',
        },
        'warning': {
          DEFAULT: '#ffc107',
          muted: '#f59e0b',
        },
        'error': {
          DEFAULT: '#ef4444',
          bright: '#ff4d4d',
        },

        // Utility
        'purple': '#9b59b6',
        'violet': '#8b5cf6',
        'pink': '#ec4899',
        'gold': '#ffd700',
      },

      // ═══════════════════════════════════════════════════════
      // BOX SHADOWS
      // ═══════════════════════════════════════════════════════
      boxShadow: {
        'glass-sm': '0 0 0 1px rgba(128, 128, 128, 0.08) inset, 0 2px 4px rgba(0, 0, 0, 0.1)',
        'glass-md': '0 0 0 1px rgba(128, 128, 128, 0.08) inset, 0 4px 8px rgba(0, 0, 0, 0.2)',
        'glass-lg': '0 0 0 1px rgba(128, 128, 128, 0.08) inset, 0 20px 40px -10px rgba(0, 0, 0, 0.5)',
        'glass-xl': '0 0 0 1px rgba(128, 128, 128, 0.08) inset, 0 30px 60px -15px rgba(0, 0, 0, 0.6)',
        
        'inner': '0 2px 4px rgba(0, 0, 0, 0.3) inset',
        'inner-strong': '0 4px 8px rgba(0, 0, 0, 0.5) inset',
        
        'glow-degen': '0 0 40px rgba(255, 51, 102, 0.8), 0 0 80px rgba(255, 51, 102, 0.4)',
        'glow-degen-strong': '0 0 60px 5px rgba(255, 50, 50, 0.7), inset 0 0 40px rgba(255, 50, 50, 0.1)',
        
        'glow-regen': '0 0 40px rgba(0, 212, 255, 0.8), 0 0 80px rgba(0, 212, 255, 0.4)',
        'glow-regen-strong': '0 0 60px 5px rgba(0, 150, 255, 0.7), inset 0 0 40px rgba(0, 150, 255, 0.1)',
        
        'button': '0 0.3rem 0.4rem rgba(255, 255, 255, 0.05)',
        'button-hover': '0 0.4rem 0.6rem rgba(255, 255, 255, 0.1)',
      },

      // ═══════════════════════════════════════════════════════
      // BORDER RADIUS (Extended)
      // ═══════════════════════════════════════════════════════
      borderRadius: {
        'pill': '9999px',
        '4xl': '32px',
        '5xl': '40px',
      },

      // ═══════════════════════════════════════════════════════
      // BACKDROP BLUR (Extended)
      // ═══════════════════════════════════════════════════════
      backdropBlur: {
        '4xl': '64px',
        '5xl': '80px',
      },

      // ═══════════════════════════════════════════════════════
      // TRANSITION DURATIONS
      // ═══════════════════════════════════════════════════════
      transitionDuration: {
        instant: '100ms',
        fast: '150ms',
        normal: '300ms',
        slow: '500ms',
        slower: '700ms',
        slowest: '1000ms',
      },

      // ═══════════════════════════════════════════════════════
      // ANIMATIONS
      // ═══════════════════════════════════════════════════════
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'gradient-shift': 'gradient-shift 3s ease infinite',
        'shimmer': 'shimmer 2s infinite',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

