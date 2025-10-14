import { ErrorCategorizer } from '../../../src/client/errorCategorizer';
import { AxiosError } from 'axios';

describe('ErrorCategorizer', () => {
  let categorizer: ErrorCategorizer;

  beforeEach(() => {
    categorizer = new ErrorCategorizer();
  });

  test('should categorize timeout error', () => {
    const error = new AxiosError('timeout', 'ECONNABORTED');
    const result = categorizer.categorize(error);

    expect(result.code).toBe('ECONNABORTED');
    expect(result.retryable).toBe(true);
    expect(result.userMessage).toContain('timed out');
  });

  test('should categorize DNS error', () => {
    const error = new AxiosError('not found', 'ENOTFOUND');
    const result = categorizer.categorize(error);

    expect(result.code).toBe('ENOTFOUND');
    expect(result.retryable).toBe(true);
    expect(result.userMessage).toContain('hostname');
  });

  test('should categorize connection refused', () => {
    const error = new AxiosError('refused', 'ECONNREFUSED');
    const result = categorizer.categorize(error);

    expect(result.code).toBe('ECONNREFUSED');
    expect(result.retryable).toBe(true);
  });

  test('should categorize TLS error', () => {
    const error = new AxiosError('cert error', 'EPROTO');
    const result = categorizer.categorize(error);

    expect(result.code).toBe('EPROTO');
    expect(result.retryable).toBe(false);
  });

  test('should handle generic error', () => {
    const error = new Error('generic error');
    const result = categorizer.categorize(error);

    expect(result.code).toBe('UNKNOWN_ERROR');
    expect(result.userMessage).toContain('unexpected');
  });
});