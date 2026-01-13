import { createErrorFromResponse } from '../common/errors';
import { ApiErrorResponse, WaveApiConfig, HttpMethod } from '../common/types';
import { CONTENT_TYPES, DEFAULT_BASE_URL, DEFAULT_TIMEOUT, HEADERS } from '../common/constants';

/**
 * Request configuration options
 */
export interface RequestConfig {
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

/**
 * HTTP client for making API requests using native fetch
 */
export class HttpClient {
  private config: WaveApiConfig;
  private baseHeaders: Record<string, string>;

  /**
   * Creates a new HTTP client instance
   */
  constructor(config: WaveApiConfig) {
    this.config = {
      baseUrl: DEFAULT_BASE_URL,
      timeout: DEFAULT_TIMEOUT,
      debug: false,
      ...config,
    };

    this.baseHeaders = {
      [HEADERS.CONTENT_TYPE]: CONTENT_TYPES.JSON,
      [HEADERS.AUTHORIZATION]: `Bearer ${this.config.apiKey}`,
    };
  }

  /**
   * Logs request details when debug mode is enabled
   */
  private logRequest(
    method: string,
    url: string,
    headers: Record<string, string>,
    data?: any,
  ): void {
    if (this.config.debug) {
      console.log('Request:', {
        method: method.toUpperCase(),
        url,
        headers,
        data,
      });
    }
  }

  /**
   * Logs response details when debug mode is enabled
   */
  private logResponse(status: number, headers: Headers, data: any): void {
    if (this.config.debug) {
      const headersObj: Record<string, string> = {};
      headers.forEach((value, key) => {
        headersObj[key] = value;
      });
      console.log('Response:', {
        status,
        headers: headersObj,
        data,
      });
    }
  }

  /**
   * Logs error details when debug mode is enabled
   */
  private logError(status: number | undefined, data: any): void {
    if (this.config.debug) {
      console.error('Error:', {
        status,
        data,
      });
    }
  }

  /**
   * Makes a request to the API
   */
  async request<T>(
    method: HttpMethod,
    path: string,
    data?: any,
    config?: Partial<RequestConfig>,
  ): Promise<T> {
    const url = `${this.config.baseUrl}${path}`;
    const headers = { ...this.baseHeaders, ...config?.headers };

    // Handle query params for GET requests
    let finalUrl = url;
    if (method === HttpMethod.GET && data) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      }
      const queryString = params.toString();
      if (queryString) {
        finalUrl = `${url}?${queryString}`;
      }
    }

    this.logRequest(method, finalUrl, headers, method === HttpMethod.POST ? data : undefined);

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const fetchOptions: RequestInit = {
        method,
        headers,
        signal: config?.signal || controller.signal,
      };

      if (method === HttpMethod.POST && data) {
        fetchOptions.body = JSON.stringify(data);
      }

      const response = await fetch(finalUrl, fetchOptions);
      clearTimeout(timeoutId);

      // Parse response body
      let responseData: any;
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        responseData = await response.json();
      } else {
        const text = await response.text();
        responseData = text ? text : undefined;
      }

      if (!response.ok) {
        this.logError(response.status, responseData);
        throw createErrorFromResponse(response.status, responseData as ApiErrorResponse);
      }

      this.logResponse(response.status, response.headers, responseData);
      return responseData as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.config.timeout}ms`);
      }

      // Re-throw API errors
      throw error;
    }
  }

  /**
   * Makes a GET request
   */
  get<T>(path: string, params?: Record<string, any>, config?: Partial<RequestConfig>): Promise<T> {
    return this.request<T>(HttpMethod.GET, path, params, config);
  }

  /**
   * Makes a POST request
   */
  post<T>(path: string, data?: any, config?: Partial<RequestConfig>): Promise<T> {
    return this.request<T>(HttpMethod.POST, path, data, config);
  }
}
