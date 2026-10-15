import { defineConfig, devices } from '@playwright/test'

// Cross-device layout suite. Runs without a backend: every API call and the SignalR hub are
// answered from e2e/fixtures (see e2e/support/mockApi.ts). The dev server is pointed at a
// host that does not exist, so a missing stub fails loudly instead of hitting a real API.
const PORT = 5174
const FAKE_API = 'http://api.skycrash.test'

export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  timeout: 60_000,
  expect: { timeout: 7_500 },
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      VITE_API_BASE_URL: `${FAKE_API}/api`,
      VITE_SIGNALR_HUB_URL: `${FAKE_API}/hubs/game`,
      VITE_API_HOST: '',
    },
  },
  projects: [
    // Real device presets, each on the engine the preset defines (iPhones/iPad: WebKit).
    { name: 'iphone-se', use: { ...devices['iPhone SE'] }, testIgnore: /matrix\.spec/ },
    { name: 'iphone-13', use: { ...devices['iPhone 13'] }, testIgnore: /matrix\.spec/ },
    { name: 'iphone-15-pro-max', use: { ...devices['iPhone 15 Pro Max'] }, testIgnore: /matrix\.spec/ },
    { name: 'ipad-mini', use: { ...devices['iPad Mini'] }, testIgnore: /matrix\.spec/ },
    { name: 'pixel-7', use: { ...devices['Pixel 7'] }, testIgnore: /matrix\.spec/ },
    { name: 'galaxy-s9plus', use: { ...devices['Galaxy S9+'] }, testIgnore: /matrix\.spec/ },
    // Width matrix (320-1024, portrait and landscape) on a touch Chromium; see e2e/matrix.spec.ts.
    {
      name: 'matrix',
      testMatch: /matrix\.spec/,
      use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } },
    },
  ],
})
