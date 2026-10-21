import fs from 'fs'
import { chromium, defineConfig, devices } from '@playwright/test'

function resolveBrowserChannel(): 'chrome' | 'msedge' | undefined {
  try {
    if (fs.existsSync(chromium.executablePath())) {
      return undefined
    }
  } catch {
    // Fall back to preinstalled system browser channel when Playwright browser cache is absent
  }

  if (
    process.platform === 'win32' &&
    !fs.existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe') &&
    fs.existsSync('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe')
  ) {
    return 'msedge'
  }

  return 'chrome'
}

const channel = resolveBrowserChannel()
const baseURL = process.env.SERVER_URL ?? 'http://localhost:3000'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    viewport: { width: 1440, height: 900 },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(channel ? { channel } : {}),
      },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: `${baseURL}/admin`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
