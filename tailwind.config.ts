import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Core Brand ──────────────────────────────────────────
        "primary": "#003772",
        "on-primary": "#ffffff",
        "primary-container": "#004e9c",
        "on-primary-container": "#a1c2ff",
        "primary-fixed": "#d6e3ff",
        "primary-fixed-dim": "#aac7ff",
        "on-primary-fixed": "#001b3e",
        "on-primary-fixed-variant": "#00468c",
        "inverse-primary": "#aac7ff",

        // ── Secondary / Gold ────────────────────────────────────
        "secondary": "#745b00",
        "on-secondary": "#ffffff",
        "secondary-container": "#fdcc10",
        "on-secondary-container": "#6e5700",
        "secondary-fixed": "#ffe08a",
        "secondary-fixed-dim": "#f1c100",
        "on-secondary-fixed": "#241a00",
        "on-secondary-fixed-variant": "#574400",

        // ── Tertiary ────────────────────────────────────────────
        "tertiary": "#003774",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#004d9f",
        "on-tertiary-container": "#a2c2ff",
        "tertiary-fixed": "#d7e2ff",
        "tertiary-fixed-dim": "#abc7ff",
        "on-tertiary-fixed": "#001b3f",
        "on-tertiary-fixed-variant": "#00458f",

        // ── Error ───────────────────────────────────────────────
        "error": "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",

        // ── Surface Tiers ───────────────────────────────────────
        "surface": "#f9f9f8",
        "surface-dim": "#d9dad9",
        "surface-bright": "#f9f9f8",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f3f4f3",
        "surface-container": "#edeeed",
        "surface-container-high": "#e7e8e7",
        "surface-container-highest": "#e2e3e2",
        "surface-variant": "#e2e3e2",
        "surface-tint": "#215eac",

        // ── Text & Outlines ─────────────────────────────────────
        "on-surface": "#191c1c",
        "on-surface-variant": "#424751",
        "outline": "#727782",
        "outline-variant": "#c2c6d3",

        // ── Misc ────────────────────────────────────────────────
        "background": "#f9f9f8",
        "on-background": "#191c1c",
        "inverse-surface": "#2e3131",
        "inverse-on-surface": "#f0f1f0",
      },
      borderRadius: {
        DEFAULT: "0.125rem",
        lg: "0.25rem",
        xl: "0.5rem",
        "2xl": "0.75rem",
        full: "9999px",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        headline: ["Inter", "sans-serif"],
        body: ["Inter", "sans-serif"],
        label: ["Inter", "sans-serif"],
      },
      fontSize: {
        "display-lg": ["3.5rem", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "display-md": ["2.75rem", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "headline-lg": ["2rem", { lineHeight: "1.2" }],
        "headline-md": ["1.75rem", { lineHeight: "1.2" }],
        "headline-sm": ["1.5rem", { lineHeight: "1.3", fontWeight: "600" }],
        "title-lg": ["1.125rem", { lineHeight: "1.4", fontWeight: "600" }],
        "title-md": ["1rem", { lineHeight: "1.4", fontWeight: "600" }],
        "title-sm": ["0.875rem", { lineHeight: "1.4", fontWeight: "600" }],
        "body-lg": ["1rem", { lineHeight: "1.6" }],
        "body-md": ["0.875rem", { lineHeight: "1.6" }],
        "body-sm": ["0.75rem", { lineHeight: "1.6" }],
        "label-lg": ["0.875rem", { lineHeight: "1.4", letterSpacing: "0.05em" }],
        "label-md": ["0.75rem", { lineHeight: "1.4", letterSpacing: "0.05em" }],
        "label-sm": ["0.625rem", { lineHeight: "1.4", letterSpacing: "0.05em" }],
      },
    },
  },
  plugins: [],
};

export default config;
