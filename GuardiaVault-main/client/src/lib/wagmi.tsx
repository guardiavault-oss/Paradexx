// CRITICAL: Import React FIRST before any wagmi imports
// This ensures React is available when wagmi code executes
import React, { type ReactNode, useState, useEffect, Component } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { logError, logWarn } from "../utils/logger";

// Ensure React is available globally for wagmi BEFORE any wagmi code runs
// This is critical because wagmi uses React hooks and context
if (typeof window !== 'undefined') {
  (window as any).React = React;
  // Also ensure React.createElement is available (wagmi might use it)
  if (!(window as any).React.createElement) {
    (window as any).React.createElement = React.createElement;
  }
}

// Conditionally import RainbowKit to avoid reconciler conflicts
let RainbowKitProvider: any = null;
let getDefaultConfig: any = null;
let WagmiConfigProvider: any = null;

// Load styles - DISABLED to prevent reconciler conflicts
// if (typeof window !== 'undefined') {
//   try {
//     import("@rainbow-me/rainbowkit/styles.css");
//     rainbowKitStylesLoaded = true;
//   } catch (e) {
//     console.warn("Failed to load RainbowKit styles");
//   }
// }

// Error boundary for RainbowKit
class RainbowKitErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    logError(error, {
      context: "RainbowKitErrorBoundary",
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

const queryClient = new QueryClient();

// Lazy initialize wagmi config to avoid reconciler conflicts
let wagmiConfig: any = null;
let configInitialized = false;
let rainbowKitLoaded = false;

async function loadRainbowKit() {
  if (rainbowKitLoaded) return true;

  try {
    const rainbowKit = await import("@rainbow-me/rainbowkit");
    const wagmi = await import("wagmi");

    RainbowKitProvider = rainbowKit.RainbowKitProvider;
    getDefaultConfig = rainbowKit.getDefaultConfig;
    WagmiConfigProvider = wagmi.WagmiProvider;
    rainbowKitLoaded = true;
    return true;
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      context: "loadRainbowKit",
    });
    return false;
  }
}

async function initializeWagmiConfig() {
  if (configInitialized) return wagmiConfig;

  try {
    // CRITICAL: Ensure React is fully loaded and available before importing wagmi
    // Wagmi depends on React hooks and context, and will fail if React isn't ready
    // Since we bundled wagmi with React, React should be in the same chunk
    // But we still need to ensure it's initialized before wagmi code runs
    if (typeof window !== 'undefined') {
      // React should already be available from the static import above
      // But double-check and wait if needed
      if (!(window as any).React || typeof (window as any).React.createElement !== 'function') {
        // Force React to be available before wagmi loads
        const ReactModule = await import("react");
        const ReactLib = ReactModule.default || ReactModule;
        (window as any).React = ReactLib;
        // Ensure all necessary React methods are available
        if (!(window as any).React.createElement) {
          (window as any).React.createElement = ReactLib.createElement;
        }
        if (!(window as any).React.useState) {
          (window as any).React.useState = ReactLib.useState;
        }
        if (!(window as any).React.useEffect) {
          (window as any).React.useEffect = ReactLib.useEffect;
        }
        if (!(window as any).React.useContext) {
          (window as any).React.useContext = ReactLib.useContext;
        }
      }
    }

    // Always load wagmi core FIRST, regardless of RainbowKit
    // This ensures WagmiConfigProvider is always available
    // NOTE: wagmi is bundled with React, so React should be available when this loads
    // But we ensure React is available globally before this import
    const wagmi = await import("wagmi");

    // CRITICAL: Always set WagmiConfigProvider immediately
    if (!WagmiConfigProvider) {
      WagmiConfigProvider = wagmi.WagmiProvider;
    }

    const { mainnet, sepolia } = await import("wagmi/chains");

    // Try to load RainbowKit first (for better wallet connection UI)
    const loaded = await loadRainbowKit();

    if (loaded && getDefaultConfig) {
      // Use RainbowKit's getDefaultConfig if available
      const projectId = (import.meta as any).env?.VITE_WALLETCONNECT_PROJECT_ID || "";

      // Use fallback project ID if env var is not set or is a placeholder
      const isPlaceholderValue = !projectId ||
        projectId === "YOUR_PROJECT_ID" ||
        projectId === "your_walletconnect_project_id_here" ||
        projectId === "YOUR_WALLETCONNECT_PROJECT_ID_HERE";

      const finalProjectId = isPlaceholderValue
        ? "f32270e55fe94b09ccfc7a375022bb41" // Our production project ID
        : projectId;

      // Only warn if we're using a fallback in an environment where we expect the env var to be set
      // In development, it's normal to use the fallback
      const isProduction = import.meta.env?.PROD;
      if (isPlaceholderValue && isProduction) {
        logWarn("WalletConnect project ID not found in production env, using fallback", {
          context: "initializeWagmiConfig",
          action: "Set VITE_WALLETCONNECT_PROJECT_ID in Netlify environment variables",
          currentProjectId: finalProjectId,
        });
      }

        wagmiConfig = getDefaultConfig({
          appName: "GuardiaVault",
        projectId: finalProjectId,
          chains: [mainnet, sepolia],
          ssr: false,
        });
    } else {
      // Fallback: Create minimal wagmi config without RainbowKit
      // This ensures hooks work even without RainbowKit
      const { createConfig, http } = wagmi;

      wagmiConfig = createConfig({
        chains: [mainnet, sepolia],
        transports: {
          [mainnet.id]: http(),
          [sepolia.id]: http(),
        },
        ssr: false,
      });

      logWarn("RainbowKit not available - using minimal wagmi config. Wallet connection UI disabled.", {
        context: "initializeWagmiConfig",
      });
    }

    configInitialized = true;

    // Verify we have both config and provider
    if (!wagmiConfig) {
      throw new Error("wagmiConfig is null after initialization");
    }
    if (!WagmiConfigProvider) {
      throw new Error("WagmiConfigProvider is null after initialization");
    }

    // Wagmi config initialized successfully

  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      context: "initializeWagmiConfig",
    });
    // Try to create a minimal config even if everything fails
    try {
      const wagmi = await import("wagmi");
      const { createConfig, http } = wagmi;
      const { mainnet, sepolia } = await import("wagmi/chains");

      if (!WagmiConfigProvider) {
        WagmiConfigProvider = wagmi.WagmiProvider;
      }

      wagmiConfig = createConfig({
        chains: [mainnet, sepolia],
        transports: {
          [mainnet.id]: http(),
          [sepolia.id]: http(),
        },
        ssr: false,
      });
      logWarn("Created fallback minimal wagmi config", {
        context: "initializeWagmiConfig",
      });
    } catch (fallbackError) {
      logError(fallbackError instanceof Error ? fallbackError : new Error(String(fallbackError)), {
        context: "initializeWagmiConfig",
        fallback: true,
      });
      throw fallbackError; // Re-throw to signal complete failure
    }
    configInitialized = true; // Prevent retries
  }

  return wagmiConfig;
}

