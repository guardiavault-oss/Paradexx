/**
 * Frontend Biometric Data Collection
 * Collects typing patterns and mouse movements for verification
 */

export interface TypingPattern {
  keystrokeDynamics: Array<{
    key: string;
    keyDown: number;
    keyUp: number;
    dwellTime: number;
    flightTime: number;
  }>;
}

export interface MouseMovement {
  movements: Array<{
    x: number;
    y: number;
    timestamp: number;
    velocity: number;
    acceleration: number;
  }>;
}

export interface InteractionSignature {
  typingPattern?: TypingPattern;
  mouseMovement?: MouseMovement;
  scrollBehavior?: {
    scrollSpeed: number;
    scrollPattern: "smooth" | "jerky" | "fast";
  };
  clickPattern?: {
    clickDuration: number[];
    doubleClickInterval: number[];
  };
}

/**
 * Collect typing pattern during text input
 */
export class BiometricCollector {
  private typingData: Map<string, { keyDown: number; keyUp: number | null }> = new Map();
  private mouseMovements: Array<{ x: number; y: number; timestamp: number }> = [];
  private lastMousePosition: { x: number; y: number; timestamp: number } | null = null;
  
  /**
   * Start collecting typing pattern for an input field
   */
  setupTypingCollection(inputElement: HTMLInputElement | HTMLTextAreaElement): () => TypingPattern | null {
    const keystrokeDynamics: TypingPattern['keystrokeDynamics'] = [];
    
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      const now = performance.now();
      
      // Store keydown time
      if (!this.typingData.has(key)) {
        this.typingData.set(key, { keyDown: now, keyUp: null });
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key;
      const now = performance.now();
      const data = this.typingData.get(key);
      
      if (data && data.keyDown) {
        const keyDown = data.keyDown;
        const keyUp = now;
        const dwellTime = keyUp - keyDown;
        
        // Calculate flight time (time between this key and previous key)
        const previousKeyTime = Array.from(this.typingData.values())
          .filter(d => d.keyUp !== null)
          .map(d => d.keyUp!)
          .sort((a, b) => b - a)[0] || keyDown;
        
        const flightTime = keyDown - previousKeyTime;
        
        keystrokeDynamics.push({
          key,
          keyDown,
          keyUp,
          dwellTime,
          flightTime: flightTime > 0 ? flightTime : 0,
        });
        
        this.typingData.delete(key);
      }
    };
    
    inputElement.addEventListener('keydown', handleKeyDown as EventListener);
    inputElement.addEventListener('keyup', handleKeyUp as EventListener);
    
    // Return cleanup function that also returns collected data
    return () => {
      inputElement.removeEventListener('keydown', handleKeyDown as EventListener);
      inputElement.removeEventListener('keyup', handleKeyUp as EventListener);
      
      if (keystrokeDynamics.length >= 10) {
        // Minimum 10 keystrokes for meaningful pattern
        return { keystrokeDynamics };
      }
      return null;
    };
  }
  
  /**
   * Start collecting mouse movements
   */
  setupMouseCollection(): () => MouseMovement | null {
    const movements: MouseMovement['movements'] = [];
    
    const handleMouseMove = (e: MouseEvent) => {
      const now = performance.now();
      const x = e.clientX;
      const y = e.clientY;
      
      let velocity = 0;
      let acceleration = 0;
      
      if (this.lastMousePosition) {
        const timeDelta = now - this.lastMousePosition.timestamp;
        const dx = x - this.lastMousePosition.x;
        const dy = y - this.lastMousePosition.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        velocity = timeDelta > 0 ? distance / timeDelta : 0;
        
        // Calculate acceleration (simplified)
        if (movements.length > 0) {
          const lastVelocity = movements[movements.length - 1].velocity;
          acceleration = timeDelta > 0 ? (velocity - lastVelocity) / timeDelta : 0;
        }
      }
      
      movements.push({
        x,
        y,
        timestamp: now,
        velocity,
        acceleration,
      });
      
      this.lastMousePosition = { x, y, timestamp: now };
      
      // Limit to last 100 movements for performance
      if (movements.length > 100) {
        movements.shift();
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      
      if (movements.length >= 20) {
        // Minimum 20 movements for meaningful pattern
        return { movements };
      }
      return null;
    };
  }
  
  /**
   * Collect complete interaction signature
   * Returns signature for biometric verification
   */
  async collectSignature(
    inputElement?: HTMLInputElement | HTMLTextAreaElement,
    duration: number = 5000 // 5 seconds of collection
  ): Promise<InteractionSignature> {
    const signature: InteractionSignature = {};
    
    // Setup typing collection if input provided
    let typingCleanup: (() => TypingPattern | null) | null = null;
    if (inputElement) {
      typingCleanup = this.setupTypingCollection(inputElement);
    }
    
    // Setup mouse collection
    const mouseCleanup = this.setupMouseCollection();
    
    // Collect for specified duration
    await new Promise(resolve => setTimeout(resolve, duration));
    
    // Get collected data
    if (typingCleanup) {
      const typingPattern = typingCleanup();
      if (typingPattern) {
        signature.typingPattern = typingPattern;
      }
    }
    
    const mouseMovement = mouseCleanup();
    if (mouseMovement) {
      signature.mouseMovement = mouseMovement;
    }
    
    return signature;
  }
  
  /**
   * Reset collector state
   */
  reset(): void {
    this.typingData.clear();
    this.mouseMovements = [];
    this.lastMousePosition = null;
  }
}

export const biometricCollector = new BiometricCollector();

