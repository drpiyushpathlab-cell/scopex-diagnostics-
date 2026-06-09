"use client";

import { useEffect, useMemo, useState } from "react";
import { backendFetch, getStoredAuthUser } from "@/lib/backend-client";

type Mode = "users" | "bookings" | "sessions" | "revenue";
type Row = Record<string, unknown>;

type Props = {
  mode: Mode;
  title: string;
  subtitle: string;
  initialStatus?: string;
};

const bookingStatuses = [
  ["new", "New"],
  ["pending_confirmation", "Pending"],
  ["confirmed", "Confirmed"],
  ["sample_collected", "Sample Collected"],
  ["processing", "Processing"],
  ["report_ready", "Report Ready"],
  ["completed", "Completed"],
  ["cancelled", "Cancelled"]
];

const roleOptions = ["super_admin", "admin", "manager", "booking_manager", "report_manager", "finance_manager", "customer_support"];

function endpointFor(mode: Mode) {
  if (mode === "bookings") return "/admin/bookings-management";
  if (mode === "revenue") return "/admin/revenue";
  if (mode === "sessions") return "/admin/sessions";
  return "/admin/users";
}

function label(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Active" : "Inactive";
  if (typeof value === "string" && value.includes("T") && !Number.isNaN(Date.parse(value))) {
    return new Date(value).toLocaleString("en-IN");
  }
  return String(value);
}

function money(value: unknown) {
  return `Rs. ${new Intl.NumberFormat("en-IN").format(Number(value || 0))}`;
}

function columnsFor(mode: Mode) {
  if (mode === "bookings") return ["booking_id", "contact_name", "contact_phone", "booking_status", "payment_status", "payable_amount", "created_at"];
  if (mode === "revenue") return ["provider_order_id", "provider_payment_id", "status", "amount", "booking_id", "created_at"];
  if (mode === "sessions") return ["role", "event", "user_id", "admin_id", "ip_address", "created_at"];
  return ["phone", "email", "role", "is_active", "created_at"];
}

function printableRows(rows: Row[], mode: Mode) {
  const keys = columnsFor(mode);
  return `<table><thead><tr>${keys.map((key) => `<th>${key}</th>`).join("")}</tr></thead><tbody>${rows
    .map((row) => `<tr>${keys.map((key) => `<td>${label(row[key])}</td>`).join("")}</tr>`)
    .join("")}</tbody></table>`;
}

