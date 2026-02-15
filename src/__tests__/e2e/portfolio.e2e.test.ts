import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { RobinhoodService } from '../../services/robinhood-service';
import fixtures from './fixtures/portfolio-responses.json';

/**
 * E2E tests using recorded API responses.
 *
 * These tests exercise the full stack: RobinhoodService → RobinhoodAPI → RobinhoodClient.
 * Only the HTTP transport (axios) is mocked — every layer above runs real production code.
 * Fixture data in ./fixtures/ captures realistic Robinhood API response shapes.
 */

vi.mock('axios');

let mockAxiosInstance: any;

function setupAxiosMock() {
  mockAxiosInstance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    request: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  };

  (axios.create as any) = vi.fn().mockReturnValue(mockAxiosInstance);
  (axios.isAxiosError as any) = vi.fn((err: any) => err?.isAxiosError === true);
}

function axiosResponse(data: any, status = 200) {
  return { data, status, statusText: 'OK', headers: {}, config: {} };
}

function axiosError(status: number, data: any) {
  const err: any = new Error(`Request failed with status code ${status}`);
  err.isAxiosError = true;
  err.response = { status, data, statusText: '', headers: {}, config: {} };
  err.config = {};
  return err;
}

describe('E2E: Portfolio fetch with recorded responses', () => {
  let service: RobinhoodService;

  beforeEach(() => {
    setupAxiosMock();
    service = new RobinhoodService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should authenticate and fetch a complete portfolio with positions', async () => {
    const f = fixtures;

    // 1. Auth call
    mockAxiosInstance.post.mockResolvedValueOnce(
      axiosResponse(f.auth.login.response)
    );

    await service.authenticate({ username: 'user@test.com', password: 'pass123' });
    expect(service.isAuthenticated()).toBe(true);

    // 2. getPortfolio calls: getAccounts (paginate→get), getPortfolio (get), getPositions (paginate→get)
    //    then for each position: getInstrumentFromUrl (get), getQuote (get)
    mockAxiosInstance.get
      // getAccounts paginate
      .mockResolvedValueOnce(axiosResponse(f.accounts.list.response))
      // getPortfolio
      .mockResolvedValueOnce(axiosResponse(f.portfolio.detail.response))
      // getPositions paginate
      .mockResolvedValueOnce(axiosResponse(f.positions.list.response))
      // Position 1 (AAPL): instrument, quote
      .mockResolvedValueOnce(axiosResponse(f.instruments.AAPL.response))
      .mockResolvedValueOnce(axiosResponse(f.quotes.AAPL.response))
      // Position 2 (MSFT): instrument, quote
      .mockResolvedValueOnce(axiosResponse(f.instruments.MSFT.response))
      .mockResolvedValueOnce(axiosResponse(f.quotes.MSFT.response))
      // Position 3 (TSLA): instrument, quote
      .mockResolvedValueOnce(axiosResponse(f.instruments.TSLA.response))
      .mockResolvedValueOnce(axiosResponse(f.quotes.TSLA.response));

    const portfolio = await service.getPortfolio();

    // Verify portfolio structure
    expect(portfolio).toBeDefined();
    expect(portfolio.accountNumber).toBe('REC-ACCT-001');
    expect(portfolio.positions).toHaveLength(3);
    expect(portfolio.currency).toBe('USD');
    expect(portfolio.metadata.source).toBe('robinhood');

    // Verify position data was correctly transformed
    const aapl = portfolio.positions.find(p => p.symbol === 'AAPL');
    expect(aapl).toBeDefined();
    expect(aapl!.quantity).toBe(50);
    expect(aapl!.averagePrice).toBe(142.5);
    expect(aapl!.currentPrice).toBe(192.35);
    expect(aapl!.marketValue).toBeCloseTo(50 * 192.35, 2);
    expect(aapl!.costBasis).toBeCloseTo(50 * 142.5, 2);
    expect(aapl!.unrealizedGain).toBeCloseTo(50 * (192.35 - 142.5), 2);

    const msft = portfolio.positions.find(p => p.symbol === 'MSFT');
    expect(msft).toBeDefined();
    expect(msft!.quantity).toBe(25);
    expect(msft!.currentPrice).toBe(444.85);

    const tsla = portfolio.positions.find(p => p.symbol === 'TSLA');
    expect(tsla).toBeDefined();
    expect(tsla!.quantity).toBe(30);
    expect(tsla!.currentPrice).toBe(181.75);
  });

  it('should return correct total portfolio value from recorded data', async () => {
    const f = fixtures;

    mockAxiosInstance.post.mockResolvedValueOnce(axiosResponse(f.auth.login.response));
    await service.authenticate({ username: 'u', password: 'p' });

    mockAxiosInstance.get
      .mockResolvedValueOnce(axiosResponse(f.accounts.list.response))
      .mockResolvedValueOnce(axiosResponse(f.portfolio.detail.response))
      .mockResolvedValueOnce(axiosResponse(f.positions.list.response))
      .mockResolvedValueOnce(axiosResponse(f.instruments.AAPL.response))
      .mockResolvedValueOnce(axiosResponse(f.quotes.AAPL.response))
      .mockResolvedValueOnce(axiosResponse(f.instruments.MSFT.response))
      .mockResolvedValueOnce(axiosResponse(f.quotes.MSFT.response))
      .mockResolvedValueOnce(axiosResponse(f.instruments.TSLA.response))
      .mockResolvedValueOnce(axiosResponse(f.quotes.TSLA.response));

    const portfolio = await service.getPortfolio();

    // Total value comes from portfolio.market_value in the API response
    expect(portfolio.totalValue).toBe(87432.18);
    expect(portfolio.cashBalance).toBe(12500);
    expect(portfolio.buyingPower).toBe(25432.18);
  });
});

