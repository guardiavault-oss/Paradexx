import express, { type Express, type Request, type Response, type NextFunction } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mime from "mime";

function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

/**
 * Serve static files from a built frontend directory with safe path handling,
 * correct Content-Type, optional precompressed files and caching.
 *
 * IMPORTANT:
 * - Call `serveStatic(app)` BEFORE registering API routes.
 * - Register your SPA fallback (serve index.html for non-asset routes) AFTER API routes.
 */
export function serveStatic(app: Express) {
  const root = process.cwd();
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const distDir = path.join(root, "dist", "public");

  const possiblePaths = [
    distDir,
    path.resolve(__dirname, "..", "dist", "public"),
    path.resolve(__dirname, "..", "dist"),
    path.join(root, "dist"),
  ];

  let distPath: string | null = null;
  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      const indexPath = path.join(possiblePath, "index.html");
      const assetsPath = path.join(possiblePath, "assets");
      if (fs.existsSync(indexPath) || fs.existsSync(assetsPath)) {
        distPath = possiblePath;
        break;
      }
    }
  }

  if (!distPath) {
    log(
      `No static build directory found at any of: ${possiblePaths.join(", ")}. Skipping static file serving.`,
      "static",
    );
    return;
  }

  log(`Serving static files from: ${distPath}`, "static");

  // Explicitly serve serviceWorker.js and manifest.json from root FIRST
  // These files must be at the root for PWA registration
  // Register these routes BEFORE express.static to ensure they're handled first
  app.get("/serviceWorker.js", (req: Request, res: Response) => {
    const serviceWorkerPath = path.join(distPath, "serviceWorker.js");
    
    // Try multiple possible source paths (for development or if build didn't copy it)
    const possibleSourcePaths = [
      path.resolve(__dirname, "../client/public/serviceWorker.js"), // Development
      path.resolve(root, "client/public/serviceWorker.js"), // Alternative
      path.join(process.cwd(), "client/public/serviceWorker.js"), // Current working directory
      path.resolve(__dirname, "../../client/public/serviceWorker.js"), // Docker build context
    ];
    
    // Try build output first
    if (fs.existsSync(serviceWorkerPath)) {
      res.setHeader("Content-Type", "application/javascript; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=0, must-revalidate"); // No cache for service worker
      return res.sendFile(serviceWorkerPath);
    }
    
    // Fallback to source directory (for development or if build didn't copy it)
    for (const sourcePath of possibleSourcePaths) {
      if (fs.existsSync(sourcePath)) {
        log(`Service worker not in build, serving from source: ${sourcePath}`, "static");
        
        // Try to copy it to the build directory for future requests
        try {
          const destDir = path.dirname(serviceWorkerPath);
          if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
          }
          fs.copyFileSync(sourcePath, serviceWorkerPath);
          log(`Copied service worker to build directory: ${serviceWorkerPath}`, "static");
        } catch (copyError) {
          // Ignore copy errors, just serve from source
          log(`Could not copy service worker: ${String(copyError)}`, "static");
        }
        
        res.setHeader("Content-Type", "application/javascript; charset=utf-8");
        res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
        return res.sendFile(sourcePath);
      }
    }
    
    // Log for debugging
    log(`Service worker not found at: ${serviceWorkerPath}`, "static");
    log(`Tried source paths: ${possibleSourcePaths.join(", ")}`, "static");
    log(`Dist path contents: ${fs.existsSync(distPath) ? fs.readdirSync(distPath).join(", ") : "distPath does not exist"}`, "static");
    res.status(404).json({ error: "Service worker not found", path: serviceWorkerPath });
  });

  app.get("/manifest.json", (req: Request, res: Response) => {
    const manifestPath = path.join(distPath, "manifest.json");
    if (fs.existsSync(manifestPath)) {
      res.setHeader("Content-Type", "application/manifest+json; charset=utf-8");
      return res.sendFile(manifestPath);
    }
    log(`Manifest not found at: ${manifestPath}`, "static");
    res.status(404).json({ error: "Manifest not found", path: manifestPath });
  });

  // Use express.static for root directory to serve files like serviceWorker.js and manifest.json
  // This serves files from dist/public at the root path
  app.use(express.static(distPath, {
    setHeaders: (res, filePath) => {
      const fileName = path.basename(filePath);
      // Service worker should not be cached
      if (fileName === "serviceWorker.js") {
        res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
        res.setHeader("Content-Type", "application/javascript; charset=utf-8");
      } else if (fileName === "manifest.json") {
        res.setHeader("Content-Type", "application/manifest+json; charset=utf-8");
      } else if (fileName === "index.html") {
        // HTML should not be cached aggressively - always fetch fresh to get latest asset references
        res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
        res.setHeader("Content-Type", "text/html; charset=utf-8");
      }
    },
  }));

  // Then use express.static for /assets/ directory - this handles MIME types correctly
  // This ensures assets are served with correct Content-Type before any custom middleware
  app.use("/assets", express.static(path.join(distPath, "assets"), {
    setHeaders: (res, filePath) => {
      const ext = path.extname(filePath);
      if (ext === ".js" || ext === ".mjs") {
        res.setHeader("Content-Type", "application/javascript; charset=utf-8");
      } else if (ext === ".css") {
        res.setHeader("Content-Type", "text/css; charset=utf-8");
      } else if (ext === ".wasm") {
        res.setHeader("Content-Type", "application/wasm");
      }
      // Cache fingerprinted assets
      const fileName = path.basename(filePath);
      const fingerprinted = /[._-][0-9a-fA-F]{8,}\./.test(fileName);
      if (fingerprinted) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      }
    },
  }));

  // Register middleware with explicit path to ensure it runs early
  app.use((req: Request, res: Response, next: NextFunction) => {
    try {
      // Only handle GET/HEAD for static assets
      if (!["GET", "HEAD"].includes(req.method)) return next();

      // Use originalUrl or url to get the full path, then extract pathname
      const fullUrl = req.originalUrl || req.url || "";
      const urlPathname = fullUrl.split("?")[0].split("#")[0];
      
      // Early detection: if this looks like an asset request, we MUST handle it here
      const looksLikeAsset = urlPathname.startsWith("/assets/") || 
                             urlPathname.startsWith("/static/") ||
                             /\.[a-zA-Z0-9]+$/.test(urlPathname.split("?")[0]);
      
      // Normalize and prevent path traversal.
      // NOTE: decodeURIComponent can throw on malformed URIs so wrap it.
      let urlPath: string;
      try {
        urlPath = decodeURIComponent(urlPathname);
      } catch (_err) {
        log(`Malformed URL path: ${urlPathname}`, "static");
        // If it looks like an asset, return 404 instead of passing through
        if (looksLikeAsset) {
          res.status(404).setHeader("Content-Type", "application/json");
          return res.json({ error: "Malformed asset request" });
        }
        return next();
      }

      // If path ends with '/', treat as directory (do not auto-serve index here; SPA fallback should handle)
      if (urlPath.endsWith("/")) {
        // But if it's an asset directory request, return 404
        if (looksLikeAsset) {
          res.status(404).setHeader("Content-Type", "application/json");
          return res.json({ error: "Asset directory not found" });
        }
        return next();
      }

      // Remove leading slash for path.join (path.join ignores base if second arg starts with /)
      const relativePath = urlPath.startsWith("/") ? urlPath.slice(1) : urlPath;

      // Resolve candidate file path relative to distPath
      const candidate = path.join(distPath, relativePath);

      // Ensure the resolved path is inside distPath (avoid ../ trick)
      const normalized = path.normalize(candidate);
      if (!normalized.startsWith(path.normalize(distPath + path.sep))) {
        log(`Path traversal attempt blocked: ${urlPath}`, "static");
        return res.status(400).end();
      }

      // If file exists, serve it. Prefer precompressed variants if client accepts them.
      if (fs.existsSync(normalized) && fs.statSync(normalized).isFile()) {
        // choose precompressed if available and accepted
        const acceptEnc = String(req.header("accept-encoding") || "");
        let fileToServe = normalized;
        let contentEncoding: string | undefined;

        // Prefer Brotli, then gzip (only for appropriate file types)
        if (acceptEnc.includes("br")) {
          const brPath = normalized + ".br";
          if (fs.existsSync(brPath) && fs.statSync(brPath).isFile()) {
            fileToServe = brPath;
            contentEncoding = "br";
          }
        }
        if (!contentEncoding && acceptEnc.includes("gzip")) {
          const gzPath = normalized + ".gz";
          if (fs.existsSync(gzPath) && fs.statSync(gzPath).isFile()) {
            fileToServe = gzPath;
            contentEncoding = "gzip";
          }
        }

        // Determine proper MIME (if serving precompressed file, derive the MIME from original file)
        const origExt = path.extname(normalized);
        let contentType = mime.getType(origExt) || "application/octet-stream";

        // Force certain types for safety (module vs classic)
        if (origExt === ".js" || origExt === ".mjs") {
          contentType = "application/javascript; charset=utf-8";
        } else if (origExt === ".css") {
          contentType = "text/css; charset=utf-8";
        } else if (origExt === ".wasm") {
          contentType = "application/wasm";
        } else if (origExt === ".json") {
          contentType = "application/json; charset=utf-8";
        } else if (origExt === ".map") {
          contentType = "application/json; charset=utf-8";
        }

        // Set headers
        res.setHeader("Content-Type", contentType);
        if (contentEncoding) res.setHeader("Content-Encoding", contentEncoding);

        // Caching:
        // - If filename looks fingerprinted (contains a hash/fingerprint), serve long immutable cache.
        //   Common heuristic: filename contains a hex hash of length >= 8.
        const fileName = path.basename(normalized);
        const fingerprinted = /[._-][0-9a-fA-F]{8,}\./.test(fileName);
        if (fingerprinted) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        } else {
          res.setHeader("Cache-Control", "public, max-age=60, s-maxage=60");
        }

        // Let Express handle conditional requests & range requests with sendFile
        return res.sendFile(fileToServe, { headers: { "X-Served-By": "express-static-safe" } }, (err) => {
          if (err) {
            // sendFile already attempted; if it errs, let next handler decide
            log(`sendFile error for ${fileToServe}: ${String(err)}`, "static");
            return next();
          }
        });
      }

      // Not present on disk -> don't return index.html here. Let API routing / SPA fallback handle it.
      // For asset requests that don't exist, return 404 immediately to prevent SPA fallback from serving HTML
      if (looksLikeAsset) {
        log(`Asset not found on disk: ${urlPath} (searched at: ${normalized})`, "static");
        // Return 404 for asset requests to prevent SPA fallback from serving HTML
        res.status(404).setHeader("Content-Type", "application/json");
        return res.json({ error: "Asset not found", path: urlPath });
      }
      return next();
    } catch (err) {
      log(`Static middleware failure: ${String(err)}`, "static");
      return next();
    }
  });
}

