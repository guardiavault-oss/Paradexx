import { useEffect, useState, useCallback } from 'react';
import { PerformanceMonitor, FPSMonitor, getDeviceCapabilities, getShaderQuality } from '../utils/performance';

// Global performance monitor instance
const perfMonitor = new PerformanceMonitor();
const fpsMonitor = new FPSMonitor();

export function usePerformanceMonitor(componentName: string) {
  useEffect(() => {
    perfMonitor.mark(`${componentName}-mount-start`);

    return () => {
      perfMonitor.mark(`${componentName}-mount-end`);
      perfMonitor.measure(
        `${componentName}-mount-time`,
        `${componentName}-mount-start`,
        `${componentName}-mount-end`
      );
    };
  }, [componentName]);

  const measure = useCallback((operationName: string, fn: () => void) => {
    perfMonitor.mark(`${operationName}-start`);
    fn();
    perfMonitor.mark(`${operationName}-end`);
    perfMonitor.measure(operationName, `${operationName}-start`, `${operationName}-end`);
  }, []);

  return { measure, getReport: () => perfMonitor.report() };
}

export function useFPS() {
  const [fps, setFps] = useState(60);

  useEffect(() => {
    let animationFrameId: number;

    const updateFPS = () => {
      fpsMonitor.tick();
      setFps(fpsMonitor.getAverageFPS());
      animationFrameId = requestAnimationFrame(updateFPS);
    };

    animationFrameId = requestAnimationFrame(updateFPS);

    return () => {
      cancelAnimationFrame(animationFrameId);
      fpsMonitor.reset();
    };
  }, []);

  return fps;
}

export function useDeviceCapabilities() {
  const [capabilities] = useState(() => getDeviceCapabilities());
  return capabilities;
}

export function useShaderQuality() {
  const [quality] = useState(() => getShaderQuality());
  return quality;
}

// Detect when the app is in the background
export function usePageVisibility() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
}

// Detect battery status
export function useBatteryStatus() {
  const [batteryStatus, setBatteryStatus] = useState({
    level: 1,
    charging: true,
  });

  useEffect(() => {
    if (!('getBattery' in navigator)) return;

    (navigator as any).getBattery().then((battery: any) => {
      const updateBattery = () => {
        setBatteryStatus({
          level: battery.level,
          charging: battery.charging,
        });
      };

      updateBattery();
      battery.addEventListener('chargingchange', updateBattery);
      battery.addEventListener('levelchange', updateBattery);

      return () => {
        battery.removeEventListener('chargingchange', updateBattery);
        battery.removeEventListener('levelchange', updateBattery);
      };
    });
  }, []);

  return batteryStatus;
}

// Adaptive quality based on battery and performance
export function useAdaptiveQuality() {
  const battery = useBatteryStatus();
  const fps = useFPS();
  const capabilities = useDeviceCapabilities();

  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('high');

  useEffect(() => {
    // Reduce quality if battery is low and not charging
    if (battery.level < 0.2 && !battery.charging) {
      setQuality('low');
      return;
    }

    // Reduce quality if FPS is dropping
    if (fps < 30) {
      setQuality('low');
      return;
    }

    if (fps < 50) {
      setQuality('medium');
      return;
    }

    // Use device capabilities to set initial quality
    if (capabilities.isLowEnd) {
      setQuality('low');
    } else if (capabilities.isMobile) {
      setQuality('medium');
    } else {
      setQuality('high');
    }
  }, [battery, fps, capabilities]);

  return quality;
}

// Network status hook
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
