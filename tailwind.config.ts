import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        clay: {
          bg: "#E4E0D6",
          surface: "#EDE9DE",
          deep: "#DAD5C8",
          line: "#C9C3B4",
        },
        ink: {
          DEFAULT: "#2A2620",
          soft: "#6E675A",
        },
        accent: {
          DEFAULT: "#47605C",
          light: "#5E7B76",
          dark: "#33453F",
        },
        warm: {
          DEFAULT: "#B8674A",
          dark: "#9A5138",
        },
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        "clay-raised":
          "8px 8px 16px rgba(154, 145, 122, 0.45), -8px -8px 16px rgba(255, 255, 255, 0.65)",
        "clay-raised-sm":
          "5px 5px 10px rgba(154, 145, 122, 0.4), -5px -5px 10px rgba(255, 255, 255, 0.6)",
        "clay-pressed":
          "inset 4px 4px 8px rgba(154, 145, 122, 0.45), inset -4px -4px 8px rgba(255, 255, 255, 0.5)",
        "clay-pressed-lg":
          "inset 6px 6px 14px rgba(154, 145, 122, 0.5), inset -6px -6px 14px rgba(255, 255, 255, 0.55)",
      },
      borderRadius: {
        clay: "28px",
        "clay-sm": "18px",
      },
      keyframes: {
        "modal-in": {
          "0%": { opacity: "0", transform: "scale(0.94) translateY(8px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        "toast-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "modal-in": "modal-in 0.28s cubic-bezier(0.22, 1, 0.36, 1)",
        "toast-in": "toast-in 0.25s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
