/**
 * Gesture Engine
 * Advanced touch gesture recognition with physics and momentum
 */

import { useEffect, useRef, useState, RefObject } from 'react';

// ==============================================
// TYPES & INTERFACES
// ==============================================

export interface Point {
  x: number;
  y: number;
}

export interface SwipeConfig {
  threshold?: number;
  velocity?: number;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

export interface PinchConfig {
  onPinchStart?: (scale: number) => void;
  onPinchMove?: (scale: number, center: Point) => void;
  onPinchEnd?: (scale: number) => void;
}

export interface DragConfig {
  bounds?: { x: [number, number]; y: [number, number] };
  momentum?: boolean;
  snapPoints?: Point[];
  axis?: 'x' | 'y' | 'both';
  onDragStart?: (position: Point) => void;
  onDragMove?: (position: Point, delta: Point) => void;
  onDragEnd?: (position: Point, velocity: Point) => void;
}

export interface LongPressConfig {
  delay?: number;
  onLongPress?: () => void;
  onCancel?: () => void;
}

export interface DoubleTapConfig {
  delay?: number;
  onDoubleTap?: () => void;
}

export interface GestureState {
  isActive: boolean;
  startPoint: Point | null;
  currentPoint: Point | null;
  velocity: Point;
  scale: number;
  distance: number;
}

// ==============================================
// PHYSICS ENGINE
// ==============================================

export class PhysicsEngine {
  /**
   * Spring animation with configurable tension and friction
   */
  static spring(
    current: number,
    target: number,
    velocity: number,
    tension = 170,
    friction = 26,
    mass = 1
  ): { position: number; velocity: number } {
    const springForce = -tension * (current - target);
    const dampingForce = -friction * velocity;
    const acceleration = (springForce + dampingForce) / mass;

    const newVelocity = velocity + acceleration * (1 / 60); // 60 FPS
    const newPosition = current + newVelocity * (1 / 60);

    return {
      position: newPosition,
      velocity: newVelocity,
    };
  }

  /**
   * Momentum scrolling with iOS-style deceleration
   */
  static momentum(
    velocity: number,
    friction = 0.95,
    threshold = 0.5
  ): { velocity: number; shouldContinue: boolean } {
    const newVelocity = velocity * friction;
    const shouldContinue = Math.abs(newVelocity) > threshold;

    return {
      velocity: newVelocity,
      shouldContinue,
    };
  }

  /**
   * Rubberband physics for boundary bounce
   */
  static rubberband(
    position: number,
    boundary: number,
    dimension: number,
    constant = 0.15
  ): number {
    const distance = Math.abs(position - boundary);
    if (distance === 0) return boundary;

    const rubberband = (distance * dimension * constant) / (distance + dimension * constant);
    return position < boundary ? boundary - rubberband : boundary + rubberband;
  }

  /**
   * Find nearest snap point
   */
  static findNearestSnapPoint(
    position: Point,
    snapPoints: Point[],
    threshold = Infinity
  ): Point | null {
    if (snapPoints.length === 0) return null;

    let nearest = snapPoints[0];
    let minDistance = this.distance(position, nearest);

    for (let i = 1; i < snapPoints.length; i++) {
      const distance = this.distance(position, snapPoints[i]);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = snapPoints[i];
      }
    }

    return minDistance <= threshold ? nearest : null;
  }

  /**
   * Calculate distance between two points
   */
  static distance(p1: Point, p2: Point): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }

  /**
   * Clamp value between min and max
   */
  static clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  /**
   * Calculate velocity-based throw animation
   */
  static calculateThrow(
    position: number,
    velocity: number,
    friction = 0.95,
    dt = 1 / 60
  ): { finalPosition: number; duration: number } {
    let pos = position;
    let vel = velocity;
    let time = 0;

    while (Math.abs(vel) > 0.5) {
      vel *= friction;
      pos += vel * dt;
      time += dt;
    }

    return {
      finalPosition: pos,
      duration: time * 1000,
    };
  }
}

// ==============================================
// GESTURE STATE MACHINE
// ==============================================

export enum GesturePhase {
  Idle = 'idle',
  Recognizing = 'recognizing',
  Active = 'active',
  Ended = 'ended',
  Cancelled = 'cancelled',
}

export class GestureStateMachine {
  private phase: GesturePhase = GesturePhase.Idle;
  private listeners: Set<(phase: GesturePhase) => void> = new Set();

  getPhase(): GesturePhase {
    return this.phase;
  }

  transition(newPhase: GesturePhase): void {
    if (this.phase !== newPhase) {
      this.phase = newPhase;
      this.listeners.forEach((listener) => listener(newPhase));
    }
  }

