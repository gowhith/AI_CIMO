import clsx from "clsx";
import { LucideIcon } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";

interface StatProps {
  label: string;
  value: number | undefined;
  Icon?: LucideIcon;
  tone?: "neutral" | "accent" | "ok" | "warn" | "crit";
  hint?: string;
  loading?: boolean;
  spark?: React.ReactNode;
}

const tones: Record<NonNullable<StatProps["tone"]>, string> = {
  neutral: "text-fg-muted",
  accent: "text-accent-300",
  ok: "text-ok-400",
  warn: "text-warn-400",
  crit: "text-crit-400",
};

export function Stat({
  label,
  value,
  Icon,
  tone = "neutral",
  hint,
  loading,
  spark,
}: StatProps) {
  const animated = useCountUp(value ?? 0);
  return (
    <div className="surface surface-hover p-5 relative overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <span className="label-kpi">{label}</span>
        {Icon && <Icon className={clsx("h-4 w-4", tones[tone])} />}
      </div>
      <div className="value-kpi mt-2">
        {loading ? <span className="skeleton inline-block h-8 w-16" /> : animated}
      </div>
      {hint && <div className="text-xs text-fg-muted mt-1">{hint}</div>}
      {spark && <div className="h-10 -mx-1 mt-2 opacity-80">{spark}</div>}
    </div>
  );
}
