import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#f97316", // orange-500
          "primary-dark": "#c2410c", // orange-700
          secondary: "#0891b2", // cyan-600
          lime: "#a3e635",   // yellow-lime (kept for backward compat)
          mint: "#48C774",   // green-mint — Pago / active status
        },
        surface: {
          900: "#0a0a0f",
          800: "#111118",
          700: "#1a1a24",
          600: "#24243a",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 20px rgba(249, 115, 22, 0.15)",
        "glow-lg": "0 0 40px rgba(249, 115, 22, 0.2)",
        "glow-mint": "0 0 20px rgba(72, 199, 116, 0.15)",
      },
    },
  },
  plugins: [],
};

export default config;
