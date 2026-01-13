import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { CheckoutApi } from '../../../../src/api/checkout';
import { HttpClient } from '../../../../src/http/client';
import { ENDPOINTS } from '../../../../src/common/constants';
import {
  CreateCheckoutSessionRequest,
  CheckoutSession,
  CheckoutSessionStatus,
  PaymentStatus,
} from '../../../../src/api/checkout/types';

describe('CheckoutApi', () => {
  let httpClient: HttpClient;
  let checkoutApi: CheckoutApi;
  let getMock: ReturnType<typeof mock>;
  let postMock: ReturnType<typeof mock>;

  beforeEach(() => {
    getMock = mock(() => Promise.resolve({}));
    postMock = mock(() => Promise.resolve({}));

    httpClient = {
      get: getMock,
      post: postMock,
    } as unknown as HttpClient;

    checkoutApi = new CheckoutApi(httpClient);
  });

  describe('createSession', () => {
    it('should create a checkout session successfully', async () => {
      const mockRequest: CreateCheckoutSessionRequest = {
        amount: 1000,
        currency: 'XOF',
        success_url: 'https://example.com/success',
        error_url: 'https://example.com/error',
        client_reference: 'ref123',
      };

      const mockResponse: CheckoutSession = {
        id: 'sess_123',
        amount: '1000',
        checkout_status: CheckoutSessionStatus.OPEN,
        currency: 'XOF',
        error_url: 'https://example.com/error',
        business_name: 'Test Business',
        payment_status: PaymentStatus.PROCESSING,
        success_url: 'https://example.com/success',
        wave_launch_url: 'https://wave.com/launch/sess_123',
        when_created: '2023-05-15T10:00:00Z',
        when_expires: '2023-05-15T11:00:00Z',
        client_reference: 'ref123',
      };

      postMock.mockImplementation(() => Promise.resolve(mockResponse));

      const result = await checkoutApi.createSession(mockRequest);

      expect(postMock).toHaveBeenCalledWith(ENDPOINTS.CHECKOUT_SESSIONS, {
        amount: '1000',
        currency: 'XOF',
        success_url: 'https://example.com/success',
        error_url: 'https://example.com/error',
        client_reference: 'ref123',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when required fields are missing', async () => {
      // Missing amount
      const invalidRequest1: CreateCheckoutSessionRequest = {
        amount: '',
        currency: 'XOF',
        success_url: 'https://example.com/success',
        error_url: 'https://example.com/error',
      };

      await expect(checkoutApi.createSession(invalidRequest1)).rejects.toThrow(
        'amount is required',
      );

      // Missing currency
      const invalidRequest2: CreateCheckoutSessionRequest = {
        amount: 1000,
        currency: '' as any,
        success_url: 'https://example.com/success',
        error_url: 'https://example.com/error',
      };

      await expect(checkoutApi.createSession(invalidRequest2)).rejects.toThrow(
        'currency is required',
      );

      // Missing success_url
      const invalidRequest3: CreateCheckoutSessionRequest = {
        amount: 1000,
        currency: 'XOF',
        success_url: '',
        error_url: 'https://example.com/error',
      };

      await expect(checkoutApi.createSession(invalidRequest3)).rejects.toThrow(
        'success_url is required',
      );

      // Missing error_url
      const invalidRequest4: CreateCheckoutSessionRequest = {
        amount: 1000,
        currency: 'XOF',
        success_url: 'https://example.com/success',
        error_url: '',
      };

      await expect(checkoutApi.createSession(invalidRequest4)).rejects.toThrow(
        'error_url is required',
      );

      expect(postMock).not.toHaveBeenCalled();
    });
  });

  describe('getSession', () => {
    it('should get a checkout session by ID', async () => {
      const mockResponse: CheckoutSession = {
        id: 'sess_123',
        amount: '1000.00',
        checkout_status: CheckoutSessionStatus.COMPLETE,
        currency: 'XOF',
        error_url: 'https://example.com/error',
        business_name: 'Test Business',
        payment_status: PaymentStatus.SUCCEEDED,
        transaction_id: 'tx_123',
        success_url: 'https://example.com/success',
        wave_launch_url: 'https://wave.com/launch/sess_123',
        when_created: '2023-05-15T10:00:00Z',
        when_completed: '2023-05-15T10:15:00Z',
        when_expires: '2023-05-15T11:00:00Z',
      };

      getMock.mockImplementation(() => Promise.resolve(mockResponse));

      const result = await checkoutApi.getSession('sess_123');

      expect(getMock).toHaveBeenCalledWith(`${ENDPOINTS.CHECKOUT_SESSIONS}/sess_123`);
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when session ID is not provided', async () => {
      await expect(checkoutApi.getSession('')).rejects.toThrow('sessionId is required');
      expect(getMock).not.toHaveBeenCalled();
    });
  });

  describe('getSessionByTransactionId', () => {
    it('should get a checkout session by transaction ID', async () => {
      const mockResponse: CheckoutSession = {
        id: 'sess_123',
        amount: '1000.00',
        checkout_status: CheckoutSessionStatus.COMPLETE,
        currency: 'XOF',
        error_url: 'https://example.com/error',
        business_name: 'Test Business',
        payment_status: PaymentStatus.SUCCEEDED,
        transaction_id: 'tx_123',
        success_url: 'https://example.com/success',
        wave_launch_url: 'https://wave.com/launch/sess_123',
        when_created: '2023-05-15T10:00:00Z',
        when_completed: '2023-05-15T10:15:00Z',
        when_expires: '2023-05-15T11:00:00Z',
      };

      getMock.mockImplementation(() => Promise.resolve(mockResponse));

      const result = await checkoutApi.getSessionByTransactionId('tx_123');

      expect(getMock).toHaveBeenCalledWith(
        `${ENDPOINTS.CHECKOUT_SESSIONS}?transaction_id=tx_123`,
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when transaction ID is not provided', async () => {
      await expect(checkoutApi.getSessionByTransactionId('')).rejects.toThrow(
        'transactionId is required',
      );
      expect(getMock).not.toHaveBeenCalled();
    });
  });

  describe('searchSessions', () => {
    it('should search for checkout sessions by client reference', async () => {
      const mockResponse = {
        result: [
          {
            id: 'sess_123',
            amount: '1000.00',
            checkout_status: CheckoutSessionStatus.COMPLETE,
            currency: 'XOF',
            error_url: 'https://example.com/error',
            business_name: 'Test Business',
            payment_status: PaymentStatus.SUCCEEDED,
            transaction_id: 'tx_123',
            success_url: 'https://example.com/success',
            wave_launch_url: 'https://wave.com/launch/sess_123',
            when_created: '2023-05-15T10:00:00Z',
            when_completed: '2023-05-15T10:15:00Z',
            when_expires: '2023-05-15T11:00:00Z',
            client_reference: 'ref123',
          },
        ],
      };

      getMock.mockImplementation(() => Promise.resolve(mockResponse));

      const result = await checkoutApi.searchSessions('ref123');

      expect(getMock).toHaveBeenCalledWith(
        `${ENDPOINTS.CHECKOUT_SESSIONS}/search?client_reference=ref123`,
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when client reference is not provided', async () => {
      await expect(checkoutApi.searchSessions('')).rejects.toThrow('clientReference is required');
      expect(getMock).not.toHaveBeenCalled();
    });
  });

  describe('refundSession', () => {
    it('should refund a checkout session', async () => {
      postMock.mockImplementation(() => Promise.resolve(undefined));

      await checkoutApi.refundSession('sess_123');

      expect(postMock).toHaveBeenCalledWith(
        `${ENDPOINTS.CHECKOUT_SESSIONS}/sess_123/refund`,
      );
    });

    it('should throw error when session ID is not provided', async () => {
      await expect(checkoutApi.refundSession('')).rejects.toThrow('sessionId is required');
      expect(postMock).not.toHaveBeenCalled();
    });
  });

  describe('expireSession', () => {
    it('should expire a checkout session', async () => {
      postMock.mockImplementation(() => Promise.resolve(undefined));

      await checkoutApi.expireSession('sess_123');

      expect(postMock).toHaveBeenCalledWith(
        `${ENDPOINTS.CHECKOUT_SESSIONS}/sess_123/expire`,
      );
    });

    it('should throw error when session ID is not provided', async () => {
      await expect(checkoutApi.expireSession('')).rejects.toThrow('sessionId is required');
      expect(postMock).not.toHaveBeenCalled();
    });
  });
});
