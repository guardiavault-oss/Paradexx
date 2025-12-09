/**
 * Animation Performance Engine
 * Enterprise-grade animation system with GPU acceleration, frame budget management,
 * and accessibility features
 */

// ==============================================
// TYPES & INTERFACES
// ==============================================

export interface AnimationConfig {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  duration: number;
  element?: HTMLElement;
  animation?: Animation;
  startTime?: number;
  isCompositeOnly?: boolean;
}

export interface FrameBudgetMetrics {
  fps: number;
  frameTime: number;
  droppedFrames: number;
  activeAnimations: number;
  timestamp: number;
}

export interface AnimationProfilerData {
  id: string;
  duration: number;
  fps: number;
  jankCount: number;
  averageFrameTime: number;
  cost: 'low' | 'medium' | 'high';
}

export interface GPUAccelerationConfig {
  autoWillChange: boolean;
  layerPromotionHints: boolean;
  compositeOnlyDetection: boolean;
  deviceFallback: boolean;
}

export type MotionPreference = 'no-preference' | 'reduce';
export type AnimationQuality = 'high' | 'medium' | 'low';

// ==============================================
// GPU ACCELERATION MANAGER
// ==============================================

class GPUAccelerationManager {
  private willChangeElements = new WeakMap<HTMLElement, string>();
  private compositeOnlyProperties = ['transform', 'opacity', 'filter'];
  private isLowPowerDevice = false;

  constructor() {
    this.detectDeviceCapabilities();
  }

  /**
   * Detect if device is low-powered and should use fallback animations
   */
  private detectDeviceCapabilities(): void {
    // Check for low-end device indicators
    const memory = (navigator as any).deviceMemory;
    const hardwareConcurrency = navigator.hardwareConcurrency || 1;

    this.isLowPowerDevice =
      (memory && memory < 4) || hardwareConcurrency < 4;
  }

  /**
   * Add will-change property before animation
   */
  addWillChange(element: HTMLElement, properties: string[]): void {
    if (this.isLowPowerDevice) return;

    const willChangeValue = properties.join(', ');
    element.style.willChange = willChangeValue;
    this.willChangeElements.set(element, willChangeValue);
  }

  /**
   * Remove will-change property after animation
   */
  removeWillChange(element: HTMLElement, delay = 100): void {
    if (this.isLowPowerDevice) return;

    setTimeout(() => {
      if (this.willChangeElements.has(element)) {
        element.style.willChange = 'auto';
        this.willChangeElements.delete(element);
      }
    }, delay);
  }

  /**
   * Check if animation uses only composite-layer properties
   */
  isCompositeOnly(properties: string[]): boolean {
    return properties.every((prop) =>
      this.compositeOnlyProperties.includes(prop)
    );
  }

  /**
   * Promote element to its own layer
   */
  promoteToLayer(element: HTMLElement): void {
    if (this.isLowPowerDevice) return;

    // Use transform: translateZ(0) to create a new composite layer
    if (!element.style.transform || element.style.transform === 'none') {
      element.style.transform = 'translateZ(0)';
    }
  }

  /**
   * Get device capability info
   */
  getDeviceInfo(): { isLowPower: boolean; memory?: number; cores: number } {
    return {
      isLowPower: this.isLowPowerDevice,
      memory: (navigator as any).deviceMemory,
      cores: navigator.hardwareConcurrency || 1,
    };
  }
}

// ==============================================
// FRAME BUDGET SYSTEM
// ==============================================

class FrameBudgetSystem {
  private targetFPS = 60;
  private targetFrameTime = 1000 / this.targetFPS; // ~16.67ms
  private frameTimesBuffer: number[] = [];
  private maxBufferSize = 60; // Track last 60 frames
  private droppedFrames = 0;
  private lastFrameTime = 0;
  private animationFrame: number | null = null;
  private metrics: FrameBudgetMetrics[] = [];
  private maxMetrics = 100;

