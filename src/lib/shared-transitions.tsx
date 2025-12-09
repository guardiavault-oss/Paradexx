/**
 * Shared Element Transitions
 * FLIP-based hero transitions for smooth element morphing between routes
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';

// ==============================================
// TYPES & INTERFACES
// ==============================================

export interface ElementSnapshot {
  id: string;
  element: HTMLElement;
  rect: DOMRect;
  computedStyle: CSSStyleDeclaration;
}

export interface TransitionConfig {
  duration?: number;
  easing?: string;
  zIndex?: number;
  onStart?: () => void;
  onComplete?: () => void;
}

export interface SharedElementContextValue {
  registerElement: (id: string, element: HTMLElement) => void;
  unregisterElement: (id: string) => void;
  getSnapshot: (id: string) => ElementSnapshot | null;
  createTransition: (id: string, config?: TransitionConfig) => void;
}

// ==============================================
// CONTEXT
// ==============================================

const SharedElementContext = createContext<SharedElementContextValue | null>(
  null
);

export function useSharedElement() {
  const context = useContext(SharedElementContext);
  if (!context) {
    throw new Error(
      'useSharedElement must be used within SharedElementProvider'
    );
  }
  return context;
}

// ==============================================
// FLIP TECHNIQUE UTILITIES
// ==============================================

export class FLIPTransition {
  /**
   * Calculate FLIP (First, Last, Invert, Play) animation
   */
  static create(
    element: HTMLElement,
    from: DOMRect,
    to: DOMRect,
    config: TransitionConfig = {}
  ): Animation {
    const {
      duration = 400,
      easing = 'cubic-bezier(0.4, 0, 0.2, 1)',
      zIndex = 9999,
    } = config;

    // Calculate deltas
    const deltaX = from.left - to.left;
    const deltaY = from.top - to.top;
    const deltaW = from.width / to.width;
    const deltaH = from.height / to.height;

    // Get border radius from computed styles
    const fromStyle = window.getComputedStyle(element);
    const fromBorderRadius = fromStyle.borderRadius;

    // Apply starting styles
    element.style.zIndex = String(zIndex);
    element.style.transformOrigin = 'top left';

    // Create animation
    const animation = element.animate(
      [
        {
          transform: `translate(${deltaX}px, ${deltaY}px) scale(${deltaW}, ${deltaH})`,
          borderRadius: fromBorderRadius,
        },
        {
          transform: 'translate(0, 0) scale(1, 1)',
          borderRadius: window.getComputedStyle(element).borderRadius,
        },
      ],
      {
        duration,
        easing,
        fill: 'both',
      }
    );

    // Cleanup after animation
    animation.onfinish = () => {
      element.style.zIndex = '';
      element.style.transformOrigin = '';
    };

    return animation;
  }

  /**
   * Morph border radius between two elements
   */
  static morphBorderRadius(
    element: HTMLElement,
    fromRadius: string,
    toRadius: string,
    duration: number,
    easing: string
  ): Animation {
    return element.animate(
      [{ borderRadius: fromRadius }, { borderRadius: toRadius }],
      { duration, easing, fill: 'both' }
    );
  }

  /**
   * Cross-fade non-morphable content
   */
  static crossFade(
    fromElement: HTMLElement,
    toElement: HTMLElement,
    duration: number,
    easing: string
  ): { from: Animation; to: Animation } {
    const fromAnimation = fromElement.animate(
      [{ opacity: 1 }, { opacity: 0 }],
      { duration: duration / 2, easing, fill: 'both' }
    );

    const toAnimation = toElement.animate(
      [{ opacity: 0 }, { opacity: 1 }],
      { duration: duration / 2, easing, fill: 'both', delay: duration / 2 }
    );

    return { from: fromAnimation, to: toAnimation };
  }

  /**
   * Create clone for transition
   */
  static createClone(element: HTMLElement): HTMLElement {
    const clone = element.cloneNode(true) as HTMLElement;
    const rect = element.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(element);

    // Position clone at exact same location
    clone.style.position = 'fixed';
    clone.style.top = `${rect.top}px`;
    clone.style.left = `${rect.left}px`;
    clone.style.width = `${rect.width}px`;
    clone.style.height = `${rect.height}px`;
    clone.style.margin = '0';
    clone.style.padding = computedStyle.padding;
    clone.style.borderRadius = computedStyle.borderRadius;
    clone.style.pointerEvents = 'none';
    clone.style.zIndex = '9999';

    return clone;
  }
}

