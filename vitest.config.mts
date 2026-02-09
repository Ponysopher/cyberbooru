import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';

export default defineConfig({
  plugins: [tsconfigPaths(), react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },

  test: {
    environment: 'node',
    setupFiles: ['./vitest-configs/vitest.setup.ts'],
  },
});
