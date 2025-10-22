import { ResponseFormatter } from '../../../src/utils/formatter';

describe('ResponseFormatter', () => {
  let formatter: ResponseFormatter;

  beforeEach(() => {
    formatter = new ResponseFormatter();
  });

  describe('Content Type Detection', () => {
    test('should detect JSON content type', () => {
      const type = formatter.detectContentType('application/json');
      expect(type).toBe('json');
    });

    test('should detect text/json as JSON', () => {
      const type = formatter.detectContentType('text/json; charset=utf-8');
      expect(type).toBe('json');
    });

    test('should detect XML content type', () => {
      const type = formatter.detectContentType('application/xml');
      expect(type).toBe('xml');
    });

    test('should detect text/xml as XML', () => {
      const type = formatter.detectContentType('text/xml');
      expect(type).toBe('xml');
    });

    test('should detect HTML content type', () => {
      const type = formatter.detectContentType('text/html');
      expect(type).toBe('html');
    });

    test('should default to text for unknown types', () => {
      const type = formatter.detectContentType('application/octet-stream');
      expect(type).toBe('text');
    });

    test('should handle empty content type', () => {
      const type = formatter.detectContentType('');
      expect(type).toBe('text');
    });

    test('should be case-insensitive', () => {
      const type = formatter.detectContentType('APPLICATION/JSON');
      expect(type).toBe('json');
    });
  });

  describe('JSON Formatting', () => {
    test('should format valid JSON', () => {
      const json = '{"name":"John","age":30}';
      const formatted = formatter.format(json, 'json');
      expect(formatted).toContain('\n');
      expect(formatted).toContain('  ');
      expect(formatted).toContain('"name"');
    });

    test('should return original for invalid JSON', () => {
      const invalid = '{not valid json}';
      const formatted = formatter.format(invalid, 'json');
      expect(formatted).toBe(invalid);
    });

    test('should format nested JSON objects', () => {
      const json = '{"user":{"name":"John","details":{"age":30}}}';
      const formatted = formatter.format(json, 'json');
      expect(formatted).toContain('\n');
      expect(formatted.split('\n').length).toBeGreaterThan(3);
    });

    test('should format JSON arrays', () => {
      const json = '[{"id":1},{"id":2}]';
      const formatted = formatter.format(json, 'json');
      expect(formatted).toContain('\n');
    });

    test('should handle empty JSON object', () => {
      const json = '{}';
      const formatted = formatter.format(json, 'json');
      expect(formatted).toBe('{}');
    });

    test('should handle empty JSON array', () => {
      const json = '[]';
      const formatted = formatter.format(json, 'json');
      expect(formatted).toBe('[]');
    });
  });

  describe('XML Formatting', () => {
    test('should format simple XML', () => {
      const xml = '<root><item>value</item></root>';
      const formatted = formatter.format(xml, 'xml');
      expect(formatted).toContain('\n');
      expect(formatted.split('\n').length).toBeGreaterThan(1);
    });

    test('should format nested XML', () => {
      const xml = '<root><parent><child>value</child></parent></root>';
      const formatted = formatter.format(xml, 'xml');
      expect(formatted).toContain('\n');
    });

    test('should handle self-closing tags', () => {
      const xml = '<root><item/></root>';
      const formatted = formatter.format(xml, 'xml');
      expect(formatted).toContain('item');
    });

    test('should handle XML with attributes', () => {
      const xml = '<root id="1"><item name="test"/></root>';
      const formatted = formatter.format(xml, 'xml');
      expect(formatted).toContain('name="test"');
    });
  });

  describe('HTML Formatting', () => {
    test('should format HTML', () => {
      const html = '<html><body><p>Hello</p></body></html>';
      const formatted = formatter.format(html, 'html');
      expect(formatted).toContain('\n');
    });
  });

  describe('Text Formatting', () => {
    test('should return text unchanged', () => {
      const text = 'Plain text content';
      const formatted = formatter.format(text, 'text');
      expect(formatted).toBe(text);
    });
  });

  describe('Truncation', () => {
    test('should truncate long text', () => {
      const longText = 'a'.repeat(60000);
      const { text, truncated } = formatter.truncate(longText, 50000);
      expect(truncated).toBe(true);
      expect(text.length).toBeLessThan(longText.length);
      expect(text).toContain('truncated');
    });

    test('should not truncate short text', () => {
      const shortText = 'hello';
      const { text, truncated } = formatter.truncate(shortText);
      expect(truncated).toBe(false);
      expect(text).toBe(shortText);
    });

    test('should handle empty string', () => {
      const result = formatter.truncate('');
      expect(result.truncated).toBe(false);
      expect(result.text).toBe('');
    });

    test('should handle text exactly at limit', () => {
      const exactText = 'a'.repeat(50000);
      const { text, truncated } = formatter.truncate(exactText, 50000);
      expect(truncated).toBe(false);
      expect(text).toBe(exactText);
    });

    test('should use default max length', () => {
      const longText = 'a'.repeat(60000);
      const { text, truncated } = formatter.truncate(longText);
      expect(truncated).toBe(true);
      expect(text.length).toBeLessThan(longText.length);
    });
  });
});