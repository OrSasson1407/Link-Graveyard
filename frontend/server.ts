import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { createProxyMiddleware } from "http-proxy-middleware";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || "5173", 10);
const NESTJS_URL = process.env.NESTJS_INTERNAL_URL || process.env.VITE_API_BASE_URL || "http://localhost:3000";

app.use(express.json());

app.use(
  "/api",
  createProxyMiddleware({
    target: NESTJS_URL,
    changeOrigin: true,
    on: {
      error: (err, req, res) => {
        console.error("[Proxy error]", err.message);
        res.status(502).json({ error: "Backend unavailable", detail: err.message });
      },
    },
  })
);

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Link Graveyard] Frontend server at http://localhost:${PORT}`);
    console.log(`[Link Graveyard] Proxying /api -> ${NESTJS_URL}`);
  });
}

startServer();
