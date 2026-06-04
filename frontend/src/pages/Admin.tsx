import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Zap, Sparkles, Power, Brain, ShieldCheck } from "lucide-react";
import { api } from "@/api/client";
import StatusBadge from "@/components/StatusBadge";
import { useAuth } from "@/store/auth";
import { useToast } from "@/components/Toaster";
import { PageHeader } from "@/components/PageHeader";
import { LiveDot } from "@/components/LiveDot";
import type { Service } from "@/types";

interface AiHealth {
  enabled: boolean;
  ok: boolean;
  reason?: string;
  model?: string;
  url?: string;
  sample?: string;
}

export default function Admin() {
  const user = useAuth((s) => s.user);
  const isAdmin = user?.role === "admin";
  const qc = useQueryClient();
  const { push } = useToast();

  const services = useQuery({
    queryKey: ["services"],
    queryFn: async () => (await api.get<Service[]>("/services")).data,
    refetchInterval: 5000,
  });

  const sim = useQuery({
    queryKey: ["simulator-status"],
    queryFn: async () =>
      (await api.get<{ enabled: boolean }>("/simulator/status")).data,
    refetchInterval: 5000,
  });

  const aiHealth = useQuery({
    queryKey: ["ai-health"],
    queryFn: async () => (await api.get<AiHealth>("/ai/health")).data,
    refetchInterval: 30_000,
  });

  const [name, setName] = useState("");
  const [owner, setOwner] = useState("");
  const [threshold, setThreshold] = useState(5);
  const [windowS, setWindowS] = useState(60);
  const [environment, setEnvironment] = useState("prod");
  const [error, setError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: async () =>
      (await api.post<Service>("/services", {
        name,
        owner: owner || null,
        error_threshold: threshold,
        window_seconds: windowS,
        environment,
      })).data,
    onSuccess: () => {
      setName("");
      setOwner("");
      qc.invalidateQueries({ queryKey: ["services"] });
      push({ title: "Service created", tone: "success" });
    },
    onError: (e: any) => setError(e?.response?.data?.detail ?? "Create failed"),
  });

  const toggleSim = useMutation({
    mutationFn: async (enabled: boolean) =>
      (await api.post("/simulator/toggle", null, { params: { enabled } })).data,
    onSuccess: (_, enabled) => {
      qc.invalidateQueries({ queryKey: ["simulator-status"] });
      push({
        title: enabled ? "Simulator started" : "Simulator stopped",
        tone: enabled ? "success" : "info",
      });
    },
  });

  const spike = useMutation({
    mutationFn: async (svcId: number) =>
      (await api.post(`/simulator/spike/${svcId}`)).data,
    onSuccess: (_, svcId) =>
      push({
        title: "Error spike queued",
        body: `Service #${svcId} will receive an error burst on the next tick.`,
        tone: "info",
      }),
  });

  const ingestSample = useMutation({
    mutationFn: async (svcId: number) => {
      const reqs = Array.from({ length: 6 }, () =>
        api.post("/logs", {
          service_id: svcId,
          level: "ERROR",
          message: "Database connection timeout (manual injection)",
        }),
      );
      await Promise.all(reqs);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["services"] }),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    create.mutate();
  };

  return (
    <>
      <PageHeader
        title="Admin"
        subtitle="Manage services, alert thresholds, AI engine, and the demo simulator."
      />

      {!isAdmin && (
        <div className="surface p-4 bg-warn-500/10 border-warn-500/30 mb-4 text-sm text-warn-200 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          You're signed in as <b>{user?.role}</b>. Mutations require the{" "}
          <b>admin</b> role.
        </div>
      )}

      {/* Top control cards */}
      <div className="grid md:grid-cols-2 gap-3 mb-4">
        {/* Simulator card */}
        <div className="surface p-5 animate-fade-in-up">
          <div className="flex items-center justify-between mb-3">
            <h2 className="h-section">
              <Zap className="h-4 w-4 text-warn-400" />
              Live demo simulator
            </h2>
            {sim.data?.enabled ? (
              <span className="badge badge-ok">
                <LiveDot tone="ok" />
                running
              </span>
            ) : (
              <span className="badge badge-neutral">
                <span className="badge-dot bg-fg-subtle" />
                stopped
              </span>
            )}
          </div>
          <p className="text-sm text-fg-muted mb-4 leading-relaxed">
            Generates realistic log traffic every 10s across all services. Use{" "}
            <b className="text-fg">Spike errors</b> on any service to drive an
            incident → AI RCA → notification end-to-end.
          </p>
          <button
            className={sim.data?.enabled ? "btn-danger w-full" : "btn-primary w-full"}
            onClick={() => toggleSim.mutate(!sim.data?.enabled)}
            disabled={!isAdmin || toggleSim.isPending}
          >
            <Power className="h-4 w-4" />
            {sim.data?.enabled ? "Stop simulator" : "Start simulator"}
          </button>
        </div>

        {/* AI engine card */}
        <div className="surface p-5 animate-fade-in-up" style={{ animationDelay: "60ms" }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="h-section">
              <Brain className="h-4 w-4 text-accent-300" />
              AI engine
            </h2>
            {aiHealth.data?.ok ? (
              <span className="badge badge-ok">
                <LiveDot tone="ok" />
                watsonx live
              </span>
            ) : aiHealth.data?.enabled ? (
              <span className="badge badge-crit">
                <LiveDot tone="crit" />
                watsonx error
              </span>
            ) : (
              <span className="badge badge-warn">
                <LiveDot tone="warn" />
                stub mode
              </span>
            )}
          </div>

          {aiHealth.data?.ok ? (
            <div className="text-sm space-y-2">
              <div className="flex items-center gap-2 text-fg-muted">
                <span className="text-fg-muted">Model</span>
                <code className="kbd">{aiHealth.data.model}</code>
              </div>
              <div className="flex items-center gap-2 text-fg-muted">
                <span className="text-fg-muted">Region</span>
                <code className="kbd">{aiHealth.data.url}</code>
              </div>
              <div className="text-xs text-fg-muted pt-2 border-t border-line/60 mt-3">
                Granite-3-8b is generating live LLM root-cause summaries.
              </div>
            </div>
          ) : aiHealth.data?.enabled ? (
            <div className="text-sm text-crit-300 break-words">
              {aiHealth.data?.reason}
            </div>
          ) : (
            <div className="text-sm space-y-2">
              <div className="text-fg font-semibold">
                Rule-based engine is active.
              </div>
              <p className="text-fg-muted leading-relaxed">
                AI Root-Cause Analysis is{" "}
                <b className="text-ok-300">working</b> — every new incident is
                automatically summarized.
              </p>
              <div className="text-xs text-fg-muted pt-2 border-t border-line/60 mt-3 leading-relaxed">
                To switch to IBM Granite-3-8b, set{" "}
                <code className="kbd">WATSONX_ENABLED=true</code> +{" "}
                <code className="kbd">WATSONX_API_KEY</code> +{" "}
                <code className="kbd">WATSONX_PROJECT_ID</code> in{" "}
                <code className="kbd">.env</code>, then restart.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add service form */}
      <section className="surface p-5 mb-4 animate-fade-in-up" style={{ animationDelay: "120ms" }}>
        <h2 className="h-section mb-4">
          <Plus className="h-4 w-4 text-accent-300" />
          Add a service
        </h2>
        <form onSubmit={onSubmit} className="grid md:grid-cols-12 gap-3">
          <div className="md:col-span-4">
            <label className="input-label">Name</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. checkout-service"
              required
            />
          </div>
          <div className="md:col-span-3">
            <label className="input-label">Owner</label>
            <input
              className="input"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="team-payments"
            />
          </div>
          <div className="md:col-span-2">
            <label className="input-label">Err threshold</label>
            <input
              className="input"
              type="number"
              min={1}
              value={threshold}
              onChange={(e) => setThreshold(parseInt(e.target.value))}
            />
          </div>
          <div className="md:col-span-1">
            <label className="input-label">Win (s)</label>
            <input
              className="input"
              type="number"
              min={10}
              value={windowS}
              onChange={(e) => setWindowS(parseInt(e.target.value))}
            />
          </div>
          <div className="md:col-span-2">
            <label className="input-label">Environment</label>
            <select
              className="input"
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
            >
              <option>prod</option>
              <option>staging</option>
              <option>dev</option>
            </select>
          </div>
          <div className="md:col-span-12 flex items-center gap-3 pt-1">
            <button
              type="submit"
              className="btn-primary"
              disabled={!isAdmin || create.isPending}
            >
              <Plus className="h-4 w-4" />
              {create.isPending ? "Adding…" : "Add service"}
            </button>
            {error && (
              <span className="text-sm text-crit-300">{error}</span>
            )}
          </div>
        </form>
      </section>

      {/* Service table */}
      <section className="surface overflow-hidden p-0 animate-fade-in-up" style={{ animationDelay: "160ms" }}>
        <div className="px-5 py-3 border-b border-line">
          <h2 className="h-section">
            <Sparkles className="h-4 w-4 text-fg-muted" />
            Services ({services.data?.length ?? 0})
          </h2>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Env</th>
              <th>Threshold / Window</th>
              <th>Demo actions</th>
            </tr>
          </thead>
          <tbody>
            {services.data?.map((s) => (
              <tr key={s.id}>
                <td className="font-medium text-fg">{s.name}</td>
                <td><StatusBadge value={s.status} /></td>
                <td className="text-fg-muted">{s.environment}</td>
                <td className="text-fg-muted">
                  <b className="text-fg">{s.error_threshold}</b> /{" "}
                  {s.window_seconds}s
                </td>
                <td>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="btn-secondary btn-sm"
                      onClick={() => spike.mutate(s.id)}
                      disabled={spike.isPending}
                    >
                      <Zap className="h-3 w-3" />
                      Spike errors
                    </button>
                    <button
                      className="btn-ghost btn-sm"
                      onClick={() => ingestSample.mutate(s.id)}
                      disabled={ingestSample.isPending}
                    >
                      Inject 6
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
