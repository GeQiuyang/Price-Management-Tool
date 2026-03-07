/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#111111',
        slate: '#6e6e73',
        mist: '#f5f5f7',
        line: 'rgba(17, 17, 17, 0.08)',
        glass: 'rgba(255, 255, 255, 0.72)',
        accent: '#0071e3',
      },
      fontFamily: {
        sans: ['"SF Pro Display"', 'Inter', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        apple: '0 24px 60px rgba(17, 17, 17, 0.08)',
        float: '0 18px 40px rgba(17, 17, 17, 0.12)',
      },
      backgroundImage: {
        'hero-glow':
          'radial-gradient(circle at top, rgba(0, 113, 227, 0.18), transparent 34%), radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.9), transparent 30%), linear-gradient(180deg, #ffffff 0%, #f5f5f7 52%, #eef2f7 100%)',
        aurora:
          'radial-gradient(circle at 20% 20%, rgba(85, 170, 255, 0.16), transparent 30%), radial-gradient(circle at 80% 10%, rgba(255, 195, 113, 0.14), transparent 22%), linear-gradient(180deg, #fbfbfd 0%, #edf2f8 100%)',
      },
      keyframes: {
        reveal: {
          '0%': { opacity: '0', transform: 'translateY(32px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      animation: {
        reveal: 'reveal 0.8s cubic-bezier(0.22, 1, 0.36, 1) both',
        float: 'float 8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
