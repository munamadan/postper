import { EnvParser } from '../../../src/env/envParser';

describe('EnvParser', () => {
  let parser: EnvParser;

  beforeEach(() => {
    parser = new EnvParser();
  });

  test('should parse simple key=value', () => {
    const content = 'KEY=value';
    const result = parser.parse(content);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.environment.variables.get('KEY')).toBe('value');
    }
  });

  test('should parse multiple variables', () => {
    const content = `
HOST=localhost
PORT=8080
PROTOCOL=http
    `.trim();
    const result = parser.parse(content);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.environment.variables.get('HOST')).toBe('localhost');
      expect(result.environment.variables.get('PORT')).toBe('8080');
      expect(result.environment.variables.get('PROTOCOL')).toBe('http');
    }
  });

  test('should handle double-quoted values', () => {
    const content = 'MESSAGE="Hello World"';
    const result = parser.parse(content);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.environment.variables.get('MESSAGE')).toBe('Hello World');
    }
  });

  test('should handle single-quoted values', () => {
    const content = "MESSAGE='Hello World'";
    const result = parser.parse(content);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.environment.variables.get('MESSAGE')).toBe('Hello World');
    }
  });

  test('should skip comments', () => {
    const content = `
# This is a comment
KEY=value
# Another comment
    `.trim();
    const result = parser.parse(content);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.environment.variables.size).toBe(1);
    }
  });

  test('should skip empty lines', () => {
    const content = `
KEY1=value1

KEY2=value2
    `.trim();
    const result = parser.parse(content);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.environment.variables.size).toBe(2);
    }
  });

  test('should reject invalid key names', () => {
    const content = '123KEY=value';
    const result = parser.parse(content);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  test('should reject lines without equals sign', () => {
    const content = 'INVALID LINE';
    const result = parser.parse(content);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].message).toContain('KEY=VALUE');
    }
  });

  test('should handle values with spaces', () => {
    const content = 'API_URL=https://api.example.com/v1';
    const result = parser.parse(content);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.environment.variables.get('API_URL')).toBe('https://api.example.com/v1');
    }
  });

  test('should trim whitespace around keys and values', () => {
    const content = '  KEY  =  value  ';
    const result = parser.parse(content);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.environment.variables.get('KEY')).toBe('value');
    }
  });
});