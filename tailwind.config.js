/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1C1C1E',
        darkGrey: '#1C1C1E',
        surface: '#353539',
        offWhite: '#F5F5F2',
        gontor: {
          primary: '#1C1C1E',
          secondary: '#29292D',
          surface: '#353539',
          gold: '#D4AF37',
          softGold: '#E6C76B',
          offWhite: '#F5F5F2',
        },
        navy: {
          900: '#141416',
          primary: '#1C1C1E',
          secondary: '#29292D',
          surface: '#353539',
          light: '#3A3A3C',
        },
        gold: {
          DEFAULT: '#D4AF37',
          50: '#FDFBF7',
          100: '#F9F5EB',
          200: '#EFE5C6',
          accent: '#D4AF37',
          soft: '#E6C76B',
          light: '#E6C76B',
          dark: '#B08D23',
          glow: 'rgba(212, 175, 55, 0.25)',
        },
        slate: {
          kiosk: '#F3F5F9',
          border: '#E2E8F0',
        },
        success: {
          DEFAULT: '#16A34A',
          dark: '#15803D',
          light: '#DCFCE7',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 10px 25px -5px rgba(16, 29, 53, 0.08), 0 8px 10px -6px rgba(16, 29, 53, 0.04)',
        'card-hover': '0 20px 30px -10px rgba(16, 29, 53, 0.16), 0 10px 15px -5px rgba(201, 164, 92, 0.15)',
        'card-selected': '0 0 0 4px #C9A45C, 0 20px 35px -5px rgba(201, 164, 92, 0.35)',
        'gold-glow': '0 0 25px rgba(201, 164, 92, 0.45)',
      },
    },
  },
  plugins: [],
}