  /**
   * Start monitoring frame budget
   */
  startMonitoring(callback?: (metrics: FrameBudgetMetrics) => void): void {
    const monitor = (timestamp: number) => {
      if (this.lastFrameTime > 0) {
        const frameTime = timestamp - this.lastFrameTime;
        this.frameTimesBuffer.push(frameTime);

        if (this.frameTimesBuffer.length > this.maxBufferSize) {
          this.frameTimesBuffer.shift();
        }

        // Detect dropped frames (> 2x target frame time)
        if (frameTime > this.targetFrameTime * 2) {
          this.droppedFrames++;
        }

        // Calculate metrics
        const avgFrameTime =
          this.frameTimesBuffer.reduce((a, b) => a + b, 0) /
          this.frameTimesBuffer.length;
        const currentFPS = 1000 / avgFrameTime;

        const metricsData: FrameBudgetMetrics = {
          fps: Math.round(currentFPS),
          frameTime: Math.round(avgFrameTime * 100) / 100,
          droppedFrames: this.droppedFrames,
          activeAnimations: AnimationEngine.getActiveAnimationCount(),
          timestamp,
        };

        this.metrics.push(metricsData);
        if (this.metrics.length > this.maxMetrics) {
          this.metrics.shift();
        }

        callback?.(metricsData);
      }

      this.lastFrameTime = timestamp;
      this.animationFrame = requestAnimationFrame(monitor);
    };

    this.animationFrame = requestAnimationFrame(monitor);
  }

  /**
   * Stop monitoring frame budget
   */
  stopMonitoring(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  /**
   * Get current FPS
   */
  getCurrentFPS(): number {
    if (this.frameTimesBuffer.length === 0) return 60;
    const avgFrameTime =
      this.frameTimesBuffer.reduce((a, b) => a + b, 0) /
      this.frameTimesBuffer.length;
    return Math.round(1000 / avgFrameTime);
  }

  /**
   * Get quality recommendation based on current performance
   */
  getQualityRecommendation(): AnimationQuality {
    const fps = this.getCurrentFPS();
    if (fps >= 55) return 'high';
    if (fps >= 40) return 'medium';
    return 'low';
  }

  /**
   * Get all metrics
   */
  getMetrics(): FrameBudgetMetrics[] {
    return [...this.metrics];
  }

  /**
   * Reset metrics
   */
  reset(): void {
    this.frameTimesBuffer = [];
    this.droppedFrames = 0;
    this.metrics = [];
  }
}

// ==============================================
// REDUCED MOTION SYSTEM
// ==============================================

class ReducedMotionSystem {
  private motionPreference: MotionPreference = 'no-preference';
  private userOverride: boolean | null = null;
  private durationScale = 1;
  private listeners: Set<(enabled: boolean) => void> = new Set();
  private readonly STORAGE_KEY = 'animation-reduced-motion-override';

  constructor() {
    this.detectMotionPreference();
    this.loadUserPreference();
    this.setupMediaQueryListener();
  }

  /**
   * Detect system motion preference
   */
  private detectMotionPreference(): void {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.motionPreference = mediaQuery.matches ? 'reduce' : 'no-preference';
  }

  /**
   * Load user preference from localStorage
   */
  private loadUserPreference(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored !== null) {
        this.userOverride = stored === 'true';
      }
    } catch (e) {
      console.warn('Failed to load reduced motion preference:', e);
    }
  }

  /**
   * Setup listener for system preference changes
   */
  private setupMediaQueryListener(): void {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    mediaQuery.addEventListener('change', (e) => {
      this.motionPreference = e.matches ? 'reduce' : 'no-preference';
      this.notifyListeners();
    });
  }

  /**
   * Check if reduced motion is enabled (considering user override)
   */
  isReducedMotion(): boolean {
    if (this.userOverride !== null) {
      return this.userOverride;
    }
    return this.motionPreference === 'reduce';
  }

  /**
   * Set user preference override
   */
  setUserPreference(enabled: boolean): void {
    this.userOverride = enabled;
    try {
      localStorage.setItem(this.STORAGE_KEY, String(enabled));
    } catch (e) {
      console.warn('Failed to save reduced motion preference:', e);
    }
    this.notifyListeners();
  }

  /**
   * Clear user preference override
   */
  clearUserPreference(): void {
    this.userOverride = null;
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear reduced motion preference:', e);
    }
    this.notifyListeners();
  }

  /**
   * Get scaled duration based on reduced motion settings
   */
  getScaledDuration(duration: number): number {
    if (this.isReducedMotion()) {
      return duration * 0.01; // Near instant for reduced motion
    }
    return duration * this.durationScale;
  }

  /**
   * Set duration scale (for fine-tuning animations)
   */
  setDurationScale(scale: number): void {
    this.durationScale = Math.max(0, Math.min(2, scale)); // Clamp between 0 and 2
  }

  /**
   * Get motion-safe alternative config
   */
  getMotionSafeConfig<T>(
    normalConfig: T,
    reducedConfig: Partial<T>
  ): T {
    if (this.isReducedMotion()) {
      return { ...normalConfig, ...reducedConfig };
    }
    return normalConfig;
  }

  /**
   * Add listener for motion preference changes
   */
  addListener(listener: (enabled: boolean) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of changes
   */
  private notifyListeners(): void {
    const isReduced = this.isReducedMotion();
    this.listeners.forEach((listener) => listener(isReduced));
  }
}

