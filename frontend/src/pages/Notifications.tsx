import { useQuery } from "@tanstack/react-query";
import { Bell, Mail, MessageSquare, CheckCircle2, XCircle } from "lucide-react";
import { api } from "@/api/client";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/Skeleton";

interface Notif {
  id: number;
  channel: string;
  target: string;
  subject: string;
  body: string;
  sent: boolean;
  incident_id: number | null;
  created_at: string;
}

export default function Notifications() {
  const q = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => (await api.get<Notif[]>("/notifications")).data,
    refetchInterval: 10_000,
  });

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Audit log of every alert fired across Slack, email, and in-app."
      />

      <div className="surface p-2">
        {q.isLoading ? (
          <div className="p-3 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : !q.data?.length ? (
          <EmptyState
            Icon={Bell}
            title="No notifications yet"
            body="Notifications appear here when incidents fire."
          />
        ) : (
          <ul className="divide-y divide-line/60">
            {q.data.map((n, idx) => {
              const Icon = n.channel === "email" ? Mail : MessageSquare;
              return (
                <li
                  key={n.id}
                  className="py-3 px-3 flex gap-3 hover:bg-surface-3/60 transition-colors rounded-lg animate-fade-in-up"
                  style={{ animationDelay: `${idx * 25}ms` }}
                >
                  <div className="h-9 w-9 rounded-lg bg-surface-3 ring-1 ring-line flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-fg-muted" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="badge badge-neutral">{n.channel}</span>
                      {n.sent ? (
                        <span className="badge badge-ok">
                          <CheckCircle2 className="h-3 w-3" />
                          sent
                        </span>
                      ) : (
                        <span className="badge badge-crit">
                          <XCircle className="h-3 w-3" />
                          failed
                        </span>
                      )}
                      <span className="text-xs text-fg-muted ml-auto">
                        {new Date(n.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="font-medium text-fg mt-1">{n.subject}</div>
                    <div className="text-sm text-fg-muted">{n.body}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
