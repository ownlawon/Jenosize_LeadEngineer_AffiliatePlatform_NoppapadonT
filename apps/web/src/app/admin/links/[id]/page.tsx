import { notFound } from "next/navigation";
import Link from "next/link";
import { apiFetch, ApiError } from "@/lib/api";
import type { LinkAnalytics } from "@jenosize/shared";
import LinkAnalyticsChart from "./LinkAnalyticsChart";

export const dynamic = "force-dynamic";

export default async function LinkAnalyticsPage({
  params,
}: {
  params: { id: string };
}) {
  let analytics: LinkAnalytics;
  try {
    analytics = await apiFetch<LinkAnalytics>(
      `/api/links/${params.id}/analytics`,
      {
        authed: true,
      },
    );
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  const { link, product, campaign, clicks, impressions, ctr, last7Days } =
    analytics;
  const ctrLabel =
    ctr === null ? "—" : `${(ctr * 100).toFixed(ctr < 0.01 ? 2 : 1)}%`;
  const ctrHint =
    ctr === null
      ? `0 / ${impressions.toLocaleString()} impressions`
      : `${clicks.toLocaleString()} / ${impressions.toLocaleString()} impressions`;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/links"
          className="mb-4 inline-flex items-center gap-1 text-xs text-slate-500 transition-colors hover:text-slate-900"
        >
          <span aria-hidden>←</span> All links
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="font-mono text-2xl font-bold text-slate-900">
              /go/{link.shortCode}
            </h1>
            <p className="text-sm text-slate-500">
              Per-link drill-down · clicks, impressions, and 7-day trend
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={link.shortUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline text-xs"
            >
              Open redirect ↗
            </a>
          </div>
        </div>
      </div>

      <div className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.imageUrl}
          alt=""
          className="h-20 w-20 flex-shrink-0 rounded-md object-cover"
        />
        <div className="flex-1 min-w-0 space-y-1">
          <p className="font-medium text-slate-900 truncate">{product.title}</p>
          <p className="text-xs text-slate-500">
            <span className="badge mr-2 bg-slate-100 text-slate-700">
              {link.marketplace}
            </span>
            in{" "}
            <span className="font-medium text-slate-700">{campaign.name}</span>{" "}
            ·{" "}
            <code className="rounded bg-slate-100 px-1 text-[11px]">
              {campaign.utmCampaign}
            </code>
          </p>
          <p className="break-all text-[11px] text-slate-400">
            → {link.targetUrl}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <Stat label="Total clicks" value={clicks} />
        <Stat label="Total impressions" value={impressions} />
        <Stat label="CTR" value={ctrLabel} hint={ctrHint} />
      </div>

      <div className="card">
        <h2 className="mb-4 font-semibold">
          Clicks vs impressions · last 7 days
        </h2>
        <LinkAnalyticsChart data={last7Days} />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="card">
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums text-slate-900">
        {value}
      </p>
      {hint && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
}