// ==============================================
// ANIMATION PROFILER
// ==============================================

class AnimationProfiler {
  private profiles = new Map<string, AnimationProfilerData>();
  private isEnabled = false;
  private overlayElement: HTMLDivElement | null = null;

  /**
   * Enable profiler
   */
  enable(): void {
    this.isEnabled = true;
    if (process.env.NODE_ENV === 'development') {
      this.createOverlay();
    }
  }

  /**
   * Disable profiler
   */
  disable(): void {
    this.isEnabled = false;
    this.removeOverlay();
  }

  /**
   * Start profiling an animation
   */
  startProfile(id: string): void {
    if (!this.isEnabled) return;

    this.profiles.set(id, {
      id,
      duration: 0,
      fps: 0,
      jankCount: 0,
      averageFrameTime: 0,
      cost: 'low',
    });
  }

  /**
   * End profiling an animation
   */
  endProfile(
    id: string,
    metrics: { duration: number; fps: number; jankCount: number }
  ): void {
    if (!this.isEnabled) return;

    const profile = this.profiles.get(id);
    if (profile) {
      profile.duration = metrics.duration;
      profile.fps = metrics.fps;
      profile.jankCount = metrics.jankCount;
      profile.averageFrameTime = 1000 / metrics.fps;

      // Determine cost based on performance
      if (metrics.fps < 40 || metrics.jankCount > 5) {
        profile.cost = 'high';
      } else if (metrics.fps < 55 || metrics.jankCount > 2) {
        profile.cost = 'medium';
      } else {
        profile.cost = 'low';
      }

      this.updateOverlay();
    }
  }

  /**
   * Get profile data for an animation
   */
  getProfile(id: string): AnimationProfilerData | undefined {
    return this.profiles.get(id);
  }

  /**
   * Get all profiles
   */
  getAllProfiles(): AnimationProfilerData[] {
    return Array.from(this.profiles.values());
  }

  /**
   * Export performance report
   */
  exportReport(): string {
    const profiles = this.getAllProfiles();
    const report = {
      timestamp: new Date().toISOString(),
      totalAnimations: profiles.length,
      profiles: profiles.map((p) => ({
        id: p.id,
        duration: `${p.duration}ms`,
        fps: p.fps,
        jankCount: p.jankCount,
        cost: p.cost,
      })),
      summary: {
        highCost: profiles.filter((p) => p.cost === 'high').length,
        mediumCost: profiles.filter((p) => p.cost === 'medium').length,
        lowCost: profiles.filter((p) => p.cost === 'low').length,
        averageFPS:
          profiles.reduce((sum, p) => sum + p.fps, 0) / profiles.length || 0,
      },
    };

    return JSON.stringify(report, null, 2);
  }

  /**
   * Clear all profiles
   */
  clearProfiles(): void {
    this.profiles.clear();
    this.updateOverlay();
  }

