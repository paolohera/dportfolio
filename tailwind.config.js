/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#FFFFFF",
        "paper-alt": "#F1F0EA",
        "paper-dim": "#E7E5DC",
        ink: "#131313",
        "ink-soft": "#5C5A52",
        line: "#131313",
        accent: "#AAFF00",
        "accent-dark": "#88CC00",
        good: "#1F8A4C",
      },
      fontFamily: {
        display: ["var(--font-archivo)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        brutal: "4px 4px 0 0 #131313",
        "brutal-sm": "2px 2px 0 0 #131313",
        "brutal-lg": "7px 7px 0 0 #131313",
        "brutal-accent": "4px 4px 0 0 #AAFF00",
        "brutal-press": "1px 1px 0 0 #131313",
      },
      borderRadius: {
        none: "0px",
        DEFAULT: "0px",
      },
      keyframes: {
        "modal-in": {
          "0%": { opacity: 0, transform: "translateY(8px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        "toast-in": {
          "0%": { opacity: 0, transform: "translate(-50%, 8px)" },
          "100%": { opacity: 1, transform: "translate(-50%, 0)" },
        },
        blink: {
          "0%, 49%": { opacity: 1 },
          "50%, 100%": { opacity: 0 },
        },
      },
      animation: {
        "modal-in": "modal-in 180ms ease-out",
        "toast-in": "toast-in 180ms ease-out",
        blink: "blink 1.1s step-end infinite",
      },
    },
  },
  plugins: [],
};
