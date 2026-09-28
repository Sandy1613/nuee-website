import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Each token reads from a CSS custom property (set as space-separated
        // "R G B", see client/src/index.css for defaults) so the whole
        // palette can be re-themed at runtime from Admin → Appearance
        // without a rebuild — see client/src/lib/theme.ts.
        charcoal: {
          DEFAULT: "rgb(var(--color-charcoal) / <alpha-value>)",
          light: "rgb(var(--color-charcoal-light) / <alpha-value>)",
          deep: "rgb(var(--color-charcoal-deep) / <alpha-value>)",
        },
        ivory: {
          DEFAULT: "rgb(var(--color-ivory) / <alpha-value>)",
          soft: "rgb(var(--color-ivory-soft) / <alpha-value>)",
          dim: "rgb(var(--color-ivory-dim) / <alpha-value>)",
        },
        gold: {
          DEFAULT: "rgb(var(--color-gold) / <alpha-value>)",
          light: "rgb(var(--color-gold-light) / <alpha-value>)",
          muted: "rgb(var(--color-gold-muted) / <alpha-value>)",
          deep: "rgb(var(--color-gold-deep) / <alpha-value>)",
        },
      },
      fontFamily: {
        serif: ["var(--font-display)", "'Playfair Display'", "serif"],
        display: ["var(--font-display)", "'Playfair Display'", "serif"],
        sans: ["var(--font-sans)", "'Inter'", "system-ui", "sans-serif"],
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
