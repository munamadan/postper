import { HttpParser } from '../../src/parser/httpParser';

describe('Edge Cases - URLs', () => {
  let parser: HttpParser;

  beforeEach(() => {
    parser = new HttpParser();
  });

  test('should handle very long URL (2000+ chars)', () => {
    const longPath = 'a'.repeat(2000);
    const content = `GET https://example.com/${longPath}`;

    const result = parser.parse(content);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.requests).toHaveLength(1);
      expect(result.requests[0].url.length).toBeGreaterThan(2000);
    }
  });

  test('should handle URL with unicode characters', () => {
    const content = `GET https://example.com/search?q=日本語&emoji=🎉`;

    const result = parser.parse(content);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.requests[0].url).toContain('日本語');
      expect(result.requests[0].url).toContain('🎉');
    }
  });

  test('should handle URL with all special characters', () => {
    const content = `GET https://example.com/path?a=1&b=2&c=hello%20world&d=test@email.com&e=value+with+plus`;

    const result = parser.parse(content);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.requests[0].url).toContain('?a=1&b=2');
    }
  });

  test('should handle extremely long query string', () => {
    const params = Array(100)
      .fill(null)
      .map((_, i) => `param${i}=value${i}`)
      .join('&');
    const content = `GET https://example.com/api?${params}`;

    const result = parser.parse(content);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.requests[0].url).toContain('param99=value99');
    }
  });
});

describe('Edge Cases - Request Bodies', () => {
  let parser: HttpParser;

  beforeEach(() => {
    parser = new HttpParser();
  });

  test('should handle large JSON body (1MB+)', () => {
    const largeArray = Array(10000)
      .fill(null)
      .map((_, i) => ({
        id: i,
        name: `User ${i}`,
        data: 'x'.repeat(100),
      }));

    const content = `POST https://example.com/bulk
Content-Type: application/json

${JSON.stringify(largeArray)}`;

    const result = parser.parse(content);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.requests[0].body).toBeDefined();
      expect(result.requests[0].body!.length).toBeGreaterThan(1000000);
    }
  });

  test('should handle body with unicode characters', () => {
    const content = `POST https://example.com/api
Content-Type: application/json

{
  "message": "Hello 世界! 🌍",
  "emoji": "😀😃😄😁",
  "chinese": "你好",
  "japanese": "こんにちは",
  "korean": "안녕하세요"
}`;

    const result = parser.parse(content);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.requests[0].body).toContain('世界');
      expect(result.requests[0].body).toContain('🌍');
      expect(result.requests[0].body).toContain('こんにちは');
    }
  });

  test('should handle body with escaped characters', () => {
    const content = `POST https://example.com/api
Content-Type: application/json

{
  "quote": "He said \\"Hello\\"",
  "newline": "Line 1\\nLine 2",
  "tab": "Col1\\tCol2",
  "backslash": "Path\\\\to\\\\file"
}`;

    const result = parser.parse(content);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.requests[0].body).toContain('\\"Hello\\"');
      expect(result.requests[0].body).toContain('\\n');
    }
  });

  test('should handle body with control characters', () => {
    const content = `POST https://example.com/api
Content-Type: text/plain

Line 1\r\nLine 2\r\nLine 3`;

    const result = parser.parse(content);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.requests[0].body).toContain('Line 1');
      expect(result.requests[0].body).toContain('Line 3');
    }
  });
});

describe('Edge Cases - Headers', () => {
  let parser: HttpParser;

  beforeEach(() => {
    parser = new HttpParser();
  });

  test('should handle very long header value', () => {
    const longValue = 'a'.repeat(5000);
    const content = `GET https://example.com
X-Long-Header: ${longValue}`;

    const result = parser.parse(content);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.requests[0].headers.get('X-Long-Header')?.length).toBe(5000);
    }
  });

  test('should handle header with unicode', () => {
    const content = `GET https://example.com
X-Custom-Header: 日本語ヘッダー`;

    const result = parser.parse(content);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.requests[0].headers.get('X-Custom-Header')).toContain('日本語');
    }
  });

  test('should handle many headers', () => {
    const headers = Array(100)
      .fill(null)
      .map((_, i) => `X-Header-${i}: value-${i}`)
      .join('\n');
    const content = `GET https://example.com
${headers}`;

    const result = parser.parse(content);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.requests[0].headers.size).toBe(100);
      expect(result.requests[0].headers.get('X-Header-99')).toBe('value-99');
    }
  });
});

describe('Edge Cases - Malformed Content', () => {
  let parser: HttpParser;

  beforeEach(() => {
    parser = new HttpParser();
  });

  test('should handle invalid JSON gracefully (parsing succeeds)', () => {
    const content = `POST https://example.com
Content-Type: application/json

{
  "invalid": json here
}`;

    const result = parser.parse(content);

    expect(result.success).toBe(true);
    // Parser doesn't validate JSON, just captures body
    if (result.success) {
      expect(result.requests[0].body).toContain('invalid');
    }
  });

  test('should handle mixed line endings', () => {
    const content = 'GET https://example.com\r\nAuthorization: Bearer token\n\r\n';

    const result = parser.parse(content);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.requests[0].headers.get('Authorization')).toBe('Bearer token');
    }
  });

  test('should handle file with only separators', () => {
    const content = `###
---
###
---`;

    const result = parser.parse(content);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.requests).toHaveLength(0);
    }
  });
});

describe('Edge Cases - Performance', () => {
  let parser: HttpParser;

  beforeEach(() => {
    parser = new HttpParser();
  });

  test('should parse file with 1000+ requests quickly', () => {
    const requests = Array(1500)
      .fill(null)
      .map((_, i) => `GET https://example.com/item/${i}\n###\n`)
      .join('\n');

    const start = Date.now();
    const result = parser.parse(requests);
    const elapsed = Date.now() - start;

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.requests).toHaveLength(1500);
    }
    expect(elapsed).toBeLessThan(1000); // Should complete in <1s
  });

  test('should handle deeply nested JSON', () => {
    let nested: any = { value: 'deep' };
    for (let i = 0; i < 100; i++) {
      nested = { level: i, data: nested };
    }

    const content = `POST https://example.com
Content-Type: application/json

${JSON.stringify(nested)}`;

    const result = parser.parse(content);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.requests[0].body).toContain('"value":"deep"');
    }
  });
});
