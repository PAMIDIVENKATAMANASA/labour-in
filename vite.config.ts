import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        rewrite: (path) => path,
      },
    },
    watch: {
      // Ignore Django venv and other unnecessary directories
      ignored: [
        "**/django_project/venv/**",
        "**/venv/**",
        "**/node_modules/**",
        "**/.git/**",
        "**/__pycache__/**",
        "**/*.pyc",
        "**/db.sqlite3",
        "**/db.sqlite3-journal",
      ],
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
