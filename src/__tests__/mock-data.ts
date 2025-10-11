import { AuthTokens, RobinhoodCredentials } from '../types';

export const mockCredentials: RobinhoodCredentials = {
  username: 'testuser@example.com',
  password: 'testpassword123',
  deviceToken: 'mock-device-token-1234567890',
};

export const mockCredentialsWithMFA: RobinhoodCredentials = {
  ...mockCredentials,
  mfaCode: '123456',
};

export const mockAuthTokens: AuthTokens = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  expiresIn: 86400,
  tokenType: 'Bearer',
  scope: 'internal',
};

export const mockAccount = {
  accountNumber: 'TEST123456',
  url: 'https://api.robinhood.com/accounts/TEST123456/',
  buyingPower: '10000.00',
  portfolioCash: '5000.00',
  canDowngrade: false,
  userType: 'margin',
  user: 'https://api.robinhood.com/user/',
  maxAchEarlyAccessAmount: '0.00',
  cashBalances: {
    buyingPower: '10000.00',
    cash: '5000.00',
    cashHeldForOrders: '0.00',
    unclearedDeposits: '0.00',
    unsettledFunds: '0.00',
  },
  type: 'margin',
  created: '2023-01-01T00:00:00Z',
  updated: '2024-01-01T00:00:00Z',
  portfolio: 'https://api.robinhood.com/portfolios/TEST123456/',
};

export const mockPortfolio = {
  url: 'https://api.robinhood.com/portfolios/TEST123456/',
  extended_hours_market_value: '15000.00',
  market_value: '15000.00',
  total_return_today: '250.00',
  total_return_percent: '0.0167',
  adjusted_equity_previous_close: '14750.00',
  equity: '15000.00',
  equity_previous_close: '14750.00',
  excess_maintenance: '10000.00',
  lastCoreEquity: '14750.00',
  last_core_market_value: '15000.00',
};

export const mockInstrument = {
  id: 'INST123',
  url: 'https://api.robinhood.com/instruments/INST123/',
  symbol: 'AAPL',
  name: 'Apple Inc.',
  simpleName: 'Apple',
  market: 'NASDAQ',
  type: 'stock',
  tradeable: true,
  state: 'active',
  quote: 'https://api.robinhood.com/quotes/AAPL/',
  fundamentals: 'https://api.robinhood.com/fundamentals/AAPL/',
  splits: 'https://api.robinhood.com/instruments/INST123/splits/',
  tradability: 'tradable',
  dayTradeRatio: '0.25',
  maintenanceRatio: '0.25',
  marginInitialRatio: '0.50',
  minTickSize: null,
  tradableChainId: null,
  rhsTradability: 'tradable',
  fractionalTradability: 'tradable',
  defaultCollarFraction: '0.05',
};

export const mockPosition = {
  url: 'https://api.robinhood.com/positions/TEST123456/INST123/',
  instrument: 'https://api.robinhood.com/instruments/INST123/',
  account: 'https://api.robinhood.com/accounts/TEST123456/',
  accountNumber: 'TEST123456',
  averageBuyPrice: '150.00',
  pendingAverageBuyPrice: '150.00',
  quantity: '10.0000',
  intradayQuantity: '10.0000',
  intradayAverageBuyPrice: '150.00',
  sharesAvailableForExercise: '0.0000',
  sharesHeldForBuys: '0.0000',
  sharesHeldForSells: '0.0000',
  sharesHeldForStockGrants: '0.0000',
  sharesPendingFromOptionsEvents: '0.0000',
  updatedAt: '2024-01-01T00:00:00Z',
  createdAt: '2023-01-01T00:00:00Z',
};

export const mockQuote = {
  askPrice: '175.50',
  askSize: 100,
  bidPrice: '175.00',
  bidSize: 200,
  lastTradePrice: '175.25',
  lastExtendedHoursTradePrice: '175.30',
  previousClose: '174.00',
  adjustedPreviousClose: '174.00',
  previousCloseDate: '2024-01-01',
  symbol: 'AAPL',
  tradingHalted: false,
  hasTraded: true,
  lastTradePriceSource: 'consolidated',
  updatedAt: '2024-01-02T15:00:00Z',
  instrument: 'https://api.robinhood.com/instruments/INST123/',
};

export const mockOrder = {
  id: 'ORDER123',
  url: 'https://api.robinhood.com/orders/ORDER123/',
  account: 'https://api.robinhood.com/accounts/TEST123456/',
  instrument: 'https://api.robinhood.com/instruments/INST123/',
  symbol: 'AAPL',
  side: 'buy',
  timeInForce: 'gfd',
  trigger: 'immediate',
  type: 'market',
  state: 'filled',
  price: null,
  stopPrice: null,
  quantity: '10.0000',
  executedQuantity: '10.0000',
  executedPrice: '150.00',
  averagePrice: '150.00',
  fees: '0.00',
  createdAt: '2023-01-01T10:00:00Z',
  updatedAt: '2023-01-01T10:01:00Z',
  executedAt: '2023-01-01T10:01:00Z',
};

export const mockHistoricals = {
  symbol: 'AAPL',
  interval: 'day',
  span: 'week',
  bounds: 'regular',
  previousClosePrice: '174.00',
  historicals: [
    {
      beginsAt: '2024-01-01T14:30:00Z',
      openPrice: '174.00',
      closePrice: '175.00',
      highPrice: '176.00',
      lowPrice: '173.50',
      volume: 50000000,
      session: 'reg',
      interpolated: false,
    },
    {
      beginsAt: '2024-01-02T14:30:00Z',
      openPrice: '175.00',
      closePrice: '175.25',
      highPrice: '176.50',
      lowPrice: '174.00',
      volume: 45000000,
      session: 'reg',
      interpolated: false,
    },
  ],
};

export const mockWatchlist = {
  url: 'https://api.robinhood.com/watchlists/Default/',
  user: 'https://api.robinhood.com/user/',
  name: 'Default',
};

export const mockDividend = {
  id: 'DIV123',
  url: 'https://api.robinhood.com/dividends/DIV123/',
  account: 'https://api.robinhood.com/accounts/TEST123456/',
  instrument: 'https://api.robinhood.com/instruments/INST123/',
  amount: '5.00',
  rate: '0.50',
  position: '10.0000',
  withholding: '0.00',
  recordDate: '2024-01-01',
  payableDate: '2024-01-15',
  paidAt: '2024-01-15T09:00:00Z',
  state: 'paid',
};