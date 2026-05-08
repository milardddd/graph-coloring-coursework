import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-montserrat)", "sans-serif"],
        display: ["var(--font-montserrat)", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      colors: {
        background: "var(--background)",
        card: "var(--card)",
        foreground: "var(--foreground)",
        primary: "var(--primary)",
        border: "var(--border)",
        accent: "var(--primary)",
        surface: "var(--card)",
        bg: "var(--background)",
        success: "#10b981",
        warn: "#a16207",
        danger: "#b42318",
        muted: "#6b7280",
        text: "var(--foreground)",
        "text-dim": "rgba(255, 255, 255, 0.6)",
        heading: "var(--foreground)",
      },
      // ... залишаємо твої анімації без змін
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;