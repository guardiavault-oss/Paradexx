// server.ts
// Entrypoint - hardened and production-ready version of your startup script

// IMMEDIATE LOGGING - Before any imports to help debug startup issues
console.log("🚀 [STARTUP] Server process starting...");
console.log("🚀 [STARTUP] Node version:", process.version);
console.log("🚀 [STARTUP] NODE_ENV:", process.env.NODE_ENV || "not set");
console.log("🚀 [STARTUP] PORT:", process.env.PORT || "not set (will use 5000)");
console.log("🚀 [STARTUP] HOST:", process.env.HOST || "not set");
console.log("🚀 [STARTUP] DATABASE_URL:", process.env.DATABASE_URL ? "✅ set" : "❌ not set");
console.log("🚀 [STARTUP] SESSION_SECRET:", process.env.SESSION_SECRET ? "✅ set" : "❌ not set");
console.log("🚀 [STARTUP] WIZARD_ENCRYPTION_KEY:", process.env.WIZARD_ENCRYPTION_KEY ? "✅ set" : "❌ not set");
console.log("🚀 [STARTUP] ENCRYPTION_KEY:", process.env.ENCRYPTION_KEY ? "✅ set" : "❌ not set");
console.log("🚀 [STARTUP] SSN_SALT:", process.env.SSN_SALT ? "✅ set" : "❌ not set");
console.log("🚀 [STARTUP] Loading dependencies...");
// Force flush stdout for some hosts (no-op in many envs)
if (process.stdout.isTTY) process.stdout.write("");

// Lightweight logger used before real logger available
function earlyLog(...args: unknown[]) {
  // keep simple, avoid JSON heavy formatting here
  console.log(new Date().toISOString(), ...args);
}

import "dotenv/config";
import "./types";
import express, { type Request, type Response, type NextFunction } from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import dns from "dns";

// Configure DNS to use public DNS servers as fallback for Railway
// Railway's internal DNS (fd12::10) may not resolve external domains
try {
  const PUBLIC_DNS_SERVERS = ["8.8.8.8", "8.8.4.4", "1.1.1.1"];
  const currentServers = dns.getServers();
  // Add public DNS servers to the list (they'll be tried first)
  if (!currentServers.some(server => PUBLIC_DNS_SERVERS.includes(server))) {
    dns.setServers([...PUBLIC_DNS_SERVERS, ...currentServers]);
    earlyLog("✅ [DNS] Configured public DNS servers as fallback:", PUBLIC_DNS_SERVERS);
  }
} catch (error) {
  earlyLog("⚠️  [DNS] Failed to configure public DNS servers:", error);
}

// NOTE: many heavy services are dynamically imported later (Sentry, db, storage, jobs)
// This keeps startup fast and avoids bundling dev-only modules in prod builds.

earlyLog("✅ [STARTUP] Dependencies loaded");

process.on('unhandledRejection', (reason: unknown) => {
  // Use console until proper logger initialized
  const msg = reason instanceof Error ? reason.stack ?? reason.message : String(reason);
  earlyLog("[unhandledRejection]", msg);
  // We'll attempt to capture with Sentry if available (non-blocking)
  (async () => {
    try {
      const { captureException } = await import("./services/errorTracking");
      if (typeof captureException === "function") {
        captureException(reason instanceof Error ? reason : new Error(String(reason)), { context: "unhandledRejection" }).catch(() => {});
      }
    } catch {}
  })();
});

// Graceful shutdown logic (used by SIGINT, SIGTERM, uncaughtException flow)
let server: import("http").Server | null = null;
let isShuttingDown = false;

