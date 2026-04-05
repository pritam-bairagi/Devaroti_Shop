// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#088178',
          50: '#e6f3f2',
          100: '#b3dfdb',
          200: '#80cbc4',
          300: '#4db7ad',
          400: '#1aa396',
          500: '#088178',
          600: '#066760',
          700: '#044d48',
          800: '#023430',
          900: '#011a18',
        },
        secondary: {
          DEFAULT: '#041e42',
          50: '#e6e9f0',
          100: '#b3c1d1',
          200: '#8099b2',
          300: '#4d7193',
          400: '#1a4974',
          500: '#041e42',
          600: '#031835',
          700: '#021228',
          800: '#010c1a',
          900: '#01060d',
        },
        accent: {
          DEFAULT: '#f59e0b',
          50: '#fef5e7',
          100: '#fde3b8',
          200: '#fcd189',
          300: '#fbbf5a',
          400: '#faad2b',
          500: '#f59e0b',
          600: '#c47e09',
          700: '#935e07',
          800: '#623f04',
          900: '#311f02',
        },
      },
      fontFamily: {
        'spartan': ['Spartan', 'sans-serif'],
      },
      animation: {
        'marquee': 'marquee 25s linear infinite',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
        'bounce-slow': 'bounce 3s infinite',
        'pulse-ring': 'pulseRing 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        slideIn: {
          '0%': { transform: 'translateY(20px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        pulseRing: {
          '0%': { transform: 'scale(0.8)', opacity: 0.5 },
          '80%, 100%': { transform: 'scale(1.3)', opacity: 0 },
        },
      },
    },
  },
  plugins: [],
}

