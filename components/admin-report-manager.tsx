"use client";

import { useEffect, useMemo, useState } from "react";
import { backendFetch, getStoredAuthUser } from "@/lib/backend-client";

type UploadedReport = {
  id: string;
  booking_id?: string;
  booking_code?: string;
  patient_name?: string;
  mobile_number?: string;
  file_name?: string;
  file_size?: number;
  file_data?: string;
  created_at?: string;
};

function mb(size?: number) {
  return `${((size || 0) / (1024 * 1024)).toFixed(2)} MB`;
}

export function AdminReportManager() {
  const [reports, setReports] = useState<UploadedReport[]>([]);
  const [query, setQuery] = useState("");
  const [date, setDate] = useState("");
  const [message, setMessage] = useState("Loading uploaded reports...");
  const role = getStoredAuthUser()?.role;
  const canDelete = role === "super_admin" || role === "super-admin";

  const filteredReports = useMemo(() => reports, [reports]);

  useEffect(() => {
    void loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadReports() {
    setMessage("Loading uploaded reports...");
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (date) params.set("date", date);

    try {
      const response = await backendFetch(`/admin/report-uploads${params.toString() ? `?${params}` : ""}`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to load reports.");
      setReports(data.reports ?? []);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load reports.");
    }
  }

  async function deleteReport(id: string) {
    if (!window.confirm("Delete this uploaded report? Only Super Admin can do this.")) return;
    const response = await backendFetch(`/admin/report-uploads/${id}`, { method: "DELETE" });
    if (response.ok) {
      setReports((current) => current.filter((report) => report.id !== id));
      setMessage("Report deleted.");
      return;
    }
    const data = await response.json().catch(() => ({}));
    setMessage(data.message || "Unable to delete report.");
  }

  return (
    <div className="rounded-[28px] border border-[#deece9] bg-white p-6 shadow-[0_16px_36px_rgba(16,24,40,0.06)] md:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0f8f7c]">Report Upload Management</p>
      <h1 className="mt-2 text-3xl font-bold text-[#102a2d] md:text-4xl">Uploaded previous reports</h1>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-[#5a7273] md:text-base">
        Search by patient name, mobile number, booking ID, or date. Download PDFs for clinical review.
      </p>

      <div className="mt-6 grid gap-3 md:grid-cols-[1fr_220px_auto]">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search patient, mobile, booking ID" className="form-field" />
        <input value={date} onChange={(event) => setDate(event.target.value)} type="date" className="form-field" />
        <button type="button" onClick={loadReports} className="cta-btn">Search</button>
      </div>

      <div className="mt-6 grid gap-4">
        {filteredReports.length === 0 ? <p className="rounded-2xl border border-[#deece9] bg-[#f7fbfa] p-4 text-sm text-[#5a7273]">{message || "No uploaded reports found."}</p> : null}
        {filteredReports.map((report) => (
          <article key={report.id} className="rounded-[22px] border border-[#deece9] bg-[#f7fbfa] p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0f8f7c]">{report.booking_code || report.booking_id || "Booking pending"}</p>
                <h2 className="mt-1 text-xl font-bold text-[#102a2d]">{report.patient_name || "Patient"}</h2>
                <p className="mt-1 text-sm text-[#5a7273]">{report.mobile_number} - {report.file_name} - {mb(report.file_size)}</p>
                <p className="mt-1 text-xs text-[#7c8f90]">{report.created_at ? new Date(report.created_at).toLocaleString("en-IN") : ""}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {report.file_data ? (
                  <a href={report.file_data} download={report.file_name || "scopex-report.pdf"} className="secondary-btn text-xs">
                    Download
                  </a>
                ) : null}
                {canDelete ? (
                  <button type="button" onClick={() => deleteReport(report.id)} className="rounded-full border border-[#ffd6bf] px-5 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#f37021]">
                    Delete
                  </button>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>

      {message && filteredReports.length ? <p className="mt-4 text-sm text-[#5a7273]">{message}</p> : null}
    </div>
  );
}
