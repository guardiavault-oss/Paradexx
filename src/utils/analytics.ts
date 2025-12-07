/**
 * Analytics and Tracking System
 */

import { logger } from './logger';

export enum AnalyticsEvent {
  // Page views
  PAGE_VIEW = 'page_view',
  
  // Wallet events
  WALLET_CONNECTED = 'wallet_connected',
  WALLET_DISCONNECTED = 'wallet_disconnected',
  NETWORK_SWITCHED = 'network_switched',
  
  // Transaction events
  TRANSACTION_INITIATED = 'transaction_initiated',
  TRANSACTION_SIGNED = 'transaction_signed',
  TRANSACTION_SENT = 'transaction_sent',
  TRANSACTION_CONFIRMED = 'transaction_confirmed',
  TRANSACTION_FAILED = 'transaction_failed',
  
  // Trading events
  SWAP_INITIATED = 'swap_initiated',
  SWAP_COMPLETED = 'swap_completed',
  
  // NFT events
  NFT_VIEWED = 'nft_viewed',
  NFT_TRANSFERRED = 'nft_transferred',
  
  // Security events
  GUARDIAN_ADDED = 'guardian_added',
  GUARDIAN_REMOVED = 'guardian_removed',
  RECOVERY_INITIATED = 'recovery_initiated',
  
  // Feature usage
  FEATURE_USED = 'feature_used',
  BUTTON_CLICKED = 'button_clicked',
  
  // User actions
  SEARCH_PERFORMED = 'search_performed',
  FILTER_APPLIED = 'filter_applied',
  SETTINGS_CHANGED = 'settings_changed',
  
  // Errors
  ERROR_OCCURRED = 'error_occurred',
}

interface EventProperties {
  [key: string]: string | number | boolean | undefined | null;
}

interface UserProperties {
  userId?: string;
  walletAddress?: string;
  tribe?: 'degen' | 'regen';
  network?: string;
  [key: string]: any;
}

class Analytics {
  private enabled: boolean = true;
  private userProperties: UserProperties = {};
  private sessionId: string;
  private sessionStart: number;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStart = Date.now();
    this.initializeSession();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeSession(): void {
    // Track session start
    this.track(AnalyticsEvent.PAGE_VIEW, {
      session_id: this.sessionId,
      session_start: this.sessionStart,
    });

    // Track session end on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.track(AnalyticsEvent.PAGE_VIEW, {
          session_id: this.sessionId,
          session_duration: Date.now() - this.sessionStart,
          session_end: true,
        });
      });
    }
  }

  /**
   * Enable/disable analytics
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    logger.info(`Analytics ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Set user properties
   */
  setUser(properties: UserProperties): void {
    this.userProperties = {
      ...this.userProperties,
      ...properties,
    };

    logger.debug('User properties set', this.userProperties);

    // Send to analytics service
    this.sendToService('identify', this.userProperties);
  }

  /**
   * Track an event
   */
  track(event: AnalyticsEvent | string, properties?: EventProperties): void {
    if (!this.enabled) return;

    const eventData = {
      event,
      properties: {
        ...properties,
        session_id: this.sessionId,
        timestamp: Date.now(),
        user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
        screen_resolution: typeof window !== 'undefined'
          ? `${window.screen.width}x${window.screen.height}`
          : undefined,
        ...this.userProperties,
      },
    };

    logger.debug('Analytics event', eventData);

    // Send to analytics service
    this.sendToService('track', eventData);
  }

  /**
   * Track page view
   */
  page(pageName: string, properties?: EventProperties): void {
    this.track(AnalyticsEvent.PAGE_VIEW, {
      page_name: pageName,
      page_url: typeof window !== 'undefined' ? window.location.href : undefined,
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
      ...properties,
    });
  }

  /**
   * Track timing/performance
   */
  timing(category: string, variable: string, duration: number, label?: string): void {
    this.track('timing', {
      category,
      variable,
      duration,
      label,
    });
  }

  /**
   * Send data to analytics service
   */
  private sendToService(type: 'identify' | 'track', data: any): void {
    if (process.env.NODE_ENV === 'production') {
      // In production, send to actual analytics service
      // Example: Google Analytics, Mixpanel, Amplitude, etc.
      
      // Google Analytics 4 example:
      if (typeof window !== 'undefined' && (window as any).gtag) {
        if (type === 'track') {
          (window as any).gtag('event', data.event, data.properties);
        }
      }

      // Mixpanel example:
      if (typeof window !== 'undefined' && (window as any).mixpanel) {
        if (type === 'identify') {
          (window as any).mixpanel.identify(data.userId);
          (window as any).mixpanel.people.set(data);
        } else if (type === 'track') {
          (window as any).mixpanel.track(data.event, data.properties);
        }
      }
    } else {
      // In development, just log
      console.log(`[Analytics ${type}]`, data);
    }
  }

  /**
   * Get session info
   */
  getSessionInfo(): {
    sessionId: string;
    sessionStart: number;
    sessionDuration: number;
  } {
    return {
      sessionId: this.sessionId,
      sessionStart: this.sessionStart,
      sessionDuration: Date.now() - this.sessionStart,
    };
  }
}