async function gracefulShutdown(reason = "SIGTERM") {
  if (isShuttingDown) return;
  isShuttingDown = true;
  earlyLog("🛑 [SHUTDOWN] Initiating graceful shutdown:", reason);

  // Stop accepting new connections and give inflight requests time to finish
  try {
    if (server && typeof server.close === "function") {
      await new Promise<void>((resolve) => {
        server!.close((err?: Error) => {
          if (err) earlyLog("[SHUTDOWN] server.close error:", err);
          resolve();
        });
        // Force shutdown after 10s
        setTimeout(() => {
          earlyLog("[SHUTDOWN] Forcing shutdown after timeout");
          resolve();
        }, 10_000);
      });
    }
  } catch (err) {
    earlyLog("[SHUTDOWN] Error closing HTTP server:", err);
  }

  // Try to close DB, Redis, and background jobs if they expose close functions
  try {
    const maybeDb = await Promise.resolve().then(() => import("./db")).catch(() => null);
    if (maybeDb && typeof maybeDb.closeDatabase === "function") {
      await maybeDb.closeDatabase().catch((e: Error) => earlyLog("[SHUTDOWN] closeDatabase error:", e));
      earlyLog("[SHUTDOWN] Database closed");
    }
  } catch (err) {
    earlyLog("[SHUTDOWN] Error closing DB:", err);
  }

  try {
    const maybeRedisMod = await Promise.resolve().then(() => import("./services/redisClient")).catch(() => null);
    if (maybeRedisMod && typeof maybeRedisMod.closeRedis === "function") {
      await maybeRedisMod.closeRedis().catch((e: Error) => earlyLog("[SHUTDOWN] closeRedis error:", e));
      earlyLog("[SHUTDOWN] Redis closed");
    }
  } catch (err) {
    earlyLog("[SHUTDOWN] Error closing Redis:", err);
  }

  // Allow any logging flush (if logger supports flush)
  try {
    const maybeLogger = await Promise.resolve().then(() => import("./services/logger")).catch(() => null);
    if (maybeLogger && typeof maybeLogger.flush === "function") {
      await maybeLogger.flush().catch(() => {});
    }
  } catch {}

  earlyLog("🛑 [SHUTDOWN] Complete. Exiting process.");
  // Prefer exit code 0 for graceful; non-zero if called by exception path
  process.exit(reason === "uncaughtException" ? 1 : 0);
}

// Uncaught exceptions - attempt to capture and then graceful shutdown
process.on("uncaughtException", (error: Error) => {
  earlyLog("❌ [UNCAUGHT_EXCEPTION] ", error.stack ?? error.message);
  (async () => {
    try {
      const { captureException } = await import("./services/errorTracking").catch(() => ({ captureException: undefined }));
      if (typeof captureException === "function") {
        await captureException(error, { context: "uncaughtException" }).catch(() => {});
      }
    } catch {}
    // Attempt graceful shutdown then exit
    await gracefulShutdown("uncaughtException");
  })();
});

// Type augmentation for rawBody
declare module 'http' {
  interface IncomingMessage {
    rawBody?: unknown;
  }
}

