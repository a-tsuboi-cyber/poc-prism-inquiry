// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright E2E Configuration for PRISM Inquiry System
 */
module.exports = defineConfig({
  testDir: './e2e',
  timeout: 45000,
  expect: {
    timeout: 10000
  },
  fullyParallel: false, // 状態（JSONファイルデータ）の競合を防ぐため直列実行
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [
    ['list'],
    ['json', { outputFile: 'test/reports/e2e-results.json' }],
    ['html', { outputFolder: 'test/reports/playwright-html', open: 'never' }]
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'off',
    screenshot: 'only-on-failure',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm start',
    url: 'http://localhost:3000/api/system/status',
    reuseExistingServer: true,
    timeout: 20000,
  },
});
