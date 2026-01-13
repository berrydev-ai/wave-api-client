import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { MerchantsApi } from '../../../../src/api/merchants';
import { HttpClient } from '../../../../src/http/client';
import { ENDPOINTS } from '../../../../src/common/constants';
import { MerchantDetails, MerchantStatus } from '../../../../src/api/merchants/types';

describe('MerchantsApi', () => {
  let httpClient: HttpClient;
  let merchantsApi: MerchantsApi;
  let getMock: ReturnType<typeof mock>;

  beforeEach(() => {
    getMock = mock(() => Promise.resolve({}));

    httpClient = {
      get: getMock,
      post: mock(() => Promise.resolve({})),
    } as unknown as HttpClient;

    merchantsApi = new MerchantsApi(httpClient);
  });

  describe('listMerchants', () => {
    it('should list merchants without parameters', async () => {
      const mockResponse = {
        data: [
          {
            id: 'merchant-123',
            name: 'Test Merchant',
            status: MerchantStatus.ACTIVE,
            created_at: '2023-05-15T10:00:00Z',
            updated_at: '2023-05-15T10:00:00Z',
          },
        ],
        has_more: false,
      };

      getMock.mockImplementation(() => Promise.resolve(mockResponse));

      const result = await merchantsApi.listMerchants();

      expect(getMock).toHaveBeenCalledWith(ENDPOINTS.AGGREGATED_MERCHANTS);
      expect(result).toEqual(mockResponse);
    });

    it('should list merchants with parameters', async () => {
      const mockResponse = {
        data: [
          {
            id: 'merchant-123',
            name: 'Test Merchant',
            status: MerchantStatus.ACTIVE,
            created_at: '2023-05-15T10:00:00Z',
            updated_at: '2023-05-15T10:00:00Z',
          },
        ],
        cursor: 'next-cursor',
        has_more: true,
      };

      getMock.mockImplementation(() => Promise.resolve(mockResponse));

      const params = {
        status: MerchantStatus.ACTIVE,
        search: 'test',
        first: 10,
        after: 'cursor-123',
      };

      const result = await merchantsApi.listMerchants(params);

      expect(getMock).toHaveBeenCalledWith(
        `${ENDPOINTS.AGGREGATED_MERCHANTS}?status=active&search=test&first=10&after=cursor-123`,
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getMerchant', () => {
    it('should get a merchant by ID', async () => {
      const mockResponse: MerchantDetails = {
        id: 'merchant-123',
        name: 'Test Merchant',
        status: MerchantStatus.ACTIVE,
        created_at: '2023-05-15T10:00:00Z',
        updated_at: '2023-05-15T10:00:00Z',
      };

      getMock.mockImplementation(() => Promise.resolve(mockResponse));

      const result = await merchantsApi.getMerchant('merchant-123');

      expect(getMock).toHaveBeenCalledWith(
        `${ENDPOINTS.AGGREGATED_MERCHANTS}/merchant-123`,
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when merchant ID is not provided', async () => {
      await expect(merchantsApi.getMerchant('')).rejects.toThrow('merchantId is required');
      expect(getMock).not.toHaveBeenCalled();
    });
  });
});
