import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import { HttpClient } from '../../../src/http/client';
import { ValidationError, ServerError } from '../../../src/common/errors';

describe('HttpClient', () => {
  const mockConfig = {
    apiKey: 'wave_test_api_key_12345',
    baseUrl: 'https://test-api.wave.com',
    timeout: 5000,
    debug: false,
  };

  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should initialize with correct configuration', () => {
    const httpClient = new HttpClient(mockConfig);
    expect(httpClient).toBeDefined();
  });

  it('should make GET requests correctly', async () => {
    const mockResponse = { id: '123', name: 'Test' };

    global.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve(mockResponse),
      } as Response)
    );

    const httpClient = new HttpClient(mockConfig);
    const result = await httpClient.get('/test', { param: 'value' });

    expect(result).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalled();
  });

  it('should make POST requests correctly', async () => {
    const mockResponse = { success: true };

    global.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve(mockResponse),
      } as Response)
    );

    const httpClient = new HttpClient(mockConfig);
    const result = await httpClient.post('/test', { name: 'Test' });

    expect(result).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalled();
  });

  it('should handle API errors correctly', async () => {
    const errorResponse = {
      code: 'request-validation-error',
      message: 'Validation failed',
    };

    global.fetch = mock(() =>
      Promise.resolve({
        ok: false,
        status: 422,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve(errorResponse),
      } as Response)
    );

    const httpClient = new HttpClient(mockConfig);

    await expect(httpClient.get('/test')).rejects.toThrow(ValidationError);
  });

  it('should handle server errors correctly', async () => {
    const errorResponse = {
      code: 'internal-server-error',
      message: 'Server error',
    };

    global.fetch = mock(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve(errorResponse),
      } as Response)
    );

    const httpClient = new HttpClient(mockConfig);

    await expect(httpClient.post('/test', { data: 'value' })).rejects.toThrow(ServerError);
  });

  it('should include query parameters in GET requests', async () => {
    const mockResponse = { data: 'test' };
    let capturedUrl = '';

    global.fetch = mock((url: string) => {
      capturedUrl = url;
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve(mockResponse),
      } as Response);
    });

    const httpClient = new HttpClient(mockConfig);
    await httpClient.get('/test', { foo: 'bar', baz: 123 });

    expect(capturedUrl).toContain('foo=bar');
    expect(capturedUrl).toContain('baz=123');
  });

  it('should include authorization header in requests', async () => {
    const mockResponse = { data: 'test' };
    let capturedOptions: RequestInit = {};

    global.fetch = mock((_url: string, options?: RequestInit) => {
      capturedOptions = options || {};
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve(mockResponse),
      } as Response);
    });

    const httpClient = new HttpClient(mockConfig);
    await httpClient.get('/test');

    const headers = capturedOptions.headers as Record<string, string>;
    expect(headers['Authorization']).toBe(`Bearer ${mockConfig.apiKey}`);
  });

  it('should handle request timeout', async () => {
    // Create a client with a very short timeout
    const shortTimeoutConfig = { ...mockConfig, timeout: 50 };

    // Mock fetch to respect abort signal and delay longer than the timeout
    global.fetch = mock((_url: string, options?: RequestInit) =>
      new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          resolve({
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: () => Promise.resolve({ data: 'test' }),
          } as Response);
        }, 200); // Longer than timeout

        // Listen for abort signal
        options?.signal?.addEventListener('abort', () => {
          clearTimeout(timeoutId);
          const error = new Error('The operation was aborted');
          error.name = 'AbortError';
          reject(error);
        });
      })
    );

    const httpClient = new HttpClient(shortTimeoutConfig);

    await expect(httpClient.get('/test')).rejects.toThrow('Request timeout after 50ms');
  });

  it('should handle text responses', async () => {
    global.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: () => Promise.resolve('plain text response'),
      } as Response)
    );

    const httpClient = new HttpClient(mockConfig);
    const result = await httpClient.get('/test');

    expect(result).toBe('plain text response');
  });
});
