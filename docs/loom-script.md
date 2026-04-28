# Loom walkthrough script (~7 min)

> Submission walkthrough covering the assignment's required flow
> (Add → Compare → Link → Click → Dashboard) plus a short architecture
> + design-decision narration.

## Pre-recording checklist

- [ ] **Reset demo data first** — log into `/admin/dashboard` and click
  the red "Reset demo data" button. Confirm. You want a clean slate
  with the auto-seeded fixtures so the dashboard reads as a real demo.
- [ ] **Disable browser cache** in DevTools (Network tab) so live
  network calls show the request-id header.
- [ ] **Tabs to open in advance** (close everything else):
  1. `https://jenosizeweb-production.up.railway.app` (Public home)
  2. `https://jenosizeweb-production.up.railway.app/admin/login`
  3. `https://jenosizeapi-production.up.railway.app/api/docs` (Swagger)
  4. `https://github.com/ownlawon/Jenosize_LeadEngineer_AffiliatePlatform`
- [ ] **Editor / file viewer open at:**
  - `apps/api/src/modules/redirect/redirect.service.ts`
  - `packages/adapters/src/types.ts`
  - `docs/decisions.md`
- [ ] **Resolution**: 1080p (1920×1080) for crisp text.
- [ ] **Mic check**: external mic preferred; quiet room.
- [ ] **Screen overlay**: Loom default face cam in bottom-right is fine.
- [ ] **Cursor highlighter**: turn on Loom's cursor highlight.

---

## Scene 1 · Intro · 0:00 → 0:25 (~25s)

**Show:** GitHub repo README, the badges row.

**Say (English):**
> "Hi, I'm [Your Name]. This is a quick walkthrough of my submission
> for the Jenosize Lead Engineer assignment — an affiliate platform
> that compares Lazada and Shopee prices, generates trackable
> short links, and reports clicks on a dashboard."

> "I'll cover the user flow first, then spend the last minute on the
> architecture decisions that shaped the codebase."

---

## Scene 2 · Architecture in 30 seconds · 0:25 → 1:00 (~35s)

**Show:** Open `docs/architecture.md`, scroll to the first Mermaid
diagram (overview), then to the ER diagram. ~3 seconds on each.

**Say:**
> "Two apps, two packages. `apps/api` is a NestJS service, `apps/web`
> is a Next.js admin + public site. They share types through
> `packages/shared` and talk to Lazada and Shopee through a pluggable
> adapter in `packages/adapters` — a deliberate seam so we can swap
> the mock implementation for the real Affiliate API later without
> touching the api code."

> "Five entities: Product, Offer, Campaign, Link, Click. Postgres
> through Prisma, Redis on the redirect hot path."

---

## Scene 3 · Public landing (anonymous) · 1:00 → 1:30 (~30s)

**Show:** Open the public home page in incognito (or signed-out tab).

**Say:**
> "This is the public landing for shoppers — they see active
> campaigns, click into one, and see products with both Lazada and
> Shopee prices side by side. The cheaper one earns the green Best-
> price badge plus a `Save ฿X` indicator."

**Action:** Click into "Summer Deal 2025" → show the product cards.

---

## Scene 4 · Login + dashboard fly-by · 1:30 → 2:10 (~40s)

**Show:** Navigate to `/admin/login`.

**Say:**
> "Admin side — `admin@jenosize.test` / `ChangeMe!2025`. Credentials
> are in the collapsible `Demo credentials` block so reviewers don't
> need to dig into the README."

**Action:** Login.

**Say (on dashboard):**
> "Dashboard is the operations view — KPIs at the top, click breakdown
> by marketplace and campaign, top-products leaderboard, last-7-days
> bar chart. The Reset-demo-data control on the top-right wipes the
> domain rows and re-seeds the fixtures, so reviewers get a clean
> state in one click."

---

## Scene 5 · Add products + price comparison · 2:10 → 3:25 (~75s)

**Show:** Navigate to `/admin/products`.

**Say:**
> "Adding a product takes a Lazada or Shopee URL — or a raw SKU. The
> form auto-detects the marketplace from the host. Quick-Sample
> buttons short-circuit the typing for the six fixture SKUs."

**Action:**
1. Click `Lazada · Coffee Beans` → row appears.
2. Click `Shopee · Coffee Beans` → same row, second offer attaches,
   the green "Best price" badge moves to whichever is cheaper.

**Say:**
> "Notice the toast in the top-right — every admin action goes through
> a single notification surface, not inline error banners. And the
> two listings merged onto one product row because they share a
> title — Offers are unique on `(productId, marketplace)`, so re-
> adding the same SKU upserts in place."

---

## Scene 6 · Create campaign · 3:25 → 4:00 (~35s)

