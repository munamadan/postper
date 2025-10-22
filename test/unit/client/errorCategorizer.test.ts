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

  test('should categorize DNS error (ENOTFOUND)', () => {
    const error = new AxiosError('not found', 'ENOTFOUND');
    const result = categorizer.categorize(error);

    expect(result.code).toBe('ENOTFOUND');
    expect(result.retryable).toBe(true);
    expect(result.userMessage).toContain('hostname');
  });

  test('should categorize DNS error (EAI_AGAIN)', () => {
    const error = new AxiosError('dns error', 'EAI_AGAIN');
    const result = categorizer.categorize(error);

    expect(result.code).toBe('EAI_AGAIN');
    expect(result.retryable).toBe(true);
  });

  test('should categorize connection refused', () => {
    const error = new AxiosError('refused', 'ECONNREFUSED');
    const result = categorizer.categorize(error);

    expect(result.code).toBe('ECONNREFUSED');
    expect(result.retryable).toBe(true);
    expect(result.userMessage).toContain('refused');
  });

  test('should categorize TLS error (EPROTO)', () => {
    const error = new AxiosError('cert error', 'EPROTO');
    const result = categorizer.categorize(error);

    expect(result.code).toBe('EPROTO');
    expect(result.retryable).toBe(false);
    expect(result.userMessage).toContain('SSL');
  });

  test('should categorize TLS auth failure', () => {
    const error = new AxiosError('tls auth fail', 'ERR_TLS_CERT_AUTH_FAILURE');
    const result = categorizer.categorize(error);

    expect(result.code).toBe('ERR_TLS_CERT_AUTH_FAILURE');
    expect(result.retryable).toBe(false);
  });

  test('should categorize HTTP timeout', () => {
    const error = new AxiosError('timeout', 'ERR_HTTP_REQUEST_TIMEOUT');
    const result = categorizer.categorize(error);

    expect(result.code).toBe('ERR_HTTP_REQUEST_TIMEOUT');
    expect(result.retryable).toBe(true);
  });

  test('should categorize unknown Axios error', () => {
    const error = new AxiosError('unknown error', 'UNKNOWN_CODE');
    const result = categorizer.categorize(error);

    expect(result.code).toBe('UNKNOWN_CODE');
    expect(result.userMessage).toContain('Error');
  });

  test('should handle generic JavaScript error', () => {
    const error = new Error('generic error');
    const result = categorizer.categorize(error);

    expect(result.code).toBe('UNKNOWN_ERROR');
    expect(result.userMessage).toContain('unexpected');
  });

  test('should preserve original error message', () => {
    const message = 'Custom error message';
    const error = new AxiosError(message, 'CUSTOM');
    const result = categorizer.categorize(error);

    expect(result.message).toBe(message);
  });

  test('should handle Axios error without code', () => {
    const error = new AxiosError('error without code');
    const result = categorizer.categorize(error);

    expect(result.code).toBe('UNKNOWN');
  });
});