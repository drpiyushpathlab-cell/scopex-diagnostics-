"use client";

import { useEffect, useMemo, useState } from "react";
import { backendFetch } from "@/lib/backend-client";

type EmailLog = {
  id: string;
  recipient_email: string;
  subject: string;
  event_type: string;
  status: string;
  sent_at?: string | null;
  error_message?: string | null;
  created_at: string;
};

function fmt(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-IN");
}

export function AdminEmailLogs() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");
  const [testTo, setTestTo] = useState("");
  const [message, setMessage] = useState("Loading email logs...");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadLogs() {
    setLoading(true);
    setMessage("Loading email logs...");
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (status) params.set("status", status);
    if (date) params.set("date", date);
    try {
      const response = await backendFetch(`/admin/email-logs?${params.toString()}`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to load email logs.");
      setLogs(data.rows ?? []);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load email logs.");
    } finally {
      setLoading(false);
    }
  }

  async function resend(id: string) {
    setMessage("Resending email...");
    const response = await backendFetch(`/admin/email-logs/${id}/resend`, { method: "POST" });
    const data = await response.json().catch(() => ({}));
    setMessage(response.ok && data.success ? "Email resent successfully." : data.error || data.message || "Unable to resend email.");
    await loadLogs();
  }

  async function sendTestEmail() {
    if (!testTo.trim()) return setMessage("Enter recipient email for test email.");
    setMessage("Sending test email...");
    const response = await backendFetch("/admin/email-logs/test", {
      method: "POST",
      body: JSON.stringify({ to: testTo.trim(), subject: "ScopeX test email" })
    });
    const data = await response.json().catch(() => ({}));
    setMessage(response.ok && data.success ? "Test email sent successfully." : data.error || data.message || "Unable to send test email.");
    await loadLogs();
  }

  async function exportCsv() {
    const params = new URLSearchParams({ format: "csv" });
    if (query.trim()) params.set("q", query.trim());
    if (status) params.set("status", status);
    if (date) params.set("date", date);
    const response = await backendFetch(`/admin/email-logs?${params.toString()}`);
    if (!response.ok) return setMessage("Unable to export email logs.");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "scopex-email-logs.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  const stats = useMemo(() => ({
    total: logs.length,
    success: logs.filter((log) => log.status === "success").length,
    failed: logs.filter((log) => log.status === "failed").length
  }), [logs]);

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-[#f1dfce] bg-white p-6 shadow-[0_16px_36px_rgba(16,24,40,0.06)] md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#F7931E]">Admin Monitoring</p>
        <h1 className="mt-2 text-3xl font-black text-[#0D0D0D] md:text-4xl">Email logs</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[#5f6868] md:text-base">Monitor transactional emails, resend failed notifications, and validate SMTP delivery.</p>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-[#eef8f5] p-4"><p className="text-xs font-black uppercase tracking-[0.14em] text-[#F7931E]">Total</p><p className="text-3xl font-black text-[#0D0D0D]">{stats.total}</p></div>
          <div className="rounded-2xl bg-[#eef8f5] p-4"><p className="text-xs font-black uppercase tracking-[0.14em] text-[#F7931E]">Success</p><p className="text-3xl font-black text-[#0D0D0D]">{stats.success}</p></div>
          <div className="rounded-2xl bg-[#fff4ee] p-4"><p className="text-xs font-black uppercase tracking-[0.14em] text-[#F7931E]">Failed</p><p className="text-3xl font-black text-[#0D0D0D]">{stats.failed}</p></div>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_180px_180px_auto_auto]">
          <input className="form-field" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search recipient, subject, event" />
          <select className="form-field" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All statuses</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>
          <input className="form-field" value={date} onChange={(event) => setDate(event.target.value)} type="date" />
          <button type="button" onClick={loadLogs} className="cta-btn">Search</button>
          <button type="button" onClick={exportCsv} className="secondary-btn">Export CSV</button>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto]">
          <input className="form-field" value={testTo} onChange={(event) => setTestTo(event.target.value)} placeholder="Send test email to" type="email" />
          <button type="button" onClick={sendTestEmail} className="secondary-btn">Send Test Email</button>
        </div>
        {message ? <p className="mt-4 rounded-2xl bg-[#eef8f5] p-3 text-sm font-bold text-[#F7931E]">{message}</p> : null}
      </section>

      <section className="overflow-hidden rounded-[28px] border border-[#f1dfce] bg-white shadow-[0_16px_36px_rgba(16,24,40,0.06)]">
        <div className="hidden grid-cols-[1.2fr_1.6fr_.9fr_.7fr_.9fr_120px] bg-[#FFF8F2] p-4 text-xs font-black uppercase tracking-[0.12em] text-[#F7931E] lg:grid">
          <span>Recipient</span><span>Subject</span><span>Event</span><span>Status</span><span>Sent</span><span>Action</span>
        </div>
        {logs.length === 0 ? <p className="p-6 text-sm text-[#5f6868]">{loading ? "Loading..." : "No email logs found."}</p> : null}
        {logs.map((log) => (
          <article key={log.id} className="grid gap-3 border-t border-[#f1dfce] p-4 text-sm text-[#5f6868] lg:grid-cols-[1.2fr_1.6fr_.9fr_.7fr_.9fr_120px] lg:items-center">
            <p className="font-bold text-[#0D0D0D]">{log.recipient_email}</p>
            <p>{log.subject}<span className="block text-xs text-[#8aa0a0]">{log.error_message || ""}</span></p>
            <p>{log.event_type}</p>
            <p className={log.status === "success" ? "font-black text-[#F7931E]" : "font-black text-[#F7931E]"}>{log.status}</p>
            <p>{fmt(log.sent_at || log.created_at)}</p>
            <button type="button" onClick={() => resend(log.id)} className="secondary-btn text-xs">Resend</button>
          </article>
        ))}
      </section>
    </div>
  );
}
