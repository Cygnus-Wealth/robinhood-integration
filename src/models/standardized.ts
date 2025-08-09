export interface StandardizedPortfolio {
  id: string;
  accountNumber: string;
  accountType: 'cash' | 'margin' | 'crypto';
  totalValue: number;
  cashBalance: number;
  buyingPower: number;
  dayChange: number;
  dayChangePercent: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  positions: StandardizedPosition[];
  metadata: {
    source: 'robinhood';
    lastUpdated: Date;
    currency: string;
  };
}

export interface StandardizedPosition {
  id: string;
  symbol: string;
  name: string;
  type: 'stock' | 'crypto' | 'option' | 'etf';
  quantity: number;
  averageCost: number;
  currentPrice: number;
  marketValue: number;
  dayChange: number;
  dayChangePercent: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  currency: string;
  exchange?: string;
  assetClass?: string;
  metadata: {
    instrumentId?: string;
    instrumentUrl?: string;
    positionUrl?: string;
    lastUpdated: Date;
  };
}

export interface StandardizedTransaction {
  id: string;
  type: 'buy' | 'sell' | 'dividend' | 'interest' | 'deposit' | 'withdrawal' | 'fee';
  symbol?: string;
  name?: string;
  quantity?: number;
  price?: number;
  amount: number;
  fee?: number;
  date: Date;
  status: 'pending' | 'completed' | 'cancelled' | 'failed';
  currency: string;
  metadata: {
    orderId?: string;
    orderUrl?: string;
    executionId?: string;
    source: 'robinhood';
  };
}

export interface StandardizedBalance {
  accountId: string;
  cashBalance: number;
  unsettledCash: number;
  buyingPower: number;
  marginBalance?: number;
  shortBalance?: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  currency: string;
  lastUpdated: Date;
}

export interface StandardizedQuote {
  symbol: string;
  name?: string;
  price: number;
  previousClose: number;
  open?: number;
  dayHigh?: number;
  dayLow?: number;
  volume?: number;
  marketCap?: number;
  peRatio?: number;
  dividendYield?: number;
  week52High?: number;
  week52Low?: number;
  change: number;
  changePercent: number;
  bid?: number;
  ask?: number;
  bidSize?: number;
  askSize?: number;
  lastUpdated: Date;
  currency: string;
  exchange?: string;
  tradingHalted?: boolean;
}

export interface StandardizedHistoricalData {
  symbol: string;
  interval: 'minute' | 'hour' | 'day' | 'week' | 'month';
  data: HistoricalDataPoint[];
  metadata: {
    source: 'robinhood';
    startDate: Date;
    endDate: Date;
    currency: string;
  };
}

export interface HistoricalDataPoint {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StandardizedWatchlist {
  id: string;
  name: string;
  symbols: string[];
  createdAt: Date;
  updatedAt: Date;
  metadata: {
    source: 'robinhood';
    url?: string;
  };
}

export interface StandardizedDividend {
  id: string;
  symbol: string;
  amount: number;
  paymentDate: Date;
  exDividendDate: Date;
  recordDate: Date;
  frequency?: 'quarterly' | 'monthly' | 'annual' | 'semi-annual';
  status: 'pending' | 'paid' | 'cancelled';
  currency: string;
  metadata: {
    source: 'robinhood';
    dividendId?: string;
    withholding?: number;
  };
}

export interface StandardizedAccount {
  id: string;
  accountNumber: string;
  type: 'individual' | 'joint' | 'ira' | 'roth_ira' | 'margin' | 'cash';
  status: 'active' | 'inactive' | 'restricted' | 'closed';
  openedDate?: Date;
  isPrimary: boolean;
  tradingPermissions: {
    stocks: boolean;
    options: boolean;
    crypto: boolean;
    forex: boolean;
  };
  marginEnabled: boolean;
  optionsLevel?: number;
  dayTradeCount?: number;
  metadata: {
    source: 'robinhood';
    url?: string;
    lastUpdated: Date;
  };
}

export interface StandardizedError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  source: 'robinhood';
}