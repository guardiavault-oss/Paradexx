/**
 * Deep Linking Service
 * Handles deep links for wallet callbacks and app navigation
 */

import * as Linking from "expo-linking";

export interface DeepLink {
  path: string;
  params?: Record<string, string>;
}

class DeepLinkingService {
  /**
   * Initialize deep linking listeners
   */
  initialize(callback: (link: DeepLink) => void): () => void {
    // Handle initial URL if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        const link = this.parseURL(url);
        if (link) callback(link);
      }
    });

    // Handle deep links while app is running
    const subscription = Linking.addEventListener("url", ({ url }) => {
      const link = this.parseURL(url);
      if (link) callback(link);
    });

    // Return cleanup function
    return () => subscription.remove();
  }

  /**
   * Parse a deep link URL
   */
  private parseURL(url: string): DeepLink | null {
    try {
      const parsed = Linking.parse(url);
      
      if (!parsed.path) {
        return null;
      }

      return {
        path: parsed.path,
        params: parsed.queryParams as Record<string, string> | undefined,
      };
    } catch (error) {
      console.error("Error parsing deep link:", error);
      return null;
    }
  }

  /**
   * Build a deep link URL
   */
  buildURL(path: string, params?: Record<string, string>): string {
    const scheme = "guardiavault";
    let url = `${scheme}://${path}`;
    
    if (params) {
      const queryString = Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join("&");
      url += `?${queryString}`;
    }
    
    return url;
  }

  /**
   * Open a URL in the system browser or app
   */
  async openURL(url: string): Promise<boolean> {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error opening URL:", error);
      return false;
    }
  }

  /**
   * Handle WalletConnect callback URLs
   */
  handleWalletConnectCallback(url: string): { success: boolean; sessionId?: string } {
    const parsed = this.parseURL(url);
    
    if (!parsed || parsed.path !== "walletconnect/callback") {
      return { success: false };
    }

    const sessionId = parsed.params?.sessionId;
    return {
      success: true,
      sessionId,
    };
  }
}

export const deepLinkingService = new DeepLinkingService();

