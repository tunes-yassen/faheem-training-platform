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
        porcelain: '#F8FAFC',
        ivory: '#FFFFFF',
        teal: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
        },
        emerald: {
          500: '#10B981',
          600: '#059669',
        },
        azure: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7',
          700: '#0369A1',
        },
        sunlit: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
        },
      },
      fontFamily: {
        heading: ['var(--font-cairo)', 'Cairo', 'sans-serif'],
        sans: ['var(--font-ibm-arabic)', 'IBM Plex Sans Arabic', 'Tajawal', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 24px -4px rgba(15, 23, 42, 0.06), 0 2px 8px -2px rgba(15, 23, 42, 0.04)',
        'soft-lg': '0 12px 40px -8px rgba(13, 148, 136, 0.12), 0 4px 16px -4px rgba(15, 23, 42, 0.06)',
        'teal-glow': '0 10px 30px -6px rgba(13, 148, 136, 0.35)',
        'azure-glow': '0 10px 30px -6px rgba(14, 165, 233, 0.30)',
        'amber-glow': '0 10px 30px -6px rgba(245, 158, 11, 0.30)',
      },
      backgroundImage: {
        'mesh-luminous':
          'radial-gradient(at 15% 15%, rgba(13, 148, 136, 0.10) 0px, transparent 50%), radial-gradient(at 85% 20%, rgba(14, 165, 233, 0.12) 0px, transparent 50%), radial-gradient(at 50% 85%, rgba(245, 158, 11, 0.08) 0px, transparent 50%)',
        'hero-gradient':
          'linear-gradient(135deg, #F0FDFA 0%, #F8FAFC 45%, #F0F9FF 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
