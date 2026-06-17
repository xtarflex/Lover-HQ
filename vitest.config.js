import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.js';

/**
 * Vitest configuration file.
 * Merges with the main Vite configuration and specifies the JSDOM environment,
 * global setup files, and test exclusion patterns (specifically preventing
 * agent metadata directories from being scanned).
 */
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./vitest.setup.js'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/.git/**',
        '**/.agents/**',
      ],
    },
  })
);
