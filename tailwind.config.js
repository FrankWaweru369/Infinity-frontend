/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        infinityBlue: "#3B82F6",   // Main accent blue
        infinityPurple: "#8B5CF6", // Infinity branding purple
        infinityDark: "#1F2937",   // Dark background
        infinityGray: "#6B7280",   // Muted gray for text/icons
        infinityLight: "#F9FAFB",  // Light background
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
    },
  },
  plugins: [],
};
