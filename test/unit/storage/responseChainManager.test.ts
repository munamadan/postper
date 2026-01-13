import { ResponseChainManager } from '../../../src/storage/responseChainManager';
import { HttpResponse } from '../../../src/client/types';

describe('ResponseChainManager', () => {
  let manager: ResponseChainManager;

  beforeEach(() => {
    // Create mock VSCode context
    const mockContext: any = {
      globalState: {
        get: jest.fn().mockReturnValue(null),
        update: jest.fn().mockResolvedValue(undefined),
      },
    };
    manager = new ResponseChainManager(mockContext);
  });

  test('should save and retrieve response', () => {
    const response: HttpResponse = {
      requestId: 'req-1',
      statusCode: 200,
      statusText: 'OK',
      headers: new Map([['content-type', 'application/json']]),
      body: Buffer.from('{"token": "abc123"}'),
      timings: { total: 100 },
    };

    manager.saveResponse('login', response);

    const saved = manager.getResponse('login');
    expect(saved).toBeDefined();
    expect(saved?.name).toBe('login');
    expect(saved?.status).toBe(200);
    expect(saved?.body).toEqual({ token: 'abc123' });
  });

  test('should parse JSON body', () => {
    const response: HttpResponse = {
      requestId: 'req-1',
      statusCode: 200,
      statusText: 'OK',
      headers: new Map(),
      body: Buffer.from('{"data": [1, 2, 3]}'),
      timings: { total: 100 },
    };

    manager.saveResponse('test', response);

    const saved = manager.getResponse('test');
    expect(saved?.body).toEqual({ data: [1, 2, 3] });
  });

  test('should keep non-JSON body as string', () => {
    const response: HttpResponse = {
      requestId: 'req-1',
      statusCode: 200,
      statusText: 'OK',
      headers: new Map(),
      body: Buffer.from('Plain text response'),
      timings: { total: 100 },
    };

    manager.saveResponse('test', response);

    const saved = manager.getResponse('test');
    expect(saved?.body).toBe('Plain text response');
  });

  test('should clear specific response', () => {
    const response: HttpResponse = {
      requestId: 'req-1',
      statusCode: 200,
      statusText: 'OK',
      headers: new Map(),
      body: Buffer.from('{}'),
      timings: { total: 100 },
    };

    manager.saveResponse('test1', response);
    manager.saveResponse('test2', response);

    expect(manager.getAllResponses().size).toBe(2);

    manager.clear('test1');

    expect(manager.getAllResponses().size).toBe(1);
    expect(manager.getResponse('test1')).toBeUndefined();
    expect(manager.getResponse('test2')).toBeDefined();
  });

  test('should clear all responses', () => {
    const response: HttpResponse = {
      requestId: 'req-1',
      statusCode: 200,
      statusText: 'OK',
      headers: new Map(),
      body: Buffer.from('{}'),
      timings: { total: 100 },
    };

    manager.saveResponse('test1', response);
    manager.saveResponse('test2', response);
    manager.saveResponse('test3', response);

    expect(manager.getAllResponses().size).toBe(3);

    manager.clearAll();

    expect(manager.getAllResponses().size).toBe(0);
  });

  test('should return undefined for non-existent response', () => {
    const saved = manager.getResponse('nonexistent');
    expect(saved).toBeUndefined();
  });
});