(async () => {
  try {
    earlyLog("🚀 [INIT] Starting server initialization...");

    // Validate environment (non-blocking decision: start server for liveness, optionally exit if validation fails)
    let envValidationPassed = false;
    try {
      const { validateEnvironment } = await import("./config/validateEnv");
      validateEnvironment();
      envValidationPassed = true;
      const { logInfo } = await import("./services/logger").catch(() => ({ logInfo: (msg: any) => earlyLog(msg) }));
      logInfo?.("Environment validation passed - all required secrets are set");
    } catch (err) {
      earlyLog("❌ [ENV] Validation failed:", err instanceof Error ? err.message : String(err));
      // We'll continue to start the server to satisfy platform liveness, but schedule an exit after a configurable delay
    }

    const app = express();

    // trust proxy if behind a proxy (essential so cookie.secure and req.ip behave)
    // Always enable in production or when explicitly set
    // This is critical for OAuth cookies to work correctly
    if (process.env.TRUST_PROXY === "1" || process.env.NODE_ENV === "production" || process.env.FORCE_HTTPS === "true") {
      app.set("trust proxy", 1);
      earlyLog("➡️ [CONFIG] Express trust proxy enabled (required for OAuth cookies)");
    }

    // Liveness endpoint - always 200 (platforms like Railway only need any response)
    app.get("/health", (_req, res) => {
      res.setHeader("Content-Type", "text/plain");
      res.status(200).send("ok");
    });

    // Readiness endpoint - returns 503 if DB is not connected (useful for load balancers)
    app.get("/ready", async (_req, res) => {
      try {
        const { getDatabaseHealth } = await import("./db");
        const dbHealth = await getDatabaseHealth();
        if (dbHealth?.connected) {
          return res.status(200).json({ status: "ready" });
        } else {
          return res.status(503).json({ status: "not_ready", database: dbHealth || { connected: false } });
        }
      } catch (err) {
        return res.status(503).json({ status: "not_ready", error: String(err) });
      }
    });

    // Root route removed - Vite will handle "/" and serve the frontend SPA
    // API health check moved to /api/health instead

    // Debug endpoint to check environment variables (development only)
    if (process.env.NODE_ENV !== "production") {
      app.get("/api/debug/env", (_req, res) => {
        res.json({
          GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? "✅ SET" : "❌ NOT SET",
          GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? "✅ SET" : "❌ NOT SET",
          GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || "Using default",
          allGoogleVars: Object.keys(process.env).filter(k => k.includes("GOOGLE")),
        });
      });

      // SendGrid test endpoint - Send your first email
      app.post("/api/test/sendgrid", async (_req, res) => {
        try {
          const { sendEmail } = await import("./services/email");
          const { to } = _req.body;
          const testEmail = to || process.env.TEST_EMAIL || "test@example.com";

          const result = await sendEmail(
            testEmail,
            "Hello from GuardiaVault!",
            "Hello from GuardiaVault!\n\nThis is a test email sent via SendGrid.",
            "<h1>Hello from GuardiaVault!</h1><p>This is a test email sent via SendGrid.</p>"
          );

          if (result.ok) {
            res.json({
              success: true,
              message: "Email sent successfully!",
              messageId: result.id,
              simulated: result.simulated,
            });
          } else {
            res.status(500).json({
              success: false,
              message: "Failed to send email",
              error: result.error,
            });
          }
        } catch (error: any) {
          const { logError } = await import("./services/logger");
          logError(error, { context: "sendgrid_test" });
          res.status(500).json({
            success: false,
            message: "Error sending email",
            error: error.message,
          });
        }
      });
    }

    // Start HTTP server early so health checks pass
    const http = await import("http");
    const port = parseInt(process.env.PORT || "5000", 10);
    const host = process.env.HOST || (process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost");

    server = http.createServer(app);

    // Listen and wait until listening before continuing
    await new Promise<void>((resolve, reject) => {
      server!.once("error", (err: NodeJS.ErrnoException) => {
        earlyLog("[SERVER] listen error:", err);
        reject(err);
      });
      server!.listen(port, host, () => {
        earlyLog(`✅ [SERVER] Listening on ${host}:${port} (env=${process.env.NODE_ENV || "dev"})`);
        resolve();
      });
    });

    // If env validation failed earlier, schedule an exit after ENV_EXIT_DELAY_MS (configurable)
    if (!envValidationPassed) {
      const ENV_EXIT_DELAY_MS = Math.max(1000, parseInt(process.env.ENV_EXIT_DELAY_MS || "5000", 10));
      earlyLog(`⚠️ [ENV] Validation failed earlier; will exit after ${ENV_EXIT_DELAY_MS}ms to allow platform liveness probe`);
      setTimeout(() => {
        earlyLog("❌ [ENV] Exiting due to failed environment validation");
        // Attempt graceful shutdown to let platform mark instance unhealthy
        void gracefulShutdown("envValidationFailed");
      }, ENV_EXIT_DELAY_MS);
    }

    // Background: initialize Sentry, logger, and connect optional services but do not block readiness
    (async () => {
      try {
        const { initSentry, getSentryRequestHandler, getSentryErrorHandler } = await import("./services/errorTracking").catch(() => ({
          initSentry: undefined,
          getSentryRequestHandler: undefined,
          getSentryErrorHandler: undefined,
        }));
        if (typeof initSentry === "function") {
          await initSentry();
          earlyLog("✅ [SENTRY] Initialized");
        }

        // attach Sentry request handler if available (before other middleware)
        if (typeof getSentryRequestHandler === "function") {
          const sentryReq = await getSentryRequestHandler();
          if (sentryReq) app.use(sentryReq);
        }
      } catch (err) {
        earlyLog("[SENTRY] init failed:", err);
      }
    })().catch(() => {});

    // Performance monitoring middleware (non-blocking import)
    try {
      const { performanceMiddleware } = await import("./services/monitoring").catch(() => ({ performanceMiddleware: undefined }));
      if (performanceMiddleware) app.use(performanceMiddleware);
    } catch (err) {
      earlyLog("[MONITOR] Failed to attach performance middleware:", err);
    }

    // Generate nonces and CSP middleware (dynamic)
    try {
      const { nonceMiddleware, getCSPMiddleware } = await import("./middleware/csp").catch(() => ({ nonceMiddleware: undefined, getCSPMiddleware: undefined }));
      if (nonceMiddleware) app.use(nonceMiddleware);
      if (getCSPMiddleware) {
        try {
          const cspMiddleware = getCSPMiddleware();
          app.use(cspMiddleware);
        } catch (err) {
          earlyLog("[CSP] Failed to create CSP middleware, continuing without it:", err);
        }
      }
    } catch (err) {
      earlyLog("[CSP] Failed to attach CSP middleware:", err);
    }

    // Helmet with CSP disabled because we use custom CSP above
    try {
      const helmet = (await import("helmet")).default;
      app.use(helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
        crossOriginOpenerPolicy: false,
        xContentTypeOptions: true,
        xXssProtection: false,
      }));
    } catch (err) {
      earlyLog("[HELMET] failed to attach helmet:", err);
    }

    // Ensure HTML responses include charset (lightweight)
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.path.endsWith(".html") || req.path === "/") {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
      }
      next();
    });

    // Compression middleware
    try {
      const compression = (await import("compression")).default;
      app.use(compression({
        level: 6,
        threshold: 1024,
        filter: (req, res) => {
          const contentType = String(res.getHeader("content-type") || "");
          const compressibleTypes = [
            "application/json", "application/javascript", "application/xml",
            "text/html", "text/css", "text/javascript", "text/plain", "image/svg+xml"
          ];
          const nonCompressibleTypes = ["image/", "font/", "application/octet-stream", "application/pdf", "video/", "audio/"];
          const shouldCompress = compressibleTypes.some(type => contentType.includes(type));
          const shouldNotCompress = nonCompressibleTypes.some(type => contentType.includes(type));
          // fallback to default filter if content-type unknown
          if (!contentType) return compression.filter(req, res);
          return shouldCompress && !shouldNotCompress;
        }
      }));
    } catch (err) {
      earlyLog("[COMPRESSION] not enabled:", err);
    }

    // Basic CORS handling (lightweight, origin validation)
    // Mobile apps (React Native/Expo) may not send Origin header, so we allow requests without origin
    app.use((req, res, next) => {
      const origin = req.headers.origin;
      const allowedOrigins = [
        process.env.APP_URL || "http://localhost:5000",
        "http://localhost:5000",
        "http://localhost:5173",
        ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : []),
      ];

      // Allow requests from allowed origins, or requests without origin (mobile apps)
      if (origin && allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
      } else if (!origin) {
        // Mobile apps (React Native/Expo) typically don't send Origin header
        // Allow these requests in development, or if explicitly configured
        if (process.env.NODE_ENV === "development" || process.env.ALLOW_MOBILE_REQUESTS === "true") {
          res.setHeader("Access-Control-Allow-Origin", "*");
        }
      }

      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
      if (req.method === "OPTIONS") return res.sendStatus(200);
      next();
    });

    // Attach cookie parser and body parsers
    app.use(cookieParser());
    app.use(express.json({
      verify: (req, _res, buf) => { (req as any).rawBody = buf; }
    }));
    app.use(express.urlencoded({ extended: false }));

    // Rate limiting - dynamic import to avoid bundling always
    try {
      const rateLimitMod = await import("express-rate-limit");
      const rateLimit = (rateLimitMod && (rateLimitMod as any).default) || (rateLimitMod as any);
      const limiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: "Too many requests from this IP, please try again later.",
        standardHeaders: true,
        legacyHeaders: false,
        skip: (req: Request) => req.path === "/health" || req.path === "/ready"
      });
      const authLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 10,
        message: "Too many authentication attempts, please try again later.",
        skipSuccessfulRequests: true,
      });
      app.use("/api/", limiter);
      app.use("/api/auth/", authLimiter);
    } catch (err) {
      earlyLog("[RATELIMIT] not configured:", err);
    }

    // Security middleware placeholders (sanitizers, csrf, session refresh)
    try {
      const { csrfToken, validateCSRF } = await import("./middleware/csrf").catch(() => ({ csrfToken: undefined, validateCSRF: undefined }));
      if (csrfToken) app.use(csrfToken);
      // We'll attach validateCSRF on /api/ after sanitizers below
    } catch {}

    // Placeholder logger service (structured logs)
    let logInfo = (msg: any, meta?: any) => earlyLog("[INFO]", msg, meta || "");
    let logError = (err: any, meta?: any) => earlyLog("[ERROR]", err && err.stack ? err.stack : err, meta || "");
    let logWarn = (msg: any, meta?: any) => earlyLog("[WARN]", msg, meta || "");

    try {
      const logger = await import("./services/logger").catch(() => null);
      if (logger) {
        logInfo = logger.logInfo || logInfo;
        logError = logger.logError || logError;
        logWarn = logger.logWarn || logWarn;
      }
    } catch {}

    // Session configuration with optional Redis store
    try {
      const sessionSecret = (await import("./config/validateEnv")).getRequiredEnv
        ? (await import("./config/validateEnv")).getRequiredEnv("SESSION_SECRET")
        : process.env.SESSION_SECRET || "";

      // Determine if we're using HTTPS (required for OAuth cookies with sameSite: "none")
      // Check multiple indicators: NODE_ENV, TRUST_PROXY, or explicit HTTPS env var
      // Railway and most production platforms use HTTPS, so default to true in production
      const isHTTPS =
        process.env.NODE_ENV === "production" ||
        process.env.FORCE_HTTPS === "true" ||
        process.env.TRUST_PROXY === "1" ||
        process.env.RAILWAY_ENVIRONMENT === "production";

      const sessionOptions: session.SessionOptions = {
        secret: sessionSecret,
        resave: false,
        saveUninitialized: false,
        name: "guardiavault.sid", // Custom session name
        cookie: {
          // For OAuth to work across domains (Google redirect), we need sameSite: "none" and secure: true
          // "none" allows cookies to be sent on cross-site requests (required for OAuth)
          // "secure: true" is required when sameSite is "none" (HTTPS only)
          secure: isHTTPS, // HTTPS only when in production or behind proxy (required for sameSite: "none")
          httpOnly: true,
          sameSite: isHTTPS ? "none" : "lax", // "none" for cross-site OAuth when HTTPS, "lax" for dev
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          path: "/", // Ensure cookie is available for all paths
          // Don't set domain explicitly - let it default to the current domain
          // This ensures cookies work correctly with Railway's domain
        },
      };

      if (process.env.REDIS_URL) {
        try {
          const { getRedisClient } = await import("./services/redisClient");
          const redisClient = await getRedisClient();

          if (redisClient) {
            const connectRedis = (await import("connect-redis")).default;
            const RedisStore = connectRedis(session as any);
            sessionOptions.store = new RedisStore({ client: redisClient, prefix: "sess:" });
            earlyLog("[SESSION] Using Redis session store");
          } else {
            earlyLog("[SESSION] Redis client unavailable, falling back to in-memory store");
            if (process.env.NODE_ENV === "production") {
              earlyLog("⚠️ [SESSION] Using in-memory session store in production is not recommended!");
            }
          }
        } catch (err) {
          earlyLog("[SESSION] Redis session store unavailable:", err);
          if (process.env.NODE_ENV === "production") {
            earlyLog("⚠️ [SESSION] Using in-memory session store in production is not recommended!");
          }
        }
      } else {
        if (process.env.NODE_ENV === "production") {
          earlyLog("⚠️ [SESSION] Using in-memory session store in production is not recommended!");
          earlyLog("⚠️ [SESSION] Set REDIS_URL environment variable to use Redis session store");
        }
      }

      app.use(session(sessionOptions));
    } catch (err) {
      earlyLog("[SESSION] configuration error:", err);
    }

    // Security / App middleware
    try {
      const { refreshSession, checkSessionExpiry } = await import("./middleware/sessionRefresh").catch(() => ({ refreshSession: undefined, checkSessionExpiry: undefined }));
      if (refreshSession) app.use(refreshSession);
      if (checkSessionExpiry) app.use(checkSessionExpiry);
    } catch (err) {
      earlyLog("[MIDDLEWARE] session refresh not available:", err);
    }

    try {
      const { sanitizeRequestBody } = await import("./middleware/validation").catch(() => ({ sanitizeRequestBody: undefined }));
      if (sanitizeRequestBody) app.use(sanitizeRequestBody);
      // Attach HTML sanitizer to specific routes as in original
      try {
        const { sanitizeHTMLBody } = await import("./middleware/htmlSanitizer").catch(() => ({ sanitizeHTMLBody: undefined }));
        if (sanitizeHTMLBody) {
          app.use("/api/parties/:partyId/message", sanitizeHTMLBody);
          app.use("/api/vaults/:vaultId/legacy-messages", sanitizeHTMLBody);
        }
      } catch {}
    } catch (err) {
      earlyLog("[MIDDLEWARE] validation not available:", err);
    }

    // CSRF validation for api routes (attach if available)
    try {
      const { validateCSRF } = await import("./middleware/csrf").catch(() => ({ validateCSRF: undefined }));
      if (validateCSRF) app.use("/api/", validateCSRF);
    } catch {}

    // Request logging
    try {
      const { requestLogger } = await import("./services/logger").catch(() => ({ requestLogger: undefined }));
      if (requestLogger && typeof requestLogger === "function") app.use(requestLogger());
    } catch {}

    // Register application routes FIRST (before Vite middleware)
    try {
      const { registerRoutes } = await import("./routes");
      const result = await registerRoutes(app, server);
      earlyLog("[ROUTES] Routes registered successfully");
      earlyLog(`[ROUTES] Server instance: ${result ? 'created' : 'existing'}`);
    } catch (err) {
      earlyLog("[ROUTES] ERROR during route registration:");
      earlyLog(err instanceof Error ? err.stack : String(err));
      logError(err, { context: "route_registration" });
      logWarn("Server will continue running but some routes may not be available");
    }

    // DEV: Vite middleware setup (after routes to avoid conflicts)
    // Production: static file serving
    if (process.env.NODE_ENV === "production") {
      try {
        const { serveStatic } = await import("./static");
        if (typeof serveStatic === "function") {
          serveStatic(app);
          earlyLog("[STATIC] Static file serving configured (production)");
        }
      } catch (err) {
        earlyLog("[STATIC] Failed to configure static serving:", err);
      }
    } else {
      // Development: Setup Vite middleware after routes
      // Note: The SPA catch-all will be added after routes
      try {
        const viteModule = await import("./vite");
        if (viteModule && typeof viteModule.setupViteMiddleware === "function") {
          await viteModule.setupViteMiddleware(app, server);
          earlyLog("[VITE] Dev server middleware integrated with HMR");
        }
      } catch (err) {
        earlyLog("[VITE] Middleware setup failed:", err);
      }
    }

    // DEV: Vite SPA catch-all (must come AFTER routes)
    if (process.env.NODE_ENV !== "production") {
      try {
        const viteModule = await import("./vite");
        if (viteModule && typeof viteModule.setupViteCatchAll === "function") {
          await viteModule.setupViteCatchAll(app);
          earlyLog("[VITE] SPA catch-all configured");
        }
      } catch (err) {
        earlyLog("[VITE] Catch-all setup failed:", err);
      }
    }

    // Attach Sentry error handler if available (after routes, before custom error handler)
    try {
      const { getSentryErrorHandler } = await import("./services/errorTracking").catch(() => ({ getSentryErrorHandler: undefined }));
      if (typeof getSentryErrorHandler === "function") {
        const sentryErrorHandler = await getSentryErrorHandler();
        if (sentryErrorHandler) app.use(sentryErrorHandler);
      }
    } catch (err) {
      earlyLog("[SENTRY] Error handler attach failed:", err);
    }

    // Custom security-focused error handler
    try {
      const { secureErrorHandler } = await import("./middleware/securityFixes").catch(() => ({ secureErrorHandler: undefined }));
      if (secureErrorHandler) {
        // Must be last middleware
        app.use((err: any, req: Request, res: Response, next: NextFunction) => secureErrorHandler(err, req, res, next));
      } else {
        // Fallback generic handler
        app.use((err: any, _req: Request, res: Response) => {
          logError(err || "Unknown error", { context: "fallbackErrorHandler" });
          res.status(err?.status || 500).json({ error: "Internal server error" });
        });
      }
    } catch (err) {
      earlyLog("[ERROR_HANDLER] attach error:", err);
    }

    // Start background services AFTER server is listening
    setTimeout(async () => {
      earlyLog("[BACKGROUND] Starting background services (non-blocking)");
      try {
        const { startNotificationProcessor } = await import("./jobs/notification-processor").catch(() => ({ startNotificationProcessor: undefined }));
        if (typeof startNotificationProcessor === "function") startNotificationProcessor();

        if (process.env.DEATH_VERIFICATION_ENABLED === "true") {
          import("./jobs/deathVerificationCron").then(m => m.startDeathVerificationCrons?.()).catch((e) => logError(e, { context: "deathVerification" }));
        }

        import("./jobs/hardwareMonitoringCron").then(m => m.startHardwareMonitoringCron?.()).catch((e) => logError(e, { context: "hardwareMonitoring" }));

        import("./jobs/yield-calculator").then(m => m.startYieldCalculator?.()).catch((e) => logError(e, { context: "yieldCalculator" }));
        import("./jobs/yieldSnapshotCron").then(m => m.startYieldSnapshotCron?.()).catch((e) => logError(e, { context: "yieldSnapshot" }));

        import("./services/protocolHealthService").then(m => m.protocolHealthService?.startHealthChecks()).catch((e) => logError(e, { context: "protocolHealth" }));
        import("./services/yieldChallengeService").then(m => m.yieldChallengeService?.startChallengeCron()).catch((e) => logError(e, { context: "yieldChallenge" }));

        earlyLog("[BACKGROUND] Background services started (if configured)");
      } catch (err) {
        logError(err, { context: "background_services" });
      }
    }, 1000);

    // Attach signal handlers for graceful shutdown
    process.on("SIGTERM", () => void gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => void gracefulShutdown("SIGINT"));

    earlyLog("✅ [INIT] Server initialization complete and running");
  } catch (initErr) {
    earlyLog("❌ [INIT] Fatal initialization error:", initErr);
    // If server is not listening, exit with failure
    if (!server || !server.listening) {
      earlyLog("❌ [INIT] Server failed to start - exiting");
      process.exit(1);
    } else {
      earlyLog("⚠️ [INIT] Server started but initialization encountered errors - continuing to run");
    }
  }
})(); // IIFE

// Note: No artificial keepalive (setInterval) or beforeExit suppression — let the process lifecycle behave normally.
