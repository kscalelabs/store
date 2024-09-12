/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    fontFamily: {
      sans: ["Manrope", "sans-serif"],
      orbitron: ["Orbitron", "sans-serif"],
    },
    extend: {
      animation: {
        meteor: "meteor 5s linear infinite",
      },
      keyframes: {
        meteor: {
          "0%": {
            transform: "rotate(215deg) translateX(0)",
            opacity: "1",
          },
          "70%": {
            opacity: "1",
          },
          "100%": {
            transform: "rotate(215deg) translateX(-500px)",
            opacity: "0",
          },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        // Radix UI Gray Colorscale 1-12 (dark)
        gray: {
          1: "#111111",
          2: "#191919",
          3: "#222222",
          4: "#2A2A2A",
          5: "#313131",
          6: "#3A3A3A",
          7: "#484848",
          8: "#606060",
          9: "#6E6E6E",
          10: "#7B7B7B",
          11: "#B4B4B4",
          12: "#EEEEEE",
        },
        background: "#111111", // Dark background
        foreground: "#EEEEEE", // Light text
        card: {
          DEFAULT: "#191919",
          foreground: "#EEEEEE",
        },
        popover: {
          DEFAULT: "#191919",
          foreground: "#EEEEEE",
        },
        primary: {
          DEFAULT: "#EEEEEE",
          foreground: "#191919",
        },
        secondary: {
          DEFAULT: "#2A2A2A",
          foreground: "#EEEEEE",
        },
        muted: {
          DEFAULT: "#2A2A2A",
          foreground: "#A1A1AA",
        },
        accent: {
          DEFAULT: "#2A2A2A",
          foreground: "#EEEEEE",
        },
        destructive: {
          DEFAULT: "#7F1D1D",
          foreground: "#EEEEEE",
        },
        border: "#2A2A2A",
        input: "#2A2A2A",
        ring: "#D4D4D8",
        chart: {
          1: "rgb(59, 130, 246)",
          2: "rgb(16, 185, 129)",
          3: "rgb(251, 146, 60)",
          4: "rgb(147, 51, 234)",
          5: "rgb(236, 72, 153)",
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
