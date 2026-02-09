import { defineConfig, devices } from "@playwright/test";

const isCI = !!process.env.CI;
const port = isCI ? 3000 : 3001;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: "html",

  use: {
    baseURL: `http://localhost:${port}`,
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: isCI ? `npx next start -p ${port}` : "npm run dev",
    url: `http://localhost:${port}`,
    reuseExistingServer: !isCI,
    timeout: 120 * 1000,
  },
});
