# Architecture: Robinhood Integration

## Overview

This library provides read-only integration with the Robinhood API, transforming raw API responses into standardized portfolio data models. It operates as an Integration Domain bounded context — strictly read-only, no transaction execution.

## Layer Architecture

```
RobinhoodService (orchestration, error standardization)
  └─ RobinhoodAPI (endpoint mapping, pagination)
       └─ RobinhoodClient (HTTP transport, auth, interceptors)
            └─ axios (network I/O)
```

- **RobinhoodService**: Public API. Orchestrates calls across API/mapper layers. All errors wrapped as `StandardizedError`.
- **RobinhoodAPI**: Maps domain operations to HTTP endpoints. Handles pagination via `client.paginate()`.
- **RobinhoodClient**: HTTP transport. Manages auth tokens, request/response interceptors, automatic 401 retry with token refresh.
- **PortfolioMapper**: Pure transformation layer. Converts Robinhood API shapes to standardized models. No side effects.

## Testing Strategy

### Unit Tests (`npm test`)

- **119 tests** across 5 test files
- Each layer tested in isolation with mocks at the boundary below
- Config: default `vitest.config.ts` (excludes `**/e2e/**`)

| File | Tests | What it covers |
|------|-------|----------------|
| `client.test.ts` | 29 | HTTP transport, auth, interceptors, pagination |
| `robinhood-api.test.ts` | 26 | Endpoint mapping, parameter construction |
| `robinhood-service.test.ts` | 36 | Orchestration, error wrapping, graceful degradation |
| `portfolio-mapper.test.ts` | 24 | Data transformation, edge cases, calculations |
| `integration.test.ts` | 4 | Service initialization, export verification |

### E2E Tests (`npm run test:e2e`)

- **14 tests** in `src/__tests__/e2e/`
- Config: `vitest.e2e.config.ts` (node env, 15s timeout)
- Exercises the **full stack** (Service → API → Client) with only axios mocked
- Uses **recorded API response fixtures** — no live API calls in CI

#### E2E Scenarios

| Priority | Scenario | Description |
|----------|----------|-------------|
| P0 | Portfolio fetch | Auth + full portfolio with 3 positions, verifies all transformations |
| P0 | Portfolio values | Validates totalValue, cashBalance, buyingPower from recorded data |
| P1 | Holdings transformation | All position fields: quantity, prices, gains, asset type |
| P1 | Single position lookup | Fetch by symbol, including not-found case |
| P1 | Auth failure | Invalid credentials → standardized AUTH_FAILED error |
| P1 | MFA required | MFA challenge → standardized MFA_REQUIRED error |
| P1 | Unauthenticated access | Portfolio fetch without auth → PORTFOLIO_FETCH_FAILED |
| P2 | Rate limiting | 429 responses propagated as standardized errors |
| P2 | Partial data | Positions with failed instrument lookups gracefully skipped |
| P2 | Missing instruments | Transactions returned even when instrument enrichment fails |
| P2 | Empty results | Empty position list handled correctly |

#### Recorded Response Fixtures

Fixtures live in `src/__tests__/e2e/fixtures/portfolio-responses.json`. They capture realistic Robinhood API response shapes including:

- Auth responses (success, failure, MFA challenge)
- Account and portfolio data
- Multi-position listings (AAPL, MSFT, TSLA)
- Instrument metadata per symbol
- Quote data per symbol
- Order history
- Rate limit (429) responses
- Partial data scenarios (delisted instruments)

### Running Tests

```bash
# Unit tests only (119 tests)
npm test

# E2E tests only (14 tests, recorded fixtures)
npm run test:e2e

# Full verification
npm run build && npm test && npm run test:e2e
```

### Manual Testing Against Live API

For testing against the real Robinhood API (not run in CI):

1. Set credentials in environment (never commit):
   ```bash
   export RH_USERNAME="your-email"
   export RH_PASSWORD="your-password"
   ```
2. Use the example script: `node example/basic-usage.js`
3. MFA will be required — enter the code when prompted
4. Verify: account data loads, positions have prices, quotes are current

### Adding New E2E Tests

1. Capture the API response shape you want to test
2. Add it to `portfolio-responses.json` under the appropriate key
3. Write the test in `src/__tests__/e2e/portfolio.e2e.test.ts`
4. Mock axios responses in call order using `mockResolvedValueOnce`
5. Assert on the standardized output, not raw API shapes

## Key Design Decisions

- **Read-only**: No `placeOrder`/`cancelOrder` in the service layer (exists in API layer for completeness but not exposed)
- **Graceful degradation**: Position/transaction enrichment failures are logged and skipped, not thrown
- **Standardized errors**: All service methods wrap errors into `StandardizedError` with code, message, source, timestamp
- **No live API in CI**: All tests use mocked HTTP responses
