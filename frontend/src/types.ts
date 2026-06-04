export interface Service {
  id: number;
  name: string;
  description: string | null;
  owner: string | null;
  status: "healthy" | "warning" | "critical" | "unknown";
  environment: string;
  error_threshold: number;
  window_seconds: number;
  created_at: string;
}

export interface LogEntry {
  id: number;
  service_id: number;
  level: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  message: string;
  trace_id: string | null;
  timestamp: string;
}

export interface Incident {
  id: number;
  service_id: number;
  title: string;
  description: string | null;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "investigating" | "resolved" | "closed";
  assigned_to: number | null;
  resolution_notes: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface IncidentSummary {
  id: number;
  incident_id: number;
  ai_summary: string;
  possible_root_cause: string;
  recommended_steps: string;
  confidence_score: number;
  model_used: string | null;
  feedback_score: number | null;
  created_at: string;
}

export interface Deployment {
  id: number;
  service_id: number;
  version: string;
  commit_id: string | null;
  status: string;
  deployed_at: string;
}

export interface DashboardSummary {
  services_monitored: number;
  healthy: number;
  warning: number;
  critical: number;
  open_incidents: number;
  resolved_incidents: number;
  recent_deployments_24h: number;
  avg_response_time_ms: number;
}
