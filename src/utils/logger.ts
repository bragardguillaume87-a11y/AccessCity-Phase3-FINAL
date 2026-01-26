/**
 * Centralized Logging Utility
 *
 * Provides controlled logging that only outputs in development mode
 * to prevent console pollution in production.
 *
 * Usage:
 *   import { logger } from '@/utils/logger';
 *
 *   logger.debug('Detailed debugging info', { data });
 *   logger.info('General information', value);
 *   logger.warn('Warning message', error);
 *   logger.error('Error occurred', error);
 *
 * Log Levels:
 *   - debug: Detailed debugging information (DEV only)
 *   - info: General informational messages (DEV only)
 *   - warn: Warning messages (always shown)
 *   - error: Error messages (always shown)
 */

const isDevelopment = import.meta.env.DEV;

/**
 * Formats log arguments with timestamp and context
 * @param level - Log level (DEBUG, INFO, WARN, ERROR)
 * @param args - Arguments to log
 * @returns Formatted arguments
 */
const formatLog = (level: string, args: unknown[]): unknown[] => {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0]; // HH:MM:SS
  return [`[${timestamp}] [${level}]`, ...args];
};

export const logger = {
  /**
   * Debug level - Detailed diagnostic information
   * Only logs in development mode
   * @param args - Arguments to log
   */
  debug: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.log(...formatLog('DEBUG', args));
    }
  },

  /**
   * Info level - General informational messages
   * Only logs in development mode
   * @param args - Arguments to log
   */
  info: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.info(...formatLog('INFO', args));
    }
  },

  /**
   * Warn level - Warning messages
   * Always logs (even in production)
   * @param args - Arguments to log
   */
  warn: (...args: unknown[]): void => {
    console.warn(...formatLog('WARN', args));
  },

  /**
   * Error level - Error messages
   * Always logs (even in production)
   * @param args - Arguments to log
   */
  error: (...args: unknown[]): void => {
    console.error(...formatLog('ERROR', args));
  },

  /**
   * Group - Start a collapsible log group
   * Only in development mode
   * @param label - Group label
   */
  group: (label: string): void => {
    if (isDevelopment) {
      console.group(label);
    }
  },

  /**
   * GroupEnd - End the current log group
   * Only in development mode
   */
  groupEnd: (): void => {
    if (isDevelopment) {
      console.groupEnd();
    }
  },

  /**
   * Table - Display data as a table
   * Only in development mode
   * @param data - Data to display
   */
  table: (data: unknown): void => {
    if (isDevelopment) {
      console.table(data);
    }
  },

  /**
   * Time - Start a timer
   * Only in development mode
   * @param label - Timer label
   */
  time: (label: string): void => {
    if (isDevelopment) {
      console.time(label);
    }
  },

  /**
   * TimeEnd - End a timer and log elapsed time
   * Only in development mode
   * @param label - Timer label
   */
  timeEnd: (label: string): void => {
    if (isDevelopment) {
      console.timeEnd(label);
    }
  }
};

/**
 * Performance logger for tracking component render times
 * @param componentName - Name of the component
 * @param callback - Function to measure
 * @returns Result of the callback
 */
export const logPerformance = <T>(componentName: string, callback: () => T): T => {
  if (isDevelopment) {
    const startTime = performance.now();
    const result = callback();
    const endTime = performance.now();
    logger.debug(`[PERF] ${componentName} rendered in ${(endTime - startTime).toFixed(2)}ms`);
    return result;
  }
  return callback();
};

/**
 * Redux/Zustand action logger
 * @param storeName - Store name
 * @param actionName - Action name
 * @param payload - Action payload
 */
export const logStoreAction = (storeName: string, actionName: string, payload: unknown): void => {
  if (isDevelopment) {
    logger.group(`📦 ${storeName}.${actionName}`);
    logger.debug('Payload:', payload);
    logger.groupEnd();
  }
};
