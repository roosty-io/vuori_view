/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "var(--canvas)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        border: "var(--border)",
        "border-strong": "var(--border-strong)",
        ink: {
          DEFAULT: "var(--ink)",
          secondary: "var(--ink-secondary)",
          muted: "var(--ink-muted)",
        },
        sage: {
          DEFAULT: "var(--sage)",
          soft: "var(--sage-soft)",
          deep: "var(--sage-deep)",
        },
        ocean: {
          DEFAULT: "var(--ocean)",
          soft: "var(--ocean-soft)",
        },
        clay: {
          DEFAULT: "var(--clay)",
          soft: "var(--clay-soft)",
        },
        positive: "var(--positive)",
        warning: "var(--warning)",
        negative: "var(--negative)",
        info: "var(--info)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
        serif: ["'Cormorant Garamond'", "ui-serif", "Georgia", "serif"],
      },
      fontVariantNumeric: {
        tabular: "tabular-nums",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(37, 35, 31, 0.04), 0 1px 3px rgba(37, 35, 31, 0.03)",
        "card-hover": "0 6px 24px rgba(37, 35, 31, 0.08), 0 2px 6px rgba(37, 35, 31, 0.04)",
        drawer: "-12px 0 40px rgba(37, 35, 31, 0.12)",
        float: "0 12px 40px rgba(37, 35, 31, 0.10)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "fade-backdrop": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out both",
        "slide-in": "slide-in 0.28s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-backdrop": "fade-backdrop 0.2s ease-out both",
      },
    },
  },
  plugins: [],
};
