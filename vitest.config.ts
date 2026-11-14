import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    maxWorkers: 1,
    projects: [
      {
        test: {
          name: 'unit',
          include: ['test/unit/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'integration',
          include: ['test/integration/**/*.test.ts'],
          exclude: ['test/integration/helpers/**', 'test/integration/_probe*.test.ts'],
          testTimeout: 60_000,
          hookTimeout: 60_000,
          fileParallelism: false,
          maxWorkers: 1,
          maxConcurrency: 1,
        },
      },
    ],
  },
})