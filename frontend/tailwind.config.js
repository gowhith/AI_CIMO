/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "Menlo", "monospace"],
      },
      colors: {
        // Refined surface scale — slightly cool, distinct steps
        surface: {
          0: "#08090c",   // app background
          1: "#0c0e13",   // sidebar
          2: "#11141b",   // card base
          3: "#171b24",   // card hover / nested
          4: "#1f242f",   // border heavy
        },
        line: {
          DEFAULT: "#1c2029",
          strong: "#262b36",
        },
        // Text — every step is comfortably readable on dark surfaces
        // fg        = primary headings, KPI values         (contrast >15:1)
        // fg-muted  = subtitles, body, descriptions        (contrast >13:1)
        // fg-subtle = timestamps, quiet metadata           (contrast >8:1)
        fg: {
          DEFAULT: "#fafbfc",
          muted: "#d8dce4",
          subtle: "#a3aab8",
          faint: "#7c8392",
        },
        // Single vibrant accent: electric IBM blue
        accent: {
          50: "#eef5ff",
          100: "#d9e7ff",
          200: "#b3cfff",
          300: "#7ba9ff",
          400: "#4585ff",
          500: "#1f63f5",
          600: "#0f4cdb",
          700: "#0a3ab0",
          800: "#0a2f84",
          900: "#0a235e",
        },
        ok: { 400: "#34d399", 500: "#10b981", 600: "#059669" },
        warn: { 400: "#fbbf24", 500: "#f59e0b", 600: "#d97706" },
        crit: { 400: "#f87171", 500: "#ef4444", 600: "#dc2626" },
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgba(0,0,0,0.4)",
        md: "0 4px 12px -2px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04) inset",
        lg: "0 12px 32px -8px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset",
        glow: "0 0 0 1px rgba(31,99,245,0.4), 0 8px 24px -8px rgba(31,99,245,0.6)",
        ring: "0 0 0 4px rgba(31,99,245,0.18)",
      },
      animation: {
        "fade-in": "fadeIn 0.25s ease-out",
        "fade-in-up": "fadeInUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-down": "slideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        "scale-in": "scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        shimmer: "shimmer 1.6s linear infinite",
        "live-pulse": "livePulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: 0 }, "100%": { opacity: 1 } },
        fadeInUp: {
          "0%": { opacity: 0, transform: "translateY(8px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        slideDown: {
          "0%": { opacity: 0, transform: "translateY(-6px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: 0, transform: "scale(0.95)" },
          "100%": { opacity: 1, transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        livePulse: {
          "0%, 100%": { opacity: 1, transform: "scale(1)" },
          "50%": { opacity: 0.6, transform: "scale(1.4)" },
        },
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};
