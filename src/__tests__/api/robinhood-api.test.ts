import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RobinhoodAPI } from '../../api/robinhood-api';
import { RobinhoodClient } from '../../api/client';
import { 
  mockAccount, 
  mockPortfolio, 
  mockPosition, 
  mockInstrument, 
  mockQuote,
  mockOrder,
  mockHistoricals,
  mockWatchlist,
  mockDividend
} from '../mock-data';

vi.mock('../../api/client');

describe('RobinhoodAPI', () => {
  let api: RobinhoodAPI;
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      paginate: vi.fn(),
      isAuthenticated: vi.fn().mockReturnValue(true),
    };
    api = new RobinhoodAPI(mockClient as RobinhoodClient);
  });

  describe('Account Operations', () => {
    it('should get all accounts', async () => {
      mockClient.paginate.mockResolvedValueOnce([mockAccount]);

      const result = await api.getAccounts();

      expect(mockClient.paginate).toHaveBeenCalledWith('/accounts/');
      expect(result).toEqual([mockAccount]);
    });

    it('should get single account by ID', async () => {
      mockClient.get.mockResolvedValueOnce(mockAccount);

      const result = await api.getAccount('TEST123456');

      expect(mockClient.get).toHaveBeenCalledWith('/accounts/TEST123456/');
      expect(result).toEqual(mockAccount);
    });

    it('should get portfolio for account', async () => {
      mockClient.get.mockResolvedValueOnce(mockPortfolio);

      const result = await api.getPortfolio('TEST123456');

      expect(mockClient.get).toHaveBeenCalledWith('/accounts/TEST123456/portfolio/');
      expect(result).toEqual(mockPortfolio);
    });
  });

  describe('Position Operations', () => {
    it('should get all non-zero positions by default', async () => {
      mockClient.paginate.mockResolvedValueOnce([mockPosition]);

      const result = await api.getPositions();

      expect(mockClient.paginate).toHaveBeenCalledWith('/positions/?nonzero=true');
      expect(result).toEqual([mockPosition]);
    });

    it('should get all positions including zero when specified', async () => {
      mockClient.paginate.mockResolvedValueOnce([mockPosition]);

      const result = await api.getPositions(false);

      expect(mockClient.paginate).toHaveBeenCalledWith('/positions/');
      expect(result).toEqual([mockPosition]);
    });

    it('should get single position by ID', async () => {
      mockClient.get.mockResolvedValueOnce(mockPosition);

      const result = await api.getPosition('position123');

      expect(mockClient.get).toHaveBeenCalledWith('/positions/position123/');
      expect(result).toEqual(mockPosition);
    });
  });

  describe('Instrument Operations', () => {
    it('should get instrument by ID', async () => {
      mockClient.get.mockResolvedValueOnce(mockInstrument);

      const result = await api.getInstrument('INST123');

      expect(mockClient.get).toHaveBeenCalledWith('/instruments/INST123/');
      expect(result).toEqual(mockInstrument);
    });

    it('should get instrument by symbol', async () => {
      mockClient.get.mockResolvedValueOnce({
        results: [mockInstrument],
      });

      const result = await api.getInstrumentBySymbol('AAPL');

      expect(mockClient.get).toHaveBeenCalledWith('/instruments/?symbol=AAPL');
      expect(result).toEqual(mockInstrument);
    });

    it('should throw error when instrument not found by symbol', async () => {
      mockClient.get.mockResolvedValueOnce({
        results: [],
      });

      await expect(api.getInstrumentBySymbol('INVALID')).rejects.toThrow(
        'Instrument not found for symbol: INVALID'
      );
    });

    it('should get instrument from URL', async () => {
      mockClient.get.mockResolvedValueOnce(mockInstrument);

      const result = await api.getInstrumentFromUrl(
        'https://api.robinhood.com/instruments/INST123/'
      );

      expect(mockClient.get).toHaveBeenCalledWith(
        'https://api.robinhood.com/instruments/INST123/'
      );
      expect(result).toEqual(mockInstrument);
    });
  });

  describe('Quote Operations', () => {
    it('should get single quote', async () => {
      mockClient.get.mockResolvedValueOnce(mockQuote);

      const result = await api.getQuote('AAPL');

      expect(mockClient.get).toHaveBeenCalledWith('/marketdata/quotes/AAPL/');
      expect(result).toEqual(mockQuote);
    });

    it('should get multiple quotes', async () => {
      const mockQuotes = [mockQuote, { ...mockQuote, symbol: 'GOOGL' }];
      mockClient.get.mockResolvedValueOnce({
        results: mockQuotes,
      });

      const result = await api.getQuotes(['AAPL', 'GOOGL']);

      expect(mockClient.get).toHaveBeenCalledWith(
        '/marketdata/quotes/?symbols=AAPL,GOOGL'
      );
      expect(result).toEqual(mockQuotes);
    });

    it('should handle empty quotes array', async () => {
      const result = await api.getQuotes([]);

      expect(mockClient.get).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('Order Operations', () => {
    it('should get all orders', async () => {
      mockClient.paginate.mockResolvedValueOnce([mockOrder]);

      const result = await api.getOrders();

      expect(mockClient.paginate).toHaveBeenCalledWith('/orders/');
      expect(result).toEqual([mockOrder]);
    });

    it('should get single order by ID', async () => {
      mockClient.get.mockResolvedValueOnce(mockOrder);

      const result = await api.getOrder('ORDER123');

      expect(mockClient.get).toHaveBeenCalledWith('/orders/ORDER123/');
      expect(result).toEqual(mockOrder);
    });
  });

  describe('Historical Data Operations', () => {
    it('should get historical data with default parameters', async () => {
      mockClient.get.mockResolvedValueOnce(mockHistoricals);

      const result = await api.getHistoricals('AAPL');

      expect(mockClient.get).toHaveBeenCalledWith(
        '/marketdata/historicals/AAPL/?interval=day&span=week&bounds=regular'
      );
      expect(result).toEqual(mockHistoricals);
    });

    it('should get historical data with custom parameters', async () => {
      mockClient.get.mockResolvedValueOnce(mockHistoricals);

      const result = await api.getHistoricals('AAPL', '5minute', 'day', 'extended');

      expect(mockClient.get).toHaveBeenCalledWith(
        '/marketdata/historicals/AAPL/?interval=5minute&span=day&bounds=extended'
      );
      expect(result).toEqual(mockHistoricals);
    });
  });

  describe('Crypto Operations', () => {
    it('should get crypto holdings', async () => {
      const mockCryptoHolding = {
        id: 'CRYPTO123',
        accountId: 'TEST123456',
        currency: {
          code: 'BTC',
          name: 'Bitcoin',
        },
        quantity: '0.5',
        costBases: [{
          currency: 'USD',
          directCostBasis: '15000.00',
        }],
      };

      mockClient.paginate.mockResolvedValueOnce([mockCryptoHolding]);

      const result = await api.getCryptoHoldings();

      expect(mockClient.paginate).toHaveBeenCalledWith('/nummus/holdings/');
      expect(result).toEqual([mockCryptoHolding]);
    });

    it('should get crypto quote', async () => {
      const mockCryptoQuote = {
        symbol: 'BTC',
        askPrice: '50000.00',
        bidPrice: '49900.00',
        markPrice: '49950.00',
        highPrice: '51000.00',
        lowPrice: '48000.00',
        openPrice: '49000.00',
        volume: '1000000',
      };

      mockClient.get.mockResolvedValueOnce(mockCryptoQuote);

      const result = await api.getCryptoQuote('BTC');

      expect(mockClient.get).toHaveBeenCalledWith('/marketdata/crypto/quotes/BTC/');
      expect(result).toEqual(mockCryptoQuote);
    });
  });

  describe('Watchlist Operations', () => {
    it('should get all watchlists', async () => {
      mockClient.paginate.mockResolvedValueOnce([mockWatchlist]);

      const result = await api.getWatchlists();

      expect(mockClient.paginate).toHaveBeenCalledWith('/watchlists/');
      expect(result).toEqual([mockWatchlist]);
    });

    it('should get single watchlist', async () => {
      mockClient.get.mockResolvedValueOnce(mockWatchlist);

      const result = await api.getWatchlist('Default');

      expect(mockClient.get).toHaveBeenCalledWith('/watchlists/Default/');
      expect(result).toEqual(mockWatchlist);
    });
  });

  describe('Dividend Operations', () => {
    it('should get all dividends', async () => {
      mockClient.paginate.mockResolvedValueOnce([mockDividend]);

      const result = await api.getDividends();

      expect(mockClient.paginate).toHaveBeenCalledWith('/dividends/');
      expect(result).toEqual([mockDividend]);
    });
  });

  describe('Options Operations', () => {
    it('should get options positions', async () => {
      const mockOptionsPosition = {
        id: 'OPT123',
        quantity: '5',
        averagePrice: '2.50',
        chainSymbol: 'AAPL',
        optionType: 'call',
        strikePrice: '150.00',
        expirationDate: '2024-12-31',
      };

      mockClient.paginate.mockResolvedValueOnce([mockOptionsPosition]);

      const result = await api.getOptionsPositions();

      expect(mockClient.paginate).toHaveBeenCalledWith('/options/positions/');
      expect(result).toEqual([mockOptionsPosition]);
    });

    it('should get options orders', async () => {
      const mockOptionsOrder = {
        id: 'OPTORD123',
        quantity: '5',
        price: '2.50',
        side: 'buy',
        state: 'filled',
        legs: [{
          optionType: 'call',
          strikePrice: '150.00',
          expirationDate: '2024-12-31',
        }],
      };

      mockClient.paginate.mockResolvedValueOnce([mockOptionsOrder]);

      const result = await api.getOptionsOrders();

      expect(mockClient.paginate).toHaveBeenCalledWith('/options/orders/');
      expect(result).toEqual([mockOptionsOrder]);
    });
  });

  describe('Search Operations', () => {
    it('should search instruments', async () => {
      mockClient.get.mockResolvedValueOnce({
        results: [mockInstrument],
      });

      const result = await api.searchInstruments('Apple');

      expect(mockClient.get).toHaveBeenCalledWith('/instruments/?query=Apple');
      expect(result).toEqual([mockInstrument]);
    });

    it('should return empty array when no search results', async () => {
      mockClient.get.mockResolvedValueOnce({
        results: [],
      });

      const result = await api.searchInstruments('NonExistent');

      expect(result).toEqual([]);
    });
  });
});