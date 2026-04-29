import { test, expect } from "@playwright/test";

/**
 * End-to-end happy path that mirrors the assignment's required demo flow:
 *   Login → Add product → Create campaign → Generate link → Click → Dashboard
 *
 * Assumptions (set up by `webServer` in playwright.config.ts + a running api):
 *   - api reachable at the URL the web app's NEXT_PUBLIC_API_URL points to
 *   - admin credentials match .env: admin@jenosize.test / ChangeMe!2025
 *   - Reset Demo button is functional (wipes + reseeds; we lean on it
 *     to start from a known state without coupling to test order)
 */
test.describe("Affiliate happy path", () => {
  test.beforeEach(async ({ page }) => {
    // Login first — the rest of the flow needs the access_token cookie.
    await page.goto("/admin/login");
    await page.getByRole("button", { name: /Fill demo credentials/i }).click();
    await page.getByRole("button", { name: /Sign in/i }).click();
    await expect(page).toHaveURL(/\/admin\/dashboard/);

    // Reset to known state. The button confirms via window.confirm — accept it.
    page.on("dialog", (d) => d.accept());
    await page.getByRole("button", { name: /Reset demo data/i }).click();
    // Wait for the success toast so we know the seed completed.
    await expect(page.getByText(/Reset complete/i)).toBeVisible({
      timeout: 15_000,
    });
  });

  test("login → add product → create campaign → generate link → click → dashboard updates", async ({
    page,
    request,
  }) => {
    // ── Step 1: Add a product via the Quick Sample shortcut ────────────────
    await page.getByRole("link", { name: /^Products$/ }).click();
    await expect(page).toHaveURL(/\/admin\/products/);

    // Capture the table row count before the click so we can assert growth.
    const productRowsBefore = await page.locator("table tbody tr").count();

    // Coffee Beans is one of the 3 SKUs that the reset deliberately leaves
    // un-seeded so this click produces visible feedback.
    await page.getByRole("button", { name: /Lazada · Coffee Beans/i }).click();
    await expect(page.getByText(/added/i).first()).toBeVisible({
      timeout: 10_000,
    });

    const productRowsAfter = await page.locator("table tbody tr").count();
    expect(productRowsAfter).toBe(productRowsBefore + 1);

    // Add the Shopee offer to the same product so we can generate links for both.
    await page.getByRole("button", { name: /Shopee · Coffee Beans/i }).click();
    await expect(page.getByText(/added/i).last()).toBeVisible({
      timeout: 10_000,
    });

    // ── Step 2: Create a campaign ──────────────────────────────────────────
    await page.getByRole("link", { name: /^Campaigns$/ }).click();
    await expect(page).toHaveURL(/\/admin\/campaigns/);

    const stamp = Date.now();
    const campaignName = `E2E Campaign ${stamp}`;
    const utmSlug = `e2e_${stamp}`;
    await page.getByLabel(/Name/i).fill(campaignName);
    await page.getByLabel(/UTM campaign/i).fill(utmSlug);
    await page.getByRole("button", { name: /Create campaign/i }).click();
    await expect(page.getByText(campaignName)).toBeVisible({ timeout: 10_000 });

    // ── Step 3: Generate a link ────────────────────────────────────────────
    await page.getByRole("link", { name: /^Links$/ }).click();
    await expect(page).toHaveURL(/\/admin\/links/);

    // Pick the new product (Coffee Beans) + new campaign + LAZADA, then submit.
    await page.getByLabel(/Product/i).selectOption({ label: /Coffee/i });
    await page.getByLabel(/Campaign/i).selectOption({ label: campaignName });
    await page.getByLabel(/Marketplace/i).selectOption("LAZADA");
    await page.getByRole("button", { name: /Generate link/i }).click();
    await expect(
      page.getByText(/Link.*generated|Short URL copied/i).first(),
    ).toBeVisible({
      timeout: 10_000,
    });

    // Pull the just-generated short code out of the table — first row.
    const shortCodeCell = page
      .locator("table tbody tr")
      .first()
      .getByRole("link", {
        name: /^\/go\//,
      });
    const shortCodeText = await shortCodeCell.innerText();
    const shortCode = shortCodeText.replace(/^\/go\//, "").trim();
    expect(shortCode).toMatch(/^[A-Za-z0-9]{6}$/);

    // ── Step 4: Click the redirect (without following the 302) ─────────────
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
    const redirectRes = await request.get(`${apiBase}/go/${shortCode}`, {
      maxRedirects: 0,
    });
    expect(redirectRes.status()).toBe(302);
    const location = redirectRes.headers()["location"];
    expect(location).toMatch(/lazada\.co\.th|lazada\.com/i);
    expect(location).toContain(`utm_campaign=${utmSlug}`);

    // ── Step 5: Verify dashboard reflects the click ────────────────────────
    await page.getByRole("link", { name: /^Dashboard$/ }).click();
    await expect(page).toHaveURL(/\/admin\/dashboard/);

    // Total clicks should be ≥ 1 — the Click write is fire-and-forget so
    // give it a moment to land.
    await expect
      .poll(
        async () => {
          const text = await page
            .locator("p", { hasText: /Total clicks/i })
            .first()
            .locator("..")
            .innerText();
          const match = text.match(/\b(\d+)\b/);
          return match ? Number(match[1]) : 0;
        },
        {
          timeout: 10_000,
          message: "Dashboard total clicks did not increment after redirect",
        },
      )
      .toBeGreaterThanOrEqual(1);
  });
});
