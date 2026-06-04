import { Link } from "react-router-dom";
import {
  Sparkles,
  Activity,
  Brain,
  Zap,
  ArrowRight,
  Shield,
} from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-surface-0">
      <header className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-accent-400 to-accent-700 flex items-center justify-center shadow-glow">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="font-bold text-fg text-lg">AI-CIMO</div>
        </div>
        <div className="flex gap-2">
          <Link to="/login" className="btn-ghost">
            Sign in
          </Link>
          <Link to="/signup" className="btn-primary">
            Get started
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-6 py-24 text-center animate-fade-in-up">
        <div className="inline-flex items-center gap-2 rounded-full border border-accent-500/30 bg-accent-500/10 px-3 py-1 text-xs font-semibold text-accent-300 mb-6">
          <Activity className="h-3 w-3" />
          Built with IBM watsonx.ai + Granite
        </div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-fg leading-[1.05]">
          AI-powered incident management
          <br />
          for{" "}
          <span className="bg-gradient-to-r from-accent-300 to-accent-500 bg-clip-text text-transparent">
            cloud-native teams
          </span>
          .
        </h1>
        <p className="text-lg text-fg-muted mt-6 max-w-2xl mx-auto leading-relaxed">
          Detect outages from log streams, generate root-cause summaries in
          plain language, and triage incidents — all from a single dashboard.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link to="/signup" className="btn-primary btn-lg">
            Try the live demo
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a href="#how" className="btn-secondary btn-lg">
            See how it works
          </a>
        </div>
      </section>

      <section
        id="how"
        className="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-3 gap-4"
      >
        {[
          {
            Icon: Activity,
            title: "Detect",
            body: "Rule-based detector watches log streams and creates Critical incidents the moment errors cross threshold.",
            tone: "text-crit-400 bg-crit-500/10 ring-crit-500/20",
          },
          {
            Icon: Brain,
            title: "Diagnose",
            body: "IBM watsonx.ai writes the incident summary, names the likely root cause, and produces a numbered debugging checklist.",
            tone: "text-accent-300 bg-accent-500/10 ring-accent-500/20",
          },
          {
            Icon: Zap,
            title: "Resolve",
            body: "Engineers see correlated deployments, drill into logs, and update incident status — no tab-switching required.",
            tone: "text-ok-400 bg-ok-500/10 ring-ok-500/20",
          },
        ].map((f, idx) => (
          <div
            key={f.title}
            className="surface surface-hover p-6 animate-fade-in-up"
            style={{ animationDelay: `${idx * 80}ms` }}
          >
            <div
              className={`h-10 w-10 rounded-lg flex items-center justify-center ring-1 mb-4 ${f.tone}`}
            >
              <f.Icon className="h-5 w-5" />
            </div>
            <div className="text-xl font-semibold text-fg mb-2">{f.title}</div>
            <p className="text-sm text-fg-muted leading-relaxed">{f.body}</p>
          </div>
        ))}
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16 text-center">
        <h2 className="text-3xl font-bold text-fg mb-3">
          Enterprise tech, end-to-end
        </h2>
        <p className="text-fg-muted mb-8">
          Cloud-native, observability-first, IBM-aligned.
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {[
            "React",
            "TypeScript",
            "Tailwind",
            "FastAPI",
            "PostgreSQL",
            "Redis",
            "Celery",
            "Docker",
            "Kubernetes",
            "IBM watsonx.ai",
            "Prometheus",
            "Grafana",
            "GitHub Actions",
          ].map((t) => (
            <span
              key={t}
              className="surface-flat px-3 py-1.5 text-xs font-medium text-fg-muted hover:text-fg hover:border-line-strong transition-colors"
            >
              {t}
            </span>
          ))}
        </div>
      </section>

      <footer className="max-w-6xl mx-auto px-6 py-8 text-center text-xs text-fg-muted border-t border-line/60">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Shield className="h-3.5 w-3.5" />
          AI-CIMO v0.1.0
        </div>
        IBM-aligned cloud observability platform · For engineering teams
      </footer>
    </div>
  );
}
