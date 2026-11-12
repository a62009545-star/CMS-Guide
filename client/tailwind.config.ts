import typography from '@tailwindcss/typography';
import type { Config } from 'tailwindcss';

const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: v('brand'), strong: v('brand-strong'), soft: v('brand-soft'), fg: v('brand-fg') },
        ink: { DEFAULT: v('ink'), muted: v('ink-muted'), subtle: v('ink-subtle') },
        canvas: v('canvas'),
        surface: { DEFAULT: v('surface'), sunken: v('surface-sunken') },
        line: v('line'),
        success: v('success'),
        warning: v('warning'),
        info: v('info'),
      },
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      fontSize: {
        xs: ['0.8125rem', { lineHeight: '1.25rem' }],
        sm: ['0.875rem', { lineHeight: '1.375rem' }],
        base: ['1rem', { lineHeight: '1.625rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.3125rem', { lineHeight: '1.875rem', letterSpacing: '-0.01em' }],
        '2xl': ['1.625rem', { lineHeight: '2.125rem', letterSpacing: '-0.015em' }],
        '3xl': ['2.125rem', { lineHeight: '2.5rem', letterSpacing: '-0.02em' }],
        '4xl': ['2.75rem', { lineHeight: '3.125rem', letterSpacing: '-0.025em' }],
      },
      borderRadius: { card: '10px' },
      boxShadow: {
        card: '0 1px 2px rgb(26 26 26 / 0.05), 0 1px 1px rgb(26 26 26 / 0.03)',
        raised: '0 8px 24px -8px rgb(26 26 26 / 0.18), 0 2px 6px rgb(26 26 26 / 0.06)',
      },
      maxWidth: { prose: '72ch' },
      keyframes: {
        'route-draw': { from: { transform: 'scaleX(0)' }, to: { transform: 'scaleX(1)' } },
        'route-draw-y': { from: { transform: 'scaleY(0)' }, to: { transform: 'scaleY(1)' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'pop-in': { from: { opacity: '0', transform: 'translateY(-4px) scale(0.98)' }, to: { opacity: '1', transform: 'none' } },
      },
      animation: {
        'route-draw': 'route-draw 1.2s cubic-bezier(.65,0,.35,1) both',
        'route-draw-y': 'route-draw-y 1.2s cubic-bezier(.65,0,.35,1) both',
        'fade-in': 'fade-in .15s ease-out both',
        'pop-in': 'pop-in .16s ease-out both',
      },
    },
  },
  plugins: [typography],
} satisfies Config;
