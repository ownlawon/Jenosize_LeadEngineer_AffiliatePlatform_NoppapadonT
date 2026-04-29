import { defineConfig, devices } from "@playwright/test";

/**
 * E2E configuration for the full Add → Generate → Click → Dashboard happy
 * path. Assumes the api is reachable at NEXT_PUBLIC_API_URL (default
 * http://localhost:3001) — start it separately via `pnpm dev` from the
 * monorepo root, or via the CI service-container setup.
 *
 * The `webServer` block boots `next start` against the production build
 * so we test the same code path that ships, not Next.js dev with HMR.
 */
const PORT = Number(process.env.PORT ?? 3000);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
  ],
  use: {
    baseURL,
    trace: "on-first-retry",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_NO_WEBSERVER
    ? undefined
    : {
        command: `pnpm next start -p ${PORT}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      },
});
