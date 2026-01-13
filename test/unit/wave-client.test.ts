import { describe, it, expect } from 'bun:test';
import { WaveClient } from '../../src/wave-client';
import { BalanceApi } from '../../src/api/balance';
import { CheckoutApi } from '../../src/api/checkout';
import { PayoutApi } from '../../src/api/payout';
import { MerchantsApi } from '../../src/api/merchants';

describe('WaveClient', () => {
  const mockApiKey = 'wave_sn_prod_test_key_1234abcd';

  it('should initialize with required config', () => {
    const client = new WaveClient({ apiKey: mockApiKey });

    expect(client.balance).toBeInstanceOf(BalanceApi);
    expect(client.checkout).toBeInstanceOf(CheckoutApi);
    expect(client.payout).toBeInstanceOf(PayoutApi);
    expect(client.merchants).toBeInstanceOf(MerchantsApi);
  });

  it('should initialize with custom config', () => {
    const customConfig = {
      apiKey: mockApiKey,
      baseUrl: 'https://api-test.wave.com',
      timeout: 5000,
      debug: true,
    };

    const client = new WaveClient(customConfig);

    expect(client.balance).toBeInstanceOf(BalanceApi);
    expect(client.checkout).toBeInstanceOf(CheckoutApi);
    expect(client.payout).toBeInstanceOf(PayoutApi);
    expect(client.merchants).toBeInstanceOf(MerchantsApi);
  });

  it('should throw error with invalid API key', () => {
    expect(() => {
      new WaveClient({ apiKey: 'invalid_key' });
    }).toThrow('Invalid API key format');
  });

  it('should throw error with empty API key', () => {
    expect(() => {
      new WaveClient({ apiKey: '' });
    }).toThrow('API key is required');
  });
});
