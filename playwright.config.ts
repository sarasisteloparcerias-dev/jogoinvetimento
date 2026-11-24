import { defineConfig } from '@playwright/test'

/**
 * Testes do jogo no browser: cada fase arranca, os diálogos andam, passa-se uma vez de tempo
 * e não aparecem erros. Correm contra o servidor de desenvolvimento (npm run test:e2e).
 * Para usar um Chromium já instalado: PW_CHROMIUM=/caminho/para/chromium npm run test:e2e
 */
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 180_000,
  fullyParallel: true,
  workers: process.env.CI ? 2 : 3,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:5181',
    trace: 'off',
    launchOptions: process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
  },
  webServer: {
    command: 'npx vite --port 5181 --strictPort',
    url: 'http://localhost:5181',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
