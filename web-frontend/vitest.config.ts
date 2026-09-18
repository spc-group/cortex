import { defineConfig } from 'vite';

export default defineConfig({
  test: {
      environment: "jsdom",
      globalSetup: './vitest.global-setup.ts',
    setupFiles: './vitest.setup.ts',
    execArgv: [
      '--localstorage-file=./node_modules/.tmp_localstorage',
    ], 
  },
});
