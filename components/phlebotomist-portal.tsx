"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  MapPin,
  Phone,
  Calendar,
  Thermometer,
  ShieldCheck,
  FileCheck2,
  Check,
  Send,
  RefreshCw,
  QrCode,
  Droplets,
  ChevronRight,
  User,
  Info
} from "lucide-react";
import { backendFetch } from "@/lib/backend-client";
import type { PhlebotomistRestrictedPatientView, PhlebotomistProfile } from "@/lib/phlebotomist-service";

const ALLOWED_DECLINE_REASONS = [
  "Vehicle Breakdown / Accident",
  "Severe Traffic Gridlock",
  "Medical / Family Emergency",
  "Patient Unreachable / Wrong Address",
  "Outside Accessible Radius",
  "Shift Overrun / Slot Conflict"
] as const;

export function PhlebotomistPortal() {
  const [team, setTeam] = useState<PhlebotomistProfile[]>([]);
  const [selectedPhlebId, setSelectedPhlebId] = useState<string>("phleb-001");
  const [jobs, setJobs] = useState<PhlebotomistRestrictedPatientView[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Modals & Action Forms
  const [activeJob, setActiveJob] = useState<PhlebotomistRestrictedPatientView | null>(null);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState<string>(ALLOWED_DECLINE_REASONS[0]);
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [exceptionReason, setExceptionReason] = useState("");
  const [showPartnerHandoverModal, setShowPartnerHandoverModal] = useState(false);
  const [partnerBarcode, setPartnerBarcode] = useState("");
  const [barcodePhotoUrl, setBarcodePhotoUrl] = useState("https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=400&q=80");

  // Collection draw form state
  const [barcodeInput, setBarcodeInput] = useState("");
  const [barcodesList, setBarcodesList] = useState<string[]>([]);
  const [fastingVerified, setFastingVerified] = useState(true);
  const [fastingHours, setFastingHours] = useState(12);
  const [temperatureVerified, setTemperatureVerified] = useState(true);
  const [collectionNotes, setCollectionNotes] = useState("");
  const [destinationLab, setDestinationLab] = useState("ScopeX Central Diagnostic Laboratory, Indore");

  // Load team profiles
  useEffect(() => {
    async function loadTeam() {
      try {
        const res = await backendFetch("/phlebotomist/team");
        if (res.ok) {
          const d = await res.json();
          setTeam(d.team || []);
        }
      } catch {
        // Fallback
      }
    }
    void loadTeam();
  }, []);

  // Load assigned jobs for active phlebotomist
  const loadJobs = useCallback(async () => {
    if (!selectedPhlebId) return;
    setLoading(true);
    try {
      const res = await backendFetch(`/phlebotomist/jobs?phlebotomistId=${selectedPhlebId}`);
      if (res.ok) {
        const d = await res.json();
        setJobs(d.jobs || []);
        setMessage("");
      }
    } catch (err: any) {
      setMessage(err.message || "Failed to load assigned jobs.");
    } finally {
      setLoading(false);
    }
  }, [selectedPhlebId]);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  const activePhleb = team.find((p) => p.id === selectedPhlebId);

  // Status Action handler
  const handleJobAction = async (jobId: string, action: string, extraPayload: Record<string, unknown> = {}) => {
    try {
      const res = await backendFetch(`/phlebotomist/jobs/${jobId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          performedBy: activePhleb?.name || "Phlebotomist",
          ...extraPayload
        })
      });

      if (res.ok) {
        setShowDeclineModal(false);
        setShowCollectModal(false);
        setShowExceptionModal(false);
        setBarcodesList([]);
        setBarcodeInput("");
        void loadJobs();
      }
    } catch {
      // Handled
    }
  };

  // Add Barcode helper
  const handleAddBarcode = () => {
    if (barcodeInput.trim()) {
      setBarcodesList([...barcodesList, barcodeInput.trim()]);
      setBarcodeInput("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Phlebotomist Staff Switcher & Field Status */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#008080]/10 px-3 py-1 text-xs font-bold text-[#008080]">
              <Truck className="h-3.5 w-3.5" />
              Field Phlebotomy Portal
            </span>
            <h1 className="mt-2 text-2xl font-black text-[#0D0D0D]">
              Assigned Home Collection Jobs
            </h1>
            <p className="mt-1 text-xs text-gray-500">
              Only required patient clinical information is shown for patient privacy compliance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Active Staff Profile
              </label>
              <select
                value={selectedPhlebId}
                onChange={(e) => setSelectedPhlebId(e.target.value)}
                className="rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none"
              >
                {team.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.city} • {p.shift.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => void loadJobs()}
              className="mt-4 md:mt-0 rounded-xl border border-gray-200 bg-white p-2.5 text-gray-700 hover:bg-gray-100 shadow-sm"
              title="Refresh Jobs"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {activePhleb && (
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4 sm:grid-cols-4">
            <div>
              <span className="text-[11px] text-gray-400 font-medium">Shift Window</span>
              <p className="text-xs font-bold text-gray-800 capitalize">
                {activePhleb.shift} ({activePhleb.shift === "morning" ? "06:00 - 14:00" : activePhleb.shift === "evening" ? "13:00 - 21:00" : "06:00 - 20:00"})
              </p>
            </div>
            <div>
              <span className="text-[11px] text-gray-400 font-medium">Daily Workload</span>
              <p className="text-xs font-bold text-gray-800">
                {activePhleb.assignedCount} / {activePhleb.maxDailySlots} Jobs
              </p>
            </div>
            <div>
              <span className="text-[11px] text-gray-400 font-medium">Coverage Area</span>
              <p className="text-xs font-bold text-gray-800">
                {activePhleb.city} ({activePhleb.pincodes.slice(0, 3).join(", ")})
              </p>
            </div>
            <div>
              <span className="text-[11px] text-gray-400 font-medium">Rating & Vehicle</span>
              <p className="text-xs font-bold text-emerald-700">
                ⭐ {activePhleb.rating} • 🏍️ Two-Wheeler
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-xs text-gray-500">
            Loading assigned collection jobs...
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-xs text-gray-500">
            No home collection jobs currently assigned for {activePhleb?.name || "this staff member"}.
          </div>
        ) : (
          jobs.map((job) => (
            <div
              key={job.jobId}
              className={`rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md ${
                job.status === "Assigned"
                  ? "border-amber-200 bg-amber-50/20"
                  : job.status === "Accepted"
                  ? "border-blue-200"
                  : job.status === "En Route"
                  ? "border-indigo-200 bg-indigo-50/10"
                  : job.status === "Collected"
                  ? "border-emerald-200 bg-emerald-50/10"
                  : job.status === "Exception"
                  ? "border-rose-200 bg-rose-50/10"
                  : "border-gray-200"
              }`}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                {/* Left: Patient Logistics (Privacy Compliant) */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-black text-gray-900">{job.bookingNumber}</span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        job.status === "Assigned"
                          ? "bg-amber-100 text-amber-800"
                          : job.status === "Accepted"
                          ? "bg-blue-100 text-blue-800"
                          : job.status === "En Route"
                          ? "bg-indigo-100 text-indigo-800"
                          : job.status === "Arrived"
                          ? "bg-purple-100 text-purple-800"
                          : job.status === "Collected"
                          ? "bg-emerald-100 text-emerald-800"
                          : job.status === "Completed"
                          ? "bg-gray-100 text-gray-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-gray-900">
                      {job.patientName} {job.patientAge ? `(${job.patientAge} Yrs, ${job.patientGender || "Unknown"})` : ""}
                    </h3>
                    <p className="text-xs text-gray-600 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span>{job.address}, {job.city} (PIN {job.pincode})</span>
                    </p>
                    <p className="text-xs text-gray-600 flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <a href={`tel:${job.patientPhone}`} className="font-bold text-[#FF6B00] hover:underline">
                        +91 {job.patientPhone}
                      </a>
                    </p>
                    <p className="text-xs text-gray-600 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span className="font-semibold text-gray-900">{job.scheduledDate}</span> ({job.scheduledTime})
                    </p>
                  </div>

                  {/* Required Samples & Containers */}
                  <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50/80 p-3 space-y-1.5">
                    <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                      <Droplets className="h-3.5 w-3.5 text-rose-500" />
                      Required Specimen Tubes & Vials:
                    </span>
                    <ul className="text-xs text-gray-700 space-y-1 pl-1">
                      {job.sampleRequirements.map((req, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#FF6B00]" />
                          <span className="font-semibold">{req.name}</span>
                          <span className="text-gray-500 text-[11px]">[{req.containerType} - {req.sampleType}]</span>
                          {req.fastingRequired && (
                            <span className="rounded bg-amber-100 px-1.5 py-0.2 text-[10px] font-bold text-amber-800">
                              Fasting Required
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {job.specialInstructions && (
                    <p className="rounded-lg bg-yellow-50 border border-yellow-200 p-2 text-xs text-yellow-900 font-medium">
                      ⚠️ Note: {job.specialInstructions}
                    </p>
                  )}
                </div>

                {/* Right: Phlebotomist Action Buttons & State Machine Controls */}
                <div className="flex flex-col gap-2 shrink-0 min-w-[200px] border-t lg:border-t-0 lg:border-l border-gray-100 pt-3 lg:pt-0 lg:pl-4">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Workflow Actions
                  </span>

                  {job.status === "Assigned" && (
                    <div className="space-y-2">
                      <button
                        onClick={() => handleJobAction(job.jobId, "accept")}
                        className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 px-4 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
                      >
                        <Check className="h-4 w-4" />
                        Accept Job
                      </button>

                      <button
                        onClick={() => {
                          setActiveJob(job);
                          setShowDeclineModal(true);
                        }}
                        className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-rose-300 bg-white py-2 px-4 text-xs font-bold text-rose-700 hover:bg-rose-50 transition"
                      >
                        <XCircle className="h-4 w-4" />
                        Decline Job
                      </button>
                    </div>
                  )}

                  {job.status === "Accepted" && (
                    <button
                      onClick={() => handleJobAction(job.jobId, "en_route")}
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2.5 px-4 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition"
                    >
                      <Truck className="h-4 w-4" />
                      Mark En Route
                    </button>
                  )}

                  {job.status === "En Route" && (
                    <button
                      onClick={() => handleJobAction(job.jobId, "arrived")}
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 py-2.5 px-4 text-xs font-bold text-white shadow-sm hover:bg-purple-700 transition"
                    >
                      <MapPin className="h-4 w-4" />
                      Mark Arrived at Doorstep
                    </button>
                  )}

                  {job.status === "Arrived" && (
                    <button
                      onClick={() => {
                        setActiveJob(job);
                        setBarcodesList([`SCX-BC-${Math.floor(100000 + Math.random() * 900000)}`]);
                        setShowCollectModal(true);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 px-4 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
                    >
                      <Droplets className="h-4 w-4" />
                      Record Sample Draw
                    </button>
                  )}

                  {job.status === "Collected" && (
                    <div className="space-y-1.5 w-full">
                      <button
                        onClick={() => {
                          setActiveJob(job);
                          setPartnerBarcode(`APX-${Math.floor(100000 + Math.random() * 900000)}`);
                          setShowPartnerHandoverModal(true);
                        }}
                        className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2.5 px-4 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition"
                      >
                        <QrCode className="h-4 w-4" />
                        Handover to Partner Lab & Photo
                      </button>
                      <button
                        onClick={() => handleJobAction(job.jobId, "completed", { destinationLab })}
                        className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2 px-3 text-[11px] font-bold text-white shadow-sm hover:bg-blue-700 transition"
                      >
                        <FileCheck2 className="h-3.5 w-3.5" />
                        Direct Central Lab Handover
                      </button>
                    </div>
                  )}

                  {job.status !== "Completed" && job.status !== "Exception" && (
                    <button
                      onClick={() => {
                        setActiveJob(job);
                        setShowExceptionModal(true);
                      }}
                      className="text-[11px] font-bold text-rose-600 hover:underline mt-1 text-center"
                    >
                      Report Field Exception
                    </button>
                  )}

                  {/* Recorded Timestamps Audit */}
                  <div className="mt-3 text-[11px] text-gray-500 space-y-0.5 border-t border-gray-100 pt-2">
                    {job.assignedAt && <div>Assigned: {new Date(job.assignedAt).toLocaleTimeString()}</div>}
                    {job.acceptedAt && <div>Accepted: {new Date(job.acceptedAt).toLocaleTimeString()}</div>}
                    {job.enRouteAt && <div>En Route: {new Date(job.enRouteAt).toLocaleTimeString()}</div>}
                    {job.arrivedAt && <div>Arrived: {new Date(job.arrivedAt).toLocaleTimeString()}</div>}
                    {job.collectedAt && <div>Collected: {new Date(job.collectedAt).toLocaleTimeString()}</div>}
                    {job.completedAt && <div>Completed: {new Date(job.completedAt).toLocaleTimeString()}</div>}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL 1: DECLINE JOB */}
      {showDeclineModal && activeJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <XCircle className="h-5 w-5 text-rose-600" />
              Decline Collection Assignment
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Declining requires an authorized reason according to standard operating procedures.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700">Authorized Decline Reason</label>
                <select
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none"
                >
                  {ALLOWED_DECLINE_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-xl bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-800">
                This case will be instantly transferred to the Exception Queue for dispatch reallocation.
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeclineModal(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleJobAction(activeJob.jobId, "decline", { declineReason })}
                  className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white hover:bg-rose-700"
                >
                  Confirm Decline
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: RECORD SAMPLE DRAW */}
      {showCollectModal && activeJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Droplets className="h-5 w-5 text-rose-500" />
              Record Sample Collection & Barcodes
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Patient: {activeJob.patientName} (Booking #{activeJob.bookingNumber})
            </p>

            <div className="mt-4 space-y-4">
              {/* Barcode scanner / input */}
              <div>
                <label className="text-xs font-bold text-gray-700">Scan or Enter Vacutainer Barcode</label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. SCX-BC-449102"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddBarcode}
                    className="rounded-xl bg-gray-900 px-4 py-2 text-xs font-bold text-white hover:bg-black"
                  >
                    Add
                  </button>
                </div>

                {barcodesList.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {barcodesList.map((bc, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-mono font-bold text-blue-800"
                      >
                        <QrCode className="h-3 w-3" />
                        {bc}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Protocol Checks */}
              <div className="space-y-2 rounded-xl border border-gray-100 bg-gray-50/80 p-3">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fastingVerified}
                    onChange={(e) => setFastingVerified(e.target.checked)}
                    className="h-4 w-4 rounded text-[#FF6B00]"
                  />
                  <span>10-12h Fasting Protocol Verified with Patient</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={temperatureVerified}
                    onChange={(e) => setTemperatureVerified(e.target.checked)}
                    className="h-4 w-4 rounded text-[#FF6B00]"
                  />
                  <span>Cold Chain Ice-Pack Carrier Bag (2°C - 8°C) Verified</span>
                </label>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700">Phlebotomist Clinical Notes</label>
                <textarea
                  rows={2}
                  placeholder="Draw smooth via median cubital vein, no hematoma, sterile dressing applied..."
                  value={collectionNotes}
                  onChange={(e) => setCollectionNotes(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-gray-200 p-2.5 text-xs focus:outline-none"
                />
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCollectModal(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleJobAction(activeJob.jobId, "collected", {
                      barcodes: barcodesList.length > 0 ? barcodesList : ["SCX-BC-AUTO"],
                      fastingStatusVerified: fastingVerified,
                      fastingHoursReported: fastingHours,
                      temperatureVerified,
                      collectionNotes: collectionNotes || "Samples drawn following protocol."
                    })
                  }
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  Complete Collection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: EXCEPTION */}
      {showExceptionModal && activeJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
              Report Collection Exception
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Log difficulty or inability to draw sample.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700">Exception Reason</label>
                <select
                  value={exceptionReason}
                  onChange={(e) => setExceptionReason(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none"
                >
                  <option value="Patient not available at doorstep">Patient not available at doorstep / Door locked</option>
                  <option value="Patient ate breakfast (fasting violation)">Patient ate food (fasting violation)</option>
                  <option value="Patient refused collection">Patient refused collection / changed mind</option>
                  <option value="Inaccessible veins / patient discomfort">Difficult / collapsed veins</option>
                  <option value="Incorrect address provided">Wrong / incomplete address</option>
                </select>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowExceptionModal(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleJobAction(activeJob.jobId, "exception", {
                      exceptionReason: exceptionReason || "Patient not available at doorstep"
                    })
                  }
                  className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white hover:bg-rose-700"
                >
                  Log Exception
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: PARTNER LAB HANDOVER & BARCODE PHOTO */}
      {showPartnerHandoverModal && activeJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <QrCode className="h-5 w-5 text-indigo-600" />
              Partner Lab Sample Handover
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Handover collected vacutainers to the Partner Laboratory receiving desk and record their accession barcode.
            </p>

            <div className="mt-4 space-y-3 text-xs">
              <div className="rounded-xl bg-gray-50 p-3 border">
                <div>Patient: <span className="font-bold text-gray-900">{activeJob.patientName}</span></div>
                <div>Booking: <span className="font-bold text-gray-900">{activeJob.bookingNumber}</span></div>
                <div>Collection Items: <span className="font-medium text-gray-700">{activeJob.collectionItems.join(", ")}</span></div>
              </div>

              <div>
                <label className="font-bold text-gray-700">Partner Lab Accession / Tube Barcode</label>
                <input
                  type="text"
                  placeholder="e.g. APX-902188"
                  value={partnerBarcode}
                  onChange={(e) => setPartnerBarcode(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-gray-200 p-2.5 font-mono text-xs font-bold focus:outline-none focus:border-indigo-600"
                />
                <span className="text-[10px] text-gray-400">Separate partner barcode provided by lab receiving tech.</span>
              </div>

              <div>
                <label className="font-bold text-gray-700">Labeled Tube Photograph (Live Camera / Photo Upload)</label>
                <input
                  type="text"
                  placeholder="Photo URL or captured image link"
                  value={barcodePhotoUrl}
                  onChange={(e) => setBarcodePhotoUrl(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-gray-200 p-2 text-xs font-mono focus:outline-none"
                />
                {barcodePhotoUrl && (
                  <div className="mt-2 rounded-xl border border-gray-200 overflow-hidden bg-gray-100 p-1 flex justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={barcodePhotoUrl}
                      alt="Sample tube preview"
                      className="max-h-36 object-contain rounded-lg"
                    />
                  </div>
                )}
              </div>

              <div className="mt-5 flex justify-end gap-2 border-t pt-3">
                <button
                  type="button"
                  onClick={() => setShowPartnerHandoverModal(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await handleJobAction(activeJob.jobId, "completed", {
                      destinationLab: "Apex Central Pathology & Molecular Laboratory",
                      partnerBarcode,
                      barcodePhotoUrl
                    });
                    setShowPartnerHandoverModal(false);
                  }}
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700"
                >
                  Confirm Handover & Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
