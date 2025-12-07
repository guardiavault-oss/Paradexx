import type { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Vite plugin to ensure serviceWorker.js is copied to the build output root
 * This is necessary because Vite's publicDir might not always copy files correctly
 */
export function copyServiceWorker(): Plugin {
  return {
    name: 'copy-service-worker',
    // Run in both writeBundle and closeBundle to ensure it happens
    writeBundle() {
      copyServiceWorkerFile();
    },
    closeBundle() {
      // Also run in closeBundle as a fallback
      copyServiceWorkerFile();
    },
  };
}

function copyServiceWorkerFile() {
  const serviceWorkerSource = path.resolve(__dirname, 'client/public/serviceWorker.js');
  const serviceWorkerDest = path.resolve(__dirname, 'dist/public/serviceWorker.js');
  
  // Ensure destination directory exists
  const destDir = path.dirname(serviceWorkerDest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  // Copy service worker if it exists
  if (fs.existsSync(serviceWorkerSource)) {
    try {
      // Read and write to ensure we have the latest content
      const content = fs.readFileSync(serviceWorkerSource, 'utf-8');
      fs.writeFileSync(serviceWorkerDest, content, 'utf-8');
      console.log(`✅ Copied serviceWorker.js to ${serviceWorkerDest}`);
      
      // Verify it was copied
      if (fs.existsSync(serviceWorkerDest)) {
        const stats = fs.statSync(serviceWorkerDest);
        console.log(`✅ Verified: serviceWorker.js exists (${stats.size} bytes)`);
      } else {
        console.error(`❌ Copy failed: serviceWorker.js not found at ${serviceWorkerDest}`);
      }
    } catch (error) {
      console.error(`❌ Failed to copy serviceWorker.js:`, error);
      // Don't throw - allow build to continue even if service worker copy fails
    }
  } else {
    console.warn(`⚠️  serviceWorker.js not found at ${serviceWorkerSource}`);
  }
}