  /**
   * Create overlay for dev mode
   */
  private createOverlay(): void {
    if (this.overlayElement || typeof document === 'undefined') return;

    this.overlayElement = document.createElement('div');
    this.overlayElement.id = 'animation-profiler-overlay';
    this.overlayElement.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.85);
      color: #fff;
      padding: 12px;
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      z-index: 99999;
      max-width: 300px;
      max-height: 400px;
      overflow-y: auto;
      pointer-events: none;
    `;

    document.body.appendChild(this.overlayElement);
    this.updateOverlay();
  }

  /**
   * Update overlay content
   */
  private updateOverlay(): void {
    if (!this.overlayElement) return;

    const profiles = this.getAllProfiles();
    const fps = AnimationEngine.getFrameBudget().getCurrentFPS();

    const html = `
      <div style="margin-bottom: 8px; font-weight: bold; color: #00ff00;">
        FPS: ${fps}
      </div>
      <div style="margin-bottom: 8px;">
        Active: ${AnimationEngine.getActiveAnimationCount()}
      </div>
      ${profiles
        .slice(-5)
        .map(
          (p) => `
        <div style="margin-bottom: 4px; padding: 4px; background: rgba(255,255,255,0.1); border-radius: 4px;">
          <div style="color: ${p.cost === 'high' ? '#ff4444' : p.cost === 'medium' ? '#ffaa00' : '#44ff44'};">
            ${p.id}
          </div>
          <div style="font-size: 10px; color: #aaa;">
            ${p.fps} fps | ${p.jankCount} janks
          </div>
        </div>
      `
        )
        .join('')}
    `;

    this.overlayElement.innerHTML = html;
  }

  /**
   * Remove overlay
   */
  private removeOverlay(): void {
    if (this.overlayElement) {
      this.overlayElement.remove();
      this.overlayElement = null;
    }
  }
}

// ==============================================
// BATCH RENDERER
// ==============================================

class BatchRenderer {
  private animationQueue: AnimationConfig[] = [];
  private rafId: number | null = null;
  private isProcessing = false;

  /**
   * Add animation to queue
   */
  addAnimation(config: AnimationConfig): void {
    // Remove existing animation with same ID
    this.animationQueue = this.animationQueue.filter((a) => a.id !== config.id);

    // Add new animation in priority order
    const index = this.animationQueue.findIndex(
      (a) => this.getPriorityValue(a.priority) < this.getPriorityValue(config.priority)
    );

    if (index === -1) {
      this.animationQueue.push(config);
    } else {
      this.animationQueue.splice(index, 0, config);
    }

    this.scheduleRender();
  }

  /**
   * Remove animation from queue
   */
  removeAnimation(id: string): void {
    this.animationQueue = this.animationQueue.filter((a) => a.id !== id);
  }

  /**
   * Get animation from queue
   */
  getAnimation(id: string): AnimationConfig | undefined {
    return this.animationQueue.find((a) => a.id === id);
  }

  /**
   * Schedule render
   */
  private scheduleRender(): void {
    if (this.isProcessing) return;

    if (this.rafId === null) {
      this.rafId = requestAnimationFrame(() => this.processQueue());
    }
  }

  /**
   * Process animation queue
   */
  private processQueue(): void {
    this.isProcessing = true;
    this.rafId = null;

    const now = performance.now();

    // Process animations in priority order
    this.animationQueue.forEach((config) => {
      if (!config.startTime) {
        config.startTime = now;
      }

      // Check if animation is complete
      const elapsed = now - config.startTime;
      if (elapsed >= config.duration) {
        this.removeAnimation(config.id);
      }
    });

    this.isProcessing = false;

    // Continue processing if queue is not empty
    if (this.animationQueue.length > 0) {
      this.scheduleRender();
    }
  }

  /**
   * Get priority value for sorting
   */
  private getPriorityValue(priority: AnimationConfig['priority']): number {
    const priorities = { critical: 4, high: 3, medium: 2, low: 1 };
    return priorities[priority];
  }

  /**
   * Get queue length
   */
  getQueueLength(): number {
    return this.animationQueue.length;
  }

  /**
   * Clear queue
   */
  clearQueue(): void {
    this.animationQueue = [];
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}

// ==============================================
// INTERSECTION OBSERVER FOR OFF-SCREEN ANIMATIONS
// ==============================================

class AnimationVisibilityManager {
  private observer: IntersectionObserver | null = null;
  private pausedAnimations = new Map<HTMLElement, Animation[]>();

  constructor() {
    this.createObserver();
  }

  /**
   * Create intersection observer
   */
  private createObserver(): void {
    if (typeof IntersectionObserver === 'undefined') return;

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const element = entry.target as HTMLElement;

          if (entry.isIntersecting) {
            this.resumeAnimations(element);
          } else {
            this.pauseAnimations(element);
          }
        });
      },
      {
        threshold: 0,
        rootMargin: '50px', // Start/stop animations slightly before/after visibility
      }
    );
  }

  /**
   * Observe element for visibility changes
   */
  observe(element: HTMLElement): void {
    this.observer?.observe(element);
  }

  /**
   * Stop observing element
   */
  unobserve(element: HTMLElement): void {
    this.observer?.unobserve(element);
    this.pausedAnimations.delete(element);
  }

  /**
   * Pause animations on element
   */
  private pauseAnimations(element: HTMLElement): void {
    const animations = element.getAnimations();
    if (animations.length > 0) {
      this.pausedAnimations.set(element, animations);
      animations.forEach((anim) => anim.pause());
    }
  }

  /**
   * Resume animations on element
   */
  private resumeAnimations(element: HTMLElement): void {
    const animations = this.pausedAnimations.get(element);
    if (animations) {
      animations.forEach((anim) => {
        if (anim.playState === 'paused') {
          anim.play();
        }
      });
      this.pausedAnimations.delete(element);
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.observer?.disconnect();
    this.pausedAnimations.clear();
  }
}

// ==============================================
// MAIN ANIMATION ENGINE
// ==============================================

export class AnimationEngine {
  private static gpuManager = new GPUAccelerationManager();
  private static frameBudget = new FrameBudgetSystem();
  private static reducedMotion = new ReducedMotionSystem();
  private static profiler = new AnimationProfiler();
  private static batchRenderer = new BatchRenderer();
  private static visibilityManager = new AnimationVisibilityManager();
  private static activeAnimations = new Set<string>();

  /**
   * Initialize animation engine
   */
  static initialize(config?: Partial<GPUAccelerationConfig>): void {
    // Enable profiler in development
    if (process.env.NODE_ENV === 'development') {
      this.profiler.enable();
      this.frameBudget.startMonitoring();
    }
  }

  /**
   * Prepare element for animation
   */
  static prepareAnimation(
    element: HTMLElement,
    properties: string[],
    config: Partial<AnimationConfig> = {}
  ): string {
    const id = config.id || `anim-${Date.now()}-${Math.random()}`;

    // Add will-change for GPU acceleration
    this.gpuManager.addWillChange(element, properties);

    // Check if composite-only
    const isCompositeOnly = this.gpuManager.isCompositeOnly(properties);

    // Add to batch renderer
    this.batchRenderer.addAnimation({
      id,
      priority: config.priority || 'medium',
      duration: config.duration || 300,
      element,
      isCompositeOnly,
    });

    // Observe for visibility
    this.visibilityManager.observe(element);

    // Track active animation
    this.activeAnimations.add(id);

    // Start profiling
    this.profiler.startProfile(id);

    return id;
  }

  /**
   * Complete animation
   */
  static completeAnimation(id: string, element?: HTMLElement): void {
    this.activeAnimations.delete(id);
    this.batchRenderer.removeAnimation(id);

    if (element) {
      this.gpuManager.removeWillChange(element);
      this.visibilityManager.unobserve(element);
    }

    // End profiling
    const fps = this.frameBudget.getCurrentFPS();
    this.profiler.endProfile(id, {
      duration: 0,
      fps,
      jankCount: 0,
    });
  }

  /**
   * Get GPU manager
   */
  static getGPUManager(): GPUAccelerationManager {
    return this.gpuManager;
  }

  /**
   * Get frame budget system
   */
  static getFrameBudget(): FrameBudgetSystem {
    return this.frameBudget;
  }

  /**
   * Get reduced motion system
   */
  static getReducedMotion(): ReducedMotionSystem {
    return this.reducedMotion;
  }

  /**
   * Get profiler
   */
  static getProfiler(): AnimationProfiler {
    return this.profiler;
  }

  /**
   * Get batch renderer
   */
  static getBatchRenderer(): BatchRenderer {
    return this.batchRenderer;
  }

  /**
   * Get visibility manager
   */
  static getVisibilityManager(): AnimationVisibilityManager {
    return this.visibilityManager;
  }

  /**
   * Get active animation count
   */
  static getActiveAnimationCount(): number {
    return this.activeAnimations.size;
  }

  /**
   * Export performance report
   */
  static exportPerformanceReport(): {
    profiler: string;
    frameBudget: FrameBudgetMetrics[];
    deviceInfo: ReturnType<GPUAccelerationManager['getDeviceInfo']>;
  } {
    return {
      profiler: this.profiler.exportReport(),
      frameBudget: this.frameBudget.getMetrics(),
      deviceInfo: this.gpuManager.getDeviceInfo(),
    };
  }
}

// Initialize engine on module load
if (typeof window !== 'undefined') {
  AnimationEngine.initialize();
}

// ==============================================
// EXPORTS
// ==============================================

export default AnimationEngine;
