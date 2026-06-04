import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface IncidentEvent {
  incident_id?: number;
  service_id?: number;
  title?: string;
  event?: "connected" | "ping";
}

/**
 * Subscribe to the backend WebSocket and forward "new incident" events to
 * a caller-supplied handler (typically used for toasts). Also auto-invalidates
 * the incident/dashboard queries so the UI re-fetches instantly.
 */
export function useIncidentSocket(onNewIncident: (e: IncidentEvent) => void) {
  const qc = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let cancelled = false;
    let retry = 0;

    function connect() {
      if (cancelled) return;
      const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
      // In dev, Vite proxies /ws/* to the backend.
      const url = `${proto}//${window.location.host}/ws/incidents`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        retry = 0;
      };
      ws.onmessage = (msg) => {
        try {
          const data: IncidentEvent = JSON.parse(msg.data);
          if (data.event === "connected" || data.event === "ping") return;
          qc.invalidateQueries({ queryKey: ["incidents"] });
          qc.invalidateQueries({ queryKey: ["dashboard-summary"] });
          qc.invalidateQueries({ queryKey: ["services"] });
          onNewIncident(data);
        } catch {
          /* ignore malformed */
        }
      };
      ws.onclose = () => {
        if (cancelled) return;
        retry++;
        const delay = Math.min(15_000, 1000 * 2 ** Math.min(retry, 4));
        setTimeout(connect, delay);
      };
      ws.onerror = () => ws.close();
    }

    connect();
    return () => {
      cancelled = true;
      wsRef.current?.close();
    };
  }, [qc, onNewIncident]);
}
