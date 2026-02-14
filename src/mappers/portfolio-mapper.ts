import {
  RobinhoodAccount,
  RobinhoodPortfolio,
  RobinhoodPosition,
  RobinhoodInstrument,
  RobinhoodQuote,
  RobinhoodOrder,
  RobinhoodDividend,
  RobinhoodHistoricals,
  RobinhoodWatchlist,
} from '../types';

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
  HistoricalDataPoint,
} from '../models/standardized';

export class PortfolioMapper {
  static mapAccount(account: RobinhoodAccount): StandardizedAccount {
    return {
      id: account.url,
      accountNumber: account.accountNumber,
      type: account.type as any,
      status: 'active',
      openedDate: new Date(account.created),
      isPrimary: true,
      tradingPermissions: {
        stocks: true,
        options: true,
        crypto: true,
        forex: false,
      },
      marginEnabled: account.type === 'margin',
      optionsLevel: 0,
      dayTradeCount: 0,
      metadata: {
        source: 'robinhood',
        url: account.url,
        lastUpdated: new Date(account.updated),
      },
    };
  }

  static mapPortfolio(
    account: RobinhoodAccount,
    portfolio: RobinhoodPortfolio,
    positions: StandardizedPosition[]
  ): StandardizedPortfolio {
    const totalValue = parseFloat(portfolio.market_value || '0');
    const equity = parseFloat(portfolio.equity || '0');
    const previousEquity = parseFloat(portfolio.lastCoreEquity || '0');
    const dayChange = equity - previousEquity;
    const dayChangePercent = previousEquity !== 0 ? (dayChange / previousEquity) * 100 : 0;

    const totalPositionValue = positions.reduce((sum, p) => sum + p.marketValue, 0);
    const stockValue = positions
      .filter((p) => p.assetType === 'stock' || p.assetType === 'etf')
      .reduce((sum, p) => sum + p.marketValue, 0);
    const cryptoValue = positions
      .filter((p) => p.assetType === 'crypto')
      .reduce((sum, p) => sum + p.marketValue, 0);

    const stockPercent =
      totalPositionValue > 0
        ? (stockValue / totalPositionValue) * 100
        : positions.length > 0
          ? 100
          : 0;
    const cryptoPercent =
      totalPositionValue > 0 ? (cryptoValue / totalPositionValue) * 100 : 0;

    return {
      id: account.accountNumber,
      accountId: account.accountNumber,
      accountNumber: account.accountNumber,
      accountType: account.type === 'margin' ? 'margin' : 'cash',
      totalValue,
      cashBalance: parseFloat(account.cashBalances?.cash || '0'),
      buyingPower: parseFloat(account.buyingPower || '0'),
      dayChange,
      dayChangePercent,
      totalGainLoss: 0,
      totalGainLossPercent: 0,
      positions,
      performance: {
        totalReturn: 0,
        totalReturnPercent: 0,
        dayReturn: dayChange,
        dayReturnPercent: dayChangePercent,
      },
      allocation: {
        stocks: Math.round(stockPercent),
        bonds: 0,
        cash: 0,
        crypto: Math.round(cryptoPercent),
        other: 0,
      },
      currency: 'USD',
      lastUpdated: new Date(),
      metadata: {
        source: 'robinhood',
        lastUpdated: new Date(),
        currency: 'USD',
      },
    };
  }

  static mapPosition(
    position: RobinhoodPosition,
    instrument?: RobinhoodInstrument,
    quote?: RobinhoodQuote
  ): StandardizedPosition {
    const quantity = parseFloat(position.quantity || '0');
    const averagePrice = parseFloat(position.averageBuyPrice || '0');
    const currentPrice = parseFloat(quote?.lastTradePrice || '0');
    const marketValue = quantity * currentPrice;
    const costBasis = quantity * averagePrice;
    const unrealizedGain = marketValue - costBasis;
    const unrealizedGainPercent = costBasis !== 0 ? (unrealizedGain / costBasis) * 100 : 0;

    const previousClose = parseFloat(quote?.previousClose || '0');
    const dayChange = currentPrice - previousClose;
    const dayChangePercent = previousClose !== 0 ? (dayChange / previousClose) * 100 : 0;

    return {
      id: position.url,
      symbol: instrument?.symbol || 'UNKNOWN',
      name: instrument?.name || 'Unknown Instrument',
      quantity,
      averagePrice,
      currentPrice,
      marketValue,
      costBasis,
      unrealizedGain,
      unrealizedGainPercent,
      realizedGain: 0,
      dayChange: dayChange * quantity,
      dayChangePercent,
      assetType: instrument?.type === 'stock' ? 'stock' : instrument?.type || 'stock',
      currency: 'USD',
      exchange: instrument?.market,
      lastUpdated: new Date(position.updatedAt),
      metadata: {
        instrumentId: instrument?.id,
        instrumentUrl: instrument?.url,
        positionUrl: position.url,
      },
    };
  }

  static mapBalance(account: RobinhoodAccount): StandardizedBalance {
    return {
      accountId: account.accountNumber,
      totalValue: 0,
      cashBalance: parseFloat(account.cashBalances?.cash || '0'),
      marginBalance: 0,
      unsettledCash: parseFloat(account.cashBalances?.unsettledFunds || '0'),
      withdrawableCash: parseFloat(account.cashBalances?.cash || '0'),
      buyingPower: parseFloat(account.buyingPower || '0'),
      dayTradeBuyingPower: 0,
      maintenanceRequirement: 0,
      marginCallAmount: 0,
      currency: 'USD',
      lastUpdated: new Date(),
    };
  }

