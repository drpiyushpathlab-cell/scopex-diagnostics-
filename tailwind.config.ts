import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        scopex: {
          black: "#000000",
          orange: "#F37021",
          white: "#FFFFFF",
          gray: "#777777"
        }
      },
      boxShadow: {
        premium: "0 20px 60px rgba(243, 112, 33, 0.2)",
        glow: "0 0 0 1px rgba(243, 112, 33, 0.35), 0 0 24px rgba(243, 112, 33, 0.38)"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" }
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        float: "float 3s ease-in-out infinite",
        fadeIn: "fadeIn 0.5s ease-out forwards"
      }
    }
  },
  plugins: []
};

export default config;
