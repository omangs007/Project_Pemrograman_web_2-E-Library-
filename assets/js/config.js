/* Design token — satu sumber kebenaran untuk seluruh nilai visual.
   Dimuat SETELAH cdn.tailwindcss.com; Play CDN membaca variabel global
   `tailwind.config` lalu mengompilasi ulang utility yang dipakai. */
tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#6366F1', 600: '#4F46E5', 400: '#818CF8' },
        ok:    '#14B8A6',
        warn:  '#F59E0B',
        bad:   '#F43F5E',
        ink:   { 900: '#0B1020', 800: '#131A33', 700: '#1B2347' }
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        body:    ['Inter', 'system-ui', 'sans-serif']
      },
      borderRadius: { control: '12px', card: '16px', panel: '24px' },
      backdropBlur: { sm: '12px', md: '20px', lg: '32px' }
    }
  }
};
