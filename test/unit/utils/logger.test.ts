import { Logger } from '../../../src/utils/logger';
import * as vscode from 'vscode';

// Mock VSCode API
jest.mock('vscode', () => ({
  window: {
    createOutputChannel: jest.fn(() => ({
      appendLine: jest.fn(),
      show: jest.fn(),
      dispose: jest.fn(),
    })),
  },
}));

describe('Logger', () => {
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger();
  });

  test('should create output channel on initialization', () => {
    expect(vscode.window.createOutputChannel).toHaveBeenCalledWith('HTTP Client');
  });

  test('should log info messages', () => {
    expect(() => logger.info('Test message')).not.toThrow();
  });

  test('should log warning messages', () => {
    expect(() => logger.warn('Warning message')).not.toThrow();
  });

  test('should log error messages', () => {
    expect(() => logger.error('Error message')).not.toThrow();
  });

  test('should log debug messages', () => {
    expect(() => logger.debug('Debug message')).not.toThrow();
  });

  test('should show output channel', () => {
    expect(() => logger.show()).not.toThrow();
  });

  test('should dispose output channel', () => {
    expect(() => logger.dispose()).not.toThrow();
  });
});