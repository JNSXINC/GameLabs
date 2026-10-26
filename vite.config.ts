import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  root: resolve(__dirname, "ui"),
  envDir: resolve(__dirname),
  base: "./",
  build: {
    outDir: resolve(__dirname, "dist/ui"),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
  },
});
