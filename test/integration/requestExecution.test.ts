import { HttpParser } from '../../src/parser/httpParser';
import { RequestValidator } from '../../src/parser/requestValidator';

describe('Request Execution Integration', () => {
  let parser: HttpParser;
  let validator: RequestValidator;

  beforeEach(() => {
    parser = new HttpParser();
    validator = new RequestValidator();
  });

  test('should parse and validate simple request', () => {
    const content = 'GET https://httpbin.org/get';
    const parseResult = parser.parse(content);

    expect(parseResult.success).toBe(true);
    if (parseResult.success) {
      const request = parseResult.requests[0];
      const validationError = validator.validate(request);
      expect(validationError).toBeNull();
    }
  });

  test('should parse POST request with JSON body', () => {
    const content = `POST https://httpbin.org/post
Content-Type: application/json

{"name": "test"}`;
    const parseResult = parser.parse(content);

    expect(parseResult.success).toBe(true);
    if (parseResult.success) {
      expect(parseResult.requests[0].body).toContain('name');
    }
  });

  test('should handle multiple requests', () => {
    const content = `GET https://httpbin.org/get

###

POST https://httpbin.org/post
Content-Type: application/json

{"data": "test"}`;
    const parseResult = parser.parse(content);

    expect(parseResult.success).toBe(true);
    if (parseResult.success) {
      expect(parseResult.requests).toHaveLength(2);
      parseResult.requests.forEach((req) => {
        const error = validator.validate(req);
        expect(error).toBeNull();
      });
    }
  });
});