"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Phone,
  MessageSquare,
  Mail,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  UserCheck,
  UserX,
  FileSpreadsheet,
  ArrowRight,
  TrendingUp,
  Tag,
  MapPin,
  Flame,
  HelpCircle,
  Copy,
  ExternalLink,
  ChevronDown,
  Layers,
  Award
} from "lucide-react";
import { backendFetch, getStoredAuthUser } from "@/lib/backend-client";
import type { LeadRecord, LeadActivity, CrmTeamMember, LeadStatus, LeadPriority } from "@/lib/crm-service";
import { ALL_LEAD_STATUSES } from "@/lib/crm-service";
import { CrmConversionChart } from "@/components/crm-conversion-chart";

type CrmTab = "all" | "unassigned" | "followups" | "converted" | "analytics";
type FollowUpFilter = "all" | "today" | "overdue" | "upcoming";

export function AdminCrmDesk() {
  const [activeTab, setActiveTab] = useState<CrmTab>("all");
  const [followUpFilter, setFollowUpFilter] = useState<FollowUpFilter>("today");

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [assignedFilter, setAssignedFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");

  // Data States
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState<CrmTeamMember[]>([]);
  const [report, setReport] = useState<any>(null);

  // Selected Lead & Drawer
  const [selectedLead, setSelectedLead] = useState<LeadRecord | null>(null);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  // Modals
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showTouchpointModal, setShowTouchpointModal] = useState(false);

  // Modal form states
  const [transferTargetId, setTransferTargetId] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [touchpointType, setTouchpointType] = useState<"call" | "whatsapp" | "email" | "note">("call");
  const [touchpointNotes, setTouchpointNotes] = useState("");
  const [convertBookingNumber, setConvertBookingNumber] = useState("");
  const [convertAmount, setConvertAmount] = useState<number>(0);
  const [convertNotes, setConvertNotes] = useState("");
  const [followUpDateInput, setFollowUpDateInput] = useState("");
  const [notificationMsg, setNotificationMsg] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // New Lead Form State
  const [newLeadForm, setNewLeadForm] = useState({
    name: "",
    phone: "",
    email: "",
    city: "Indore",
    pincode: "",
    location: "",
    interestedItems: "",
    source: "manual_customer_care",
    campaign: "Direct_Inquiry",
    priority: "Medium" as LeadPriority,
    notes: "",
    followUpDate: "",
    autoAssign: true,
    assignedEmployeeId: ""
  });

  const [transitionTimeframe, setTransitionTimeframe] = useState<number>(30);
  const [chartLoading, setChartLoading] = useState(false);

  const showNotification = (text: string, type: "success" | "error" | "info" = "success") => {
    setNotificationMsg({ text, type });
    setTimeout(() => setNotificationMsg(null), 5000);
  };

  // Fetch Team & Reports
  const fetchAuxiliaryData = useCallback(async (timeframeDays: number = 30) => {
    try {
      setChartLoading(true);
      const [teamRes, reportRes] = await Promise.all([
        backendFetch("/admin/crm/team"),
        backendFetch(`/admin/crm/reports?timeframe=${timeframeDays}`)
      ]);
      if (teamRes.ok) {
        const data = await teamRes.json();
        setTeamMembers(data.team || []);
      }
      if (reportRes.ok) {
        const data = await reportRes.json();
        setReport(data.report || null);
      }
    } catch {
      // Ignore
    } finally {
      setChartLoading(false);
    }
  }, []);

  // Fetch Leads List
  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (priorityFilter !== "all") params.set("priority", priorityFilter);
      if (assignedFilter !== "all") params.set("assignedTo", assignedFilter);
      if (sourceFilter !== "all") params.set("source", sourceFilter);

      if (activeTab === "unassigned") {
        params.set("unassignedOnly", "true");
      } else if (activeTab === "followups") {
        params.set("followUpStatus", followUpFilter);
      } else if (activeTab === "converted") {
        params.set("status", "Converted");
      }

      params.set("page", String(page));
      params.set("pageSize", "30");

      const res = await backendFetch(`/admin/crm/leads?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLeads(data.rows || []);
        setTotalLeads(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      showNotification("Failed to load leads.", "error");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, priorityFilter, assignedFilter, sourceFilter, activeTab, followUpFilter, page]);

  useEffect(() => {
    void fetchAuxiliaryData();
  }, [fetchAuxiliaryData]);

  useEffect(() => {
    void fetchLeads();
  }, [fetchLeads]);

  // Load Lead Activities when selected
  const openLeadDrawer = async (lead: LeadRecord) => {
    setSelectedLead(lead);
    setLoadingActivities(true);
    try {
      const res = await backendFetch(`/admin/crm/leads/${lead.id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedLead(data.lead);
        setActivities(data.activities || []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingActivities(false);
    }
  };

  // Quick Status Update
  const handleUpdateStatus = async (leadId: string, newStatus: LeadStatus) => {
    try {
      const res = await backendFetch(`/admin/crm/leads/${leadId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        const data = await res.json();
        showNotification(`Lead status updated to "${newStatus}"`);
        setLeads((prev) => prev.map((l) => (l.id === leadId ? data.lead : l)));
        if (selectedLead?.id === leadId) setSelectedLead(data.lead);
        void fetchAuxiliaryData();
      }
    } catch {
      showNotification("Failed to update status", "error");
    }
  };

  // Quick Priority Update
  const handleUpdatePriority = async (leadId: string, newPriority: LeadPriority) => {
    try {
      const res = await backendFetch(`/admin/crm/leads/${leadId}`, {
        method: "PATCH",
        body: JSON.stringify({ priority: newPriority })
      });
      if (res.ok) {
        const data = await res.json();
        showNotification(`Priority updated to "${newPriority}"`);
        setLeads((prev) => prev.map((l) => (l.id === leadId ? data.lead : l)));
        if (selectedLead?.id === leadId) setSelectedLead(data.lead);
      }
    } catch {
      showNotification("Failed to update priority", "error");
    }
  };

  // Handle Manual Assignment / Transfer
  const handleTransfer = async () => {
    if (!selectedLead || !transferTargetId) return;
    try {
      const res = await backendFetch(`/admin/crm/leads/${selectedLead.id}/assign`, {
        method: "POST",
        body: JSON.stringify({
          targetEmployeeId: transferTargetId,
          reason: transferReason.trim() || "Manual reassignment"
        })
      });
      if (res.ok) {
        const data = await res.json();
        showNotification(`Lead transferred to ${data.lead.assignedEmployeeName}`);
        setSelectedLead(data.lead);
        setLeads((prev) => prev.map((l) => (l.id === selectedLead.id ? data.lead : l)));
        setShowTransferModal(false);
        setTransferReason("");
        void fetchAuxiliaryData();
        void openLeadDrawer(data.lead);
      } else {
        const err = await res.json();
        showNotification(err.message || "Transfer failed", "error");
      }
    } catch {
      showNotification("Network error during transfer", "error");
    }
  };

  // Trigger Single Auto-Assign
  const handleAutoAssignLead = async (leadId: string) => {
    try {
      const res = await backendFetch(`/admin/crm/leads/${leadId}/auto-assign`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        showNotification(`Auto-assigned to ${data.lead.assignedEmployeeName}`);
        setLeads((prev) => prev.map((l) => (l.id === leadId ? data.lead : l)));
        if (selectedLead?.id === leadId) setSelectedLead(data.lead);
        void fetchAuxiliaryData();
      } else {
        showNotification(data.message || "Auto-assignment could not find eligible agent", "error");
      }
    } catch {
      showNotification("Auto-assignment request failed", "error");
    }
  };

  // Bulk Auto-Assign for Unassigned Queue
  const handleBulkAutoAssign = async () => {
    try {
      const res = await backendFetch("/admin/crm/leads/bulk-auto-assign", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        showNotification(
          `Processed ${data.processed} unassigned leads: ${data.assignedCount} successfully assigned (${data.remainingUnassigned} remaining).`
        );
        void fetchLeads();
        void fetchAuxiliaryData();
      }
    } catch {
      showNotification("Bulk auto-assign failed", "error");
    }
  };

  // Log Touchpoint (Call, WhatsApp, Email, Note)
  const handleLogTouchpoint = async () => {
    if (!selectedLead || !touchpointNotes.trim()) return;
    try {
      const res = await backendFetch(`/admin/crm/leads/${selectedLead.id}/activity`, {
        method: "POST",
        body: JSON.stringify({
          activityType: touchpointType,
          notes: touchpointNotes.trim(),
          title: `${touchpointType.toUpperCase()} touchpoint logged`
        })
      });
      if (res.ok) {
        showNotification("Activity touchpoint saved");
        setTouchpointNotes("");
        setShowTouchpointModal(false);
        void openLeadDrawer(selectedLead);
      }
    } catch {
      showNotification("Failed to save activity", "error");
    }
  };

  // Set / Reschedule Follow-up
  const handleSaveFollowUp = async () => {
    if (!selectedLead || !followUpDateInput) return;
    try {
      const res = await backendFetch(`/admin/crm/leads/${selectedLead.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "Follow-up",
          followUpDate: new Date(followUpDateInput).toISOString()
        })
      });
      if (res.ok) {
        const data = await res.json();
        showNotification("Follow-up date scheduled");
        setSelectedLead(data.lead);
        setLeads((prev) => prev.map((l) => (l.id === selectedLead.id ? data.lead : l)));
        setFollowUpDateInput("");
        void openLeadDrawer(data.lead);
        void fetchAuxiliaryData();
      }
    } catch {
      showNotification("Failed to schedule follow-up", "error");
    }
  };

  // Convert Lead to Booking
  const handleConvertLead = async () => {
    if (!selectedLead) return;
    try {
      const res = await backendFetch(`/admin/crm/leads/${selectedLead.id}/convert`, {
        method: "POST",
        body: JSON.stringify({
          bookingNumber: convertBookingNumber.trim() || undefined,
          convertedAmount: Number(convertAmount) || 0,
          notes: convertNotes.trim()
        })
      });
      if (res.ok) {
        const data = await res.json();
        showNotification(`Lead converted to Confirmed Booking ${data.lead.bookingNumber}!`);
        setSelectedLead(data.lead);
        setLeads((prev) => prev.map((l) => (l.id === selectedLead.id ? data.lead : l)));
        setShowConvertModal(false);
        setConvertNotes("");
        void fetchAuxiliaryData();
        void openLeadDrawer(data.lead);
      }
    } catch {
      showNotification("Failed to convert lead", "error");
    }
  };

  // Create Manual Lead Entry
  const handleCreateManualLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const interestedList = newLeadForm.interestedItems
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((name, idx) => ({ id: `manual-${idx}`, name, kind: "test" as const }));

      const res = await backendFetch("/admin/crm/leads", {
        method: "POST",
        body: JSON.stringify({
          name: newLeadForm.name,
          phone: newLeadForm.phone,
          email: newLeadForm.email || undefined,
          city: newLeadForm.city,
          pincode: newLeadForm.pincode || undefined,
          location: newLeadForm.location || undefined,
          interestedItems: interestedList,
          source: newLeadForm.source,
          campaign: newLeadForm.campaign,
          priority: newLeadForm.priority,
          notes: newLeadForm.notes,
          followUpDate: newLeadForm.followUpDate ? new Date(newLeadForm.followUpDate).toISOString() : undefined,
          autoAssign: newLeadForm.autoAssign,
          assignedEmployeeId: !newLeadForm.autoAssign ? newLeadForm.assignedEmployeeId : undefined
        })
      });

      if (res.ok) {
        const data = await res.json();
        showNotification(
          data.isDuplicate
            ? data.duplicateMessage || "Repeat inquiry detected and attached to existing lead."
            : "New lead captured and routed successfully!"
        );
        setShowNewLeadModal(false);
        setNewLeadForm({
          name: "",
          phone: "",
          email: "",
          city: "Indore",
          pincode: "",
          location: "",
          interestedItems: "",
          source: "manual_customer_care",
          campaign: "Direct_Inquiry",
          priority: "Medium",
          notes: "",
          followUpDate: "",
          autoAssign: true,
          assignedEmployeeId: ""
        });
        void fetchLeads();
        void fetchAuxiliaryData();
      } else {
        const err = await res.json();
        showNotification(err.message || "Failed to create lead", "error");
      }
    } catch {
      showNotification("Network error", "error");
    }
  };

  // Export to CSV
  const handleExportCsv = () => {
    if (leads.length === 0) return;
    const headers = [
      "ID",
      "Name",
      "Phone",
      "Email",
      "City",
      "Pincode",
      "Status",
      "Priority",
      "Assigned To",
      "Source",
      "Campaign",
      "Follow-up Date",
      "Booking Number",
      "Converted Amount",
      "Created At"
    ];
    const rows = leads.map((l) => [
      l.id,
      `"${l.name.replace(/"/g, '""')}"`,
      l.phone,
      l.email || "",
      l.city || "",
      l.pincode || "",
      l.status,
      l.priority,
      `"${(l.assignedEmployeeName || "Unassigned").replace(/"/g, '""')}"`,
      l.source,
      `"${(l.campaign || "").replace(/"/g, '""')}"`,
      l.followUpDate || "",
      l.bookingNumber || "",
      l.convertedAmount || 0,
      l.createdAt
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `scopex-leads-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const summary = report?.summary;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notificationMsg && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl px-5 py-3.5 text-sm font-semibold shadow-2xl transition-all ${
            notificationMsg.type === "error"
              ? "bg-rose-600 text-white"
              : notificationMsg.type === "info"
              ? "bg-stone-900 text-white"
              : "bg-emerald-600 text-white"
          }`}
        >
          {notificationMsg.type === "error" ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
          <span>{notificationMsg.text}</span>
        </div>
      )}

      {/* Top Banner & Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#FF6B00]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#FF6B00]">
              CRM & Customer Care Operations
            </span>
            <span className="text-xs text-stone-400">·</span>
            <span className="text-xs font-semibold text-stone-500">Auto-Routing Active</span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            Diagnostic Lead Desk & Pipeline
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-stone-500 max-w-2xl">
            Real-time lead capture, territorial auto-assignment by PIN code/workload, duplicate prevention, follow-up alerts, and customer care booking conversions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowNewLeadModal(true)}
            className="flex items-center gap-2 rounded-xl bg-[#0D0D0D] px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-[#FF6B00]"
          >
            <Plus className="h-4 w-4" />
            <span>Manual Lead Entry</span>
          </button>

          {summary?.unassignedCount > 0 && (
            <button
              onClick={handleBulkAutoAssign}
              className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-amber-600"
            >
              <UserCheck className="h-4 w-4" />
              <span>Auto-Assign Queue ({summary.unassignedCount})</span>
            </button>
          )}

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-xs font-bold text-stone-700 transition hover:border-stone-400"
            title="Download CSV"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={() => {
              void fetchLeads();
              void fetchAuxiliaryData();
            }}
            className="rounded-xl border border-stone-300 bg-white p-2.5 text-stone-600 transition hover:bg-stone-50"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Total Leads</p>
          <p className="mt-1.5 text-2xl font-black text-stone-900">{summary?.totalLeads ?? totalLeads}</p>
          <p className="mt-1 text-[11px] text-stone-400">All captured inquiries</p>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700">New Unworked</p>
          <p className="mt-1.5 text-2xl font-black text-blue-900">{summary?.newCount ?? 0}</p>
          <p className="mt-1 text-[11px] text-blue-600">Pending first touch</p>
        </div>

        <div className={`rounded-2xl border p-4 shadow-sm ${
          summary?.unassignedCount > 0 ? "border-amber-300 bg-amber-50" : "border-stone-200 bg-white"
        }`}>
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800">Unassigned</p>
            {summary?.unassignedCount > 0 && <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />}
          </div>
          <p className="mt-1.5 text-2xl font-black text-amber-950">{summary?.unassignedCount ?? 0}</p>
          <p className="mt-1 text-[11px] text-amber-700">Requires agent allocation</p>
        </div>

        <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-purple-700">Due Follow-ups</p>
          <p className="mt-1.5 text-2xl font-black text-purple-900">{summary?.todayFollowUps ?? 0}</p>
          <p className="mt-1 text-[11px] text-purple-600">{summary?.overdueFollowUps ?? 0} overdue</p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Converted</p>
          <p className="mt-1.5 text-2xl font-black text-emerald-950">{summary?.convertedCount ?? 0}</p>
          <p className="mt-1 text-[11px] font-semibold text-emerald-700">{summary?.conversionRate ?? 0}% conversion rate</p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-stone-900 text-white p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#FF6B00]">Booked Revenue</p>
          <p className="mt-1.5 text-xl sm:text-2xl font-black text-white">
            ₹{new Intl.NumberFormat("en-IN").format(summary?.totalConvertedRevenue ?? 0)}
          </p>
          <p className="mt-1 text-[11px] text-stone-400">From converted leads</p>
        </div>
      </div>

      {/* Main Tab Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-2">
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => {
              setActiveTab("all");
              setPage(1);
            }}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "all" ? "bg-[#0D0D0D] text-white shadow" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            All Leads ({totalLeads})
          </button>

          <button
            onClick={() => {
              setActiveTab("unassigned");
              setPage(1);
            }}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "unassigned" ? "bg-amber-600 text-white shadow" : "bg-amber-50 text-amber-800 hover:bg-amber-100"
            }`}
          >
            <span>Unassigned Queue</span>
            {summary?.unassignedCount > 0 && (
              <span className="rounded-full bg-amber-700 px-1.5 py-0.2 text-[10px] text-white">
                {summary.unassignedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab("followups");
              setPage(1);
            }}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "followups" ? "bg-purple-700 text-white shadow" : "bg-purple-50 text-purple-800 hover:bg-purple-100"
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Follow-up Reminders</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("converted");
              setPage(1);
            }}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "converted" ? "bg-emerald-700 text-white shadow" : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Converted ({summary?.convertedCount ?? 0})</span>
          </button>

          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "analytics" ? "bg-[#FF6B00] text-white shadow" : "bg-orange-50 text-[#FF6B00] hover:bg-orange-100"
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Conversion Analytics</span>
          </button>
        </div>

        {activeTab === "followups" && (
          <div className="flex items-center gap-1 rounded-xl bg-stone-100 p-1 text-xs">
            {(["today", "overdue", "upcoming", "all"] as FollowUpFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFollowUpFilter(f)}
                className={`rounded-lg px-2.5 py-1 font-semibold capitalize transition ${
                  followUpFilter === f ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-900"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        )}
      </div>

      {activeTab === "analytics" ? (
        /* CONVERSION & PIPELINE REPORTING VIEW WITH RECHARTS TRANSITION TIMELINE */
        <div className="space-y-6">
          {/* Recharts Status Transition & Velocity Visualizer */}
          <CrmConversionChart
            initialReport={report?.transitionReport}
            onTimeframeChange={(days) => {
              setTransitionTimeframe(days);
              void fetchAuxiliaryData(days);
            }}
            isLoading={chartLoading}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Pipeline Funnel */}
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-stone-900">Lead Conversion Funnel</h3>
                  <p className="text-xs text-stone-500">Progression from initial capture to confirmed booking</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                  {summary?.conversionRate ?? 0}% Total Conversion
                </span>
              </div>

              <div className="mt-6 space-y-3">
                {report?.funnel?.map((stage: any, index: number) => (
                  <div key={stage.stage} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-stone-700">{stage.stage}</span>
                      <span className="font-bold text-stone-900">
                        {stage.count} leads ({stage.pct}%)
                      </span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-stone-100">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          index === 0
                            ? "bg-blue-500"
                            : index === 1
                            ? "bg-indigo-500"
                            : index === 2
                            ? "bg-purple-500"
                            : index === 3
                            ? "bg-amber-500"
                            : index === 4
                            ? "bg-orange-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.max(4, stage.pct)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Campaign & Channel Breakdown */}
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <h3 className="text-base font-bold text-stone-900">Source & Campaign Performance</h3>
              <p className="text-xs text-stone-500">Channel attribution and booking revenue</p>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500">
                      <th className="py-2 font-bold">Source / Campaign</th>
                      <th className="py-2 font-bold">Total</th>
                      <th className="py-2 font-bold">Converted</th>
                      <th className="py-2 font-bold">Conv. Rate</th>
                      <th className="py-2 font-bold">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {Object.entries(report?.sourceBreakdown || {}).map(([src, stats]: [string, any]) => {
                      const rate = stats.total > 0 ? Math.round((stats.converted / stats.total) * 100) : 0;
                      return (
                        <tr key={src} className="hover:bg-stone-50">
                          <td className="py-2.5 font-semibold text-stone-800">{src}</td>
                          <td className="py-2.5 text-stone-600">{stats.total}</td>
                          <td className="py-2.5 font-bold text-emerald-700">{stats.converted}</td>
                          <td className="py-2.5">
                            <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-bold text-stone-700">
                              {rate}%
                            </span>
                          </td>
                          <td className="py-2.5 font-bold text-stone-900">₹{stats.revenue}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Team Workload & Conversion Performance */}
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-stone-900">Agent Territorial Workload & Performance</h3>
            <p className="text-xs text-stone-500">Current active workload versus max capacity and conversion rates</p>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500">
                    <th className="py-2 font-bold">Representative</th>
                    <th className="py-2 font-bold">Territory / City</th>
                    <th className="py-2 font-bold">Pincodes Covered</th>
                    <th className="py-2 font-bold">Active Workload</th>
                    <th className="py-2 font-bold">Max Capacity</th>
                    <th className="py-2 font-bold">Total Assigned</th>
                    <th className="py-2 font-bold">Converted</th>
                    <th className="py-2 font-bold">Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {report?.teamPerformance?.map((member: any) => {
                    const pct = Math.round((member.currentWorkload / member.maxDailyWorkload) * 100);
                    return (
                      <tr key={member.id} className="hover:bg-stone-50">
                        <td className="py-3 font-bold text-stone-900">{member.name}</td>
                        <td className="py-3 text-stone-600">{member.city}</td>
                        <td className="py-3 text-[11px] text-stone-500 max-w-xs truncate">
                          {teamMembers.find((t) => t.id === member.id)?.coveredPincodes?.join(", ") || "All National"}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-900">{member.currentWorkload}</span>
                            <div className="h-2 w-16 rounded-full bg-stone-100 overflow-hidden">
                              <div
                                className={`h-full ${pct > 80 ? "bg-rose-500" : pct > 50 ? "bg-amber-500" : "bg-emerald-500"}`}
                                style={{ width: `${Math.min(100, pct)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-stone-500">{member.maxDailyWorkload} / day</td>
                        <td className="py-3 text-stone-600">{member.totalAssigned}</td>
                        <td className="py-3 font-bold text-emerald-700">{member.converted}</td>
                        <td className="py-3 font-bold text-stone-900">{member.conversionRate}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* LEADS LIST & TABLE VIEW */
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by name, phone, email, PIN code, test..."
                className="w-full rounded-xl border border-stone-300 py-2.5 pl-10 pr-3.5 text-xs sm:text-sm focus:border-[#FF6B00] focus:outline-none"
              />
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-stone-300 bg-white py-2.5 px-3 text-xs sm:text-sm focus:border-[#FF6B00] focus:outline-none"
              >
                <option value="all">All Statuses</option>
                {ALL_LEAD_STATUSES.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-stone-300 bg-white py-2.5 px-3 text-xs sm:text-sm focus:border-[#FF6B00] focus:outline-none"
              >
                <option value="all">All Priorities</option>
                <option value="Urgent">Urgent</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <select
                value={assignedFilter}
                onChange={(e) => {
                  setAssignedFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-stone-300 bg-white py-2.5 px-3 text-xs sm:text-sm focus:border-[#FF6B00] focus:outline-none"
              >
                <option value="all">All Team Members</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} ({m.city})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50/70 text-stone-500 uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4 font-bold">Contact & Patient</th>
                    <th className="py-3.5 px-4 font-bold">Location</th>
                    <th className="py-3.5 px-4 font-bold">Interested Tests / Package</th>
                    <th className="py-3.5 px-4 font-bold">Source & Campaign</th>
                    <th className="py-3.5 px-4 font-bold">Assigned Agent</th>
                    <th className="py-3.5 px-4 font-bold">Status</th>
                    <th className="py-3.5 px-4 font-bold">Priority</th>
                    <th className="py-3.5 px-4 font-bold">Follow-up</th>
                    <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-sm text-stone-400">
                        <RefreshCw className="mx-auto h-6 w-6 animate-spin text-[#FF6B00]" />
                        <p className="mt-2 font-medium">Loading leads...</p>
                      </td>
                    </tr>
                  ) : leads.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-stone-500">
                        <Users className="mx-auto h-8 w-8 text-stone-300" />
                        <p className="mt-2 text-sm font-bold text-stone-700">No leads found in this view</p>
                        <p className="mt-1 text-xs text-stone-400">Try adjusting your search criteria or filters.</p>
                      </td>
                    </tr>
                  ) : (
                    leads.map((lead) => {
                      const isUnassigned = !lead.assignedEmployeeId;
                      const hasDuplicate = lead.duplicateCount > 0;
                      return (
                        <tr
                          key={lead.id}
                          className="group hover:bg-[#FFF8F2]/60 transition-colors cursor-pointer"
                          onClick={() => openLeadDrawer(lead)}
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-stone-900 group-hover:text-[#FF6B00] transition">
                                {lead.name}
                              </p>
                              {hasDuplicate && (
                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800" title="Multiple inquiries received">
                                  Duplicate ({lead.duplicateCount})
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 text-stone-500 font-mono text-[11px]">+91 {lead.phone}</p>
                            {lead.email && <p className="text-[11px] text-stone-400 truncate max-w-[150px]">{lead.email}</p>}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1 font-semibold text-stone-800">
                              <MapPin className="h-3 w-3 text-stone-400 shrink-0" />
                              <span>{lead.city || "Indore"}</span>
                            </div>
                            <p className="text-[11px] text-stone-500">{lead.pincode || "PIN: N/A"}</p>
                          </td>

                          <td className="py-3.5 px-4 max-w-xs">
                            {lead.interestedItems && lead.interestedItems.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {lead.interestedItems.slice(0, 2).map((item, idx) => (
                                  <span
                                    key={idx}
                                    className="rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-700 truncate max-w-[140px]"
                                    title={item.name}
                                  >
                                    {item.name}
                                  </span>
                                ))}
                                {lead.interestedItems.length > 2 && (
                                  <span className="text-[10px] text-stone-400 font-bold self-center">
                                    +{lead.interestedItems.length - 2} more
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-stone-400 italic">General Inquiry</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-600 uppercase">
                              {lead.source.replace(/_/g, " ")}
                            </span>
                            {lead.campaign && (
                              <p className="mt-1 text-[11px] text-stone-500 truncate max-w-[120px]" title={lead.campaign}>
                                {lead.campaign}
                              </p>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            {isUnassigned ? (
                              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700">
                                  Unassigned
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleAutoAssignLead(lead.id)}
                                  className="rounded-lg bg-stone-900 px-2 py-1 text-[10px] font-bold text-white transition hover:bg-[#FF6B00]"
                                  title="Run Auto-Assignment"
                                >
                                  Auto-Assign
                                </button>
                              </div>
                            ) : (
                              <div>
                                <p className="font-semibold text-stone-900">{lead.assignedEmployeeName}</p>
                                <span className="text-[10px] text-stone-400 capitalize">
                                  via {lead.assignmentMode}
                                </span>
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                            <select
                              value={lead.status}
                              onChange={(e) => handleUpdateStatus(lead.id, e.target.value as LeadStatus)}
                              className={`rounded-lg border px-2 py-1 text-[11px] font-bold focus:outline-none ${
                                lead.status === "New"
                                  ? "border-blue-300 bg-blue-50 text-blue-800"
                                  : lead.status === "Contacted"
                                  ? "border-amber-300 bg-amber-50 text-amber-800"
                                  : lead.status === "Qualified"
                                  ? "border-purple-300 bg-purple-50 text-purple-800"
                                  : lead.status === "Follow-up"
                                  ? "border-orange-300 bg-orange-50 text-orange-800"
                                  : lead.status === "Booking Pending"
                                  ? "border-indigo-300 bg-indigo-50 text-indigo-800"
                                  : lead.status === "Converted"
                                  ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                  : "border-stone-300 bg-stone-100 text-stone-600"
                              }`}
                            >
                              {ALL_LEAD_STATUSES.map((st) => (
                                <option key={st} value={st}>{st}</option>
                              ))}
                            </select>
                          </td>

                          <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                            <select
                              value={lead.priority}
                              onChange={(e) => handleUpdatePriority(lead.id, e.target.value as LeadPriority)}
                              className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                                lead.priority === "Urgent"
                                  ? "bg-rose-100 text-rose-800"
                                  : lead.priority === "High"
                                  ? "bg-amber-100 text-amber-800"
                                  : lead.priority === "Medium"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-stone-100 text-stone-600"
                              }`}
                            >
                              <option value="Urgent">Urgent</option>
                              <option value="High">High</option>
                              <option value="Medium">Medium</option>
                              <option value="Low">Low</option>
                            </select>
                          </td>

                          <td className="py-3.5 px-4 text-stone-600">
                            {lead.followUpDate ? (
                              <div>
                                <p className="font-semibold text-stone-800">
                                  {new Date(lead.followUpDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                                </p>
                                <p className="text-[10px] text-stone-400">
                                  {new Date(lead.followUpDate).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                                </p>
                              </div>
                            ) : (
                              <span className="text-stone-300">—</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <a
                                href={`tel:+91${lead.phone}`}
                                className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                                title="Call Patient"
                              >
                                <Phone className="h-3.5 w-3.5" />
                              </a>
                              <a
                                href={`https://wa.me/91${lead.phone}?text=${encodeURIComponent(`Hello ${lead.name}, thank you for contacting ScopeX Diagnostics regarding ${lead.interestedItems?.[0]?.name || "diagnostic testing"}. How can we assist you today?`)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50"
                                title="WhatsApp Chat"
                              >
                                <MessageSquare className="h-3.5 w-3.5" />
                              </a>
                              <button
                                type="button"
                                onClick={() => openLeadDrawer(lead)}
                                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                              >
                                <ChevronRight className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-stone-200 px-4 py-3 text-xs text-stone-500">
              <p>
                Showing {leads.length} of {totalLeads} records (Page {page} of {totalPages})
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-stone-300 px-3 py-1 font-semibold disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-lg border border-stone-300 px-3 py-1 font-semibold disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LEAD DETAIL & ACTION SLIDE-OVER DRAWER */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative flex h-full w-full max-w-xl flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="flex items-start justify-between border-b border-stone-200 p-5 bg-stone-50/60">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                    selectedLead.priority === "Urgent" ? "bg-rose-100 text-rose-800" : "bg-stone-200 text-stone-700"
                  }`}>
                    {selectedLead.priority} Priority
                  </span>
                  <span className="text-xs text-stone-400">·</span>
                  <span className="text-xs font-mono text-stone-500">#{selectedLead.id.slice(0, 8)}</span>
                </div>
                <h2 className="mt-1 text-xl font-bold text-stone-900">{selectedLead.name}</h2>
                <p className="text-xs text-stone-500 font-mono">+91 {selectedLead.phone}</p>
              </div>

              <button
                onClick={() => setSelectedLead(null)}
                className="rounded-full p-2 text-stone-400 hover:bg-stone-200 hover:text-stone-700"
              >
                ✕
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Duplicate Detection Alert */}
              {selectedLead.duplicateCount > 0 && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>Repeat Inquiries Detected ({selectedLead.duplicateCount} duplicates)</span>
                  </div>
                  <p className="mt-1 text-[11px] text-amber-800 leading-relaxed">
                    Customer submitted repeat requests across channels. Touchpoints have been merged under this active record to prevent duplicate database records.
                  </p>
                </div>
              )}

              {/* Status & Priority Control Card */}
              <div className="rounded-2xl border border-stone-200 bg-stone-50/50 p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Pipeline Status</label>
                    <select
                      value={selectedLead.status}
                      onChange={(e) => handleUpdateStatus(selectedLead.id, e.target.value as LeadStatus)}
                      className="mt-1 w-full rounded-xl border border-stone-300 bg-white py-2 px-3 text-xs font-bold text-stone-900 focus:border-[#FF6B00] focus:outline-none"
                    >
                      {ALL_LEAD_STATUSES.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Priority</label>
                    <select
                      value={selectedLead.priority}
                      onChange={(e) => handleUpdatePriority(selectedLead.id, e.target.value as LeadPriority)}
                      className="mt-1 w-full rounded-xl border border-stone-300 bg-white py-2 px-3 text-xs font-bold text-stone-900 focus:border-[#FF6B00] focus:outline-none"
                    >
                      <option value="Urgent">Urgent</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                </div>

                {/* Assignment Info & Action */}
                <div className="border-t border-stone-200 pt-3 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Assigned Representative</p>
                    <p className="text-sm font-bold text-stone-900">
                      {selectedLead.assignedEmployeeName || "Unassigned"}
                    </p>
                    <p className="text-[10px] text-stone-400">{selectedLead.assignmentReason || "No assignment details"}</p>
                  </div>

                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setTransferTargetId(selectedLead.assignedEmployeeId || teamMembers[0]?.id || "");
                        setShowTransferModal(true);
                      }}
                      className="rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-bold text-stone-700 hover:border-stone-400"
                    >
                      Transfer
                    </button>
                    {!selectedLead.assignedEmployeeId && (
                      <button
                        type="button"
                        onClick={() => handleAutoAssignLead(selectedLead.id)}
                        className="rounded-lg bg-[#0D0D0D] px-2.5 py-1.5 text-xs font-bold text-white hover:bg-[#FF6B00]"
                      >
                        Auto-Assign
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Conversion / Customer Care Connection Card */}
              {selectedLead.status === "Converted" ? (
                <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <span>Converted to Confirmed Booking</span>
                  </div>
                  <div className="mt-2 text-xs text-emerald-900 space-y-1">
                    <p><span className="font-semibold">Booking Number:</span> {selectedLead.bookingNumber || "SCX-2026-CONFIRMED"}</p>
                    <p><span className="font-semibold">Amount:</span> ₹{selectedLead.convertedAmount || 0}</p>
                    <p><span className="font-semibold">Converted At:</span> {selectedLead.convertedAt ? new Date(selectedLead.convertedAt).toLocaleString("en-IN") : "Recent"}</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-stone-200 bg-white p-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">Convert Lead to Booking</h4>
                    <p className="text-[11px] text-stone-500">Creates booking & connects customer record</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setConvertAmount(selectedLead.interestedItems?.[0]?.price || 850);
                      setShowConvertModal(true);
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow transition hover:bg-emerald-700"
                  >
                    <Award className="h-3.5 w-3.5" />
                    <span>Convert Now</span>
                  </button>
                </div>
              )}

              {/* Patient Details & Location */}
              <div className="rounded-2xl border border-stone-200 bg-white p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">Contact & Demographics</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-stone-400">Phone:</span>
                    <p className="font-semibold text-stone-800">+91 {selectedLead.phone}</p>
                  </div>
                  <div>
                    <span className="text-stone-400">Email:</span>
                    <p className="font-semibold text-stone-800 truncate">{selectedLead.email || "Not provided"}</p>
                  </div>
                  <div>
                    <span className="text-stone-400">City / State:</span>
                    <p className="font-semibold text-stone-800">{selectedLead.city || "Indore"}</p>
                  </div>
                  <div>
                    <span className="text-stone-400">PIN Code:</span>
                    <p className="font-semibold text-stone-800">{selectedLead.pincode || "N/A"}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-stone-400">Address / Location:</span>
                    <p className="font-semibold text-stone-800">{selectedLead.location || "N/A"}</p>
                  </div>
                </div>

                <div className="border-t border-stone-100 pt-2 flex flex-wrap items-center gap-3 text-[11px]">
                  <span className="text-stone-400">Consent:</span>
                  <span className="font-bold text-emerald-600">✓ Opted-in for WhatsApp & Call</span>
                  <span className="text-stone-400">·</span>
                  <span className="text-stone-400">Source:</span>
                  <span className="font-semibold text-stone-700 capitalize">{selectedLead.source}</span>
                </div>
              </div>

              {/* Interested Tests / Packages */}
              <div className="rounded-2xl border border-stone-200 bg-white p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">Interested Diagnostic Items</h4>
                {selectedLead.interestedItems && selectedLead.interestedItems.length > 0 ? (
                  <div className="space-y-1.5">
                    {selectedLead.interestedItems.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between rounded-xl bg-stone-50 p-2.5 text-xs">
                        <span className="font-bold text-stone-800">{item.name}</span>
                        {item.price ? <span className="font-semibold text-[#FF6B00]">₹{item.price}</span> : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-stone-400 italic">No specific tests pre-selected</p>
                )}
              </div>

              {/* Follow-up Section */}
              <div className="rounded-2xl border border-stone-200 bg-white p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">Follow-up Reminder</h4>
                  {selectedLead.followUpDate && (
                    <span className="text-xs font-bold text-purple-700">
                      {new Date(selectedLead.followUpDate).toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="datetime-local"
                    value={followUpDateInput}
                    onChange={(e) => setFollowUpDateInput(e.target.value)}
                    className="flex-1 rounded-xl border border-stone-300 py-1.5 px-3 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleSaveFollowUp}
                    disabled={!followUpDateInput}
                    className="rounded-xl bg-stone-900 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#FF6B00] disabled:opacity-40"
                  >
                    Schedule
                  </button>
                </div>
              </div>

              {/* Action Buttons for Logging Touchpoints */}
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTouchpointType("call");
                    setShowTouchpointModal(true);
                  }}
                  className="flex flex-col items-center justify-center gap-1 rounded-xl border border-stone-200 p-2.5 text-stone-700 transition hover:border-[#FF6B00] hover:text-[#FF6B00]"
                >
                  <Phone className="h-4 w-4" />
                  <span className="text-[10px] font-bold">Log Call</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTouchpointType("whatsapp");
                    setShowTouchpointModal(true);
                  }}
                  className="flex flex-col items-center justify-center gap-1 rounded-xl border border-stone-200 p-2.5 text-stone-700 transition hover:border-emerald-500 hover:text-emerald-600"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-[10px] font-bold">WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTouchpointType("email");
                    setShowTouchpointModal(true);
                  }}
                  className="flex flex-col items-center justify-center gap-1 rounded-xl border border-stone-200 p-2.5 text-stone-700 transition hover:border-blue-500 hover:text-blue-600"
                >
                  <Mail className="h-4 w-4" />
                  <span className="text-[10px] font-bold">Log Email</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTouchpointType("note");
                    setShowTouchpointModal(true);
                  }}
                  className="flex flex-col items-center justify-center gap-1 rounded-xl border border-stone-200 p-2.5 text-stone-700 transition hover:border-stone-400"
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-[10px] font-bold">Add Note</span>
                </button>
              </div>

              {/* Activity Timeline */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">Activity & Touchpoint History</h4>

                {loadingActivities ? (
                  <p className="text-xs text-stone-400 text-center py-4">Loading history...</p>
                ) : activities.length === 0 ? (
                  <p className="text-xs text-stone-400 italic">No touchpoints recorded yet</p>
                ) : (
                  <div className="relative pl-6 space-y-4 border-l-2 border-stone-200 ml-2">
                    {activities.map((act) => (
                      <div key={act.id} className="relative">
                        <div className="absolute -left-[31px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#FF6B00] text-white">
                          <span className="h-1.5 w-1.5 rounded-full bg-white" />
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-stone-900">{act.title}</span>
                            <span className="text-[10px] text-stone-400">
                              {new Date(act.createdAt).toLocaleString("en-IN", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-stone-600 leading-relaxed">{act.notes}</p>
                          <p className="mt-1 text-[10px] text-stone-400 italic">By {act.performedBy}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MANUAL LEAD ENTRY */}
      {showNewLeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl sm:p-8">
            <button
              onClick={() => setShowNewLeadModal(false)}
              className="absolute right-5 top-5 text-stone-400 hover:text-stone-700"
            >
              ✕
            </button>

            <h3 className="text-xl font-black text-stone-900">Manual Lead Entry</h3>
            <p className="text-xs text-stone-500 mt-1">Capture inbound call, walk-in patient, or doctor referral</p>

            <form onSubmit={handleCreateManualLead} className="mt-5 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700">Patient Name *</label>
                  <input
                    required
                    type="text"
                    value={newLeadForm.name}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, name: e.target.value })}
                    placeholder="Full name"
                    className="mt-1 w-full rounded-xl border border-stone-300 py-2 px-3 text-sm focus:border-[#FF6B00] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700">Mobile Number *</label>
                  <input
                    required
                    type="tel"
                    maxLength={10}
                    value={newLeadForm.phone}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, phone: e.target.value.replace(/\D/g, "") })}
                    placeholder="10-digit number"
                    className="mt-1 w-full rounded-xl border border-stone-300 py-2 px-3 text-sm focus:border-[#FF6B00] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700">Email Address</label>
                  <input
                    type="email"
                    value={newLeadForm.email}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                    placeholder="name@example.com"
                    className="mt-1 w-full rounded-xl border border-stone-300 py-2 px-3 text-sm focus:border-[#FF6B00] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700">City</label>
                  <select
                    value={newLeadForm.city}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, city: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-stone-300 bg-white py-2 px-3 text-sm focus:border-[#FF6B00] focus:outline-none"
                  >
                    <option value="Indore">Indore</option>
                    <option value="Bhopal">Bhopal</option>
                    <option value="Lucknow">Lucknow</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Jaipur">Jaipur (Out of Coverage)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700">PIN Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={newLeadForm.pincode}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, pincode: e.target.value.replace(/\D/g, "") })}
                    placeholder="e.g. 452001"
                    className="mt-1 w-full rounded-xl border border-stone-300 py-2 px-3 text-sm focus:border-[#FF6B00] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700">Priority</label>
                  <select
                    value={newLeadForm.priority}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, priority: e.target.value as LeadPriority })}
                    className="mt-1 w-full rounded-xl border border-stone-300 bg-white py-2 px-3 text-sm focus:border-[#FF6B00] focus:outline-none"
                  >
                    <option value="Urgent">Urgent</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700">Interested Tests / Packages</label>
                <input
                  type="text"
                  value={newLeadForm.interestedItems}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, interestedItems: e.target.value })}
                  placeholder="e.g. CBC, Lipid Profile, Vitamin D3 (comma separated)"
                  className="mt-1 w-full rounded-xl border border-stone-300 py-2 px-3 text-sm focus:border-[#FF6B00] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700">Inquiry Source</label>
                  <select
                    value={newLeadForm.source}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, source: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-stone-300 bg-white py-2 px-3 text-sm focus:border-[#FF6B00] focus:outline-none"
                  >
                    <option value="manual_customer_care">Inbound Phone Call</option>
                    <option value="whatsapp_enquiry">WhatsApp Chat</option>
                    <option value="walk_in">Lab Walk-in</option>
                    <option value="doctor_referral">Doctor Referral</option>
                    <option value="corporate_camp">Health Camp</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700">Campaign / Tag</label>
                  <input
                    type="text"
                    value={newLeadForm.campaign}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, campaign: e.target.value })}
                    placeholder="e.g. Winter_Health_Camp"
                    className="mt-1 w-full rounded-xl border border-stone-300 py-2 px-3 text-sm focus:border-[#FF6B00] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700">Internal Notes / Instructions</label>
                <textarea
                  rows={2}
                  value={newLeadForm.notes}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, notes: e.target.value })}
                  placeholder="e.g. Patient requests 7 AM home sample collection; fasting required"
                  className="mt-1 w-full rounded-xl border border-stone-300 py-2 px-3 text-sm focus:border-[#FF6B00] focus:outline-none"
                />
              </div>

              <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-stone-800">
                  <input
                    type="checkbox"
                    checked={newLeadForm.autoAssign}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, autoAssign: e.target.checked })}
                    className="h-4 w-4 rounded text-[#FF6B00]"
                  />
                  <span>Run Territorial Auto-Assignment (By PIN / City / Workload)</span>
                </label>

                {!newLeadForm.autoAssign && (
                  <div>
                    <label className="text-[11px] font-semibold text-stone-600">Assign Directly To:</label>
                    <select
                      value={newLeadForm.assignedEmployeeId}
                      onChange={(e) => setNewLeadForm({ ...newLeadForm, assignedEmployeeId: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-stone-300 bg-white py-1.5 px-2.5 text-xs focus:outline-none"
                    >
                      <option value="">Leave Unassigned in Queue</option>
                      {teamMembers.map((m) => (
                        <option key={m.id} value={m.id}>{m.name} ({m.city})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="mt-2 w-full rounded-xl bg-[#0D0D0D] py-3 text-sm font-bold text-white transition hover:bg-[#FF6B00]"
              >
                Create Lead & Route
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MANUAL TRANSFER */}
      {showTransferModal && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-stone-900">Transfer Lead</h3>
            <p className="text-xs text-stone-500 mt-1">Reassign {selectedLead.name} to another care specialist</p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-stone-700">Target Care Specialist</label>
                <select
                  value={transferTargetId}
                  onChange={(e) => setTransferTargetId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-300 bg-white py-2 px-3 text-xs focus:border-[#FF6B00] focus:outline-none"
                >
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} — {m.city} ({m.currentWorkload}/{m.maxDailyWorkload} workload)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700">Transfer Reason / Handover Note</label>
                <textarea
                  rows={3}
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="e.g. Customer requested specific collection zone covered by Rohit"
                  className="mt-1 w-full rounded-xl border border-stone-300 py-2 px-3 text-xs focus:border-[#FF6B00] focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="flex-1 rounded-xl border border-stone-300 py-2.5 text-xs font-bold text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleTransfer}
                  className="flex-1 rounded-xl bg-[#0D0D0D] py-2.5 text-xs font-bold text-white hover:bg-[#FF6B00]"
                >
                  Confirm Transfer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LOG TOUCHPOINT */}
      {showTouchpointModal && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-stone-900 capitalize">Log {touchpointType} Touchpoint</h3>
            <p className="text-xs text-stone-500 mt-1">Record interaction with {selectedLead.name}</p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-stone-700">Interaction Summary / Outcome *</label>
                <textarea
                  required
                  rows={4}
                  value={touchpointNotes}
                  onChange={(e) => setTouchpointNotes(e.target.value)}
                  placeholder="e.g. Called customer. Patient requested quote for Full Body Checkup for 2 family members. Agreed for follow-up on Friday morning."
                  className="mt-1 w-full rounded-xl border border-stone-300 py-2 px-3 text-xs focus:border-[#FF6B00] focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTouchpointModal(false)}
                  className="flex-1 rounded-xl border border-stone-300 py-2.5 text-xs font-bold text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleLogTouchpoint}
                  disabled={!touchpointNotes.trim()}
                  className="flex-1 rounded-xl bg-[#0D0D0D] py-2.5 text-xs font-bold text-white hover:bg-[#FF6B00] disabled:opacity-40"
                >
                  Save Activity
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONVERT TO BOOKING */}
      {showConvertModal && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-100 p-2 text-emerald-600">
                <Award className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-lg font-bold text-stone-900">Convert Lead to Booking</h3>
                <p className="text-xs text-stone-500">Connects with Customer Care and links booking</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-stone-700">Confirmed Booking Amount (₹) *</label>
                <input
                  type="number"
                  value={convertAmount}
                  onChange={(e) => setConvertAmount(Number(e.target.value))}
                  placeholder="Total order value"
                  className="mt-1 w-full rounded-xl border border-stone-300 py-2 px-3 text-sm font-bold text-stone-900 focus:border-[#FF6B00] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700">Booking Reference Number (Optional)</label>
                <input
                  type="text"
                  value={convertBookingNumber}
                  onChange={(e) => setConvertBookingNumber(e.target.value)}
                  placeholder="Leave empty to auto-generate SCX-2026-XXXXXX"
                  className="mt-1 w-full rounded-xl border border-stone-300 py-2 px-3 text-xs focus:border-[#FF6B00] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700">Fulfillment / Phlebotomy Notes</label>
                <textarea
                  rows={2}
                  value={convertNotes}
                  onChange={(e) => setConvertNotes(e.target.value)}
                  placeholder="e.g. Sample collection confirmed for tomorrow 7:30 AM"
                  className="mt-1 w-full rounded-xl border border-stone-300 py-2 px-3 text-xs focus:border-[#FF6B00] focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConvertModal(false)}
                  className="flex-1 rounded-xl border border-stone-300 py-2.5 text-xs font-bold text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConvertLead}
                  className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 shadow"
                >
                  Confirm Conversion
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
