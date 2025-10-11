import { describe, it, expect } from 'vitest';
import { PortfolioMapper } from '../../mappers/portfolio-mapper';
import {
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

describe('PortfolioMapper', () => {
  describe('mapAccount', () => {
    it('should map Robinhood account to standardized account', () => {
      const result = PortfolioMapper.mapAccount(mockAccount);

      expect(result).toEqual({
        id: mockAccount.url,
        accountNumber: mockAccount.accountNumber,
        type: mockAccount.type,
        status: 'active',
        openedDate: new Date(mockAccount.createdAt),
        isPrimary: true,
        tradingPermissions: {
          stocks: true,
          options: true,
          crypto: true,
          forex: false,
        },
        marginEnabled: true,
        optionsLevel: 0,
        dayTradeCount: 0,
        metadata: {
          source: 'robinhood',
          url: mockAccount.url,
          lastUpdated: new Date(mockAccount.updatedAt),
        },
      });
    });

    it('should set marginEnabled to false for cash accounts', () => {
      const cashAccount = { ...mockAccount, type: 'cash' };
      const result = PortfolioMapper.mapAccount(cashAccount);

      expect(result.marginEnabled).toBe(false);
    });
  });

  describe('mapBalance', () => {
    it('should map Robinhood account to standardized balance', () => {
      const result = PortfolioMapper.mapBalance(mockAccount);

      expect(result).toEqual({
        accountId: mockAccount.accountNumber,
        totalValue: 0,
        cashBalance: 5000,
        marginBalance: 0,
        unsettledCash: 0,
        withdrawableCash: 5000,
        buyingPower: 10000,
        dayTradeBuyingPower: 0,
        maintenanceRequirement: 0,
        marginCallAmount: 0,
        currency: 'USD',
        lastUpdated: new Date(),
      });
    });
  });

  describe('mapPortfolio', () => {
    it('should map Robinhood portfolio to standardized portfolio', () => {
      const positions = [
        PortfolioMapper.mapPosition(mockPosition, mockInstrument, mockQuote),
      ];

      const result = PortfolioMapper.mapPortfolio(
        mockAccount,
        mockPortfolio,
        positions
      );

      expect(result).toMatchObject({
        accountId: mockAccount.accountNumber,
        totalValue: 15000,
        positions,
        performance: {
          totalReturn: expect.any(Number),
          totalReturnPercent: expect.any(Number),
          dayReturn: expect.any(Number),
          dayReturnPercent: expect.any(Number),
        },
        allocation: {
          stocks: 100,
          bonds: 0,
          cash: 0,
          crypto: 0,
          other: 0,
        },
        currency: 'USD',
        lastUpdated: expect.any(Date),
      });
    });

    it('should handle missing portfolio values', () => {
      const emptyPortfolio = {
        ...mockPortfolio,
        marketValue: null,
        equity: null,
        lastCoreEquity: null,
      };

      const result = PortfolioMapper.mapPortfolio(
        mockAccount,
        emptyPortfolio,
        []
      );

      expect(result.totalValue).toBe(0);
      expect(result.performance.dayReturn).toBe(0);
    });
  });

  describe('mapPosition', () => {
    it('should map Robinhood position to standardized position', () => {
      const result = PortfolioMapper.mapPosition(
        mockPosition,
        mockInstrument,
        mockQuote
      );

      expect(result).toEqual({
        id: mockPosition.url,
        symbol: mockInstrument.symbol,
        name: mockInstrument.name,
        quantity: 10,
        averagePrice: 150,
        currentPrice: 175.25,
        marketValue: 1752.5,
        costBasis: 1500,
        unrealizedGain: 252.5,
        unrealizedGainPercent: 16.833333333333332,
        realizedGain: 0,
        dayChange: 12.5,
        dayChangePercent: 0.7183908045977011,
        assetType: 'stock',
        currency: 'USD',
        exchange: 'NASDAQ',
        lastUpdated: expect.any(Date),
        metadata: {
          instrumentId: mockInstrument.id,
          instrumentUrl: mockInstrument.url,
          positionUrl: mockPosition.url,
        },
      });
    });

    it('should handle position without quote data', () => {
      const result = PortfolioMapper.mapPosition(mockPosition, mockInstrument);

      expect(result).toMatchObject({
        id: mockPosition.url,
        symbol: mockInstrument.symbol,
        name: mockInstrument.name,
        quantity: 10,
        averagePrice: 150,
        currentPrice: 0,
        marketValue: 0,
        costBasis: 1500,
        unrealizedGain: -1500,
      });
    });

    it('should handle position without instrument data', () => {
      const result = PortfolioMapper.mapPosition(mockPosition);

      expect(result).toMatchObject({
        id: mockPosition.url,
        symbol: 'UNKNOWN',
        name: 'Unknown Instrument',
        quantity: 10,
        averagePrice: 150,
      });
    });
  });

  describe('mapQuote', () => {
    it('should map Robinhood quote to standardized quote', () => {
      const result = PortfolioMapper.mapQuote(mockQuote, mockInstrument);

      expect(result).toEqual({
        symbol: mockQuote.symbol,
        name: mockInstrument.name,
        price: 175.25,
        previousClose: 174,
        open: 0,
        dayHigh: 0,
        dayLow: 0,
        volume: 0,
        marketCap: 3000000000000,
        peRatio: 0,
        dividendYield: 0,
        fiftyTwoWeekHigh: 0,
        fiftyTwoWeekLow: 0,
        change: 1.25,
        changePercent: 0.7183908045977011,
        bid: 175,
        bidSize: 200,
        ask: 175.5,
        askSize: 100,
        lastTradeTime: new Date(mockQuote.updatedAt),
        exchange: 'NASDAQ',
        currency: 'USD',
        isMarketOpen: true,
        extendedHoursPrice: 175.3,
        metadata: {
          instrumentUrl: mockQuote.instrument,
          source: 'consolidated',
        },
      });
    });

    it('should handle quote without instrument data', () => {
      const result = PortfolioMapper.mapQuote(mockQuote);

      expect(result).toMatchObject({
        symbol: mockQuote.symbol,
        name: mockQuote.symbol,
        price: 175.25,
        marketCap: 0,
      });
    });

    it('should handle trading halted status', () => {
      const haltedQuote = { ...mockQuote, tradingHalted: true };
      const result = PortfolioMapper.mapQuote(haltedQuote, mockInstrument);

      expect(result.isMarketOpen).toBe(false);
    });
  });

  describe('mapTransaction', () => {
    it('should map Robinhood order to standardized transaction', () => {
      const result = PortfolioMapper.mapTransaction(mockOrder, mockInstrument);

      expect(result).toEqual({
        id: mockOrder.id,
        accountId: mockOrder.account.split('/').slice(-2, -1)[0],
        symbol: mockInstrument.symbol,
        name: mockInstrument.name,
        type: 'buy',
        quantity: 10,
        price: 150,
        amount: 1500,
        fees: 0,
        currency: 'USD',
        status: 'completed',
        orderType: 'market',
        executedAt: new Date(mockOrder.executedAt),
        createdAt: new Date(mockOrder.createdAt),
        updatedAt: new Date(mockOrder.updatedAt),
        metadata: {
          orderId: mockOrder.id,
          orderUrl: mockOrder.url,
          instrumentUrl: mockOrder.instrument,
        },
      });
    });

    it('should handle order without instrument data', () => {
      const result = PortfolioMapper.mapTransaction(mockOrder);

      expect(result).toMatchObject({
        id: mockOrder.id,
        symbol: mockOrder.symbol || 'UNKNOWN',
        name: 'Unknown',
        type: 'buy',
        quantity: 10,
      });
    });

    it('should map order states correctly', () => {
      const cancelledOrder = { ...mockOrder, state: 'cancelled' };
      const result = PortfolioMapper.mapTransaction(cancelledOrder);

      expect(result.status).toBe('cancelled');
    });

    it('should handle limit orders', () => {
      const limitOrder = { ...mockOrder, type: 'limit', price: '155.00' };
      const result = PortfolioMapper.mapTransaction(limitOrder);

      expect(result.orderType).toBe('limit');
      expect(result.price).toBe(150); // Still uses executed price
    });
  });

  describe('mapHistoricalData', () => {
    it('should map Robinhood historicals to standardized historical data', () => {
      const result = PortfolioMapper.mapHistoricalData(mockHistoricals);

      expect(result).toEqual({
        symbol: mockHistoricals.symbol,
        interval: mockHistoricals.interval,
        data: mockHistoricals.historicals.map((h) => ({
          timestamp: new Date(h.beginsAt),
          open: 0,
          high: 0,
          low: 0,
          close: parseFloat(h.closePrice),
          volume: h.volume,
          adjustedClose: parseFloat(h.closePrice),
        })),
        metadata: {
          span: mockHistoricals.span,
          bounds: mockHistoricals.bounds,
        },
      });
    });

    it('should handle missing historical data', () => {
      const emptyHistoricals = {
        ...mockHistoricals,
        historicals: [],
      };

      const result = PortfolioMapper.mapHistoricalData(emptyHistoricals);

      expect(result.data).toEqual([]);
    });

    it('should parse historical prices correctly', () => {
      const result = PortfolioMapper.mapHistoricalData(mockHistoricals);

      expect(result.data[0]).toMatchObject({
        timestamp: new Date('2024-01-01T14:30:00Z'),
        close: 175,
        volume: 50000000,
      });
    });
  });

  describe('mapWatchlist', () => {
    it('should map Robinhood watchlist to standardized watchlist', () => {
      const symbols = ['AAPL', 'GOOGL', 'MSFT'];
      const result = PortfolioMapper.mapWatchlist(mockWatchlist, symbols);

      expect(result).toEqual({
        id: mockWatchlist.url,
        name: mockWatchlist.name,
        symbols,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          url: mockWatchlist.url,
        },
      });
    });

    it('should handle empty symbol list', () => {
      const result = PortfolioMapper.mapWatchlist(mockWatchlist, []);

      expect(result.symbols).toEqual([]);
    });
  });

  describe('mapDividend', () => {
    it('should map Robinhood dividend to standardized dividend', () => {
      const result = PortfolioMapper.mapDividend(mockDividend, mockInstrument);

      expect(result).toEqual({
        id: mockDividend.id,
        accountId: mockDividend.account.split('/').slice(-2, -1)[0],
        symbol: mockInstrument.symbol,
        name: mockInstrument.name,
        amount: 5,
        rate: 0.5,
        shares: 10,
        grossAmount: 5,
        taxWithheld: 0,
        netAmount: 5,
        currency: 'USD',
        status: 'paid',
        exDate: new Date(mockDividend.recordDate),
        paymentDate: new Date(mockDividend.payableDate),
        recordDate: new Date(mockDividend.recordDate),
        declaredDate: new Date(mockDividend.recordDate),
        metadata: {
          dividendId: mockDividend.id,
          dividendUrl: mockDividend.url,
          instrumentUrl: mockDividend.instrument,
        },
      });
    });

    it('should handle dividend without instrument data', () => {
      const result = PortfolioMapper.mapDividend(mockDividend);

      expect(result).toMatchObject({
        id: mockDividend.id,
        symbol: 'UNKNOWN',
        name: 'Unknown',
        amount: 5,
      });
    });

    it('should map dividend states correctly', () => {
      const pendingDividend = { ...mockDividend, state: 'pending' };
      const result = PortfolioMapper.mapDividend(pendingDividend);

      expect(result.status).toBe('pending');
    });

    it('should calculate net amount correctly with withholding', () => {
      const dividendWithTax = { ...mockDividend, withholding: '1.00' };
      const result = PortfolioMapper.mapDividend(dividendWithTax);

      expect(result.taxWithheld).toBe(1);
      expect(result.netAmount).toBe(4);
    });
  });
});