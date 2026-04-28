'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Demo-only control: wipes domain data and re-seeds the fixture catalogue.
 * Hidden behind a confirm() prompt because the action is destructive even
 * though the data is mock — anyone running through the UAT shouldn't fire
 * it accidentally between test cases.
 */
export default function ResetDemoButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null);

  async function reset() {
    if (loading) return;
    const confirmed = window.confirm(
      'Reset the demo to a clean state?\n\n' +
        'This will delete every product, campaign, link, and click row, then ' +
        're-seed the fixture catalogue (6 products + Summer Deal 2025 + 12 links).\n\n' +
        'Admin users are preserved.',
    );
    if (!confirmed) return;
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/reset-demo', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message ?? data?.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { products: number; links: number; clicks: number };
      setFeedback({
        kind: 'ok',
        msg: `Reset complete — ${data.products} products / ${data.links} links / ${data.clicks} clicks wiped.`,
      });
      router.refresh();
    } catch (e) {
      setFeedback({
        kind: 'err',
        msg: e instanceof Error ? e.message : 'Reset failed',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={reset}
        disabled={loading}
        className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-60"
      >
        {loading ? 'Resetting…' : 'Reset demo data'}
      </button>
      {feedback && (
        <p
          className={`max-w-xs text-right text-[11px] ${
            feedback.kind === 'ok' ? 'text-emerald-700' : 'text-red-700'
          }`}
        >
          {feedback.msg}
        </p>
      )}
    </div>
  );
}
