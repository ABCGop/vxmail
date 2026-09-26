/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        border: "var(--border)",
        card: "var(--card)",
        muted: "var(--muted)",
        accent: "var(--accent)",
        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
          subtle: "var(--primary-subtle)",
        },
        obsidian: {
          950: "#090d16",
          900: "#0f172a",
          850: "#1e293b",
          800: "#334155",
          750: "#475569",
          700: "#64748b",
        },
        vx: {
          blue: "#0284c7",
          sky: "#0ea5e9",
          cobalt: "#2563eb",
          indigo: "#4f46e5",
          violet: "#7c3aed",
          emerald: "#10b981",
          amber: "#f59e0b",
          rose: "#f43f5e",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "'Plus Jakarta Sans'", "system-ui", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "Roboto", "sans-serif"],
        mono: ["var(--font-mono)", "'JetBrains Mono'", "monospace"],
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.03)",
        card: "0 2px 8px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.02)",
        dropdown: "0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)",
        modal: "0 20px 40px -10px rgba(0, 0, 0, 0.12), 0 1px 3px 0 rgba(0, 0, 0, 0.05)",
      },
    },
  },
  plugins: [],
};
