/**
 * Development Debug Routes
 * Only available in development mode
 * Provides debugging tools for authentication and routes
 */

import type { Express, Request, Response } from "express";
import { storage } from "./storage";
import { logInfo, logError, logDebug, logWarn } from "./services/logger";
import bcrypt from "bcrypt";

/**
 * Register development debug routes
 */
export function registerDevDebugRoutes(app: Express) {
  // Only register in development
  if (process.env.NODE_ENV !== "development") {
    logInfo("Skipping dev debug routes - not in development mode", {
      context: "dev-debug",
      nodeEnv: process.env.NODE_ENV,
    });
    return;
  }

  logInfo("Registering development debug routes", {
    context: "dev-debug",
  });

  /**
   * GET /api/dev/routes
   * List all registered routes (for debugging)
   */
  app.get("/api/dev/routes", (req: Request, res: Response) => {
    try {
      const routes: Array<{ method: string; path: string }> = [];
      
      // Extract routes from Express app
      app._router?.stack?.forEach((middleware: any) => {
        if (middleware.route) {
          // Direct route
          const methods = Object.keys(middleware.route.methods);
          methods.forEach((method: string) => {
            routes.push({
              method: method.toUpperCase(),
              path: middleware.route.path,
            });
          });
        } else if (middleware.name === "router") {
          // Router middleware
          middleware.handle?.stack?.forEach((handler: any) => {
            if (handler.route) {
              const methods = Object.keys(handler.route.methods);
              methods.forEach((method: string) => {
                routes.push({
                  method: method.toUpperCase(),
                  path: handler.route.path,
                });
              });
            }
          });
        }
      });

      res.json({
        success: true,
        total: routes.length,
        routes: routes.sort((a, b) => a.path.localeCompare(b.path)),
      });
    } catch (error: any) {
      logError(error, { context: "dev-routes" });
      res.status(500).json({
        success: false,
        message: "Failed to list routes",
        error: error.message,
      });
    }
  });

  /**
   * GET /api/dev/storage
   * Check storage status and list users
   */
  app.get("/api/dev/storage", async (req: Request, res: Response) => {
    try {
      const storageType = storage.constructor.name;
      const hasDatabase = !!process.env.DATABASE_URL;
      
      // Try to get user count (may fail if using in-memory storage)
      let userCount = 0;
      let users: any[] = [];
      
      try {
        // This is a dev-only endpoint, so we can be more permissive
        if (storageType === "MemStorage") {
          // For in-memory storage, we can't easily count, but we can try to get demo user
          const demoUser = await storage.getUserByEmail("demo@guardiavault.com");
          if (demoUser) {
            userCount = 1;
            users = [{
              id: demoUser.id,
              email: demoUser.email,
              hasPassword: !!demoUser.password,
              passwordHashFormat: demoUser.password?.substring(0, 10) || "none",
            }];
          }
        } else {
          // For database storage, we'd need a count method
          // For now, just check if we can access storage
          userCount = -1; // Unknown
        }
      } catch (err) {
        // Ignore errors
      }

      res.json({
        success: true,
        storage: {
          type: storageType,
          hasDatabase,
          userCount,
          users: users.slice(0, 5), // Limit to 5 for safety
        },
      });
    } catch (error: any) {
      logError(error, { context: "dev-storage" });
      res.status(500).json({
        success: false,
        message: "Failed to check storage",
        error: error.message,
      });
    }
  });

  /**
   * POST /api/dev/create-test-user
   * Create a test user for development (dev only!)
   */
  app.post("/api/dev/create-test-user", async (req: Request, res: Response) => {
    try {
      const { email = "test@example.com", password = "Test123!@#" } = req.body;

      logDebug("Creating test user", {
        context: "dev-create-user",
        email,
      });

      // Check if user exists
      const existingUser = await storage.getUserByEmail(email.toLowerCase().trim());
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User already exists",
          user: {
            id: existingUser.id,
            email: existingUser.email,
          },
        });
      }

      // Create user
      const hashedPassword = await bcrypt.hash(password.trim(), 10);
      const user = await storage.createUser({
        email: email.toLowerCase().trim(),
        password: hashedPassword,
      });

      logInfo("Test user created", {
        context: "dev-create-user",
        userId: user.id,
        email: user.email,
      });

      res.json({
        success: true,
        message: "Test user created",
        user: {
          id: user.id,
          email: user.email,
        },
        credentials: {
          email: email,
          password: password, // Only in dev!
        },
      });
    } catch (error: any) {
      logError(error, { context: "dev-create-user" });
      res.status(500).json({
        success: false,
        message: "Failed to create test user",
        error: error.message,
      });
    }
  });

  /**
   * POST /api/dev/test-login
   * Test login with detailed debugging info
   */
  app.post("/api/dev/test-login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email and password required",
        });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const trimmedPassword = password.trim();

      logDebug("Test login attempt", {
        context: "dev-test-login",
        email: normalizedEmail,
        passwordLength: trimmedPassword.length,
      });

      // Find user
      const user = await storage.getUserByEmail(normalizedEmail);
      
      if (!user) {
        return res.json({
          success: false,
          message: "User not found",
          debug: {
            searchedEmail: normalizedEmail,
            userExists: false,
          },
        });
      }

      // Check password hash format
      const hashFormat = user.password?.substring(0, 10) || "none";
      const isValidHashFormat = user.password?.startsWith('$2b$') || 
                                 user.password?.startsWith('$2a$') || 
                                 user.password?.startsWith('$2y$');

      // Try password comparison
      let passwordMatch = false;
      let comparisonError: string | null = null;

      try {
        passwordMatch = await bcrypt.compare(trimmedPassword, user.password);
      } catch (error: any) {
        comparisonError = error.message;
      }

      // Try without trim
      let passwordMatchWithoutTrim = false;
      if (password !== trimmedPassword) {
        try {
          passwordMatchWithoutTrim = await bcrypt.compare(password, user.password);
        } catch (error: any) {
          // Ignore
        }
      }

      res.json({
        success: passwordMatch || passwordMatchWithoutTrim,
        message: passwordMatch || passwordMatchWithoutTrim 
          ? "Password matches" 
          : "Password does not match",
        debug: {
          userFound: true,
          userId: user.id,
          email: user.email,
          passwordHashFormat: hashFormat,
          isValidHashFormat,
          passwordLength: trimmedPassword.length,
          originalPasswordLength: password.length,
          hadWhitespace: password !== trimmedPassword,
          passwordMatch,
          passwordMatchWithoutTrim,
          comparisonError,
        },
      });
    } catch (error: any) {
      logError(error, { context: "dev-test-login" });
      res.status(500).json({
        success: false,
        message: "Test login failed",
        error: error.message,
      });
    }
  });

  /**
   * GET /api/dev/session
   * Check current session status
   */
  app.get("/api/dev/session", (req: Request, res: Response) => {
    try {
      res.json({
        success: true,
        session: {
          id: req.sessionID,
          exists: !!req.session,
          userId: req.session?.userId || null,
          hasCookies: !!req.headers.cookie,
          cookieHeader: req.headers.cookie ? "present" : "missing",
        },
      });
    } catch (error: any) {
      logError(error, { context: "dev-session" });
      res.status(500).json({
        success: false,
        message: "Failed to check session",
        error: error.message,
      });
    }
  });

  logInfo("Development debug routes registered", {
    context: "dev-debug",
    routes: [
      "GET /api/dev/routes",
      "GET /api/dev/storage",
      "GET /api/dev/session",
      "POST /api/dev/create-test-user",
      "POST /api/dev/test-login",
    ],
  });
}

