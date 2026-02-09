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
        infinityBlue: "#3B82F6",   // Main accent blue
        infinityPurple: "#8B5CF6", // Infinity branding purple (light theme)
        infinityPurpleDark: "#4C1D95", // Infinity dark purple (dark theme)
        infinityDark: "#1F2937",   // Dark background
        infinityGray: "#6B7280",   // Muted gray for text/icons
        infinityLight: "#F9FAFB",  // Light background
        
        // Dark mode specific colors
        infinityBgDark: "#000000",    // Dark background from your design
        infinityCardDark: "#111111",  // Dark cards from your design
        infinityTextDark: "#ffffff",  // Dark text from your design
        infinityTextSecondaryDark: "#aaaaaa", // Secondary dark text
        infinityBorderDark: "#333333", // Dark borders
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.25s ease-out",
        scaleIn: "scaleIn 0.25s ease-out",
      },
      // Custom theme-aware utilities
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
  plugins: [],
};
