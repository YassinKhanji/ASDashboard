import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#1a2f3a", // Deep teal-blue
        "glass-surface": "rgba(255, 255, 255, 0.08)",
        "glass-surface-hover": "rgba(255, 255, 255, 0.12)",
        "glass-border": "rgba(255, 255, 255, 0.15)",
        "accent-yellow": "#f5c518",
        "accent-cyan": "#4db8ff",
        "accent-lime": "#a8e063",
        "text-primary": "#ffffff",
        "text-secondary": "rgba(255, 255, 255, 0.6)",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      borderRadius: {
        "3xl": "24px",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.15)",
      },
      spacing: {
        'card': '24px',
        'gap-card': '16px',
      }
    },
  },
  plugins: [],
};

export default config;
