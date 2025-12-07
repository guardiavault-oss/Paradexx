/**
 * Platform-specific type declarations
 * These are conditionally loaded based on environment
 */

declare module "@react-native-async-storage/async-storage" {
  export interface AsyncStorage {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
  }
  export const AsyncStorage: AsyncStorage;
}

