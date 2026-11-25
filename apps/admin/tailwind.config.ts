import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-cairo)', 'var(--font-tajawal)', 'system-ui', 'sans-serif'],
        display: ['var(--font-tajawal)', 'var(--font-cairo)', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          teal: '#0D9488',
          'teal-light': '#14B8A6',
          'teal-dark': '#0F766E',
          sky: '#0EA5E9',
          amber: '#F59E0B',
          surface: '#F8FAFC',
        },
      },
      boxShadow: {
        soft: '0 2px 12px -2px rgba(15, 23, 42, 0.05), 0 1px 4px -1px rgba(15, 23, 42, 0.03)',
        card: '0 4px 20px -4px rgba(15, 23, 42, 0.06), 0 1px 3px 0 rgba(15, 23, 42, 0.03)',
        glow: '0 8px 24px -6px rgba(13, 148, 136, 0.25)',
      },
    },
  },
  plugins: [],
};

export default config;
