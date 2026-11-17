// Pathways uses prebuilt CSS so navigation never waits for browser-side styling.
// Rebuild from the repository root:
// npm exec --yes --package=tailwindcss@3.4.17 -- tailwindcss -c frontend/pathways/tailwind.config.cjs -i frontend/pathways/utilities.input.css -o frontend/pathways/utilities.css --minify
const path = require('node:path');
module.exports = {
  content: [path.join(__dirname, 'index.html'), path.join(__dirname, 'pathways.js')],
  safelist: [
    'glass-card',
    'p-8',
    'flex',
    'flex-col',
    'opacity-80',
    'hover:opacity-100',
    'transition-opacity',
    'transition-colors',
    'hover:border-brand-accent2/50',
    'hover:border-brand-surfaceLight',
    'text-xs',
    'font-bold',
    'tracking-wider',
    'uppercase',
    'text-brand-muted',
    'text-brand-accent2',
    'text-brand-accent1',
    'mb-3',
    'mb-4',
    'mb-6',
    'block',
    'text-xl',
    'font-display',
    'text-brand-ink',
    'text-sm',
    'leading-relaxed',
    'flex-grow',
    'font-semibold',
    'w-full',
    'py-3',
    'rounded-lg',
    'bg-brand-bg',
    'border',
    'border-brand-surfaceLight',
    'hover:border-brand-accent2',
    'hover:text-white',
    'font-medium',
    'text-center',
    'md:col-span-2',
    'lg:col-span-3'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Work Sans', 'sans-serif'],
        display: ['Noka', 'Work Sans', 'sans-serif']
      },
      colors: {
        brand: {
          bg: '#fff7ef',
          surface: '#ffffff',
          surfaceLight: '#e7dff1',
          accent1: '#5b2b82',
          accent2: '#f97316',
          accent3: '#ef4444',
          ink: '#1f2937',
          muted: '#6b7280'
        }
      }
    }
  }
};