export function WagmiProvider({ children }: { children: ReactNode }) {
  // Temporarily disable RainbowKit/WalletConnect to prevent reconciler errors
  // TODO: Re-enable once reconciler conflict is resolved
  const ENABLE_WALLET_PROVIDERS = false;

  const [configState, setConfigState] = useState<{ config: any; provider: any } | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Initialize immediately, no delay
    let mounted = true;
    const timeout = window.setTimeout(() => {
      if (mounted && !configState) {
        logWarn("Wagmi initialization taking too long, checking for existing config", {
          context: "WagmiProvider",
        });
        if (wagmiConfig && WagmiConfigProvider) {
          setConfigState({ config: wagmiConfig, provider: WagmiConfigProvider });
        }
        setIsInitializing(false);
      }
    }, 1000); // Reduced to 1 second timeout

    (async () => {
      try {
        const config = await initializeWagmiConfig();
        window.clearTimeout(timeout);

        // Double-check we have both config and provider
        if (mounted && config && WagmiConfigProvider) {
          // Wagmi config state set successfully
          setConfigState({ config, provider: WagmiConfigProvider });
        } else {
          logError(new Error("Missing config or provider"), {
            context: "WagmiProvider",
            hasConfig: !!config,
            hasProvider: !!WagmiConfigProvider,
          });

          // Try to use module-level values as fallback
          if (mounted && wagmiConfig && WagmiConfigProvider) {
            logWarn("Using module-level config as fallback", {
              context: "WagmiProvider",
            });
            setConfigState({ config: wagmiConfig, provider: WagmiConfigProvider });
          }
        }
      } catch (error) {
        window.clearTimeout(timeout);
        logError(error instanceof Error ? error : new Error(String(error)), {
          context: "WagmiProvider",
        });
        // Try to get any existing config
        if (mounted && wagmiConfig && WagmiConfigProvider) {
          logWarn("Using existing config after error", {
            context: "WagmiProvider",
          });
          setConfigState({ config: wagmiConfig, provider: WagmiConfigProvider });
        }
      } finally {
        if (mounted) {
          setIsInitializing(false);
        }
      }
    })();

    return () => {
      mounted = false;
      window.clearTimeout(timeout);
    };
  }, []);

  // Show loading placeholder only briefly - render children as soon as possible
  // This prevents hooks from being called before context is ready
  if (isInitializing && !configState) {
    // Use existing config if available, don't block render
    if (wagmiConfig && WagmiConfigProvider) {
      return (
        <QueryClientProvider client={queryClient}>
          <WagmiConfigProvider config={wagmiConfig}>
            {children}
          </WagmiConfigProvider>
        </QueryClientProvider>
      );
    }

    // Only show loading for very brief period (max 500ms)
    return (
      <QueryClientProvider client={queryClient}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div>Loading...</div>
        </div>
      </QueryClientProvider>
    );
  }

  // If we have configState, use it; otherwise fall back to module-level config
  const { config, provider: WagmiProviderComponent } = configState || {
    config: wagmiConfig,
    provider: WagmiConfigProvider
  };

  if (!config || !WagmiProviderComponent) {
    // Final fallback - render children anyway to prevent blocking
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  // Always provide wagmi config, even if wallet providers are disabled
  // This ensures wagmi hooks don't error out
  if (config && WagmiProviderComponent) {
    if (ENABLE_WALLET_PROVIDERS && RainbowKitProvider) {
      // Full wallet provider setup with RainbowKit
      return (
        <WagmiProviderComponent config={config}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitErrorBoundary
              fallback={
                <QueryClientProvider client={queryClient}>
                  {children}
                </QueryClientProvider>
              }
            >
              <RainbowKitProvider modalSize="compact">
                {children}
              </RainbowKitProvider>
            </RainbowKitErrorBoundary>
          </QueryClientProvider>
        </WagmiProviderComponent>
      );
    } else {
      // Wagmi config only (no RainbowKit) - hooks will work but wallet connection UI won't
      return (
        <WagmiProviderComponent config={config}>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </WagmiProviderComponent>
      );
    }
  }

  // Fallback if wagmi config couldn't be initialized
  // This shouldn't happen, but handle gracefully
  logWarn("Wagmi config not available - wagmi hooks will not work", {
    context: "WagmiProvider",
  });
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export { wagmiConfig };