  addListener(listener: (phase: GesturePhase) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  reset(): void {
    this.transition(GesturePhase.Idle);
  }
}

// ==============================================
// SWIPE GESTURE HOOK
// ==============================================

export function useSwipe(
  ref: RefObject<HTMLElement>,
  config: SwipeConfig = {}
): GestureState {
  const {
    threshold = 50,
    velocity = 0.5,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
  } = config;

  const [state, setState] = useState<GestureState>({
    isActive: false,
    startPoint: null,
    currentPoint: null,
    velocity: { x: 0, y: 0 },
    scale: 1,
    distance: 0,
  });

  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let startPoint: Point | null = null;
    let lastPoint: Point | null = null;
    let lastTime = 0;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      startPoint = { x: touch.clientX, y: touch.clientY };
      lastPoint = startPoint;
      startTimeRef.current = Date.now();
      lastTime = startTimeRef.current;

      setState((prev) => ({
        ...prev,
        isActive: true,
        startPoint,
        currentPoint: startPoint,
      }));
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!startPoint) return;

      const touch = e.touches[0];
      const currentPoint = { x: touch.clientX, y: touch.clientY };
      const now = Date.now();
      const dt = now - lastTime;

      // Calculate velocity
      const velocityX = lastPoint
        ? (currentPoint.x - lastPoint.x) / dt
        : 0;
      const velocityY = lastPoint
        ? (currentPoint.y - lastPoint.y) / dt
        : 0;

      setState((prev) => ({
        ...prev,
        currentPoint,
        velocity: { x: velocityX, y: velocityY },
        distance: PhysicsEngine.distance(startPoint, currentPoint),
      }));

      lastPoint = currentPoint;
      lastTime = now;
    };

    const handleTouchEnd = () => {
      if (!startPoint || !lastPoint) return;

      const deltaX = lastPoint.x - startPoint.x;
      const deltaY = lastPoint.y - startPoint.y;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // Determine swipe direction
      if (absX > threshold || absY > threshold) {
        if (absX > absY) {
          // Horizontal swipe
          if (deltaX > 0) {
            onSwipeRight?.();
          } else {
            onSwipeLeft?.();
          }
        } else {
          // Vertical swipe
          if (deltaY > 0) {
            onSwipeDown?.();
          } else {
            onSwipeUp?.();
          }
        }
      }

      setState((prev) => ({
        ...prev,
        isActive: false,
        startPoint: null,
        currentPoint: null,
      }));
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [ref, threshold, velocity, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  return state;
}

// ==============================================
// PINCH GESTURE HOOK
// ==============================================

export function usePinch(
  ref: RefObject<HTMLElement>,
  config: PinchConfig = {}
): { scale: number; center: Point | null; isActive: boolean } {
  const { onPinchStart, onPinchMove, onPinchEnd } = config;

  const [state, setState] = useState<{
    scale: number;
    center: Point | null;
    isActive: boolean;
  }>({
    scale: 1,
    center: null,
    isActive: false,
  });

  const initialDistanceRef = useRef<number>(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const getDistance = (touches: TouchList): number => {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const getCenter = (touches: TouchList): Point => {
      return {
        x: (touches[0].clientX + touches[1].clientX) / 2,
        y: (touches[0].clientY + touches[1].clientY) / 2,
      };
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 2) return;

      initialDistanceRef.current = getDistance(e.touches);
      const center = getCenter(e.touches);

      setState({ scale: 1, center, isActive: true });
      onPinchStart?.(1);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || !state.isActive) return;

      const currentDistance = getDistance(e.touches);
      const scale = currentDistance / initialDistanceRef.current;
      const center = getCenter(e.touches);

      setState({ scale, center, isActive: true });
      onPinchMove?.(scale, center);
    };

    const handleTouchEnd = () => {
      if (!state.isActive) return;

      onPinchEnd?.(state.scale);
      setState({ scale: 1, center: null, isActive: false });
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [ref, onPinchStart, onPinchMove, onPinchEnd, state.isActive]);

  return state;
}

// ==============================================
// DRAG GESTURE HOOK
// ==============================================

export function useDrag(
  ref: RefObject<HTMLElement>,
  config: DragConfig = {}
): {
  position: Point;
  isDragging: boolean;
  velocity: Point;
} {
  const {
    bounds,
    momentum = false,
    snapPoints = [],
    axis = 'both',
    onDragStart,
    onDragMove,
    onDragEnd,
  } = config;

  const [state, setState] = useState<{
    position: Point;
    isDragging: boolean;
    velocity: Point;
  }>({
    position: { x: 0, y: 0 },
    isDragging: false,
    velocity: { x: 0, y: 0 },
  });

  const startPosRef = useRef<Point>({ x: 0, y: 0 });
  const lastPosRef = useRef<Point>({ x: 0, y: 0 });
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const constrainPosition = (pos: Point): Point => {
      let { x, y } = pos;

      if (bounds) {
        if (axis === 'x' || axis === 'both') {
          x = PhysicsEngine.clamp(x, bounds.x[0], bounds.x[1]);
        }
        if (axis === 'y' || axis === 'both') {
          y = PhysicsEngine.clamp(y, bounds.y[0], bounds.y[1]);
        }
      }

      if (axis === 'x') y = 0;
      if (axis === 'y') x = 0;

      return { x, y };
    };

    const handlePointerDown = (e: PointerEvent) => {
      startPosRef.current = { x: e.clientX, y: e.clientY };
      lastPosRef.current = startPosRef.current;
      lastTimeRef.current = Date.now();

      setState((prev) => ({
        ...prev,
        isDragging: true,
      }));

      onDragStart?.(state.position);
      element.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!state.isDragging) return;

      const now = Date.now();
      const dt = now - lastTimeRef.current;

      const delta = {
        x: e.clientX - lastPosRef.current.x,
        y: e.clientY - lastPosRef.current.y,
      };

      const velocity = {
        x: delta.x / dt,
        y: delta.y / dt,
      };

      const newPosition = constrainPosition({
        x: state.position.x + delta.x,
        y: state.position.y + delta.y,
      });

      setState((prev) => ({
        ...prev,
        position: newPosition,
        velocity,
      }));

      onDragMove?.(newPosition, delta);

      lastPosRef.current = { x: e.clientX, y: e.clientY };
      lastTimeRef.current = now;
    };

    const handlePointerUp = () => {
      if (!state.isDragging) return;

      let finalPosition = state.position;

      // Apply momentum
      if (momentum && (Math.abs(state.velocity.x) > 1 || Math.abs(state.velocity.y) > 1)) {
        const throwX = PhysicsEngine.calculateThrow(state.position.x, state.velocity.x);
        const throwY = PhysicsEngine.calculateThrow(state.position.y, state.velocity.y);

        finalPosition = constrainPosition({
          x: throwX.finalPosition,
          y: throwY.finalPosition,
        });
      }

      // Snap to nearest snap point
      const snapPoint = PhysicsEngine.findNearestSnapPoint(
        finalPosition,
        snapPoints,
        100
      );

      if (snapPoint) {
        finalPosition = snapPoint;
      }

      setState({
        position: finalPosition,
        isDragging: false,
        velocity: { x: 0, y: 0 },
      });

      onDragEnd?.(finalPosition, state.velocity);
    };

    element.addEventListener('pointerdown', handlePointerDown);
    element.addEventListener('pointermove', handlePointerMove);
    element.addEventListener('pointerup', handlePointerUp);
    element.addEventListener('pointercancel', handlePointerUp);

    return () => {
      element.removeEventListener('pointerdown', handlePointerDown);
      element.removeEventListener('pointermove', handlePointerMove);
      element.removeEventListener('pointerup', handlePointerUp);
      element.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [ref, bounds, momentum, snapPoints, axis, onDragStart, onDragMove, onDragEnd, state.isDragging, state.position, state.velocity]);

  return state;
}

