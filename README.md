# @cygnus-wealth/robinhood-integration

A TypeScript library for integrating with Robinhood's API to fetch portfolio data with standardized outputs compatible with @cygnus-wealth/data-models interfaces.

## Overview

This library provides a clean, type-safe interface for accessing Robinhood portfolio data. It handles authentication, API requests, and data transformation to standardized models for seamless integration with the CygnusWealth platform.

## Features

- **Read-only Access**: Secure, read-only integration with Robinhood accounts
- **Standardized Data Models**: Outputs conform to @cygnus-wealth/data-models interfaces
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Error Handling**: Robust error handling with standardized error responses
- **Data Mapping**: Automatic conversion from Robinhood's API format to standardized models
- **Portfolio Management**: Access to positions, balances, quotes, transactions, and more
- **Historical Data**: Fetch historical price data for analysis
- **Real-time Quotes**: Get current market prices and quote information

## Installation

```bash
npm install @cygnus-wealth/robinhood-integration
```

## Usage

### Basic Setup

```typescript
import { RobinhoodService } from '@cygnus-wealth/robinhood-integration';

const robinhood = new RobinhoodService({
  timeout: 30000,
  retryAttempts: 3,
});
```

### Authentication

```typescript
// Authenticate with credentials
await robinhood.authenticate({
  username: 'your-username',
  password: 'your-password',
  mfaCode: '123456', // Optional: for MFA
});

// Check authentication status
if (robinhood.isAuthenticated()) {
  console.log('Successfully authenticated');
}
```

### Fetching Portfolio Data

```typescript
// Get complete portfolio overview
const portfolio = await robinhood.getPortfolio();
console.log(`Total Value: $${portfolio.totalValue}`);
console.log(`Day Change: ${portfolio.dayChangePercent}%`);

// Get all positions
const positions = await robinhood.getPositions();
positions.forEach(position => {
  console.log(`${position.symbol}: ${position.quantity} shares @ $${position.currentPrice}`);
});

// Get specific position
const position = await robinhood.getPosition('AAPL');
if (position) {
  console.log(`AAPL Market Value: $${position.marketValue}`);
}
```

### Account Information

```typescript
// Get account details
const accounts = await robinhood.getAccounts();
accounts.forEach(account => {
  console.log(`Account ${account.accountNumber}: ${account.type}`);
});

// Get account balance
const balance = await robinhood.getBalance();
console.log(`Cash Balance: $${balance.cashBalance}`);
console.log(`Buying Power: $${balance.buyingPower}`);
```

### Market Data

```typescript
// Get single quote
const quote = await robinhood.getQuote('TSLA');
console.log(`TSLA Price: $${quote.price}`);
console.log(`Change: ${quote.changePercent}%`);

// Get multiple quotes
const quotes = await robinhood.getQuotes(['AAPL', 'GOOGL', 'MSFT']);
quotes.forEach(quote => {
  console.log(`${quote.symbol}: $${quote.price}`);
});

// Get historical data
const historicals = await robinhood.getHistoricalData('SPY', 'day', 'month');
historicals.data.forEach(point => {
  console.log(`${point.timestamp}: $${point.close}`);
});
```

### Transaction History

```typescript
// Get recent transactions
const transactions = await robinhood.getTransactions(50);
transactions.forEach(tx => {
  console.log(`${tx.type} ${tx.quantity} ${tx.symbol} @ $${tx.price}`);
});

// Get dividends
const dividends = await robinhood.getDividends();
dividends.forEach(div => {
  console.log(`${div.symbol}: $${div.amount} on ${div.paymentDate}`);
});
```

### Watchlists

```typescript
// Get all watchlists
const watchlists = await robinhood.getWatchlists();
watchlists.forEach(list => {
  console.log(`${list.name}: ${list.symbols.join(', ')}`);
});
```

## API Reference

### RobinhoodService

The main service class for interacting with Robinhood.

#### Methods

- `authenticate(credentials: RobinhoodCredentials): Promise<void>`
- `refreshToken(): Promise<void>`
- `isAuthenticated(): boolean`
- `getPortfolio(): Promise<StandardizedPortfolio>`
- `getPositions(): Promise<StandardizedPosition[]>`
- `getPosition(symbol: string): Promise<StandardizedPosition | null>`
- `getAccounts(): Promise<StandardizedAccount[]>`
- `getBalance(): Promise<StandardizedBalance>`
- `getQuote(symbol: string): Promise<StandardizedQuote>`
- `getQuotes(symbols: string[]): Promise<StandardizedQuote[]>`
- `getTransactions(limit?: number): Promise<StandardizedTransaction[]>`
- `getHistoricalData(symbol: string, interval?: string, span?: string): Promise<StandardizedHistoricalData>`
- `getWatchlists(): Promise<StandardizedWatchlist[]>`
- `getDividends(): Promise<StandardizedDividend[]>`

## Data Models

All output data conforms to standardized interfaces for easy integration:

- `StandardizedPortfolio`: Complete portfolio overview
- `StandardizedPosition`: Individual position details
- `StandardizedTransaction`: Transaction/order information
- `StandardizedBalance`: Account balance details
- `StandardizedQuote`: Market quote data
- `StandardizedHistoricalData`: Historical price data
- `StandardizedAccount`: Account information
- `StandardizedWatchlist`: Watchlist data
- `StandardizedDividend`: Dividend payment information

## Error Handling

The library provides standardized error responses:

```typescript
try {
  const portfolio = await robinhood.getPortfolio();
} catch (error) {
  if (error.code === 'AUTH_FAILED') {
    // Handle authentication failure
  } else if (error.code === 'PORTFOLIO_FETCH_FAILED') {
    // Handle portfolio fetch failure
  }
  console.error(`Error: ${error.message}`);
}
```

## Security Considerations

- **Client-side Only**: This library is designed for client-side use in the CygnusWealth dApp
- **No Private Keys**: Never handles private keys or transaction signing
- **Read-only Access**: Only provides read access to account data
- **Token Management**: Handles token refresh automatically
- **Secure Storage**: Tokens should be encrypted when stored locally

## Development

```bash
# Install dependencies
npm install

# Build the library
npm run build

# Run tests
npm test

# Run linting
npm run lint

# Type checking
npm run typecheck
```

## Suggestions for @cygnus-wealth/data-models

Based on the Robinhood integration implementation, here are some suggestions for the data-models library:

1. **Additional Asset Types**: Consider adding support for options and forex in the position types
2. **Extended Quote Data**: Add fields for extended hours trading, market cap, P/E ratio, and dividend yield
3. **Order Types**: Expand transaction types to include limit orders, stop orders, and options transactions
4. **Crypto Support**: Add specific interfaces for cryptocurrency holdings and quotes
5. **Tax Information**: Consider adding interfaces for tax lots and cost basis information
6. **Performance Metrics**: Add interfaces for performance calculations (Sharpe ratio, alpha, beta)
7. **Notifications**: Standardized interface for price alerts and account notifications

## Contributing

Contributions are welcome! Please follow the existing code style and add tests for new features.

## License

MIT

## Support

For issues and feature requests, please use the GitHub issue tracker.
