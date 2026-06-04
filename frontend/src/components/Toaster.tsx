import { createContext, useCallback, useContext, useState } from "react";
import { AlertOctagon, CheckCircle2, Info, X } from "lucide-react";
import clsx from "clsx";

interface Toast {
  id: number;
  title: string;
  body?: string;
  tone?: "info" | "error" | "success";
}

interface Ctx {
  push: (t: Omit<Toast, "id">) => void;
}

const ToastCtx = createContext<Ctx | null>(null);

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be inside <ToastProvider>");
  return ctx;
}

const toneCfg = {
  info: {
    ring: "ring-accent-500/30",
    icon: "text-accent-300",
    Icon: Info,
  },
  success: {
    ring: "ring-ok-500/30",
    icon: "text-ok-400",
    Icon: CheckCircle2,
  },
  error: {
    ring: "ring-crit-500/30",
    icon: "text-crit-400",
    Icon: AlertOctagon,
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((t: Omit<Toast, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((cur) => [...cur, { id, ...t }]);
    setTimeout(
      () => setToasts((cur) => cur.filter((x) => x.id !== id)),
      6000,
    );
  }, []);

  const close = (id: number) =>
    setToasts((cur) => cur.filter((x) => x.id !== id));

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2 w-96 max-w-[calc(100vw-2rem)]">
        {toasts.map((t) => {
          const cfg = toneCfg[t.tone ?? "info"];
          return (
            <div
              key={t.id}
              className={clsx(
                "animate-fade-in-up surface ring-1 p-4 shadow-lg flex gap-3",
                cfg.ring,
              )}
            >
              <cfg.Icon className={clsx("h-5 w-5 mt-0.5 shrink-0", cfg.icon)} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-fg">{t.title}</div>
                {t.body && (
                  <div className="text-xs text-fg-muted mt-0.5 break-words">
                    {t.body}
                  </div>
                )}
              </div>
              <button
                onClick={() => close(t.id)}
                className="text-fg-muted hover:text-fg transition-colors shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}
