# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Build and Development
- `npm run build` - Compile TypeScript to JavaScript (output in dist/)
- `npm run dev` - Watch mode for TypeScript compilation
- `npm run typecheck` - Type check without emitting files

### Testing
- `npm test` - Run tests with Vitest
- `npm run test:ui` - Run tests with interactive UI
- `npm run test:coverage` - Run tests with coverage report

### Code Quality
- `npm run lint` - Run ESLint on TypeScript files
- `npm run format` - Format code with Prettier

### Running a Single Test
Use Vitest's filtering capabilities:
- `npx vitest run path/to/test.ts` - Run specific test file
- `npx vitest run -t "test name"` - Run tests matching pattern

## Architecture

### Core Service Pattern
The library follows a layered architecture pattern:

1. **Service Layer** (`src/services/robinhood-service.ts`): Main public API that orchestrates all operations. Handles authentication state and provides high-level methods for portfolio operations.

2. **API Layer** (`src/api/`):
   - `client.ts`: HTTP client handling authentication, token management, and request/response interceptors
   - `robinhood-api.ts`: Raw API endpoint methods organized by domain
   - `endpoints.ts`: API endpoint definitions and configurations

3. **Mapper Layer** (`src/mappers/portfolio-mapper.ts`): Transforms Robinhood's proprietary data formats into standardized models compatible with @cygnus-wealth/data-models interfaces.

4. **Type System** (`src/types/` and `src/models/`):
   - Internal types for Robinhood API responses
   - Standardized output models for cross-platform compatibility

### Key Design Decisions

- **Client-side Only**: Designed for browser environments in the CygnusWealth dApp, no server-side operations
- **Read-only Access**: No trading or transaction capabilities, focused on portfolio data extraction
- **Token Management**: Automatic token refresh with secure storage expectations
- **Error Standardization**: All errors are transformed into StandardizedError format for consistent handling

### Authentication Flow
1. Client provides credentials to `authenticate()`
2. Service handles MFA if required
3. Tokens are stored in client and automatically refreshed
4. All subsequent API calls use authenticated client

### Data Flow
1. User calls service method (e.g., `getPortfolio()`)
2. Service delegates to API layer
3. API makes HTTP request via client
4. Raw response is passed to mapper
5. Mapper transforms to standardized model
6. Standardized data returned to user

## Integration Points

### Dependencies
- **axios**: HTTP client for API requests
- **uuid**: Generating unique identifiers
- **@cygnus-wealth/data-models** (peer): Standardized interfaces for portfolio data

### External Systems
- Robinhood API: Uses undocumented private API endpoints
- CygnusWealth Platform: Outputs conform to platform's data model standards

## Testing Strategy

Tests should cover:
- Authentication flows including MFA scenarios
- Token refresh logic
- Data mapping accuracy
- Error handling and standardization
- API response mocking for reliability

Use Vitest for all testing with proper mocking of HTTP requests to avoid real API calls.

## Agent Usage Guidelines

When working on this repository, use the appropriate DDD (Domain-Driven Design) subagents for different architectural tasks:

### ddd-enterprise-architect
Use for strategic architectural decisions:
- Defining bounded contexts between Robinhood integration and other CygnusWealth domains
- Establishing communication contracts with other portfolio integrations
- Decomposing the integration layer into microservices if needed
- Aligning the integration architecture with CygnusWealth's business strategy

### ddd-domain-architect
Use for domain-specific implementation:
- Translating CygnusWealth's portfolio aggregation requirements into Robinhood integration patterns
- Defining aggregates for portfolio data (positions, transactions, balances)
- Establishing contracts between the API layer and mapper layer
- Implementing modular repository patterns for different asset types

### ddd-system-architect
Use for internal system design:
- Designing the module structure for new features (options trading, crypto support)
- Selecting libraries for specific functionality (rate limiting, caching)
- Planning E2E test scenarios for authentication and data retrieval flows
- Evaluating state management for client-side token storage

### ddd-unit-architect
Use for code-level architecture:
- Designing class structures for new mappers or services
- Creating file structures for new feature modules
- Defining unit test specifications for data transformation logic
- Structuring error handling and retry mechanisms

### ddd-software-engineer
Use for implementation tasks:
- Implementing new mapper classes based on architectural designs
- Writing unit tests for service methods and data transformations
- Implementing value objects for financial data (Currency, Price, Quantity)
- Enhancing existing code with proper DDD patterns

### When NOT to use DDD agents
- Simple bug fixes or minor updates
- Documentation updates
- Configuration changes
- Running existing commands or tests