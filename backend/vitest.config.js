import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    setupFiles: ['tests/setup.js'],
    // Integration tests share one Postgres test database, so run files serially.
    fileParallelism: false,
    coverage: { provider: 'v8', include: ['src/**/*.js'], exclude: ['src/server.js', 'src/seeds/run.js'] },
  },
});
