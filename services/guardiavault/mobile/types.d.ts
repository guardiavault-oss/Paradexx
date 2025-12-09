/**
 * Mobile-specific type declarations
 * These modules are only available in React Native environment
 */

declare module "expo-secure-store" {
  export interface SecureStoreOptions {
    keychainAccessible?: string;
  }
  export function getItemAsync(key: string, options?: SecureStoreOptions): Promise<string | null>;
  export function setItemAsync(key: string, value: string, options?: SecureStoreOptions): Promise<void>;
  export function deleteItemAsync(key: string, options?: SecureStoreOptions): Promise<void>;
}

declare module "expo-constants" {
  export const Constants: {
    appOwnership?: string;
    executionEnvironment?: string;
    expoVersion?: string;
    installationId?: string;
    [key: string]: any;
  };
}

declare module "@react-native-async-storage/async-storage" {
  export interface AsyncStorageStatic {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
    getAllKeys(): Promise<string[]>;
    multiGet(keys: string[]): Promise<[string, string | null][]>;
    multiSet(keyValuePairs: [string, string][]): Promise<void>;
    multiRemove(keys: string[]): Promise<void>;
    clear(): Promise<void>;
  }
  export const AsyncStorage: AsyncStorageStatic;
  export default AsyncStorage;
}