  static mapQuote(quote: RobinhoodQuote, instrument?: RobinhoodInstrument): StandardizedQuote {
    const price = parseFloat(quote.lastTradePrice || '0');
    const previousClose = parseFloat(quote.previousClose || '0');
    const change = price - previousClose;
    const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;

    return {
      symbol: quote.symbol,
      name: instrument?.name || quote.symbol,
      price,
      previousClose,
      open: 0,
      dayHigh: 0,
      dayLow: 0,
      volume: 0,
      marketCap: instrument?.marketCap ? parseFloat(instrument.marketCap) : 0,
      peRatio: 0,
      dividendYield: 0,
      fiftyTwoWeekHigh: 0,
      fiftyTwoWeekLow: 0,
      change,
      changePercent,
      bid: parseFloat(quote.bidPrice || '0'),
      ask: parseFloat(quote.askPrice || '0'),
      bidSize: quote.bidSize,
      askSize: quote.askSize,
      lastTradeTime: new Date(quote.updatedAt),
      exchange: instrument?.market,
      currency: 'USD',
      isMarketOpen: !quote.tradingHalted,
      extendedHoursPrice: quote.lastExtendedHoursTradePrice
        ? parseFloat(quote.lastExtendedHoursTradePrice)
        : undefined,
      metadata: {
        instrumentUrl: quote.instrument,
        source: quote.lastTradePriceSource,
      },
    };
  }

  static mapTransaction(
    order: RobinhoodOrder,
    instrument?: RobinhoodInstrument
  ): StandardizedTransaction {
    const type = order.side === 'buy' ? 'buy' : 'sell';
    const quantity = parseFloat(order.quantity || '0');
    const price = parseFloat(order.averagePrice || order.price || '0');
    const amount = quantity * price;
    const accountId = order.account?.split('/').slice(-2, -1)[0];

    return {
      id: order.id,
      accountId,
      type,
      symbol: instrument?.symbol || (order as any).symbol || 'UNKNOWN',
      name: instrument?.name || 'Unknown',
      quantity,
      price,
      amount,
      fees: parseFloat(order.fees || '0'),
      currency: 'USD',
      status: this.mapOrderStatus(order.state),
      orderType: order.type,
      executedAt: (order as any).executedAt ? new Date((order as any).executedAt) : undefined,
      createdAt: (order as any).createdAt
        ? new Date((order as any).createdAt)
        : order.created
          ? new Date(order.created)
          : undefined,
      updatedAt: (order as any).updatedAt
        ? new Date((order as any).updatedAt)
        : order.updated
          ? new Date(order.updated)
          : undefined,
      metadata: {
        orderId: order.id,
        orderUrl: order.url,
        instrumentUrl: order.instrument,
      },
    };
  }

  static mapHistoricalData(historicals: RobinhoodHistoricals): StandardizedHistoricalData {
    const data: HistoricalDataPoint[] = historicals.historicals.map((point) => ({
      timestamp: new Date(point.beginsAt),
      open: 0,
      high: 0,
      low: 0,
      close: parseFloat(point.closePrice),
      volume: point.volume,
      adjustedClose: parseFloat(point.closePrice),
    }));

    const interval = this.mapInterval(historicals.interval);

    return {
      symbol: historicals.symbol,
      interval,
      data,
      metadata: {
        span: historicals.span,
        bounds: historicals.bounds,
      },
    };
  }

  static mapWatchlist(watchlist: RobinhoodWatchlist, symbols: string[]): StandardizedWatchlist {
    return {
      id: watchlist.url,
      name: watchlist.name,
      symbols,
      createdAt: watchlist.createdAt ? new Date(watchlist.createdAt) : new Date(),
      updatedAt: watchlist.updatedAt ? new Date(watchlist.updatedAt) : new Date(),
      metadata: {
        url: watchlist.url,
      },
    };
  }

  static mapDividend(
    dividend: RobinhoodDividend,
    instrument?: RobinhoodInstrument
  ): StandardizedDividend {
    const amount = parseFloat(dividend.amount);
    const taxWithheld = parseFloat(dividend.withholding || '0');
    const netAmount = amount - taxWithheld;
    const accountId = dividend.account?.split('/').slice(-2, -1)[0];

    return {
      id: dividend.id,
      accountId,
      symbol: instrument?.symbol || 'UNKNOWN',
      name: instrument?.name || 'Unknown',
      amount,
      rate: parseFloat(dividend.rate),
      shares: parseFloat(dividend.position),
      grossAmount: amount,
      taxWithheld,
      netAmount,
      currency: 'USD',
      status: dividend.state === 'paid' ? 'paid' : 'pending',
      exDate: new Date(dividend.recordDate),
      paymentDate: new Date(dividend.payableDate),
      recordDate: new Date(dividend.recordDate),
      declaredDate: new Date(dividend.recordDate),
      metadata: {
        dividendId: dividend.id,
        dividendUrl: dividend.url,
        instrumentUrl: dividend.instrument,
      },
    };
  }

  private static mapOrderStatus(state: string): StandardizedTransaction['status'] {
    switch (state) {
      case 'filled':
      case 'executed':
        return 'completed';
      case 'cancelled':
      case 'canceled':
        return 'cancelled';
      case 'failed':
      case 'rejected':
        return 'failed';
      case 'pending':
      case 'queued':
      case 'confirmed':
      case 'partially_filled':
        return 'pending';
      default:
        return 'pending';
    }
  }

  private static mapInterval(interval: string): string {
    switch (interval) {
      case '5minute':
      case '10minute':
      case '15minute':
      case '30minute':
        return 'minute';
      case 'hour':
        return 'hour';
      case 'day':
        return 'day';
      case 'week':
        return 'week';
      case 'month':
        return 'month';
      default:
        return 'day';
    }
  }
}