**Show:** Navigate to `/admin/campaigns`.

**Say:**
> "A campaign groups affiliate links under a UTM. Form pre-fills with
> sensible defaults — name, UTM slug, start, end."

**Action:** Use the defaults (Summer Deal 2025), click Create.

**Say:**
> "The UTM slug is alphanumeric + underscore + dash only — that's a
> Marketing-Analytics convention because the value lands as a URL
> query param. The form validates client-side too, so end-date-before-
> start gets a toast before the round trip."

---

## Scene 7 · Generate short link · 4:00 → 4:40 (~40s)

**Show:** Navigate to `/admin/links`.

**Say:**
> "Now we generate a short link — pick a product, a campaign, a
> marketplace, click Generate."

**Action:**
1. Pick the Coffee Beans product, Summer Deal 2025, LAZADA → Generate.
2. Repeat for SHOPEE.

**Say:**
> "Each link gets a six-character nanoid over a confusable-free
> alphabet — no zero-versus-O ambiguity. The Copy button puts the
> full URL on the clipboard; the table shows the short path
> prominently with the destination host underneath, the way bit.ly's
> dashboard does it."

---

## Scene 8 · Click redirect with UTMs · 4:40 → 5:30 (~50s)

**Show:** Open DevTools → Network tab → preserve log.

**Say:**
> "This is the load-bearing flow — what happens when a shopper clicks
> the affiliate link."

**Action:** Click the Lazada short URL in the table (or copy and
paste in a new tab).

**Show:** The Network panel highlighting the 302 response.

**Say:**
> "The request is a single 302 — Location header points at the
> Lazada product URL with utm_source, utm_medium, and utm_campaign
> appended. Three things happen on the server: Redis lookup of the
> short code, UTM build, and a fire-and-forget Click insert that runs
> on the next event-loop tick — so the redirect itself is never gated
> on the database write."

> "And there's a host whitelist on the redirect: even if a Link row
> ever pointed at a non-marketplace host, we'd 400 instead of acting
> as a phishing relay. There's an e2e test that asserts that."

---

## Scene 9 · Dashboard updated · 5:30 → 6:00 (~30s)

**Show:** Navigate back to `/admin/dashboard`.

**Say:**
> "Back on the dashboard — Total clicks ticked up, the by-marketplace
> breakdown reflects which one we just clicked, and the Top Products
> leaderboard moved Coffee Beans to the top. The chart bar for today
> grew."

**Action:** Hover over the bar to show the tooltip.

---

## Scene 10 · Engineering decisions in 60s · 6:00 → 7:00 (~60s)

**Show:** Open `docs/decisions.md` in GitHub view.

**Say:**
> "The README points at seven Architecture Decision Records — each one
> explains a load-bearing choice and what we explicitly said no to."

**Action:** Scroll through the headings — narrate while scrolling.

> "Mock adapters instead of live API — for cost and TOS reasons.
> Pluggable interface so the swap is one file, not a refactor."

> "Redis on the redirect hot path with a five-minute TTL — turns the
> 302 into a single round-trip in the same data center."

> "JWT in an httpOnly cookie, not a header — closes the XSS-token-
> exfiltration door even though the admin surface is server-rendered."

> "Open-redirect host whitelist as a second line of defence."

> "Auto-seeding BootstrapService so a fresh deploy lands the reviewer
> on a populated dashboard without manual setup."

---

## Scene 11 · Closing · 7:00 → 7:25 (~25s)

**Show:** Loop back to GitHub README.

**Say:**
> "Code is at `github.com/ownlawon/Jenosize_LeadEngineer_AffiliatePlatform`
> — the README has the live URLs, the docs folder has the ADRs,
> architecture diagrams, performance notes, API recipes, and a
> 38-case UAT plan. CI runs lint, typecheck, unit tests, e2e tests,
> and CodeQL on every push."

> "Thanks for reviewing — happy to dig into anything in detail."

---

## Recording tips

- **Speak ~10% slower than feels natural.** Sub-titles render fine
  but reviewer comprehension benefits.
- **Don't read the script verbatim** — the prompts are talking points,
  not dialogue. One uncertain "ah, let me check" is fine; reading
  monotone is not.
- **Pause briefly between scenes** so you can trim if needed in
  Loom's editor.
- **Watch your URL bar** — close any "/admin/products?next=..." style
  urls before recording so the visible URLs are clean.
- **Final review**: watch your own video at 1.25× speed before
  uploading. If anything is unclear at 1.25×, re-record that scene.

## Submission link template

Drop this into the README's Demo section once recorded:

```md
**Demo video:** [Loom · 7 min walkthrough](https://www.loom.com/share/<your-video-id>)
```

…or attach the MP4 in the email/Drive submission alongside the GitHub
URL.
