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
        // Radix UI Gray Colorscale 1-12 (light)
        gray: {
          1: "#fcfcfc",
          2: "#f9f9f9",
          3: "#f0f0f0",
          4: "#e8e8e8",
          5: "#e0e0e0",
          6: "#d9d9d9",
          7: "#cecece",
          8: "#bbbbbb",
          9: "#8d8d8d",
          10: "#838383",
          11: "#646464",
          12: "#202020",
        },
        background: "var(--gray1)",
        foreground: "var(--gray12)",
        card: {
          DEFAULT: "var(--gray2)",
          foreground: "var(--gray12)",
        },
        popover: {
          DEFAULT: "var(--gray2)",
          foreground: "var(--gray11)",
        },
        primary: {
          DEFAULT: "var(--gray12)",
          foreground: "var(--gray1)",
        },
        secondary: {
          DEFAULT: "var(--gray4)",
          foreground: "var(--gray12)",
        },
        muted: {
          DEFAULT: "var(--gray3)",
          foreground: "var(--gray11)",
        },
        accent: {
          DEFAULT: "var(--gray4)",
          foreground: "var(--gray12)",
        },
        destructive: {
          DEFAULT: "#7F1D1D",
          foreground: "var(--gray1)",
        },
        border: "var(--gray6)",
        input: "var(--gray2)",
        ring: "var(--gray7)",
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
  base: {
    "html, body": {
      color: "var(--gray1)",
    },
  },
};
