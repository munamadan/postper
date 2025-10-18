import { ResponseFormatter } from '../../../src/utils/formatter';

describe('ResponseFormatter', () => {
  let formatter: ResponseFormatter;

  beforeEach(() => {
    formatter = new ResponseFormatter();
  });

  test('should detect JSON content type', () => {
    const type = formatter.detectContentType('application/json');
    expect(type).toBe('json');
  });

  test('should detect XML content type', () => {
    const type = formatter.detectContentType('application/xml');
    expect(type).toBe('xml');
  });

  test('should detect HTML content type', () => {
    const type = formatter.detectContentType('text/html');
    expect(type).toBe('html');
  });

  test('should default to text', () => {
    const type = formatter.detectContentType('text/plain');
    expect(type).toBe('text');
  });

  test('should format valid JSON', () => {
    const json = '{"name":"John","age":30}';
    const formatted = formatter.format(json, 'json');
    expect(formatted).toContain('\n');
    expect(formatted).toContain('  ');
  });

  test('should return original for invalid JSON', () => {
    const invalid = '{not valid json}';
    const formatted = formatter.format(invalid, 'json');
    expect(formatted).toBe(invalid);
  });

  test('should truncate long text', () => {
    const longText = 'a'.repeat(60000);
    const { text, truncated } = formatter.truncate(longText, 50000);
    expect(truncated).toBe(true);
    expect(text.length).toBeLessThan(longText.length);
  });

  test('should not truncate short text', () => {
    const shortText = 'hello';
    const { text, truncated } = formatter.truncate(shortText);
    expect(truncated).toBe(false);
    expect(text).toBe(shortText);
  });
});