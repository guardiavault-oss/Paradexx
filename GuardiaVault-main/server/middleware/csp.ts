/**
 * Content Security Policy (CSP) Middleware
 * Comprehensive CSP configuration with nonce support and violation reporting
 */

import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import crypto from 'crypto';
import { logWarn, logError, logInfo } from '../services/logger';

// Extend Express Request to include nonce
declare global {
  namespace Express {
    interface Request {
      nonce?: string;
    }
  }
}

/**
 * Generate a cryptographically secure nonce for inline scripts/styles
 */
export function generateNonce(): string {
  return crypto.randomBytes(16).toString('base64');
}

/**
 * Middleware to generate and attach nonce to request
 */
export function nonceMiddleware(req: Request, _res: Response, next: NextFunction) {
  req.nonce = generateNonce();
  next();
}

/**
 * Get CSP directives based on environment
 */
function getCSPDirectives(req: Request, isProduction: boolean) {
  const nonce = req.nonce || '';

  // Base directives common to all environments
  const baseDirectives: Record<string, string[]> = {
    defaultSrc: ["'self'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    frameAncestors: ["'none'"],
    upgradeInsecureRequests: [],
  };

  // Script sources
  const scriptSources = [
    "'self'",
    // Allow nonce for inline scripts (only if nonce is available)
    ...(nonce ? [`'nonce-${nonce}'`] : []),
    // Web3Modal and wallet connections
    'https://*.walletconnect.org',
    'https://*.walletconnect.com',
    'https://*.web3modal.org',
    'https://api.web3modal.org',
    'https://pulse.walletconnect.org',
    // Coinbase Wallet
    'https://cca-lite.coinbase.com',
    'https://*.coinbase.com',
    // Sentry for error tracking
    'https://*.sentry.io',
    // GSAP CDN (if loaded from CDN)
    'https://cdnjs.cloudflare.com',
    'https://cdn.jsdelivr.net',
  ];

  // In development, allow unsafe-eval for Vite HMR and Webpack
  if (!isProduction) {
    scriptSources.push("'unsafe-eval'");
    scriptSources.push("'unsafe-inline'"); // Fallback for dev hot reload
    // Allow Vite dev server
    scriptSources.push('http://localhost:*');
    scriptSources.push('ws://localhost:*');
  }

  baseDirectives.scriptSrc = scriptSources;

  // Style sources - Tailwind needs inline styles
  // In production, prefer nonce-based approach for inline styles
  const styleSources = [
    "'self'",
    ...(nonce ? [`'nonce-${nonce}'`] : []),
    "'unsafe-inline'", // Required for Tailwind CSS and inline styles
    'https://fonts.googleapis.com',
  ];

  baseDirectives.styleSrc = styleSources;
  baseDirectives.styleSrcElem = styleSources;

  // Font sources
  baseDirectives.fontSrc = [
    "'self'",
    'https://fonts.gstatic.com',
    'https://fonts.googleapis.com',
    'data:', // For inline font data
  ];

  // Image sources
  baseDirectives.imgSrc = [
    "'self'",
    'data:', // For data URIs (base64 images)
    'https:', // Allow all HTTPS images (needed for Unsplash, external images)
    'blob:', // For blob URLs (used by some image processing)
  ];

  // Media sources (audio/video)
  baseDirectives.mediaSrc = [
    "'self'",
    'data:',
    'blob:',
  ];

  // Connect sources - API endpoints and blockchain RPCs
  const connectSources = [
    "'self'",
    // Blockchain RPC endpoints
    process.env.VITE_SEPOLIA_RPC_URL || '',
    process.env.VITE_MAINNET_RPC_URL || '',
    // WalletConnect
    'https://*.walletconnect.org',
    'https://*.walletconnect.com',
    'https://*.web3modal.org',
    'https://api.web3modal.org',
    'https://pulse.walletconnect.org',
    'wss://*.walletconnect.org',
    'wss://*.walletconnect.com',
    // Coinbase
    'https://cca-lite.coinbase.com',
    'https://*.coinbase.com',
    // Alchemy
    'https://*.alchemy.com',
    'wss://*.alchemy.com',
    // Infura
    'https://*.infura.io',
    'wss://*.infura.io',
    // Sentry
    'https://*.sentry.io',
    // Other blockchain providers
    'https://*.quicknode.com',
    'https://*.ankr.com',
    // Railway API (if using)
    process.env.APP_URL || '',
  ].filter(Boolean);

  baseDirectives.connectSrc = connectSources;

  // Worker sources (for Web Workers, Service Workers)
  baseDirectives.workerSrc = [
    "'self'",
    'blob:',
  ];

  // Child sources (for iframes, if needed)
  baseDirectives.childSrc = ["'self'"];

  // Object sources (for plugins)
  baseDirectives.objectSrc = ["'none'"];

  // Manifest source
  baseDirectives.manifestSrc = ["'self'"];

  // Frame sources (for embedded content)
  baseDirectives.frameSrc = [
    "'self'",
    'https://*.walletconnect.org',
    'https://*.coinbase.com',
  ];

  return baseDirectives;
}

/**
 * CSP violation report handler
 */
export async function handleCSPViolation(req: Request, res: Response) {
  try {
    const report = req.body;

    // Log CSP violations for monitoring
    if (report && report['csp-report']) {
      const violation = report['csp-report'];
      logWarn('CSP Violation detected', {
        documentUri: violation['document-uri'],
        referrer: violation.referrer,
        blockedUri: violation['blocked-uri'],
        violatedDirective: violation['violated-directive'],
        originalPolicy: violation['original-policy'],
        sourceFile: violation['source-file'],
        lineNumber: violation['line-number'],
        columnNumber: violation['column-number'],
        userAgent: req.headers['user-agent'],
        ip: req.ip,
      });

      // In production, you might want to send this to a monitoring service
      // For example, Sentry, DataDog, or a custom analytics endpoint
      if (process.env.NODE_ENV === 'production') {
        // Optionally send to error tracking service
        // captureException(new Error('CSP Violation'), { extra: violation });
      }
    }

    // Always return 204 No Content for CSP reports
    res.status(204).end();
  } catch (error) {
    logError(error as Error, { context: 'CSP violation reporting' });
    res.status(204).end(); // Still return 204 even on error
  }
}

/**
 * Create CSP middleware with environment-specific configuration
 */
export function createCSPMiddleware() {
  const isProduction = process.env.NODE_ENV === 'production';

  // Helmet 8.x expects directives as an object, not a function
  // Generate directives once for the environment (without nonce)
  const staticDirectives = getCSPDirectives({} as Request, isProduction);

  return helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: staticDirectives,
    },
    // Disable COEP for Base Account SDK compatibility
    crossOriginEmbedderPolicy: false,
    // Disable COOP for Base Account SDK compatibility
    crossOriginOpenerPolicy: false,
    // Enable other security headers
    xContentTypeOptions: true,
    xXssProtection: false, // CSP handles XSS protection
    xFrameOptions: { action: 'deny' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  });
}

/**
 * Export middleware for use in Express app
 * Lazy initialization to avoid errors during module load
 */
export function getCSPMiddleware() {
  try {
    return createCSPMiddleware();
  } catch (error) {
    logError(error as Error, { context: 'cspMiddleware', message: 'Failed to create CSP middleware' });
    // Return a no-op middleware if CSP creation fails
    return (req: Request, res: Response, next: NextFunction) => next();
  }
}

// For backward compatibility, but use getCSPMiddleware() instead
export const cspMiddleware = getCSPMiddleware();

