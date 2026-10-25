import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const root = process.cwd();

function compiledEntry() {
  return {
    name: "compiled-entry",
    transformIndexHtml: {
      order: "pre",
      handler(html) {
        return html
          .replace(/\s*<link rel="stylesheet" href="\/assets\/app\.css"\s*\/?>/, "")
          .replace(
            '<script type="module" src="/assets/app.js"></script>',
            '<script type="module" src="/src/main.jsx"></script>',
          );
      },
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url || "").split("?")[0];
        if (!url.startsWith("/assets/")) return next();
        const file = path.join(root, decodeURIComponent(url));
        if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return next();
        res.setHeader("Content-Type", url.endsWith(".css") ? "text/css; charset=utf-8" : "text/javascript; charset=utf-8");
        fs.createReadStream(file).pipe(res);
      });
    },
  };
}

export default defineConfig({
  plugins: [compiledEntry(), react()],
  server: { port: 5173, host: "127.0.0.1" },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: "assets/app.js",
        chunkFileNames: "assets/[name].js",
        assetFileNames(info) {
          const name = info.names?.[0] || info.name || "";
          if (name.endsWith(".css")) return "assets/app.css";
          return "assets/[name][extname]";
        },
      },
    },
  },
});
