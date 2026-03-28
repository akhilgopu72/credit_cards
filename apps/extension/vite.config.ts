import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { copyFileSync, mkdirSync, existsSync, cpSync } from "fs";

function copyManifest() {
  return {
    name: "copy-manifest",
    closeBundle() {
      copyFileSync(
        resolve(__dirname, "manifest.json"),
        resolve(__dirname, "dist/manifest.json")
      );
      const iconsDir = resolve(__dirname, "icons");
      if (existsSync(iconsDir)) {
        const destIcons = resolve(__dirname, "dist/icons");
        mkdirSync(destIcons, { recursive: true });
        cpSync(iconsDir, destIcons, { recursive: true });
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), copyManifest()],
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "popup.html"),
        background: resolve(__dirname, "src/background/index.ts"),
        "content/amex-scraper": resolve(
          __dirname,
          "src/content/amex-scraper.ts"
        ),
        "content/chase-scraper": resolve(
          __dirname,
          "src/content/chase-scraper.ts"
        ),
        "content/capitalone-scraper": resolve(
          __dirname,
          "src/content/capitalone-scraper.ts"
        ),
        "content/checkout-overlay": resolve(
          __dirname,
          "src/content/checkout-overlay.ts"
        ),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name]-[hash].js",
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
