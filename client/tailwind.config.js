/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        sage:  { 50:'#f6f7f6',100:'#e3e8e3',200:'#c7d1c8',300:'#a3b3a5',400:'#7d937f',500:'#5f7861',600:'#4a5f4c',700:'#3c4d3e',800:'#323f33',900:'#2a352c' },
        sand:  { 50:'#f9f8f6',100:'#f0ede8',200:'#e1dad0',300:'#cec0b0',400:'#b8a18c',500:'#a58971',600:'#8f7460',700:'#766050',800:'#625045',900:'#52443b' },
        clay:  { 50:'#f7f5f4',100:'#ede8e6',200:'#dcd2cd',300:'#c4b5ab',400:'#ab9386',500:'#98806f',600:'#8a7063',700:'#735d53',800:'#5f4e47',900:'#4e413c' },
        moss:  { 50:'#f4f6f4',100:'#e5ebe5',200:'#cbd6cc',300:'#a8b9a9',400:'#7f9680',500:'#5f7860',600:'#4a5f4b',700:'#3d4e3e',800:'#334135',900:'#2c362d' },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'serif'],
        body:    ['Literata', 'Georgia', 'serif'],
        sans:    ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft:       '0 2px 15px -3px rgba(0,0,0,0.07), 0 4px 6px -2px rgba(0,0,0,0.05)',
        lifted:     '0 10px 40px -10px rgba(0,0,0,0.12)',
        'inner-soft':'inset 0 2px 4px 0 rgba(0,0,0,0.05)',
      },
      animation: {
        'fade-in':   'fadeIn 0.4s ease-out',
        'slide-up':  'slideUp 0.4s ease-out',
        'scale-in':  'scaleIn 0.3s ease-out',
        float:       'float 6s ease-in-out infinite',
        shimmer:     'shimmer 1.5s linear infinite',
      },
      keyframes: {
        fadeIn:  { from:{ opacity:'0' }, to:{ opacity:'1' } },
        slideUp: { from:{ transform:'translateY(12px)', opacity:'0' }, to:{ transform:'translateY(0)', opacity:'1' } },
        scaleIn: { from:{ transform:'scale(0.95)', opacity:'0' }, to:{ transform:'scale(1)', opacity:'1' } },
        float:   { '0%,100%':{ transform:'translateY(0)' }, '50%':{ transform:'translateY(-8px)' } },
        shimmer: { '0%':{ backgroundPosition:'-1000px 0' }, '100%':{ backgroundPosition:'1000px 0' } },
      },
    },
  },
  plugins: [],
};