// Singleton instance
export const analytics = new Analytics();

// Helper functions for common events
export const analyticsHelpers = {
  /**
   * Track wallet connection
   */
  trackWalletConnect: (address: string, network: string) => {
    analytics.track(AnalyticsEvent.WALLET_CONNECTED, {
      wallet_address: address,
      network,
    });
  },

  /**
   * Track wallet disconnection
   */
  trackWalletDisconnect: () => {
    analytics.track(AnalyticsEvent.WALLET_DISCONNECTED);
  },

  /**
   * Track network switch
   */
  trackNetworkSwitch: (fromNetwork: string, toNetwork: string) => {
    analytics.track(AnalyticsEvent.NETWORK_SWITCHED, {
      from_network: fromNetwork,
      to_network: toNetwork,
    });
  },

  /**
   * Track transaction
   */
  trackTransaction: (
    action: 'initiated' | 'signed' | 'sent' | 'confirmed' | 'failed',
    txHash?: string,
    details?: any
  ) => {
    const eventMap = {
      initiated: AnalyticsEvent.TRANSACTION_INITIATED,
      signed: AnalyticsEvent.TRANSACTION_SIGNED,
      sent: AnalyticsEvent.TRANSACTION_SENT,
      confirmed: AnalyticsEvent.TRANSACTION_CONFIRMED,
      failed: AnalyticsEvent.TRANSACTION_FAILED,
    };

    analytics.track(eventMap[action], {
      tx_hash: txHash,
      ...details,
    });
  },

  /**
   * Track swap/trade
   */
  trackSwap: (
    fromToken: string,
    toToken: string,
    fromAmount: number,
    toAmount: number,
    status: 'initiated' | 'completed'
  ) => {
    analytics.track(
      status === 'initiated' ? AnalyticsEvent.SWAP_INITIATED : AnalyticsEvent.SWAP_COMPLETED,
      {
        from_token: fromToken,
        to_token: toToken,
        from_amount: fromAmount,
        to_amount: toAmount,
      }
    );
  },

  /**
   * Track NFT action
   */
  trackNFT: (action: 'viewed' | 'transferred', nftId: string, collection?: string) => {
    analytics.track(
      action === 'viewed' ? AnalyticsEvent.NFT_VIEWED : AnalyticsEvent.NFT_TRANSFERRED,
      {
        nft_id: nftId,
        collection,
      }
    );
  },

  /**
   * Track security action
   */
  trackSecurity: (
    action: 'guardian_added' | 'guardian_removed' | 'recovery_initiated',
    details?: any
  ) => {
    const eventMap = {
      guardian_added: AnalyticsEvent.GUARDIAN_ADDED,
      guardian_removed: AnalyticsEvent.GUARDIAN_REMOVED,
      recovery_initiated: AnalyticsEvent.RECOVERY_INITIATED,
    };

    analytics.track(eventMap[action], details);
  },

  /**
   * Track feature usage
   */
  trackFeature: (featureName: string, action?: string, properties?: EventProperties) => {
    analytics.track(AnalyticsEvent.FEATURE_USED, {
      feature_name: featureName,
      action,
      ...properties,
    });
  },

  /**
   * Track button click
   */
  trackClick: (buttonName: string, location: string) => {
    analytics.track(AnalyticsEvent.BUTTON_CLICKED, {
      button_name: buttonName,
      location,
    });
  },

  /**
   * Track search
   */
  trackSearch: (query: string, results: number) => {
    analytics.track(AnalyticsEvent.SEARCH_PERFORMED, {
      query,
      results,
    });
  },

  /**
   * Track error
   */
  trackError: (errorType: string, errorMessage: string, details?: any) => {
    analytics.track(AnalyticsEvent.ERROR_OCCURRED, {
      error_type: errorType,
      error_message: errorMessage,
      ...details,
    });
  },

  /**
   * Track performance
   */
  trackPerformance: (metric: string, duration: number, details?: any) => {
    analytics.timing('performance', metric, duration, JSON.stringify(details));
  },
};

// Initialize analytics on page load
if (typeof window !== 'undefined') {
  // Track initial page view
  analytics.page(window.location.pathname);

  // Track navigation
  window.addEventListener('popstate', () => {
    analytics.page(window.location.pathname);
  });
}
