export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF7700',
        danger: '#ef4444',
        warning: '#f59e0b',
        success: '#22c55e',
      },
      maxWidth: {
        'mobile': '480px',
      }
    },
  },
  plugins: [],
}
