import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    // Unit-level + component tests run by Vitest.
    // The integration test under scripts/__tests__ uses Node's built-in
    // `node:test` runner (`node --test scripts/__tests__/scan-skins.test.mjs`)
    // and is intentionally excluded here.
    include: ['scripts/*.test.mjs', 'src/**/*.test.{js,jsx}'],
  },
});
