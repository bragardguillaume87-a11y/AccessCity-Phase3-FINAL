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
 * @param {string} level - Log level (DEBUG, INFO, WARN, ERROR)
 * @param {Array} args - Arguments to log
 * @returns {Array} Formatted arguments
 */
const formatLog = (level, args) => {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0]; // HH:MM:SS
  return [`[${timestamp}] [${level}]`, ...args];
};

export const logger = {
  /**
   * Debug level - Detailed diagnostic information
   * Only logs in development mode
   * @param {...any} args - Arguments to log
   */
  debug: (...args) => {
    if (isDevelopment) {
      console.log(...formatLog('DEBUG', args));
    }
  },

  /**
   * Info level - General informational messages
   * Only logs in development mode
   * @param {...any} args - Arguments to log
   */
  info: (...args) => {
    if (isDevelopment) {
      console.info(...formatLog('INFO', args));
    }
  },

  /**
   * Warn level - Warning messages
   * Always logs (even in production)
   * @param {...any} args - Arguments to log
   */
  warn: (...args) => {
    console.warn(...formatLog('WARN', args));
  },

  /**
   * Error level - Error messages
   * Always logs (even in production)
   * @param {...any} args - Arguments to log
   */
  error: (...args) => {
    console.error(...formatLog('ERROR', args));
  },

  /**
   * Group - Start a collapsible log group
   * Only in development mode
   * @param {string} label - Group label
   */
  group: (label) => {
    if (isDevelopment) {
      console.group(label);
    }
  },

  /**
   * GroupEnd - End the current log group
   * Only in development mode
   */
  groupEnd: () => {
    if (isDevelopment) {
      console.groupEnd();
    }
  },

  /**
   * Table - Display data as a table
   * Only in development mode
   * @param {any} data - Data to display
   */
  table: (data) => {
    if (isDevelopment) {
      console.table(data);
    }
  },

  /**
   * Time - Start a timer
   * Only in development mode
   * @param {string} label - Timer label
   */
  time: (label) => {
    if (isDevelopment) {
      console.time(label);
    }
  },

  /**
   * TimeEnd - End a timer and log elapsed time
   * Only in development mode
   * @param {string} label - Timer label
   */
  timeEnd: (label) => {
    if (isDevelopment) {
      console.timeEnd(label);
    }
  }
};

/**
 * Performance logger for tracking component render times
 * @param {string} componentName - Name of the component
 * @param {Function} callback - Function to measure
 */
export const logPerformance = (componentName, callback) => {
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
 * @param {string} storeName - Store name
 * @param {string} actionName - Action name
 * @param {any} payload - Action payload
 */
export const logStoreAction = (storeName, actionName, payload) => {
  if (isDevelopment) {
    logger.group(`📦 ${storeName}.${actionName}`);
    logger.debug('Payload:', payload);
    logger.groupEnd();
  }
};
