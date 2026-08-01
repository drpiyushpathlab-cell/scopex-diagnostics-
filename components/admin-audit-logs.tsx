"use client";

import { useEffect, useState } from "react";
import { backendFetch } from "@/lib/backend-client";

type AuditLog = {
  id: string;
  created_at?: string;
  role?: string;
  action?: string;
  entity_type?: string;
  entity_id?: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, unknown>;
};

export function AdminAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [query, setQuery] = useState("");
  const [date, setDate] = useState("");
  const [message, setMessage] = useState("Loading audit logs...");

  useEffect(() => {
    void loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function params(format?: string) {
    const value = new URLSearchParams();
    if (query.trim()) value.set("q", query.trim());
    if (date) value.set("date", date);
    if (format) value.set("format", format);
    return value.toString();
  }

  async function loadLogs() {
    setMessage("Loading audit logs...");
    try {
      const response = await backendFetch(`/admin/audit-logs${params() ? `?${params()}` : ""}`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to load audit logs.");
      setLogs(data.logs ?? []);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load audit logs.");
    }
  }

  async function exportCsv() {
    const response = await backendFetch(`/admin/audit-logs?${params("csv")}`);
    if (!response.ok) {
      setMessage("Unable to export audit logs.");
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "scopex-audit-logs.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="rounded-[28px] border border-[#f1dfce] bg-white p-6 shadow-[0_16px_36px_rgba(16,24,40,0.06)] md:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#F7931E]">Audit Logs</p>
      <h1 className="mt-2 text-3xl font-bold text-[#0D0D0D] md:text-4xl">Activity and admin actions</h1>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-[#5f6868] md:text-base">
        Track booking updates, report uploads/downloads, user activity, login events, and admin actions.
      </p>

      <div className="mt-6 grid gap-3 md:grid-cols-[1fr_220px_auto_auto]">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search action, role, entity" className="form-field" />
        <input value={date} onChange={(event) => setDate(event.target.value)} type="date" className="form-field" />
        <button type="button" onClick={loadLogs} className="cta-btn">Search</button>
        <button type="button" onClick={exportCsv} className="secondary-btn text-center">Export CSV</button>
      </div>

      <div className="mt-6 overflow-hidden rounded-[22px] border border-[#f1dfce]">
        <div className="grid grid-cols-5 gap-3 bg-[#FFF8F2] px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#F7931E]">
          <span>Time</span>
          <span>Role</span>
          <span>Action</span>
          <span>Entity</span>
          <span>IP / Device</span>
        </div>
        {logs.length === 0 ? <p className="p-4 text-sm text-[#5f6868]">{message || "No audit logs found."}</p> : null}
        {logs.map((log) => (
          <div key={log.id} className="grid grid-cols-1 gap-2 border-t border-[#f1dfce] px-4 py-3 text-sm text-[#5f6868] md:grid-cols-5">
            <span>{log.created_at ? new Date(log.created_at).toLocaleString("en-IN") : "-"}</span>
            <span>{log.role || "-"}</span>
            <span className="font-bold text-[#0D0D0D]">{log.action || "-"}</span>
            <span>{log.entity_type || "-"} {log.entity_id ? `#${String(log.entity_id).slice(0, 8)}` : ""}</span>
            <span className="truncate" title={log.user_agent || ""}>{log.ip_address || "-"} / {log.user_agent || "-"}</span>
          </div>
        ))}
      </div>

      {message && logs.length ? <p className="mt-4 text-sm text-[#5f6868]">{message}</p> : null}
    </div>
  );
}
