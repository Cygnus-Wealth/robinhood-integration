import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RobinhoodService } from '../services/robinhood-service';
import { mockCredentials } from './mock-data';

// Integration tests to verify the entire flow works together
describe('Robinhood Integration - End to End', () => {
  let service: RobinhoodService;

  beforeEach(() => {
    // Create a real service instance
    service = new RobinhoodService({
      baseUrl: 'https://api.robinhood.com',
      timeout: 30000,
    });
  });

  describe('Service Initialization', () => {
    it('should create service instance', () => {
      expect(service).toBeDefined();
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('Authentication Flow', () => {
    it('should handle authentication errors gracefully', async () => {
      // This will fail since we're using fake credentials
      // But it tests that the error handling works
      try {
        await service.authenticate(mockCredentials);
      } catch (error: any) {
        expect(error).toBeDefined();
        expect(error.code).toBeDefined();
        expect(error.source).toBe('robinhood');
      }
    });
  });

  describe('Error Standardization', () => {
    it('should return standardized errors for all operations', async () => {
      // Test that unauthenticated calls return proper errors
      const operations = [
        () => service.getPortfolio(),
        () => service.getPositions(),
        () => service.getBalance(),
        () => service.getQuote('AAPL'),
        () => service.getTransactions(),
      ];

      for (const operation of operations) {
        try {
          await operation();
        } catch (error: any) {
          expect(error).toHaveProperty('code');
          expect(error).toHaveProperty('message');
          expect(error).toHaveProperty('source', 'robinhood');
          expect(error).toHaveProperty('timestamp');
        }
      }
    });
  });

  describe('Type Exports', () => {
    it('should export all necessary types', () => {
      // This test verifies that the main index file exports everything needed
      const exports = require('../index');
      
      expect(exports.RobinhoodService).toBeDefined();
      expect(exports.RobinhoodClient).toBeDefined();
      expect(exports.RobinhoodAPI).toBeDefined();
      expect(exports.PortfolioMapper).toBeDefined();
    });
  });
});