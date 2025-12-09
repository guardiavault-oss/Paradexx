/**
 * Celebration System
 * Delightful animations and effects for user achievements and successes
 */

import { useCallback, useEffect, useRef, useState } from 'react';

// ==============================================
// TYPES & INTERFACES
// ==============================================

export type CelebrationType =
  | 'confetti'
  | 'fireworks'
  | 'coinRain'
  | 'glow'
  | 'shake'
  | 'achievement';

export interface CelebrationConfig {
  intensity?: 'low' | 'medium' | 'high';
  duration?: number;
  colors?: string[];
  sound?: boolean;
  reducedMotion?: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  rotation: number;
  rotationSpeed: number;
}

// ==============================================
// PARTICLE SYSTEM
// ==============================================

class ParticleSystem {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private particles: Particle[] = [];
  private animationId: number | null = null;
  private startTime = 0;
  private duration = 0;

  constructor() {
    this.createCanvas();
  }

  /**
   * Create overlay canvas
   */
  private createCanvas(): void {
    if (typeof document === 'undefined') return;

    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 999999;
    `;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    this.ctx = this.canvas.getContext('2d');

    // Handle resize
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  /**
   * Handle window resize
   */
  private handleResize(): void {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  /**
   * Show canvas
   */
  private show(): void {
    if (!this.canvas || !document.body) return;
    if (!this.canvas.parentElement) {
      document.body.appendChild(this.canvas);
    }
  }

  /**
   * Hide canvas
   */
  private hide(): void {
    if (!this.canvas) return;
    if (this.canvas.parentElement) {
      this.canvas.parentElement.removeChild(this.canvas);
    }
  }

  /**
   * Create confetti particles
   */
  createConfetti(
    count: number,
    colors: string[],
    origin: { x: number; y: number } = { x: 0.5, y: 0.5 }
  ): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 3 + Math.random() * 5;

      this.particles.push({
        x: width * origin.x,
        y: height * origin.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 6 + Math.random() * 4,
        life: 1,
        maxLife: 1,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
      });
    }
  }

  /**
   * Create fireworks particles
   */
  createFireworks(colors: string[]): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Random position in upper half
    const x = width * (0.2 + Math.random() * 0.6);
    const y = height * (0.2 + Math.random() * 0.3);

    // Create explosion
    const particleCount = 50 + Math.floor(Math.random() * 50);
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = 2 + Math.random() * 4;

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 3,
        life: 1,
        maxLife: 1,
        rotation: 0,
        rotationSpeed: 0,
      });
    }
  }

  /**
   * Create coin rain
   */
  createCoinRain(count: number, colors: string[]): void {
    const width = window.innerWidth;

    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * width,
        y: -20,
        vx: (Math.random() - 0.5) * 2,
        vy: 2 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 12 + Math.random() * 8,
        life: 1,
        maxLife: 1,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.3,
      });
    }
  }

  /**
   * Update particle physics
   */
  private updateParticles(deltaTime: number): void {
    const gravity = 0.3;

    this.particles = this.particles.filter((particle) => {
      // Apply physics
      particle.vy += gravity * deltaTime;
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.rotation += particle.rotationSpeed;

      // Update life
      particle.life -= deltaTime / 60;

      // Remove dead particles or off-screen
      return (
        particle.life > 0 &&
        particle.y < window.innerHeight + 100 &&
        particle.x > -100 &&
        particle.x < window.innerWidth + 100
      );
    });
  }

  /**
   * Render particles
   */
  private renderParticles(): void {
    if (!this.ctx || !this.canvas) return;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw particles
    this.particles.forEach((particle) => {
      if (!this.ctx) return;

      this.ctx.save();
      this.ctx.translate(particle.x, particle.y);
      this.ctx.rotate(particle.rotation);
      this.ctx.globalAlpha = particle.life;

      // Draw as rectangle
      this.ctx.fillStyle = particle.color;
      this.ctx.fillRect(
        -particle.size / 2,
        -particle.size / 2,
        particle.size,
        particle.size / 2
      );

      this.ctx.restore();
    });
  }

  /**
   * Animation loop
   */
  private animate(timestamp: number): void {
    if (this.startTime === 0) this.startTime = timestamp;
    const elapsed = timestamp - this.startTime;

    if (elapsed >= this.duration && this.particles.length === 0) {
      this.stop();
      return;
    }

    this.updateParticles(1);
    this.renderParticles();

    this.animationId = requestAnimationFrame(this.animate.bind(this));
  }

  /**
   * Start celebration
   */
  start(duration: number): void {
    this.duration = duration;
    this.startTime = 0;
    this.show();

    if (this.animationId === null) {
      this.animationId = requestAnimationFrame(this.animate.bind(this));
    }
  }

  /**
   * Stop celebration
   */
  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.particles = [];
    this.hide();
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stop();
    window.removeEventListener('resize', this.handleResize.bind(this));
    this.canvas?.remove();
  }
}

// ==============================================
// CELEBRATION MANAGER
// ==============================================

class CelebrationManager {
  private particleSystem: ParticleSystem;
  private lastCelebrationTime = 0;
  private throttleMs = 3000;
  private audioContext: AudioContext | null = null;
  private soundEnabled = true;
  private readonly STORAGE_KEY = 'celebration-preferences';

  constructor() {
    this.particleSystem = new ParticleSystem();
    this.loadPreferences();
  }

  /**
   * Load preferences from localStorage
   */
  private loadPreferences(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const prefs = JSON.parse(stored);
        this.soundEnabled = prefs.soundEnabled ?? true;
      }
    } catch (e) {
      console.warn('Failed to load celebration preferences:', e);
    }
  }

  /**
   * Save preferences to localStorage
   */
  private savePreferences(): void {
    try {
      localStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify({ soundEnabled: this.soundEnabled })
      );
    } catch (e) {
      console.warn('Failed to save celebration preferences:', e);
    }
  }

  /**
   * Check if should throttle
   */
  private shouldThrottle(): boolean {
    const now = Date.now();
    if (now - this.lastCelebrationTime < this.throttleMs) {
      return true;
    }
    this.lastCelebrationTime = now;
    return false;
  }

  /**
   * Get default colors for current theme
   */
  private getDefaultColors(): string[] {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return isDark
      ? ['#FFD700', '#FFA500', '#FF6347', '#FF69B4', '#9370DB']
      : ['#FFD700', '#FF6347', '#32CD32', '#1E90FF', '#FF69B4'];
  }

  /**
   * Play sound effect
   */
  private playSound(frequency: number, duration: number): void {
    if (!this.soundEnabled) return;

    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
      }

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext.currentTime + duration / 1000
      );

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration / 1000);
    } catch (e) {
      console.warn('Failed to play sound:', e);
    }
  }

  /**
   * Celebrate with confetti
   */
  confetti(config: CelebrationConfig = {}): void {
    if (this.shouldThrottle()) return;

    const {
      intensity = 'medium',
      duration = 3000,
      colors = this.getDefaultColors(),
      sound = true,
      reducedMotion = false,
    } = config;

    if (reducedMotion) {
      this.staticBadge('🎉');
      return;
    }

    const counts = { low: 30, medium: 60, high: 100 };
    this.particleSystem.createConfetti(counts[intensity], colors);
    this.particleSystem.start(duration);

    if (sound) {
      this.playSound(800, 200);
    }
  }

  /**
   * Celebrate with fireworks
   */
  fireworks(config: CelebrationConfig = {}): void {
    if (this.shouldThrottle()) return;

    const {
      intensity = 'medium',
      duration = 4000,
      colors = this.getDefaultColors(),
      sound = true,
      reducedMotion = false,
    } = config;

    if (reducedMotion) {
      this.staticBadge('🎆');
      return;
    }

    const bursts = { low: 2, medium: 4, high: 6 };
    const burstCount = bursts[intensity];

    // Create multiple firework bursts
    for (let i = 0; i < burstCount; i++) {
      setTimeout(() => {
        this.particleSystem.createFireworks(colors);
        if (sound) {
          this.playSound(600 + Math.random() * 400, 300);
        }
      }, (i * duration) / burstCount);
    }

    this.particleSystem.start(duration);
  }

  /**
   * Celebrate with coin rain
   */
  coinRain(config: CelebrationConfig = {}): void {
    if (this.shouldThrottle()) return;

    const {
      intensity = 'medium',
      duration = 3000,
      colors = ['#FFD700', '#FFA500', '#DAA520'],
      sound = true,
      reducedMotion = false,
    } = config;

    if (reducedMotion) {
      this.staticBadge('💰');
      return;
    }

    const counts = { low: 20, medium: 40, high: 60 };
    const interval = duration / counts[intensity];

    // Create coins at intervals
    for (let i = 0; i < counts[intensity]; i++) {
      setTimeout(() => {
        this.particleSystem.createCoinRain(1, colors);
        if (sound) {
          this.playSound(1000, 50);
        }
      }, i * interval);
    }

    this.particleSystem.start(duration);
  }

  /**
   * Subtle glow pulse
   */
  glow(element: HTMLElement, duration = 1000): void {
    const animation = element.animate(
      [
        { boxShadow: '0 0 0 rgba(59, 130, 246, 0)' },
        { boxShadow: '0 0 30px rgba(59, 130, 246, 0.8)' },
        { boxShadow: '0 0 0 rgba(59, 130, 246, 0)' },
      ],
      {
        duration,
        easing: 'ease-in-out',
      }
    );

    return animation.finished;
  }

  /**
   * Screen shake effect
   */
  shake(element: HTMLElement = document.body, intensity: 'low' | 'medium' | 'high' = 'medium'): void {
    const distances = { low: 5, medium: 10, high: 15 };
    const distance = distances[intensity];

    const keyframes = [
      { transform: 'translate(0, 0)' },
      { transform: `translate(-${distance}px, ${distance}px)` },
      { transform: `translate(${distance}px, -${distance}px)` },
      { transform: `translate(-${distance}px, -${distance}px)` },
      { transform: `translate(${distance}px, ${distance}px)` },
      { transform: 'translate(0, 0)' },
    ];

    element.animate(keyframes, {
      duration: 400,
      easing: 'ease-in-out',
    });
  }

  /**
   * Achievement badge (for reduced motion)
   */
  achievement(config: { badge: string; title: string }): void {
    this.staticBadge(config.badge, config.title);
    this.playSound(880, 200);
  }

  /**
   * Static badge for reduced motion
   */
  private staticBadge(emoji: string, title?: string): void {
    const badge = document.createElement('div');
    badge.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 64px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 32px;
      border-radius: 16px;
      z-index: 999999;
      text-align: center;
    `;

    badge.innerHTML = `
      <div style="font-size: 64px;">${emoji}</div>
      ${title ? `<div style="font-size: 18px; margin-top: 16px;">${title}</div>` : ''}
    `;

    document.body.appendChild(badge);

    setTimeout(() => {
      badge.style.transition = 'opacity 0.3s';
      badge.style.opacity = '0';
      setTimeout(() => badge.remove(), 300);
    }, 2000);
  }

