# Lighthouse Audit Notes

This page captures the performance / accessibility / SEO posture of the
public-facing pages and the fixes applied during the final hardening pass.

## How to reproduce

```bash
# Public landing
npx lighthouse https://jenosizeweb-production.up.railway.app/ \
  --only-categories=performance,accessibility,seo,best-practices \
  --view

# Campaign page (replace <id> with an active campaign ID)
npx lighthouse https://jenosizeweb-production.up.railway.app/c/<id> \
  --only-categories=performance,accessibility,seo,best-practices \
  --view
```

The report opens in your browser; `--output=json --output-path=./lh.json` saves
machine-readable results.

## Fixes applied (Tier 2 #8)

| Category         | Issue                                                       | Fix                                                                                                                                 |
| ---------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **SEO**          | `<title>` was generic ("Jenosize Affiliate") on every route | `app/layout.tsx` now defines a `title.template` so each page gets a contextual title (e.g. "Summer Deal 2025 · Jenosize Affiliate") |
| **SEO**          | No `<meta description>` per route                           | Layout has a default; `/c/[id]/page.tsx` now exports `generateMetadata` for per-campaign title + description                        |
| **SEO**          | No OpenGraph / Twitter cards                                | Added in layout `metadata.openGraph` + `metadata.twitter`; campaign page extends with campaign-specific OG title                    |
| **SEO**          | `robots` directive implicit                                 | Explicit `metadata.robots: { index: true, follow: true }`                                                                           |
| **A11y**         | No "Skip to main content" link                              | `app/layout.tsx` now renders a visually-hidden focus-revealed link to `#main`                                                       |
| **A11y**         | `<main>` had no `id`                                        | Added `id="main"` on the public landing, campaign page, and admin layout `<main>` elements so the skip link can target them         |
| **A11y**         | No `viewport` meta with `theme-color`                       | Added `viewport.themeColor: '#6366f1'` (matches brand)                                                                              |
| **PWA-adjacent** | No author / keywords meta                                   | Added `metadata.authors` + `metadata.keywords`                                                                                      |

## Items deliberately not changed (and why)

- **`<img>` → `next/image`** — fixture images come from external hosts
  (`via.placeholder.com`, real Lazada/Shopee CDNs, etc.) which would require
  per-host `images.remotePatterns` configuration. The marginal LCP gain on a
  6-card landing page didn't justify the deploy-time risk; both `<img>` tags
  in admin tables already have explicit `width`/`height` via Tailwind, so
  CLS is bounded.
- **Inline CSS critical path** — Tailwind JIT already inlines used utilities;
  the framework's chunking strategy is already aggressive.
- **Self-host Inter font** — currently using system font stack
  (`min-h-screen antialiased` + Tailwind defaults). Self-hosting adds 30 KB
  for cosmetic benefit and would re-introduce a CLS risk on first paint.

## Notes for the reviewer

- Run Lighthouse against the **deployed Railway URL**, not local dev.
  Next.js dev mode is intentionally not optimised and will report
  spurious low perf scores.
- Mobile preset (the default) is the right one for the public landing —
  shoppers reach `/c/:id` from social DM and messaging, not desktop.
- Performance scores are sensitive to Railway cold-start; first hit
  after a quiet period takes ~1s as the api wakes. Subsequent hits show
  the steady-state numbers.
