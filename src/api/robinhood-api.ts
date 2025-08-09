import { RobinhoodClient } from './client';
import { ENDPOINTS } from './endpoints';
import {
  RobinhoodAccount,
  RobinhoodPosition,
  RobinhoodInstrument,
  RobinhoodQuote,
  RobinhoodOrder,
  RobinhoodPortfolio,
  RobinhoodHistoricals,
  RobinhoodCryptoHolding,
  RobinhoodCryptoQuote,
  RobinhoodDividend,
  RobinhoodWatchlist,
  ApiResponse,
} from '../types';

export class RobinhoodAPI {
  constructor(private client: RobinhoodClient) {}

  async getAccounts(): Promise<RobinhoodAccount[]> {
    return this.client.paginate<RobinhoodAccount>(ENDPOINTS.ACCOUNTS.LIST);
  }

  async getAccount(accountId: string): Promise<RobinhoodAccount> {
    return this.client.get<RobinhoodAccount>(ENDPOINTS.ACCOUNTS.DETAIL(accountId));
  }

  async getPortfolio(accountId: string): Promise<RobinhoodPortfolio> {
    return this.client.get<RobinhoodPortfolio>(ENDPOINTS.ACCOUNTS.PORTFOLIO(accountId));
  }

  async getPositions(nonzero = true): Promise<RobinhoodPosition[]> {
    const url = nonzero ? ENDPOINTS.POSITIONS.OWNED : ENDPOINTS.POSITIONS.LIST;
    return this.client.paginate<RobinhoodPosition>(url);
  }

  async getPosition(positionId: string): Promise<RobinhoodPosition> {
    return this.client.get<RobinhoodPosition>(ENDPOINTS.POSITIONS.DETAIL(positionId));
  }

  async getInstrument(instrumentId: string): Promise<RobinhoodInstrument> {
    return this.client.get<RobinhoodInstrument>(ENDPOINTS.INSTRUMENTS.DETAIL(instrumentId));
  }

  async getInstrumentBySymbol(symbol: string): Promise<RobinhoodInstrument> {
    const response = await this.client.get<ApiResponse<RobinhoodInstrument>>(
      ENDPOINTS.INSTRUMENTS.BY_SYMBOL(symbol)
    );
    if (response.results && response.results.length > 0) {
      return response.results[0];
    }
    throw new Error(`Instrument not found for symbol: ${symbol}`);
  }

  async getInstrumentFromUrl(url: string): Promise<RobinhoodInstrument> {
    return this.client.get<RobinhoodInstrument>(url);
  }

  async getQuote(symbol: string): Promise<RobinhoodQuote> {
    return this.client.get<RobinhoodQuote>(ENDPOINTS.INSTRUMENTS.QUOTE(symbol));
  }

  async getQuotes(symbols: string[]): Promise<RobinhoodQuote[]> {
    const response = await this.client.get<ApiResponse<RobinhoodQuote>>(
      ENDPOINTS.QUOTES.BY_SYMBOLS(symbols)
    );
    return response.results || [];
  }

  async getOrders(state?: string): Promise<RobinhoodOrder[]> {
    let url = ENDPOINTS.ORDERS.LIST;
    if (state) {
      url += `?state=${state}`;
    }
    return this.client.paginate<RobinhoodOrder>(url);
  }

  async getOrder(orderId: string): Promise<RobinhoodOrder> {
    return this.client.get<RobinhoodOrder>(ENDPOINTS.ORDERS.DETAIL(orderId));
  }

  async placeOrder(orderData: Partial<RobinhoodOrder>): Promise<RobinhoodOrder> {
    return this.client.post<RobinhoodOrder>(ENDPOINTS.ORDERS.PLACE, orderData);
  }

  async cancelOrder(orderId: string): Promise<void> {
    return this.client.post(ENDPOINTS.ORDERS.CANCEL(orderId));
  }

  async getHistoricals(
    symbol: string,
    interval: string = 'day',
    span: string = 'week'
  ): Promise<RobinhoodHistoricals> {
    const url = `${ENDPOINTS.QUOTES.HISTORICALS(symbol)}?interval=${interval}&span=${span}`;
    return this.client.get<RobinhoodHistoricals>(url);
  }

  async getCryptoHoldings(): Promise<RobinhoodCryptoHolding[]> {
    return this.client.paginate<RobinhoodCryptoHolding>(ENDPOINTS.CRYPTO.HOLDINGS);
  }

  async getCryptoQuote(currencyPairId: string): Promise<RobinhoodCryptoQuote> {
    return this.client.get<RobinhoodCryptoQuote>(ENDPOINTS.CRYPTO.QUOTES(currencyPairId));
  }

  async getWatchlists(): Promise<RobinhoodWatchlist[]> {
    return this.client.paginate<RobinhoodWatchlist>(ENDPOINTS.WATCHLISTS.LIST);
  }

  async getWatchlist(name: string): Promise<RobinhoodWatchlist> {
    return this.client.get<RobinhoodWatchlist>(ENDPOINTS.WATCHLISTS.DETAIL(name));
  }

  async getDividends(): Promise<RobinhoodDividend[]> {
    return this.client.paginate<RobinhoodDividend>(ENDPOINTS.DIVIDENDS.LIST);
  }

  async getUserProfile(): Promise<any> {
    return this.client.get(ENDPOINTS.USER.PROFILE);
  }

  async getMarkets(): Promise<any[]> {
    return this.client.paginate(ENDPOINTS.MARKETS.LIST);
  }

  async getMarketHours(market: string, date: string): Promise<any> {
    return this.client.get(ENDPOINTS.MARKETS.HOURS(market, date));
  }

  async getNews(symbol: string): Promise<any[]> {
    return this.client.paginate(ENDPOINTS.NEWS.LIST(symbol));
  }

  async getDocuments(): Promise<any[]> {
    return this.client.paginate(ENDPOINTS.DOCUMENTS.LIST);
  }

  async downloadDocument(documentId: string): Promise<any> {
    return this.client.get(ENDPOINTS.DOCUMENTS.DOWNLOAD(documentId));
  }
}