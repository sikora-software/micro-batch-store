import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/__tests__/**/*.test.ts'],
  },
  define: {
    PACKAGE_VERSION: JSON.stringify('0.0.1-test'),
  },
});
