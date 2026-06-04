import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";
import { api } from "@/api/client";
import { useAuth } from "@/store/auth";

export default function Login() {
  const navigate = useNavigate();
  const setSession = useAuth((s) => s.setSession);
  const [email, setEmail] = useState("demo@aicimo.io");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("ai_cimo_token", data.access_token);
      const me = await api.get("/auth/me");
      setSession(data.access_token, me.data);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-surface-0">
      <div className="w-full max-w-md animate-fade-in-up">
        <Link to="/" className="flex items-center gap-2.5 justify-center mb-8">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-accent-400 to-accent-700 flex items-center justify-center shadow-glow">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="font-bold text-fg text-lg">AI-CIMO</div>
        </Link>

        <form onSubmit={onSubmit} className="surface p-6 space-y-5">
          <div>
            <h1 className="text-2xl font-bold text-fg">Welcome back</h1>
            <p className="text-sm text-fg-muted mt-1">
              Sign in to your workspace.
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-crit-500/30 bg-crit-500/10 px-3 py-2 text-sm text-crit-300">
              {error}
            </div>
          )}

          <div>
            <label className="input-label">Email</label>
            <input
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="input-label">Password</label>
            <input
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              minLength={8}
            />
          </div>
          <button className="btn-primary w-full btn-lg" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>

          <div className="text-center text-sm text-fg-muted">
            No account?{" "}
            <Link
              to="/signup"
              className="text-accent-300 hover:text-accent-200 font-semibold"
            >
              Create one
            </Link>
          </div>

          <div className="border-t border-line/60 pt-4 text-center text-xs text-fg-muted">
            Demo account pre-filled:{" "}
            <code className="kbd">demo@aicimo.io</code> /{" "}
            <code className="kbd">demo1234</code>
          </div>
        </form>
      </div>
    </div>
  );
}
