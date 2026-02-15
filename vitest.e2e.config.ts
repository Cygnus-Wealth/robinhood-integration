import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/__tests__/e2e/**/*.e2e.test.ts'],
    environment: 'node',
    testTimeout: 15000,
    hookTimeout: 15000,
    globals: false,
  },
});