export function AdminOperationsPage({ mode, title, subtitle, initialStatus = "" }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [adminUsers, setAdminUsers] = useState<Row[]>([]);
  const [selected, setSelected] = useState<Row | null>(null);
  const [history, setHistory] = useState<Row[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(initialStatus);
  const [sortKey, setSortKey] = useState("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState("Loading records...");
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [staffForm, setStaffForm] = useState({ email: "", password: "", role: "admin", is_active: true });
  const [staffMessage, setStaffMessage] = useState("");
  const [creatingStaff, setCreatingStaff] = useState(false);
  const role = getStoredAuthUser()?.role;
  const isSuperAdmin = role === "super_admin" || role === "super-admin";
  const pageSize = 12;
  const cols = columnsFor(mode);

  useEffect(() => {
    void loadRows();
    if (mode === "users") void loadAdminUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, status]);

  async function loadRows() {
    setMessage("Loading records...");
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (mode === "bookings" && status) params.set("status", status);
    try {
      const response = await backendFetch(`${endpointFor(mode)}?${params.toString()}`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to load records.");
      setRows(data.rows ?? []);
      setTotalRevenue(Number(data.totalRevenue || 0));
      setMessage("");
      setPage(1);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load records.");
    }
  }

  async function loadAdminUsers() {
    const response = await backendFetch("/admin/admin-users");
    const data = await response.json().catch(() => ({}));
    if (response.ok) setAdminUsers(data.users ?? []);
  }

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const av = String(a[sortKey] ?? "");
      const bv = String(b[sortKey] ?? "");
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [rows, sortDir, sortKey]);

  const pageRows = sortedRows.slice((page - 1) * pageSize, page * pageSize);
  const pageCount = Math.max(1, Math.ceil(sortedRows.length / pageSize));

  function changeSort(key: string) {
    if (sortKey === key) setSortDir((current) => (current === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  async function exportCsv() {
    const params = new URLSearchParams();
    params.set("format", "csv");
    if (query.trim()) params.set("q", query.trim());
    if (mode === "bookings" && status) params.set("status", status);
    const response = await backendFetch(`${endpointFor(mode)}?${params.toString()}`);
    if (!response.ok) {
      setMessage("Unable to export CSV.");
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `scopex-${mode}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function printRows(targetRows = sortedRows) {
    const printWindow = window.open("", "_blank", "width=1100,height=800");
    if (!printWindow) return;
    printWindow.document.write(`<!doctype html><html><head><title>ScopeX ${title}</title><style>body{font-family:Arial;padding:24px;color:#102a2d}table{width:100%;border-collapse:collapse}th,td{border:1px solid #d8e8e4;padding:8px;text-align:left;font-size:12px}th{background:#eef8f5}</style></head><body><h1>${title}</h1>${printableRows(targetRows, mode)}</body></html>`);
    printWindow.document.close();
    printWindow.print();
  }

  async function updateBooking(id: string, patch: Row) {
    const response = await backendFetch(`/admin/bookings-management/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(data.message || "Unable to update booking.");
      return;
    }
    setRows((current) => current.map((row) => (row.id === id ? data.data : row)));
    setSelected(data.data);
    setMessage("Booking updated successfully.");
  }

  async function deleteRow(row: Row) {
    const id = String(row.id || "");
    if (!id || !window.confirm("Delete this record? This cannot be undone.")) return;
    const path = mode === "bookings" ? `/admin/bookings-management/${id}` : `/admin/users/${id}`;
    const response = await backendFetch(path, { method: "DELETE" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(data.message || "Unable to delete record.");
      return;
    }
    setRows((current) => current.filter((item) => item.id !== id));
    setSelected(null);
    setMessage("Record deleted.");
  }

  async function toggleUser(row: Row) {
    const id = String(row.id || "");
    const response = await backendFetch(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify({ is_active: !row.is_active }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return setMessage(data.message || "Unable to update user.");
    setRows((current) => current.map((item) => (item.id === id ? data.data : item)));
  }

  async function showLoginHistory(row: Row) {
    const id = String(row.id || "");
    const response = await backendFetch(`/admin/users/${id}/login-history`);
    const data = await response.json().catch(() => ({}));
    setHistory(response.ok ? data.logs ?? [] : []);
    setSelected(row);
  }

  async function createStaffUser() {
    setStaffMessage("");
    if (!staffForm.email.trim() || !staffForm.password.trim() || !staffForm.role.trim()) {
      setStaffMessage("Email, password, and role are required.");
      return;
    }
    setCreatingStaff(true);
    try {
      const response = await backendFetch("/admin/admin-users", { method: "POST", body: JSON.stringify(staffForm) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setStaffMessage(data.message || "Unable to create admin user.");
        return;
      }
      setStaffForm({ email: "", password: "", role: "admin", is_active: true });
      await loadAdminUsers();
      setStaffMessage("Admin user created successfully.");
      setMessage("Admin user created successfully.");
    } catch (error) {
      setStaffMessage(error instanceof Error ? error.message : "Unable to create admin user.");
    } finally {
      setCreatingStaff(false);
    }
  }

  async function toggleStaffUser(row: Row) {
    const response = await backendFetch(`/admin/admin-users/${row.id}`, { method: "PATCH", body: JSON.stringify({ is_active: !row.is_active }) });
    if (response.ok) await loadAdminUsers();
  }

  async function resetStaffPassword(row: Row) {
    const password = window.prompt(`New password for ${row.email}`);
    if (!password) return;
    const response = await backendFetch(`/admin/admin-users/${row.id}`, { method: "PATCH", body: JSON.stringify({ password }) });
    setMessage(response.ok ? "Password reset successfully." : "Unable to reset password.");
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-[#deece9] bg-white p-6 shadow-[0_16px_36px_rgba(16,24,40,0.06)] md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0f8f7c]">Operations Management</p>
        <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#102a2d] md:text-4xl">{title}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#5a7273] md:text-base">{subtitle}</p>
          </div>
          {mode === "revenue" ? <p className="rounded-2xl bg-[#eef8f5] px-5 py-3 text-xl font-black text-[#0f8f7c]">Total {money(totalRevenue)}</p> : null}
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_auto_auto_auto_auto]">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search records" className="form-field" />
          {mode === "bookings" ? (
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="form-field">
              <option value="">All statuses</option>
              {bookingStatuses.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
            </select>
          ) : null}
          <button type="button" onClick={loadRows} className="cta-btn">Search</button>
          <button type="button" onClick={exportCsv} className="secondary-btn text-center">Export CSV</button>
          <button type="button" onClick={() => printRows()} className="secondary-btn text-center">Print</button>
        </div>

        <div className="mt-6 overflow-hidden rounded-[24px] border border-[#deece9]">
          <div className="hidden bg-[#f7fbfa] text-xs font-black uppercase tracking-[0.12em] text-[#0f8f7c] lg:grid" style={{ gridTemplateColumns: `repeat(${cols.length}, minmax(0, 1fr)) 220px` }}>
            {cols.map((col) => <button key={col} type="button" onClick={() => changeSort(col)} className="p-4 text-left uppercase">{col.replace(/_/g, " ")}</button>)}
            <span className="p-4">Actions</span>
          </div>
          {pageRows.length === 0 ? <p className="p-5 text-sm text-[#5a7273]">{message || "No records found."}</p> : null}
          {pageRows.map((row) => (
            <article key={String(row.id)} className="grid gap-3 border-t border-[#deece9] bg-white p-4 text-sm text-[#5a7273] lg:items-center" style={{ gridTemplateColumns: `repeat(${cols.length}, minmax(0, 1fr)) 220px` }}>
              {cols.map((col) => <div key={col}><span className="block text-[10px] font-black uppercase tracking-[0.12em] text-[#0f8f7c] lg:hidden">{col.replace(/_/g, " ")}</span><span className={col.includes("amount") || col === "payable_amount" ? "font-black text-[#f37021]" : ""}>{col.includes("amount") || col === "payable_amount" ? money(row[col]) : label(row[col])}</span></div>)}
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setSelected(row)} className="rounded-full border border-[#cfe4df] px-3 py-2 text-xs font-black text-[#0f8f7c]">View</button>
                {mode === "bookings" ? (
                  <>
                    <select value={String(row.booking_status || "")} onChange={(event) => updateBooking(String(row.id), { booking_status: event.target.value })} className="rounded-full border border-[#cfe4df] px-3 py-2 text-xs font-bold">
                      {bookingStatuses.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
                    </select>
                    <button type="button" onClick={() => printRows([row])} className="rounded-full border border-[#cfe4df] px-3 py-2 text-xs font-black text-[#0f8f7c]">Print</button>
                    <button type="button" onClick={() => deleteRow(row)} className="rounded-full border border-[#ffd6bf] px-3 py-2 text-xs font-black text-[#f37021]">Delete</button>
                  </>
                ) : null}
                {mode === "users" ? (
                  <>
                    <button type="button" onClick={() => toggleUser(row)} className="rounded-full border border-[#cfe4df] px-3 py-2 text-xs font-black text-[#0f8f7c]">{row.is_active ? "Deactivate" : "Activate"}</button>
                    <button type="button" onClick={() => showLoginHistory(row)} className="rounded-full border border-[#cfe4df] px-3 py-2 text-xs font-black text-[#0f8f7c]">Login History</button>
                    {isSuperAdmin ? <button type="button" onClick={() => deleteRow(row)} className="rounded-full border border-[#ffd6bf] px-3 py-2 text-xs font-black text-[#f37021]">Delete</button> : null}
                  </>
                ) : null}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[#5a7273]">Page {page} of {pageCount} • {sortedRows.length} records</p>
          <div className="flex gap-2">
            <button type="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="secondary-btn disabled:opacity-40">Previous</button>
            <button type="button" disabled={page >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))} className="secondary-btn disabled:opacity-40">Next</button>
          </div>
        </div>
        {message ? <p className="mt-4 text-sm font-bold text-[#0f8f7c]">{message}</p> : null}
      </div>

      {mode === "users" ? (
        <div className="rounded-[28px] border border-[#deece9] bg-white p-6 shadow-[0_16px_36px_rgba(16,24,40,0.06)] md:p-8">
          <h2 className="text-2xl font-bold text-[#102a2d]">Admin and staff users</h2>
          <p className="mt-2 text-sm text-[#5a7273]">Create Booking Manager, Report Manager, Finance Manager, and Customer Support accounts.</p>
          {isSuperAdmin ? (
            <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_1fr_220px_160px]">
              <input value={staffForm.email} onChange={(event) => setStaffForm({ ...staffForm, email: event.target.value })} className="form-field" placeholder="Email" />
              <input value={staffForm.password} onChange={(event) => setStaffForm({ ...staffForm, password: event.target.value })} className="form-field" placeholder="Password" type="password" />
              <select value={staffForm.role} onChange={(event) => setStaffForm({ ...staffForm, role: event.target.value })} className="form-field">
                {roleOptions.map((item) => <option key={item} value={item}>{item.replace(/_/g, " ")}</option>)}
              </select>
              <button type="button" onClick={createStaffUser} disabled={creatingStaff} className="cta-btn disabled:opacity-60">{creatingStaff ? "Creating..." : "Create User"}</button>
            </div>
          ) : null}
          {staffMessage ? <p className={`mt-4 rounded-2xl p-3 text-sm font-bold ${staffMessage.includes("success") ? "bg-[#eef8f5] text-[#0f8f7c]" : "bg-[#fff4ee] text-[#f37021]"}`}>{staffMessage}</p> : null}
          <div className="mt-5 grid gap-3">
            {adminUsers.map((user) => (
              <article key={String(user.id)} className="flex flex-col gap-3 rounded-2xl border border-[#deece9] bg-[#f7fbfa] p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-black text-[#102a2d]">{label(user.email)}</p>
                  <p className="text-sm text-[#5a7273]">{label(user.role)} • {label(user.is_active)} • Last login {label(user.last_login_at)}</p>
                </div>
                {isSuperAdmin ? <div className="flex flex-wrap gap-2"><button type="button" onClick={() => toggleStaffUser(user)} className="secondary-btn text-xs">{user.is_active ? "Deactivate" : "Activate"}</button><button type="button" onClick={() => resetStaffPassword(user)} className="secondary-btn text-xs">Reset Password</button></div> : null}
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {selected ? (
        <aside className="fixed inset-y-0 right-0 z-[80] w-full max-w-xl overflow-y-auto border-l border-[#deece9] bg-white p-6 shadow-2xl">
          <button type="button" onClick={() => { setSelected(null); setHistory([]); }} className="secondary-btn text-xs">Close</button>
          <h2 className="mt-6 text-2xl font-black text-[#102a2d]">Record details</h2>
          <pre className="mt-4 overflow-x-auto rounded-2xl bg-[#f7fbfa] p-4 text-xs text-[#102a2d]">{JSON.stringify(selected, null, 2)}</pre>
          {mode === "bookings" ? (
            <div className="mt-4 grid gap-3">
              <button type="button" onClick={() => updateBooking(String(selected.id), { booking_status: "confirmed" })} className="cta-btn">Confirm Booking</button>
              <button type="button" onClick={() => updateBooking(String(selected.id), { booking_status: "report_ready" })} className="secondary-btn">Mark Report Ready</button>
              <button type="button" onClick={() => updateBooking(String(selected.id), { booking_status: "completed" })} className="secondary-btn">Mark Completed</button>
              <button type="button" onClick={() => { const id = window.prompt("Enter phlebotomist/advisor ID"); if (id) void updateBooking(String(selected.id), { phlebotomist_id: id }); }} className="secondary-btn">Assign Advisor</button>
              <button type="button" onClick={() => printRows([selected])} className="secondary-btn">Print Booking</button>
            </div>
          ) : null}
          {history.length ? <div className="mt-5"><h3 className="font-black text-[#102a2d]">Login history</h3>{history.map((item) => <p key={String(item.id)} className="mt-2 rounded-xl bg-[#f7fbfa] p-3 text-sm text-[#5a7273]">{label(item.created_at)} • {label(item.ip_address)} • {label(item.user_agent)}</p>)}</div> : null}
        </aside>
      ) : null}
    </div>
  );
}
