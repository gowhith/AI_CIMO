import clsx from "clsx";

export function LiveDot({
  tone = "ok",
  className,
}: {
  tone?: "ok" | "warn" | "crit" | "accent";
  className?: string;
}) {
  const map = {
    ok: "bg-ok-400",
    warn: "bg-warn-400",
    crit: "bg-crit-400",
    accent: "bg-accent-400",
  };
  return (
    <span className={clsx("relative inline-flex h-2 w-2", className)}>
      <span
        className={clsx(
          "absolute inline-flex h-full w-full rounded-full opacity-60",
          map[tone],
          "animate-live-pulse",
        )}
      />
      <span
        className={clsx("relative inline-flex rounded-full h-2 w-2", map[tone])}
      />
    </span>
  );
}
