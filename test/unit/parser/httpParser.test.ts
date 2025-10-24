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

describe('HttpParser - Robustness Improvements', () => {
  let parser: HttpParser;

  beforeEach(() => {
    parser = new HttpParser();
  });

  describe('Multiple Consecutive Separators', () => {
    test('should handle multiple ### separators', () => {
      const content = `GET https://example.com/users
###
###
###
POST https://example.com/users
Content-Type: application/json

{"name": "John"}`;

      const result = parser.parse(content);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.requests).toHaveLength(2);
        expect(result.requests[0].method).toBe('GET');
        expect(result.requests[1].method).toBe('POST');
      }
    });

    test('should handle file starting with separators', () => {
      const content = `###
---
###
GET https://example.com/test`;

      const result = parser.parse(content);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.requests).toHaveLength(1);
      }
    });

    test('should handle file ending with separators', () => {
      const content = `GET https://example.com/test
###
###
###`;

      const result = parser.parse(content);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.requests).toHaveLength(1);
      }
    });
  });

  describe('Inline Comments', () => {
    test('should strip inline comments from request line', () => {
      const content = 'GET https://example.com/users # Fetch all users';

      const result = parser.parse(content);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.requests).toHaveLength(1);
        expect(result.requests[0].url).toBe('https://example.com/users');
      }
    });

    test('should preserve # in URL fragments', () => {
      const content = 'GET https://example.com/page#section # Navigate here';

      const result = parser.parse(content);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.requests[0].url).toBe('https://example.com/page#section');
      }
    });

    test('should handle multiple # in comments', () => {
      const content = 'POST /api/users # Create user ## Important ## Priority';

      const result = parser.parse(content);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.requests[0].method).toBe('POST');
        expect(result.requests[0].url).toBe('/api/users');
      }
    });
  });

  describe('Comment Lines', () => {
    test('should skip # comment lines', () => {
      const content = `# This is a comment
GET https://example.com/users

# Comment between sections
###
POST https://example.com/users`;

      const result = parser.parse(content);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.requests).toHaveLength(2);
      }
    });

    test('should support // style comments', () => {
      const content = `// JavaScript-style comment
GET /api/test
// Another comment`;

      const result = parser.parse(content);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.requests).toHaveLength(1);
      }
    });

    test('should handle comment-only file', () => {
      const content = `# This file only has comments
# No actual requests
// Maybe a TODO list`;

      const result = parser.parse(content);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.requests).toHaveLength(0);
      }
    });
  });

  describe('Whitespace Tolerance', () => {
    test('should handle excessive blank lines between sections', () => {
      const content = `


GET https://example.com/users



Authorization: Bearer token



`;

      const result = parser.parse(content);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.requests).toHaveLength(1);
        expect(result.requests[0].headers.get('Authorization')).toBe('Bearer token');
      }
    });

    test('should trim trailing blank lines from body', () => {
      const content = `POST /api/users
Content-Type: application/json

{"name": "John"}



###
GET /api/test`;

      const result = parser.parse(content);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.requests[0].body).toBe('{"name": "John"}');
        expect(result.requests[0].body).not.toContain('\n\n\n');
      }
    });

    test('should preserve intentional blank lines in body', () => {
      const content = `POST /api/multiline
Content-Type: text/plain

Line 1

Line 3 with gap above
###`;

      const result = parser.parse(content);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.requests[0].body).toBe('Line 1\n\nLine 3 with gap above');
      }
    });
  });

  describe('Incomplete Requests', () => {
    test('should handle file ending mid-request', () => {
      const content = `GET /api/complete
###
POST /api/incomplete
Content-Type: application/json`;

      const result = parser.parse(content);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.requests).toHaveLength(2);
        expect(result.requests[1].headers.get('Content-Type')).toBe('application/json');
        expect(result.requests[1].body).toBeFalsy();
      }
    });

    test('should handle request with headers but no body', () => {
      const content = `POST /api/users
Content-Type: application/json
Authorization: Bearer token
###`;

      const result = parser.parse(content);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.requests).toHaveLength(1);
        expect(result.requests[0].body).toBeFalsy();
      }
    });
  });

  describe('Enhanced Error Messages', () => {
    test('should provide helpful error for invalid method', () => {
      const content = 'INVALID https://example.com';

      const result = parser.parse(content);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].message).toContain('Invalid HTTP method');
        expect(result.errors[0].message).toContain('GET, POST, PUT');
      }
    });

    test('should continue parsing after error', () => {
      const content = `INVALID https://test.com
###
GET https://example.com/valid`;

      const result = parser.parse(content);

      expect(result.success).toBe(false);
      expect(result.requests).toHaveLength(1);
      expect(result.requests[0].method).toBe('GET');
      if (!result.success) {
        expect(result.errors).toHaveLength(1);
      }
    });

    test('should provide error for malformed header', () => {
      const content = `GET https://example.com
InvalidHeaderNoColon`;

      const result = parser.parse(content);

      expect(result.success).toBe(false);
      if (result.errors && result.errors.length > 0) {
        expect(result.errors[0].message).toContain('Invalid header format');
        expect(result.errors[0].message).toContain('missing colon');
      }
    });
  });
});
