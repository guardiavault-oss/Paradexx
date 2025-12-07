/**
 * Shared Three.js singleton to prevent multiple imports
 * All components should import Three.js from this file
 * Usage: import * as THREE from '../utils/three';
 * 
 * This file serves as the single point of import for Three.js
 * to ensure only one instance is loaded by the bundler.
 */

// Single re-export statement to maintain one module instance
export * from "three@0.170.0";
