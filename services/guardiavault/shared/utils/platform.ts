/**
 * Platform Detection & Abstraction
 * Provides platform-specific utilities for web and React Native
 */

export const Platform = {
  isWeb: typeof window !== "undefined" && typeof document !== "undefined",
  isNative: typeof navigator !== "undefined" && navigator.product === "ReactNative",
  isIOS: false, // Will be set in React Native
  isAndroid: false, // Will be set in React Native
};

/**
 * Storage abstraction for web (localStorage) and React Native (AsyncStorage)
 */
export interface Storage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

let storageImpl: Storage;

if (Platform.isWeb) {
  // Web storage implementation
  storageImpl = {
    async getItem(key: string): Promise<string | null> {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    async setItem(key: string, value: string): Promise<void> {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        console.error("Storage setItem failed:", e);
      }
    },
    async removeItem(key: string): Promise<void> {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.error("Storage removeItem failed:", e);
      }
    },
  };
} else {
  // React Native storage implementation (will be initialized in mobile app)
  storageImpl = {
    async getItem(key: string): Promise<string | null> {
      try {
        const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
        return AsyncStorage.getItem(key);
      } catch {
        // Web environment - use localStorage
        return localStorage.getItem(key);
      }
    },
    async setItem(key: string, value: string): Promise<void> {
      try {
        const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
        await AsyncStorage.setItem(key, value);
      } catch {
        // Web environment - use localStorage
        localStorage.setItem(key, value);
      }
    },
    async removeItem(key: string): Promise<void> {
      try {
        const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
        await AsyncStorage.removeItem(key);
      } catch {
        // Web environment - use localStorage
        localStorage.removeItem(key);
      }
    },
  };
}

export const storage = storageImpl;

