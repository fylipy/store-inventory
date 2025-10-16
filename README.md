# store-inventory

This project contains helpers and tests for calculating store inventory balances and monthly stock reports.

## Running tests locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the Vitest suite (used in CI) from the project root:
   ```bash
   npm run test
   ```

Vitest will pick up TypeScript test files under `tests/` using the configuration in [`vitest.config.ts`](./vitest.config.ts) and [`tsconfig.vitest.json`](./tsconfig.vitest.json).
