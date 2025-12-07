import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { type Server } from "http";
import { fileURLToPath } from "url";

// Helper for __dirname in ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  // eslint-disable-next-line no-console
  console.log(`${formattedTime} [${source}] ${message}`);
}

// Store Vite server instance for reuse between middleware and catch-all setup
let viteServerInstance: Awaited<ReturnType<typeof import("vite").createServer>> | null = null;

/**
 * Setup Vite middleware (call this BEFORE routes)
 * This handles frontend asset transformation and HMR
 */
export async function setupViteMiddleware(app: Express, server: Server) {
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
    return;
  }

  let vite: typeof import("vite");
  try {
    vite = await import("vite");
  } catch (_e) {
    log("⚠️  Vite not installed, fallback to static serving.", "vite");
    serveStatic(app);
    return;
  }

  // Create Vite server instance (store for catch-all later)
  const clientRoot = path.resolve(__dirname, "../client");
  const configFile = path.resolve(clientRoot, "vite.config.ts");

  // Get the actual port from the server
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 5000;

  viteServerInstance = await vite.createServer({
    root: clientRoot,
    configFile: configFile,
    server: {
      middlewareMode: true,
      hmr: {
        server,
        port, // Use the actual server port for HMR
        protocol: 'ws',
        host: 'localhost',
      },
    },
  });

  // Static files in public folder served first
  const publicPath = path.resolve(__dirname, "../client/public");
  if (fs.existsSync(publicPath)) {
    app.use(express.static(publicPath));
    log("Serving static files from: " + publicPath, "vite");
  }

  // Vite middleware - handles frontend asset transformation
  // viteServerInstance.middlewares is a Connect middleware stack
  // We use it directly, and it will skip API routes naturally
  app.use(viteServerInstance.middlewares);
  log("✅ Vite middleware configured with HMR", "vite");
}

/**
 * Setup Vite SPA catch-all (call this AFTER routes)
 * This handles SPA routing for non-API routes
 */
export async function setupViteCatchAll(app: Express) {
  if (process.env.NODE_ENV === "production") {
    return; // Already handled by serveStatic
  }

  if (!viteServerInstance) {
    log("⚠️  Vite server instance not found. Call setupViteMiddleware first.", "vite");
    return;
  }

  // SPA catch-all - only for non-API routes
  app.use("*", async (req, res, next) => {
    if (req.originalUrl.startsWith("/api/")) return next();

    try {
      const indexPath = path.resolve(__dirname, "../client/index.html");
      let template = await fs.promises.readFile(indexPath, "utf-8");
      const html = await viteServerInstance!.transformIndexHtml(req.originalUrl, template);
      res.status(200).set({ "Content-Type": "text/html; charset=utf-8" }).end(html);
    } catch (err) {
      viteServerInstance!.ssrFixStacktrace(err instanceof Error ? err : new Error(String(err)));
      next(err);
    }
  });
  log("✅ Vite SPA catch-all configured", "vite");
}

/**
 * Complete Vite setup (backward compatibility)
 * Sets up both middleware and catch-all in one call
 */
export async function setupVite(app: Express, server: Server) {
  const isDev = process.env.NODE_ENV !== "production";

  if (isDev) {
    await setupViteMiddleware(app, server);
    // Note: Catch-all will be added separately after routes
  } else {
    serveStatic(app);
  }
}

export function serveStatic(app: Express) {
  // Prioritize built frontend
  const distPath = path.resolve(__dirname, "../dist/public");
  if (!fs.existsSync(distPath)) {
    log("⚠️  No build found in dist/public. Make sure to run `vite build`", "vite");
    app.use((req, res) => res.status(404).send("Not found"));
    return;
  }

  log(`Serving production build from: ${distPath}`, "vite");

  // Serve static files with proper MIME types
  app.use(express.static(distPath, {
    setHeaders: (res, filePath) => {
      const ext = path.extname(filePath);
      if (ext === ".js" || ext === ".mjs") {
        res.setHeader("Content-Type", "application/javascript; charset=utf-8");
      } else if (ext === ".css") {
        res.setHeader("Content-Type", "text/css; charset=utf-8");
      } else if (ext === ".wasm") {
        res.setHeader("Content-Type", "application/wasm");
      }
    },
  }));

  // SPA catch-all (exclude API and asset requests)
  app.use("*", (req, res, next) => {
    const url = req.originalUrl;

    // Skip API routes
    if (url.startsWith("/api/")) return next();

    // Skip asset requests (anything with a file extension or in /assets)
    const hasExtension = /\.[a-zA-Z0-9]+$/.test(url.split("?")[0]);
    if (hasExtension || url.startsWith("/assets/")) {
      return next(); // Let Express return 404 for missing assets
    }

    // Only serve index.html for non-asset, non-API routes
    const indexHtml = path.resolve(distPath, "index.html");
    if (fs.existsSync(indexHtml)) {
      // CRITICAL: Prevent HTML caching to ensure fresh asset references
      // This is especially important after OAuth redirects
      res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.sendFile(indexHtml);
    } else {
      res.status(404).send("Not found");
    }
  });
}
