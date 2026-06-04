import { useCallback, useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Server,
  ScrollText,
  AlertOctagon,
  GitBranch,
  Bell,
  Settings,
  LogOut,
  Sparkles,
  Search,
} from "lucide-react";
import clsx from "clsx";
import { useAuth } from "@/store/auth";
import { useIncidentSocket } from "@/hooks/useIncidentSocket";
import { useToast } from "@/components/Toaster";
import { LiveDot } from "@/components/LiveDot";

const navGroups = [
  {
    label: "Overview",
    items: [{ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Monitor",
    items: [
      { to: "/services", label: "Services", icon: Server },
      { to: "/logs", label: "Logs", icon: ScrollText },
      { to: "/incidents", label: "Incidents", icon: AlertOctagon },
    ],
  },
  {
    label: "Activity",
    items: [
      { to: "/deployments", label: "Deployments", icon: GitBranch },
      { to: "/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    label: "Manage",
    items: [{ to: "/admin", label: "Admin", icon: Settings }],
  },
];

function useNow(everyMs = 30_000) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), everyMs);
    return () => clearInterval(t);
  }, [everyMs]);
  return now;
}

function pageTitleFromPath(path: string): string {
  const seg = path.split("/").filter(Boolean)[0];
  return seg ? seg[0].toUpperCase() + seg.slice(1) : "Dashboard";
}

export default function Layout() {
  const { user, clear } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { push } = useToast();
  const now = useNow();

  useIncidentSocket(
    useCallback(
      (e) => {
        if (e.incident_id) {
          push({
            title: `New incident #${e.incident_id}`,
            body: e.title ?? "A new incident was detected.",
            tone: "error",
          });
        }
      },
      [push],
    ),
  );

  const onLogout = () => {
    clear();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex bg-surface-0">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-line bg-surface-1">
        <Link
          to="/dashboard"
          className="flex items-center gap-2.5 px-5 py-5 border-b border-line"
        >
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-accent-400 to-accent-700 flex items-center justify-center shadow-glow">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div className="leading-tight">
            <div className="font-bold text-fg">AI-CIMO</div>
            <div className="text-[10px] text-fg-muted tracking-wider uppercase font-semibold">
              Observability
            </div>
          </div>
        </Link>

        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
          {navGroups.map((g) => (
            <div key={g.label}>
              <div className="px-3 mb-1.5 text-[10px] uppercase tracking-wider text-fg-muted font-semibold">
                {g.label}
              </div>
              <div className="space-y-0.5">
                {g.items.map((n) => (
                  <NavLink
                    key={n.to}
                    to={n.to}
                    className={({ isActive }) =>
                      clsx("nav-link", isActive && "nav-link-active")
                    }
                  >
                    <n.icon className="h-4 w-4" />
                    {n.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-line p-3">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-3 transition-colors group"
          >
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {user?.email?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="text-xs font-semibold text-fg truncate">
                {user?.email}
              </div>
              <div className="text-[10px] text-accent-300 uppercase tracking-wider font-semibold">
                {user?.role}
              </div>
            </div>
            <LogOut className="h-4 w-4 text-fg-muted group-hover:text-fg transition-colors shrink-0" />
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0 bg-surface-0">
        {/* Top bar */}
        <header className="sticky top-0 z-10 border-b border-line bg-surface-0/90 backdrop-blur-md">
          <div className="flex items-center justify-between gap-4 px-6 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <h2 className="text-base font-semibold text-fg truncate">
                {pageTitleFromPath(location.pathname)}
              </h2>
              <span className="badge badge-neutral hidden sm:inline-flex">
                <LiveDot tone="ok" />
                Live
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative hidden md:block">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-fg-muted" />
                <input
                  type="text"
                  placeholder="Search…"
                  className="input pl-8 py-1.5 text-xs w-56"
                />
              </div>
              <div className="text-[11px] text-fg-subtle tabular-nums">
                {now.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-6 py-6 max-w-[1400px] w-full mx-auto animate-fade-in">
          <Outlet />
        </main>

        <footer className="text-center text-[11px] text-fg-muted py-4 border-t border-line/60">
          AI-CIMO · v0.1.0 · IBM-aligned cloud observability
        </footer>
      </div>
    </div>
  );
}
