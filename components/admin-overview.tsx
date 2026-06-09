"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { AdminMetricCard } from "@/lib/booking-types";
import { backendFetch } from "@/lib/backend-client";


const metricLinks: Record<string, string> = {
  "Total users": "/admin/users",
  "Total bookings": "/admin/bookings",
  "Pending confirmation": "/admin/bookings/pending",
  "Completed bookings": "/admin/bookings/completed",
  "Uploaded reports": "/admin/reports",
  "Active users": "/admin/sessions",
  "Paid revenue": "/admin/revenue"
};
export function AdminOverview() {
  const [metrics, setMetrics] = useState<AdminMetricCard[]>([]);
  const [recentActivities, setRecentActivities] = useState<Array<Record<string, unknown>>>([]);
  const [recentBookings, setRecentBookings] = useState<Array<Record<string, unknown>>>([]);
  const [recentUploads, setRecentUploads] = useState<Array<Record<string, unknown>>>([]);
  const [message, setMessage] = useState("Loading overview...");

  useEffect(() => {
    async function load() {
      backendFetch("/admin/dashboard")
        .then(async (response) => {
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.message || "Unable to load overview.");
          }
          setMetrics(data.metrics ?? []);
          setRecentActivities(data.recentActivities ?? []);
          setRecentBookings(data.recentBookings ?? []);
          setRecentUploads(data.recentUploads ?? []);
          setMessage("");
        })
        .catch((error) => {
          setMessage(error instanceof Error ? error.message : "Unable to load overview.");
        });
    }

    void load();
  }, []);

  return (
    <div className="rounded-[28px] border border-[#deece9] bg-white p-6 shadow-[0_16px_36px_rgba(16,24,40,0.06)] md:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0f8f7c]">Admin Panel</p>
      <h1 className="mt-2 text-3xl font-bold text-[#102a2d] md:text-4xl">Booking operations overview</h1>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-[#5a7273] md:text-base">
        This admin shell is connected to the InsForge-backed bookings and payments APIs. Use it for order review, payment reconciliation, callback assignment, and report fulfillment workflows.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/admin/bookings" className="cta-btn text-xs">Booking Management</Link>
        <Link href="/admin/users" className="secondary-btn text-xs">User Management</Link>
        <Link href="/admin/roles-permissions" className="secondary-btn text-xs">Roles & Permissions</Link>
        <Link href="/admin/reports" className="secondary-btn text-xs">Report Management</Link>
        <Link href="/admin/email-logs" className="secondary-btn text-xs">Email Logs</Link>
        <Link href="/admin/audit-logs" className="secondary-btn text-xs">Audit Logs</Link>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-4">
        {metrics.map((metric) => {
          const href = metricLinks[metric.title] || "/admin/dashboard";
          return (
            <Link
              key={metric.title}
              href={href}
              className="group rounded-[24px] border border-[#deece9] bg-[#f7fbfa] p-5 transition hover:-translate-y-1 hover:border-[#0f8f7c] hover:shadow-[0_18px_40px_rgba(15,143,124,0.12)]"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#0f8f7c]">{metric.title}</p>
              <p className="mt-3 text-3xl font-bold text-[#102a2d]">{metric.value}</p>
              <p className="mt-2 text-sm leading-7 text-[#5a7273]">{metric.note}</p>
              <p className="mt-4 text-xs font-black uppercase tracking-[0.14em] text-[#f37021] opacity-0 transition group-hover:opacity-100">Open records</p>
            </Link>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-[24px] border border-[#deece9] bg-[#f7fbfa] p-5">
          <h2 className="text-xl font-bold text-[#102a2d]">Recent bookings</h2>
          <div className="mt-4 space-y-3">
            {recentBookings.length === 0 ? <p className="text-sm text-[#5a7273]">No bookings yet.</p> : null}
            {recentBookings.map((item) => (
              <article key={String(item.id)} className="rounded-2xl bg-white p-3">
                <p className="font-bold text-[#102a2d]">{String(item.booking_id || item.id)}</p>
                <p className="text-sm text-[#5a7273]">{String(item.contact_name || "Patient")} - {String(item.booking_status || "pending")}</p>
              </article>
            ))}
          </div>
        </div>
        <div className="rounded-[24px] border border-[#deece9] bg-[#f7fbfa] p-5">
          <h2 className="text-xl font-bold text-[#102a2d]">Recent uploads</h2>
          <div className="mt-4 space-y-3">
            {recentUploads.length === 0 ? <p className="text-sm text-[#5a7273]">No report uploads yet.</p> : null}
            {recentUploads.map((item) => (
              <article key={String(item.id)} className="rounded-2xl bg-white p-3">
                <p className="font-bold text-[#102a2d]">{String(item.file_name || "PDF Report")}</p>
                <p className="text-sm text-[#5a7273]">{String(item.patient_name || "Patient")} - {String(item.mobile_number || "")}</p>
              </article>
            ))}
          </div>
        </div>
        <div className="rounded-[24px] border border-[#deece9] bg-[#f7fbfa] p-5">
          <h2 className="text-xl font-bold text-[#102a2d]">Recent activities</h2>
          <div className="mt-4 space-y-3">
            {recentActivities.length === 0 ? <p className="text-sm text-[#5a7273]">No activity logs yet.</p> : null}
            {recentActivities.map((item) => (
              <article key={String(item.id)} className="rounded-2xl bg-white p-3">
                <p className="font-bold text-[#102a2d]">{String(item.action || "Activity")}</p>
                <p className="text-sm text-[#5a7273]">{String(item.entity_type || "System")} - {String(item.role || "admin")}</p>
              </article>
            ))}
          </div>
        </div>
      </div>

      {message ? <p className="mt-4 text-sm text-[#5a7273]">{message}</p> : null}
    </div>
  );
}
