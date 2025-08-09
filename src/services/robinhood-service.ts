import { RobinhoodClient } from '../api/client';
import { RobinhoodAPI } from '../api/robinhood-api';
import { PortfolioMapper } from '../mappers/portfolio-mapper';
import { RobinhoodConfig, RobinhoodCredentials } from '../types';
import {
  StandardizedPortfolio,
  StandardizedPosition,
  StandardizedTransaction,
  StandardizedBalance,
  StandardizedQuote,
  StandardizedHistoricalData,
  StandardizedWatchlist,
  StandardizedDividend,
  StandardizedAccount,
  StandardizedError,
} from '../models/standardized';

export class RobinhoodService {
  private client: RobinhoodClient;
  private api: RobinhoodAPI;

  constructor(config?: RobinhoodConfig) {
    this.client = new RobinhoodClient(config);
    this.api = new RobinhoodAPI(this.client);
  }

  async authenticate(credentials: RobinhoodCredentials): Promise<void> {
    try {
      await this.client.authenticate(credentials);
    } catch (error: any) {
      if (error.message === 'MFA_REQUIRED') {
        throw this.createStandardizedError('MFA_REQUIRED', 'Multi-factor authentication required');
      }
      throw this.createStandardizedError('AUTH_FAILED', 'Authentication failed', error);
    }
  }

  async refreshToken(): Promise<void> {
    try {
      await this.client.refreshAccessToken();
    } catch (error) {
      throw this.createStandardizedError('TOKEN_REFRESH_FAILED', 'Failed to refresh access token', error);
    }
  }

  isAuthenticated(): boolean {
    return this.client.isAuthenticated();
  }

  async getPortfolio(): Promise<StandardizedPortfolio> {
    try {
      const accounts = await this.api.getAccounts();
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const account = accounts[0];
      const portfolio = await this.api.getPortfolio(account.accountNumber);
      const positions = await this.getPositions();

      return PortfolioMapper.mapPortfolio(account, portfolio, positions);
    } catch (error) {
      throw this.createStandardizedError('PORTFOLIO_FETCH_FAILED', 'Failed to fetch portfolio', error);
    }
  }

  async getPositions(): Promise<StandardizedPosition[]> {
    try {
      const positions = await this.api.getPositions(true);
      const standardizedPositions: StandardizedPosition[] = [];

      for (const position of positions) {
        try {
          const instrument = await this.api.getInstrumentFromUrl(position.instrument);
          const quote = await this.api.getQuote(instrument.symbol);
          const standardized = PortfolioMapper.mapPosition(position, instrument, quote);
          standardizedPositions.push(standardized);
        } catch (error) {
          console.error(`Failed to fetch data for position ${position.url}:`, error);
        }
      }

      return standardizedPositions;
    } catch (error) {
      throw this.createStandardizedError('POSITIONS_FETCH_FAILED', 'Failed to fetch positions', error);
    }
  }

  async getPosition(symbol: string): Promise<StandardizedPosition | null> {
    try {
      const positions = await this.api.getPositions(true);
      const instrument = await this.api.getInstrumentBySymbol(symbol);
      
      const position = positions.find(p => p.instrument === instrument.url);
      if (!position) {
        return null;
      }

      const quote = await this.api.getQuote(symbol);
      return PortfolioMapper.mapPosition(position, instrument, quote);
    } catch (error) {
      throw this.createStandardizedError('POSITION_FETCH_FAILED', `Failed to fetch position for ${symbol}`, error);
    }
  }

  async getAccounts(): Promise<StandardizedAccount[]> {
    try {
      const accounts = await this.api.getAccounts();
      return accounts.map(account => PortfolioMapper.mapAccount(account));
    } catch (error) {
      throw this.createStandardizedError('ACCOUNTS_FETCH_FAILED', 'Failed to fetch accounts', error);
    }
  }

  async getBalance(): Promise<StandardizedBalance> {
    try {
      const accounts = await this.api.getAccounts();
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      return PortfolioMapper.mapBalance(accounts[0]);
    } catch (error) {
      throw this.createStandardizedError('BALANCE_FETCH_FAILED', 'Failed to fetch balance', error);
    }
  }

