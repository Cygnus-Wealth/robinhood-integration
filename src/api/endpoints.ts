export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/api-token-auth/',
    LOGOUT: '/api-token-logout/',
    REFRESH: '/oauth/token/',
    MFA: '/api-token-auth/mfa/',
  },
  ACCOUNTS: {
    LIST: '/accounts/',
    DETAIL: (id: string) => `/accounts/${id}/`,
    PORTFOLIO: (id: string) => `/accounts/${id}/portfolio/`,
    POSITIONS: (id: string) => `/accounts/${id}/positions/`,
  },
  POSITIONS: {
    LIST: '/positions/',
    DETAIL: (id: string) => `/positions/${id}/`,
    OWNED: '/positions/?nonzero=true',
  },
  ORDERS: {
    LIST: '/orders/',
    DETAIL: (id: string) => `/orders/${id}/`,
    CANCEL: (id: string) => `/orders/${id}/cancel/`,
    PLACE: '/orders/',
  },
  INSTRUMENTS: {
    DETAIL: (id: string) => `/instruments/${id}/`,
    BY_SYMBOL: (symbol: string) => `/instruments/?symbol=${symbol}`,
    QUOTE: (symbol: string) => `/quotes/${symbol}/`,
    QUOTES: '/quotes/',
    FUNDAMENTALS: (symbol: string) => `/fundamentals/${symbol}/`,
  },
  PORTFOLIOS: {
    HISTORICALS: (account: string) => `/portfolios/historicals/${account}/`,
  },
  QUOTES: {
    LIST: '/quotes/',
    BY_SYMBOLS: (symbols: string[]) => `/quotes/?symbols=${symbols.join(',')}`,
    HISTORICALS: (symbol: string) => `/quotes/historicals/${symbol}/`,
  },
  CRYPTO: {
    ACCOUNTS: '/nummus/accounts/',
    HOLDINGS: '/nummus/holdings/',
    ORDERS: '/nummus/orders/',
    QUOTES: (id: string) => `/marketdata/forex/quotes/${id}/`,
    CURRENCIES: '/nummus/currencies/',
    PAIRS: '/nummus/currency_pairs/',
  },
  WATCHLISTS: {
    LIST: '/watchlists/',
    DETAIL: (name: string) => `/watchlists/${name}/`,
    BULK_ADD: (name: string) => `/watchlists/${name}/bulk_add/`,
  },
  DIVIDENDS: {
    LIST: '/dividends/',
    DETAIL: (id: string) => `/dividends/${id}/`,
  },
  USER: {
    PROFILE: '/user/',
    BASIC_INFO: '/user/basic_info/',
    INVESTMENT_PROFILE: '/user/investment_profile/',
    EMPLOYMENT: '/user/employment/',
    ADDITIONAL_INFO: '/user/additional_info/',
  },
  MARKETS: {
    LIST: '/markets/',
    HOURS: (market: string, date: string) => `/markets/${market}/hours/${date}/`,
  },
  NEWS: {
    LIST: (symbol: string) => `/news/${symbol}/`,
  },
  NOTIFICATIONS: {
    LIST: '/notifications/',
    DEVICES: '/notifications/devices/',
  },
  DOCUMENTS: {
    LIST: '/documents/',
    DOWNLOAD: (id: string) => `/documents/${id}/download/`,
  },
};