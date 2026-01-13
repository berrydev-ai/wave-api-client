import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { PayoutApi } from '../../../../src/api/payout';
import { HttpClient } from '../../../../src/http/client';
import { ENDPOINTS, HEADERS } from '../../../../src/common/constants';
import {
  CreatePayoutRequest,
  CreatePayoutBatchRequest,
  Payout,
  PayoutBatch,
  PayoutStatus,
  PayoutBatchStatus,
} from '../../../../src/api/payout/types';

describe('PayoutApi', () => {
  let httpClient: HttpClient;
  let payoutApi: PayoutApi;
  let getMock: ReturnType<typeof mock>;
  let postMock: ReturnType<typeof mock>;

  beforeEach(() => {
    getMock = mock(() => Promise.resolve({}));
    postMock = mock(() => Promise.resolve({}));

    httpClient = {
      get: getMock,
      post: postMock,
    } as unknown as HttpClient;

    payoutApi = new PayoutApi(httpClient);
  });

  describe('createPayout', () => {
    it('should create a payout successfully', async () => {
      const mockRequest: CreatePayoutRequest = {
        receive_amount: 1000,
        currency: 'XOF',
        mobile: '+221123456789',
        name: 'John Doe',
        client_reference: 'payout-ref-123',
      };

      const mockResponse: Payout = {
        id: 'payout-123',
        currency: 'XOF',
        receive_amount: '1000',
        fee: '10.00',
        mobile: '+221123456789',
        name: 'John Doe',
        client_reference: 'payout-ref-123',
        status: PayoutStatus.PROCESSING,
        timestamp: '2023-05-15T10:00:00Z',
      };

      postMock.mockImplementation(() => Promise.resolve(mockResponse));

      const idempotencyKey = 'idem-key-123';
      const result = await payoutApi.createPayout(mockRequest, idempotencyKey);

      expect(postMock).toHaveBeenCalledWith(
        ENDPOINTS.PAYOUT,
        {
          receive_amount: '1000',
          currency: 'XOF',
          mobile: '+221123456789',
          name: 'John Doe',
          client_reference: 'payout-ref-123',
        },
        {
          headers: {
            [HEADERS.IDEMPOTENCY_KEY]: idempotencyKey,
          },
        },
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when required fields are missing', async () => {
      // Missing receive_amount
      const invalidRequest1: CreatePayoutRequest = {
        receive_amount: '',
        currency: 'XOF',
        mobile: '+221123456789',
      };

      await expect(payoutApi.createPayout(invalidRequest1, 'idem-key')).rejects.toThrow(
        'receive_amount is required',
      );

      // Missing currency
      const invalidRequest2: CreatePayoutRequest = {
        receive_amount: 1000,
        currency: '' as any,
        mobile: '+221123456789',
      };

      await expect(payoutApi.createPayout(invalidRequest2, 'idem-key')).rejects.toThrow(
        'currency is required',
      );

      // Missing mobile
      const invalidRequest3: CreatePayoutRequest = {
        receive_amount: 1000,
        currency: 'XOF',
        mobile: '',
      };

      await expect(payoutApi.createPayout(invalidRequest3, 'idem-key')).rejects.toThrow(
        'mobile is required',
      );

      // Missing idempotency key
      await expect(
        payoutApi.createPayout(
          {
            receive_amount: 1000,
            currency: 'XOF',
            mobile: '+221123456789',
          },
          '',
        ),
      ).rejects.toThrow('idempotencyKey is required');

      expect(postMock).not.toHaveBeenCalled();
    });
  });

  describe('createPayoutBatch', () => {
    it('should create a payout batch successfully', async () => {
      const mockRequest: CreatePayoutBatchRequest = {
        payouts: [
          {
            receive_amount: 1000,
            currency: 'XOF',
            mobile: '+221123456789',
            name: 'John Doe',
          },
          {
            receive_amount: 2000,
            currency: 'XOF',
            mobile: '+221987654321',
            name: 'Jane Doe',
          },
        ],
      };

      const mockResponse: PayoutBatch = {
        id: 'batch-123',
        status: PayoutBatchStatus.PROCESSING,
        payouts: [
          {
            id: 'payout-123',
            currency: 'XOF',
            receive_amount: '1000',
            fee: '10.00',
            mobile: '+221123456789',
            name: 'John Doe',
            status: PayoutStatus.PROCESSING,
            timestamp: '2023-05-15T10:00:00Z',
          },
          {
            id: 'payout-124',
            currency: 'XOF',
            receive_amount: '2000',
            fee: '20.00',
            mobile: '+221987654321',
            name: 'Jane Doe',
            status: PayoutStatus.PROCESSING,
            timestamp: '2023-05-15T10:00:00Z',
          },
        ],
      };

      postMock.mockImplementation(() => Promise.resolve(mockResponse));

      const idempotencyKey = 'batch-idem-key-123';
      const result = await payoutApi.createPayoutBatch(mockRequest, idempotencyKey);

      expect(postMock).toHaveBeenCalledWith(
        ENDPOINTS.PAYOUT_BATCH,
        {
          payouts: [
            {
              receive_amount: '1000',
              currency: 'XOF',
              mobile: '+221123456789',
              name: 'John Doe',
            },
            {
              receive_amount: '2000',
              currency: 'XOF',
              mobile: '+221987654321',
              name: 'Jane Doe',
            },
          ],
        },
        {
          headers: {
            [HEADERS.IDEMPOTENCY_KEY]: idempotencyKey,
          },
        },
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when payouts array is missing or empty', async () => {
      // Missing payouts array
      const invalidRequest1: CreatePayoutBatchRequest = {
        payouts: null as any,
      };

      await expect(payoutApi.createPayoutBatch(invalidRequest1, 'idem-key')).rejects.toThrow(
        'payouts array is required and must not be empty',
      );

      // Empty payouts array
      const invalidRequest2: CreatePayoutBatchRequest = {
        payouts: [],
      };

      await expect(payoutApi.createPayoutBatch(invalidRequest2, 'idem-key')).rejects.toThrow(
        'payouts array is required and must not be empty',
      );

      // Missing idempotency key
      await expect(
        payoutApi.createPayoutBatch(
          {
            payouts: [
              {
                receive_amount: 1000,
                currency: 'XOF',
                mobile: '+221123456789',
              },
            ],
          },
          '',
        ),
      ).rejects.toThrow('idempotencyKey is required');

      expect(postMock).not.toHaveBeenCalled();
    });
  });

  describe('getPayout', () => {
    it('should get a payout by ID', async () => {
      const mockResponse: Payout = {
        id: 'payout-123',
        currency: 'XOF',
        receive_amount: '1000.00',
        fee: '10.00',
        mobile: '+221123456789',
        name: 'John Doe',
        status: PayoutStatus.SUCCEEDED,
        timestamp: '2023-05-15T10:00:00Z',
      };

      getMock.mockImplementation(() => Promise.resolve(mockResponse));

      const result = await payoutApi.getPayout('payout-123');

      expect(getMock).toHaveBeenCalledWith(`${ENDPOINTS.PAYOUT}/payout-123`);
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when payout ID is not provided', async () => {
      await expect(payoutApi.getPayout('')).rejects.toThrow('payoutId is required');
      expect(getMock).not.toHaveBeenCalled();
    });
  });

  describe('getPayoutBatch', () => {
    it('should get a payout batch by ID', async () => {
      const mockResponse: PayoutBatch = {
        id: 'batch-123',
        status: PayoutBatchStatus.COMPLETE,
        payouts: [
          {
            id: 'payout-123',
            currency: 'XOF',
            receive_amount: '1000.00',
            fee: '10.00',
            mobile: '+221123456789',
            status: PayoutStatus.SUCCEEDED,
            timestamp: '2023-05-15T10:00:00Z',
          },
        ],
      };

      getMock.mockImplementation(() => Promise.resolve(mockResponse));

      const result = await payoutApi.getPayoutBatch('batch-123');

      expect(getMock).toHaveBeenCalledWith(`${ENDPOINTS.PAYOUT_BATCH}/batch-123`);
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when batch ID is not provided', async () => {
      await expect(payoutApi.getPayoutBatch('')).rejects.toThrow('batchId is required');
      expect(getMock).not.toHaveBeenCalled();
    });
  });

  describe('searchPayouts', () => {
    it('should search for payouts by client reference', async () => {
      const mockResponse = {
        result: [
          {
            id: 'payout-123',
            currency: 'XOF',
            receive_amount: '1000.00',
            fee: '10.00',
            mobile: '+221123456789',
            client_reference: 'ref-123',
            status: PayoutStatus.SUCCEEDED,
            timestamp: '2023-05-15T10:00:00Z',
          },
        ],
      };

      getMock.mockImplementation(() => Promise.resolve(mockResponse));

      const result = await payoutApi.searchPayouts('ref-123');

      expect(getMock).toHaveBeenCalledWith(
        `${ENDPOINTS.PAYOUTS_SEARCH}?client_reference=ref-123`,
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when client reference is not provided', async () => {
      await expect(payoutApi.searchPayouts('')).rejects.toThrow('clientReference is required');
      expect(getMock).not.toHaveBeenCalled();
    });
  });

  describe('reversePayout', () => {
    it('should reverse a payout', async () => {
      postMock.mockImplementation(() => Promise.resolve(undefined));

      await payoutApi.reversePayout('payout-123');

      expect(postMock).toHaveBeenCalledWith(`${ENDPOINTS.PAYOUT}/payout-123/reverse`);
    });

    it('should throw error when payout ID is not provided', async () => {
      await expect(payoutApi.reversePayout('')).rejects.toThrow('payoutId is required');
      expect(postMock).not.toHaveBeenCalled();
    });
  });
});