  async getQuote(symbol: string): Promise<StandardizedQuote> {
    try {
      const [quote, instrument] = await Promise.all([
        this.api.getQuote(symbol),
        this.api.getInstrumentBySymbol(symbol),
      ]);

      return PortfolioMapper.mapQuote(quote, instrument);
    } catch (error) {
      throw this.createStandardizedError('QUOTE_FETCH_FAILED', `Failed to fetch quote for ${symbol}`, error);
    }
  }

  async getQuotes(symbols: string[]): Promise<StandardizedQuote[]> {
    try {
      const quotes = await this.api.getQuotes(symbols);
      const standardizedQuotes: StandardizedQuote[] = [];

      for (const quote of quotes) {
        try {
          const instrument = await this.api.getInstrumentBySymbol(quote.symbol);
          standardizedQuotes.push(PortfolioMapper.mapQuote(quote, instrument));
        } catch (error) {
          console.error(`Failed to fetch instrument for ${quote.symbol}:`, error);
          standardizedQuotes.push(PortfolioMapper.mapQuote(quote));
        }
      }

      return standardizedQuotes;
    } catch (error) {
      throw this.createStandardizedError('QUOTES_FETCH_FAILED', 'Failed to fetch quotes', error);
    }
  }

  async getTransactions(limit = 100): Promise<StandardizedTransaction[]> {
    try {
      const orders = await this.api.getOrders();
      const transactions: StandardizedTransaction[] = [];

      for (const order of orders.slice(0, limit)) {
        try {
          const instrument = await this.api.getInstrumentFromUrl(order.instrument);
          transactions.push(PortfolioMapper.mapTransaction(order, instrument));
        } catch (error) {
          console.error(`Failed to fetch instrument for order ${order.id}:`, error);
          transactions.push(PortfolioMapper.mapTransaction(order));
        }
      }

      return transactions;
    } catch (error) {
      throw this.createStandardizedError('TRANSACTIONS_FETCH_FAILED', 'Failed to fetch transactions', error);
    }
  }

  async getHistoricalData(
    symbol: string,
    interval = 'day',
    span = 'week'
  ): Promise<StandardizedHistoricalData> {
    try {
      const historicals = await this.api.getHistoricals(symbol, interval, span);
      return PortfolioMapper.mapHistoricalData(historicals);
    } catch (error) {
      throw this.createStandardizedError(
        'HISTORICAL_DATA_FETCH_FAILED',
        `Failed to fetch historical data for ${symbol}`,
        error
      );
    }
  }

  async getWatchlists(): Promise<StandardizedWatchlist[]> {
    try {
      const watchlists = await this.api.getWatchlists();
      const standardizedWatchlists: StandardizedWatchlist[] = [];

      for (const watchlist of watchlists) {
        const symbols: string[] = [];
        standardizedWatchlists.push(PortfolioMapper.mapWatchlist(watchlist, symbols));
      }

      return standardizedWatchlists;
    } catch (error) {
      throw this.createStandardizedError('WATCHLISTS_FETCH_FAILED', 'Failed to fetch watchlists', error);
    }
  }

  async getDividends(): Promise<StandardizedDividend[]> {
    try {
      const dividends = await this.api.getDividends();
      const standardizedDividends: StandardizedDividend[] = [];

      for (const dividend of dividends) {
        try {
          const instrument = await this.api.getInstrumentFromUrl(dividend.instrument);
          standardizedDividends.push(PortfolioMapper.mapDividend(dividend, instrument));
        } catch (error) {
          console.error(`Failed to fetch instrument for dividend ${dividend.id}:`, error);
          standardizedDividends.push(PortfolioMapper.mapDividend(dividend));
        }
      }

      return standardizedDividends;
    } catch (error) {
      throw this.createStandardizedError('DIVIDENDS_FETCH_FAILED', 'Failed to fetch dividends', error);
    }
  }

  private createStandardizedError(code: string, message: string, details?: any): StandardizedError {
    return {
      code,
      message,
      details,
      timestamp: new Date(),
      source: 'robinhood',
    };
  }
}