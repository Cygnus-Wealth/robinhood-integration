export interface StandardizedPortfolio {
  id: string;
  accountId: string;
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
  performance: {
    totalReturn: number;
    totalReturnPercent: number;
    dayReturn: number;
    dayReturnPercent: number;
  };
  allocation: {
    stocks: number;
    bonds: number;
    cash: number;
    crypto: number;
    other: number;
  };
  currency: string;
  lastUpdated: Date;
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
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  marketValue: number;
  costBasis: number;
  unrealizedGain: number;
  unrealizedGainPercent: number;
  realizedGain: number;
  dayChange: number;
  dayChangePercent: number;
  assetType: string;
  currency: string;
  exchange?: string;
  lastUpdated: Date;
  metadata: {
    instrumentId?: string;
    instrumentUrl?: string;
    positionUrl?: string;
  };
}

export interface StandardizedTransaction {
  id: string;
  accountId?: string;
  type: 'buy' | 'sell' | 'dividend' | 'interest' | 'deposit' | 'withdrawal' | 'fee';
  symbol?: string;
  name?: string;
  quantity?: number;
  price?: number;
  amount: number;
  fees?: number;
  currency: string;
  status: 'pending' | 'completed' | 'cancelled' | 'failed';
  orderType?: string;
  executedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  metadata: {
    orderId?: string;
    orderUrl?: string;
    instrumentUrl?: string;
  };
}

export interface StandardizedBalance {
  accountId: string;
  totalValue: number;
  cashBalance: number;
  marginBalance: number;
  unsettledCash: number;
  withdrawableCash: number;
  buyingPower: number;
  dayTradeBuyingPower: number;
  maintenanceRequirement: number;
  marginCallAmount: number;
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
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  change: number;
  changePercent: number;
  bid?: number;
  ask?: number;
  bidSize?: number;
  askSize?: number;
  lastTradeTime: Date;
  exchange?: string;
  currency: string;
  isMarketOpen?: boolean;
  extendedHoursPrice?: number;
  metadata?: {
    instrumentUrl?: string;
    source?: string;
  };
}

export interface StandardizedHistoricalData {
  symbol: string;
  interval: string;
  data: HistoricalDataPoint[];
  metadata: {
    span?: string;
    bounds?: string;
  };
}

export interface HistoricalDataPoint {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjustedClose?: number;
}

export interface StandardizedWatchlist {
  id: string;
  name: string;
  symbols: string[];
  createdAt: Date;
  updatedAt: Date;
  metadata: {
    url?: string;
  };
}

export interface StandardizedDividend {
  id: string;
  accountId?: string;
  symbol: string;
  name?: string;
  amount: number;
  rate?: number;
  shares?: number;
  grossAmount?: number;
  taxWithheld?: number;
  netAmount?: number;
  currency: string;
  status: 'pending' | 'paid' | 'cancelled';
  exDate?: Date;
  paymentDate: Date;
  recordDate: Date;
  declaredDate?: Date;
  metadata: {
    dividendId?: string;
    dividendUrl?: string;
    instrumentUrl?: string;
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
