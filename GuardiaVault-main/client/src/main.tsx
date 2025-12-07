// CRITICAL: Import React FIRST and ensure it's available globally
// This must happen before any other imports that might use React
// The Object.defineProperty error occurs when wagmi/RainbowKit try to use React
// before React's module code has finished executing
import React from "react";
import { createRoot } from "react-dom/client";

// Ensure React is available globally IMMEDIATELY after import
// This must happen synchronously before any other code runs
// This prevents Object.defineProperty errors when wagmi/RainbowKit modules are evaluated
if (typeof window !== 'undefined') {
  // Assign React immediately - don't check if it exists first
  (window as any).React = React;
  
  // Ensure all critical React methods are available
  // These are used by wagmi/RainbowKit during module initialization
  if (React.createElement && !(window as any).React.createElement) {
    (window as any).React.createElement = React.createElement;
  }
  if (React.useState && !(window as any).React.useState) {
    (window as any).React.useState = React.useState;
  }
  if (React.useEffect && !(window as any).React.useEffect) {
    (window as any).React.useEffect = React.useEffect;
  }
  if (React.useContext && !(window as any).React.useContext) {
    (window as any).React.useContext = React.useContext;
  }
  if (React.createContext && !(window as any).React.createContext) {
    (window as any).React.createContext = React.createContext;
  }
}

import App from "./App";
import "./index.css";
import "./design-system.css";
import "./styles/enhanced-sidebar.css";
import { initSentryClient } from "./services/errorTracking";
import { logError } from "./utils/logger";
// Import BigInt utilities to prevent conversion errors
import "./utils/bigint-polyfill";

// Filter out known dependency warnings and browser extension errors
if (typeof window !== 'undefined' && typeof console !== 'undefined') {
  const originalWarn = console.warn;
  const originalError = console.error;
  
  const shouldSuppress = (message: string): boolean => {
    const suppressedPatterns = [
      // Zustand deprecation warnings (from @wagmi dependencies)
      /\[DEPRECATED\] Default export is deprecated/,
      // Browser extension errors (Phantom wallet, etc.)
      /disconnected port object/,
      /The page keeping the extension port/,
      /RPC router stream error/,
      /Attempting to use a disconnected port/,
      // Service worker warnings (handled by browser)
      /Event handler of.*event must be added on the initial evaluation/,
      // Phantom wallet API errors
      /api\.phantom\.app.*400/,
      /Failed to load resource.*phantom\.app/,
      // Service Worker logs (expected behavior)
      /\[Service Worker\]/,
      // Expected 401 errors (user not authenticated)
      /\/api\/auth\/me.*401/,
      /\/api\/auth\/login.*401/,
      /the server responded with a status of 401/,
      /Failed to load resource.*401/,
      // Expected 404 errors (routes not found during development/server restart)
      /\/api\/auth\/me.*404/,
      /\/api\/subscriptions\/status.*404/,
      /Failed to load resource.*404/,
      // WalletConnect/Reown API errors (expected if project ID not configured)
      /Failed to load resource.*api\.web3modal\.org.*403/,
      /Failed to load resource.*pulse\.walletconnect\.org.*400/,
      /\[Reown Config\] Failed to fetch remote project configuration/,
      /HTTP status code: 403/,
    ];
    
    return suppressedPatterns.some(pattern => pattern.test(message));
  };
  
  console.warn = (...args: any[]) => {
    const message = args.join(' ');
    if (!shouldSuppress(message)) {
      originalWarn.apply(console, args);
    }
  };
  
  console.error = (...args: any[]) => {
    const message = args.join(' ');
    if (!shouldSuppress(message)) {
      originalError.apply(console, args);
    }
  };
}

// Initialize Sentry in background (don't block rendering)
initSentryClient().catch((error) => {
  logError(error instanceof Error ? error : new Error(String(error)), {
    context: "initSentryClient",
  });
});

// Render immediately - don't wait for Sentry
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found. Make sure index.html has <div id='root'></div>");
}

// Clear any initial loading content before React renders
rootElement.innerHTML = "";

const root = createRoot(rootElement);
root.render(<App />);
