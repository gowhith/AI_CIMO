import { useQuery } from "@tanstack/react-query";
import { GitBranch, GitCommit } from "lucide-react";
import { api } from "@/api/client";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/Skeleton";
import type { Deployment, Service } from "@/types";

export default function Deployments() {
  const services = useQuery({
    queryKey: ["services"],
    queryFn: async () => (await api.get<Service[]>("/services")).data,
  });
  const deployments = useQuery({
    queryKey: ["deployments"],
    queryFn: async () => (await api.get<Deployment[]>("/deployments")).data,
    refetchInterval: 10_000,
  });

  return (
    <>
      <PageHeader
        title="Deployment history"
        subtitle="Releases per service — useful for correlating incidents to deploys."
      />

      <div className="surface overflow-hidden p-0">
        <table className="data-table">
          <thead>
            <tr>
              <th>When</th>
              <th>Service</th>
              <th>Version</th>
              <th>Commit</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {deployments.isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={5}>
                    <Skeleton className="h-4 w-full" />
                  </td>
                </tr>
              ))
            ) : deployments.data?.length ? (
              deployments.data.map((d) => (
                <tr key={d.id}>
                  <td className="text-fg-muted whitespace-nowrap">
                    {new Date(d.deployed_at).toLocaleString()}
                  </td>
                  <td className="text-fg font-medium">
                    {services.data?.find((s) => s.id === d.service_id)?.name ??
                      d.service_id}
                  </td>
                  <td>
                    <span className="badge badge-accent">
                      <GitBranch className="h-3 w-3" />
                      {d.version}
                    </span>
                  </td>
                  <td className="font-mono text-xs text-fg-muted">
                    <div className="flex items-center gap-1">
                      <GitCommit className="h-3 w-3 text-fg-muted" />
                      {d.commit_id ?? "—"}
                    </div>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        d.status === "success" ? "badge-ok" : "badge-crit"
                      }`}
                    >
                      {d.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5}>
                  <EmptyState
                    Icon={GitBranch}
                    title="No deployments recorded"
                    body="Deployments will appear here once your CI posts to /api/v1/deployments."
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
