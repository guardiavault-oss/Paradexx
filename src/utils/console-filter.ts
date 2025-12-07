// Filter out known harmless warnings
const originalWarn = console.warn;
const originalError = console.error;

// Helper to check if message should be filtered
const shouldFilterMessage = (args: any[]): boolean => {
  const fullMessage = args.map(arg => {
    if (typeof arg === 'string') return arg;
    if (arg?.message) return String(arg.message);
    if (arg?.stack) return String(arg.stack);
    return String(arg);
  }).join(' ');
  
  // Suppress Three.js multiple instance warning
  if (fullMessage.includes('Multiple instances of Three.js')) {
    return true;
  }
  
  // Suppress MetaMask/ObjectMultiplex warnings (harmless browser extension messages)
  if (fullMessage.includes('ObjectMultiplex') || 
      fullMessage.includes('StreamMiddleware') ||
      fullMessage.includes('malformed chunk') ||
      fullMessage.includes('Unknown response id') ||
      fullMessage.includes('solanaActionsContentScript') ||
      fullMessage.includes('inpage.js') ||
      fullMessage.includes('ACK')) {
    return true;
  }
  
  // Suppress biometric "Method not implemented" errors in browser
  if (fullMessage.includes('Error checking biometric availability') && 
      fullMessage.includes('Method not implemented')) {
    return true;
  }
  
  // Suppress wallet connection errors when backend is not running (common in dev)
  if ((fullMessage.includes('Failed to refresh wallet') || 
       fullMessage.includes('wallet/status') ||
       fullMessage.includes('wallet/accounts') ||
       fullMessage.includes('WalletContext')) && 
      (fullMessage.includes('Failed to fetch') || 
       fullMessage.includes('ERR_CONNECTION_REFUSED') ||
       fullMessage.includes('net::ERR_CONNECTION_REFUSED') ||
       fullMessage.includes('404') ||
       fullMessage.includes('Not Found'))) {
    return true;
  }
  
  // Suppress API 404 errors for optional/unimplemented features
  if (fullMessage.includes('404 (Not Found)') ||
      fullMessage.includes('Failed to fetch trending tokens') ||
      fullMessage.includes('market/trending') ||
      (fullMessage.includes('Not Found') && fullMessage.includes('apiRequest'))) {
    return true;
  }
  
  // Suppress WebGL context warnings (non-critical)
  if (fullMessage.includes('WebGL context lost') ||
      fullMessage.includes('THREE.WebGLRenderer') ||
      fullMessage.includes('Context Lost')) {
    return true;
  }
  
  // Suppress repeated initialization logs
  if (fullMessage.includes('WalletConnect initialized')) {
    return true;
  }
  
  // Suppress React DevTools nag
  if (fullMessage.includes('Download the React DevTools')) {
    return true;
  }
  
  // Suppress performance violations in development
  if (fullMessage.includes('[Violation]') || 
      fullMessage.includes('handler took')) {
    return true;
  }
  
  return false;
};

console.warn = (...args: any[]) => {
  if (shouldFilterMessage(args)) {
    return;
  }
  originalWarn.apply(console, args);
};

console.error = (...args: any[]) => {
  if (shouldFilterMessage(args)) {
    return;
  }
  originalError.apply(console, args);
};

export {}; // Make it a module
