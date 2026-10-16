import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        azalea: "rgb(var(--c-azalea) / <alpha-value>)",
        fairway: "rgb(var(--c-fairway) / <alpha-value>)",
        pine: "rgb(var(--c-pine) / <alpha-value>)",
        sand: "rgb(var(--c-sand) / <alpha-value>)",
        paper: "rgb(var(--c-paper) / <alpha-value>)",
        ink: "rgb(var(--c-ink) / <alpha-value>)",
        gold: "rgb(var(--c-gold) / <alpha-value>)",
        trim: "rgb(var(--c-trim) / <alpha-value>)",
      },
      fontFamily: {
        display: ["var(--font-serif)", "serif"],
        body: ["var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
