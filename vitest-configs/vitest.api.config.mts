import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

const MAIN_SETUP_FILE = 'vitest-configs/vitest.setup.ts';

export default defineConfig({
  plugins: [tsconfigPaths(), react()],

  test: {
    name: 'api',
    environment: 'node',
    include: ['**/*.api.test.{ts,tsx}'],
    setupFiles: [MAIN_SETUP_FILE],
  },
});
