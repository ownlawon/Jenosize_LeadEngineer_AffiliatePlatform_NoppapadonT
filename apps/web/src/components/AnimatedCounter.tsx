"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";

interface Props {
  /** Final value to count to. */
  value: number;
  /** Pre-formatted string for non-numeric KPIs (e.g., "5.2%", "—"). When set, value is ignored. */
  display?: string;
  /** Render a fraction digit so the count-up reads smoothly for small values. */
  fractionDigits?: number;
  /** Animation duration in seconds. */
  duration?: number;
}

/**
 * Counts up from 0 to `value` on mount. Respects prefers-reduced-motion —
 * users with that preference set see the final number immediately, no
 * animation. Uses framer-motion's animate() driver so the easing curve is
 * the same as page transitions elsewhere in the app.
 *
 * For non-numeric KPIs (CTR percentage, dash-when-zero) pass `display`
 * directly — the counter falls back to a static label.
 */
export function AnimatedCounter({
  value,
  display,
  fractionDigits = 0,
  duration = 0.9,
}: Props) {
  const reduceMotion = useReducedMotion();
  const [shown, setShown] = useState(reduceMotion ? value : 0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (display !== undefined) return; // static label, no animation
    if (reduceMotion) {
      setShown(value);
      return;
    }
    const controls = animate(0, value, {
      duration,
      ease: [0.2, 0.8, 0.2, 1],
      onUpdate: (n) => setShown(n),
    });
    return () => controls.stop();
  }, [value, display, duration, reduceMotion]);

  if (display !== undefined) return <span ref={ref}>{display}</span>;

  return (
    <span ref={ref}>
      {shown.toFixed(fractionDigits).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
    </span>
  );
}
