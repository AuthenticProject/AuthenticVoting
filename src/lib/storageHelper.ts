/**
 * Universal Storage Helper
 * Safely accesses localStorage in browser, or in-memory map in Node.js test runners.
 */

const memoryStore: Record<string, string> = {};

export const safeStorage = {
  getItem(key: string): string | null {
    if (typeof localStorage !== 'undefined') {
      try {
        return localStorage.getItem(key);
      } catch {
        return memoryStore[key] ?? null;
      }
    }
    return memoryStore[key] ?? null;
  },

  setItem(key: string, value: string): void {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(key, value);
        return;
      } catch {
        // fallback
      }
    }
    memoryStore[key] = value;
  },

  removeItem(key: string): void {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(key);
      } catch {
        // fallback
      }
    }
    delete memoryStore[key];
  },
};
