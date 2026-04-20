import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],

  // ─────────────────────────────────────────────
  // PATH ALIASES — import from anywhere cleanly
  // ─────────────────────────────────────────────
  resolve: {
    alias: {
      "@":           path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./components"),
      "@hooks":      path.resolve(__dirname, "./hooks"),
      "@utils":      path.resolve(__dirname, "./utils"),
    },
  },

  // ─────────────────────────────────────────────
  // DEV SERVER
  // ─────────────────────────────────────────────
  server: {
    port: 5173,
    strictPort: true, // fail fast instead of silently switching ports
    cors: true,

    // Proxy — no CORS issues in dev, all /api calls go to FastAPI
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        rewrite: (path) => path, // keep /api prefix as-is
      },
    },
  },

  // ─────────────────────────────────────────────
  // BUILD
  // ─────────────────────────────────────────────
  build: {
    outDir: "dist",
    sourcemap: false,
    minify: "esbuild",
    rollupOptions: {
      output: {
        // Split vendor chunks — faster repeat loads
        manualChunks: {
          react: ["react", "react-dom"],
          motion: ["framer-motion"],
          state: ["zustand"],
        },
      },
    },
  },

  // ─────────────────────────────────────────────
  // PREVIEW (vite preview)
  // ─────────────────────────────────────────────
  preview: {
    port: 4173,
    strictPort: true,
  },
});