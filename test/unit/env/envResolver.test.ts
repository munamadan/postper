import { EnvResolver } from '../../../src/env/envResolver';
import { Environment } from '../../../src/env/types';
import { ParsedRequest } from '../../../src/parser/types';

describe('EnvResolver', () => {
  let resolver: EnvResolver;
  let testEnv: Environment;

  beforeEach(() => {
    resolver = new EnvResolver();
    testEnv = {
      name: 'test',
      variables: new Map([
        ['HOST', 'localhost'],
        ['PORT', '8080'],
        ['BASE_URL', 'http://{{HOST}}:{{PORT}}'],
        ['TOKEN', 'secret-token-123'],
      ]),
    };
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

  test('should resolve simple variable in URL', () => {
    const request = createRequest({ url: 'http://{{HOST}}' });
    const resolved = resolver.resolveRequest(request, testEnv);

    expect(resolved.url).toBe('http://localhost');
  });

  test('should resolve multiple variables in URL', () => {
    const request = createRequest({ url: 'http://{{HOST}}:{{PORT}}/api' });
    const resolved = resolver.resolveRequest(request, testEnv);

    expect(resolved.url).toBe('http://localhost:8080/api');
  });

  test('should resolve nested variables', () => {
    const request = createRequest({ url: '{{BASE_URL}}/api' });
    const resolved = resolver.resolveRequest(request, testEnv);

    expect(resolved.url).toBe('http://localhost:8080/api');
  });

  test('should resolve variables in headers', () => {
    const headers = new Map([['Authorization', 'Bearer {{TOKEN}}']]);
    const request = createRequest({ headers });
    const resolved = resolver.resolveRequest(request, testEnv);

    expect(resolved.headers.get('Authorization')).toBe('Bearer secret-token-123');
  });

  test('should resolve variables in body', () => {
    const body = '{"token": "{{TOKEN}}"}';
    const request = createRequest({ body });
    const resolved = resolver.resolveRequest(request, testEnv);

    expect(resolved.body).toBe('{"token": "secret-token-123"}');
  });

  test('should throw error for missing variable', () => {
    const request = createRequest({ url: 'http://{{MISSING}}' });

    expect(() => {
      resolver.resolveRequest(request, testEnv);
    }).toThrow('Variable "MISSING" not found');
  });

  test('should detect circular references', () => {
    const circularEnv: Environment = {
      name: 'circular',
      variables: new Map([
        ['A', '{{B}}'],
        ['B', '{{A}}'],
      ]),
    };

    const request = createRequest({ url: '{{A}}' });

    expect(() => {
      resolver.resolveRequest(request, circularEnv);
    }).toThrow('exceeded maximum depth');
  });

  test('should handle variables with whitespace', () => {
    const request = createRequest({ url: 'http://{{ HOST }}' });
    const resolved = resolver.resolveRequest(request, testEnv);

    expect(resolved.url).toBe('http://localhost');
  });

  test('should return original request if no environment', () => {
    const request = createRequest({ url: 'http://{{HOST}}' });
    const resolved = resolver.resolveRequest(request, null);

    expect(resolved.url).toBe('http://{{HOST}}');
  });

  test('should validate and find missing variables', () => {
    const text = 'http://{{HOST}}:{{MISSING}}';
    const missing = resolver.validateVariables(text, testEnv);

    expect(missing).toContain('MISSING');
    expect(missing).not.toContain('HOST');
  });

  test('should handle text with no variables', () => {
    const text = 'https://example.com/api';
    const missing = resolver.validateVariables(text, testEnv);

    expect(missing).toHaveLength(0);
  });
});