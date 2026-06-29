import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    include: ['src/**/*.integration.test.ts'],
    testTimeout: 120000,
    hookTimeout: 120000,
    env: {
      MONGOMS_CACHE: path.resolve(__dirname, '..', 'node_modules/.cache/mongodb-memory-server'),
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
