"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { AdminMetricCard } from "@/lib/booking-types";
import { backendFetch } from "@/lib/backend-client";
import { AdminAnalyticsChart } from "@/components/admin-analytics-chart";
import { AdminStatusSummary } from "@/components/admin-status-summary";

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
  const [allBookings, setAllBookings] = useState<Array<Record<string, unknown>>>([]);
  const [recentUploads, setRecentUploads] = useState<Array<Record<string, unknown>>>([]);
  const [message, setMessage] = useState("Loading overview...");

  useEffect(() => {
    async function load() {
      try {
        const [dashRes, bookingsRes] = await Promise.all([
          backendFetch("/admin/dashboard").catch(() => null),
          backendFetch("/admin/bookings-management").catch(() => null)
        ]);

        if (dashRes && dashRes.ok) {
          const data = await dashRes.json();
          setMetrics(data.metrics ?? []);
          setRecentActivities(data.recentActivities ?? []);
          setRecentBookings(data.recentBookings ?? []);
          setRecentUploads(data.recentUploads ?? []);
        }

        if (bookingsRes && bookingsRes.ok) {
          const bData = await bookingsRes.json();
          setAllBookings(bData.rows ?? []);
        }

        setMessage("");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Unable to load overview.");
      }
    }

    void load();
  }, []);

  return (
    <div className="rounded-[28px] border border-[#f1dfce] bg-white p-6 shadow-[0_16px_36px_rgba(16,24,40,0.06)] md:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#FF6B00]">Admin Panel</p>
      <h1 className="mt-2 text-3xl font-bold text-[#0D0D0D] md:text-4xl">Booking operations overview</h1>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-[#5f6868] md:text-base">
        This admin shell is connected to the ScopeX backend APIs. Use it for order review, payment reconciliation, callback assignment, and report fulfillment workflows.
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
              className="group rounded-[24px] border border-[#f1dfce] bg-[#FFF8F2] p-5 transition hover:-translate-y-1 hover:border-[#FF6B00] hover:shadow-[0_18px_40px_rgba(15,143,124,0.12)]"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#FF6B00]">{metric.title}</p>
              <p className="mt-3 text-3xl font-bold text-[#0D0D0D]">{metric.value}</p>
              <p className="mt-2 text-sm leading-7 text-[#5f6868]">{metric.note}</p>
              <p className="mt-4 text-xs font-black uppercase tracking-[0.14em] text-[#FF6B00] opacity-0 transition group-hover:opacity-100">Open records</p>
            </Link>
          );
        })}
      </div>

      <AdminStatusSummary bookings={allBookings.length > 0 ? allBookings : recentBookings} metrics={metrics} />

      <AdminAnalyticsChart initialBookings={allBookings.length > 0 ? allBookings : recentBookings} />

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <div className="rounded-[24px] border border-[#f1dfce] bg-[#FFF8F2] p-5">
          <h2 className="text-xl font-bold text-[#0D0D0D]">Recent bookings</h2>
          <div className="mt-4 space-y-3">
            {recentBookings.length === 0 ? <p className="text-sm text-[#5f6868]">No bookings yet.</p> : null}
            {recentBookings.map((item) => (
              <article key={String(item.id)} className="rounded-2xl bg-white p-3">
                <p className="font-bold text-[#0D0D0D]">{String(item.booking_id || item.id)}</p>
                <p className="text-sm text-[#5f6868]">{String(item.contact_name || "Patient")} - {String(item.booking_status || "pending")}</p>
              </article>
            ))}
          </div>
        </div>
        <div className="rounded-[24px] border border-[#f1dfce] bg-[#FFF8F2] p-5">
          <h2 className="text-xl font-bold text-[#0D0D0D]">Recent uploads</h2>
          <div className="mt-4 space-y-3">
            {recentUploads.length === 0 ? <p className="text-sm text-[#5f6868]">No report uploads yet.</p> : null}
            {recentUploads.map((item) => (
              <article key={String(item.id)} className="rounded-2xl bg-white p-3">
                <p className="font-bold text-[#0D0D0D]">{String(item.file_name || "PDF Report")}</p>
                <p className="text-sm text-[#5f6868]">{String(item.patient_name || "Patient")} - {String(item.mobile_number || "")}</p>
              </article>
            ))}
          </div>
        </div>
        <div className="rounded-[24px] border border-[#f1dfce] bg-[#FFF8F2] p-5">
          <h2 className="text-xl font-bold text-[#0D0D0D]">Recent activities</h2>
          <div className="mt-4 space-y-3">
            {recentActivities.length === 0 ? <p className="text-sm text-[#5f6868]">No activity logs yet.</p> : null}
            {recentActivities.map((item) => (
              <article key={String(item.id)} className="rounded-2xl bg-white p-3">
                <p className="font-bold text-[#0D0D0D]">{String(item.action || "Activity")}</p>
                <p className="text-sm text-[#5f6868]">{String(item.entity_type || "System")} - {String(item.role || "admin")}</p>
              </article>
            ))}
          </div>
        </div>
      </div>

      {message ? <p className="mt-4 text-sm text-[#5f6868]">{message}</p> : null}
    </div>
  );
}
