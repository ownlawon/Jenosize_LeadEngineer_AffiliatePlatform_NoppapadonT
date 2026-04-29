import { apiFetch } from "@/lib/api";
import type { DashboardSummary, TopProduct } from "@jenosize/shared";
import { Eye, MousePointerClick, Sparkles, Target } from "lucide-react";
import DashboardChart from "./DashboardChart";
import ExportClicksButton from "./ExportClicksButton";
import ResetDemoButton from "@/components/ResetDemoButton";
import OnboardingCard from "@/components/OnboardingCard";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { Sparkline } from "@/components/Sparkline";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [summary, top] = await Promise.all([
    apiFetch<DashboardSummary>("/api/dashboard", { authed: true }),
    apiFetch<TopProduct[]>("/api/dashboard/top-products?limit=5", {
      authed: true,
    }),
  ]);

  const ctrLabel =
    summary.ctr === null
      ? "—"
      : `${(summary.ctr * 100).toFixed(summary.ctr < 0.01 ? 2 : 1)}%`;
  const ctrHint =
    summary.ctr === null
      ? `0 / ${summary.totalImpressions.toLocaleString()} impressions`
      : `${summary.totalClicks.toLocaleString()} / ${summary.totalImpressions.toLocaleString()} impressions`;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-slate-500">
            Aggregate stats across all campaigns
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExportClicksButton />
          <ResetDemoButton />
        </div>
      </div>

      {summary.totalProducts === 0 && <OnboardingCard />}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat
          label="Total clicks"
          value={summary.totalClicks}
          icon={MousePointerClick}
          spark={summary.clicksLast7Days.map((d) => d.clicks)}
        />
        <Stat
          label="Total impressions"
          value={summary.totalImpressions}
          icon={Eye}
        />
        <Stat
          label="CTR"
          value={ctrLabel}
          display
          hint={ctrHint}
          icon={Target}
        />
        <Stat
          label="Active campaigns"
          value={summary.activeCampaigns}
          icon={Sparkles}
          hint={
            summary.totalCampaigns > summary.activeCampaigns
              ? `${summary.totalCampaigns - summary.activeCampaigns} inactive`
              : undefined
          }
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="card transition-shadow hover:shadow-card-hover">
          <h2 className="mb-4 font-semibold">Clicks last 7 days</h2>
          <DashboardChart data={summary.clicksLast7Days} />
        </div>

        <div className="card transition-shadow hover:shadow-card-hover">
          <h2 className="mb-4 font-semibold">By marketplace</h2>
          {summary.byMarketplace.length === 0 ? (
            <EmptyState
              icon={Eye}
              title="No clicks yet"
              hint="Once shoppers tap a Buy CTA the breakdown lands here."
            />
          ) : (
            <ul className="space-y-2 text-sm">
              {summary.byMarketplace.map((m) => (
                <li
                  key={m.marketplace}
                  className="flex items-center justify-between"
                >
                  <span className="font-medium">{m.marketplace}</span>
                  <span className="tabular-nums">{m.clicks}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="card transition-shadow hover:shadow-card-hover">
          <h2 className="mb-4 font-semibold">By campaign</h2>
          {summary.byCampaign.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="No campaigns with clicks yet"
              hint="Click totals roll up by campaign as soon as your links pick up traffic."
            />
          ) : (
            <ul className="space-y-2 text-sm">
              {summary.byCampaign.map((c) => (
                <li
                  key={c.campaignId}
                  className="flex items-center justify-between"
                >
                  <span className="truncate">{c.name}</span>
                  <span className="tabular-nums">{c.clicks}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card transition-shadow hover:shadow-card-hover">
          <h2 className="mb-4 font-semibold">Top products</h2>
          {top.length === 0 ? (
            <EmptyState
              icon={Target}
              title="No products yet"
              hint="Add a Lazada or Shopee URL on /admin/products to populate this leaderboard."
            />
          ) : (
            <ol className="space-y-3 text-sm">
              {top.map((p, idx) => (
                <li key={p.productId} className="flex items-center gap-3">
                  <span className="w-5 text-slate-400">{idx + 1}.</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.imageUrl}
                    alt={p.title}
                    className="h-10 w-10 rounded object-cover"
                  />
                  <span className="flex-1 truncate">{p.title}</span>
                  <span className="font-semibold tabular-nums">{p.clicks}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
      <span
        className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-400"
        aria-hidden
      >
        <Icon className="h-5 w-5" />
      </span>
      <p className="text-sm font-medium text-slate-700">{title}</p>
      {hint && <p className="max-w-[260px] text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function Stat({
  label,
  value,
  display,
  hint,
  icon: Icon,
  spark,
}: {
  label: string;
  value: string | number;
  /** When true, render `value` as a static label (no count-up). For pre-formatted strings like "5.2%". */
  display?: boolean;
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
  spark?: number[];
}) {
  const numericValue = typeof value === "number" ? value : 0;
  return (
    <div className="card transition-shadow hover:shadow-card-hover">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500">
          {label}
        </p>
        {Icon ? <Icon className="h-3.5 w-3.5 text-slate-400" /> : null}
      </div>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="text-3xl font-semibold tracking-tight tabular-nums text-slate-900">
          {display ? (
            <AnimatedCounter value={0} display={String(value)} />
          ) : (
            <AnimatedCounter value={numericValue} />
          )}
        </p>
        {spark && spark.length > 0 ? (
          <Sparkline data={spark} className="text-brand-500" />
        ) : null}
      </div>
      {hint && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
}
