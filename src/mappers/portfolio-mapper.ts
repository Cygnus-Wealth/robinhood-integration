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

    return {
      id: account.accountNumber,
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
      metadata: {
        source: 'robinhood',
        lastUpdated: new Date(),
        currency: 'USD',
      },
    };
  }

  static mapPosition(
    position: RobinhoodPosition,
    instrument: RobinhoodInstrument,
    quote?: RobinhoodQuote
  ): StandardizedPosition {
    const quantity = parseFloat(position.quantity || '0');
    const averageCost = parseFloat(position.averageBuyPrice || '0');
    const currentPrice = parseFloat(quote?.lastTradePrice || '0');
    const marketValue = quantity * currentPrice;
    const totalCost = quantity * averageCost;
    const totalGainLoss = marketValue - totalCost;
    const totalGainLossPercent = totalCost !== 0 ? (totalGainLoss / totalCost) * 100 : 0;

    const previousClose = parseFloat(quote?.previousClose || '0');
    const dayChange = currentPrice - previousClose;
    const dayChangePercent = previousClose !== 0 ? (dayChange / previousClose) * 100 : 0;

    return {
      id: position.url,
      symbol: instrument.symbol,
      name: instrument.name,
      type: instrument.type === 'stock' ? 'stock' : 'etf',
      quantity,
      averageCost,
      currentPrice,
      marketValue,
      dayChange: dayChange * quantity,
      dayChangePercent,
      totalGainLoss,
      totalGainLossPercent,
      currency: 'USD',
      exchange: instrument.market,
      metadata: {
        instrumentId: instrument.id,
        instrumentUrl: instrument.url,
        positionUrl: position.url,
        lastUpdated: new Date(position.updatedAt),
      },
    };
  }

  static mapBalance(account: RobinhoodAccount): StandardizedBalance {
    return {
      accountId: account.accountNumber,
      cashBalance: parseFloat(account.cashBalances?.cash || '0'),
      unsettledCash: parseFloat(account.cashBalances?.unsettledFunds || '0'),
      buyingPower: parseFloat(account.buyingPower || '0'),
      pendingDeposits: parseFloat(account.cashBalances?.unclearedDeposits || '0'),
      pendingWithdrawals: 0,
      currency: 'USD',
      lastUpdated: new Date(account.updated),
    };
  }

  static mapQuote(quote: RobinhoodQuote, instrument?: RobinhoodInstrument): StandardizedQuote {
    const price = parseFloat(quote.lastTradePrice || '0');
    const previousClose = parseFloat(quote.previousClose || '0');
    const change = price - previousClose;
    const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;

    return {
      symbol: quote.symbol,
      name: instrument?.name,
      price,
      previousClose,
      change,
      changePercent,
      bid: parseFloat(quote.bidPrice || '0'),
      ask: parseFloat(quote.askPrice || '0'),
      bidSize: quote.bidSize,
      askSize: quote.askSize,
      lastUpdated: new Date(quote.updatedAt),
      currency: 'USD',
      exchange: instrument?.market,
      tradingHalted: quote.tradingHalted,
    };
  }

  static mapTransaction(order: RobinhoodOrder, instrument?: RobinhoodInstrument): StandardizedTransaction {
    const type = order.side === 'buy' ? 'buy' : 'sell';
    const quantity = parseFloat(order.quantity || '0');
    const price = parseFloat(order.averagePrice || order.price || '0');
    const amount = quantity * price;

    return {
      id: order.id,
      type,
      symbol: instrument?.symbol,
      name: instrument?.name,
      quantity,
      price,
      amount,
      fee: parseFloat(order.fees || '0'),
      date: new Date(order.created),
      status: this.mapOrderStatus(order.state),
      currency: 'USD',
      metadata: {
        orderId: order.id,
        orderUrl: order.url,
        source: 'robinhood',
      },
    };
  }

  static mapHistoricalData(historicals: RobinhoodHistoricals): StandardizedHistoricalData {
    const data: HistoricalDataPoint[] = historicals.historicals.map((point) => ({
      timestamp: new Date(point.beginsAt),
      open: parseFloat(point.openPrice),
      high: parseFloat(point.highPrice),
      low: parseFloat(point.lowPrice),
      close: parseFloat(point.closePrice),
      volume: point.volume,
    }));

    const interval = this.mapInterval(historicals.interval);

    return {
      symbol: historicals.symbol,
      interval,
      data,
      metadata: {
        source: 'robinhood',
        startDate: data.length > 0 ? data[0].timestamp : new Date(),
        endDate: data.length > 0 ? data[data.length - 1].timestamp : new Date(),
        currency: 'USD',
      },
    };
  }

  static mapWatchlist(watchlist: RobinhoodWatchlist, symbols: string[]): StandardizedWatchlist {
    return {
      id: watchlist.url,
      name: watchlist.name,
      symbols,
      createdAt: new Date(watchlist.createdAt),
      updatedAt: new Date(watchlist.updatedAt),
      metadata: {
        source: 'robinhood',
        url: watchlist.url,
      },
    };
  }

  static mapDividend(dividend: RobinhoodDividend, instrument?: RobinhoodInstrument): StandardizedDividend {
    return {
      id: dividend.id,
      symbol: instrument?.symbol || '',
      amount: parseFloat(dividend.amount),
      paymentDate: new Date(dividend.payableDate),
      exDividendDate: new Date(dividend.recordDate),
      recordDate: new Date(dividend.recordDate),
      status: dividend.state === 'paid' ? 'paid' : 'pending',
      currency: 'USD',
      metadata: {
        source: 'robinhood',
        dividendId: dividend.id,
        withholding: parseFloat(dividend.withholding || '0'),
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

  private static mapInterval(interval: string): StandardizedHistoricalData['interval'] {
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