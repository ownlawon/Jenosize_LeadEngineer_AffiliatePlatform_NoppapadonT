"use client";

import { useState } from "react";
import { toast } from "sonner";

/**
 * Triggers a CSV download of the click table joined with product/campaign.
 * Uses fetch + Blob URL instead of `<a download>` so we can surface the
 * correct error toast when the api rejects (auth, bad date range).
 */
export default function ExportClicksButton() {
  const [loading, setLoading] = useState(false);

  async function download() {
    if (loading) return;
    setLoading(true);
    const tid = toast.loading("Preparing CSV…");
    try {
      const res = await fetch("/api/dashboard/export", { method: "GET" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const filename =
        res.headers
          .get("content-disposition")
          ?.match(/filename="([^"]+)"/)?.[1] ??
        `clicks-${new Date().toISOString().slice(0, 10)}.csv`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`Downloaded ${filename}`, { id: tid });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed", {
        id: tid,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={download}
      disabled={loading}
      className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
      aria-label="Export click data as CSV"
    >
      {loading ? "Preparing…" : "Export CSV"}
    </button>
  );
}
