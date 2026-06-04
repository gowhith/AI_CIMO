import clsx from "clsx";

const map: Record<string, { cls: string; dot: string; pulse?: boolean }> = {
  healthy: { cls: "badge-ok", dot: "bg-ok-400" },
  warning: { cls: "badge-warn", dot: "bg-warn-400" },
  critical: { cls: "badge-crit", dot: "bg-crit-400", pulse: true },
  unknown: { cls: "badge-neutral", dot: "bg-fg-subtle" },

  open: { cls: "badge-crit", dot: "bg-crit-400", pulse: true },
  investigating: { cls: "badge-warn", dot: "bg-warn-400" },
  resolved: { cls: "badge-ok", dot: "bg-ok-400" },
  closed: { cls: "badge-neutral", dot: "bg-fg-subtle" },

  low: { cls: "badge-accent", dot: "bg-accent-400" },
  medium: { cls: "badge-warn", dot: "bg-warn-400" },
  high: { cls: "badge-crit", dot: "bg-crit-400" },

  INFO: { cls: "badge-accent", dot: "bg-accent-400" },
  WARNING: { cls: "badge-warn", dot: "bg-warn-400" },
  ERROR: { cls: "badge-crit", dot: "bg-crit-400" },
  CRITICAL: { cls: "badge-crit", dot: "bg-crit-400", pulse: true },
};

export default function StatusBadge({
  value,
  size = "md",
}: {
  value: string;
  size?: "sm" | "md";
}) {
  const s = map[value] ?? map.unknown;
  return (
    <span className={clsx("badge", s.cls, size === "sm" && "text-[10px] py-0.5 px-1.5")}>
      <span className={clsx("badge-dot", s.dot, s.pulse && "animate-live-pulse")} />
      {value}
    </span>
  );
}
