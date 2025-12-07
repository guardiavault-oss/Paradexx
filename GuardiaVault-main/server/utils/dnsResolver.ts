/**
 * DNS Resolution Utility
 * Resolves domains using public DNS servers when Railway's internal DNS fails
 */

import dns from "dns";
import { promisify } from "util";

const lookup = promisify(dns.lookup);
const resolve4 = promisify(dns.resolve4);

// Public DNS servers as fallback
const PUBLIC_DNS_SERVERS = ["8.8.8.8", "8.8.4.4", "1.1.1.1"];

/**
 * Resolve a hostname to an IP address using public DNS servers
 * Falls back to system DNS if public DNS fails
 */
export async function resolveHostname(hostname: string): Promise<string> {
  // Try public DNS servers first
  const originalServers = dns.getServers();
  
  try {
    // Set public DNS servers
    dns.setServers(PUBLIC_DNS_SERVERS);
    
    // Try to resolve using public DNS
    try {
      const addresses = await resolve4(hostname);
      if (addresses && addresses.length > 0) {
        return addresses[0];
      }
    } catch (error) {
      // If resolve4 fails, try lookup (which uses system DNS)
      const result = await lookup(hostname, { family: 4 });
      return result.address;
    }
    
    throw new Error(`Could not resolve ${hostname}`);
  } catch (error) {
    // Restore original DNS servers
    if (originalServers.length > 0) {
      dns.setServers(originalServers);
    }
    
    // Try one more time with system DNS
    try {
      const result = await lookup(hostname, { family: 4 });
      return result.address;
    } catch (lookupError) {
      throw new Error(
        `DNS resolution failed for ${hostname}: ${(error as Error).message}. ` +
        `This is likely a Railway network configuration issue.`
      );
    }
  } finally {
    // Always restore original DNS servers
    if (originalServers.length > 0) {
      dns.setServers(originalServers);
    }
  }
}

/**
 * Configure Node.js to use public DNS servers globally
 * This affects all DNS lookups in the process
 */
export function configurePublicDNS(): void {
  try {
    const currentServers = dns.getServers();
    // Only set if not already using public DNS
    if (!currentServers.some(server => PUBLIC_DNS_SERVERS.includes(server))) {
      dns.setServers([...PUBLIC_DNS_SERVERS, ...currentServers]);
      console.log("[DNS] Configured public DNS servers:", PUBLIC_DNS_SERVERS);
    }
  } catch (error) {
    console.warn("[DNS] Failed to configure public DNS servers:", error);
  }
}

