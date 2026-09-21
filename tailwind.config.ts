import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        charcoal: {
          DEFAULT: "#1b1917",
          light: "#28241f",
          deep: "#100f0e",
        },
        ivory: {
          DEFAULT: "#f6f1e7",
          soft: "#efe8d8",
          dim: "#ded4bb",
        },
        gold: {
          DEFAULT: "#b6903f",
          light: "#d3b876",
          muted: "#8c7042",
          deep: "#7a5f31",
        },
      },
      fontFamily: {
        serif: ["'Cormorant Garamond'", "'Playfair Display'", "serif"],
        display: ["'Playfair Display'", "serif"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        widest2: "0.28em",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.9s cubic-bezier(0.16,1,0.3,1) forwards",
        "fade-in": "fade-in 1s ease forwards",
      },
      transitionTimingFunction: {
        editorial: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
