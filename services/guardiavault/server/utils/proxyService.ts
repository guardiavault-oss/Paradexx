/**
 * Proxy Service for API calls with DNS fallbacks
 * This service helps bypass DNS resolution issues by routing requests through different methods
 */

import axios, { AxiosRequestConfig } from 'axios';
import { logInfo, logError } from '../services/logger';

export interface ProxyConfig {
  timeout: number;
  retries: number;
  useProxy: boolean;
  proxyEndpoints: string[];
}

export class ProxyService {
  private config: ProxyConfig;

  constructor(config?: Partial<ProxyConfig>) {
    this.config = {
      timeout: 15000,
      retries: 3,
      useProxy: process.env.NODE_ENV === 'production',
      proxyEndpoints: [
        'https://cors-anywhere.herokuapp.com/',
        'https://api.allorigins.win/get?url=',
        'https://corsproxy.io/?',
      ],
      ...config,
    };
  }

  /**
   * Make an HTTP request with DNS fallbacks and proxy options
   */
  async request(url: string, options: AxiosRequestConfig = {}): Promise<any> {
    const requestConfig: AxiosRequestConfig = {
      timeout: this.config.timeout,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'GuardiaVault/1.0',
        ...options.headers,
      },
      // Force IPv4 to avoid IPv6 DNS issues
      family: 4,
      ...options,
    };

    // Try direct connection first
    try {
      logInfo('Attempting direct API request', { url });
      const response = await axios.get(url, requestConfig);
      logInfo('Direct API request successful', { url, status: response.status });
      return response.data;
    } catch (error) {
      logError(error as Error, { 
        context: 'ProxyService.directRequest', 
        url,
        message: 'Direct request failed, trying alternatives...'
      });
    }

    // Try with different DNS servers (Node.js level)
    try {
      const dns = await import('dns');
      const originalServers = dns.getServers();
      
      // Try Google DNS
      dns.setServers(['8.8.8.8', '8.8.4.4']);
      logInfo('Attempting request with Google DNS', { url });
      
      const response = await axios.get(url, requestConfig);
      
      // Restore original DNS servers
      dns.setServers(originalServers);
      
      logInfo('Google DNS request successful', { url, status: response.status });
      return response.data;
    } catch (error) {
      logError(error as Error, { 
        context: 'ProxyService.googleDNS', 
        url,
        message: 'Google DNS request failed, trying Cloudflare DNS...'
      });
      
      // Try Cloudflare DNS
      try {
        const dns = await import('dns');
        dns.setServers(['1.1.1.1', '1.0.0.1']);
        logInfo('Attempting request with Cloudflare DNS', { url });
        
        const response = await axios.get(url, requestConfig);
        logInfo('Cloudflare DNS request successful', { url, status: response.status });
        return response.data;
      } catch (error2) {
        logError(error2 as Error, { 
          context: 'ProxyService.cloudflareDNS', 
          url,
          message: 'Cloudflare DNS request failed, trying proxy services...'
        });
      }
    }

    // If direct requests fail, try proxy services (only in production)
    if (this.config.useProxy) {
      for (const proxyEndpoint of this.config.proxyEndpoints) {
        try {
          let proxyUrl: string;
          
          if (proxyEndpoint.includes('allorigins.win')) {
            // AllOrigins format
            proxyUrl = `${proxyEndpoint}${encodeURIComponent(url)}`;
          } else {
            // Standard CORS proxy format
            proxyUrl = `${proxyEndpoint}${url}`;
          }
          
          logInfo('Attempting proxy request', { url, proxyEndpoint, proxyUrl });
          
          const response = await axios.get(proxyUrl, {
            ...requestConfig,
            headers: {
              ...requestConfig.headers,
              'X-Requested-With': 'XMLHttpRequest',
            },
          });
          
          // Handle AllOrigins response format
          let data = response.data;
          if (proxyEndpoint.includes('allorigins.win') && data.contents) {
            data = JSON.parse(data.contents);
          }
          
          logInfo('Proxy request successful', { 
            url, 
            proxyEndpoint, 
            status: response.status 
          });
          return data;
          
        } catch (error) {
          logError(error as Error, { 
            context: 'ProxyService.proxy', 
            url,
            proxyEndpoint,
            message: 'Proxy request failed, trying next proxy...'
          });
        }
      }
    }

    // All methods failed
    throw new Error(
      `Failed to fetch data from ${url} using all available methods (direct, DNS alternatives, proxies). ` +
      `This may be a network connectivity issue or the API may be down.`
    );
  }

  /**
   * Specific method for Lido API with optimized endpoints
   */
  async getLidoData(): Promise<any> {
    const endpoints = [
      'https://api.lido.fi/v1/steth/apr',
      'https://eth-api-prod.lido.fi/v1/steth/apr',
      'https://stake.lido.fi/api/short-beaconstat',
    ];

    for (const endpoint of endpoints) {
      try {
        return await this.request(endpoint);
      } catch (error) {
        logError(error as Error, { 
          context: 'ProxyService.getLidoData', 
          endpoint,
          message: 'Endpoint failed, trying next...'
        });
      }
    }

    throw new Error('All Lido API endpoints failed');
  }

  /**
   * Specific method for Aave API with optimized endpoints
   */
  async getAaveData(chainId: string = '1'): Promise<any> {
    const endpoints = [
      `https://aave-api-v3.aave.com/data/pools?chainId=${chainId}`,
      `https://api.aave.com/data/pools?chainId=${chainId}`,
      // Add IP-based endpoint as fallback (if DNS resolution fails)
      // Note: IP addresses may change, so this is just an example
    ];

    for (const endpoint of endpoints) {
      try {
        return await this.request(endpoint);
      } catch (error) {
        logError(error as Error, { 
          context: 'ProxyService.getAaveData', 
          endpoint,
          message: 'Endpoint failed, trying next...'
        });
      }
    }

    throw new Error('All Aave API endpoints failed');
  }
}

// Export singleton instance
export const proxyService = new ProxyService();
