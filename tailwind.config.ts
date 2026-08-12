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
        canvas: "#F7F5F2",
        card: "#FFFFFF",
        border: "#E8E4DF",
        "border-input": "#DDD8D2",
        primary: "#242321",
        secondary: "#5F5B56",
        muted: "#8A857F",
        sage: {
          primary: "#6F8F7A",
          dark: "#4F6F5B",
          light: "#E8F0EA",
        },
        rose: {
          dusty: "#B78478",
        },
        warning: "#C49A5A",
        danger: "#B56F67",
      },
      boxShadow: {
        subtle: "0 2px 10px rgba(0, 0, 0, 0.04)",
      },
      borderRadius: {
        card: "16px",
        btn: "10px",
      },
    },
  },
  plugins: [],
};
export default config;
