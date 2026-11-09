"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  BarChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import {
  TrendingUp,
  Calendar,
  Layers,
  ArrowRight,
  Sparkles,
  Award,
  Zap,
  Clock,
  ArrowUpRight,
  Filter
} from "lucide-react";
import type { TransitionReport, DailyTransitionPoint, StageTransitionFlow } from "@/lib/crm-service";

interface Props {
  initialReport?: TransitionReport;
  onTimeframeChange?: (days: number) => void;
  isLoading?: boolean;
}

export function CrmConversionChart({
  initialReport,
  onTimeframeChange,
  isLoading = false
}: Props) {
  const [timeframe, setTimeframe] = useState<number>(initialReport?.timeframeDays || 30);
  const [chartView, setChartView] = useState<"composed" | "stacked" | "flow">("composed");

  const handleSelectTimeframe = (days: number) => {
    setTimeframe(days);
    if (onTimeframeChange) {
      onTimeframeChange(days);
    }
  };

  const report = initialReport;
  const timeline = report?.timeline || [];
  const summary = report?.summary;
  const transitions = report?.transitions || [];

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-7 shadow-sm space-y-6">
      {/* Header and View Controls */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#FF6B00]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#FF6B00]">
              Status Transition & Conversion Velocity
            </span>
            <span className="text-xs text-stone-400">·</span>
            <span className="text-xs font-semibold text-emerald-700">Recharts Visualizer</span>
          </div>
          <h2 className="mt-1 text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
            Lead Stage Progression: &lsquo;New&rsquo; → &lsquo;Converted&rsquo;
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-stone-500 max-w-2xl">
            Visualizing inbound patient capture, triage velocity, intermediate handoffs, and final diagnostic booking conversions over your chosen timeframe.
          </p>
        </div>

        {/* Timeframe & Chart Style Switchers */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Timeframe Filter */}
          <div className="flex items-center gap-1 rounded-xl bg-stone-100 p-1 text-xs">
            {[
              { label: "7 Days", days: 7 },
              { label: "14 Days", days: 14 },
              { label: "30 Days", days: 30 },
              { label: "90 Days", days: 90 }
            ].map((t) => (
              <button
                key={t.days}
                type="button"
                onClick={() => handleSelectTimeframe(t.days)}
                className={`rounded-lg px-3 py-1.5 font-bold transition ${
                  timeframe === t.days
                    ? "bg-white text-stone-900 shadow-sm"
                    : "text-stone-500 hover:text-stone-900"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 rounded-xl border border-stone-200 bg-white p-1 text-xs">
            <button
              type="button"
              onClick={() => setChartView("composed")}
              className={`rounded-lg px-2.5 py-1.5 font-bold transition ${
                chartView === "composed" ? "bg-[#0D0D0D] text-white" : "text-stone-600 hover:bg-stone-100"
              }`}
            >
              Trends
            </button>
            <button
              type="button"
              onClick={() => setChartView("stacked")}
              className={`rounded-lg px-2.5 py-1.5 font-bold transition ${
                chartView === "stacked" ? "bg-[#0D0D0D] text-white" : "text-stone-600 hover:bg-stone-100"
              }`}
            >
              Stage Stack
            </button>
            <button
              type="button"
              onClick={() => setChartView("flow")}
              className={`rounded-lg px-2.5 py-1.5 font-bold transition ${
                chartView === "flow" ? "bg-[#0D0D0D] text-white" : "text-stone-600 hover:bg-stone-100"
              }`}
            >
              Handoff Flow
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards for the selected period */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700">New Inbound</p>
          <p className="mt-1 text-2xl font-black text-blue-950">{summary?.totalNewInPeriod ?? 0}</p>
          <p className="mt-0.5 text-[11px] text-blue-600">Past {timeframe} days</p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Converted Bookings</p>
          <p className="mt-1 text-2xl font-black text-emerald-950">{summary?.totalConvertedInPeriod ?? 0}</p>
          <p className="mt-0.5 text-[11px] font-semibold text-emerald-700">
            {summary?.periodConversionRate ?? 0}% period conversion
          </p>
        </div>

        <div className="rounded-2xl border border-purple-100 bg-purple-50/40 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Avg. Conversion Time</p>
          <p className="mt-1 text-2xl font-black text-purple-950">
            {summary?.avgHoursToConvert ? `${(summary.avgHoursToConvert / 24).toFixed(1)}d` : "1.2d"}
          </p>
          <p className="mt-0.5 text-[11px] text-purple-600">
            ~{summary?.avgHoursToConvert ?? 24} hours velocity
          </p>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Daily Velocity</p>
          <p className="mt-1 text-2xl font-black text-amber-950">{summary?.funnelVelocityPerDay ?? 0}</p>
          <p className="mt-0.5 text-[11px] text-amber-700">bookings converted / day</p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-600">Direct Express</p>
          <p className="mt-1 text-2xl font-black text-stone-900">{summary?.directConversions ?? 0}</p>
          <p className="mt-0.5 text-[11px] text-stone-500">Same-day conversion</p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-stone-900 p-4 text-white">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#FF6B00]">Period Revenue</p>
          <p className="mt-1 text-xl sm:text-2xl font-black text-white">
            ₹{new Intl.NumberFormat("en-IN").format(summary?.totalRevenueInPeriod ?? 0)}
          </p>
          <p className="mt-0.5 text-[11px] text-stone-400">Total booked value</p>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="rounded-2xl border border-stone-200 bg-[#FAFAFA] p-4 sm:p-6">
        {isLoading ? (
          <div className="flex h-80 items-center justify-center text-sm font-semibold text-stone-400">
            Updating timeframe chart...
          </div>
        ) : chartView === "composed" ? (
          /* COMPOSED CHART: INBOUND VS CONVERTED OVER TIME */
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-bold text-stone-800">
                Daily New Leads vs Converted Diagnostic Bookings ({timeframe} Days)
              </span>
              <div className="flex items-center gap-4 text-[11px] font-semibold text-stone-600">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                  <span>New Leads Captured</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span>Converted Bookings</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#FF6B00]" />
                  <span>Daily Conversion Rate (%)</span>
                </span>
              </div>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="newLeadsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="convertedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis
                    dataKey="displayDate"
                    tick={{ fontSize: 11, fill: "#6B7280" }}
                    tickLine={false}
                    axisLine={{ stroke: "#E5E7EB" }}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 11, fill: "#6B7280" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    unit="%"
                    domain={[0, 60]}
                    tick={{ fontSize: 11, fill: "#FF6B00" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomComposedTooltip />} />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="newLeads"
                    name="New Leads"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#newLeadsGrad)"
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="converted"
                    name="Converted Bookings"
                    stroke="#10B981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#convertedGrad)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="conversionRate"
                    name="Conversion Rate %"
                    stroke="#FF6B00"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#FF6B00" }}
                    activeDot={{ r: 5 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : chartView === "stacked" ? (
          /* STACKED BAR CHART: STATUS BREAKDOWN ACROSS PERIOD */
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-bold text-stone-800">
                Daily Pipeline Stage Volume Distribution ({timeframe} Days)
              </span>
              <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-stone-600">
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-sm bg-blue-500" />
                  <span>New</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-sm bg-amber-500" />
                  <span>Contacted</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-sm bg-purple-500" />
                  <span>Qualified</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-sm bg-indigo-500" />
                  <span>Booking Pending</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
                  <span>Converted</span>
                </span>
              </div>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis
                    dataKey="displayDate"
                    tick={{ fontSize: 11, fill: "#6B7280" }}
                    tickLine={false}
                    axisLine={{ stroke: "#E5E7EB" }}
                  />
                  <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomStackedTooltip />} />
                  <Bar dataKey="newLeads" stackId="a" fill="#3B82F6" name="New" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="contacted" stackId="a" fill="#F59E0B" name="Contacted" />
                  <Bar dataKey="qualified" stackId="a" fill="#8B5CF6" name="Qualified" />
                  <Bar dataKey="bookingPending" stackId="a" fill="#6366F1" name="Booking Pending" />
                  <Bar dataKey="converted" stackId="a" fill="#10B981" name="Converted" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          /* STEP FLOW / STAGE-TO-STAGE TRANSITIONS VISUALIZER */
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-stone-900">Stage-by-Stage Transition Funnel & Drop-off Flow</h3>
              <p className="text-xs text-stone-500">
                Detailed handoff metrics showing conversion rates and time elapsed between each stage for {timeframe} days
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {transitions.map((flow, idx) => (
                <div key={flow.stage} className="relative rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-stone-600">
                      Step {idx + 1}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {flow.conversionRate}% Pass
                    </span>
                  </div>

                  <h4 className="mt-2 text-sm font-bold text-stone-900">{flow.stage}</h4>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-stone-500">
                    <span className="font-semibold text-stone-700">{flow.fromStatus}</span>
                    <ArrowRight className="h-3 w-3 text-[#FF6B00]" />
                    <span className="font-semibold text-stone-700">{flow.toStatus}</span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500">Progressed Leads:</span>
                      <span className="font-bold text-stone-900">{flow.count}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500">Stage Drop-off:</span>
                      <span className="font-medium text-rose-600">{flow.dropCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500">Avg. Stage Velocity:</span>
                      <span className="font-medium text-purple-700">{flow.avgDurationHours} hours</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Transition Flow Summary Callout */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-950">
                    Net New → Converted Velocity: {summary?.periodConversionRate ?? 0}%
                  </h4>
                  <p className="text-xs text-emerald-800">
                    {summary?.totalConvertedInPeriod ?? 0} out of {summary?.totalNewInPeriod ?? 0} inbound leads converted to bookings within an average of {(Number(summary?.avgHoursToConvert || 24) / 24).toFixed(1)} days.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                <span className="rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-emerald-900 border border-emerald-200 shadow-xs">
                  {summary?.funnelVelocityPerDay ?? 0} bookings/day
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Custom Tooltip for Composed Chart
function CustomComposedTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const data: DailyTransitionPoint = payload[0].payload;
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-3.5 shadow-xl text-xs space-y-1.5 min-w-[200px]">
        <p className="font-bold text-stone-900 border-b border-stone-100 pb-1">{data.displayDate} ({data.date})</p>
        <div className="flex items-center justify-between">
          <span className="text-blue-600 font-semibold">New Leads:</span>
          <span className="font-bold text-stone-900">{data.newLeads}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-emerald-600 font-semibold">Converted:</span>
          <span className="font-bold text-stone-900">{data.converted}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#FF6B00] font-semibold">Conversion Rate:</span>
          <span className="font-bold text-stone-900">{data.conversionRate}%</span>
        </div>
        <div className="flex items-center justify-between border-t border-stone-100 pt-1">
          <span className="text-stone-500 font-semibold">Booked Revenue:</span>
          <span className="font-bold text-stone-900">₹{new Intl.NumberFormat("en-IN").format(data.revenue)}</span>
        </div>
      </div>
    );
  }
  return null;
}

// Custom Tooltip for Stacked Bar Chart
function CustomStackedTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const data: DailyTransitionPoint = payload[0].payload;
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-3.5 shadow-xl text-xs space-y-1 min-w-[190px]">
        <p className="font-bold text-stone-900 border-b border-stone-100 pb-1">{data.displayDate}</p>
        <p className="flex justify-between text-blue-600"><span>New:</span> <span className="font-bold">{data.newLeads}</span></p>
        <p className="flex justify-between text-amber-600"><span>Contacted:</span> <span className="font-bold">{data.contacted}</span></p>
        <p className="flex justify-between text-purple-600"><span>Qualified:</span> <span className="font-bold">{data.qualified}</span></p>
        <p className="flex justify-between text-indigo-600"><span>Booking Pending:</span> <span className="font-bold">{data.bookingPending}</span></p>
        <p className="flex justify-between text-emerald-600 font-bold border-t border-stone-100 pt-1">
          <span>Converted:</span> <span>{data.converted}</span>
        </p>
      </div>
    );
  }
  return null;
}
