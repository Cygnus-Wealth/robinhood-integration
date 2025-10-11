import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RobinhoodService } from '../../services/robinhood-service';
import { RobinhoodClient } from '../../api/client';
import { RobinhoodAPI } from '../../api/robinhood-api';
import { PortfolioMapper } from '../../mappers/portfolio-mapper';
import {
  mockCredentials,
  mockCredentialsWithMFA,
  mockAccount,
  mockPortfolio,
  mockPosition,
  mockInstrument,
  mockQuote,
  mockOrder,
  mockHistoricals,
  mockWatchlist,
  mockDividend,
} from '../mock-data';

vi.mock('../../api/client');
vi.mock('../../api/robinhood-api');
vi.mock('../../mappers/portfolio-mapper');

describe('RobinhoodService', () => {
  let service: RobinhoodService;
  let mockClient: any;
  let mockApi: any;

  beforeEach(() => {
    mockClient = {
      authenticate: vi.fn(),
      refreshAccessToken: vi.fn(),
      isAuthenticated: vi.fn().mockReturnValue(true),
      getAuthTokens: vi.fn(),
    };

    mockApi = {
      getAccounts: vi.fn(),
      getAccount: vi.fn(),
      getPortfolio: vi.fn(),
      getPositions: vi.fn(),
      getPosition: vi.fn(),
      getInstrumentBySymbol: vi.fn(),
      getInstrumentFromUrl: vi.fn(),
      getQuote: vi.fn(),
      getQuotes: vi.fn(),
      getOrders: vi.fn(),
      getHistoricals: vi.fn(),
      getWatchlists: vi.fn(),
      getDividends: vi.fn(),
    };

    (RobinhoodClient as any).mockImplementation(() => mockClient);
    (RobinhoodAPI as any).mockImplementation(() => mockApi);

    service = new RobinhoodService();
  });

  describe('Authentication', () => {
    it('should authenticate successfully', async () => {
      mockClient.authenticate.mockResolvedValueOnce(undefined);

      await service.authenticate(mockCredentials);

      expect(mockClient.authenticate).toHaveBeenCalledWith(mockCredentials);
    });

    it('should handle MFA required error', async () => {
      mockClient.authenticate.mockRejectedValueOnce(new Error('MFA_REQUIRED'));

      await expect(service.authenticate(mockCredentials)).rejects.toMatchObject({
        code: 'MFA_REQUIRED',
        message: 'Multi-factor authentication required',
        source: 'robinhood',
      });
    });

    it('should handle general authentication failure', async () => {
      mockClient.authenticate.mockRejectedValueOnce(new Error('Invalid credentials'));

      await expect(service.authenticate(mockCredentials)).rejects.toMatchObject({
        code: 'AUTH_FAILED',
        message: 'Authentication failed',
        source: 'robinhood',
      });
    });

    it('should refresh token successfully', async () => {
      mockClient.refreshAccessToken.mockResolvedValueOnce(undefined);

      await service.refreshToken();

      expect(mockClient.refreshAccessToken).toHaveBeenCalled();
    });

    it('should handle token refresh failure', async () => {
      mockClient.refreshAccessToken.mockRejectedValueOnce(new Error('Refresh failed'));

      await expect(service.refreshToken()).rejects.toMatchObject({
        code: 'TOKEN_REFRESH_FAILED',
        message: 'Failed to refresh access token',
        source: 'robinhood',
      });
    });

    it('should check authentication status', () => {
      mockClient.isAuthenticated.mockReturnValueOnce(true);

      expect(service.isAuthenticated()).toBe(true);
      expect(mockClient.isAuthenticated).toHaveBeenCalled();
    });
  });

  describe('Portfolio Operations', () => {
    beforeEach(() => {
      vi.mocked(PortfolioMapper.mapPortfolio).mockReturnValue({
        accountId: mockAccount.accountNumber,
        totalValue: 15000,
        positions: [],
        performance: {
          totalReturn: 1000,
          totalReturnPercent: 7.14,
          dayReturn: 250,
          dayReturnPercent: 1.69,
        },
        allocation: {
          stocks: 100,
          bonds: 0,
          cash: 0,
          crypto: 0,
          other: 0,
        },
        currency: 'USD',
        lastUpdated: new Date(),
      } as any);
    });

    it('should get portfolio successfully', async () => {
      mockApi.getAccounts.mockResolvedValueOnce([mockAccount]);
      mockApi.getPortfolio.mockResolvedValueOnce(mockPortfolio);
      mockApi.getPositions.mockResolvedValueOnce([mockPosition]);
      mockApi.getInstrumentFromUrl.mockResolvedValueOnce(mockInstrument);
      mockApi.getQuote.mockResolvedValueOnce(mockQuote);

      const result = await service.getPortfolio();

      expect(mockApi.getAccounts).toHaveBeenCalled();
      expect(mockApi.getPortfolio).toHaveBeenCalledWith(mockAccount.accountNumber);
      expect(result).toMatchObject({
        accountId: mockAccount.accountNumber,
        totalValue: 15000,
      });
    });

    it('should handle no accounts found', async () => {
      mockApi.getAccounts.mockResolvedValueOnce([]);

      await expect(service.getPortfolio()).rejects.toMatchObject({
        code: 'PORTFOLIO_FETCH_FAILED',
        message: 'Failed to fetch portfolio',
      });
    });

    it('should handle portfolio fetch error', async () => {
      mockApi.getAccounts.mockRejectedValueOnce(new Error('Network error'));

      await expect(service.getPortfolio()).rejects.toMatchObject({
        code: 'PORTFOLIO_FETCH_FAILED',
        message: 'Failed to fetch portfolio',
        source: 'robinhood',
      });
    });
  });

  describe('Position Operations', () => {
    beforeEach(() => {
      vi.mocked(PortfolioMapper.mapPosition).mockReturnValue({
        id: mockPosition.url,
        symbol: 'AAPL',
        name: 'Apple Inc.',
        quantity: 10,
        averagePrice: 150,
        currentPrice: 175.25,
        marketValue: 1752.5,
        costBasis: 1500,
        unrealizedGain: 252.5,
        unrealizedGainPercent: 16.83,
        realizedGain: 0,
        dayChange: 12.5,
        dayChangePercent: 0.72,
        assetType: 'stock',
        currency: 'USD',
        exchange: 'NASDAQ',
        lastUpdated: new Date(),
      } as any);
    });

    it('should get all positions successfully', async () => {
      mockApi.getPositions.mockResolvedValueOnce([mockPosition]);
      mockApi.getInstrumentFromUrl.mockResolvedValueOnce(mockInstrument);
      mockApi.getQuote.mockResolvedValueOnce(mockQuote);

      const result = await service.getPositions();

      expect(mockApi.getPositions).toHaveBeenCalledWith(true);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        symbol: 'AAPL',
        quantity: 10,
      });
    });

    it('should handle position data fetch errors gracefully', async () => {
      mockApi.getPositions.mockResolvedValueOnce([mockPosition, mockPosition]);
      mockApi.getInstrumentFromUrl
        .mockResolvedValueOnce(mockInstrument)
        .mockRejectedValueOnce(new Error('Instrument not found'));
      mockApi.getQuote
        .mockResolvedValueOnce(mockQuote)
        .mockRejectedValueOnce(new Error('Quote not found'));

      const result = await service.getPositions();

      expect(result).toHaveLength(1); // Only successful position
    });

    it('should get single position by symbol', async () => {
      mockApi.getPositions.mockResolvedValueOnce([mockPosition]);
      mockApi.getInstrumentBySymbol.mockResolvedValueOnce(mockInstrument);
      mockApi.getQuote.mockResolvedValueOnce(mockQuote);

      const result = await service.getPosition('AAPL');

      expect(mockApi.getInstrumentBySymbol).toHaveBeenCalledWith('AAPL');
      expect(result).toMatchObject({
        symbol: 'AAPL',
        quantity: 10,
      });
    });

    it('should return null for non-existent position', async () => {
      mockApi.getPositions.mockResolvedValueOnce([]);
      mockApi.getInstrumentBySymbol.mockResolvedValueOnce(mockInstrument);

      const result = await service.getPosition('AAPL');

      expect(result).toBeNull();
    });

    it('should handle position fetch error', async () => {
      mockApi.getPositions.mockRejectedValueOnce(new Error('API error'));

      await expect(service.getPosition('AAPL')).rejects.toMatchObject({
        code: 'POSITION_FETCH_FAILED',
        message: 'Failed to fetch position for AAPL',
      });
    });
  });

  describe('Account Operations', () => {
    beforeEach(() => {
      vi.mocked(PortfolioMapper.mapAccount).mockReturnValue({
        id: mockAccount.url,
        accountNumber: mockAccount.accountNumber,
        type: 'margin',
        status: 'active',
        openedDate: new Date(),
        isPrimary: true,
      } as any);

      vi.mocked(PortfolioMapper.mapBalance).mockReturnValue({
        accountId: mockAccount.accountNumber,
        totalValue: 15000,
        cashBalance: 5000,
        buyingPower: 10000,
        currency: 'USD',
        lastUpdated: new Date(),
      } as any);
    });

    it('should get accounts successfully', async () => {
      mockApi.getAccounts.mockResolvedValueOnce([mockAccount]);

      const result = await service.getAccounts();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        accountNumber: mockAccount.accountNumber,
        type: 'margin',
      });
    });

    it('should handle accounts fetch error', async () => {
      mockApi.getAccounts.mockRejectedValueOnce(new Error('API error'));

      await expect(service.getAccounts()).rejects.toMatchObject({
        code: 'ACCOUNTS_FETCH_FAILED',
        message: 'Failed to fetch accounts',
      });
    });

    it('should get balance successfully', async () => {
      mockApi.getAccounts.mockResolvedValueOnce([mockAccount]);

      const result = await service.getBalance();

      expect(result).toMatchObject({
        accountId: mockAccount.accountNumber,
        totalValue: 15000,
        cashBalance: 5000,
      });
    });

    it('should handle no accounts when getting balance', async () => {
      mockApi.getAccounts.mockResolvedValueOnce([]);

      await expect(service.getBalance()).rejects.toMatchObject({
        code: 'BALANCE_FETCH_FAILED',
        message: 'Failed to fetch balance',
      });
    });
  });

  describe('Quote Operations', () => {
    beforeEach(() => {
      vi.mocked(PortfolioMapper.mapQuote).mockReturnValue({
        symbol: 'AAPL',
        name: 'Apple Inc.',
        price: 175.25,
        previousClose: 174,
        change: 1.25,
        changePercent: 0.72,
        currency: 'USD',
      } as any);
    });

    it('should get single quote successfully', async () => {
      mockApi.getQuote.mockResolvedValueOnce(mockQuote);
      mockApi.getInstrumentBySymbol.mockResolvedValueOnce(mockInstrument);

      const result = await service.getQuote('AAPL');

      expect(mockApi.getQuote).toHaveBeenCalledWith('AAPL');
      expect(mockApi.getInstrumentBySymbol).toHaveBeenCalledWith('AAPL');
      expect(result).toMatchObject({
        symbol: 'AAPL',
        price: 175.25,
      });
    });

    it('should handle quote fetch error', async () => {
      mockApi.getQuote.mockRejectedValueOnce(new Error('API error'));

      await expect(service.getQuote('AAPL')).rejects.toMatchObject({
        code: 'QUOTE_FETCH_FAILED',
        message: 'Failed to fetch quote for AAPL',
      });
    });

    it('should get multiple quotes successfully', async () => {
      const mockQuotes = [
        mockQuote,
        { ...mockQuote, symbol: 'GOOGL' },
      ];
      mockApi.getQuotes.mockResolvedValueOnce(mockQuotes);
      mockApi.getInstrumentBySymbol
        .mockResolvedValueOnce(mockInstrument)
        .mockResolvedValueOnce({ ...mockInstrument, symbol: 'GOOGL' });

      const result = await service.getQuotes(['AAPL', 'GOOGL']);

      expect(mockApi.getQuotes).toHaveBeenCalledWith(['AAPL', 'GOOGL']);
      expect(result).toHaveLength(2);
    });

    it('should handle instrument fetch errors in quotes gracefully', async () => {
      mockApi.getQuotes.mockResolvedValueOnce([mockQuote]);
      mockApi.getInstrumentBySymbol.mockRejectedValueOnce(new Error('Not found'));

      const result = await service.getQuotes(['AAPL']);

      expect(result).toHaveLength(1);
    });
  });

  describe('Transaction Operations', () => {
    beforeEach(() => {
      vi.mocked(PortfolioMapper.mapTransaction).mockReturnValue({
        id: mockOrder.id,
        symbol: 'AAPL',
        type: 'buy',
        quantity: 10,
        price: 150,
        amount: 1500,
        status: 'completed',
        executedAt: new Date(),
      } as any);
    });

    it('should get transactions successfully', async () => {
      mockApi.getOrders.mockResolvedValueOnce([mockOrder]);
      mockApi.getInstrumentFromUrl.mockResolvedValueOnce(mockInstrument);

      const result = await service.getTransactions(10);

      expect(mockApi.getOrders).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        symbol: 'AAPL',
        type: 'buy',
      });
    });

    it('should handle instrument fetch errors in transactions gracefully', async () => {
      mockApi.getOrders.mockResolvedValueOnce([mockOrder, mockOrder]);
      mockApi.getInstrumentFromUrl
        .mockResolvedValueOnce(mockInstrument)
        .mockRejectedValueOnce(new Error('Not found'));

      const result = await service.getTransactions(10);

      expect(result).toHaveLength(2); // Both transactions returned, one without instrument
    });

    it('should respect transaction limit', async () => {
      const manyOrders = Array(20).fill(mockOrder);
      mockApi.getOrders.mockResolvedValueOnce(manyOrders);
      mockApi.getInstrumentFromUrl.mockResolvedValue(mockInstrument);

      const result = await service.getTransactions(5);

      expect(result).toHaveLength(5);
    });

    it('should handle transaction fetch error', async () => {
      mockApi.getOrders.mockRejectedValueOnce(new Error('API error'));

      await expect(service.getTransactions()).rejects.toMatchObject({
        code: 'TRANSACTIONS_FETCH_FAILED',
        message: 'Failed to fetch transactions',
      });
    });
  });

  describe('Historical Data Operations', () => {
    beforeEach(() => {
      vi.mocked(PortfolioMapper.mapHistoricalData).mockReturnValue({
        symbol: 'AAPL',
        interval: 'day',
        data: [
          {
            timestamp: new Date(),
            open: 174,
            high: 176,
            low: 173.5,
            close: 175,
            volume: 50000000,
          },
        ],
      } as any);
    });

    it('should get historical data successfully', async () => {
      mockApi.getHistoricals.mockResolvedValueOnce(mockHistoricals);

      const result = await service.getHistoricalData('AAPL', 'day', 'week');

      expect(mockApi.getHistoricals).toHaveBeenCalledWith('AAPL', 'day', 'week');
      expect(result).toMatchObject({
        symbol: 'AAPL',
        interval: 'day',
      });
    });

    it('should use default parameters for historical data', async () => {
      mockApi.getHistoricals.mockResolvedValueOnce(mockHistoricals);

      await service.getHistoricalData('AAPL');

      expect(mockApi.getHistoricals).toHaveBeenCalledWith('AAPL', 'day', 'week');
    });

    it('should handle historical data fetch error', async () => {
      mockApi.getHistoricals.mockRejectedValueOnce(new Error('API error'));

      await expect(service.getHistoricalData('AAPL')).rejects.toMatchObject({
        code: 'HISTORICAL_DATA_FETCH_FAILED',
        message: 'Failed to fetch historical data for AAPL',
      });
    });
  });

  describe('Watchlist Operations', () => {
    beforeEach(() => {
      vi.mocked(PortfolioMapper.mapWatchlist).mockReturnValue({
        id: mockWatchlist.url,
        name: 'Default',
        symbols: ['AAPL', 'GOOGL'],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
    });

    it('should get watchlists successfully', async () => {
      mockApi.getWatchlists.mockResolvedValueOnce([mockWatchlist]);

      const result = await service.getWatchlists();

      expect(mockApi.getWatchlists).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        name: 'Default',
      });
    });

    it('should handle watchlist fetch error', async () => {
      mockApi.getWatchlists.mockRejectedValueOnce(new Error('API error'));

      await expect(service.getWatchlists()).rejects.toMatchObject({
        code: 'WATCHLISTS_FETCH_FAILED',
        message: 'Failed to fetch watchlists',
      });
    });
  });

  describe('Dividend Operations', () => {
    beforeEach(() => {
      vi.mocked(PortfolioMapper.mapDividend).mockReturnValue({
        id: mockDividend.id,
        symbol: 'AAPL',
        amount: 5,
        rate: 0.5,
        shares: 10,
        status: 'paid',
        paymentDate: new Date(),
      } as any);
    });

    it('should get dividends successfully', async () => {
      mockApi.getDividends.mockResolvedValueOnce([mockDividend]);
      mockApi.getInstrumentFromUrl.mockResolvedValueOnce(mockInstrument);

      const result = await service.getDividends();

      expect(mockApi.getDividends).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        symbol: 'AAPL',
        amount: 5,
      });
    });

    it('should handle instrument fetch errors in dividends gracefully', async () => {
      mockApi.getDividends.mockResolvedValueOnce([mockDividend, mockDividend]);
      mockApi.getInstrumentFromUrl
        .mockResolvedValueOnce(mockInstrument)
        .mockRejectedValueOnce(new Error('Not found'));

      const result = await service.getDividends();

      expect(result).toHaveLength(2); // Both dividends returned
    });

    it('should handle dividend fetch error', async () => {
      mockApi.getDividends.mockRejectedValueOnce(new Error('API error'));

      await expect(service.getDividends()).rejects.toMatchObject({
        code: 'DIVIDENDS_FETCH_FAILED',
        message: 'Failed to fetch dividends',
      });
    });
  });

  describe('Error Handling', () => {
    it('should create standardized error with details', () => {
      const error = new Error('Original error');
      const result = (service as any).createStandardizedError(
        'TEST_ERROR',
        'Test error message',
        error
      );

      expect(result).toMatchObject({
        code: 'TEST_ERROR',
        message: 'Test error message',
        details: error,
        source: 'robinhood',
        timestamp: expect.any(Date),
      });
    });

    it('should create standardized error without details', () => {
      const result = (service as any).createStandardizedError(
        'TEST_ERROR',
        'Test error message'
      );

      expect(result).toMatchObject({
        code: 'TEST_ERROR',
        message: 'Test error message',
        details: undefined,
        source: 'robinhood',
        timestamp: expect.any(Date),
      });
    });
  });
});