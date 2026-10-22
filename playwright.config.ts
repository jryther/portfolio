import { defineConfig, devices } from '@playwright/test'

// End-to-end tests for the whole page, run against the Vite dev server (or, in CI, the build).
// Unit tests (Vitest) live in src/__tests__; these drive the real UI in a browser.

// Its own port, so a dev server already running for another checkout is never reused by mistake
const PORT = 5180
const baseURL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Every core on the CI runner (4 on public repos): each test has its own browser context
  // against a static build, so the specs are independent. Locally, Playwright's default (half the cores)
  workers: process.env.CI ? '100%' : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Reduced motion makes the page deterministic: no AOS reveals, no weather, chat replies
    // appear at once instead of typing out. Specs that test motion-only UI opt back in
    reducedMotion: 'reduce',
    locale: 'en-US',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      // Phone layout: hamburger menu, stacked sections
      name: 'mobile',
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: {
    // Locally the dev server; in CI the production build the workflow just made (vite preview)
    command: process.env.CI
      ? `npx vite preview --port ${PORT} --strictPort`
      : `npx vite --port ${PORT} --strictPort`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
