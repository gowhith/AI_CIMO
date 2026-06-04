import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import {
  AlertOctagon,
  ArrowLeft,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  RefreshCw,
  Brain,
} from "lucide-react";
import { api } from "@/api/client";
import StatusBadge from "@/components/StatusBadge";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/Skeleton";
import type { Incident, IncidentSummary } from "@/types";

export default function IncidentDetail() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const incident = useQuery({
    queryKey: ["incident", id],
    queryFn: async () => (await api.get<Incident>(`/incidents/${id}`)).data,
  });
  const summary = useQuery({
    queryKey: ["incident-summary", id],
    queryFn: async () => {
      try {
        return (await api.get<IncidentSummary>(`/incidents/${id}/summary`)).data;
      } catch {
        return null;
      }
    },
  });

  const analyze = useMutation({
    mutationFn: async () => (await api.post(`/incidents/${id}/analyze`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["incident-summary", id] }),
  });
  const updateStatus = useMutation({
    mutationFn: async (status: string) =>
      (await api.patch(`/incidents/${id}`, { status })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["incident", id] }),
  });
  const feedback = useMutation({
    mutationFn: async (score: number) =>
      (await api.post(`/incidents/${id}/feedback`, { score })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["incident-summary", id] }),
  });

  if (incident.isLoading)
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  if (!incident.data) return <div className="surface p-6">Incident not found.</div>;
  const i = incident.data;
  const s = summary.data;

  return (
    <>
      <Link
        to="/incidents"
        className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg transition-colors mb-4 group"
      >
        <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
        Back to incidents
      </Link>

      {/* Incident header */}
      <div className="surface p-6 mb-4 animate-fade-in-up">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-lg bg-crit-500/15 text-crit-400 flex items-center justify-center shrink-0 ring-1 ring-crit-500/30">
            <AlertOctagon className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] text-fg-subtle font-mono tracking-wider uppercase">
              Incident #{i.id}
            </div>
            <h1 className="h-page mt-1">{i.title}</h1>
            {i.description && (
              <p className="text-sm text-fg-muted mt-2 leading-relaxed">
                {i.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <StatusBadge value={i.severity} />
              <StatusBadge value={i.status} />
              <span className="text-xs text-fg-muted ml-1">
                opened {new Date(i.created_at).toLocaleString()}
              </span>
            </div>
          </div>
          <div className="hidden md:flex flex-col gap-2 shrink-0 w-32">
            {["investigating", "resolved", "closed"].map((st) => (
              <button
                key={st}
                className="btn-secondary text-xs w-full justify-start"
                onClick={() => updateStatus.mutate(st)}
                disabled={updateStatus.isPending || i.status === st}
              >
                Mark {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* AI RCA panel */}
      <section
        className="surface p-6 bg-gradient-to-br from-accent-900/25 via-surface-2 to-surface-2 border-accent-500/25 animate-fade-in-up"
        style={{ animationDelay: "60ms" }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-fg flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-accent-500/15 flex items-center justify-center ring-1 ring-accent-500/30">
              <Brain className="h-4 w-4 text-accent-300" />
            </div>
            AI root-cause analysis
          </h2>
          <button
            className="btn-primary btn-sm"
            onClick={() => analyze.mutate()}
            disabled={analyze.isPending}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${analyze.isPending ? "animate-spin" : ""}`}
            />
            {analyze.isPending ? "Analyzing…" : s ? "Re-analyze" : "Analyze now"}
          </button>
        </div>

        {!s ? (
          <div className="text-center py-10 text-fg-muted">
            <Sparkles className="h-6 w-6 mx-auto mb-2 text-fg-muted" />
            <div>No AI summary yet. Click <b className="text-fg">Analyze now</b>.</div>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <div className="label-kpi mb-1.5">Summary</div>
              <p className="text-[15px] text-fg leading-relaxed">
                {s.ai_summary}
              </p>
            </div>
            <div className="border-t border-line/60 pt-4">
              <div className="label-kpi mb-1.5">Possible root cause</div>
              <p className="text-[15px] text-fg leading-relaxed">
                {s.possible_root_cause}
              </p>
            </div>
            <div className="border-t border-line/60 pt-4">
              <div className="label-kpi mb-1.5">Recommended debugging steps</div>
              <pre className="text-[15px] text-fg whitespace-pre-wrap font-sans leading-relaxed">
                {s.recommended_steps}
              </pre>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-line/60">
              <div className="flex flex-wrap items-center gap-3 text-xs text-fg-muted">
                <span className="badge badge-neutral">
                  <span className="text-fg-muted">Model</span>
                  <code className="ml-1 text-fg">{s.model_used}</code>
                </span>
                <span className="badge badge-neutral">
                  <span className="text-fg-muted">Confidence</span>
                  <b className="ml-1 text-fg">
                    {(s.confidence_score * 100).toFixed(0)}%
                  </b>
                </span>
                {s.feedback_score != null && (
                  <span className="badge badge-neutral">
                    Rated{" "}
                    {s.feedback_score > 0
                      ? "👍 useful"
                      : s.feedback_score < 0
                      ? "👎 off"
                      : "—"}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  className="btn-secondary btn-sm"
                  onClick={() => feedback.mutate(1)}
                  disabled={feedback.isPending}
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                  Useful
                </button>
                <button
                  className="btn-secondary btn-sm"
                  onClick={() => feedback.mutate(-1)}
                  disabled={feedback.isPending}
                >
                  <ThumbsDown className="h-3.5 w-3.5" />
                  Off
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Mobile actions */}
      <div className="md:hidden flex gap-2 mt-4">
        {["investigating", "resolved", "closed"].map((st) => (
          <button
            key={st}
            className="btn-secondary btn-sm flex-1"
            onClick={() => updateStatus.mutate(st)}
            disabled={updateStatus.isPending || i.status === st}
          >
            {st}
          </button>
        ))}
      </div>
    </>
  );
}
