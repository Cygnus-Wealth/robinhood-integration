import { RobinhoodService } from '../src';

async function main() {
  const robinhood = new RobinhoodService({
    timeout: 30000,
    retryAttempts: 3,
  });

  try {
    console.log('🔐 Authenticating with Robinhood...');
    await robinhood.authenticate({
      username: process.env.ROBINHOOD_USERNAME!,
      password: process.env.ROBINHOOD_PASSWORD!,
    });

    console.log('✅ Authentication successful!\n');

    console.log('📊 Fetching Portfolio Overview...');
    const portfolio = await robinhood.getPortfolio();
    console.log(`Total Value: $${portfolio.totalValue.toFixed(2)}`);
    console.log(`Cash Balance: $${portfolio.cashBalance.toFixed(2)}`);
    console.log(`Buying Power: $${portfolio.buyingPower.toFixed(2)}`);
    console.log(`Day Change: ${portfolio.dayChangePercent > 0 ? '+' : ''}${portfolio.dayChangePercent.toFixed(2)}%`);
    console.log(`Number of Positions: ${portfolio.positions.length}\n`);

    console.log('📈 Top Positions:');
    const topPositions = portfolio.positions
      .sort((a, b) => b.marketValue - a.marketValue)
      .slice(0, 5);

    topPositions.forEach((position, index) => {
      console.log(`${index + 1}. ${position.symbol}`);
      console.log(`   Shares: ${position.quantity}`);
      console.log(`   Value: $${position.marketValue.toFixed(2)}`);
      console.log(`   Gain/Loss: ${position.totalGainLossPercent > 0 ? '+' : ''}${position.totalGainLossPercent.toFixed(2)}%`);
      console.log(`   Day Change: ${position.dayChangePercent > 0 ? '+' : ''}${position.dayChangePercent.toFixed(2)}%\n`);
    });

    console.log('💰 Account Balances:');
    const balance = await robinhood.getBalance();
    console.log(`Cash: $${balance.cashBalance.toFixed(2)}`);
    console.log(`Unsettled Cash: $${balance.unsettledCash.toFixed(2)}`);
    console.log(`Buying Power: $${balance.buyingPower.toFixed(2)}`);
    console.log(`Pending Deposits: $${balance.pendingDeposits.toFixed(2)}\n`);

    console.log('📰 Recent Transactions:');
    const transactions = await robinhood.getTransactions(5);
    transactions.forEach(tx => {
      const action = tx.type === 'buy' ? '🟢 BUY' : '🔴 SELL';
      console.log(`${action} ${tx.quantity} ${tx.symbol} @ $${tx.price?.toFixed(2)} - ${tx.status}`);
      console.log(`   Date: ${tx.date.toLocaleDateString()}`);
      console.log(`   Total: $${tx.amount.toFixed(2)}\n`);
    });

    console.log('📊 Market Quotes:');
    const watchlistSymbols = ['SPY', 'QQQ', 'AAPL', 'TSLA'];
    const quotes = await robinhood.getQuotes(watchlistSymbols);
    quotes.forEach(quote => {
      const changeIcon = quote.changePercent > 0 ? '📈' : '📉';
      console.log(`${changeIcon} ${quote.symbol}: $${quote.price.toFixed(2)} (${quote.changePercent > 0 ? '+' : ''}${quote.changePercent.toFixed(2)}%)`);
    });

    console.log('\n💸 Recent Dividends:');
    const dividends = await robinhood.getDividends();
    const recentDividends = dividends.slice(0, 5);
    if (recentDividends.length > 0) {
      recentDividends.forEach(div => {
        console.log(`${div.symbol}: $${div.amount.toFixed(2)}`);
        console.log(`   Payment Date: ${div.paymentDate.toLocaleDateString()}`);
        console.log(`   Status: ${div.status}\n`);
      });
    } else {
      console.log('No recent dividends\n');
    }

  } catch (error: any) {
    if (error.code === 'MFA_REQUIRED') {
      console.error('❌ Multi-factor authentication required. Please provide MFA code.');
    } else if (error.code === 'AUTH_FAILED') {
      console.error('❌ Authentication failed. Please check your credentials.');
    } else {
      console.error('❌ Error:', error.message);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}