// ==============================================
// SHARED ELEMENT PROVIDER
// ==============================================

interface SharedElementProviderProps {
  children: ReactNode;
}

export function SharedElementProvider({
  children,
}: SharedElementProviderProps) {
  const elementsRef = useRef<Map<string, HTMLElement>>(new Map());
  const snapshotsRef = useRef<Map<string, ElementSnapshot>>(new Map());
  const activeTransitionsRef = useRef<Map<string, Animation>>(new Map());

  const registerElement = (id: string, element: HTMLElement) => {
    elementsRef.current.set(id, element);

    // Take snapshot
    const rect = element.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(element);

    snapshotsRef.current.set(id, {
      id,
      element,
      rect,
      computedStyle,
    });
  };

  const unregisterElement = (id: string) => {
    // Cancel any active transition
    const activeTransition = activeTransitionsRef.current.get(id);
    if (activeTransition) {
      activeTransition.cancel();
      activeTransitionsRef.current.delete(id);
    }

    elementsRef.current.delete(id);
    snapshotsRef.current.delete(id);
  };

  const getSnapshot = (id: string): ElementSnapshot | null => {
    return snapshotsRef.current.get(id) || null;
  };

  const createTransition = (id: string, config: TransitionConfig = {}) => {
    const element = elementsRef.current.get(id);
    const snapshot = snapshotsRef.current.get(id);

    if (!element || !snapshot) {
      console.warn(`Cannot create transition for ${id}: element or snapshot not found`);
      return;
    }

    // Cancel any existing transition
    const existingTransition = activeTransitionsRef.current.get(id);
    if (existingTransition) {
      existingTransition.cancel();
    }

    // Get current rect
    const currentRect = element.getBoundingClientRect();

    // Create FLIP transition
    config.onStart?.();
    const animation = FLIPTransition.create(
      element,
      snapshot.rect,
      currentRect,
      config
    );

    activeTransitionsRef.current.set(id, animation);

    animation.onfinish = () => {
      activeTransitionsRef.current.delete(id);
      config.onComplete?.();
    };
  };

  const value: SharedElementContextValue = {
    registerElement,
    unregisterElement,
    getSnapshot,
    createTransition,
  };

  return (
    <SharedElementContext.Provider value={value}>
      {children}
    </SharedElementContext.Provider>
  );
}

// ==============================================
// SHARED ELEMENT COMPONENT
// ==============================================

export interface SharedElementProps {
  id: string;
  children: ReactNode;
  config?: TransitionConfig;
}

export function SharedElement({ id, children, config }: SharedElementProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { registerElement, unregisterElement, createTransition } =
    useSharedElement();

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Register element on mount
    registerElement(id, element);

    // Check if transition should start
    const shouldTransition = sessionStorage.getItem(`transition-${id}`);
    if (shouldTransition) {
      sessionStorage.removeItem(`transition-${id}`);
      // Wait for next frame to ensure layout is complete
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          createTransition(id, config);
        });
      });
    }

    return () => {
      unregisterElement(id);
    };
  }, [id, registerElement, unregisterElement, createTransition, config]);

  const handleClick = () => {
    // Mark that this element should transition
    sessionStorage.setItem(`transition-${id}`, 'true');
  };

  return (
    <div ref={ref} onClick={handleClick} data-shared-element-id={id}>
      {children}
    </div>
  );
}

// ==============================================
// LIST TO DETAIL TRANSITION
// ==============================================

