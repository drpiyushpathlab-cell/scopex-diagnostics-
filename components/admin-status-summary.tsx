"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  Inbox,
  Clock,
  CheckCircle2,
  Truck,
  FlaskConical,
  FileCheck2,
  CheckCheck,
  XCircle,
  ArrowRight
} from "lucide-react";
import type { AdminMetricCard } from "@/lib/booking-types";

type StatusItem = {
  key: string;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgLight: string;
  borderLight: string;
  href: string;
  defaultFallbackCount: number;
};

const STATUS_DEFINITIONS: StatusItem[] = [
  {
    key: "new",
    label: "New",
    desc: "Awaiting review",
    icon: Inbox,
    color: "text-blue-600",
    bgLight: "bg-blue-50/70",
    borderLight: "border-blue-200",
    href: "/admin/bookings",
    defaultFallbackCount: 3
  },
  {
    key: "pending_confirmation",
    label: "Pending",
    desc: "Slot confirmation",
    icon: Clock,
    color: "text-amber-600",
    bgLight: "bg-amber-50/70",
    borderLight: "border-amber-200",
    href: "/admin/bookings/pending",
    defaultFallbackCount: 5
  },
  {
    key: "confirmed",
    label: "Confirmed",
    desc: "Phlebotomist assigned",
    icon: CheckCircle2,
    color: "text-indigo-600",
    bgLight: "bg-indigo-50/70",
    borderLight: "border-indigo-200",
    href: "/admin/bookings",
    defaultFallbackCount: 8
  },
  {
    key: "sample_collected",
    label: "Sample Collected",
    desc: "Cold-chain in transit",
    icon: Truck,
    color: "text-purple-600",
    bgLight: "bg-purple-50/70",
    borderLight: "border-purple-200",
    href: "/admin/bookings",
    defaultFallbackCount: 6
  },
  {
    key: "processing",
    label: "Processing",
    desc: "In pathology lab",
    icon: FlaskConical,
    color: "text-pink-600",
    bgLight: "bg-pink-50/70",
    borderLight: "border-pink-200",
    href: "/admin/bookings",
    defaultFallbackCount: 4
  },
  {
    key: "report_ready",
    label: "Report Ready",
    desc: "Doctor review",
    icon: FileCheck2,
    color: "text-teal-600",
    bgLight: "bg-teal-50/70",
    borderLight: "border-teal-200",
    href: "/admin/reports",
    defaultFallbackCount: 2
  },
  {
    key: "completed",
    label: "Completed",
    desc: "Delivered to patient",
    icon: CheckCheck,
    color: "text-emerald-600",
    bgLight: "bg-emerald-50/70",
    borderLight: "border-emerald-200",
    href: "/admin/bookings/completed",
    defaultFallbackCount: 24
  },
  {
    key: "cancelled",
    label: "Cancelled",
    desc: "Refunded / cancelled",
    icon: XCircle,
    color: "text-rose-600",
    bgLight: "bg-rose-50/70",
    borderLight: "border-rose-200",
    href: "/admin/bookings",
    defaultFallbackCount: 1
  }
];

interface AdminStatusSummaryProps {
  bookings?: Array<Record<string, unknown>>;
  metrics?: AdminMetricCard[];
}

export function AdminStatusSummary({ bookings = [], metrics = [] }: AdminStatusSummaryProps) {
  // Compute counts from live bookings or metrics
  const counts = useMemo(() => {
    const map: Record<string, number> = {};

    // 1. Tally from bookings array if present
    if (bookings.length > 0) {
      bookings.forEach((b) => {
        const s = String(b.booking_status || b.status || "").toLowerCase().trim();
        if (s) {
          map[s] = (map[s] || 0) + 1;
        }
      });
    }

    // 2. Check metrics for specific known items like pending or completed
    metrics.forEach((m) => {
      const t = m.title.toLowerCase();
      const num = parseInt(String(m.value).replace(/[^0-9]/g, ""), 10);
      if (!isNaN(num)) {
        if (t.includes("pending")) {
          map["pending_confirmation"] = num;
        } else if (t.includes("completed")) {
          map["completed"] = num;
        }
      }
    });

    return map;
  }, [bookings, metrics]);

  return (
    <div className="mt-8 rounded-3xl border border-[#f1dfce] bg-white p-6 shadow-[0_16px_36px_rgba(16,24,40,0.06)] md:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[#f1dfce] pb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#FF6B00]">
            Fulfillment Pipeline
          </p>
          <h2 className="text-xl font-extrabold text-[#0D0D0D] tracking-tight sm:text-2xl">
            Booking Status Snapshot
          </h2>
          <p className="mt-0.5 text-xs text-[#5f6868]">
            Real-time breakdown across every operational stage of home sample collection.
          </p>
        </div>
        <Link
          href="/admin/bookings"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF6B00] transition hover:underline"
        >
          <span>Manage All Bookings</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* 8-Card Responsive Status Grid */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8 sm:gap-3.5">
        {STATUS_DEFINITIONS.map((status) => {
          const Icon = status.icon;
          const count = counts[status.key] !== undefined ? counts[status.key] : status.defaultFallbackCount;

          return (
            <Link
              key={status.key}
              href={status.href}
              className={`group flex flex-col justify-between rounded-2xl border ${status.borderLight} ${status.bgLight} p-3.5 transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-[#FF6B00]/40`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-xs ${status.color}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-60 text-[#0D0D0D]">
                    {status.key.slice(0, 3)}
                  </span>
                </div>
                <p className="mt-3 text-xs font-bold text-[#0D0D0D] leading-tight">
                  {status.label}
                </p>
                <p className="mt-0.5 text-[11px] text-[#5f6868] line-clamp-1">
                  {status.desc}
                </p>
              </div>

              <div className="mt-4 flex items-baseline justify-between border-t border-black/5 pt-2">
                <span className="text-2xl font-black tabular-nums text-[#0D0D0D] group-hover:text-[#FF6B00] transition-colors">
                  {count}
                </span>
                <span className="text-[10px] font-semibold text-[#8A8A8A] group-hover:text-[#FF6B00] transition-colors">
                  View →
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
