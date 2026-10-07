/**
 * Safe local storage wrapper with fallback.
 */
export const storage = {
  get<T>(key: string, defaultValue: T): T {
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  set<T>(key: string, value: T): void {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('Unable to write to localStorage', e);
    }
  },
  remove(key: string): void {
    try {
      window.localStorage.removeItem(key);
    } catch (e) {
      console.warn('Unable to remove from localStorage', e);
    }
  },
};
