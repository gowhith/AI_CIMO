import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { AlertOctagon, CheckCircle2, ChevronRight } from "lucide-react";
import { api } from "@/api/client";
import StatusBadge from "@/components/StatusBadge";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/Skeleton";
import type { Incident, Service } from "@/types";

export default function Incidents() {
  const services = useQuery({
    queryKey: ["services"],
    queryFn: async () => (await api.get<Service[]>("/services")).data,
  });
  const incidents = useQuery({
    queryKey: ["incidents"],
    queryFn: async () => (await api.get<Incident[]>("/incidents")).data,
    refetchInterval: 5000,
  });

  const svcName = (id: number) =>
    services.data?.find((s) => s.id === id)?.name ?? `#${id}`;

  return (
    <>
      <PageHeader
        title="Incidents"
        subtitle="All detected service failures, sorted by recency."
      />

      <div className="space-y-2">
        {incidents.isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))
        ) : incidents.data?.length ? (
          incidents.data.map((i, idx) => (
            <Link
              key={i.id}
              to={`/incidents/${i.id}`}
              className="surface surface-hover p-4 flex items-center gap-4 group animate-fade-in-up"
              style={{ animationDelay: `${idx * 30}ms` }}
            >
              <div
                className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ring-1 ${
                  i.severity === "critical"
                    ? "bg-crit-500/15 text-crit-400 ring-crit-500/30"
                    : i.severity === "high"
                    ? "bg-warn-500/15 text-warn-400 ring-warn-500/30"
                    : "bg-accent-500/15 text-accent-400 ring-accent-500/30"
                }`}
              >
                <AlertOctagon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-fg-muted font-mono">
                    #{i.id}
                  </span>
                  <span className="font-semibold text-fg truncate group-hover:text-accent-200 transition-colors">
                    {i.title}
                  </span>
                </div>
                <div className="text-xs text-fg-muted mt-0.5">
                  <span className="text-fg-muted">{svcName(i.service_id)}</span>{" "}
                  · {new Date(i.created_at).toLocaleString()}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge value={i.severity} />
                <StatusBadge value={i.status} />
                <ChevronRight className="h-4 w-4 text-fg-muted group-hover:text-fg group-hover:translate-x-0.5 transition-all" />
              </div>
            </Link>
          ))
        ) : (
          <div className="surface">
            <EmptyState
              Icon={CheckCircle2}
              title="All systems nominal"
              body="No incidents detected. The dashboard will update automatically when one is created."
            />
          </div>
        )}
      </div>
    </>
  );
}
