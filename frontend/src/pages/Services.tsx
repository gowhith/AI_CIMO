import { useQuery } from "@tanstack/react-query";
import { Server, User as UserIcon, Globe, Zap } from "lucide-react";
import { api } from "@/api/client";
import StatusBadge from "@/components/StatusBadge";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/Skeleton";
import type { Service } from "@/types";

export default function Services() {
  const { data, isLoading } = useQuery({
    queryKey: ["services"],
    queryFn: async () => (await api.get<Service[]>("/services")).data,
    refetchInterval: 5000,
  });

  return (
    <>
      <PageHeader
        title="Service health"
        subtitle="Per-service status, owners, thresholds, and environments."
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="surface p-5 space-y-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-48" />
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            ))
          : data?.map((s, idx) => (
              <div
                key={s.id}
                className="surface surface-hover p-5 animate-fade-in-up"
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-accent-500/10 flex items-center justify-center shrink-0 ring-1 ring-accent-500/20">
                      <Server className="h-5 w-5 text-accent-300" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-fg truncate">
                        {s.name}
                      </div>
                      {s.description && (
                        <div className="text-xs text-fg-muted truncate">
                          {s.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <StatusBadge value={s.status} />
                </div>

                <div className="mt-4 pt-3 border-t border-line/60 flex flex-wrap gap-x-4 gap-y-2 text-xs text-fg-muted">
                  <div className="flex items-center gap-1.5">
                    <UserIcon className="h-3 w-3 text-fg-muted" />
                    <span>{s.owner ?? "—"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Globe className="h-3 w-3 text-fg-muted" />
                    <span>{s.environment}</span>
                  </div>
                  <div className="flex items-center gap-1.5 ml-auto">
                    <Zap className="h-3 w-3 text-fg-muted" />
                    <span>
                      <b className="text-fg">{s.error_threshold}</b> /{" "}
                      {s.window_seconds}s
                    </span>
                  </div>
                </div>
              </div>
            ))}
      </div>

      {data && data.length === 0 && (
        <div className="surface">
          <EmptyState
            Icon={Server}
            title="No services yet"
            body="Add one in Admin to start monitoring its logs."
          />
        </div>
      )}
    </>
  );
}
