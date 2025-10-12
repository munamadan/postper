import {
  HttpRequest,
  HttpResponse,
  HttpMethod,
  RequestMetadata,
} from '../../../src/types/common';

describe('Type Definitions', () => {
  test('should define HttpMethod type correctly', () => {
    const method: HttpMethod = 'GET';
    expect(method).toBe('GET');
  });

  test('should create valid HttpRequest object', () => {
    const request: HttpRequest = {
      id: 'req-1',
      method: 'GET',
      url: 'https://example.com',
      headers: new Map([['Content-Type', 'application/json']]),
      timeout: 30000,
      metadata: {
        fileUri: 'file:///test.http',
        lineNumber: 1,
        timestamp: Date.now(),
      },
    };

    expect(request.id).toBe('req-1');
    expect(request.method).toBe('GET');
  });

  test('should create valid HttpResponse object', () => {
    const response: HttpResponse = {
      requestId: 'req-1',
      statusCode: 200,
      statusText: 'OK',
      headers: new Map([['Content-Type', 'application/json']]),
      body: Buffer.from('{}'),
      timings: { total: 100 },
    };

    expect(response.statusCode).toBe(200);
  });

  test('should create valid RequestMetadata object', () => {
    const metadata: RequestMetadata = {
      fileUri: 'file:///test.http',
      lineNumber: 1,
      timestamp: Date.now(),
    };

    expect(metadata.lineNumber).toBe(1);
  });
});