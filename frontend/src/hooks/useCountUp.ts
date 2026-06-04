import { useEffect, useRef, useState } from "react";

/**
 * Smoothly animate a number from previous value to target.
 * Returns the rounded current value (integer-friendly).
 */
export function useCountUp(target: number, durationMs = 600): number {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  const startedAtRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (target === value) return;
    fromRef.current = value;
    startedAtRef.current = null;

    const tick = (ts: number) => {
      if (startedAtRef.current == null) startedAtRef.current = ts;
      const elapsed = ts - startedAtRef.current;
      const t = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - t, 3); // cubic ease-out
      const next = fromRef.current + (target - fromRef.current) * eased;
      setValue(t === 1 ? target : Math.round(next));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, durationMs]);

  return value;
}
