/**
 * Mobile Test Setup
 * Jest configuration and mocks for React Native and Expo
 */

import "@testing-library/jest-native/extend-expect";

// Mock Expo modules
jest.mock("expo-local-authentication", () => ({
  hasHardwareAsync: jest.fn(() => Promise.resolve(true)),
  isEnrolledAsync: jest.fn(() => Promise.resolve(true)),
  supportedAuthenticationTypesAsync: jest.fn(() =>
    Promise.resolve([1]) // FACIAL_RECOGNITION
  ),
  authenticateAsync: jest.fn(() =>
    Promise.resolve({ success: true, error: null })
  ),
  AuthenticationType: {
    FACIAL_RECOGNITION: 1,
    FINGERPRINT: 2,
    IRIS: 3,
  },
}));

jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: "granted" })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: "granted" })),
  getExpoPushTokenAsync: jest.fn(() =>
    Promise.resolve({ data: "mock-push-token" })
  ),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve("notification-id")),
  cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
  cancelAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve()),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
}));

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock("expo-linking", () => ({
  getInitialURL: jest.fn(() => Promise.resolve(null)),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  parse: jest.fn((url: string) => {
    const [path, query] = url.replace(/^.*:\/\//, "").split("?");
    const params: Record<string, string> = {};
    if (query) {
      query.split("&").forEach((pair) => {
        const [key, value] = pair.split("=");
        params[decodeURIComponent(key)] = decodeURIComponent(value || "");
      });
    }
    return { path, queryParams: params };
  }),
  canOpenURL: jest.fn(() => Promise.resolve(true)),
  openURL: jest.fn(() => Promise.resolve()),
}));

jest.mock("expo-constants", () => ({
  default: {
    expoConfig: {
      extra: {
        walletconnectProjectId: "test-project-id",
        apiUrl: "http://localhost:5000",
        chainId: "11155111",
      },
    },
  },
}));

jest.mock("@walletconnect/universal-provider", () => ({
  UniversalProvider: {
    init: jest.fn(() =>
      Promise.resolve({
        connect: jest.fn(() =>
          Promise.resolve({
            topic: "test-topic",
            namespaces: {
              eip155: {
                accounts: ["eip155:11155111:0x1234567890123456789012345678901234567890"],
              },
            },
          })
        ),
        disconnect: jest.fn(() => Promise.resolve()),
        request: jest.fn(() => Promise.resolve("0xsignature")),
        session: {
          topic: "test-topic",
          namespaces: {
            eip155: {
              accounts: ["eip155:11155111:0x1234567890123456789012345678901234567890"],
            },
          },
        },
      })
    ),
  },
}));

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock("react-native-gesture-handler", () => ({
  GestureHandlerRootView: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("react-native-reanimated", () => {
  const View = require("react-native").View;
  return {
    default: {
      Value: jest.fn(),
      event: jest.fn(),
      add: jest.fn(),
      eq: jest.fn(),
      set: jest.fn(),
      cond: jest.fn(),
      interpolate: jest.fn(),
      View,
      Extrapolate: { EXTEND: "extend" },
    },
    Easing: {
      in: jest.fn(),
      out: jest.fn(),
      inOut: jest.fn(),
    },
  };
});

// Mock React Navigation
jest.mock("@react-navigation/native", () => ({
  NavigationContainer: ({ children }: { children: React.ReactNode }) => children,
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    dispatch: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
}));

jest.mock("@react-navigation/native-stack", () => ({
  createNativeStackNavigator: () => ({
    Navigator: ({ children }: { children: React.ReactNode }) => children,
    Screen: () => null,
  }),
}));

jest.mock("@react-navigation/bottom-tabs", () => ({
  createBottomTabNavigator: () => ({
    Navigator: ({ children }: { children: React.ReactNode }) => children,
    Screen: () => null,
  }),
}));

// Silence console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

