import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const memoryStore = new Map<string, string>();

export const tokenStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
          return globalThis.localStorage.getItem(key);
        }
        return memoryStore.get(key) ?? null;
      }
      return await SecureStore.getItemAsync(key);
    } catch {
      return memoryStore.get(key) ?? null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    memoryStore.set(key, value);
    try {
      if (Platform.OS === 'web') {
        if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
          globalThis.localStorage.setItem(key, value);
        }
        return;
      }
      await SecureStore.setItemAsync(key, value);
    } catch {
      // Fallback already saved in memoryStore
    }
  },

  async removeItem(key: string): Promise<void> {
    memoryStore.delete(key);
    try {
      if (Platform.OS === 'web') {
        if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
          globalThis.localStorage.removeItem(key);
        }
        return;
      }
      await SecureStore.deleteItemAsync(key);
    } catch {
      // Ignore secure store errors on unsupported environments
    }
  },
};
