import { ChainResolver } from '../../../src/env/chainResolver';
import { RequestChainContext, SavedResponse } from '../../../src/types/requestChain';

describe('ChainResolver', () => {
  let resolver: ChainResolver;
  let context: RequestChainContext;

  beforeEach(() => {
    resolver = new ChainResolver();

    const loginResponse: SavedResponse = {
      name: 'login',
      status: 200,
      headers: new Map([['content-type', 'application/json']]),
      body: {
        token: 'abc123',
        user: {
          id: 42,
          name: 'John Doe',
        },
      },
      rawBody: Buffer.from(''),
      timestamp: Date.now(),
    };

    const usersResponse: SavedResponse = {
      name: 'getUsers',
      status: 200,
      headers: new Map([['xtotalcount', '100']]),
      body: [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ],
      rawBody: Buffer.from(''),
      timestamp: Date.now(),
    };

    context = {
      responses: new Map([
        ['login', loginResponse],
        ['getUsers', usersResponse],
      ]),
    };
  });

  test('should resolve simple body property', () => {
    const text = '{{login.response.body.token}}';
    const result = resolver.resolve(text, context);

    expect(result).toBe('abc123');
  });

  test('should resolve nested body property', () => {
    const text = '{{login.response.body.user.id}}';
    const result = resolver.resolve(text, context);

    expect(result).toBe('42');
  });

  test('should resolve array element', () => {
    const text = '{{getUsers.response.body[0].name}}';
    const result = resolver.resolve(text, context);

    expect(result).toBe('Alice');
  });

  test('should resolve header', () => {
    const text = '{{getUsers.response.headers.xtotalcount}}';
    const result = resolver.resolve(text, context);

    expect(result).toBe('100');
  });

  test('should resolve status', () => {
    const text = 'Status was {{login.response.status}}';
    const result = resolver.resolve(text, context);

    expect(result).toBe('Status was 200');
  });

  test('should resolve multiple variables in same string', () => {
    const text = 'Bearer {{login.response.body.token}} for user {{login.response.body.user.id}}';
    const result = resolver.resolve(text, context);

    expect(result).toBe('Bearer abc123 for user 42');
  });

  test('should leave unresolved variables unchanged', () => {
    const text = '{{nonexistent.response.body.value}}';
    const result = resolver.resolve(text, context);

    expect(result).toBe('{{nonexistent.response.body.value}}');
  });

  test('should handle text without variables', () => {
    const text = 'No variables here';
    const result = resolver.resolve(text, context);

    expect(result).toBe('No variables here');
  });

  test('should return undefined for missing nested property', () => {
    const text = '{{login.response.body.missing.property}}';
    const result = resolver.resolve(text, context);

    expect(result).toBe('{{login.response.body.missing.property}}');
  });
});
