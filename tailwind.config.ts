import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0a0b0d',
        panel: '#141518',
        panel2: '#1b1d21',
        line: '#2c2e33',
        paper: '#ece7dc',
        paperdim: '#a9a49a',
        accent: '#4dd4e8',
        wa: '#25d366',
      },
      fontFamily: {
        archivo: ['var(--font-archivo)', 'sans-serif'],
        unbounded: ['var(--font-unbounded)', 'sans-serif'],
        inter: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-jbmono)', 'monospace'],
      },
      keyframes: {
        kenburns: { from: { transform: 'scale(1)' }, to: { transform: 'scale(1.12)' } },
        marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        scrolldrop: { '0%': { opacity: '0' }, '50%': { opacity: '1' }, '100%': { opacity: '0' } },
        nudge: { '0%,100%': { transform: 'translateX(0)' }, '50%': { transform: 'translateX(-16px)' } },
      },
      animation: {
        kenburns: 'kenburns 18s ease-in-out infinite alternate',
        marquee: 'marquee 26s linear infinite',
        scrolldrop: 'scrolldrop 1.8s ease infinite',
        nudge: 'nudge 2.2s ease-in-out 1s 3',
      },
    },
  },
  plugins: [],
};
export default config;