describe('E2E: Holdings transformation', () => {
  let service: RobinhoodService;

  beforeEach(() => {
    setupAxiosMock();
    service = new RobinhoodService();
    // Pre-authenticate
    mockAxiosInstance.post.mockResolvedValueOnce(axiosResponse(fixtures.auth.login.response));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should correctly transform all position fields from recorded API data', async () => {
    await service.authenticate({ username: 'u', password: 'p' });

    mockAxiosInstance.get
      .mockResolvedValueOnce(axiosResponse(fixtures.positions.list.response))
      .mockResolvedValueOnce(axiosResponse(fixtures.instruments.AAPL.response))
      .mockResolvedValueOnce(axiosResponse(fixtures.quotes.AAPL.response))
      .mockResolvedValueOnce(axiosResponse(fixtures.instruments.MSFT.response))
      .mockResolvedValueOnce(axiosResponse(fixtures.quotes.MSFT.response))
      .mockResolvedValueOnce(axiosResponse(fixtures.instruments.TSLA.response))
      .mockResolvedValueOnce(axiosResponse(fixtures.quotes.TSLA.response));

    const positions = await service.getPositions();

    expect(positions).toHaveLength(3);

    // AAPL: 50 shares @ $142.50, current $192.35
    const aapl = positions.find(p => p.symbol === 'AAPL')!;
    expect(aapl.name).toBe('Apple Inc.');
    expect(aapl.quantity).toBe(50);
    expect(aapl.averagePrice).toBe(142.5);
    expect(aapl.currentPrice).toBe(192.35);
    expect(aapl.marketValue).toBeCloseTo(9617.5, 2);
    expect(aapl.costBasis).toBeCloseTo(7125, 2);
    expect(aapl.unrealizedGain).toBeCloseTo(2492.5, 2);
    expect(aapl.assetType).toBe('stock');
    expect(aapl.currency).toBe('USD');

    // MSFT: 25 shares @ $320, current $444.85
    const msft = positions.find(p => p.symbol === 'MSFT')!;
    expect(msft.name).toBe('Microsoft Corporation');
    expect(msft.quantity).toBe(25);
    expect(msft.averagePrice).toBe(320);
    expect(msft.currentPrice).toBe(444.85);
    expect(msft.marketValue).toBeCloseTo(11121.25, 2);
    expect(msft.costBasis).toBeCloseTo(8000, 2);
    expect(msft.unrealizedGain).toBeCloseTo(3121.25, 2);

    // TSLA: 30 shares @ $195, current $181.75 (losing position)
    const tsla = positions.find(p => p.symbol === 'TSLA')!;
    expect(tsla.name).toBe('Tesla, Inc.');
    expect(tsla.quantity).toBe(30);
    expect(tsla.currentPrice).toBe(181.75);
    expect(tsla.unrealizedGain).toBeCloseTo(30 * (181.75 - 195), 2);
    expect(tsla.unrealizedGain).toBeLessThan(0);
  });

  it('should fetch a single position by symbol', async () => {
    await service.authenticate({ username: 'u', password: 'p' });

    mockAxiosInstance.get
      // paginate positions
      .mockResolvedValueOnce(axiosResponse(fixtures.positions.list.response))
      // getInstrumentBySymbol returns API response with results array
      .mockResolvedValueOnce(axiosResponse({ results: [fixtures.instruments.AAPL.response] }))
      // getQuote
      .mockResolvedValueOnce(axiosResponse(fixtures.quotes.AAPL.response));

    const position = await service.getPosition('AAPL');
    expect(position).not.toBeNull();
    expect(position!.symbol).toBe('AAPL');
    expect(position!.quantity).toBe(50);
    expect(position!.currentPrice).toBe(192.35);
  });

  it('should return null for a position that does not exist', async () => {
    await service.authenticate({ username: 'u', password: 'p' });

    mockAxiosInstance.get
      .mockResolvedValueOnce(axiosResponse(fixtures.positions.list.response))
      .mockResolvedValueOnce(axiosResponse({ results: [{ ...fixtures.instruments.AAPL.response, url: 'https://api.robinhood.com/instruments/INST-NOPE/', symbol: 'NOPE' }] }));

    const position = await service.getPosition('NOPE');
    expect(position).toBeNull();
  });
});

