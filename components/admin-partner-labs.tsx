"use client";

import { useEffect, useState, useCallback, useId } from "react";
import Link from "next/link";
import {
  Building2,
  MapPin,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Upload,
  Download,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Eye,
  Plus,
  Check,
  X,
  FileCheck2,
  ArrowUpRight,
  Filter,
  Search,
  Camera,
  Layers,
  TrendingUp,
  Percent,
  Receipt,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  ChevronDown,
  Globe
} from "lucide-react";
import { backendFetch } from "@/lib/backend-client";

// Types matching partner-lab-service
interface PartnerLabLocation {
  id: string;
  partnerLabId: string;
  city: string;
  fullAddress: string;
  pincode: string;
  contactPerson: string;
  mobile: string;
  email: string;
  sampleReceivingTimings: string;
  operatingDays: string[];
  status: "active" | "inactive";
  createdAt: string;
}

interface PartnerLab {
  id: string;
  name: string;
  brandName: string;
  legalName?: string;
  registrationNumber: string;
  isNablAccredited: boolean;
  nablNumber?: string;
  gstin?: string;
  registeredAddress: string;
  primaryContactPerson: string;
  mobile: string;
  email: string;
  status: "active" | "inactive" | "pending_verification";
  locations: PartnerLabLocation[];
  createdAt: string;
}

interface PartnerTestMapping {
  id: string;
  partnerLabId: string;
  applicability: "pan_india" | "selected_cities" | "single_city";
  city?: string;
  applicableCities?: string[];
  locationId?: string;
  scopexTestId: string;
  scopexTestName: string;
  partnerTestName: string;
  partnerTestCode?: string;
  category: string;
  partnerProcessingRate: number;
  sampleType: string;
  tatHours: string;
  effectiveFrom: string;
  effectiveTo?: string;
  version: number;
  status: "active" | "inactive";
}

interface PartnerSampleRecord {
  id: string;
  bookingId: string;
  bookingNumber: string;
  scopexSampleId: string;
  partnerBarcode?: string;
  barcodePhotoUrl?: string;
  partnerLabId: string;
  partnerLabName: string;
  locationId: string;
  locationCity: string;
  patientName: string;
  patientPhone: string;
  testNames: string[];
  applicableRateSnapshot: Array<{
    testId: string;
    testName: string;
    processingRate: number;
    mappingVersion: number;
  }>;
  totalProcessingCost: number;
  status: string;
  statusHistory: Array<{
    id: string;
    previousStatus: string;
    newStatus: string;
    updatedBy: string;
    updatedAt: string;
    remarks?: string;
  }>;
  handoverConfirmedBy?: string;
  handoverConfirmedAt?: string;
  adminVerified: boolean;
  adminVerifiedBy?: string;
  adminVerifiedAt?: string;
  exceptionType?: string;
  exceptionRemarks?: string;
  createdAt: string;
}

interface PartnerReport {
  id: string;
  bookingId: string;
  bookingNumber: string;
  scopexSampleId: string;
  partnerBarcode?: string;
  patientName: string;
  testNames: string[];
  partnerLabId: string;
  reportType: "individual" | "combined" | "revised";
  currentFileUrl: string;
  currentFileName: string;
  status: "Awaiting Report" | "Report Uploaded" | "Pending Verification" | "Verified" | "Published to Patient";
  versionHistory: Array<{
    version: number;
    fileUrl: string;
    fileName: string;
    uploadedBy: string;
    uploadedAt: string;
    remarks?: string;
  }>;
  verifiedBy?: string;
  verifiedAt?: string;
  publishedAt?: string;
}

interface FinancialMetrics {
  kpis: {
    totalSamplesAssigned: number;
    totalSamplesCompleted: number;
    grossBookingsValue: number;
    netPatientRevenue: number;
    totalPartnerProcessingCost: number;
    totalPartnerPayable: number;
    totalPaymentsMade: number;
    outstandingPayable: number;
    grossProfit: number;
    grossMarginPercent: number;
  };
  partnerWiseBreakdown: Array<{
    partnerLabId: string;
    partnerLabName: string;
    samplesCount: number;
    netRevenueAllocated: number;
    partnerCost: number;
    grossProfit: number;
    marginPercent: number;
    invoicedAmount: number;
    paidAmount: number;
    pendingPayable: number;
  }>;
}

interface PartnerInvoice {
  id: string;
  invoiceNumber: string;
  partnerLabId: string;
  partnerLabName: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  claimedAmount: number;
  systemMatchedCost: number;
  discrepancyAmount: number;
  hasDiscrepancy: boolean;
  paidAmount: number;
  remainingAmount: number;
  status: string;
  invoiceDate: string;
  dueDate: string;
  notes?: string;
}

const LIFECYCLE_STEPS = [
  "Sample Collected",
  "Assigned to Partner Lab",
  "Ready for Handover",
  "Dispatched",
  "Received by Partner Lab",
  "Processing",
  "Completed",
  "Report Pending",
  "Report Uploaded",
  "Exception/Rejected"
];

