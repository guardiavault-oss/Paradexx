import { logger } from '../services/logger.service';
// Haptic feedback utilities for transaction feedback

export type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

export function triggerHaptic(pattern: HapticPattern) {
  if (!('vibrate' in navigator)) {
    logger.info('Vibration API not supported');
    return;
  }

  const patterns: Record<HapticPattern, number | number[]> = {
    light: 10,
    medium: 20,
    heavy: 50,
    success: [10, 5, 10],
    warning: [100, 50, 100],
    error: [100, 50, 100, 50, 100]
  };

  navigator.vibrate(patterns[pattern]);
}

// Value-based haptics for transactions
export function triggerTransactionHaptic(amountUSD: number) {
  if (!('vibrate' in navigator)) return;

  if (amountUSD < 10) {
    // Light tap for small amounts
    navigator.vibrate(10);
  } else if (amountUSD < 100) {
    // Medium tap
    navigator.vibrate(20);
  } else if (amountUSD < 1000) {
    // Double pulse
    navigator.vibrate([30, 20, 30]);
  } else {
    // Heavy double-pulse heartbeat for large amounts
    navigator.vibrate([50, 30, 50]);
  }
}

// Transaction signing "satisfaction click"
export function triggerSignatureHaptic() {
  if (!('vibrate' in navigator)) return;
  
  // Heavy impact for signature confirmation
  navigator.vibrate(50);
}

// Play transaction sound
export function playTransactionSound(type: 'success' | 'error' = 'success') {
  // Create audio context for metallic click sound
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  if (type === 'success') {
    // Metallic click/lock sound
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  } else {
    // Error sound - lower pitch
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 200;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  }
}

// Combined transaction confirmation feedback
export function triggerTransactionConfirmation(amountUSD: number) {
  triggerTransactionHaptic(amountUSD);
  playTransactionSound('success');
}