describe('E2E: Auth failure handling', () => {
  let service: RobinhoodService;

  beforeEach(() => {
    setupAxiosMock();
    service = new RobinhoodService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should throw standardized error on invalid credentials', async () => {
    mockAxiosInstance.post.mockRejectedValueOnce(
      axiosError(401, fixtures.auth.loginFailure.response)
    );

    try {
      await service.authenticate({ username: 'bad', password: 'wrong' });
      expect.unreachable('Should have thrown');
    } catch (err: any) {
      expect(err.code).toBe('AUTH_FAILED');
      expect(err.message).toBe('Authentication failed');
      expect(err.source).toBe('robinhood');
      expect(err.timestamp).toBeInstanceOf(Date);
    }
  });

  it('should throw MFA_REQUIRED error when MFA is needed', async () => {
    const mfaErr = axiosError(400, fixtures.auth.loginMfaRequired.response);
    mockAxiosInstance.post.mockRejectedValueOnce(mfaErr);

    try {
      await service.authenticate({ username: 'user', password: 'pass' });
      expect.unreachable('Should have thrown');
    } catch (err: any) {
      expect(err.code).toBe('MFA_REQUIRED');
      expect(err.message).toBe('Multi-factor authentication required');
      expect(err.source).toBe('robinhood');
    }
  });

  it('should report unauthenticated state before login', () => {
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should throw standardized error when fetching portfolio without auth', async () => {
    mockAxiosInstance.get.mockRejectedValueOnce(
      axiosError(401, { detail: 'Authentication credentials were not provided.' })
    );

    try {
      await service.getPortfolio();
      expect.unreachable('Should have thrown');
    } catch (err: any) {
      expect(err.code).toBe('PORTFOLIO_FETCH_FAILED');
      expect(err.source).toBe('robinhood');
    }
  });
});

describe('E2E: Rate limit handling', () => {
  let service: RobinhoodService;

  beforeEach(() => {
    setupAxiosMock();
    service = new RobinhoodService();
    mockAxiosInstance.post.mockResolvedValueOnce(axiosResponse(fixtures.auth.login.response));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should propagate rate limit errors as standardized errors', async () => {
    await service.authenticate({ username: 'u', password: 'p' });

    mockAxiosInstance.get.mockRejectedValueOnce(
      axiosError(429, fixtures.rateLimited.response)
    );

    try {
      await service.getAccounts();
      expect.unreachable('Should have thrown');
    } catch (err: any) {
      expect(err.code).toBe('ACCOUNTS_FETCH_FAILED');
      expect(err.source).toBe('robinhood');
      expect(err.timestamp).toBeInstanceOf(Date);
    }
  });

  it('should propagate rate limit on portfolio fetch', async () => {
    await service.authenticate({ username: 'u', password: 'p' });

    mockAxiosInstance.get.mockRejectedValueOnce(
      axiosError(429, fixtures.rateLimited.response)
    );

    try {
      await service.getPortfolio();
      expect.unreachable('Should have thrown');
    } catch (err: any) {
      expect(err.code).toBe('PORTFOLIO_FETCH_FAILED');
      expect(err.source).toBe('robinhood');
    }
  });
});

describe('E2E: Partial data response', () => {
  let service: RobinhoodService;

  beforeEach(() => {
    setupAxiosMock();
    service = new RobinhoodService();
    mockAxiosInstance.post.mockResolvedValueOnce(axiosResponse(fixtures.auth.login.response));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return positions that succeed and skip ones where instrument fetch fails', async () => {
    await service.authenticate({ username: 'u', password: 'p' });

    // Two positions: AAPL (succeeds) and DELIST (instrument 404)
    mockAxiosInstance.get
      .mockResolvedValueOnce(axiosResponse(fixtures.partialPositions.list.response))
      // AAPL instrument + quote: success
      .mockResolvedValueOnce(axiosResponse(fixtures.instruments.AAPL.response))
      .mockResolvedValueOnce(axiosResponse(fixtures.quotes.AAPL.response))
      // DELIST instrument: 404
      .mockRejectedValueOnce(axiosError(404, { detail: 'Not found.' }));

    const positions = await service.getPositions();

    // Should have only the successful position
    expect(positions).toHaveLength(1);
    expect(positions[0].symbol).toBe('AAPL');
    expect(positions[0].quantity).toBe(50);
  });

  it('should handle transactions with missing instrument data gracefully', async () => {
    await service.authenticate({ username: 'u', password: 'p' });

    // Orders paginate returns one order, but instrument fetch fails
    mockAxiosInstance.get
      .mockResolvedValueOnce(axiosResponse(fixtures.orders.list.response))
      .mockRejectedValueOnce(axiosError(404, { detail: 'Not found.' }));

    const transactions = await service.getTransactions();

    // Transaction should still be returned, but without instrument-enriched data
    expect(transactions).toHaveLength(1);
    expect(transactions[0].id).toBe('REC-ORD-001');
    expect(transactions[0].type).toBe('buy');
    expect(transactions[0].status).toBe('completed');
  });

  it('should handle empty positions list', async () => {
    await service.authenticate({ username: 'u', password: 'p' });

    mockAxiosInstance.get.mockResolvedValueOnce(
      axiosResponse({ results: [], next: null })
    );

    const positions = await service.getPositions();
    expect(positions).toHaveLength(0);
    expect(positions).toEqual([]);
  });
});
