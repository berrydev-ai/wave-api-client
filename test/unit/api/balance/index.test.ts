import { describe, it, expect, beforeEach, mock, spyOn } from 'bun:test';
import { BalanceApi } from '../../../../src/api/balance';
import { HttpClient } from '../../../../src/http/client';
import { ENDPOINTS } from '../../../../src/common/constants';
import { Balance, TransactionListResponse } from '../../../../src/api/balance/types';

describe('BalanceApi', () => {
  let httpClient: HttpClient;
  let balanceApi: BalanceApi;
  let getMock: ReturnType<typeof mock>;
  let postMock: ReturnType<typeof mock>;

  beforeEach(() => {
    // Create a mock HttpClient with mocked methods
    getMock = mock(() => Promise.resolve({}));
    postMock = mock(() => Promise.resolve({}));

    httpClient = {
      get: getMock,
      post: postMock,
    } as unknown as HttpClient;

    balanceApi = new BalanceApi(httpClient);
  });

  describe('getBalance', () => {
    it('should get balance without parameters', async () => {
      const mockResponse: Balance = {
        amount: '1000.50',
        currency: 'XOF',
      };

      getMock.mockImplementation(() => Promise.resolve(mockResponse));

      const result = await balanceApi.getBalance();

      expect(getMock).toHaveBeenCalledWith(ENDPOINTS.BALANCE);
      expect(result).toEqual(mockResponse);
    });

    it('should get balance with parameters', async () => {
      const mockResponse: Balance = {
        amount: '2500.75',
        currency: 'GHS',
      };

      getMock.mockImplementation(() => Promise.resolve(mockResponse));

      const result = await balanceApi.getBalance({ include_subaccounts: true });

      expect(getMock).toHaveBeenCalledWith(`${ENDPOINTS.BALANCE}?include_subaccounts=true`);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('listTransactions', () => {
    it('should list transactions without parameters', async () => {
      const mockResponse: TransactionListResponse = {
        page_info: {
          start_cursor: null,
          end_cursor: 'cursor123',
          has_next_page: true,
        },
        date: '2023-05-15',
        items: [
          {
            timestamp: '2023-05-15T14:30:00Z',
            transaction_id: 'tx123',
            amount: '500.00',
            fee: '10.00',
            currency: 'XOF',
          },
        ],
      };

      getMock.mockImplementation(() => Promise.resolve(mockResponse));

      const result = await balanceApi.listTransactions();

      expect(getMock).toHaveBeenCalledWith(ENDPOINTS.TRANSACTIONS);
      expect(result).toEqual(mockResponse);
    });

    it('should list transactions with parameters', async () => {
      const mockResponse: TransactionListResponse = {
        page_info: {
          start_cursor: 'prev-cursor',
          end_cursor: 'next-cursor',
          has_next_page: false,
        },
        date: '2023-05-14',
        items: [
          {
            timestamp: '2023-05-14T10:15:00Z',
            transaction_id: 'tx456',
            amount: '750.00',
            fee: '15.00',
            currency: 'GHS',
          },
        ],
      };

      getMock.mockImplementation(() => Promise.resolve(mockResponse));

      const params = {
        date: '2023-05-14',
        after: 'prev-cursor',
        include_subaccounts: true,
      };

      const result = await balanceApi.listTransactions(params);

      expect(getMock).toHaveBeenCalledWith(
        `${ENDPOINTS.TRANSACTIONS}?date=2023-05-14&after=prev-cursor&include_subaccounts=true`,
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('refundTransaction', () => {
    it('should refund a transaction successfully', async () => {
      const transactionId = 'tx789';

      postMock.mockImplementation(() => Promise.resolve(undefined));

      await balanceApi.refundTransaction(transactionId);

      expect(postMock).toHaveBeenCalledWith(
        `${ENDPOINTS.TRANSACTIONS}/${transactionId}/refund`,
        {},
      );
    });

    it('should throw error when transaction ID is not provided', async () => {
      await expect(balanceApi.refundTransaction('')).rejects.toThrow('transactionId is required');
      expect(postMock).not.toHaveBeenCalled();
    });
  });
});
