import { logger } from '../services/logger.service';
// Debug log system for support and troubleshooting

interface ErrorLog {
  timestamp: number;
  code: string;
  message: string;
  context?: string;
}

interface SystemInfo {
  appVersion: string;
  userAgent: string;
  platform: string;
  language: string;
  screenResolution: string;
  timestamp: number;
}

const MAX_ERROR_LOGS = 10;
const ERROR_LOG_KEY = 'paradox_error_logs';

// Log an error (scrubbed of sensitive data)
export function logError(code: string, message: string, context?: string) {
  try {
    const logs = getErrorLogs();
    
    // Scrub sensitive data
    const scrubbedMessage = message
      .replace(/0x[a-fA-F0-9]{40}/g, '0x...REDACTED')  // Addresses
      .replace(/0x[a-fA-F0-9]{64}/g, '0x...PRIVATE_KEY_REDACTED')  // Private keys
      .replace(/Bearer\s+[A-Za-z0-9-._~+/]+=*/g, 'Bearer ...REDACTED');  // Auth tokens
    
    const newLog: ErrorLog = {
      timestamp: Date.now(),
      code,
      message: scrubbedMessage,
      context
    };
    
    logs.unshift(newLog);
    
    // Keep only the last MAX_ERROR_LOGS entries
    const trimmedLogs = logs.slice(0, MAX_ERROR_LOGS);
    
    localStorage.setItem(ERROR_LOG_KEY, JSON.stringify(trimmedLogs));
  } catch (err) {
    logger.warn('Failed to log error:', err);
  }
}

// Get all error logs
export function getErrorLogs(): ErrorLog[] {
  try {
    const stored = localStorage.getItem(ERROR_LOG_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (err) {
    return [];
  }
}

// Clear error logs
export function clearErrorLogs() {
  try {
    localStorage.removeItem(ERROR_LOG_KEY);
  } catch (err) {
    logger.warn('Failed to clear error logs:', err);
  }
}

// Get system information
export function getSystemInfo(): SystemInfo {
  return {
    appVersion: '1.0.0-beta',  // TODO: Pull from package.json
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    timestamp: Date.now()
  };
}

// Generate debug report for support
export function generateDebugReport(): string {
  const systemInfo = getSystemInfo();
  const errorLogs = getErrorLogs();
  
  // Get current network info from localStorage or default
  const storedNetwork = localStorage.getItem('selectedNetwork');
  const storedChainId = localStorage.getItem('selectedChainId');
  
  const networkInfo = {
    currentNetwork: storedNetwork || 'Not connected',
    chainId: storedChainId ? parseInt(storedChainId, 10) : null,
    rpcEndpoint: '[redacted]'  // Never expose RPC endpoints in debug reports
  };
  
  const report = {
    system: systemInfo,
    network: networkInfo,
    recentErrors: errorLogs,
    note: 'This report contains NO private keys, seed phrases, or personal data.'
  };
  
  return JSON.stringify(report, null, 2);
}

// Copy debug report to clipboard
export async function copyDebugReport(): Promise<boolean> {
  try {
    const report = generateDebugReport();
    await navigator.clipboard.writeText(report);
    return true;
  } catch (err) {
    logger.error('Failed to copy debug report:', err);
    return false;
  }
}

// Get storage usage (helpful for debugging)
export function getStorageUsage() {
  try {
    let totalSize = 0;
    const items: { key: string; size: number }[] = [];
    
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        const value = localStorage.getItem(key);
        const size = value ? new Blob([value]).size : 0;
        totalSize += size;
        items.push({ key, size });
      }
    }
    
    // Sort by size
    items.sort((a, b) => b.size - a.size);
    
    return {
      totalSize,
      totalSizeKB: (totalSize / 1024).toFixed(2),
      items: items.slice(0, 10)  // Top 10 largest items
    };
  } catch (err) {
    return {
      totalSize: 0,
      totalSizeKB: '0',
      items: []
    };
  }
}

// Clear image cache (safe - doesn't remove keys or settings)
export function clearImageCache() {
  try {
    const keys = Object.keys(localStorage);
    let clearedCount = 0;
    
    keys.forEach(key => {
      // Only clear cached images, token logos, and price history
      if (
        key.startsWith('token_logo_') ||
        key.startsWith('price_cache_') ||
        key.startsWith('image_cache_')
      ) {
        localStorage.removeItem(key);
        clearedCount++;
      }
    });
    
    return clearedCount;
  } catch (err) {
    logger.error('Failed to clear image cache:', err);
    return 0;
  }
}
