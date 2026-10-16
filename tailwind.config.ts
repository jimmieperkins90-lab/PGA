import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        azalea: "#D6336C",
        fairway: "#0B5D3B",
        pine: "#07391F",
        sand: "#F4EBD0",
        paper: "#FBF8EE",
        ink: "#15231B",
        gold: "#C9A227",
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
