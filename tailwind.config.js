/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {

      colors: {
        infinityBlue: "#3B82F6",
        infinityPurple: "#8B5CF6",
        infinityPurpleDark: "#4C1D95",
        infinityDark: "#1F2937",
        infinityGray: "#6B7280",
        infinityLight: "#F9FAFB",

        // Dark mode colors
        infinityBgDark: "#000000",
        infinityCardDark: "#111111",
        infinityTextDark: "#ffffff",
        infinityTextSecondaryDark: "#aaaaaa",
        infinityBorderDark: "#333333",
      },

      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },

        scaleIn: {
          "0%": {
            transform: "scale(0.9)",
            opacity: "0",
          },

          "100%": {
            transform: "scale(1)",
            opacity: "1",
          },
        },
      },

      animation: {
        fadeIn: "fadeIn 0.25s ease-out",
        scaleIn: "scaleIn 0.25s ease-out",
      },

      // Theme-aware utilities
      backgroundColor: {
        'infinity-bg': 'var(--infinity-bg)',
        'infinity-card': 'var(--infinity-card)',
      },

      textColor: {
        'infinity-text': 'var(--infinity-text)',
        'infinity-text-secondary': 'var(--infinity-text-secondary)',
      },

      borderColor: {
        'infinity-border': 'var(--infinity-border)',
      },

    },
  },

  plugins: [
    require('@tailwindcss/line-clamp'),
  ],
};
