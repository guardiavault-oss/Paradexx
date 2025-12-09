/**
 * Dynamic Imports Utility
 * Centralized module for dynamically loading heavy libraries
 * Reduces initial bundle size by loading these on-demand
 */

import type * as GSAPTypes from 'gsap';
import type * as ThreeTypes from 'three';

// Cache loaded modules to avoid multiple dynamic imports
let gsapModule: typeof GSAPTypes | null = null;
let threeModule: typeof ThreeTypes | null = null;

/**
 * Dynamically import GSAP animation library
 * @returns GSAP module with ScrollTrigger registered
 */
export async function loadGSAP(): Promise<typeof GSAPTypes> {
  if (gsapModule) {
    return gsapModule;
  }

  try {
    const [gsap, ScrollTrigger] = await Promise.all([
      import('gsap'),
      import('gsap/ScrollTrigger'),
    ]);

    // Register ScrollTrigger plugin
    gsap.gsap.registerPlugin(ScrollTrigger.ScrollTrigger);

    gsapModule = gsap;
    return gsap;
  } catch (error) {
    console.error('Failed to load GSAP:', error);
    throw error;
  }
}

/**
 * Dynamically import Three.js 3D library
 * @returns Three.js module
 */
export async function loadThree(): Promise<typeof ThreeTypes> {
  if (threeModule) {
    return threeModule;
  }

  try {
    const three = await import('three');
    threeModule = three;
    return three;
  } catch (error) {
    console.error('Failed to load Three.js:', error);
    throw error;
  }
}

/**
 * Dynamically import Chart.js for data visualization
 * @returns Chart.js module
 */
export async function loadChartJS() {
  try {
    const [
      Chart,
      { CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler },
    ] = await Promise.all([
      import('chart.js'),
      import('chart.js'),
    ]);

    // Register required components
    Chart.Chart.register(
      CategoryScale,
      LinearScale,
      PointElement,
      LineElement,
      Title,
      Tooltip,
      Legend,
      Filler
    );

    return Chart;
  } catch (error) {
    console.error('Failed to load Chart.js:', error);
    throw error;
  }
}

/**
 * Dynamically import Recharts for data visualization
 * @returns Recharts components
 */
export async function loadRecharts() {
  try {
    const recharts = await import('recharts');
    return recharts;
  } catch (error) {
    console.error('Failed to load Recharts:', error);
    throw error;
  }
}

/**
 * Dynamically import QR code library
 * @returns QRCode module
 */
export async function loadQRCode() {
  try {
    const qrcode = await import('qrcode');
    return qrcode;
  } catch (error) {
    console.error('Failed to load QRCode:', error);
    throw error;
  }
}

/**
 * Dynamically import Framer Motion animation library
 * @returns Framer Motion module
 */
export async function loadFramerMotion() {
  try {
    const framerMotion = await import('framer-motion');
    return framerMotion;
  } catch (error) {
    console.error('Failed to load Framer Motion:', error);
    throw error;
  }
}

/**
 * Preload critical libraries during idle time
 * Call this after initial page load to warm up the cache
 */
export function preloadCriticalLibraries() {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(
      () => {
        // Preload GSAP for animations
        loadGSAP().catch(() => {});

        // Preload Three.js if on a powerful device
        if (navigator.hardwareConcurrency && navigator.hardwareConcurrency > 4) {
          loadThree().catch(() => {});
        }
      },
      { timeout: 3000 }
    );
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      loadGSAP().catch(() => {});
    }, 2000);
  }
}
