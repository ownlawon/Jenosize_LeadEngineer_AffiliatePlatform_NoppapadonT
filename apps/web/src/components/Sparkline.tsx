"use client";

interface Props {
  data: number[];
  /** Tailwind stroke colour utility — defaults to brand. */
  className?: string;
  width?: number;
  height?: number;
}

/**
 * Pure-SVG sparkline — no recharts dep, no client-side calc beyond a
 * two-pass scale. Sized for inline use next to a KPI label.
 *
 * Why not Recharts: a 7-bar chart with no axis, tooltip or legend
 * doesn't justify the 30 KB Recharts brings. SVG path is ~200 bytes.
 */
export function Sparkline({
  data,
  className = "text-brand-500",
  width = 100,
  height = 28,
}: Props) {
  if (data.length === 0) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const stepX = data.length > 1 ? width / (data.length - 1) : 0;
  const points = data
    .map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / range) * height * 0.85 - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  // Build an area version of the same path so we can fill underneath at low alpha.
  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg
      role="img"
      aria-label={`Trend sparkline of ${data.length} data points`}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={className}
      preserveAspectRatio="none"
    >
      <polygon points={areaPoints} fill="currentColor" opacity="0.12" />
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
