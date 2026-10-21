/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0B1324',
          primary: '#101D35',
          secondary: '#24344E',
          surface: '#1A2942',
          light: '#2E4162',
        },
        gold: {
          50: '#FDFBF7',
          100: '#F8F3E6',
          200: '#EEDEB8',
          accent: '#C9A45C',
          light: '#DFBF7A',
          dark: '#9F7E3B',
          glow: 'rgba(201, 164, 92, 0.25)',
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
