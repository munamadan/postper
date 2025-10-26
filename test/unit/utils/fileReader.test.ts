import * as fs from 'fs';
import * as path from 'path';
import { FileReader } from '../../../src/utils/fileReader';

describe('FileReader', () => {
  let reader: FileReader;
  const testDir = path.join(__dirname, '../../fixtures/files');

  beforeAll(() => {
    // Create test directory and files
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    fs.writeFileSync(path.join(testDir, 'test.txt'), 'Hello World');
    fs.writeFileSync(path.join(testDir, 'test.json'), '{"test": true}');
  });

  beforeEach(() => {
    reader = new FileReader();
  });

  afterAll(() => {
    // Clean up test files
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
  });

  test('should read text file', async () => {
    const result = await reader.readFile(path.join(testDir, 'test.txt'));

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.toString()).toBe('Hello World');
    expect(result.contentType).toBe('text/plain');
  });

  test('should read JSON file', async () => {
    const result = await reader.readFile(path.join(testDir, 'test.json'));

    expect(result.success).toBe(true);
    expect(result.contentType).toBe('application/json');
  });

  test('should handle non-existent file', async () => {
    const result = await reader.readFile(path.join(testDir, 'nonexistent.txt'));

    expect(result.success).toBe(false);
    expect(result.error).toContain('File not found');
  });

  test('should resolve relative paths', async () => {
    const result = await reader.readFile('./test.txt', testDir);

    expect(result.success).toBe(true);
  });

  test('should detect content types', async () => {
    const testCases = [
      { file: 'test.pdf', expected: 'application/pdf' },
      { file: 'test.jpg', expected: 'image/jpeg' },
      { file: 'test.png', expected: 'image/png' },
      { file: 'test.unknown', expected: 'application/octet-stream' },
    ];

    for (const { file, expected } of testCases) {
      const filePath = path.join(testDir, file);
      fs.writeFileSync(filePath, 'dummy');

      const result = await reader.readFile(filePath);
      expect(result.contentType).toBe(expected);

      fs.unlinkSync(filePath);
    }
  });
});
