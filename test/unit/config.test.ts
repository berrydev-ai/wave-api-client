import { describe, it, expect } from 'bun:test';
import { validateConfig } from '../../src/config';
import { WaveApiConfig } from '../../src/common/types';
import { DEFAULT_BASE_URL, DEFAULT_TIMEOUT } from '../../src/common/constants';

describe('Config', () => {
  it('should validate and normalize config with defaults', () => {
    const config: WaveApiConfig = {
      apiKey: 'wave_test_key_12345abcdef',
    };

    const validatedConfig = validateConfig(config);

    expect(validatedConfig).toEqual({
      apiKey: 'wave_test_key_12345abcdef',
      baseUrl: DEFAULT_BASE_URL,
      timeout: DEFAULT_TIMEOUT,
      debug: false,
    });
  });

  it('should use provided values instead of defaults', () => {
    const config: WaveApiConfig = {
      apiKey: 'wave_test_key_12345abcdef',
      baseUrl: 'https://custom-api.wave.com',
      timeout: 5000,
      debug: true,
    };

    const validatedConfig = validateConfig(config);

    expect(validatedConfig).toEqual({
      apiKey: 'wave_test_key_12345abcdef',
      baseUrl: 'https://custom-api.wave.com',
      timeout: 5000,
      debug: true,
    });
  });

  it('should throw error if API key is empty', () => {
    const config: WaveApiConfig = {
      apiKey: '',
    };

    expect(() => validateConfig(config)).toThrow('API key is required');
  });

  it('should throw error if API key format is invalid', () => {
    const config: WaveApiConfig = {
      apiKey: 'invalid_key',
    };

    expect(() => validateConfig(config)).toThrow('Invalid API key format');
  });
});
