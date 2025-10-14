import { HttpParser } from '../../../src/parser/httpParser';

describe('HttpParser', () => {
  let parser: HttpParser;

  beforeEach(() => {
    parser = new HttpParser();
  });

  test('should parse simple GET request', () => {
    const content = 'GET https://example.com\nContent-Type: application/json';
    const result = parser.parse(content);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.requests).toHaveLength(1);
      expect(result.requests[0].method).toBe('GET');
      expect(result.requests[0].url).toBe('https://example.com');
    }
  });

  test('should parse POST request with body', () => {
    const content = `POST https://example.com
Content-Type: application/json

{"name": "John"}`;
    const result = parser.parse(content);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.requests[0].method).toBe('POST');
      expect(result.requests[0].body).toContain('{"name": "John"}');
    }
  });

  test('should parse multiple requests separated by ###', () => {
    const content = `GET https://example.com

###

POST https://example.com
Content-Type: application/json

{"data": "test"}`;
    const result = parser.parse(content);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.requests).toHaveLength(2);
      expect(result.requests[0].method).toBe('GET');
      expect(result.requests[1].method).toBe('POST');
    }
  });

  test('should handle comments', () => {
    const content = `# This is a comment
GET https://example.com
# Another comment
Authorization: Bearer token`;
    const result = parser.parse(content);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.requests).toHaveLength(1);
    }
  });

  test('should reject invalid HTTP method', () => {
    const content = 'INVALID https://example.com';
    const result = parser.parse(content);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Invalid HTTP method');
    }
  });

  test('should reject invalid URL', () => {
    const content = 'GET invalid-url';
    const result = parser.parse(content);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].message).toContain('Invalid URL');
    }
  });

  test('should parse all HTTP methods', () => {
    const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

    methods.forEach((method) => {
      const content = `${method} https://example.com`;
      const result = parser.parse(content);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.requests[0].method).toBe(method);
      }
    });
  });

  test('should handle empty input', () => {
    const result = parser.parse('');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.requests).toHaveLength(0);
    }
  });

  test('should assign unique IDs to requests', () => {
    const content = `GET https://example.com

###

POST https://example.com`;
    const result = parser.parse(content);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.requests[0].id).toBe('req-1');
      expect(result.requests[1].id).toBe('req-2');
    }
  });
});