export function AdminPartnerLabs() {
  const [activeTab, setActiveTab] = useState<"labs" | "test-master" | "samples" | "reports" | "financials">("labs");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Data states
  const [labs, setLabs] = useState<PartnerLab[]>([]);
  const [mappings, setMappings] = useState<PartnerTestMapping[]>([]);
  const [samples, setSamples] = useState<PartnerSampleRecord[]>([]);
  const [reports, setReports] = useState<PartnerReport[]>([]);
  const [financials, setFinancials] = useState<FinancialMetrics | null>(null);
  const [invoices, setInvoices] = useState<PartnerInvoice[]>([]);
  const [confirmedBookings, setConfirmedBookings] = useState<any[]>([]);
  const [testsData, setTestsData] = useState<any[]>([]);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPartnerFilter, setSelectedPartnerFilter] = useState("all");
  const [selectedCityFilter, setSelectedCityFilter] = useState("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");
  const [selectedApplicabilityFilter, setSelectedApplicabilityFilter] = useState("all");

  // Modals
  const [showRegisterLabModal, setShowRegisterLabModal] = useState(false);
  const [showAddLocationModal, setShowAddLocationModal] = useState<string | null>(null);
  const [showManualMappingModal, setShowManualMappingModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [showAssignSampleModal, setShowAssignSampleModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState<PartnerSampleRecord | null>(null);
  const [showHandoverVerifyModal, setShowHandoverVerifyModal] = useState<PartnerSampleRecord | null>(null);
  const [showStatusHistoryModal, setShowStatusHistoryModal] = useState<PartnerSampleRecord | null>(null);
  const [showUploadReportModal, setShowUploadReportModal] = useState(false);
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
  const [showPayInvoiceModal, setShowPayInvoiceModal] = useState<PartnerInvoice | null>(null);

  // Form states: New Lab
  const [newLabData, setNewLabData] = useState({
    name: "",
    brandName: "",
    legalName: "",
    registrationNumber: "",
    isNablAccredited: false,
    nablNumber: "",
    gstin: "",
    registeredAddress: "",
    primaryContactPerson: "",
    mobile: "",
    email: "",
    status: "active" as const
  });

  // Form states: New Location
  const [newLocData, setNewLocData] = useState({
    city: "Indore",
    fullAddress: "",
    pincode: "",
    contactPerson: "",
    mobile: "",
    email: "",
    sampleReceivingTimings: "08:00 AM - 08:00 PM",
    operatingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  });

  // Standard major operational cities for multi-select
  const ALL_OPERATIONAL_CITIES = [
    "Indore",
    "Bhopal",
    "Jabalpur",
    "Lucknow",
    "Kanpur",
    "Mumbai",
    "Pune",
    "Delhi",
    "Bengaluru"
  ];

  // Form states: Manual Mapping with Flexible City Selection
  const [manualMapData, setManualMapData] = useState({
    partnerLabId: "",
    applicability: "pan_india" as "pan_india" | "selected_cities" | "single_city",
    city: "Indore",
    applicableCities: ["Indore", "Bhopal"],
    locationId: "",
    scopexTestId: "",
    partnerTestName: "",
    partnerTestCode: "", // OPTIONAL!
    category: "Hematology",
    partnerProcessingRate: 150,
    sampleType: "Whole Blood EDTA",
    tatHours: "8 Hours",
    effectiveFrom: new Date().toISOString().split("T")[0],
    effectiveTo: "",
    resolutionStrategy: "new_version" as "skip" | "update" | "new_version",
    status: "active" as const
  });

  // Form states: Bulk Upload
  const [bulkPartnerLabId, setBulkPartnerLabId] = useState("");
  const [bulkLocationId, setBulkLocationId] = useState("");
  const [bulkCsvText, setBulkCsvText] = useState("");
  const [bulkPreview, setBulkPreview] = useState<any>(null);
  const [duplicateStrategy, setDuplicateStrategy] = useState<"skip" | "update" | "new_version">("new_version");

  // Form states: Assign Sample (Post-Booking Assignment)
  const [assignBookingId, setAssignBookingId] = useState("");
  const [assignPartnerLabId, setAssignPartnerLabId] = useState("");
  const [assignLocationId, setAssignLocationId] = useState("");
  const [assignSampleBarcode, setAssignSampleBarcode] = useState("");
  const [assignPreviewLoading, setAssignPreviewLoading] = useState(false);
  const [assignPreviewData, setAssignPreviewData] = useState<{
    allMapped: boolean;
    totalCost: number;
    tests: Array<{
      testId: string;
      testName: string;
      isMapped: boolean;
      rate?: number;
      appliedScope?: string;
      appliedScopeDescription?: string;
      partnerTestName?: string;
      errorWarning?: string;
    }>;
  } | null>(null);
  const [assignOverrideException, setAssignOverrideException] = useState(false);
  const [assignOverrideRemarks, setAssignOverrideRemarks] = useState("");

  // Form states: Reassign Sample
  const [reassignPartnerLabId, setReassignPartnerLabId] = useState("");
  const [reassignLocationId, setReassignLocationId] = useState("");
  const [reassignReason, setReassignReason] = useState("");
  const [reassignPreviewLoading, setReassignPreviewLoading] = useState(false);
  const [reassignPreviewData, setReassignPreviewData] = useState<any>(null);

  // Form states: Report Upload
  const [reportBookingId, setReportBookingId] = useState("");
  const [reportType, setReportType] = useState<"individual" | "combined" | "revised">("combined");
  const [reportFileUrl, setReportFileUrl] = useState("https://scopexdiagnostics.in/reports/signed-lab-report.pdf");
  const [reportFileName, setReportFileName] = useState("Lab_Report_Final_Signed.pdf");
  const [reportRemarks, setReportRemarks] = useState("");

  // Form states: Invoice
  const [newInvoiceData, setNewInvoiceData] = useState({
    invoiceNumber: `INV-${Date.now().toString().slice(-5)}`,
    partnerLabId: "",
    billingPeriodStart: "2026-03-01",
    billingPeriodEnd: "2026-03-31",
    claimedAmount: 5000,
    dueDate: "2026-04-15",
    notes: "Monthly consolidated lab processing bill"
  });

  // Form states: Payment
  const [paymentAmount, setPaymentAmount] = useState(1000);
  const [paymentMode, setPaymentMode] = useState<"NEFT" | "RTGS" | "UPI" | "Cheque">("NEFT");
  const [paymentRefNumber, setPaymentRefNumber] = useState(`TXN-${Date.now().toString().slice(-6)}`);
  const [paymentNotes, setPaymentNotes] = useState("");

  const nameInputId = useId();
  const brandInputId = useId();
  const legalInputId = useId();
  const regInputId = useId();
  const nablCheckId = useId();
  const nablNoId = useId();
  const gstinId = useId();
  const addressId = useId();
  const contactNameId = useId();
  const mobileId = useId();
  const emailId = useId();

  // Load core data
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [labsRes, mapRes, samplesRes, repRes, finRes, invRes, bookRes, testRes] = await Promise.all([
        backendFetch("/admin/partner-labs"),
        backendFetch("/admin/partner-test-master"),
        backendFetch("/admin/partner-samples"),
        backendFetch("/admin/partner-reports"),
        backendFetch("/admin/partner-financials"),
        backendFetch("/admin/partner-invoices"),
        backendFetch("/admin/bookings-management").catch(() => null),
        backendFetch("/admin/tests-management").catch(() => null)
      ]);

      if (labsRes.ok) {
        const d = await labsRes.json();
        setLabs(d.labs || []);
        if (d.labs?.length > 0 && !manualMapData.partnerLabId) {
          setManualMapData((prev) => ({
            ...prev,
            partnerLabId: d.labs[0].id,
            locationId: d.labs[0].locations[0]?.id || ""
          }));
          setBulkPartnerLabId(d.labs[0].id);
          setBulkLocationId(d.labs[0].locations[0]?.id || "");
          setAssignPartnerLabId(d.labs[0].id);
          setAssignLocationId(d.labs[0].locations[0]?.id || "");
          setNewInvoiceData((prev) => ({ ...prev, partnerLabId: d.labs[0].id }));
        }
      }

      if (mapRes.ok) {
        const d = await mapRes.json();
        setMappings(d.mappings || []);
      }

      if (samplesRes.ok) {
        const d = await samplesRes.json();
        setSamples(d.samples || []);
      }

      if (repRes.ok) {
        const d = await repRes.json();
        setReports(d.reports || []);
      }

      if (finRes.ok) {
        const d = await finRes.json();
        setFinancials(d.financials || null);
      }

      if (invRes.ok) {
        const d = await invRes.json();
        setInvoices(d.invoices || []);
      }

      if (bookRes && bookRes.ok) {
        const d = await bookRes.json();
        setConfirmedBookings(d.rows || []);
      }

      if (testRes && testRes.ok) {
        const d = await testRes.json();
        setTestsData(d.tests || []);
        if (d.tests?.length > 0 && !manualMapData.scopexTestId) {
          setManualMapData((prev) => ({
            ...prev,
            scopexTestId: d.tests[0].id,
            partnerTestName: `${d.tests[0].name} (Standard Panel)`
          }));
        }
        if (typeof window !== "undefined") {
          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.get("tab") === "samples") setActiveTab("samples");
          const bkParam = urlParams.get("assignBookingId");
          if (bkParam) {
            setAssignBookingId(bkParam);
            setShowAssignSampleModal(true);
          }
        }
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed to load partner laboratory data." });
    } finally {
      setLoading(false);
    }
  }, [manualMapData.partnerLabId, manualMapData.scopexTestId]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  // Rate preview loader for sample assignment
  const loadAssignRatePreview = useCallback(async (labId: string, locId: string, bkId: string) => {
    if (!labId || !locId || !bkId) {
      setAssignPreviewData(null);
      return;
    }
    const booking = confirmedBookings.find((b) => b.id === bkId);
    if (!booking) return;

    const testIds: string[] = [];
    const patients = (booking.booking_patients as any[]) || [];
    for (const p of patients) {
      for (const item of p.items || []) {
        if (item.kind === "test" && item.id) testIds.push(item.id);
        else if (item.kind === "package" && item.testIds) testIds.push(...item.testIds);
      }
    }
    if (testIds.length === 0) testIds.push("cbc");

    setAssignPreviewLoading(true);
    try {
      const res = await backendFetch(
        `/admin/partner-labs/tests-and-rates?partnerLabId=${encodeURIComponent(labId)}&locationId=${encodeURIComponent(locId)}&testIds=${encodeURIComponent(testIds.join(","))}`
      );
      const data = await res.json();
      if (data.success) {
        setAssignPreviewData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAssignPreviewLoading(false);
    }
  }, [confirmedBookings]);

  // Rate preview loader for sample reassignment
  const loadReassignRatePreview = useCallback(async (labId: string, locId: string, testIds: string[]) => {
    if (!labId || !locId || !testIds.length) {
      setReassignPreviewData(null);
      return;
    }
    setReassignPreviewLoading(true);
    try {
      const res = await backendFetch(
        `/admin/partner-labs/tests-and-rates?partnerLabId=${encodeURIComponent(labId)}&locationId=${encodeURIComponent(locId)}&testIds=${encodeURIComponent(testIds.join(","))}`
      );
      const data = await res.json();
      if (data.success) {
        setReassignPreviewData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setReassignPreviewLoading(false);
    }
  }, []);

  useEffect(() => {
    if (showAssignSampleModal && assignPartnerLabId && assignLocationId && assignBookingId) {
      void loadAssignRatePreview(assignPartnerLabId, assignLocationId, assignBookingId);
    }
  }, [showAssignSampleModal, assignPartnerLabId, assignLocationId, assignBookingId, loadAssignRatePreview]);

  useEffect(() => {
    if (showReassignModal && reassignPartnerLabId && reassignLocationId) {
      const testIds = showReassignModal.testSnapshots?.map((t: any) => t.testId) || ["cbc"];
      void loadReassignRatePreview(reassignPartnerLabId, reassignLocationId, testIds);
    }
  }, [showReassignModal, reassignPartnerLabId, reassignLocationId, loadReassignRatePreview]);

  // Helper feedback banner timeout
  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 5000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  // ---------------------------------------------------------------------------
  // HANDLERS: PHASE 1 (LAB REGISTRATION & LOCATIONS)
  // ---------------------------------------------------------------------------
  const handleRegisterLab = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await backendFetch("/admin/partner-labs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLabData)
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to register partner laboratory.");
      setFeedback({ type: "success", text: `Registered Partner Laboratory: ${d.lab.name} (${d.lab.id})` });
      setShowRegisterLabModal(false);
      setNewLabData({
        name: "",
        brandName: "",
        legalName: "",
        registrationNumber: "",
        isNablAccredited: false,
        nablNumber: "",
        gstin: "",
        registeredAddress: "",
        primaryContactPerson: "",
        mobile: "",
        email: "",
        status: "active"
      });
      void loadAll();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message });
    }
  };

  const handleAddLocation = async (partnerLabId: string, e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await backendFetch(`/admin/partner-labs/${partnerLabId}/locations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLocData)
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to add location.");
      setFeedback({ type: "success", text: `Added operational location: ${d.location.city} (${d.location.id})` });
      setShowAddLocationModal(null);
      void loadAll();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message });
    }
  };

  const handleToggleLabStatus = async (labId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      const res = await backendFetch(`/admin/partner-labs/${labId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error("Failed to update status");
      setFeedback({ type: "success", text: `Partner lab status updated to ${newStatus}` });
      void loadAll();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message });
    }
  };

  // ---------------------------------------------------------------------------
  // HANDLERS: PHASE 2 (PARTNER TEST MASTER & BULK UPLOAD)
  // ---------------------------------------------------------------------------
  const handleCreateManualMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await backendFetch("/admin/partner-test-master", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(manualMapData)
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to save test mapping.");
      setFeedback({ type: "success", text: `Mapped test ${d.mapping.scopexTestName} @ ₹${d.mapping.partnerProcessingRate}` });
      setShowManualMappingModal(false);
      void loadAll();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message });
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await backendFetch("/admin/partner-test-master/template");
      if (res.ok) {
        const d = await res.json();
        const blob = new Blob([d.template.csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "SCOPEX_Partner_Test_Master_Template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setFeedback({ type: "success", text: "Excel/CSV template downloaded successfully." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed to download template." });
    }
  };

  const handleValidateBulkUpload = async () => {
    if (!bulkCsvText.trim()) {
      setFeedback({ type: "error", text: "Please paste CSV rows or upload a file first." });
      return;
    }
    try {
      const lines = bulkCsvText
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

      // Simple CSV parse
      const rows = lines.map((line) => {
        const parts = line.split(",").map((p) => p.replace(/^"|"$/g, "").trim());
        return {
          scopexTestIdentifier: parts[0] || "",
          partnerTestName: parts[1] || "",
          partnerTestCode: parts[2] || undefined, // Optional!
          category: parts[3] || undefined,
          partnerProcessingRate: parseFloat(parts[4]) || 0,
          sampleType: parts[5] || undefined,
          tatHours: parts[6] || undefined,
          effectiveFrom: parts[7] || "2026-03-01",
          effectiveTo: parts[8] || undefined,
          status: parts[9] || "Active"
        };
      });

      // Filter out header line if present
      const cleanRows = rows[0]?.scopexTestIdentifier.toLowerCase().includes("scopex test") ? rows.slice(1) : rows;

      const res = await backendFetch("/admin/partner-test-master/validate-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerLabId: bulkPartnerLabId,
          locationId: bulkLocationId,
          rows: cleanRows
        })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Validation failed.");
      setBulkPreview(d.preview);
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message });
    }
  };

  const handleCommitBulkUpload = async () => {
    if (!bulkPreview) return;
    try {
      const res = await backendFetch("/admin/partner-test-master/commit-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preview: bulkPreview,
          duplicateStrategy
        })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Import failed.");
      setFeedback({
        type: "success",
        text: `Bulk Import Completed: ${d.importedCount} imported, ${d.updatedCount} updated, ${d.newVersionCount} new versions, ${d.skippedCount} skipped.`
      });
      setShowBulkUploadModal(false);
      setBulkPreview(null);
      setBulkCsvText("");
      void loadAll();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message });
    }
  };

  // ---------------------------------------------------------------------------
  // HANDLERS: PHASE 3 & 4 (SAMPLE ASSIGNMENT & 10-STEP LIFECYCLE)
  // ---------------------------------------------------------------------------
  const handleAssignSample = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await backendFetch("/admin/partner-samples/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: assignBookingId,
          partnerLabId: assignPartnerLabId,
          locationId: assignLocationId,
          scopexSampleId: assignSampleBarcode || undefined
        })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to assign sample.");
      setFeedback({
        type: "success",
        text: `Assigned sample ${d.sample.scopexSampleId} to ${d.sample.partnerLabName}. Total Partner Cost Snapshot: ₹${d.sample.totalProcessingCost}`
      });
      setShowAssignSampleModal(false);
      void loadAll();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message });
    }
  };

  const handleUpdateSampleStatus = async (sampleId: string, newStatus: string, remarks?: string) => {
    try {
      const res = await backendFetch(`/admin/partner-samples/${sampleId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newStatus, remarks })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to update sample status.");
      setFeedback({ type: "success", text: `Sample status transitioned to "${newStatus}"` });
      void loadAll();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message });
    }
  };

  const handleVerifyHandover = async (sampleId: string, correctedBarcode?: string) => {
    try {
      const res = await backendFetch(`/admin/partner-samples/${sampleId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerBarcode: correctedBarcode || undefined,
          verificationNotes: "Handover barcode verified against tube photograph by admin desk."
        })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Verification failed.");
      setFeedback({ type: "success", text: `Handover verified successfully for sample ${d.sample.scopexSampleId}` });
      setShowHandoverVerifyModal(null);
      void loadAll();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message });
    }
  };

  const handleReassignSample = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showReassignModal) return;
    if (!reassignReason.trim()) {
      setFeedback({ type: "error", text: "Reason for lab reassignment is mandatory for clinical audit." });
      return;
    }
    try {
      const res = await backendFetch("/admin/partner-samples/reassign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sampleId: showReassignModal.id,
          newPartnerLabId: reassignPartnerLabId,
          newLocationId: reassignLocationId,
          reason: reassignReason.trim()
        })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to reassign sample.");
      setFeedback({
        type: "success",
        text: `Sample ${showReassignModal.scopexSampleId} successfully reassigned to ${d.sample.partnerLabName} (${d.sample.locationCity}). New processing rate: ₹${d.sample.totalProcessingCost}`
      });
      setShowReassignModal(null);
      setReassignReason("");
      void loadAll();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message });
    }
  };

  // ---------------------------------------------------------------------------
  // HANDLERS: PHASE 5 (REPORT UPLOAD & PATIENT PUBLICATION)
  // ---------------------------------------------------------------------------
  const handleUploadReport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await backendFetch("/admin/partner-reports/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: reportBookingId,
          reportType,
          fileUrl: reportFileUrl,
          fileName: reportFileName,
          remarks: reportRemarks
        })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to upload report.");
      setFeedback({ type: "success", text: `Uploaded ${reportType} report for booking #${d.report.bookingNumber}` });
      setShowUploadReportModal(false);
      void loadAll();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message });
    }
  };

  const handleVerifyPublishReport = async (reportId: string, action: "verify" | "publish") => {
    try {
      const res = await backendFetch(`/admin/partner-reports/${reportId}/verify-publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed action.");
      setFeedback({
        type: "success",
        text: action === "publish" ? "Report published to patient portal!" : "Report verified by medical admin!"
      });
      void loadAll();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message });
    }
  };

  // ---------------------------------------------------------------------------
  // HANDLERS: PHASE 6, 7 & 8 (INVOICES & PAYMENTS)
  // ---------------------------------------------------------------------------
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await backendFetch("/admin/partner-invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newInvoiceData)
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to create invoice.");
      if (d.invoice.hasDiscrepancy) {
        setFeedback({
          type: "error",
          text: `Invoice #${d.invoice.invoiceNumber} recorded with DISCREPANCY: Claimed ₹${d.invoice.claimedAmount} vs Matched Cost ₹${d.invoice.systemMatchedCost} (Diff ₹${d.invoice.discrepancyAmount})`
        });
      } else {
        setFeedback({ type: "success", text: `Invoice #${d.invoice.invoiceNumber} recorded and fully matched with sample records!` });
      }
      setShowCreateInvoiceModal(false);
      void loadAll();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message });
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPayInvoiceModal) return;
    try {
      const res = await backendFetch(`/admin/partner-invoices/${showPayInvoiceModal.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(paymentAmount),
          paymentMode,
          referenceNumber: paymentRefNumber,
          notes: paymentNotes
        })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Payment recording failed.");
      setFeedback({
        type: "success",
        text: `Recorded ₹${paymentAmount} payment via ${paymentMode} for Invoice #${showPayInvoiceModal.invoiceNumber}`
      });
      setShowPayInvoiceModal(null);
      void loadAll();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message });
    }
  };

  // Filtered lists
  const filteredLabs = labs.filter((l) => {
    if (selectedStatusFilter !== "all" && l.status !== selectedStatusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        l.name.toLowerCase().includes(q) ||
        l.brandName.toLowerCase().includes(q) ||
        l.id.toLowerCase().includes(q) ||
        l.locations.some((loc) => loc.city.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const filteredMappings = mappings.filter((m) => {
    if (selectedPartnerFilter !== "all" && m.partnerLabId !== selectedPartnerFilter) return false;
    if (selectedStatusFilter !== "all" && m.status !== selectedStatusFilter) return false;
    if (selectedApplicabilityFilter !== "all" && (m.applicability || "pan_india") !== selectedApplicabilityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        m.scopexTestName.toLowerCase().includes(q) ||
        m.partnerTestName.toLowerCase().includes(q) ||
        (m.partnerTestCode && m.partnerTestCode.toLowerCase().includes(q)) ||
        m.scopexTestId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredSamples = samples.filter((s) => {
    if (selectedStatusFilter !== "all") {
      if (selectedStatusFilter === "exception") {
        if (!s.status.includes("Exception") && !s.exceptionType) return false;
      } else if (s.status !== selectedStatusFilter) {
        return false;
      }
    }
    if (selectedPartnerFilter !== "all" && s.partnerLabId !== selectedPartnerFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.bookingNumber.toLowerCase().includes(q) ||
        s.scopexSampleId.toLowerCase().includes(q) ||
        (s.partnerBarcode && s.partnerBarcode.toLowerCase().includes(q)) ||
        s.patientName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4 rounded-3xl border border-[#f1dfce] bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
              <Building2 className="h-3.5 w-3.5" />
              Partner Lab Management System
            </span>
            <span className="text-xs font-semibold text-gray-500">Phase 1 - Phase 10 Workflow</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
            Partner Laboratories & Outsource Operations
          </h1>
          <p className="mt-1 text-xs text-gray-500 max-w-3xl">
            Complete partner lab ecosystem: Registration, Multi-city locations, Test Master with rate versioning, Barcode tracking, 10-step lifecycle, Report publishing, and Financial reconciliation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => void loadAll()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
          >
            Back to Overview
          </Link>
        </div>
      </div>

      {/* FEEDBACK BANNER */}
      {feedback && (
        <div
          className={`flex items-center justify-between rounded-2xl p-4 text-xs font-bold ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
              : "bg-rose-50 text-rose-900 border border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-gray-500 hover:text-black">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* TAB NAVIGATION */}
      <div className="flex border-b border-gray-200 overflow-x-auto gap-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab("labs")}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition whitespace-nowrap ${
            activeTab === "labs"
              ? "border-[#FF6B00] text-[#FF6B00]"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <Building2 className="h-4 w-4" />
          Partner Labs & Locations ({labs.length})
        </button>

        <button
          onClick={() => setActiveTab("test-master")}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition whitespace-nowrap ${
            activeTab === "test-master"
              ? "border-[#FF6B00] text-[#FF6B00]"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <Layers className="h-4 w-4" />
          Partner Test Master ({mappings.length})
        </button>

        <button
          onClick={() => setActiveTab("samples")}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition whitespace-nowrap ${
            activeTab === "samples"
              ? "border-[#FF6B00] text-[#FF6B00]"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <Camera className="h-4 w-4" />
          Sample Tracking & Handover ({samples.length})
        </button>

        <button
          onClick={() => setActiveTab("reports")}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition whitespace-nowrap ${
            activeTab === "reports"
              ? "border-[#FF6B00] text-[#FF6B00]"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <FileCheck2 className="h-4 w-4" />
          Report Upload & Publication ({reports.length})
        </button>

        <button
          onClick={() => setActiveTab("financials")}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition whitespace-nowrap ${
            activeTab === "financials"
              ? "border-[#FF6B00] text-[#FF6B00]"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <DollarSign className="h-4 w-4" />
          Financial Dashboard & Invoices
        </button>
      </div>

      {/* ======================================================================= */}
      {/* TAB 1: PARTNER LAB REGISTRATION & LOCATIONS (PHASE 1)                   */}
      {/* ======================================================================= */}
      {activeTab === "labs" && (
        <div className="space-y-6">
          {/* Top Actions & Filters */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-2 max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search partner lab name, brand, ID, or city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-2 text-xs focus:border-[#FF6B00] focus:outline-none"
                />
              </div>
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive</option>
                <option value="pending_verification">Pending Verification</option>
              </select>
            </div>

            <button
              onClick={() => setShowRegisterLabModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#008080] px-4 py-2 text-xs font-bold text-white hover:bg-[#006666] transition shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Register Partner Laboratory
            </button>
          </div>

          {/* Labs List */}
          <div className="grid gap-6">
            {filteredLabs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-xs text-gray-500">
                No partner laboratories match the selected criteria.
              </div>
            ) : (
              filteredLabs.map((lab) => (
                <div key={lab.id} className="rounded-2xl border border-[#f1dfce] bg-white p-6 shadow-sm">
                  {/* Lab Header */}
                  <div className="flex flex-col gap-3 pb-4 border-b border-gray-100 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#FF6B00]">{lab.id}</span>
                        <h2 className="text-lg font-bold text-gray-900">{lab.name}</h2>
                        <span className="rounded-lg bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
                          Brand: {lab.brandName}
                        </span>
                        {lab.isNablAccredited ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                            <ShieldCheck className="h-3 w-3" />
                            NABL Accredited ({lab.nablNumber || "Certified"})
                          </span>
                        ) : (
                          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-gray-600">
                            Non-NABL
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {lab.legalName ? `Legal: ${lab.legalName} • ` : ""}
                        Reg/Licence: <span className="font-mono font-medium">{lab.registrationNumber}</span>
                        {lab.gstin ? ` • GSTIN: ${lab.gstin}` : ""}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          lab.status === "active"
                            ? "bg-emerald-100 text-emerald-800"
                            : lab.status === "pending_verification"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {lab.status.toUpperCase()}
                      </span>
                      <button
                        onClick={() => handleToggleLabStatus(lab.id, lab.status)}
                        className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        {lab.status === "active" ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => setShowAddLocationModal(lab.id)}
                        className="inline-flex items-center gap-1 rounded-xl bg-gray-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-black"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Location
                      </button>
                    </div>
                  </div>

                  {/* Primary Contact Details */}
                  <div className="mt-4 grid gap-4 rounded-xl bg-[#FFF8F2] p-4 text-xs md:grid-cols-3">
                    <div>
                      <span className="font-bold text-gray-700">Primary Contact:</span>
                      <p className="text-gray-900 font-medium mt-0.5">{lab.primaryContactPerson}</p>
                    </div>
                    <div>
                      <span className="font-bold text-gray-700">Mobile & Email:</span>
                      <p className="text-gray-900 font-medium mt-0.5">
                        {lab.mobile} • {lab.email}
                      </p>
                    </div>
                    <div>
                      <span className="font-bold text-gray-700">Registered Address:</span>
                      <p className="text-gray-900 font-medium mt-0.5">{lab.registeredAddress}</p>
                    </div>
                  </div>

                  {/* Operational Locations List */}
                  <div className="mt-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-[#FF6B00]" />
                        Operational City Locations ({lab.locations.length})
                      </h3>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      {lab.locations.map((loc) => (
                        <div
                          key={loc.id}
                          className="rounded-xl border border-gray-200 p-4 bg-white hover:border-[#FF6B00] transition"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-gray-900">{loc.city}</span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                loc.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
                              }`}
                            >
                              {loc.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">{loc.fullAddress} - PIN: {loc.pincode}</p>
                          <div className="mt-2 text-[11px] text-gray-500 space-y-0.5">
                            <div>Contact: {loc.contactPerson} ({loc.mobile})</div>
                            <div>Timings: {loc.sampleReceivingTimings}</div>
                            <div>Days: {loc.operatingDays.join(", ")}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* TAB 2: PARTNER LAB TEST MASTER (PHASE 2)                                */}
      {/* ======================================================================= */}
      {activeTab === "test-master" && (
        <div className="space-y-6">
          {/* Action Toolbar */}
          <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 border border-[#f1dfce] md:flex-row md:items-center md:justify-between shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search test name or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-xl border border-gray-200 pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-[#FF6B00] w-52"
                />
              </div>

              <select
                value={selectedPartnerFilter}
                onChange={(e) => setSelectedPartnerFilter(e.target.value)}
                className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 focus:outline-none"
              >
                <option value="all">All Partners</option>
                {labs.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive</option>
              </select>

              <select
                value={selectedApplicabilityFilter}
                onChange={(e) => setSelectedApplicabilityFilter(e.target.value)}
                className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 focus:outline-none"
              >
                <option value="all">All Applicability</option>
                <option value="pan_india">Pan-India Only</option>
                <option value="selected_cities">Selected Cities</option>
                <option value="single_city">Single City Only</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
              >
                <Download className="h-3.5 w-3.5 text-[#008080]" />
                Download Excel Template
              </button>
              <button
                onClick={() => setShowBulkUploadModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#FF6B00] bg-[#FFF8F2] px-3.5 py-2 text-xs font-bold text-[#FF6B00] hover:bg-orange-100 transition"
              >
                <Upload className="h-3.5 w-3.5" />
                Bulk Excel / CSV Upload
              </button>
              <button
                onClick={() => setShowManualMappingModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gray-900 px-4 py-2 text-xs font-bold text-white hover:bg-black transition shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Test Mapping
              </button>
            </div>
          </div>

          {/* Mapping Table */}
          <div className="overflow-x-auto rounded-2xl border border-[#f1dfce] bg-white shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FFF8F2] border-b border-[#f1dfce] text-gray-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Partner Lab & Scope</th>
                  <th className="py-3 px-4">SCOPEX Test Name</th>
                  <th className="py-3 px-4">Partner Lab Test Name & Code</th>
                  <th className="py-3 px-4">Rate Applicability</th>
                  <th className="py-3 px-4">Sample & TAT</th>
                  <th className="py-3 px-4 text-right">Partner Rate</th>
                  <th className="py-3 px-4">Effective Dates</th>
                  <th className="py-3 px-4">Status & Ver</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMappings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-500">
                      No test mappings found. Use &quot;Add Test Mapping&quot; or &quot;Bulk Excel Upload&quot; to configure rates.
                    </td>
                  </tr>
                ) : (
                  filteredMappings.map((m) => {
                    const lab = labs.find((l) => l.id === m.partnerLabId);
                    const loc = lab?.locations.find((lc) => lc.id === m.locationId);
                    return (
                      <tr key={m.id} className="hover:bg-orange-50/30 transition">
                        <td className="py-3 px-4 font-medium text-gray-900">
                          <div>{lab?.name || m.partnerLabId}</div>
                          <div className="text-[11px] text-gray-500">{loc?.city || m.city || "All India"}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-gray-900">{m.scopexTestName}</span>
                          <span className="block font-mono text-[10px] text-gray-400">{m.scopexTestId}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-800">{m.partnerTestName}</div>
                          <div className="text-[11px] text-gray-500">
                            {m.partnerTestCode ? (
                              <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">
                                Code: {m.partnerTestCode}
                              </span>
                            ) : (
                              <span className="text-gray-400 italic text-[10px]">No Partner Code (Supported)</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {m.applicability === "pan_india" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-800 border border-blue-200">
                              🇮🇳 Pan-India
                            </span>
                          ) : m.applicability === "selected_cities" ? (
                            <div>
                              <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-[10px] font-bold text-purple-800 border border-purple-200">
                                Selected Cities ({m.applicableCities?.length || 0})
                              </span>
                              <p className="text-[10px] text-gray-500 mt-0.5 max-w-xs truncate" title={m.applicableCities?.join(", ")}>
                                {m.applicableCities?.join(", ")}
                              </p>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                              Single City: {m.city || loc?.city || "Indore"}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          <div>{m.sampleType}</div>
                          <div className="text-[11px] text-gray-400">TAT: {m.tatHours}</div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-bold text-sm text-emerald-700">₹{m.partnerProcessingRate}</span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 text-[11px]">
                          <div>From: {m.effectiveFrom}</div>
                          {m.effectiveTo && <div>To: {m.effectiveTo}</div>}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              m.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {m.status.toUpperCase()} (v{m.version})
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* TAB 3: SAMPLE TRACKING & 10-STEP LIFECYCLE (PHASE 3 & 4)                */}
      {/* ======================================================================= */}
      {activeTab === "samples" && (
        <div className="space-y-6">
          {/* Action Toolbar */}
          <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 border border-[#f1dfce] md:flex-row md:items-center md:justify-between shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search booking #, barcode, patient..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-xl border border-gray-200 pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-[#FF6B00] w-56"
                />
              </div>

              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 focus:outline-none"
              >
                <option value="all">All 10 Lifecycle Stages</option>
                <option value="exception">⚠️ Exception Queue</option>
                {LIFECYCLE_STEPS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowAssignSampleModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#008080] px-4 py-2 text-xs font-bold text-white hover:bg-[#006666] transition shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              Assign Booking to Partner Lab
            </button>
          </div>

          {/* Samples Cards List */}
          <div className="grid gap-4">
            {filteredSamples.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-xs text-gray-500">
                No samples found for the selected status. Click &quot;Assign Booking to Partner Lab&quot; to assign a sample.
              </div>
            ) : (
              filteredSamples.map((s) => (
                <div
                  key={s.id}
                  className={`rounded-2xl border bg-white p-5 shadow-sm transition ${
                    s.exceptionType || s.status.includes("Exception")
                      ? "border-rose-300 bg-rose-50/20"
                      : "border-[#f1dfce]"
                  }`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-gray-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-700">{s.bookingNumber}</span>
                        <span className="font-bold text-gray-900">{s.patientName}</span>
                        <span className="text-xs text-gray-500 font-mono">Sample: {s.scopexSampleId}</span>
                        {s.partnerBarcode && (
                          <span className="rounded bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-mono font-bold text-indigo-800">
                            Partner Accession: {s.partnerBarcode}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Assigned Lab: <span className="font-bold text-gray-800">{s.partnerLabName}</span> ({s.locationCity}) • Historical Rate Snapshot: <span className="font-bold text-emerald-700">₹{s.totalProcessingCost}</span>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          s.exceptionType
                            ? "bg-rose-100 text-rose-800"
                            : s.status === "Completed"
                            ? "bg-emerald-100 text-emerald-800"
                            : s.status === "Report Uploaded"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {s.status}
                      </span>

                      {s.adminVerified ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                          <Check className="h-3 w-3" />
                          Handover Verified
                        </span>
                      ) : (
                        <button
                          onClick={() => setShowHandoverVerifyModal(s)}
                          className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition"
                        >
                          Verify Handover
                        </button>
                      )}

                      <button
                        onClick={() => setShowStatusHistoryModal(s)}
                        className="rounded-xl border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                      >
                        Lifecycle Audit ({s.statusHistory.length})
                      </button>

                      {s.status !== "Completed" && s.status !== "Report Uploaded" && (
                        <button
                          onClick={() => {
                            setShowReassignModal(s);
                            setReassignPartnerLabId(s.partnerLabId);
                            setReassignLocationId(s.locationId);
                            setReassignReason("");
                          }}
                          className="rounded-xl border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100 transition"
                        >
                          Reassign Lab
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 10-Step Lifecycle Pipeline Indicator */}
                  <div className="mt-4 pt-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                      10-Step Laboratory Processing Pipeline
                    </div>
                    <div className="flex items-center gap-1 overflow-x-auto pb-2">
                      {LIFECYCLE_STEPS.map((step, idx) => {
                        const isCurrent = s.status === step;
                        const isPast = LIFECYCLE_STEPS.indexOf(s.status) > idx;
                        return (
                          <button
                            key={step}
                            onClick={() => handleUpdateSampleStatus(s.id, step)}
                            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition whitespace-nowrap ${
                              isCurrent
                                ? "bg-[#FF6B00] text-white font-bold shadow-sm"
                                : isPast
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                            }`}
                          >
                            <span>{idx + 1}.</span>
                            <span>{step}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Exception callout if present */}
                  {s.exceptionType && (
                    <div className="mt-3 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-rose-600 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-bold">Exception Triage: {s.exceptionType}</span>
                        <p className="mt-0.5 text-rose-700">{s.exceptionRemarks || "Immediate admin resolution required."}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* TAB 4: REPORT MANAGEMENT & PATIENT PUBLICATION (PHASE 5)                */}
      {/* ======================================================================= */}
      {activeTab === "reports" && (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 border border-[#f1dfce] md:flex-row md:items-center md:justify-between shadow-sm">
            <div className="text-xs text-gray-600">
              Manage incoming partner diagnostic reports. Workflow: <span className="font-bold text-gray-900">Awaiting Report → Report Uploaded → Pending Verification → Verified → Published to Patient</span>
            </div>

            <button
              onClick={() => setShowUploadReportModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#008080] px-4 py-2 text-xs font-bold text-white hover:bg-[#006666] transition shadow-sm"
            >
              <Upload className="h-3.5 w-3.5" />
              Upload Partner Lab Report
            </button>
          </div>

          {/* Reports Table */}
          <div className="overflow-x-auto rounded-2xl border border-[#f1dfce] bg-white shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FFF8F2] border-b border-[#f1dfce] text-gray-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Booking & Patient</th>
                  <th className="py-3 px-4">Sample ID & Partner Barcode</th>
                  <th className="py-3 px-4">Report Type & File</th>
                  <th className="py-3 px-4">Publication Status</th>
                  <th className="py-3 px-4">Revisions</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      No partner lab reports uploaded yet. Click &quot;Upload Partner Lab Report&quot; to begin.
                    </td>
                  </tr>
                ) : (
                  reports.map((rep) => (
                    <tr key={rep.id} className="hover:bg-orange-50/30 transition">
                      <td className="py-3 px-4 font-medium text-gray-900">
                        <div className="font-bold">{rep.bookingNumber}</div>
                        <div className="text-xs text-gray-600">{rep.patientName}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-700">
                        <div>{rep.scopexSampleId}</div>
                        {rep.partnerBarcode && <div className="text-[10px] text-indigo-700">BC: {rep.partnerBarcode}</div>}
                      </td>
                      <td className="py-3 px-4">
                        <span className="capitalize font-semibold text-gray-800">{rep.reportType}</span>
                        <a
                          href={rep.currentFileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-0.5 flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline"
                        >
                          <FileText className="h-3 w-3" />
                          {rep.currentFileName}
                        </a>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                            rep.status === "Published to Patient"
                              ? "bg-emerald-100 text-emerald-800"
                              : rep.status === "Verified"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {rep.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[11px] text-gray-500">
                        {rep.versionHistory.length} revision(s)
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {rep.status !== "Verified" && rep.status !== "Published to Patient" && (
                          <button
                            onClick={() => handleVerifyPublishReport(rep.id, "verify")}
                            className="rounded-xl border border-blue-600 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition"
                          >
                            Verify
                          </button>
                        )}
                        {rep.status !== "Published to Patient" && (
                          <button
                            onClick={() => handleVerifyPublishReport(rep.id, "publish")}
                            className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition"
                          >
                            Publish to Patient
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* TAB 5: FINANCIAL DASHBOARD & INVOICES (PHASE 6, 7 & 8)                  */}
      {/* ======================================================================= */}
      {activeTab === "financials" && financials && (
        <div className="space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-[#f1dfce] bg-white p-5 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Net Patient Revenue</span>
              <p className="mt-2 text-2xl font-bold text-gray-900">₹{financials.kpis.netPatientRevenue.toLocaleString()}</p>
              <p className="text-[11px] text-gray-500 mt-1">Actual patient collections minus refunds</p>
            </div>

            <div className="rounded-2xl border border-[#f1dfce] bg-white p-5 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Partner Processing Cost</span>
              <p className="mt-2 text-2xl font-bold text-rose-600">₹{financials.kpis.totalPartnerProcessingCost.toLocaleString()}</p>
              <p className="text-[11px] text-gray-500 mt-1">Snapshot rates * assigned tests</p>
            </div>

            <div className="rounded-2xl border border-[#f1dfce] bg-white p-5 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Gross Profit</span>
              <p className="mt-2 text-2xl font-bold text-emerald-600">₹{financials.kpis.grossProfit.toLocaleString()}</p>
              <p className="text-[11px] text-emerald-700 font-bold mt-1">
                Margin: {financials.kpis.grossMarginPercent}%
              </p>
            </div>

            <div className="rounded-2xl border border-[#f1dfce] bg-white p-5 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Outstanding Payable</span>
              <p className="mt-2 text-2xl font-bold text-amber-600">₹{financials.kpis.outstandingPayable.toLocaleString()}</p>
              <p className="text-[11px] text-gray-500 mt-1">Total Invoiced - Paid (₹{financials.kpis.totalPaymentsMade})</p>
            </div>
          </div>

          {/* Partner-Wise Breakdown */}
          <div className="rounded-2xl border border-[#f1dfce] bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-[#FF6B00]" />
              Partner Laboratory Profitability Breakdown (Proportional Package Revenue Allocation)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FFF8F2] border-b border-[#f1dfce] text-gray-600 font-bold text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Partner Laboratory</th>
                    <th className="py-2.5 px-3 text-right">Samples Assigned</th>
                    <th className="py-2.5 px-3 text-right">Allocated Revenue</th>
                    <th className="py-2.5 px-3 text-right">Partner Cost</th>
                    <th className="py-2.5 px-3 text-right">Gross Profit</th>
                    <th className="py-2.5 px-3 text-right">Margin %</th>
                    <th className="py-2.5 px-3 text-right">Invoiced / Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {financials.partnerWiseBreakdown.map((b) => (
                    <tr key={b.partnerLabId} className="hover:bg-gray-50">
                      <td className="py-2.5 px-3 font-medium text-gray-900">{b.partnerLabName}</td>
                      <td className="py-2.5 px-3 text-right">{b.samplesCount}</td>
                      <td className="py-2.5 px-3 text-right font-medium">₹{b.netRevenueAllocated.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right text-rose-600 font-medium">₹{b.partnerCost.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right text-emerald-600 font-bold">₹{b.grossProfit.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right font-bold">{b.marginPercent}%</td>
                      <td className="py-2.5 px-3 text-right text-[11px] text-gray-600">
                        ₹{b.invoicedAmount} / <span className="text-emerald-700 font-bold">₹{b.paidAmount}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Invoices & Reconciliation Section */}
          <div className="rounded-2xl border border-[#f1dfce] bg-white p-5 shadow-sm space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <Receipt className="h-4 w-4 text-[#008080]" />
                  Partner Invoices & Automated Reconciliation
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Reconciles partner-claimed invoice amounts against SCOPEX historical test snapshots. Discrepancies are flagged immediately.
                </p>
              </div>

              <button
                onClick={() => setShowCreateInvoiceModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#008080] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#006666] transition shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                Record Partner Invoice
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FFF8F2] border-b border-[#f1dfce] text-gray-600 font-bold text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Invoice Number</th>
                    <th className="py-2.5 px-3">Partner Lab</th>
                    <th className="py-2.5 px-3">Billing Period</th>
                    <th className="py-2.5 px-3 text-right">Claimed Amount</th>
                    <th className="py-2.5 px-3 text-right">Matched Cost</th>
                    <th className="py-2.5 px-3">Reconciliation Status</th>
                    <th className="py-2.5 px-3 text-right">Paid / Balance</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-gray-500">
                        No partner invoices recorded yet. Click &quot;Record Partner Invoice&quot; to verify billing reconciliation.
                      </td>
                    </tr>
                  ) : (
                    invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-gray-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-gray-900">{inv.invoiceNumber}</td>
                        <td className="py-2.5 px-3">{inv.partnerLabName}</td>
                        <td className="py-2.5 px-3 text-[11px] text-gray-500">
                          {inv.billingPeriodStart} to {inv.billingPeriodEnd}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-gray-900">₹{inv.claimedAmount}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-gray-700">₹{inv.systemMatchedCost}</td>
                        <td className="py-2.5 px-3">
                          {inv.hasDiscrepancy ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-bold text-rose-800">
                              <AlertTriangle className="h-3 w-3" />
                              Discrepancy: +₹{inv.discrepancyAmount}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                              <Check className="h-3 w-3" />
                              100% Reconciled
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right text-[11px]">
                          <span className="text-emerald-700 font-bold">₹{inv.paidAmount}</span> /{" "}
                          <span className="text-rose-600 font-bold">₹{inv.remainingAmount}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {inv.remainingAmount > 0 && (
                            <button
                              onClick={() => {
                                setShowPayInvoiceModal(inv);
                                setPaymentAmount(inv.remainingAmount);
                              }}
                              className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-700 transition"
                            >
                              Record Payment
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL 1: REGISTER PARTNER LAB (PHASE 1)                                */}
      {/* ======================================================================= */}
      {showRegisterLabModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[#FF6B00]" />
                Register New Partner Laboratory
              </h3>
              <button onClick={() => setShowRegisterLabModal(false)} className="text-gray-400 hover:text-black">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterLab} className="mt-4 space-y-4 text-xs">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label htmlFor={nameInputId} className="font-bold text-gray-700">Laboratory Name *</label>
                  <input
                    id={nameInputId}
                    type="text"
                    required
                    placeholder="e.g. Apex Central Pathology & Molecular Laboratory"
                    value={newLabData.name}
                    onChange={(e) => setNewLabData({ ...newLabData, name: e.target.value })}
                    className="w-full mt-1 rounded-xl border border-gray-200 p-2.5 text-xs focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>
                <div>
                  <label htmlFor={brandInputId} className="font-bold text-gray-700">Brand Name *</label>
                  <input
                    id={brandInputId}
                    type="text"
                    required
                    placeholder="e.g. Apex Diagnostics"
                    value={newLabData.brandName}
                    onChange={(e) => setNewLabData({ ...newLabData, brandName: e.target.value })}
                    className="w-full mt-1 rounded-xl border border-gray-200 p-2.5 text-xs focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label htmlFor={legalInputId} className="font-bold text-gray-700">Registered Legal Name (Optional)</label>
                  <input
                    id={legalInputId}
                    type="text"
                    placeholder="e.g. Apex Healthcare & Clinical Diagnostics Pvt Ltd"
                    value={newLabData.legalName}
                    onChange={(e) => setNewLabData({ ...newLabData, legalName: e.target.value })}
                    className="w-full mt-1 rounded-xl border border-gray-200 p-2.5 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor={regInputId} className="font-bold text-gray-700">Registration / Licence Number *</label>
                  <input
                    id={regInputId}
                    type="text"
                    required
                    placeholder="e.g. REG-MP-2019-8812"
                    value={newLabData.registrationNumber}
                    onChange={(e) => setNewLabData({ ...newLabData, registrationNumber: e.target.value })}
                    className="w-full mt-1 rounded-xl border border-gray-200 p-2.5 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3 space-y-3">
                <div className="flex items-center gap-3">
                  <label htmlFor={nablCheckId} className="flex items-center gap-2 font-bold text-gray-800 cursor-pointer">
                    <input
                      id={nablCheckId}
                      type="checkbox"
                      checked={newLabData.isNablAccredited}
                      onChange={(e) => setNewLabData({ ...newLabData, isNablAccredited: e.target.checked })}
                      className="h-4 w-4 rounded text-[#FF6B00]"
                    />
                    <span>NABL Accredited Laboratory</span>
                  </label>
                </div>

                {newLabData.isNablAccredited && (
                  <div>
                    <label htmlFor={nablNoId} className="font-bold text-gray-700">NABL Accreditation Number *</label>
                    <input
                      id={nablNoId}
                      type="text"
                      required
                      placeholder="e.g. NABL-MC-4011"
                      value={newLabData.nablNumber}
                      onChange={(e) => setNewLabData({ ...newLabData, nablNumber: e.target.value })}
                      className="w-full mt-1 rounded-xl border border-gray-200 p-2 text-xs bg-white focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label htmlFor={gstinId} className="font-bold text-gray-700">GSTIN (Optional)</label>
                  <input
                    id={gstinId}
                    type="text"
                    placeholder="e.g. 23AABCA1234F1Z8"
                    value={newLabData.gstin}
                    onChange={(e) => setNewLabData({ ...newLabData, gstin: e.target.value })}
                    className="w-full mt-1 rounded-xl border border-gray-200 p-2.5 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor={addressId} className="font-bold text-gray-700">Registered Address *</label>
                  <input
                    id={addressId}
                    type="text"
                    required
                    placeholder="e.g. 401-404, City Centre Tower, MG Road, Indore"
                    value={newLabData.registeredAddress}
                    onChange={(e) => setNewLabData({ ...newLabData, registeredAddress: e.target.value })}
                    className="w-full mt-1 rounded-xl border border-gray-200 p-2.5 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <label htmlFor={contactNameId} className="font-bold text-gray-700">Primary Contact Person *</label>
                  <input
                    id={contactNameId}
                    type="text"
                    required
                    placeholder="Dr. Arvind Mehta"
                    value={newLabData.primaryContactPerson}
                    onChange={(e) => setNewLabData({ ...newLabData, primaryContactPerson: e.target.value })}
                    className="w-full mt-1 rounded-xl border border-gray-200 p-2.5 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor={mobileId} className="font-bold text-gray-700">Mobile Number *</label>
                  <input
                    id={mobileId}
                    type="tel"
                    required
                    placeholder="9826011223"
                    value={newLabData.mobile}
                    onChange={(e) => setNewLabData({ ...newLabData, mobile: e.target.value })}
                    className="w-full mt-1 rounded-xl border border-gray-200 p-2.5 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor={emailId} className="font-bold text-gray-700">Email Address *</label>
                  <input
                    id={emailId}
                    type="email"
                    required
                    placeholder="ops@apexdiagnostics.in"
                    value={newLabData.email}
                    onChange={(e) => setNewLabData({ ...newLabData, email: e.target.value })}
                    className="w-full mt-1 rounded-xl border border-gray-200 p-2.5 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setShowRegisterLabModal(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#008080] px-5 py-2 text-xs font-bold text-white hover:bg-[#006666]"
                >
                  Register Partner Lab
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL 2: ADD OPERATIONAL LOCATION (PHASE 1)                             */}
      {/* ======================================================================= */}
      {showAddLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#FF6B00]" />
                Add Operational Location to Partner
              </h3>
              <button onClick={() => setShowAddLocationModal(null)} className="text-gray-400 hover:text-black">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={(e) => handleAddLocation(showAddLocationModal, e)} className="mt-4 space-y-3 text-xs">
              <div className="grid gap-3 grid-cols-2">
                <div>
                  <label className="font-bold text-gray-700">City *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bhopal"
                    value={newLocData.city}
                    onChange={(e) => setNewLocData({ ...newLocData, city: e.target.value })}
                    className="w-full mt-1 rounded-xl border border-gray-200 p-2.5 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700">6-Digit PIN Code *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="462001"
                    value={newLocData.pincode}
                    onChange={(e) => setNewLocData({ ...newLocData, pincode: e.target.value })}
                    className="w-full mt-1 rounded-xl border border-gray-200 p-2.5 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700">Full Operational Address *</label>
                <input
                  type="text"
                  required
                  placeholder="Plot 12, Arera Hills, Bhopal"
                  value={newLocData.fullAddress}
                  onChange={(e) => setNewLocData({ ...newLocData, fullAddress: e.target.value })}
                  className="w-full mt-1 rounded-xl border border-gray-200 p-2.5 text-xs focus:outline-none"
                />
              </div>

              <div className="grid gap-3 grid-cols-3">
                <div>
                  <label className="font-bold text-gray-700">Contact Person *</label>
                  <input
                    type="text"
                    required
                    placeholder="Dr. S. Verma"
                    value={newLocData.contactPerson}
                    onChange={(e) => setNewLocData({ ...newLocData, contactPerson: e.target.value })}
                    className="w-full mt-1 rounded-xl border border-gray-200 p-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700">Mobile *</label>
                  <input
                    type="tel"
                    required
                    placeholder="9826012345"
                    value={newLocData.mobile}
                    onChange={(e) => setNewLocData({ ...newLocData, mobile: e.target.value })}
                    className="w-full mt-1 rounded-xl border border-gray-200 p-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700">Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="bhopal@apex.in"
                    value={newLocData.email}
                    onChange={(e) => setNewLocData({ ...newLocData, email: e.target.value })}
                    className="w-full mt-1 rounded-xl border border-gray-200 p-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2 border-t pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddLocationModal(null)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gray-900 px-5 py-2 text-xs font-bold text-white hover:bg-black"
                >
                  Save Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL 3: MANUAL SINGLE TEST MAPPING (PHASE 2)                           */}
      {/* ======================================================================= */}
      {showManualMappingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Layers className="h-4 w-4 text-[#FF6B00]" />
                Add Test Mapping to Partner Test Master
              </h3>
              <button onClick={() => setShowManualMappingModal(false)} className="text-gray-400 hover:text-black">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateManualMapping} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700">Partner Laboratory *</label>
                <select
                  value={manualMapData.partnerLabId}
                  onChange={(e) => {
                    const selected = labs.find((l) => l.id === e.target.value);
                    setManualMapData({
                      ...manualMapData,
                      partnerLabId: e.target.value,
                      locationId: selected?.locations[0]?.id || ""
                    });
                  }}
                  className="w-full mt-1 rounded-xl border border-gray-200 p-2 text-xs focus:outline-none"
                >
                  {labs.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rate Applicability & City Selection */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-[#008080]" />
                    Rate Applicability Scope *
                  </span>
                  <span className="text-[10px] text-gray-500">
                    Priority: Single City → Selected Cities → Pan-India
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setManualMapData({ ...manualMapData, applicability: "pan_india" })}
                    className={`rounded-xl py-2 px-3 text-xs font-bold text-center border transition ${
                      manualMapData.applicability === "pan_india"
                        ? "bg-[#008080] text-white border-[#008080] shadow-xs"
                        : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    🇮🇳 Pan-India
                  </button>

                  <button
                    type="button"
                    onClick={() => setManualMapData({ ...manualMapData, applicability: "selected_cities" })}
                    className={`rounded-xl py-2 px-3 text-xs font-bold text-center border transition ${
                      manualMapData.applicability === "selected_cities"
                        ? "bg-[#008080] text-white border-[#008080] shadow-xs"
                        : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    🏢 Selected Cities
                  </button>

                  <button
                    type="button"
                    onClick={() => setManualMapData({ ...manualMapData, applicability: "single_city" })}
                    className={`rounded-xl py-2 px-3 text-xs font-bold text-center border transition ${
                      manualMapData.applicability === "single_city"
                        ? "bg-[#008080] text-white border-[#008080] shadow-xs"
                        : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    📍 Single City
                  </button>
                </div>

                {manualMapData.applicability === "pan_india" && (
                  <p className="text-[11px] text-blue-900 bg-white/80 p-2 rounded-lg border border-blue-100">
                    ✓ One common rate applies to <strong>all active locations</strong> of {labs.find((l) => l.id === manualMapData.partnerLabId)?.name || "this partner"} across India.
                  </p>
                )}

                {manualMapData.applicability === "selected_cities" && (
                  <div className="space-y-2 bg-white/80 p-2.5 rounded-lg border border-blue-100">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-gray-700 text-[11px]">
                        Select Applicable Cities ({manualMapData.applicableCities?.length || 0} selected):
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setManualMapData({
                            ...manualMapData,
                            applicableCities:
                              manualMapData.applicableCities?.length === ALL_OPERATIONAL_CITIES.length
                                ? []
                                : [...ALL_OPERATIONAL_CITIES]
                          })
                        }
                        className="text-[10px] text-[#008080] font-bold hover:underline"
                      >
                        {manualMapData.applicableCities?.length === ALL_OPERATIONAL_CITIES.length ? "Clear All" : "Select All"}
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 max-h-32 overflow-y-auto">
                      {ALL_OPERATIONAL_CITIES.map((c) => {
                        const isChecked = manualMapData.applicableCities?.includes(c);
                        return (
                          <label key={c} className="flex items-center gap-1.5 p-1 rounded hover:bg-gray-50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                const current = manualMapData.applicableCities || [];
                                const updated = e.target.checked
                                  ? [...current, c]
                                  : current.filter((x) => x !== c);
                                setManualMapData({ ...manualMapData, applicableCities: updated });
                              }}
                              className="rounded text-[#008080] focus:ring-0"
                            />
                            <span className="text-[11px] font-medium text-gray-800">{c}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {manualMapData.applicability === "single_city" && (
                  <div className="bg-white/80 p-2.5 rounded-lg border border-blue-100">
                    <label className="font-bold text-gray-700 text-[11px]">Select Target City *</label>
                    <select
                      value={manualMapData.city}
                      onChange={(e) => setManualMapData({ ...manualMapData, city: e.target.value })}
                      className="w-full mt-1 rounded-xl border border-gray-200 p-2 text-xs focus:outline-none"
                    >
                      {ALL_OPERATIONAL_CITIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="font-bold text-gray-700">Select SCOPEX Test from Master *</label>
                <select
                  value={manualMapData.scopexTestId}
                  onChange={(e) => {
                    const test = testsData.find((t) => t.id === e.target.value);
                    setManualMapData({
                      ...manualMapData,
                      scopexTestId: e.target.value,
                      partnerTestName: test ? `${test.name} (Partner Code)` : manualMapData.partnerTestName,
                      sampleType: test?.specimenType || "Blood",
                      tatHours: test?.tat || "12 Hours"
                    });
                  }}
                  className="w-full mt-1 rounded-xl border border-gray-200 p-2 text-xs focus:outline-none"
                >
                  {testsData.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (₹{t.price})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-3 grid-cols-2">
                <div>
                  <label className="font-bold text-gray-700">Partner Lab Test Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Automated Hemogram (CBC + ESR)"
                    value={manualMapData.partnerTestName}
                    onChange={(e) => setManualMapData({ ...manualMapData, partnerTestName: e.target.value })}
                    className="w-full mt-1 rounded-xl border border-gray-200 p-2 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-gray-700">Partner Test Code (Optional)</label>
                    <span className="text-[10px] text-emerald-700 font-semibold">Blank supported!</span>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. APX-HEM-01 (Leave blank if not provided)"
                    value={manualMapData.partnerTestCode}
                    onChange={(e) => setManualMapData({ ...manualMapData, partnerTestCode: e.target.value })}
                    className="w-full mt-1 rounded-xl border border-gray-200 p-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-3 grid-cols-3">
                <div>
                  <label className="font-bold text-gray-700">Partner Rate (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={manualMapData.partnerProcessingRate}
                    onChange={(e) => setManualMapData({ ...manualMapData, partnerProcessingRate: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 rounded-xl border border-gray-200 p-2 text-xs focus:outline-none font-bold text-emerald-700"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700">Sample Type</label>
                  <input
                    type="text"
                    value={manualMapData.sampleType}
                    onChange={(e) => setManualMapData({ ...manualMapData, sampleType: e.target.value })}
                    className="w-full mt-1 rounded-xl border border-gray-200 p-2 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700">Reporting TAT</label>
                  <input
                    type="text"
                    value={manualMapData.tatHours}
                    onChange={(e) => setManualMapData({ ...manualMapData, tatHours: e.target.value })}
                    className="w-full mt-1 rounded-xl border border-gray-200 p-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-3 grid-cols-2">
                <div>
                  <label className="font-bold text-gray-700">Effective From Date *</label>
                  <input
                    type="date"
                    required
                    value={manualMapData.effectiveFrom}
                    onChange={(e) => setManualMapData({ ...manualMapData, effectiveFrom: e.target.value })}
                    className="w-full mt-1 rounded-xl border border-gray-200 p-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700">Effective To Date (Optional)</label>
                  <input
                    type="date"
                    value={manualMapData.effectiveTo}
                    onChange={(e) => setManualMapData({ ...manualMapData, effectiveTo: e.target.value })}
                    className="w-full mt-1 rounded-xl border border-gray-200 p-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2 border-t pt-3">
                <button
                  type="button"
                  onClick={() => setShowManualMappingModal(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#008080] px-5 py-2 text-xs font-bold text-white hover:bg-[#006666]"
                >
                  Save Mapping
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL 4: BULK EXCEL / CSV UPLOAD & PREVIEW (PHASE 2)                    */}
      {/* ======================================================================= */}
      {showBulkUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Upload className="h-4 w-4 text-[#FF6B00]" />
                Bulk Partner Test Master Excel / CSV Upload
              </h3>
              <button
                onClick={() => {
                  setShowBulkUploadModal(false);
                  setBulkPreview(null);
                }}
                className="text-gray-400 hover:text-black"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="grid gap-3 grid-cols-2">
                <div>
                  <label className="font-bold text-gray-700">Target Partner Laboratory *</label>
                  <select
                    value={bulkPartnerLabId}
                    onChange={(e) => {
                      setBulkPartnerLabId(e.target.value);
                      const lab = labs.find((l) => l.id === e.target.value);
                      if (lab && lab.locations[0]) setBulkLocationId(lab.locations[0].id);
                    }}
                    className="w-full mt-1 rounded-xl border border-gray-200 p-2 text-xs focus:outline-none"
                  >
                    {labs.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700">Target City Location *</label>
                  <select
                    value={bulkLocationId}
                    onChange={(e) => setBulkLocationId(e.target.value)}
                    className="w-full mt-1 rounded-xl border border-gray-200 p-2 text-xs focus:outline-none"
                  >
                    {labs
                      .find((l) => l.id === bulkPartnerLabId)
                      ?.locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.city} ({loc.id})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {!bulkPreview ? (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-gray-700">Paste CSV Rows or Uploaded Template Content</label>
                      <button
                        type="button"
                        onClick={handleDownloadTemplate}
                        className="text-blue-600 font-bold hover:underline"
                      >
                        Download Template
                      </button>
                    </div>
                    <textarea
                      rows={6}
                      placeholder={`SCOPEX Test ID or Test Name,Partner Lab Test Name,Partner Lab Test Code,Test Category,Partner Processing Rate,Sample Type,Reporting TAT,Effective From Date,Effective To Date,Status\n"Complete Blood Count (CBC)","Automated Hemogram","APX-HEM-01","Hematology",140,"Whole Blood EDTA","6 Hours","2026-03-01","","Active"\n"Lipid Profile","Lipid Battery","","Biochemistry",220,"Serum","8 Hours","2026-03-01","","Active"`}
                      value={bulkCsvText}
                      onChange={(e) => setBulkCsvText(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 p-3 font-mono text-xs focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 border-t pt-3">
                    <button
                      type="button"
                      onClick={() => setShowBulkUploadModal(false)}
                      className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleValidateBulkUpload}
                      className="rounded-xl bg-[#008080] px-5 py-2 text-xs font-bold text-white hover:bg-[#006666]"
                    >
                      Validate & Show Preview
                    </button>
                  </div>
                </>
              ) : (
                /* Validation Preview View */
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-3 text-center">
                    <div className="rounded-xl bg-gray-50 p-2.5 border">
                      <div className="text-gray-500 text-[10px] uppercase font-bold">Total Rows</div>
                      <div className="text-lg font-bold text-gray-900">{bulkPreview.totalRows}</div>
                    </div>
                    <div className="rounded-xl bg-emerald-50 p-2.5 border border-emerald-200">
                      <div className="text-emerald-700 text-[10px] uppercase font-bold">Valid Rows</div>
                      <div className="text-lg font-bold text-emerald-800">{bulkPreview.validCount}</div>
                    </div>
                    <div className="rounded-xl bg-rose-50 p-2.5 border border-rose-200">
                      <div className="text-rose-700 text-[10px] uppercase font-bold">Invalid Rows</div>
                      <div className="text-lg font-bold text-rose-800">{bulkPreview.invalidCount}</div>
                    </div>
                    <div className="rounded-xl bg-amber-50 p-2.5 border border-amber-200">
                      <div className="text-amber-700 text-[10px] uppercase font-bold">Duplicates</div>
                      <div className="text-lg font-bold text-amber-800">{bulkPreview.duplicateCount}</div>
                    </div>
                  </div>

                  {bulkPreview.duplicateCount > 0 && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                      <label className="font-bold text-amber-900 block mb-1">Duplicate Mappings Strategy:</label>
                      <div className="flex flex-wrap gap-4 text-xs text-amber-900">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="strategy"
                            value="new_version"
                            checked={duplicateStrategy === "new_version"}
                            onChange={() => setDuplicateStrategy("new_version")}
                          />
                          <span>Create New Rate Version (Preserve Past Bookings)</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="strategy"
                            value="update"
                            checked={duplicateStrategy === "update"}
                            onChange={() => setDuplicateStrategy("update")}
                          />
                          <span>Update Existing Record</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="strategy"
                            value="skip"
                            checked={duplicateStrategy === "skip"}
                            onChange={() => setDuplicateStrategy("skip")}
                          />
                          <span>Skip Duplicate</span>
                        </label>
                      </div>
                    </div>
                  )}

                  <div className="max-h-56 overflow-y-auto rounded-xl border border-gray-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 border-b text-[10px] uppercase font-bold text-gray-500">
                        <tr>
                          <th className="p-2">Row</th>
                          <th className="p-2">SCOPEX Match</th>
                          <th className="p-2">Partner Test</th>
                          <th className="p-2">Rate</th>
                          <th className="p-2">Result</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {bulkPreview.results.map((r: any) => (
                          <tr key={r.rowNumber} className={r.isValid ? "bg-white" : "bg-rose-50/50"}>
                            <td className="p-2 font-mono">{r.rowNumber}</td>
                            <td className="p-2">
                              {r.normalized ? (
                                <span className="font-semibold text-emerald-800">{r.normalized.scopexTestName}</span>
                              ) : (
                                <span className="text-rose-600 font-mono">{r.input.scopexTestIdentifier}</span>
                              )}
                            </td>
                            <td className="p-2">{r.input.partnerTestName}</td>
                            <td className="p-2 font-bold">₹{r.input.partnerProcessingRate}</td>
                            <td className="p-2">
                              {r.isValid ? (
                                <span className="text-emerald-700 font-bold">Valid {r.isDuplicate ? "(Dup)" : ""}</span>
                              ) : (
                                <div className="text-rose-600 text-[10px] space-y-0.5">
                                  {r.errors.map((e: string, idx: number) => (
                                    <div key={idx}>• {e}</div>
                                  ))}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end gap-2 border-t pt-3">
                    <button
                      type="button"
                      onClick={() => setBulkPreview(null)}
                      className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-700"
                    >
                      Back to Edit
                    </button>
                    <button
                      type="button"
                      disabled={bulkPreview.validCount === 0}
                      onClick={handleCommitBulkUpload}
                      className="rounded-xl bg-[#008080] px-5 py-2 text-xs font-bold text-white hover:bg-[#006666] disabled:opacity-50"
                    >
                      Confirm & Import {bulkPreview.validCount} Valid Records
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL 5: ASSIGN BOOKING TO PARTNER LAB (POST-BOOKING SELECTION)         */}
      {/* ======================================================================= */}
      {showAssignSampleModal && (() => {
        const selectedBooking = confirmedBookings.find((b) => b.id === assignBookingId);
        const patientCity = (selectedBooking as any)?.address_city || (selectedBooking as any)?.collection_address?.city || (selectedBooking as any)?.city || "Indore";
        const patientName = (selectedBooking as any)?.customer_name || (selectedBooking as any)?.patient_name || "Patient";
        const bookingTests: Array<{ id: string; name: string }> = [];
        const patientsList = ((selectedBooking as any)?.booking_patients as any[]) || [];
        for (const p of patientsList) {
          for (const item of p.items || []) {
            if (item.kind === "test" && item.id) {
              bookingTests.push({ id: item.id, name: item.name || item.id });
            } else if (item.kind === "package" && item.testIds) {
              bookingTests.push(...item.testIds.map((tid: string) => ({ id: tid, name: tid })));
            }
          }
        }
        if (bookingTests.length === 0) {
          bookingTests.push({ id: "cbc", name: "Complete Blood Count (CBC)" });
        }

        const activePartnerLocations =
          labs
            .find((lb) => lb.id === assignPartnerLabId)
            ?.locations.filter((loc) => loc.status === "active") || [];

        const isConfirmDisabled =
          !assignBookingId ||
          !assignPartnerLabId ||
          !assignLocationId ||
          (assignPreviewData && !assignPreviewData.allMapped && !assignOverrideException);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-[#FF6B00]" />
                    Assign Confirmed Booking to Partner Laboratory
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Post-booking allocation: System validates partner tests and resolves rate priority (Single City → Selected Cities → Pan-India).
                  </p>
                </div>
                <button
                  onClick={() => setShowAssignSampleModal(false)}
                  className="rounded-lg p-1 text-gray-400 hover:text-black"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleAssignSample} className="mt-4 space-y-4 text-xs">
                {/* 1. Booking Selection */}
                <div>
                  <label className="font-bold text-gray-700 block">Select Confirmed Patient Booking *</label>
                  <select
                    value={assignBookingId}
                    onChange={(e) => {
                      setAssignBookingId(e.target.value);
                      if (assignPartnerLabId && assignLocationId) {
                        void loadAssignRatePreview(assignPartnerLabId, assignLocationId, e.target.value);
                      }
                    }}
                    required
                    className="w-full mt-1 rounded-xl border border-gray-200 p-2.5 text-xs font-semibold focus:border-[#FF6B00] focus:outline-none"
                  >
                    <option value="">-- Choose confirmed patient booking --</option>
                    {confirmedBookings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.booking_number || b.id} - {b.customer_name || "Patient"} ({b.booking_status}) - City: {(b as any).address_city || (b as any).city || "Indore"}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Patient Booking Details Badge */}
                {selectedBooking && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900">Patient: {patientName}</span>
                      <span className="font-mono text-[11px] font-semibold text-gray-600">
                        City: <strong className="text-gray-900">{patientCity}</strong>
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-700">
                      Required Tests ({bookingTests.length}):{" "}
                      <span className="font-semibold">{bookingTests.map((t) => t.name).join(", ")}</span>
                    </div>
                  </div>
                )}

                {/* 2. Partner Lab & Partner-Specific City Selection */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="font-bold text-gray-700 block">Partner Laboratory *</label>
                    <select
                      value={assignPartnerLabId}
                      onChange={(e) => {
                        const newLabId = e.target.value;
                        setAssignPartnerLabId(newLabId);
                        const selectedLab = labs.find((lb) => lb.id === newLabId);
                        const firstActiveLoc = selectedLab?.locations.find((loc) => loc.status === "active");
                        const newLocId = firstActiveLoc?.id || "";
                        setAssignLocationId(newLocId);
                        if (assignBookingId && newLocId) {
                          void loadAssignRatePreview(newLabId, newLocId, assignBookingId);
                        }
                      }}
                      required
                      className="w-full mt-1 rounded-xl border border-gray-200 p-2.5 text-xs font-bold text-gray-800 focus:border-[#FF6B00] focus:outline-none"
                    >
                      {labs.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name} ({l.locations.filter((loc) => loc.status === "active").length} active cities)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-gray-700 block">
                        Partner City / Location *
                      </label>
                      <span className="text-[10px] text-emerald-700 font-semibold">Only active locations</span>
                    </div>
                    <select
                      value={assignLocationId}
                      onChange={(e) => {
                        const newLocId = e.target.value;
                        setAssignLocationId(newLocId);
                        if (assignBookingId && assignPartnerLabId) {
                          void loadAssignRatePreview(assignPartnerLabId, newLocId, assignBookingId);
                        }
                      }}
                      required
                      className="w-full mt-1 rounded-xl border border-gray-200 p-2.5 text-xs font-semibold focus:border-[#FF6B00] focus:outline-none"
                    >
                      {activePartnerLocations.length === 0 ? (
                        <option value="">No active locations for this partner</option>
                      ) : (
                        activePartnerLocations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.city} ({loc.id}) - {loc.pincode}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                {/* 3. Barcode Entry */}
                <div>
                  <label className="font-bold text-gray-700 block">
                    SCOPEX Vacutainer Sample ID / Barcode
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SMP-902100 (Leave blank to auto-generate)"
                    value={assignSampleBarcode}
                    onChange={(e) => setAssignSampleBarcode(e.target.value)}
                    className="w-full mt-1 rounded-xl border border-gray-200 p-2 text-xs font-mono focus:border-[#FF6B00] focus:outline-none"
                  />
                </div>

                {/* 4. Live Rate Validation & Test Mapping Table */}
                <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900 flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-[#008080]" />
                      Partner Rate Hierarchy &amp; Test Mapping Preview
                    </span>
                    {assignPreviewLoading && (
                      <span className="text-[10px] text-gray-500 flex items-center gap-1">
                        <RefreshCw className="h-3 w-3 animate-spin text-[#FF6B00]" />
                        Checking rates...
                      </span>
                    )}
                  </div>

                  {assignPreviewData && (
                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-100/70 border-b text-[10px] uppercase font-bold text-gray-600">
                          <tr>
                            <th className="p-2">Required Test</th>
                            <th className="p-2">Partner Mapping</th>
                            <th className="p-2">Rate Scope Applied</th>
                            <th className="p-2 text-right">Processing Rate</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {assignPreviewData.tests.map((t) => (
                            <tr key={t.testId} className={t.isMapped ? "bg-white" : "bg-rose-50/60"}>
                              <td className="p-2 font-bold text-gray-900">{t.testName}</td>
                              <td className="p-2">
                                {t.isMapped ? (
                                  <span className="text-gray-800">{t.partnerTestName || t.testName}</span>
                                ) : (
                                  <span className="text-rose-600 font-bold text-[10px]">
                                    ⚠️ Unmapped / Missing Rate
                                  </span>
                                )}
                              </td>
                              <td className="p-2">
                                {t.appliedScope === "single_city" ? (
                                  <span className="rounded bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                                    Single City ({t.appliedScopeDescription || "City"})
                                  </span>
                                ) : t.appliedScope === "selected_cities" ? (
                                  <span className="rounded bg-purple-50 border border-purple-200 px-1.5 py-0.5 text-[10px] font-bold text-purple-800">
                                    Selected Cities
                                  </span>
                                ) : t.appliedScope === "pan_india" ? (
                                  <span className="rounded bg-blue-50 border border-blue-200 px-1.5 py-0.5 text-[10px] font-bold text-blue-800">
                                    Pan-India
                                  </span>
                                ) : (
                                  <span className="text-rose-600 text-[10px] font-mono">None</span>
                                )}
                              </td>
                              <td className="p-2 text-right font-bold text-emerald-700">
                                {t.rate !== undefined ? `₹${t.rate}` : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50 border-t font-bold">
                          <tr>
                            <td colSpan={3} className="p-2 text-gray-700">Total Partner Processing Cost:</td>
                            <td className="p-2 text-right text-emerald-800 text-sm">
                              ₹{assignPreviewData.totalCost}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}

                  {/* Warning banner if mapping is missing */}
                  {assignPreviewData && !assignPreviewData.allMapped && (
                    <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 space-y-2 text-rose-900">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Missing Partner Mapping or Rate</p>
                          <p className="text-[11px] text-rose-700">
                            Automatic assignment is blocked because one or more tests have no active rate for this partner location.
                          </p>
                        </div>
                      </div>
                      <label className="flex items-center gap-2 pt-1 border-t border-rose-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={assignOverrideException}
                          onChange={(e) => setAssignOverrideException(e.target.checked)}
                          className="rounded text-[#FF6B00] focus:ring-0"
                        />
                        <span className="text-[11px] font-bold text-rose-800">
                          Authorize explicit Admin exception override
                        </span>
                      </label>
                      {assignOverrideException && (
                        <input
                          type="text"
                          placeholder="Mandatory exception remarks for audit log..."
                          value={assignOverrideRemarks}
                          onChange={(e) => setAssignOverrideRemarks(e.target.value)}
                          className="w-full rounded-lg border border-rose-300 bg-white p-2 text-xs text-gray-800 focus:outline-none"
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* 5. Pre-Confirmation Summary Card */}
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3.5 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-900 text-xs">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Assignment Confirmation Summary</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 text-gray-700">
                    <div>
                      <span className="text-gray-500">Booking ID:</span>{" "}
                      <strong className="text-gray-900">{selectedBooking?.booking_number || assignBookingId || "—"}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500">Patient:</span>{" "}
                      <strong className="text-gray-900">{patientName} ({patientCity})</strong>
                    </div>
                    <div>
                      <span className="text-gray-500">Partner Lab:</span>{" "}
                      <strong className="text-gray-900">
                        {labs.find((l) => l.id === assignPartnerLabId)?.name || "—"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-gray-500">Partner Location:</span>{" "}
                      <strong className="text-gray-900">
                        {activePartnerLocations.find((l) => l.id === assignLocationId)?.city || "—"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-gray-500">Processing Rate:</span>{" "}
                      <strong className="text-emerald-700">₹{assignPreviewData?.totalCost ?? 0}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500">Assignment Time:</span>{" "}
                      <strong className="text-gray-900">{new Date().toLocaleTimeString()}</strong>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex justify-end gap-2 border-t pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAssignSampleModal(false)}
                    className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isConfirmDisabled}
                    className="rounded-xl bg-[#008080] px-5 py-2 text-xs font-bold text-white hover:bg-[#006666] disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    Confirm Partner Lab Assignment
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* ======================================================================= */}
      {/* MODAL 5B: REASSIGN SAMPLE TO ANOTHER PARTNER LAB                         */}
      {/* ======================================================================= */}
      {showReassignModal && (() => {
        const activePartnerLocations =
          labs
            .find((lb) => lb.id === reassignPartnerLabId)
            ?.locations.filter((loc) => loc.status === "active") || [];

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-amber-600" />
                    Reassign Sample to Another Partner Laboratory
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Transfers processing to a new partner lab, validates rates, and logs audit trail.
                  </p>
                </div>
                <button
                  onClick={() => setShowReassignModal(null)}
                  className="rounded-lg p-1 text-gray-400 hover:text-black"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleReassignSample} className="mt-4 space-y-3.5 text-xs">
                {/* Current assignment snapshot */}
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs space-y-1">
                  <div className="font-bold text-gray-700 text-[11px] uppercase tracking-wider">
                    Current Assignment
                  </div>
                  <div className="flex items-center justify-between text-gray-800">
                    <span>
                      Sample: <strong className="font-mono">{showReassignModal.scopexSampleId}</strong> ({showReassignModal.patientName})
                    </span>
                    <span className="font-bold text-emerald-700">₹{showReassignModal.totalProcessingCost}</span>
                  </div>
                  <div className="text-[11px] text-gray-600">
                    Partner: <strong>{showReassignModal.partnerLabName}</strong> ({showReassignModal.locationCity})
                  </div>
                </div>

                {/* Reason for change (Mandatory) */}
                <div>
                  <label className="font-bold text-gray-700 block">
                    Reason for Lab Reassignment * <span className="text-rose-600 font-semibold">(Mandatory for audit)</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="e.g. Analyzer breakdown at initial partner, specialized reflex testing required, patient travel..."
                    value={reassignReason}
                    onChange={(e) => setReassignReason(e.target.value)}
                    className="w-full mt-1 rounded-xl border border-gray-200 p-2.5 text-xs focus:border-[#FF6B00] focus:outline-none"
                  />
                </div>

                {/* New Partner & Location */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="font-bold text-gray-700 block">New Partner Laboratory *</label>
                    <select
                      value={reassignPartnerLabId}
                      onChange={(e) => {
                        const newLabId = e.target.value;
                        setReassignPartnerLabId(newLabId);
                        const selLab = labs.find((lb) => lb.id === newLabId);
                        const firstLoc = selLab?.locations.find((l) => l.status === "active");
                        const newLocId = firstLoc?.id || "";
                        setReassignLocationId(newLocId);
                        const testIds = showReassignModal.testSnapshots?.map((t: any) => t.testId) || ["cbc"];
                        if (newLocId) void loadReassignRatePreview(newLabId, newLocId, testIds);
                      }}
                      required
                      className="w-full mt-1 rounded-xl border border-gray-200 p-2 text-xs font-bold text-gray-800 focus:outline-none"
                    >
                      {labs.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 block">New Partner City / Location *</label>
                    <select
                      value={reassignLocationId}
                      onChange={(e) => {
                        const newLocId = e.target.value;
                        setReassignLocationId(newLocId);
                        const testIds = showReassignModal.testSnapshots?.map((t: any) => t.testId) || ["cbc"];
                        if (reassignPartnerLabId) void loadReassignRatePreview(reassignPartnerLabId, newLocId, testIds);
                      }}
                      required
                      className="w-full mt-1 rounded-xl border border-gray-200 p-2 text-xs focus:outline-none"
                    >
                      {activePartnerLocations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.city} ({loc.id})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Rate preview for new assignment */}
                {reassignPreviewLoading && (
                  <div className="p-3 text-center text-xs text-gray-500">Checking new partner rates...</div>
                )}
                {reassignPreviewData && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-xs text-gray-900">
                      <span>Rate Comparison</span>
                      <span className="text-emerald-700">
                        Old: ₹{showReassignModal.totalProcessingCost} → New: ₹{reassignPreviewData.totalCost}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-600">
                      {reassignPreviewData.allMapped ? (
                        <span className="text-emerald-700 font-semibold">✓ All tests mapped with valid partner rates.</span>
                      ) : (
                        <span className="text-rose-600 font-bold">⚠️ Warning: Some tests have no rate configured at this location.</span>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-5 flex justify-end gap-2 border-t pt-3">
                  <button
                    type="button"
                    onClick={() => setShowReassignModal(null)}
                    className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!reassignReason.trim()}
                    className="rounded-xl bg-amber-600 px-5 py-2 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-50"
                  >
                    Confirm Lab Reassignment
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* ======================================================================= */}
      {/* MODAL 6: VERIFY HANDOVER & BARCODE PHOTO (PHASE 3 & 4)                  */}
      {/* ======================================================================= */}
      {showHandoverVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Camera className="h-4 w-4 text-[#FF6B00]" />
                Verify Phlebotomist Sample Handover
              </h3>
              <button onClick={() => setShowHandoverVerifyModal(null)} className="text-gray-400 hover:text-black">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="rounded-xl bg-gray-50 p-3 border">
                <div>Booking: <span className="font-bold text-gray-900">{showHandoverVerifyModal.bookingNumber}</span></div>
                <div>Patient: <span className="font-bold text-gray-900">{showHandoverVerifyModal.patientName}</span></div>
                <div>Partner Lab: <span className="font-bold text-gray-900">{showHandoverVerifyModal.partnerLabName}</span></div>
                <div>SCOPEX Barcode: <span className="font-mono font-bold text-blue-700">{showHandoverVerifyModal.scopexSampleId}</span></div>
              </div>

              <div>
                <label className="font-bold text-gray-700">Partner Lab Accession Barcode (Verify / Correct)</label>
                <input
                  type="text"
                  defaultValue={showHandoverVerifyModal.partnerBarcode || `APX-ACC-${showHandoverVerifyModal.scopexSampleId.slice(-4)}`}
                  id="corrected-partner-barcode"
                  className="w-full mt-1 rounded-xl border border-gray-200 p-2 text-xs font-mono font-bold focus:outline-none"
                />
              </div>

              {showHandoverVerifyModal.barcodePhotoUrl && (
                <div>
                  <label className="font-bold text-gray-700">Labeled Tube Photograph</label>
                  <div className="mt-1 rounded-xl border border-gray-200 overflow-hidden bg-gray-100 p-2 flex justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={showHandoverVerifyModal.barcodePhotoUrl}
                      alt="Labeled vacutainer"
                      className="max-h-48 object-contain rounded-lg"
                    />
                  </div>
                </div>
              )}

              <div className="mt-5 flex justify-end gap-2 border-t pt-3">
                <button
                  type="button"
                  onClick={() => setShowHandoverVerifyModal(null)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const input = document.getElementById("corrected-partner-barcode") as HTMLInputElement;
                    handleVerifyHandover(showHandoverVerifyModal.id, input?.value);
                  }}
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700"
                >
                  Approve & Verify Handover
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL 7: LIFECYCLE AUDIT TRAIL (PHASE 4)                                */}
      {/* ======================================================================= */}
      {showStatusHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#FF6B00]" />
                Sample Lifecycle Audit Trail
              </h3>
              <button onClick={() => setShowStatusHistoryModal(null)} className="text-gray-400 hover:text-black">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {showStatusHistoryModal.statusHistory.map((h, i) => (
                <div key={h.id || i} className="flex items-start gap-3 text-xs border-l-2 border-[#FF6B00] pl-3 py-1">
                  <div>
                    <div className="font-bold text-gray-900">
                      {h.previousStatus} → <span className="text-[#FF6B00]">{h.newStatus}</span>
                    </div>
                    <div className="text-[11px] text-gray-500">
                      By {h.updatedBy} • {new Date(h.updatedAt).toLocaleString()}
                    </div>
                    {h.remarks && <p className="text-gray-600 mt-1 italic">&quot;{h.remarks}&quot;</p>}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 flex justify-end border-t pt-3">
              <button
                type="button"
                onClick={() => setShowStatusHistoryModal(null)}
                className="rounded-xl bg-gray-900 px-4 py-2 text-xs font-bold text-white hover:bg-black"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL 8: UPLOAD PARTNER REPORT (PHASE 5)                                */}
      {/* ======================================================================= */}
      {showUploadReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Upload className="h-4 w-4 text-[#008080]" />
                Upload Partner Lab Diagnostic Report
              </h3>
              <button onClick={() => setShowUploadReportModal(false)} className="text-gray-400 hover:text-black">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUploadReport} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700">Select Booking / Sample *</label>
                <select
                  value={reportBookingId}
                  onChange={(e) => setReportBookingId(e.target.value)}
                  required
                  className="w-full mt-1 rounded-xl border border-gray-200 p-2 text-xs focus:outline-none"
                >
                  <option value="">-- Choose Booking --</option>
                  {samples.map((s) => (
                    <option key={s.bookingId} value={s.bookingId}>
                      {s.bookingNumber} - {s.patientName} ({s.scopexSampleId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-700">Report Scope</label>
                <select
                  value={reportType}
                  onChange={(e: any) => setReportType(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-gray-200 p-2 text-xs focus:outline-none"
                >
                  <option value="combined">Combined Comprehensive Report</option>
                  <option value="individual">Individual Specialized Test Report</option>
                  <option value="revised">Revised / Amended Report</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-700">Report PDF Document URL *</label>
                <input
                  type="text"
                  required
                  value={reportFileUrl}
                  onChange={(e) => setReportFileUrl(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-gray-200 p-2 text-xs font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700">File Name *</label>
                <input
                  type="text"
                  required
                  value={reportFileName}
                  onChange={(e) => setReportFileName(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-gray-200 p-2 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700">Clinical / Verification Remarks (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Report reviewed by pathologist, values within critical limits..."
                  value={reportRemarks}
                  onChange={(e) => setReportRemarks(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-gray-200 p-2 text-xs focus:outline-none"
                />
              </div>

              <div className="mt-5 flex justify-end gap-2 border-t pt-3">
                <button
                  type="button"
                  onClick={() => setShowUploadReportModal(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#008080] px-5 py-2 text-xs font-bold text-white hover:bg-[#006666]"
                >
                  Upload & Register Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL 9: RECORD PARTNER INVOICE (PHASE 7)                              */}
      {/* ======================================================================= */}
      {showCreateInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Receipt className="h-4 w-4 text-[#008080]" />
                Record Partner Laboratory Invoice
              </h3>
              <button onClick={() => setShowCreateInvoiceModal(false)} className="text-gray-400 hover:text-black">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="mt-4 space-y-3 text-xs">
              <div className="grid gap-3 grid-cols-2">
                <div>
                  <label className="font-bold text-gray-700">Invoice Number *</label>
                  <input
                    type="text"
                    required
                    value={newInvoiceData.invoiceNumber}
                    onChange={(e) => setNewInvoiceData({ ...newInvoiceData, invoiceNumber: e.target.value })}
                    className="w-full mt-1 rounded-xl border border-gray-200 p-2 text-xs font-mono font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700">Partner Laboratory *</label>
                  <select
                    value={newInvoiceData.partnerLabId}
                    onChange={(e) => setNewInvoiceData({ ...newInvoiceData, partnerLabId: e.target.value })}
                    required
                    className="w-full mt-1 rounded-xl border border-gray-200 p-2 text-xs focus:outline-none"
                  >
                    {labs.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-3 grid-cols-2">
                <div>
                  <label className="font-bold text-gray-700">Billing Period Start *</label>
                  <input
                    type="date"
                    required
                    value={newInvoiceData.billingPeriodStart}
                    onChange={(e) => setNewInvoiceData({ ...newInvoiceData, billingPeriodStart: e.target.value })}
                    className="w-full mt-1 rounded-xl border border-gray-200 p-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700">Billing Period End *</label>
                  <input
                    type="date"
                    required
                    value={newInvoiceData.billingPeriodEnd}
                    onChange={(e) => setNewInvoiceData({ ...newInvoiceData, billingPeriodEnd: e.target.value })}
                    className="w-full mt-1 rounded-xl border border-gray-200 p-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-3 grid-cols-2">
                <div>
                  <label className="font-bold text-gray-700">Claimed Amount (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newInvoiceData.claimedAmount}
                    onChange={(e) => setNewInvoiceData({ ...newInvoiceData, claimedAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 rounded-xl border border-gray-200 p-2 text-xs font-bold text-rose-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700">Payment Due Date *</label>
                  <input
                    type="date"
                    required
                    value={newInvoiceData.dueDate}
                    onChange={(e) => setNewInvoiceData({ ...newInvoiceData, dueDate: e.target.value })}
                    className="w-full mt-1 rounded-xl border border-gray-200 p-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700">Notes / Remarks</label>
                <input
                  type="text"
                  value={newInvoiceData.notes}
                  onChange={(e) => setNewInvoiceData({ ...newInvoiceData, notes: e.target.value })}
                  className="w-full mt-1 rounded-xl border border-gray-200 p-2 text-xs focus:outline-none"
                />
              </div>

              <div className="mt-5 flex justify-end gap-2 border-t pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateInvoiceModal(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#008080] px-5 py-2 text-xs font-bold text-white hover:bg-[#006666]"
                >
                  Reconcile & Record Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL 10: RECORD PARTIAL / FULL PAYMENT (PHASE 8)                       */}
      {/* ======================================================================= */}
      {showPayInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                Record Partner Lab Payment
              </h3>
              <button onClick={() => setShowPayInvoiceModal(null)} className="text-gray-400 hover:text-black">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="mt-4 space-y-3 text-xs">
              <div className="rounded-xl bg-gray-50 p-3 border">
                <div>Invoice: <span className="font-mono font-bold text-gray-900">{showPayInvoiceModal.invoiceNumber}</span></div>
                <div>Partner: <span className="font-bold text-gray-900">{showPayInvoiceModal.partnerLabName}</span></div>
                <div>Remaining Balance: <span className="font-bold text-rose-600">₹{showPayInvoiceModal.remainingAmount}</span></div>
              </div>

              <div>
                <label className="font-bold text-gray-700">Payment Amount (₹) *</label>
                <input
                  type="number"
                  min="1"
                  max={showPayInvoiceModal.remainingAmount}
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 rounded-xl border border-gray-200 p-2 text-xs font-bold text-emerald-700 focus:outline-none"
                />
              </div>

              <div className="grid gap-3 grid-cols-2">
                <div>
                  <label className="font-bold text-gray-700">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e: any) => setPaymentMode(e.target.value)}
                    className="w-full mt-1 rounded-xl border border-gray-200 p-2 text-xs focus:outline-none"
                  >
                    <option value="NEFT">NEFT Bank Transfer</option>
                    <option value="RTGS">RTGS</option>
                    <option value="UPI">Corporate UPI</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700">Bank UTR / Ref Number *</label>
                  <input
                    type="text"
                    required
                    value={paymentRefNumber}
                    onChange={(e) => setPaymentRefNumber(e.target.value)}
                    className="w-full mt-1 rounded-xl border border-gray-200 p-2 text-xs font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700">Payment Notes (Optional)</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Cleared via HDFC Current Account"
                  className="w-full mt-1 rounded-xl border border-gray-200 p-2 text-xs focus:outline-none"
                />
              </div>

              <div className="mt-5 flex justify-end gap-2 border-t pt-3">
                <button
                  type="button"
                  onClick={() => setShowPayInvoiceModal(null)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