  /**
   * Enable sound
   */
  enableSound(): void {
    this.soundEnabled = true;
    this.savePreferences();
  }

  /**
   * Disable sound
   */
  disableSound(): void {
    this.soundEnabled = false;
    this.savePreferences();
  }

  /**
   * Check if sound is enabled
   */
  isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.particleSystem.destroy();
  }
}

// Singleton instance
const celebrationManager = new CelebrationManager();

// ==============================================
// REACT HOOK
// ==============================================

export function useCelebrations() {
  const [soundEnabled, setSoundEnabled] = useState(() =>
    celebrationManager.isSoundEnabled()
  );

  const celebrate = useCallback(
    (type: CelebrationType, config: CelebrationConfig = {}) => {
      // Check for reduced motion
      const shouldReduce = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;

      const finalConfig = { ...config, reducedMotion: shouldReduce };

      switch (type) {
        case 'confetti':
          celebrationManager.confetti(finalConfig);
          break;
        case 'fireworks':
          celebrationManager.fireworks(finalConfig);
          break;
        case 'coinRain':
          celebrationManager.coinRain(finalConfig);
          break;
        case 'achievement':
          celebrationManager.achievement({
            badge: '🏆',
            title: 'Achievement Unlocked!',
          });
          break;
        default:
          break;
      }
    },
    []
  );

  const glowElement = useCallback((element: HTMLElement, duration?: number) => {
    return celebrationManager.glow(element, duration);
  }, []);

  const shakeElement = useCallback(
    (element?: HTMLElement, intensity?: 'low' | 'medium' | 'high') => {
      celebrationManager.shake(element, intensity);
    },
    []
  );

  const toggleSound = useCallback(() => {
    if (soundEnabled) {
      celebrationManager.disableSound();
      setSoundEnabled(false);
    } else {
      celebrationManager.enableSound();
      setSoundEnabled(true);
    }
  }, [soundEnabled]);

  return {
    celebrate,
    glow: glowElement,
    shake: shakeElement,
    soundEnabled,
    toggleSound,
  };
}

/**
 * Hook for milestone celebrations
 */
export function useMilestoneCelebration(
  value: number,
  milestones: number[],
  type: CelebrationType = 'confetti'
) {
  const { celebrate } = useCelebrations();
  const lastMilestoneRef = useRef<number>(0);

  useEffect(() => {
    const currentMilestone = milestones
      .filter((m) => value >= m)
      .sort((a, b) => b - a)[0];

    if (currentMilestone && currentMilestone > lastMilestoneRef.current) {
      celebrate(type, { intensity: 'high' });
      lastMilestoneRef.current = currentMilestone;
    }
  }, [value, milestones, type, celebrate]);
}

// ==============================================
// EXPORTS
// ==============================================

export { celebrationManager };
export default celebrationManager;
