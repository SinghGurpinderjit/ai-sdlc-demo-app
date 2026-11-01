import { defineConfig, devices } from '@playwright/test';

const chromiumExecutablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
const slowMo = process.env.npm_lifecycle_event === 'test:headed' ? 1000 : 0;

export default defineConfig({
  testDir: './tests',
  timeout: slowMo ? 120_000 : 30_000,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:5000',
    trace: 'on-first-retry',
  },
  projects: [{
    name: 'chromium',
    use: {
      ...devices['Desktop Chrome'],
      launchOptions: {
        slowMo,
        ...(chromiumExecutablePath ? { executablePath: chromiumExecutablePath } : {}),
      },
    },
  }],
  webServer: {
    command: 'dotnet run --project ../backend/src/InvoiceApp.Api',
    url: 'http://localhost:5000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
