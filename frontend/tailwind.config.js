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
        // compliments international orange primary color palette
        gray: {
          1: "#fcfcfd",
          2: "#f9f9fb",
          3: "#eff0f3",
          4: "#e7e8ec",
          5: "#e0e1e6",
          6: "#d8d9e0",
          7: "#cdced7",
          8: "#b9bbc6",
          9: "#8b8d98",
          10: "#80828d",
          11: "#62636c",
          12: "#1e1f24",
        },
        // Radix UI International Orange Colorscale 1-12 (light)
        primary: {
          1: "#fefcfb",
          2: "#fff5f1",
          3: "#ffe8de",
          4: "#ffd7c7",
          5: "#ffc9b4",
          6: "#ffb89f",
          7: "#ffa284",
          8: "#fb8765",
          9: "#ff4f00",
          10: "#f14000",
          11: "#de3500",
          12: "#5d291a",
          DEFAULT: "#ff4f00",
          foreground: "#5d291a",
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
