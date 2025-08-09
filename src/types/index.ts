export interface RobinhoodConfig {
  apiKey?: string;
  accessToken?: string;
  refreshToken?: string;
  deviceToken?: string;
  clientId?: string;
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface RobinhoodCredentials {
  username: string;
  password: string;
  mfaCode?: string;
  deviceToken?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  scope: string;
  backupCode?: string;
  mfaCode?: string;
}

export interface RobinhoodAccount {
  url: string;
  portfolioCash: string;
  canDowngrade: boolean;
  userType: string;
  buyingPower: string;
  user: string;
  maxAchEarlyAccessAmount: string;
  cashBalances: {
    buyingPower: string;
    cash: string;
    cashHeldForOrders: string;
    unclearedDeposits: string;
    unsettledFunds: string;
  };
  portfolio: string;
  accountNumber: string;
  type: string;
  created: string;
  updated: string;
}

export interface RobinhoodPosition {
  url: string;
  instrument: string;
  account: string;
  accountNumber: string;
  averageBuyPrice: string;
  pendingAverageBuyPrice: string;
  quantity: string;
  intradayAverageBuyPrice: string;
  intradayQuantity: string;
  sharesAvailableForExercise: string;
  sharesHeldForBuys: string;
  sharesHeldForSells: string;
  sharesHeldForStockGrants: string;
  sharesPendingFromOptionsEvents: string;
  updatedAt: string;
  createdAt: string;
}

export interface RobinhoodInstrument {
  id: string;
  url: string;
  quote: string;
  fundamentals: string;
  splits: string;
  state: string;
  market: string;
  simpleName: string | null;
  name: string;
  tradeable: boolean;
  tradability: string;
  symbol: string;
  dayTradeRatio: string;
  maintenanceRatio: string;
  marginInitialRatio: string;
  minTickSize: string | null;
  type: string;
  tradableChainId: string | null;
  rhsTradability: string;
  fractionalTradability: string;
  defaultCollarFraction: string;
}

export interface RobinhoodQuote {
  askPrice: string;
  askSize: number;
  bidPrice: string;
  bidSize: number;
  lastTradePrice: string;
  lastExtendedHoursTradePrice: string | null;
  previousClose: string;
  adjustedPreviousClose: string;
  previousCloseDate: string;
  symbol: string;
  tradingHalted: boolean;
  hasTraded: boolean;
  lastTradePriceSource: string;
  updatedAt: string;
  instrument: string;
}

export interface RobinhoodOrder {
  id: string;
  ref_id: string | null;
  url: string;
  account: string;
  position: string;
  cancel: string | null;
  instrument: string;
  cumulativeQuantity: string;
  averagePrice: string | null;
  fees: string;
  state: string;
  type: string;
  side: string;
  timeInForce: string;
  trigger: string;
  price: string | null;
  stopPrice: string | null;
  quantity: string;
  rejectReason: string | null;
  created: string;
  updated: string;
  lastTransactionAt: string;
  executions: any[];
  extendedHours: boolean;
  overrideDayTradeChecks: boolean;
  overrideDtbpChecks: boolean;
  responseCategory: string | null;
  stopTriggeredAt: string | null;
  lastTrailPrice: string | null;
  lastTrailPriceUpdatedAt: string | null;
  dollarBasedAmount: {
    amount: string;
    currencyCode: string;
    currencyId: string;
  } | null;
  totalNotional: {
    amount: string;
    currencyCode: string;
    currencyId: string;
  } | null;
  executedNotional: {
    amount: string;
    currencyCode: string;
    currencyId: string;
  } | null;
}

export interface RobinhoodCryptoHolding {
  id: string;
  accountId: string;
  costBasis: string;
  currency: {
    code: string;
    id: string;
    increment: string;
    name: string;
    type: string;
  };
  quantity: string;
  quantityAvailable: string;
  quantityHeldForBuy: string;
  quantityHeldForSell: string;
  createdAt: string;
  updatedAt: string;
}

export interface RobinhoodCryptoQuote {
  askPrice: string;
  bidPrice: string;
  markPrice: string;
  highPrice: string;
  lowPrice: string;
  openPrice: string;
  symbol: string;
  id: string;
  volume: string;
}

export interface RobinhoodPortfolio {
  url: string;
  account: string;
  startDate: string;
  market_value: string;
  equity: string;
  extendedHoursEquity: string;
  extendedHoursMarketValue: string;
  lastCoreEquity: string;
  lastCoreMarketValue: string;
  excessMaintenance: string;
  excessMaintenanceWithUnclearedDeposits: string;
  excessMargin: string;
  excessMarginWithUnclearedDeposits: string;
  withdrawableAmount: string;
  unclearedDeposits: string;
  unsettledFunds: string;
}

export interface RobinhoodHistoricals {
  quote: string;
  symbol: string;
  interval: string;
  span: string;
  bounds: string;
  previousClose: string | null;
  previousCloseDate: string | null;
  openPrice: string | null;
  openTime: string | null;
  instrument: string;
  instrumentId: string;
  historicals: Array<{
    beginsAt: string;
    openPrice: string;
    closePrice: string;
    highPrice: string;
    lowPrice: string;
    volume: number;
    session: string;
    interpolated: boolean;
  }>;
}

export interface RobinhoodWatchlist {
  url: string;
  user: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface RobinhoodDividend {
  id: string;
  url: string;
  account: string;
  instrument: string;
  amount: string;
  rate: string;
  position: string;
  withholding: string;
  recordDate: string;
  payableDate: string;
  paidAt: string | null;
  state: string;
  nafWithholding: string;
  drip: boolean;
}

export interface ApiResponse<T> {
  results?: T[];
  next?: string | null;
  previous?: string | null;
  count?: number;
}