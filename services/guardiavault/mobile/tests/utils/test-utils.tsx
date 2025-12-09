/**
 * Mobile Test Utilities
 * Helper functions for testing React Native components
 */

import React, { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NavigationContainer } from "@react-navigation/native";

// Create a test query client
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// Custom render with providers
function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper"> & {
    queryClient?: QueryClient;
    withNavigation?: boolean;
  }
) {
  const { queryClient = createTestQueryClient(), withNavigation = false, ...renderOptions } = options || {};

  function Wrapper({ children }: { children: React.ReactNode }) {
    const content = (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    if (withNavigation) {
      return <NavigationContainer>{content}</NavigationContainer>;
    }

    return content;
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Mock navigation
export const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  push: jest.fn(),
  pop: jest.fn(),
  replace: jest.fn(),
  reset: jest.fn(),
  setParams: jest.fn(),
  dispatch: jest.fn(),
  canGoBack: jest.fn(() => true),
  isFocused: jest.fn(() => true),
  addListener: jest.fn(() => jest.fn()),
  removeListener: jest.fn(),
  getParent: jest.fn(),
  getState: jest.fn(),
};

// Mock route
export const mockRoute = (params: Record<string, any> = {}) => ({
  key: "test-route",
  name: "TestScreen",
  params,
  path: undefined,
});

// Wait for async operations
export const waitForAsync = () => new Promise((resolve) => setImmediate(resolve));

// Re-export everything
export * from "@testing-library/react-native";
export { renderWithProviders as render };
export { createTestQueryClient };

