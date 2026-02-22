import { useState, useEffect, useCallback } from 'react';
import { logger } from './logger';

/**
 * Custom hook for localStorage management with React state sync
 *
 * Features:
 * - Automatic JSON serialization/deserialization
 * - React state synchronization
 * - Error handling
 * - SSR safe (checks for window)
 *
 * @param key - localStorage key (use STORAGE_KEYS constants)
 * @param initialValue - Initial value if key doesn't exist
 * @returns State value, setter function, and remove function
 *
 * @example
 * import { STORAGE_KEYS } from '@/config/storageKeys';
 * const [favorites, setFavorites, removeFavorites] = useLocalStorage(STORAGE_KEYS.FAVORITES_ASSETS, []);
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  // State to store value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      logger.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        // Allow value to be a function so we have same API as useState
        const valueToStore = value instanceof Function ? value(storedValue) : value;

        // Save state
        setStoredValue(valueToStore);

        // Save to local storage
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        logger.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  // Function to remove the item from localStorage
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      logger.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

/**
 * Hook for localStorage history tracking (recent items)
 *
 * @param key - localStorage key
 * @param maxItems - Maximum number of items to keep in history
 * @returns History array, add function, clear function
 *
 * @example
 * const [bgHistory, addBg] = useLocalStorageHistory(STORAGE_KEYS.BACKGROUNDS_HISTORY, 10);
 * addBg('/assets/backgrounds/city.jpg');
 */
export function useLocalStorageHistory<T>(
  key: string,
  maxItems: number = 10
): [T[], (item: T) => void, () => void] {
  const [history, setHistory, clearHistory] = useLocalStorage<T[]>(key, []);

  const addToHistory = useCallback(
    (item: T) => {
      setHistory((prevHistory) => {
        // Remove item if it already exists (to move it to front)
        const filtered = prevHistory.filter((h) => h !== item);

        // Add to front and limit to maxItems
        const newHistory = [item, ...filtered].slice(0, maxItems);

        return newHistory;
      });
    },
    [setHistory, maxItems]
  );

  return [history, addToHistory, clearHistory];
}

/**
 * Hook for boolean localStorage flag (e.g., onboarding completed, first upload)
 *
 * @param key - localStorage key
 * @param initialValue - Initial value (default false)
 * @returns Value, setTrue, setFalse, toggle functions
 *
 * @example
 * const [onboardingDone, markOnboardingDone] = useLocalStorageFlag(STORAGE_KEYS.ONBOARDING_COMPLETED);
 * if (!onboardingDone) { showOnboarding(); }
 * markOnboardingDone(); // Sets to true
 */
export function useLocalStorageFlag(
  key: string,
  initialValue: boolean = false
): [boolean, () => void, () => void, () => void] {
  const [value, setValue] = useLocalStorage<boolean>(key, initialValue);

  const setTrue = useCallback(() => setValue(true), [setValue]);
  const setFalse = useCallback(() => setValue(false), [setValue]);
  const toggle = useCallback(() => setValue((v) => !v), [setValue]);

  return [value, setTrue, setFalse, toggle];
}

/**
 * Synchronize localStorage across tabs/windows
 *
 * @param key - localStorage key to watch
 * @param callback - Callback function when value changes in another tab
 *
 * @example
 * useLocalStorageSync(STORAGE_KEYS.FAVORITES_ASSETS, (newValue) => {
 *   console.log('Favorites updated in another tab:', newValue);
 * });
 */
export function useLocalStorageSync<T>(key: string, callback: (newValue: T) => void): void {
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          const newValue = JSON.parse(e.newValue) as T;
          callback(newValue);
        } catch (error) {
          logger.error(`Error parsing storage event for key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, callback]);
}

/**
 * Get all localStorage keys with a specific prefix
 *
 * @param prefix - Prefix to filter keys (e.g., 'ac_')
 * @returns Array of matching keys
 *
 * @example
 * const accessCityKeys = getLocalStorageKeys('ac_');
 * // ['ac_onboarding_completed', 'ac_backgrounds_history', ...]
 */
export function getLocalStorageKeys(prefix: string = ''): string[] {
  if (typeof window === 'undefined') return [];

  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      keys.push(key);
    }
  }
  return keys;
}

/**
 * Clear all localStorage keys with a specific prefix
 *
 * @param prefix - Prefix to filter keys (e.g., 'ac_')
 * @returns Number of keys cleared
 *
 * @example
 * clearLocalStorageByPrefix('ac_'); // Clears all AccessCity data
 */
export function clearLocalStorageByPrefix(prefix: string = ''): number {
  if (typeof window === 'undefined') return 0;

  const keys = getLocalStorageKeys(prefix);
  keys.forEach((key) => localStorage.removeItem(key));
  return keys.length;
}
