import { RequestValidator } from '../../../src/parser/requestValidator';
import { ParsedRequest } from '../../../src/parser/types';

describe('RequestValidator', () => {
  let validator: RequestValidator;

  beforeEach(() => {
    validator = new RequestValidator();
  });

  function createRequest(overrides?: Partial<ParsedRequest>): ParsedRequest {
    return {
      id: 'req-1',
      method: 'GET',
      url: 'https://example.com',
      headers: new Map(),
      lineNumber: 1,
      ...overrides,
    };
  }

  test('should validate correct GET request', () => {
    const request = createRequest();
    const error = validator.validate(request);

    expect(error).toBeNull();
  });

  test('should reject GET with body', () => {
    const request = createRequest({ method: 'GET', body: '{"key": "value"}' });
    const error = validator.validate(request);

    expect(error).not.toBeNull();
    expect(error?.message).toContain('should not have a body');
  });

  test('should reject duplicate headers', () => {
    const headers = new Map([
      ['Content-Type', 'application/json'],
      ['content-type', 'text/plain'],
    ]);
    const request = createRequest({ headers });
    const error = validator.validate(request);

    expect(error).not.toBeNull();
    expect(error?.message).toContain('Duplicate');
  });

  test('should validate POST with body', () => {
    const request = createRequest({ method: 'POST', body: '{"test": true}' });
    const error = validator.validate(request);

    expect(error).toBeNull();
  });
});