// ==============================================
// LONG PRESS GESTURE HOOK
// ==============================================

export function useLongPress(
  ref: RefObject<HTMLElement>,
  config: LongPressConfig = {}
): { isPressed: boolean } {
  const { delay = 500, onLongPress, onCancel } = config;

  const [isPressed, setIsPressed] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleStart = () => {
      setIsPressed(true);

      timerRef.current = setTimeout(() => {
        onLongPress?.();
        // Trigger haptic feedback if available
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
      }, delay);
    };

    const handleEnd = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        if (isPressed) {
          onCancel?.();
        }
      }
      setIsPressed(false);
    };

    element.addEventListener('pointerdown', handleStart);
    element.addEventListener('pointerup', handleEnd);
    element.addEventListener('pointercancel', handleEnd);
    element.addEventListener('pointerleave', handleEnd);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      element.removeEventListener('pointerdown', handleStart);
      element.removeEventListener('pointerup', handleEnd);
      element.removeEventListener('pointercancel', handleEnd);
      element.removeEventListener('pointerleave', handleEnd);
    };
  }, [ref, delay, onLongPress, onCancel, isPressed]);

  return { isPressed };
}

// ==============================================
// DOUBLE TAP GESTURE HOOK
// ==============================================

export function useDoubleTap(
  ref: RefObject<HTMLElement>,
  config: DoubleTapConfig = {}
): { lastTap: number } {
  const { delay = 300, onDoubleTap } = config;

  const [lastTap, setLastTap] = useState(0);
  const lastTapTimeRef = useRef(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleClick = () => {
      const now = Date.now();
      const timeSinceLastTap = now - lastTapTimeRef.current;

      if (timeSinceLastTap < delay && timeSinceLastTap > 0) {
        onDoubleTap?.();
        setLastTap(now);
        lastTapTimeRef.current = 0; // Reset to prevent triple tap
      } else {
        lastTapTimeRef.current = now;
      }
    };

    element.addEventListener('click', handleClick);

    return () => {
      element.removeEventListener('click', handleClick);
    };
  }, [ref, delay, onDoubleTap]);

  return { lastTap };
}

// ==============================================
// EXPORTS
// ==============================================

export default {
  PhysicsEngine,
  GestureStateMachine,
  GesturePhase,
  useSwipe,
  usePinch,
  useDrag,
  useLongPress,
  useDoubleTap,
};
