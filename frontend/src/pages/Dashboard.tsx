import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  GitBranch,
  Server,
  Sparkles,
  Zap,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";
import { api } from "@/api/client";
import StatusBadge from "@/components/StatusBadge";
import { Stat } from "@/components/Stat";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/Skeleton";
import type { DashboardSummary, Incident, Service } from "@/types";

function spark(seed: number) {
  return Array.from({ length: 16 }, (_, i) => ({
    i,
    v: Math.max(2, Math.round(50 + 30 * Math.sin(seed + i * 0.6) + (i % 3) * 5)),
  }));
}

function Sparkline({ data, color = "#4585ff" }: { data: { i: number; v: number }[]; color?: string }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`sp-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#sp-${color})`}
          isAnimationActive
          animationDuration={600}
        />
        <Tooltip
          contentStyle={{
            background: "#11141b",
            border: "1px solid #1c2029",
            borderRadius: 8,
            fontSize: 11,
            color: "#fafbfc",
          }}
          cursor={{ stroke: color, strokeOpacity: 0.4 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default function Dashboard() {
  const summary = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: async () => (await api.get<DashboardSummary>("/dashboard/summary")).data,
    refetchInterval: 5000,
  });

  const services = useQuery({
    queryKey: ["services"],
    queryFn: async () => (await api.get<Service[]>("/services")).data,
    refetchInterval: 5000,
  });

  const incidents = useQuery({
    queryKey: ["incidents"],
    queryFn: async () =>
      (await api.get<Incident[]>("/incidents", { params: { limit: 6 } })).data,
    refetchInterval: 5000,
  });

  const sparks = useMemo(
    () => [spark(1), spark(2), spark(3), spark(4), spark(5), spark(6), spark(7), spark(8)],
    [],
  );

  const s = summary.data;

  return (
    <>
      <PageHeader
        title="Operations dashboard"
        subtitle="Live system health, incidents, and service performance."
        actions={
          <>
            <Link to="/services" className="btn-secondary">
              <Server className="h-4 w-4" />
              Services
            </Link>
            <Link to="/incidents" className="btn-primary">
              <AlertTriangle className="h-4 w-4" />
              View incidents
            </Link>
          </>
        }
      />

      {/* KPI row 1 — service health */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <Stat
          label="Services"
          value={s?.services_monitored}
          loading={summary.isLoading}
          Icon={Server}
          tone="accent"
          spark={<Sparkline data={sparks[0]} color="#4585ff" />}
        />
        <Stat
          label="Healthy"
          value={s?.healthy}
          loading={summary.isLoading}
          Icon={CheckCircle2}
          tone="ok"
          spark={<Sparkline data={sparks[1]} color="#34d399" />}
        />
        <Stat
          label="Warning"
          value={s?.warning}
          loading={summary.isLoading}
          Icon={AlertTriangle}
          tone="warn"
          spark={<Sparkline data={sparks[2]} color="#fbbf24" />}
        />
        <Stat
          label="Critical"
          value={s?.critical}
          loading={summary.isLoading}
          Icon={Zap}
          tone="crit"
          spark={<Sparkline data={sparks[3]} color="#f87171" />}
        />
      </div>

      {/* KPI row 2 — incident + deploy + latency */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Stat
          label="Open incidents"
          value={s?.open_incidents}
          loading={summary.isLoading}
          Icon={AlertTriangle}
          tone="crit"
        />
        <Stat
          label="Resolved"
          value={s?.resolved_incidents}
          loading={summary.isLoading}
          Icon={CheckCircle2}
          tone="ok"
        />
        <Stat
          label="Deploys (24h)"
          value={s?.recent_deployments_24h}
          loading={summary.isLoading}
          Icon={GitBranch}
          tone="accent"
        />
        <Stat
          label="Avg latency (ms)"
          value={s?.avg_response_time_ms}
          loading={summary.isLoading}
          Icon={Clock}
          tone="neutral"
          hint="p95 last hour"
        />
      </div>

      {/* Two-column lists */}
      <div className="grid lg:grid-cols-2 gap-4">
        <section className="surface p-5 animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="h-section">
              <Server className="h-4 w-4 text-fg-muted" />
              Services
            </h2>
            <Link
              to="/services"
              className="text-xs font-semibold text-accent-300 hover:text-accent-200 inline-flex items-center gap-1 group"
            >
              View all
              <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          <div className="space-y-1">
            {services.isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20 ml-auto" />
                </div>
              ))
            ) : services.data?.length ? (
              services.data.slice(0, 8).map((svc) => (
                <div
                  key={svc.id}
                  className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-surface-3 transition-colors group cursor-default"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-sm text-fg group-hover:text-accent-200 transition-colors truncate">
                      {svc.name}
                    </div>
                    <div className="text-xs text-fg-muted truncate">
                      {svc.owner ?? "—"} · {svc.environment}
                    </div>
                  </div>
                  <StatusBadge value={svc.status} />
                </div>
              ))
            ) : (
              <EmptyState
                Icon={Server}
                title="No services yet"
                body="Add one in Admin to begin monitoring."
              />
            )}
          </div>
        </section>

        <section className="surface p-5 animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="h-section">
              <AlertTriangle className="h-4 w-4 text-fg-muted" />
              Recent incidents
            </h2>
            <Link
              to="/incidents"
              className="text-xs font-semibold text-accent-300 hover:text-accent-200 inline-flex items-center gap-1 group"
            >
              View all
              <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          <div className="space-y-1">
            {incidents.isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))
            ) : incidents.data?.length ? (
              incidents.data.map((i) => (
                <Link
                  key={i.id}
                  to={`/incidents/${i.id}`}
                  className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-surface-3 transition-colors group"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-sm text-fg group-hover:text-accent-200 transition-colors truncate">
                      <span className="text-fg-muted font-mono">#{i.id}</span>{" "}
                      {i.title}
                    </div>
                    <div className="text-xs text-fg-muted">
                      {new Date(i.created_at).toLocaleString()}
                    </div>
                  </div>
                  <StatusBadge value={i.status} />
                </Link>
              ))
            ) : (
              <EmptyState
                Icon={CheckCircle2}
                title="All systems nominal"
                body="No incidents at the moment."
              />
            )}
          </div>
        </section>
      </div>

      {/* How it works callout */}
      <section className="surface mt-4 p-5 bg-gradient-to-br from-accent-900/30 via-surface-2 to-surface-2 border-accent-500/25 animate-fade-in-up">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg bg-accent-500/15 flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4 text-accent-300" />
          </div>
          <div>
            <div className="font-semibold text-fg mb-1.5">How AI-CIMO works</div>
            <ol className="text-sm text-fg-muted list-decimal pl-4 space-y-1 leading-relaxed">
              <li>
                Microservices ship logs to{" "}
                <code className="kbd">POST /api/v1/logs</code>.
              </li>
              <li>Detector scans every 30s and creates Critical incidents when errors cross threshold.</li>
              <li>
                AI Engine writes a plain-language root-cause summary{" "}
                <span className="badge badge-accent">watsonx.ai / rule-based</span>.
              </li>
              <li>Engineers triage from this dashboard with debugging steps laid out.</li>
            </ol>
          </div>
        </div>
        <div className="absolute mt-4">
          <Link
            to="/admin"
            className="btn-ghost text-xs"
          >
            <Activity className="h-3.5 w-3.5" />
            Open simulator controls
          </Link>
        </div>
      </section>
    </>
  );
}
