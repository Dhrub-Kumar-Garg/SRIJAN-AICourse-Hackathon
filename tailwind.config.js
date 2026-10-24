export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        forest: "#12372A",
        emerald: "#16A34A",
        lime: "#C5F467",
        mint: "#E8F5E9",
        paper: "#F8FAF5",
        white: "#FFFFFF",
        ink: "#1F2937",
        muted: "#6B7280",
        line: "#E5E7EB",
        amber: "#F59E0B",
        danger: "#DC2626",
      },
      fontFamily: {
        heading: ["Fraunces", "serif"],
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
