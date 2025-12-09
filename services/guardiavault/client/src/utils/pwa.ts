/**
 * PWA Utilities
 * Handles service worker registration and install prompt
 */
import { logInfo, logError } from "./logger";

export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const swUrl = '/serviceWorker.js';
      const registration = await navigator.serviceWorker.register(swUrl, {
        scope: '/',
        updateViaCache: 'none', // Always check for updates
      });

      logInfo('Service Worker registered', {
        context: "PWA",
        registration: registration ? "success" : "failed",
      });

      // Check for updates more aggressively
      if (registration) {
        // Check for updates immediately and then periodically
        registration.update();

        // Check for updates every 30 seconds (more frequent)
        setInterval(() => {
          registration.update();
        }, 30000);

        // Listen for service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // New service worker available, reload page
                  logInfo('New service worker available, reloading page...', {
                    context: "PWA",
                  });
                  // Auto-reload after a short delay
                  setTimeout(() => {
                    window.location.reload();
                  }, 500);
                } else {
                  // First time installation
                  logInfo('Service worker installed for the first time', {
                    context: "PWA",
                  });
                }
              }
            });
          }
        });

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'SW_UPDATED') {
            logInfo('Service worker updated, reloading...', {
              context: "PWA",
              version: event.data.version,
            });
            setTimeout(() => {
              window.location.reload();
            }, 500);
          }
        });
      }

      return registration;
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        context: "PWA",
      });
      return null;
    }
  }
  return null;
}

export async function requestNotificationPermission() {
  if ('Notification' in window && 'serviceWorker' in navigator) {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
}

let deferredPrompt: any = null;

export function setupInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallButton();
  });

  window.addEventListener('appinstalled', () => {
    logInfo('App installed', {
      context: "PWA",
    });
    deferredPrompt = null;
    hideInstallButton();
  });
}

export async function promptInstall() {
  if (!deferredPrompt) {
    return false;
  }

  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  logInfo('User choice', {
    context: "PWA",
    outcome,
  });
  deferredPrompt = null;
  return outcome === 'accepted';
}

function showInstallButton() {
  const installButton = document.getElementById('pwa-install-button');
  if (installButton) {
    installButton.style.display = 'block';
  }
}

function hideInstallButton() {
  const installButton = document.getElementById('pwa-install-button');
  if (installButton) {
    installButton.style.display = 'none';
  }
}

export function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

