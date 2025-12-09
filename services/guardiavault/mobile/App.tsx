/**
 * GuardiaVault Mobile App
 * React Native app for check-ins, notifications, and recovery
 */

import React, { useEffect } from "react";
import { StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppNavigator } from "./navigation/AppNavigator";
import { AuthProvider } from "./contexts/AuthContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { notificationService } from "./services/notificationService";
import { walletService } from "./services/walletService";
import { deepLinkingService } from "./services/deepLinkingService";

// Initialize query client for data fetching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export default function App() {
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize wallet service (optional - don't fail if it doesn't work)
      try {
        await walletService.initialize();
      } catch (error) {
        console.warn("Wallet service initialization failed (non-critical):", error);
      }

      // Setup notification listeners (optional)
      try {
        notificationService.addNotificationReceivedListener((notification) => {
          console.log("Notification received:", notification);
        });

        notificationService.addNotificationResponseListener((response) => {
          console.log("Notification response:", response);
        });

        // Request notification permissions
        await notificationService.requestPermissions();
      } catch (error) {
        console.warn("Notification service setup failed (non-critical):", error);
      }

      // Setup deep linking (optional)
      try {
        deepLinkingService.initialize((link) => {
          console.log("Deep link received:", link);
          if (link.path.startsWith("walletconnect/callback")) {
            const result = deepLinkingService.handleWalletConnectCallback(
              deepLinkingService.buildURL(link.path, link.params)
            );
            if (result.success) {
              console.log("WalletConnect callback successful:", result.sessionId);
            }
          }
        });
      } catch (error) {
        console.warn("Deep linking setup failed (non-critical):", error);
      }
    } catch (error) {
      console.error("Failed to initialize app:", error);
      // Don't crash the app - continue anyway
    }
  };

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <StatusBar barStyle="dark-content" />
            <AppNavigator />
          </AuthProvider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