export interface ListToDetailConfig {
  itemId: string;
  expandDuration?: number;
  fadeDuration?: number;
  stagger?: number;
}

export function useListToDetail(config: ListToDetailConfig) {
  const {
    itemId,
    expandDuration = 400,
    fadeDuration = 200,
    stagger = 50,
  } = config;

  const { getSnapshot, createTransition } = useSharedElement();

  const animateToDetail = () => {
    const snapshot = getSnapshot(itemId);
    if (!snapshot) return;

    // Fade out other items with stagger
    const allItems = document.querySelectorAll('[data-list-item]');
    allItems.forEach((item, index) => {
      if (item.getAttribute('data-item-id') !== itemId) {
        const delay = index * stagger;
        (item as HTMLElement).animate([{ opacity: 1 }, { opacity: 0 }], {
          duration: fadeDuration,
          delay,
          fill: 'forwards',
          easing: 'ease-out',
        });
      }
    });

    // Expand selected item
    createTransition(itemId, {
      duration: expandDuration,
      onComplete: () => {
        // Navigation should happen here
      },
    });
  };

  const animateBack = () => {
    // Reverse animation
    createTransition(itemId, {
      duration: expandDuration,
      onComplete: () => {
        // Fade in other items
        const allItems = document.querySelectorAll('[data-list-item]');
        allItems.forEach((item, index) => {
          const delay = (allItems.length - index) * stagger;
          (item as HTMLElement).animate([{ opacity: 0 }, { opacity: 1 }], {
            duration: fadeDuration,
            delay,
            fill: 'forwards',
            easing: 'ease-in',
          });
        });
      },
    });
  };

  return {
    animateToDetail,
    animateBack,
  };
}

// ==============================================
// DEBUG MODE
// ==============================================

export function useSharedElementDebug(enabled: boolean = false) {
  useEffect(() => {
    if (!enabled || typeof document === 'undefined') return;

    const style = document.createElement('style');
    style.id = 'shared-element-debug';
    style.textContent = `
      [data-shared-element-id] {
        outline: 2px dashed rgba(255, 0, 0, 0.5) !important;
        outline-offset: 2px;
      }
      [data-shared-element-id]::before {
        content: attr(data-shared-element-id);
        position: absolute;
        top: -20px;
        left: 0;
        background: rgba(255, 0, 0, 0.8);
        color: white;
        padding: 2px 6px;
        font-size: 10px;
        font-family: monospace;
        z-index: 99999;
        pointer-events: none;
      }
    `;

    document.head.appendChild(style);

    return () => {
      style.remove();
    };
  }, [enabled]);
}

// ==============================================
// INTERRUPTION HANDLING
// ==============================================

export class TransitionInterruptionHandler {
  private activeTransitions = new Map<string, Animation>();

  startTransition(id: string, animation: Animation): void {
    // Cancel existing transition if any
    const existing = this.activeTransitions.get(id);
    if (existing && existing.playState === 'running') {
      // Smoothly interrupt by getting current transform
      const element = (animation as any).effect?.target as HTMLElement;
      if (element) {
        const transform = window.getComputedStyle(element).transform;
        existing.cancel();
        element.style.transform = transform;
      }
    }

    this.activeTransitions.set(id, animation);

    animation.onfinish = () => {
      this.activeTransitions.delete(id);
    };

    animation.oncancel = () => {
      this.activeTransitions.delete(id);
    };
  }

  cancelTransition(id: string): void {
    const animation = this.activeTransitions.get(id);
    if (animation) {
      animation.cancel();
      this.activeTransitions.delete(id);
    }
  }

  cancelAll(): void {
    this.activeTransitions.forEach((animation) => animation.cancel());
    this.activeTransitions.clear();
  }
}

// ==============================================
// EXPORTS
// ==============================================

export default {
  SharedElementProvider,
  SharedElement,
  useSharedElement,
  useListToDetail,
  useSharedElementDebug,
  FLIPTransition,
  TransitionInterruptionHandler,
};
