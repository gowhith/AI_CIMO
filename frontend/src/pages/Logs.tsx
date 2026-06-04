import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, ScrollText } from "lucide-react";
import { api } from "@/api/client";
import StatusBadge from "@/components/StatusBadge";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/Skeleton";
import type { LogEntry, Service } from "@/types";

export default function Logs() {
  const [serviceId, setServiceId] = useState<string>("");
  const [level, setLevel] = useState<string>("");
  const [q, setQ] = useState<string>("");

  const services = useQuery({
    queryKey: ["services"],
    queryFn: async () => (await api.get<Service[]>("/services")).data,
  });

  const logs = useQuery({
    queryKey: ["logs", serviceId, level, q],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (serviceId) params.service_id = serviceId;
      if (level) params.level = level;
      if (q) params.q = q;
      return (await api.get<LogEntry[]>("/logs", { params })).data;
    },
    refetchInterval: 5000,
  });

  return (
    <>
      <PageHeader
        title="Logs"
        subtitle="Filter and search log streams across services."
      />

      <div className="surface p-4 mb-4">
        <div className="flex items-center gap-2 mb-3 text-fg-muted text-xs font-semibold uppercase tracking-wider">
          <Filter className="h-3.5 w-3.5" />
          Filters
        </div>
        <div className="grid md:grid-cols-4 gap-3">
          <select
            className="input"
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
          >
            <option value="">All services</option>
            {services.data?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            className="input"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
          >
            <option value="">All levels</option>
            {["INFO", "WARNING", "ERROR", "CRITICAL"].map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-muted" />
            <input
              className="input pl-9"
              placeholder="Search messages…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="surface overflow-hidden p-0">
        <table className="data-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Level</th>
              <th>Service</th>
              <th>Message</th>
              <th>Trace</th>
            </tr>
          </thead>
          <tbody className="font-mono text-xs">
            {logs.isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={5}>
                    <Skeleton className="h-4 w-full" />
                  </td>
                </tr>
              ))
            ) : logs.data?.length ? (
              logs.data.map((l) => (
                <tr key={l.id}>
                  <td className="whitespace-nowrap text-fg-muted">
                    {new Date(l.timestamp).toLocaleTimeString()}
                  </td>
                  <td>
                    <StatusBadge value={l.level} size="sm" />
                  </td>
                  <td className="text-fg-muted">
                    {services.data?.find((s) => s.id === l.service_id)?.name ??
                      l.service_id}
                  </td>
                  <td className="text-fg whitespace-pre-wrap break-all">
                    {l.message}
                  </td>
                  <td className="text-fg-muted">{l.trace_id ?? "—"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5}>
                  <EmptyState
                    Icon={ScrollText}
                    title="No logs"
                    body="No log entries match your current filters."
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
