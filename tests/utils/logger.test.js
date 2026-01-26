import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '../../src/utils/logger.js';

describe('Logger Utility', () => {
  let consoleLogSpy;
  let consoleInfoSpy;
  let consoleWarnSpy;
  let consoleErrorSpy;
  let originalEnv;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    originalEnv = import.meta.env.DEV;
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleInfoSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('debug()', () => {
    it('should log in development mode', () => {
      import.meta.env.DEV = true;
      logger.debug('Test debug message', { data: 123 });

      expect(consoleLogSpy).toHaveBeenCalled();
      const logArgs = consoleLogSpy.mock.calls[0];
      expect(logArgs[0]).toContain('[DEBUG]');
      expect(logArgs[1]).toBe('Test debug message');
    });

    it('should include timestamp in log', () => {
      import.meta.env.DEV = true;
      logger.debug('Test');

      const logArgs = consoleLogSpy.mock.calls[0];
      // Format: [HH:MM:SS] [DEBUG]
      expect(logArgs[0]).toMatch(/\[\d{2}:\d{2}:\d{2}\] \[DEBUG\]/);
    });
  });

  describe('info()', () => {
    it('should log in development mode', () => {
      import.meta.env.DEV = true;
      logger.info('Test info message');

      expect(consoleInfoSpy).toHaveBeenCalled();
      const logArgs = consoleInfoSpy.mock.calls[0];
      expect(logArgs[0]).toContain('[INFO]');
    });
  });

  describe('warn()', () => {
    it('should always log warnings', () => {
      logger.warn('Test warning');

      expect(consoleWarnSpy).toHaveBeenCalled();
      const logArgs = consoleWarnSpy.mock.calls[0];
      expect(logArgs[0]).toContain('[WARN]');
      expect(logArgs[1]).toBe('Test warning');
    });
  });

  describe('error()', () => {
    it('should always log errors', () => {
      const testError = new Error('Test error');
      logger.error('Error occurred', testError);

      expect(consoleErrorSpy).toHaveBeenCalled();
      const logArgs = consoleErrorSpy.mock.calls[0];
      expect(logArgs[0]).toContain('[ERROR]');
      expect(logArgs[1]).toBe('Error occurred');
      expect(logArgs[2]).toBe(testError);
    });
  });

  describe('group() and groupEnd()', () => {
    let consoleGroupSpy;
    let consoleGroupEndSpy;

    beforeEach(() => {
      consoleGroupSpy = vi.spyOn(console, 'group').mockImplementation(() => {});
      consoleGroupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleGroupSpy.mockRestore();
      consoleGroupEndSpy.mockRestore();
    });

    it('should create console groups in development', () => {
      import.meta.env.DEV = true;
      logger.group('Test Group');
      logger.groupEnd();

      expect(consoleGroupSpy).toHaveBeenCalledWith('Test Group');
      expect(consoleGroupEndSpy).toHaveBeenCalled();
    });
  });
});
