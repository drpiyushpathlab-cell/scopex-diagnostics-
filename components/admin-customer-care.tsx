"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Phone,
  PhoneCall,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Truck,
  Send,
  UserCheck,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  MapPin,
  FileText,
  ArrowRight,
  ShieldAlert,
  ChevronDown,
  UserPlus,
  Activity,
  Check
} from "lucide-react";
import { backendFetch, getStoredAuthUser } from "@/lib/backend-client";
import type { CollectionJob, PhlebotomistProfile } from "@/lib/phlebotomist-service";

type CareTab = "queues" | "bookings" | "leads" | "exceptions" | "history";

export function AdminCustomerCareDesk() {
  const [activeTab, setActiveTab] = useState<CareTab>("queues");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [summary, setSummary] = useState<any>(null);
  const [queues, setQueues] = useState<any>({
    pendingConfirmations: [],
    pendingDispatch: [],
    cancellations: [],
    exceptions: [],
    followUpsDueToday: []
  });
  const [recentCalls, setRecentCalls] = useState<any[]>([]);
  const [recentMessages, setRecentMessages] = useState<any[]>([]);

  // All bookings & leads
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [allLeads, setAllLeads] = useState<any[]>([]);
  const [phlebotomistTeam, setPhlebotomistTeam] = useState<PhlebotomistProfile[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");

  // Modals
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);

  // Call form state
  const [callType, setCallType] = useState<"outbound" | "inbound">("outbound");
  const [callOutcome, setCallOutcome] = useState<string>("connected_interested");
  const [callDuration, setCallDuration] = useState("90");
  const [callNotes, setCallNotes] = useState("");
  const [callFollowUpDate, setCallFollowUpDate] = useState("");

  // Message form state
  const [messageChannel, setMessageChannel] = useState<"whatsapp" | "sms">("whatsapp");
  const [messageTemplate, setMessageTemplate] = useState("Slot Confirmation");
  const [messageContent, setMessageContent] = useState("");

  // Dispatch form state
  const [dispatchMode, setDispatchMode] = useState<"auto" | "manual">("auto");
  const [selectedPhlebId, setSelectedPhlebId] = useState("");
  const [dispatchDate, setDispatchDate] = useState(new Date().toISOString().split("T")[0]);
  const [dispatchSlot, setDispatchSlot] = useState("07:30 AM - 08:30 AM");
  const [dispatchNotes, setDispatchNotes] = useState("");
  const [dispatchResult, setDispatchResult] = useState<any | null>(null);

  // Confirm & Cancel forms
  const [confirmNotes, setConfirmNotes] = useState("");
  const [cancelReason, setCancelReason] = useState("");

  // Convert Lead form
  const [convertSelectedTests, setConvertSelectedTests] = useState("Complete Blood Count (CBC), Lipid Profile");
  const [convertAddress, setConvertAddress] = useState("");
  const [convertSlot, setConvertSlot] = useState("08:00 AM - 09:00 AM");
  const [convertDate, setConvertDate] = useState(new Date().toISOString().split("T")[0]);
  const [convertAmount, setConvertAmount] = useState(699);

  const authUser = getStoredAuthUser();
  const agentName = authUser?.email?.split("@")[0] || "Customer Care Agent";

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, bookingsRes, leadsRes, teamRes] = await Promise.all([
        backendFetch("/admin/customer-care/dashboard"),
        backendFetch("/admin/bookings-management"),
        backendFetch("/admin/crm/leads?pageSize=50"),
        backendFetch("/phlebotomist/team")
      ]);

      if (dashRes.ok) {
        const d = await dashRes.json();
        setSummary(d.summary || {});
        setQueues(d.queues || {});
        setRecentCalls(d.recentCalls || []);
        setRecentMessages(d.recentMessages || []);
      }
      if (bookingsRes.ok) {
        const b = await bookingsRes.json();
        setAllBookings(b.rows || []);
      }
      if (leadsRes.ok) {
        const l = await leadsRes.json();
        setAllLeads(l.leads || []);
      }
      if (teamRes.ok) {
        const t = await teamRes.json();
        setPhlebotomistTeam(t.team || []);
      }
      setMessage("");
    } catch (err: any) {
      setMessage(err.message || "Failed to load customer care records.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Handle Call Submit
  const handleLogCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      const res = await backendFetch("/admin/customer-care/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetId: selectedItem.id,
          targetKind: selectedItem.booking_number ? "booking" : "lead",
          callType,
          outcome: callOutcome,
          durationSeconds: Number(callDuration) || 60,
          notes: callNotes,
          scheduledFollowUpDate: callFollowUpDate || undefined,
          performedBy: agentName
        })
      });

      if (res.ok) {
        setShowCallModal(false);
        setCallNotes("");
        setCallFollowUpDate("");
        void loadData();
      }
    } catch {
      // Handled
    }
  };

  // Handle Message Submit
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      const res = await backendFetch("/admin/customer-care/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetId: selectedItem.id,
          targetKind: selectedItem.booking_number ? "booking" : "lead",
          channel: messageChannel,
          templateTitle: messageTemplate,
          messageContent: messageContent || `Hello from SCOPEX Diagnostics. Your appointment is confirmed for ${selectedItem.preferred_date || "tomorrow"}.`,
          performedBy: agentName
        })
      });

      if (res.ok) {
        setShowMessageModal(false);
        setMessageContent("");
        void loadData();
      }
    } catch {
      // Handled
    }
  };

  // Handle Confirmation Submit
  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      const res = await backendFetch("/admin/customer-care/confirm-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: selectedItem.id,
          notes: confirmNotes || "Patient confirmed slot and fasting requirements over phone.",
          performedBy: agentName
        })
      });

      if (res.ok) {
        setShowConfirmModal(false);
        setConfirmNotes("");
        void loadData();
      }
    } catch {
      // Handled
    }
  };

  // Handle Cancellation Submit
  const handleCancelBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      const res = await backendFetch("/admin/customer-care/cancel-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: selectedItem.id,
          reason: cancelReason || "Patient requested cancellation.",
          performedBy: agentName
        })
      });

      if (res.ok) {
        setShowCancelModal(false);
        setCancelReason("");
        void loadData();
      }
    } catch {
      // Handled
    }
  };

  // Handle Transfer to Collection Operations
  const handleDispatchCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      const res = await backendFetch("/admin/customer-care/transfer-to-collection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: selectedItem.id,
          bookingNumber: selectedItem.booking_number || selectedItem.booking_id,
          customerName: selectedItem.customer_name || selectedItem.contact_name,
          customerPhone: selectedItem.customer_phone || selectedItem.contact_phone,
          patientName: selectedItem.customer_name,
          address: selectedItem.address || "Main Road",
          pincode: selectedItem.pincode || "452001",
          city: selectedItem.city || "Indore",
          scheduledDate: dispatchDate,
          scheduledTime: dispatchSlot,
          allocationMode: dispatchMode,
          targetPhlebotomistId: dispatchMode === "manual" ? selectedPhlebId : undefined,
          specialInstructions: dispatchNotes,
          performedBy: agentName
        })
      });

      const data = await res.json();
      setDispatchResult(data);
      void loadData();
    } catch (err: any) {
      setDispatchResult({ success: false, message: err.message });
    }
  };

  // Convert Lead to Booking
  const handleConvertLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      const res = await backendFetch("/admin/crm/leads/" + selectedItem.id + "/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          convertedAmount: convertAmount,
          notes: `Converted by ${agentName}. Tests: ${convertSelectedTests}. Scheduled: ${convertDate} (${convertSlot}). Address: ${convertAddress || selectedItem.location || selectedItem.city}`,
          performedBy: agentName
        })
      });

      if (res.ok) {
        setShowConvertModal(false);
        void loadData();
      }
    } catch {
      // Handled
    }
  };

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    return allBookings.filter((b) => {
      const matchesSearch =
        !searchQuery.trim() ||
        String(b.booking_number || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(b.customer_name || b.contact_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(b.customer_phone || b.contact_phone || "").includes(searchQuery);

      const matchesStatus = statusFilter === "all" || b.booking_status === statusFilter;
      const matchesCity = cityFilter === "all" || String(b.city || "").toLowerCase() === cityFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesCity;
    });
  }, [allBookings, searchQuery, statusFilter, cityFilter]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Operations Hub
            </span>
            <span className="text-xs text-gray-500">Logged in as {agentName}</span>
          </div>
          <h1 className="mt-2 text-2xl font-black text-[#0D0D0D] md:text-3xl">
            Customer Care & Phlebotomy Dispatch Desk
          </h1>
          <p className="mt-1 text-sm text-[#5f6868]">
            Manage authorized patient callbacks, slot confirmations, cancellations, lead conversions, and real-time phlebotomist dispatch.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/phlebotomist"
            className="inline-flex items-center gap-2 rounded-xl bg-[#008080] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#006666] transition"
          >
            <Truck className="h-4 w-4" />
            Phlebotomist Field View
          </Link>
          <button
            onClick={() => void loadData()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards / Operational Queues Summary */}
      {summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <div
            onClick={() => setActiveTab("queues")}
            className="cursor-pointer rounded-2xl border border-amber-200 bg-amber-50/70 p-4 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Confirmations</span>
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            <p className="mt-2 text-2xl font-black text-amber-950">{summary.pendingConfirmationsCount}</p>
            <p className="mt-1 text-xs text-amber-700">Awaiting call</p>
          </div>

          <div
            onClick={() => setActiveTab("queues")}
            className="cursor-pointer rounded-2xl border border-blue-200 bg-blue-50/70 p-4 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Dispatch</span>
              <Truck className="h-4 w-4 text-blue-600" />
            </div>
            <p className="mt-2 text-2xl font-black text-blue-950">{summary.pendingDispatchCount}</p>
            <p className="mt-1 text-xs text-blue-700">Ready to assign</p>
          </div>

          <div
            onClick={() => setActiveTab("queues")}
            className="cursor-pointer rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Active Field</span>
              <Activity className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="mt-2 text-2xl font-black text-emerald-950">{summary.activeCollectionsCount}</p>
            <p className="mt-1 text-xs text-emerald-700">Samples in transit</p>
          </div>

          <div
            onClick={() => setActiveTab("exceptions")}
            className="cursor-pointer rounded-2xl border border-rose-200 bg-rose-50/70 p-4 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">Exceptions</span>
              <ShieldAlert className="h-4 w-4 text-rose-600" />
            </div>
            <p className="mt-2 text-2xl font-black text-rose-950">{summary.exceptionsCount}</p>
            <p className="mt-1 text-xs text-rose-700">Action required</p>
          </div>

          <div
            onClick={() => setActiveTab("leads")}
            className="cursor-pointer rounded-2xl border border-purple-200 bg-purple-50/70 p-4 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-800 uppercase tracking-wider">Follow-Ups</span>
              <Calendar className="h-4 w-4 text-purple-600" />
            </div>
            <p className="mt-2 text-2xl font-black text-purple-950">{summary.followUpsDueTodayCount}</p>
            <p className="mt-1 text-xs text-purple-700">Due today</p>
          </div>

          <div
            onClick={() => setActiveTab("queues")}
            className="cursor-pointer rounded-2xl border border-gray-200 bg-gray-50/80 p-4 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Cancellations</span>
              <XCircle className="h-4 w-4 text-gray-500" />
            </div>
            <p className="mt-2 text-2xl font-black text-gray-900">{summary.cancelledCount}</p>
            <p className="mt-1 text-xs text-gray-600">Tracked cases</p>
          </div>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3">
        <button
          onClick={() => setActiveTab("queues")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === "queues"
              ? "bg-[#FF6B00] text-white shadow-sm"
              : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          <Clock className="h-4 w-4" />
          Action Queues
        </button>

        <button
          onClick={() => setActiveTab("bookings")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === "bookings"
              ? "bg-[#FF6B00] text-white shadow-sm"
              : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          <FileText className="h-4 w-4" />
          All Bookings ({allBookings.length})
        </button>

        <button
          onClick={() => setActiveTab("leads")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === "leads"
              ? "bg-[#FF6B00] text-white shadow-sm"
              : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          <UserPlus className="h-4 w-4" />
          Qualified Leads & Conversion ({allLeads.length})
        </button>

        <button
          onClick={() => setActiveTab("exceptions")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === "exceptions"
              ? "bg-[#FF6B00] text-white shadow-sm"
              : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          <ShieldAlert className="h-4 w-4" />
          Exception Queue ({queues.exceptions?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === "history"
              ? "bg-[#FF6B00] text-white shadow-sm"
              : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          <PhoneCall className="h-4 w-4" />
          Call & Message Logs ({summary?.totalCallsLogged || 0})
        </button>
      </div>

      {/* TAB 1: ACTION QUEUES */}
      {activeTab === "queues" && (
        <div className="space-y-6">
          {/* Queue 1: Pending Confirmations */}
          <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-amber-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-800 font-bold text-xs">
                  {queues.pendingConfirmations?.length || 0}
                </span>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Pending Customer Confirmations</h3>
                  <p className="text-xs text-gray-500">Call patient to verify fasting instructions, address, and slot agreement</p>
                </div>
              </div>
            </div>

            <div className="mt-4 divide-y divide-gray-100">
              {queues.pendingConfirmations?.length === 0 ? (
                <p className="py-6 text-center text-xs text-gray-500 font-medium">All new bookings confirmed! No pending callbacks.</p>
              ) : (
                queues.pendingConfirmations.map((b: any) => (
                  <div key={b.id} className="flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-gray-900">{b.booking_number || b.id}</span>
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                          {b.booking_status}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-gray-800 mt-1">{b.customer_name || b.contact_name}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                        <span>📞 {b.customer_phone || b.contact_phone}</span>
                        <span>•</span>
                        <span>📍 {b.city || "Indore"} ({b.pincode || "452001"})</span>
                        <span>•</span>
                        <span>🕒 {b.preferred_date} ({b.preferred_time})</span>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedItem(b);
                          setShowCallModal(true);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        Log Call
                      </button>

                      <button
                        onClick={() => {
                          setSelectedItem(b);
                          setShowMessageModal(true);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-800 hover:bg-blue-100 transition"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        WhatsApp
                      </button>

                      <button
                        onClick={() => {
                          setSelectedItem(b);
                          setShowConfirmModal(true);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Confirm Booking
                      </button>

                      <button
                        onClick={() => {
                          setSelectedItem(b);
                          setShowCancelModal(true);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-800 hover:bg-rose-100 transition"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Queue 2: Pending Dispatch to Collection Operations */}
          <div className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-blue-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-800 font-bold text-xs">
                  {queues.pendingDispatch?.length || 0}
                </span>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Pending Collection Dispatch</h3>
                  <p className="text-xs text-gray-500">Confirmed orders ready for automatic or manual phlebotomist allocation</p>
                </div>
              </div>
            </div>

            <div className="mt-4 divide-y divide-gray-100">
              {queues.pendingDispatch?.length === 0 ? (
                <p className="py-6 text-center text-xs text-gray-500 font-medium">All confirmed bookings have assigned phlebotomists!</p>
              ) : (
                queues.pendingDispatch.map((b: any) => (
                  <div key={b.id} className="flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-gray-900">{b.booking_number || b.id}</span>
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-800">
                          Confirmed • Ready for Field
                        </span>
                      </div>
                      <p className="text-sm font-bold text-gray-800 mt-1">{b.customer_name || b.contact_name}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                        <span>📍 {b.address || "Indore"} (PIN {b.pincode || "452001"})</span>
                        <span>•</span>
                        <span>🕒 Slot: {b.preferred_date} ({b.preferred_time})</span>
                        <span>•</span>
                        <span>Amount: ₹{b.payable_amount}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedItem(b);
                          setDispatchDate(b.preferred_date || new Date().toISOString().split("T")[0]);
                          setDispatchSlot(b.preferred_time || "07:30 AM - 08:30 AM");
                          setShowDispatchModal(true);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#FF6B00] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#e05e00] transition"
                      >
                        <Truck className="h-3.5 w-3.5" />
                        Dispatch to Phlebotomist
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ALL BOOKINGS DESK */}
      {activeTab === "bookings" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by Booking #, Patient Name, Phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2 text-xs focus:border-[#FF6B00] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="new">New</option>
                <option value="pending_confirmation">Pending Confirmation</option>
                <option value="confirmed">Confirmed</option>
                <option value="assigned">Assigned</option>
                <option value="on_the_way">On The Way</option>
                <option value="sample_collected">Sample Collected</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 focus:outline-none"
              >
                <option value="all">All Cities</option>
                <option value="indore">Indore</option>
                <option value="bhopal">Bhopal</option>
                <option value="lucknow">Lucknow</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-gray-200 bg-gray-50/80 font-bold text-gray-700 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Booking #</th>
                  <th className="py-3 px-4">Patient Contact</th>
                  <th className="py-3 px-4">Schedule & Slot</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assigned Phlebotomist</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500 font-medium">
                      No matching bookings found.
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50/60 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                        {b.booking_number || b.id.slice(0, 8)}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-gray-900">{b.customer_name || b.contact_name}</p>
                        <p className="text-gray-500">📞 {b.customer_phone || b.contact_phone}</p>
                        <p className="text-[11px] text-gray-400">PIN: {b.pincode || "452001"}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-gray-800">{b.preferred_date || "Today"}</p>
                        <p className="text-gray-500 text-[11px]">{b.preferred_time || "Morning"}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            b.booking_status === "confirmed"
                              ? "bg-emerald-100 text-emerald-800"
                              : b.booking_status === "cancelled"
                              ? "bg-rose-100 text-rose-800"
                              : b.booking_status === "sample_collected"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {b.booking_status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {b.assigned_phlebotomist_name ? (
                          <div>
                            <p className="font-bold text-gray-900 flex items-center gap-1">
                              <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                              {b.assigned_phlebotomist_name}
                            </p>
                            <p className="text-[11px] text-gray-500">📞 {b.assigned_phlebotomist_phone}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedItem(b);
                              setShowCallModal(true);
                            }}
                            title="Log Call"
                            className="rounded-lg border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-100"
                          >
                            <Phone className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedItem(b);
                              setShowMessageModal(true);
                            }}
                            title="Send WhatsApp"
                            className="rounded-lg border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-100"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedItem(b);
                              setDispatchDate(b.preferred_date || new Date().toISOString().split("T")[0]);
                              setDispatchSlot(b.preferred_time || "07:30 AM - 08:30 AM");
                              setShowDispatchModal(true);
                            }}
                            title="Dispatch to Field"
                            className="rounded-lg bg-blue-50 border border-blue-200 p-1.5 text-blue-700 hover:bg-blue-100"
                          >
                            <Truck className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: QUALIFIED LEADS & CONVERSION */}
      {activeTab === "leads" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-bold text-gray-900">Lead Conversion Desk</h3>
            <p className="text-xs text-gray-500">
              Convert qualified patient inquiries from web forms, campaigns, and health advisor consultations directly into confirmed home collection bookings.
            </p>

            <div className="mt-4 divide-y divide-gray-100">
              {allLeads.map((lead) => (
                <div key={lead.id} className="flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-gray-900">{lead.name}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                          lead.status === "Converted"
                            ? "bg-emerald-100 text-emerald-800"
                            : lead.status === "Qualified"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {lead.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      <span>📞 {lead.phone}</span>
                      <span className="mx-2">•</span>
                      <span>📍 {lead.city || "Indore"} ({lead.pincode || "452001"})</span>
                      <span className="mx-2">•</span>
                      <span>Source: {lead.source}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {lead.status !== "Converted" ? (
                      <button
                        onClick={() => {
                          setSelectedItem(lead);
                          setConvertAddress(lead.location || "");
                          setShowConvertModal(true);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Convert to Booking
                      </button>
                    ) : (
                      <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                        Converted ({lead.bookingNumber || "Booked"})
                      </span>
                    )}

                    <button
                      onClick={() => {
                        setSelectedItem(lead);
                        setShowCallModal(true);
                      }}
                      className="rounded-lg border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-100"
                    >
                      <Phone className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: EXCEPTIONS QUEUE */}
      {activeTab === "exceptions" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-rose-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-rose-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-rose-600" />
                  Collection Operations Exception Queue
                </h3>
                <p className="text-xs text-gray-500">
                  Cases with phlebotomist declines, uncovered PIN codes, or shift capacity overruns requiring manual intervention.
                </p>
              </div>
            </div>

            <div className="mt-4 divide-y divide-gray-100">
              {queues.exceptions?.length === 0 ? (
                <p className="py-8 text-center text-xs text-emerald-700 font-bold">
                  Zero active exceptions! All collection jobs are running smoothly.
                </p>
              ) : (
                queues.exceptions.map((ex: any) => (
                  <div key={ex.id} className="py-4 space-y-2">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div>
                        <span className="text-xs font-black text-gray-900">{ex.bookingNumber || ex.id}</span>
                        <h4 className="text-sm font-bold text-gray-900">{ex.customerName || ex.patientName}</h4>
                        <p className="text-xs text-gray-600">
                          📞 {ex.customerPhone || ex.patientPhone} • 📍 {ex.address}, {ex.city} (PIN {ex.pincode})
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedItem(ex);
                            setDispatchDate(ex.scheduledDate || new Date().toISOString().split("T")[0]);
                            setDispatchSlot(ex.scheduledTime || "08:00 AM");
                            setDispatchMode("manual");
                            setShowDispatchModal(true);
                          }}
                          className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition"
                        >
                          Manual Reassign
                        </button>
                      </div>
                    </div>

                    <div className="rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-800 font-medium">
                      <span className="font-bold">Failure / Decline Reason: </span>
                      {ex.declineReason || ex.exceptionReason || "Automatic allocation could not match an available phlebotomist within coverage area."}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: CALL & MESSAGE HISTORY */}
      {activeTab === "history" && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Calls Log */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Phone className="h-4 w-4 text-[#FF6B00]" />
              Recent Calls Logged
            </h3>
            <div className="mt-4 space-y-3">
              {recentCalls.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">No calls logged yet.</p>
              ) : (
                recentCalls.map((c) => (
                  <div key={c.id} className="rounded-xl border border-gray-100 bg-gray-50/70 p-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900 uppercase tracking-wider">{c.callType} Call</span>
                      <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        {c.outcome.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="mt-1 text-gray-700 font-medium">{c.notes}</p>
                    <p className="mt-1 text-[11px] text-gray-400">
                      Logged by {c.performedBy} • Duration: {c.durationSeconds}s • {new Date(c.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Messages Log */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-600" />
              Recent WhatsApp & SMS Dispatches
            </h3>
            <div className="mt-4 space-y-3">
              {recentMessages.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">No messages sent yet.</p>
              ) : (
                recentMessages.map((m) => (
                  <div key={m.id} className="rounded-xl border border-gray-100 bg-gray-50/70 p-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900 uppercase tracking-wider">{m.channel} • {m.templateTitle}</span>
                      <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                        {m.deliveryStatus}
                      </span>
                    </div>
                    <p className="mt-1 text-gray-700 italic">&quot;{m.messageContent}&quot;</p>
                    <p className="mt-1 text-[11px] text-gray-400">
                      Sent by {m.performedBy} • {new Date(m.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: LOG CALL */}
      {showCallModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Phone className="h-5 w-5 text-[#FF6B00]" />
              Record Customer Care Call
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Patient: {selectedItem.customer_name || selectedItem.contact_name || selectedItem.name} (📞 {selectedItem.customer_phone || selectedItem.contact_phone || selectedItem.phone})
            </p>

            <form onSubmit={handleLogCall} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700">Call Type</label>
                <div className="mt-1 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCallType("outbound")}
                    className={`flex-1 rounded-xl py-2 text-xs font-bold ${callType === "outbound" ? "bg-[#FF6B00] text-white" : "border border-gray-200 text-gray-700"}`}
                  >
                    Outbound Callback
                  </button>
                  <button
                    type="button"
                    onClick={() => setCallType("inbound")}
                    className={`flex-1 rounded-xl py-2 text-xs font-bold ${callType === "inbound" ? "bg-[#FF6B00] text-white" : "border border-gray-200 text-gray-700"}`}
                  >
                    Inbound Patient Call
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700">Outcome</label>
                <select
                  value={callOutcome}
                  onChange={(e) => setCallOutcome(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none"
                >
                  <option value="connected_interested">Connected - Slot Confirmed / Interested</option>
                  <option value="connected_rescheduled">Connected - Patient Rescheduled Slot</option>
                  <option value="connected_query">Connected - Clinical Inquiry Answered</option>
                  <option value="busy">Line Busy</option>
                  <option value="not_reachable">Not Reachable / Switched Off</option>
                  <option value="wrong_number">Wrong Number</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700">Call Duration (seconds)</label>
                <input
                  type="number"
                  value={callDuration}
                  onChange={(e) => setCallDuration(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700">Call Notes</label>
                <textarea
                  required
                  placeholder="Record summary of conversation, special sample instructions, or doctor consultation notes..."
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  rows={3}
                  className="w-full mt-1 rounded-xl border border-gray-200 p-3 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700">Next Follow-up (Optional)</label>
                <input
                  type="datetime-local"
                  value={callFollowUpDate}
                  onChange={(e) => setCallFollowUpDate(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none"
                />
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCallModal(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#FF6B00] px-5 py-2 text-xs font-bold text-white hover:bg-[#e05e00]"
                >
                  Save Call Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SEND MESSAGE */}
      {showMessageModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              Send Patient Update
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Recipient: {selectedItem.customer_name || selectedItem.name} (📞 {selectedItem.customer_phone || selectedItem.phone})
            </p>

            <form onSubmit={handleSendMessage} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700">Channel</label>
                <select
                  value={messageChannel}
                  onChange={(e) => setMessageChannel(e.target.value as any)}
                  className="w-full mt-1 rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none"
                >
                  <option value="whatsapp">WhatsApp Business API</option>
                  <option value="sms">Transactional SMS</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700">Template</label>
                <select
                  value={messageTemplate}
                  onChange={(e) => setMessageTemplate(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none"
                >
                  <option value="Slot Confirmation">Home Collection Slot Confirmation</option>
                  <option value="Fasting Instructions">Fasting Protocol & Hydration Reminder</option>
                  <option value="Phlebotomist Dispatched">Phlebotomist Assigned & En Route</option>
                  <option value="Report Available">Digital Report Ready for Download</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700">Customized Message Content</label>
                <textarea
                  rows={4}
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder={`Hello ${selectedItem.customer_name || selectedItem.name}, your SCOPEX Diagnostics appointment is confirmed for ${selectedItem.preferred_date || "tomorrow"} at ${selectedItem.preferred_time || "07:30 AM"}. Please keep 10-12 hours fasting.`}
                  className="w-full mt-1 rounded-xl border border-gray-200 p-3 text-xs focus:outline-none"
                />
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowMessageModal(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700"
                >
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DISPATCH / ALLOCATE PHLEBOTOMIST */}
      {showDispatchModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Truck className="h-5 w-5 text-[#FF6B00]" />
              Transfer Case to Phlebotomy Operations
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Booking: {selectedItem.booking_number || selectedItem.id} • Patient: {selectedItem.customer_name || selectedItem.contact_name}
            </p>

            <form onSubmit={handleDispatchCollection} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700">Allocation Mode</label>
                <div className="mt-1 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDispatchMode("auto")}
                    className={`flex-1 rounded-xl py-2.5 text-xs font-bold ${
                      dispatchMode === "auto" ? "bg-[#FF6B00] text-white" : "border border-gray-200 text-gray-700"
                    }`}
                  >
                    Automatic Allocation Engine
                  </button>
                  <button
                    type="button"
                    onClick={() => setDispatchMode("manual")}
                    className={`flex-1 rounded-xl py-2.5 text-xs font-bold ${
                      dispatchMode === "manual" ? "bg-[#FF6B00] text-white" : "border border-gray-200 text-gray-700"
                    }`}
                  >
                    Manual Staff Selection
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-gray-400">
                  {dispatchMode === "auto"
                    ? "Validates service area, PIN code, shift, required skills, and workload automatically."
                    : "Explicitly assign a specific phlebotomist."}
                </p>
              </div>

              {dispatchMode === "manual" && (
                <div>
                  <label className="text-xs font-bold text-gray-700">Select Phlebotomist</label>
                  <select
                    required
                    value={selectedPhlebId}
                    onChange={(e) => setSelectedPhlebId(e.target.value)}
                    className="w-full mt-1 rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none"
                  >
                    <option value="">Choose Phlebotomist...</option>
                    {phlebotomistTeam.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.city} • Shift: {p.shift} • Workload: {p.assignedCount}/{p.maxDailySlots}) - {p.status}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700">Scheduled Date</label>
                  <input
                    type="date"
                    value={dispatchDate}
                    onChange={(e) => setDispatchDate(e.target.value)}
                    className="w-full mt-1 rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700">Scheduled Slot</label>
                  <input
                    type="text"
                    value={dispatchSlot}
                    onChange={(e) => setDispatchSlot(e.target.value)}
                    className="w-full mt-1 rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700">Special Field Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Senior citizen, pediatric butterfly needle required, ring bell twice..."
                  value={dispatchNotes}
                  onChange={(e) => setDispatchNotes(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-gray-200 p-2.5 text-xs focus:outline-none"
                />
              </div>

              {dispatchResult && (
                <div
                  className={`rounded-xl p-3 text-xs font-medium ${
                    dispatchResult.success ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}
                >
                  {dispatchResult.success ? (
                    <div>
                      <p className="font-bold">Assignment Successful!</p>
                      <p className="mt-0.5">{dispatchResult.allocation?.reason || "Job transferred to collection operations."}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-bold">Allocation Failed (Routed to Exception Queue):</p>
                      <p className="mt-0.5">{dispatchResult.allocation?.reason || dispatchResult.message}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDispatchModal(false);
                    setDispatchResult(null);
                  }}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#FF6B00] px-5 py-2 text-xs font-bold text-white hover:bg-[#e05e00]"
                >
                  Execute Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: CONFIRM BOOKING */}
      {showConfirmModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Check className="h-5 w-5 text-emerald-600" />
              Confirm Booking Appointment
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Mark {selectedItem.booking_number || selectedItem.id} confirmed and ready for dispatch.
            </p>

            <form onSubmit={handleConfirmBooking} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700">Verification Notes</label>
                <textarea
                  rows={3}
                  placeholder="Patient confirmed over phone. 12 hours fasting requirement and address verified."
                  value={confirmNotes}
                  onChange={(e) => setConfirmNotes(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-gray-200 p-3 text-xs focus:outline-none"
                />
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  Confirm Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: CANCEL BOOKING */}
      {showCancelModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <XCircle className="h-5 w-5 text-rose-600" />
              Cancel Booking Order
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Cancelling {selectedItem.booking_number || selectedItem.id} will automatically release any assigned phlebotomist.
            </p>

            <form onSubmit={handleCancelBooking} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700">Cancellation Reason</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Patient traveling, doctor changed prescription, patient unreachable after 3 attempts..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-gray-200 p-3 text-xs focus:outline-none"
                />
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white hover:bg-rose-700"
                >
                  Confirm Cancellation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: CONVERT LEAD TO BOOKING */}
      {showConvertModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-emerald-600" />
              Convert Qualified Lead to Confirmed Booking
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Lead: {selectedItem.name} (📞 {selectedItem.phone})
            </p>

            <form onSubmit={handleConvertLead} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700">Interested Diagnostic Tests / Panels</label>
                <input
                  type="text"
                  value={convertSelectedTests}
                  onChange={(e) => setConvertSelectedTests(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700">Sample Collection Address</label>
                <input
                  type="text"
                  placeholder="Patient street, landmark, house number..."
                  value={convertAddress}
                  onChange={(e) => setConvertAddress(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700">Preferred Date</label>
                  <input
                    type="date"
                    value={convertDate}
                    onChange={(e) => setConvertDate(e.target.value)}
                    className="w-full mt-1 rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700">Time Slot</label>
                  <input
                    type="text"
                    value={convertSlot}
                    onChange={(e) => setConvertSlot(e.target.value)}
                    className="w-full mt-1 rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700">Total Payable Amount (₹)</label>
                <input
                  type="number"
                  value={convertAmount}
                  onChange={(e) => setConvertAmount(Number(e.target.value))}
                  className="w-full mt-1 rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none"
                />
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowConvertModal(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  Create & Link Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
