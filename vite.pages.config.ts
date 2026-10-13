import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const workspace = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root: path.join(workspace, "pages"),
  base: "/life-in-uk-prep/",
  publicDir: path.join(workspace, "pages/public"),
  plugins: [tailwindcss(), viteReact()],
  resolve: {
    alias: {
      "@": path.join(workspace, "src"),
    },
  },
  build: {
    outDir: path.join(workspace, "docs"),
    emptyOutDir: true,
  },
  preview: {
    host: "127.0.0.1",
    port: 8099,
    strictPort: true,
  },
});
