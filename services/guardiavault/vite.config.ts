import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import { copyServiceWorker } from "./vite-plugin-copy-serviceworker";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import { visualizer } from "rollup-plugin-visualizer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: path.resolve(__dirname, "client"),
  base: "/", // serve from root
  plugins: [
    // vanilla-extract BEFORE react as you had it
    vanillaExtractPlugin({
      identifiers: "short",
      esbuildOptions: {
        target: "es2020",
      },
    }),
    react(),
    // Keep your custom plugin that copies the service worker to the final root.
    // This should ensure serviceWorker.js ends up exactly at /serviceWorker.js
    copyServiceWorker(),
    // Bundle analyzer - generates stats.html in dist/public
    visualizer({
      open: false, // Don't auto-open browser
      gzipSize: true,
      brotliSize: true,
      filename: path.resolve(__dirname, "dist/public/stats.html"),
      template: "treemap", // treemap, sunburst, network
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
      // Force single react instance by aliasing to the project's node_modules
      // (helps prevent duplicate React instances that cause init order issues)
      react: path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
    },
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "@tanstack/react-query",
      "@vanilla-extract/css",
      "@vanilla-extract/sprinkles",
    ],
    // conditions is okay; keep defaults but don't overconstrain
    conditions: ["import", "module", "browser", "default"],
    preserveSymlinks: false,
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "@tanstack/react-query",
      "wagmi",
      "@rainbow-me/rainbowkit",
      "@vanilla-extract/sprinkles",
      "@vanilla-extract/css",
    ],
    esbuildOptions: {
      // make sure global references don't break some older libs
      define: {
        global: "globalThis",
      },
    },
  },
  publicDir: path.resolve(__dirname, "client/public"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    sourcemap: true, // keep for debugging production issues
    rollupOptions: {
      input: path.resolve(__dirname, "client/index.html"),
      output: {
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
        // Manual chunking for better cache optimization
        manualChunks: {
          // Core React and routing
          'react-vendor': ['react', 'react-dom', 'wouter'],

          // UI component libraries (Radix)
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-tabs',
            '@radix-ui/react-popover',
            '@radix-ui/react-toast',
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
          ],

          // Blockchain and wallet libraries (heavy)
          'blockchain': [
            'ethers',
            'wagmi',
            'viem',
            '@wagmi/core',
            '@wagmi/connectors',
            '@rainbow-me/rainbowkit',
            '@reown/appkit',
            '@reown/appkit-adapter-wagmi',
          ],

          // Animation libraries (heavy - loaded dynamically)
          'animations': ['gsap', 'framer-motion'],

          // 3D graphics (very heavy - loaded dynamically)
          '3d': ['three', '@react-three/fiber', '@react-three/drei'],

          // Form handling
          'forms': ['react-hook-form', '@hookform/resolvers', 'zod'],

          // Data fetching and state
          'data': ['@tanstack/react-query', 'axios'],

          // Charts and data visualization
          'charts': ['recharts', 'd3-scale', 'd3-shape'],
        },
      },
    },
    cssCodeSplit: true,
    target: "es2020",
    // Enable minification for production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
      format: {
        comments: false, // Remove comments
      },
    },
    chunkSizeWarningLimit: 600, // Warn for chunks > 600KB
    // Optimize asset handling
    assetsInlineLimit: 4096, // Inline assets < 4KB as base64
  },
  server: {
    strictPort: true,
    fs: {
      strict: true,
      allow: [path.resolve(__dirname, "client")],
    },
    // For dev, ensure serviceWorker is available at the root path
    // If your dev plugin doesn't put service worker at the root, the dev server will 404 and fallback to index.html (causing the MIME issue)
  },
});
