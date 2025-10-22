import { HttpParser } from '../../../src/parser/httpParser';

describe('HttpParser - Edge Cases', () => {
  let parser: HttpParser;

  beforeEach(() => {
    parser = new HttpParser();
  });

  test('should handle request with only URL (no headers, no body)', () => {
    const content = 'GET https://example.com';
    const result = parser.parse(content);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.requests).toHaveLength(1);
      expect(result.requests[0].headers.size).toBe(0);
      expect(result.requests[0].body).toBeFalsy();
    }
  });

  test('should handle trailing whitespace in request line', () => {
    const content = 'GET https://example.com   \n';
    const result = parser.parse(content);

    expect(result.success).toBe(true);
  });

  test('should handle mixed separators (### and ---)', () => {
    const content = `GET https://example.com

###

POST https://example.com

---

PUT https://example.com`;

    const result = parser.parse(content);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.requests).toHaveLength(3);
    }
  });

  test('should handle body with empty lines', () => {
    const content = `POST https://example.com
Content-Type: application/json

{
  "name": "test",

  "age": 30
}`;

    const result = parser.parse(content);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.requests[0].body).toContain('"name"');
      expect(result.requests[0].body).toContain('"age"');
    }
  });

  test('should handle multiple consecutive empty lines', () => {
    const content = `GET https://example.com


###


POST https://example.com`;

    const result = parser.parse(content);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.requests).toHaveLength(2);
    }
  });

  test('should handle headers with empty values', () => {
    const content = `GET https://example.com
X-Custom-Header: `;

    const result = parser.parse(content);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.requests[0].headers.get('X-Custom-Header')).toBe('');
    }
  });

  test('should handle very long header values', () => {
    const longValue = 'a'.repeat(1000);
    const content = `GET https://example.com
Authorization: Bearer ${longValue}`;

    const result = parser.parse(content);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.requests[0].headers.get('Authorization')).toContain('Bearer');
    }
  });

  test('should handle URLs with query parameters', () => {
    const content = 'GET https://example.com/api?page=1&limit=10';
    const result = parser.parse(content);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.requests[0].url).toContain('?page=1');
    }
  });

  test('should handle URLs with fragments', () => {
    const content = 'GET https://example.com/page#section';
    const result = parser.parse(content);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.requests[0].url).toContain('#section');
    }
  });

  test('should reject malformed URLs', () => {
    const content = 'GET not-a-url';
    const result = parser.parse(content);

    expect(result.success).toBe(false);
  });

  test('should handle body with special characters', () => {
    const content = `POST https://example.com
Content-Type: application/json

{"message": "Hello \"World\" with 'quotes'"}`;

    const result = parser.parse(content);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.requests[0].body).toContain('"World"');
    }
  });
});

describe('HttpParser - Performance', () => {
  let parser: HttpParser;

  beforeEach(() => {
    parser = new HttpParser();
  });

  test('should parse 1000 requests in under 500ms', () => {
    // Generate 1000 requests
    const requests = Array(1000)
      .fill(null)
      .map((_, i) => `GET https://example.com/${i}\nAccept: application/json\n\n###\n\n`)
      .join('');

    const start = Date.now();
    const result = parser.parse(requests);
    const elapsed = Date.now() - start;

    console.log(`Parsed 1000 requests in ${elapsed}ms`);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.requests).toHaveLength(1000);
    }
    expect(elapsed).toBeLessThan(500);
  });

  test('should parse complex requests efficiently', () => {
    // Generate 100 complex requests with headers and body
    const requests = Array(100)
      .fill(null)
      .map(
        (_, i) => `POST https://example.com/api/${i}
Content-Type: application/json
Authorization: Bearer token-${i}
X-Request-ID: req-${i}

{
  "id": ${i},
  "name": "User ${i}",
  "data": {
    "nested": "value"
  }
}

###

`
      )
      .join('');

    const start = Date.now();
    const result = parser.parse(requests);
    const elapsed = Date.now() - start;

    console.log(`Parsed 100 complex requests in ${elapsed}ms`);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.requests).toHaveLength(100);
    }
    expect(elapsed).toBeLessThan(200);
  });
});
