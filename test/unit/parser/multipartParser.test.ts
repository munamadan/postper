import { MultipartParser } from '../../../src/parser/multipartParser';

describe('MultipartParser', () => {
  let parser: MultipartParser;

  beforeEach(() => {
    parser = new MultipartParser();
  });

  describe('Standard Multipart Syntax', () => {
    test('should parse simple text field', () => {
      const body = `------WebKitFormBoundary
Content-Disposition: form-data; name="description"

Test description
------WebKitFormBoundary--`;

      const result = parser.parse(body, '----WebKitFormBoundary');

      expect(result.success).toBe(true);
      expect(result.multipart?.parts).toHaveLength(1);
      expect(result.multipart?.parts[0].name).toBe('description');
      expect(result.multipart?.parts[0].value).toBe('Test description');
    });

    test('should parse file reference', () => {
      const body = `------WebKitFormBoundary
Content-Disposition: form-data; name="file"; filename="test.pdf"
Content-Type: application/pdf

< ./uploads/test.pdf
------WebKitFormBoundary--`;

      const result = parser.parse(body, '----WebKitFormBoundary');

      expect(result.success).toBe(true);
      expect(result.multipart?.parts).toHaveLength(1);
      expect(result.multipart?.parts[0].name).toBe('file');
      expect(result.multipart?.parts[0].filename).toBe('test.pdf');
      expect(result.multipart?.parts[0].contentType).toBe('application/pdf');
      expect(result.multipart?.parts[0].filePath).toBe('./uploads/test.pdf');
    });

    test('should parse multiple parts', () => {
      const body = `------WebKitFormBoundary
Content-Disposition: form-data; name="title"

My Document
------WebKitFormBoundary
Content-Disposition: form-data; name="file"; filename="doc.pdf"

< ./doc.pdf
------WebKitFormBoundary--`;

      const result = parser.parse(body, '----WebKitFormBoundary');

      expect(result.success).toBe(true);
      expect(result.multipart?.parts).toHaveLength(2);
      expect(result.multipart?.parts[0].name).toBe('title');
      expect(result.multipart?.parts[1].name).toBe('file');
    });
  });

  describe('Simplified Syntax', () => {
    test('should parse simplified field syntax', () => {
      const body = `--boundary
name: description
value: Test description
--boundary--`;

      const result = parser.parse(body, 'boundary');

      expect(result.success).toBe(true);
      expect(result.multipart?.parts).toHaveLength(1);
      expect(result.multipart?.parts[0].name).toBe('description');
    });

    test('should parse simplified file syntax', () => {
      const body = `--boundary
name: avatar
filename: profile.jpg

< ./images/profile.jpg
--boundary--`;

      const result = parser.parse(body, 'boundary');

      expect(result.success).toBe(true);
      expect(result.multipart?.parts).toHaveLength(1);
      expect(result.multipart?.parts[0].name).toBe('avatar');
      expect(result.multipart?.parts[0].filename).toBe('profile.jpg');
      expect(result.multipart?.parts[0].filePath).toBe('./images/profile.jpg');
    });
  });

  describe('Boundary Extraction', () => {
    test('should extract boundary from Content-Type', () => {
      const contentType = 'multipart/form-data; boundary=----WebKitFormBoundary';
      const boundary = MultipartParser.extractBoundary(contentType);

      expect(boundary).toBe('----WebKitFormBoundary');
    });

    test('should extract boundary with quotes', () => {
      const contentType = 'multipart/form-data; boundary="----WebKitFormBoundary"';
      const boundary = MultipartParser.extractBoundary(contentType);

      expect(boundary).toBe('----WebKitFormBoundary');
    });

    test('should return null if no boundary', () => {
      const contentType = 'multipart/form-data';
      const boundary = MultipartParser.extractBoundary(contentType);

      expect(boundary).toBeNull();
    });
  });

  describe('Boundary Generation', () => {
    test('should generate valid boundary', () => {
      const boundary = MultipartParser.generateBoundary();

      expect(boundary).toMatch(/^----WebKitFormBoundary/);
      expect(boundary.length).toBeGreaterThan(20);
    });

    test('should generate unique boundaries', () => {
      const boundary1 = MultipartParser.generateBoundary();
      const boundary2 = MultipartParser.generateBoundary();

      expect(boundary1).not.toBe(boundary2);
    });
  });

  describe('Error Handling', () => {
    test('should fail with no parts', () => {
      const body = `------WebKitFormBoundary--`;

      const result = parser.parse(body, '----WebKitFormBoundary');

      expect(result.success).toBe(false);
      expect(result.error).toContain('No multipart parts found');
    });

    test('should skip parts without name', () => {
      const body = `------WebKitFormBoundary
Content-Disposition: form-data

No name field
------WebKitFormBoundary--`;

      const result = parser.parse(body, '----WebKitFormBoundary');

      expect(result.success).toBe(false);
    });
  });
});
