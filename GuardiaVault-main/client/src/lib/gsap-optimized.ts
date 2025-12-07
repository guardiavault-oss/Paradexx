/**
 * Optimized GSAP Imports
 * Tree-shakeable GSAP imports to reduce bundle size
 */

// Import only the core GSAP engine (smaller than full import)
import { gsap } from "gsap";

// Import plugins only when needed
export { ScrollTrigger } from "gsap/ScrollTrigger";
export { ScrollSmoother } from "gsap/ScrollSmoother";
export { TextPlugin } from "gsap/TextPlugin";
export { MotionPathPlugin } from "gsap/MotionPathPlugin";

// Re-export gsap for convenience
export { gsap };

// Plugin registration helper
let pluginsRegistered = new Set<string>();

export function registerPlugin(plugin: any, name: string) {
  if (!pluginsRegistered.has(name)) {
    gsap.registerPlugin(plugin);
    pluginsRegistered.add(name);
  }
}

// Convenience function to register common plugins
export function registerCommonPlugins() {
  import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
    registerPlugin(ScrollTrigger, "ScrollTrigger");
  });
}

