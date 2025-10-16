import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1f2937",
          foreground: "#f9fafb"
        },
        accent: {
          DEFAULT: "#2563eb",
          foreground: "#f8fafc"
        }
      }
    }
  },
  plugins: []
};

export default config;
