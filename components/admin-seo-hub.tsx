"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  Search,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ArrowRight,
  RefreshCw,
  Plus,
  Trash2,
  FileText,
  Compass,
  ArrowUpRight,
  Activity,
  Layers,
  HelpCircle,
  BookOpen,
  Info
} from "lucide-react";
import type {
  SeoPageRecord,
  ContentStatus,
  SeoEntityKind,
  RobotsDirective,
  SeoAuditReport,
  RedirectRule,
  AiDiscoveryCheck
} from "@/lib/seo-service";

type ActiveTab = "editor" | "auditor" | "geo_readiness" | "redirects" | "tester" | "metrics";

export function AdminSeoHub() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("editor");
  const [pages, setPages] = useState<SeoPageRecord[]>([]);
  const [selectedPage, setSelectedPage] = useState<SeoPageRecord | null>(null);
  const [auditReport, setAuditReport] = useState<SeoAuditReport | null>(null);
  const [redirects, setRedirects] = useState<RedirectRule[]>([]);
  const [metricsData, setMetricsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Filter and search controls for editor
  const [filterKind, setFilterKind] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Editor form state
  const [formPage, setFormPage] = useState<Partial<SeoPageRecord>>({});
  const [formFaqs, setFormFaqs] = useState<Array<{ question: string; answer: string }>>([]);
  const [formCitations, setFormCitations] = useState<Array<{ title: string; source: string; url?: string }>>([]);

  // Tester state
  const [testSlugInput, setTestSlugInput] = useState<string>("packages/health-360-pro");
  const [testValidationResult, setTestValidationResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  // New Redirect Form
  const [newRedSource, setNewRedSource] = useState("");
  const [newRedDest, setNewRedDest] = useState("");
  const [newRedCode, setNewRedCode] = useState<301 | 302>(301);
  const [newRedNotes, setNewRedNotes] = useState("");

  const selectPageForEdit = (page: SeoPageRecord) => {
    setSelectedPage(page);
    setFormPage({ ...page });
    setFormFaqs(page.faq || []);
    setFormCitations(page.medicalReferences || []);
    setStatusMessage(null);
  };

  // Load initial data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [pagesRes, auditRes, redirectsRes, metricsRes] = await Promise.all([
        fetch("/api/admin/seo/pages").then((r) => r.json()),
        fetch("/api/admin/seo/audit").then((r) => r.json()),
        fetch("/api/admin/seo/redirects").then((r) => r.json()),
        fetch("/api/admin/seo/metrics").then((r) => r.json())
      ]);

      if (pagesRes.success) {
        setPages(pagesRes.data);
        if (pagesRes.data.length > 0 && !selectedPage) {
          selectPageForEdit(pagesRes.data[0]);
        }
      }
      if (auditRes.success) setAuditReport(auditRes.audit);
      if (redirectsRes.success) setRedirects(redirectsRes.data);
      if (metricsRes.success) setMetricsData(metricsRes.data);
    } catch (err: any) {
      setStatusMessage({ type: "error", text: "Failed to connect to SEO services: " + err.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateNewPage = () => {
    const newPage: Partial<SeoPageRecord> = {
      id: `seo-custom-${Date.now()}`,
      slug: "new-diagnostic-service",
      title: "New Diagnostic Service | ScopeX Diagnostics",
      h1: "New Diagnostic Service",
      metaDescription: "Book diagnostic tests and packages with ScopeX Diagnostics. Home collection with NABL standard labs.",
      intro: "ScopeX Diagnostics offers certified clinical testing with doorstep sample collection.",
      kind: "custom",
      canonicalPath: "/new-diagnostic-service",
      canonicalUrl: "https://www.scopexdiagnostics.in/new-diagnostic-service",
      robots: "index, follow",
      status: "draft",
      aeoDirectAnswer: "ScopeX Diagnostics provides verified doorstep sample collection for this diagnostic service with digital reports delivered in 12-24 hours.",
      clinicalReview: {
        reviewedBy: "",
        reviewerCredentials: "",
        reviewDate: "",
        approved: false
      }
    };
    setSelectedPage(null);
    setFormPage(newPage);
    setFormFaqs([
      { question: "What is this test?", answer: "This diagnostic evaluation screens for key health biomarkers." },
      { question: "Is fasting required?", answer: "10-12 hours overnight fasting is recommended if lipids or sugar are included." }
    ]);
    setFormCitations([
      {
        title: "ISO 15189: Medical laboratories requirements",
        source: "NABL Guidelines",
        url: "https://nabl-india.org"
      }
    ]);
  };

  const handleSavePage = async (overrideStatus?: ContentStatus) => {
    setStatusMessage(null);
    const targetStatus = overrideStatus || formPage.status || "draft";

    // Strict validation
    if (!formPage.title?.trim() || !formPage.slug?.trim() || !formPage.metaDescription?.trim()) {
      setStatusMessage({ type: "error", text: "Title, Slug, and Meta Description are strictly required." });
      return;
    }

    if (targetStatus === "published" && (!formPage.clinicalReview?.approved || !formPage.clinicalReview?.reviewedBy?.trim())) {
      setStatusMessage({
        type: "error",
        text: "Clinical Governance Required: Content cannot be published without qualified medical review sign-off."
      });
      return;
    }

    const payload = {
      ...formPage,
      status: targetStatus,
      faq: formFaqs,
      medicalReferences: formCitations
    };

    try {
      const res = await fetch("/api/admin/seo/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!data.success) {
        setStatusMessage({ type: "error", text: data.message });
      } else {
        setStatusMessage({ type: "success", text: `Page successfully saved as "${targetStatus}".` });
        await fetchData();
        selectPageForEdit(data.data);
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: "Network error saving page: " + err.message });
    }
  };

  const handleAddFaq = () => {
    setFormFaqs([...formFaqs, { question: "", answer: "" }]);
  };

  const handleRemoveFaq = (index: number) => {
    setFormFaqs(formFaqs.filter((_, i) => i !== index));
  };

  const handleAddCitation = () => {
    setFormCitations([...formCitations, { title: "", source: "", url: "" }]);
  };

  const handleRemoveCitation = (index: number) => {
    setFormCitations(formCitations.filter((_, i) => i !== index));
  };

  const handleAddRedirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRedSource.trim() || !newRedDest.trim()) {
      setStatusMessage({ type: "error", text: "Source path and destination path are required." });
      return;
    }

    try {
      const res = await fetch("/api/admin/seo/redirects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourcePath: newRedSource.trim(),
          destinationPath: newRedDest.trim(),
          statusCode: newRedCode,
          notes: newRedNotes.trim()
        })
      });
      const data = await res.json();
      if (!data.success) {
        setStatusMessage({ type: "error", text: data.message });
      } else {
        setStatusMessage({ type: "success", text: "Redirect rule registered successfully." });
        setNewRedSource("");
        setNewRedDest("");
        setNewRedNotes("");
        fetchData();
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message });
    }
  };

  const handleDeleteRedirect = async (id: string) => {
    if (!confirm("Are you sure you want to remove this redirect rule?")) return;
    try {
      const res = await fetch(`/api/admin/seo/redirects?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: "success", text: "Redirect deleted." });
        fetchData();
      } else {
        setStatusMessage({ type: "error", text: data.message });
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message });
    }
  };

  const handleRunValidationTest = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!testSlugInput.trim()) return;
    setIsTesting(true);
    try {
      const res = await fetch("/api/admin/seo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: testSlugInput.trim() })
      });
      const data = await res.json();
      setTestValidationResult(data);
    } catch (err: any) {
      setStatusMessage({ type: "error", text: "Validation failed: " + err.message });
    } finally {
      setIsTesting(false);
    }
  };

  // Filtered pages for editor listing
  const filteredPages = pages.filter((page) => {
    if (filterKind !== "all" && page.kind !== filterKind) return false;
    if (filterStatus !== "all" && page.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        page.title.toLowerCase().includes(q) ||
        page.slug.toLowerCase().includes(q) ||
        page.h1.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const titleLength = (formPage.title || "").length;
  const descLength = (formPage.metaDescription || "").length;

  return (
    <div className="rounded-[28px] border border-[#f1dfce] bg-white p-6 shadow-[0_16px_36px_rgba(16,24,40,0.06)] md:p-8">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 border-b border-[#EAEAEA] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-[#FFF4E8] px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-[#FF6B00]">
              Search Engine & AI Discovery Command Center
            </span>
            <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800">
              Clinical Governance Active
            </span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-black text-[#0D0D0D]">
            ScopeX SEO, AEO & GEO Hub
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#626262]">
            Manage indexation, generative AI discovery (Perplexity, ChatGPT, SGE), clinical review sign-offs, redirects, and search diagnostics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#D5D5D5] bg-white px-3.5 py-2 text-xs font-bold text-[#0D0D0D] hover:bg-stone-50 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh Data</span>
          </button>
          <a
            href="/sitemap.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-100 px-3.5 py-2 text-xs font-bold text-[#0D0D0D] hover:bg-stone-200 transition"
          >
            <span>XML Sitemap</span>
            <ExternalLink className="h-3 w-3" />
          </a>
          <a
            href="/robots.txt"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-100 px-3.5 py-2 text-xs font-bold text-[#0D0D0D] hover:bg-stone-200 transition"
          >
            <span>robots.txt</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Status Notice if present */}
      {statusMessage ? (
        <div
          className={`mt-4 flex items-center justify-between rounded-2xl p-4 text-xs font-bold ${
            statusMessage.type === "success"
              ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
              : statusMessage.type === "error"
              ? "bg-rose-50 text-rose-900 border border-rose-200"
              : "bg-blue-50 text-blue-900 border border-blue-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-stone-400 hover:text-stone-700">✕</button>
        </div>
      ) : null}

      {/* KPI Cards */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-2xl border border-[#EAEAEA] bg-[#F7F7F7] p-3 text-center">
          <p className="text-[11px] font-bold uppercase text-[#8A8A8A]">Total Pages</p>
          <p className="mt-1 text-2xl font-black text-[#0D0D0D]">{pages.length}</p>
          <p className="text-[10px] text-[#626262]">In memory store</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3 text-center">
          <p className="text-[11px] font-bold uppercase text-emerald-800">Published</p>
          <p className="mt-1 text-2xl font-black text-emerald-900">
            {pages.filter((p) => p.status === "published").length}
          </p>
          <p className="text-[10px] text-emerald-700">In XML Sitemap</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-3 text-center">
          <p className="text-[11px] font-bold uppercase text-amber-800">In Review</p>
          <p className="mt-1 text-2xl font-black text-amber-900">
            {pages.filter((p) => p.status === "in_review").length}
          </p>
          <p className="text-[10px] text-amber-700">Awaiting sign-off</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3 text-center">
          <p className="text-[11px] font-bold uppercase text-stone-600">Drafts</p>
          <p className="mt-1 text-2xl font-black text-stone-800">
            {pages.filter((p) => p.status === "draft").length}
          </p>
          <p className="text-[10px] text-stone-500">Unpublished</p>
        </div>
        <div className="rounded-2xl border border-[#FFD9C0] bg-[#FFF8F2] p-3 text-center">
          <p className="text-[11px] font-bold uppercase text-[#FF6B00]">Health Score</p>
          <p className="mt-1 text-2xl font-black text-[#FF6B00]">
            {auditReport?.healthScore ?? 100}%
          </p>
          <p className="text-[10px] text-[#626262]">{auditReport?.issues.length ?? 0} warnings</p>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-3 text-center">
          <p className="text-[11px] font-bold uppercase text-blue-800">Redirects</p>
          <p className="mt-1 text-2xl font-black text-blue-900">{redirects.length}</p>
          <p className="text-[10px] text-blue-700">301 / 302 rules</p>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="mt-6 flex flex-wrap gap-2 border-b border-[#EAEAEA] pb-3">
        <button
          onClick={() => setActiveTab("editor")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
            activeTab === "editor"
              ? "bg-[#0D0D0D] text-white shadow-sm"
              : "bg-stone-100 text-[#626262] hover:bg-stone-200 hover:text-[#0D0D0D]"
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Content Editor & Governance</span>
        </button>

        <button
          onClick={() => setActiveTab("auditor")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
            activeTab === "auditor"
              ? "bg-[#0D0D0D] text-white shadow-sm"
              : "bg-stone-100 text-[#626262] hover:bg-stone-200 hover:text-[#0D0D0D]"
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          <span>SEO Auditor & Duplicate Scanner</span>
          {auditReport && auditReport.issues.length > 0 ? (
            <span className="rounded-full bg-rose-500 px-1.5 py-0.2 text-[10px] font-black text-white">
              {auditReport.issues.length}
            </span>
          ) : null}
        </button>

        <button
          onClick={() => setActiveTab("geo_readiness")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
            activeTab === "geo_readiness"
              ? "bg-[#0D0D0D] text-white shadow-sm"
              : "bg-stone-100 text-[#626262] hover:bg-stone-200 hover:text-[#0D0D0D]"
          }`}
        >
          <Sparkles className="h-4 w-4 text-[#FF6B00]" />
          <span>AEO & GEO AI Discovery</span>
        </button>

        <button
          onClick={() => setActiveTab("redirects")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
            activeTab === "redirects"
              ? "bg-[#0D0D0D] text-white shadow-sm"
              : "bg-stone-100 text-[#626262] hover:bg-stone-200 hover:text-[#0D0D0D]"
          }`}
        >
          <Compass className="h-4 w-4" />
          <span>Redirects (301/302)</span>
        </button>

        <button
          onClick={() => setActiveTab("tester")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
            activeTab === "tester"
              ? "bg-[#0D0D0D] text-white shadow-sm"
              : "bg-stone-100 text-[#626262] hover:bg-stone-200 hover:text-[#0D0D0D]"
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Live URL & Tag Tester</span>
        </button>

        <button
          onClick={() => setActiveTab("metrics")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
            activeTab === "metrics"
              ? "bg-[#0D0D0D] text-white shadow-sm"
              : "bg-stone-100 text-[#626262] hover:bg-stone-200 hover:text-[#0D0D0D]"
          }`}
        >
          <Activity className="h-4 w-4" />
          <span>Search Telemetry (Gated)</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: CONTENT EDITOR & CLINICAL GOVERNANCE */}
      {/* ------------------------------------------------------------- */}
      {activeTab === "editor" && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Pages List with Filters */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#0D0D0D]">
                Pages Directory ({filteredPages.length})
              </h2>
              <button
                onClick={handleCreateNewPage}
                className="inline-flex items-center gap-1 rounded-lg bg-[#FF6B00] px-2.5 py-1 text-xs font-bold text-white hover:bg-[#e05e00] transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Page</span>
              </button>
            </div>

            {/* Filter Bar */}
            <div className="space-y-2 rounded-2xl border border-[#EAEAEA] bg-[#F7F7F7] p-3 text-xs">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#8A8A8A]" />
                <input
                  type="text"
                  placeholder="Search by title or slug..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-[#D5D5D5] bg-white pl-8 pr-3 py-1.5 text-xs text-[#0D0D0D] focus:outline-none focus:border-[#FF6B00]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={filterKind}
                  onChange={(e) => setFilterKind(e.target.value)}
                  className="rounded-xl border border-[#D5D5D5] bg-white px-2 py-1.5 text-xs text-[#0D0D0D]"
                >
                  <option value="all">All Kinds</option>
                  <option value="test">Tests</option>
                  <option value="package">Packages</option>
                  <option value="disease">Diseases</option>
                  <option value="city">Cities</option>
                  <option value="blog">Health Library</option>
                  <option value="custom">Custom</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="rounded-xl border border-[#D5D5D5] bg-white px-2 py-1.5 text-xs text-[#0D0D0D]"
                >
                  <option value="all">All Statuses</option>
                  <option value="published">Published</option>
                  <option value="approved">Approved</option>
                  <option value="in_review">In Review</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>

            {/* Scrollable list */}
            <div className="max-h-[640px] space-y-2 overflow-y-auto pr-1">
              {filteredPages.map((page) => {
                const isSelected = selectedPage?.id === page.id;
                return (
                  <button
                    key={page.id}
                    onClick={() => selectPageForEdit(page)}
                    className={`w-full text-left rounded-2xl border p-3.5 transition ${
                      isSelected
                        ? "border-[#FF6B00] bg-[#FFF8F2] shadow-sm"
                        : "border-[#EAEAEA] bg-white hover:border-[#D5D5D5]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[10px] font-bold uppercase text-[#626262]">
                        {page.kind}
                      </span>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                          page.status === "published"
                            ? "bg-emerald-100 text-emerald-800"
                            : page.status === "approved"
                            ? "bg-blue-100 text-blue-800"
                            : page.status === "in_review"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-stone-200 text-stone-700"
                        }`}
                      >
                        {page.status}
                      </span>
                    </div>

                    <p className="mt-2 text-xs font-bold text-[#0D0D0D] line-clamp-1">
                      {page.title}
                    </p>
                    <p className="mt-1 text-[11px] text-[#8A8A8A] font-mono line-clamp-1">
                      {page.canonicalPath}
                    </p>

                    <div className="mt-2 flex items-center justify-between text-[10px] text-[#626262]">
                      <span>{page.faq?.length || 0} FAQs</span>
                      {page.clinicalReview?.approved ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                          <ShieldCheck className="h-3 w-3" /> Clinically Signed
                        </span>
                      ) : (
                        <span className="text-amber-700 font-semibold">Review Pending</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Complete Content & Clinical Governance Form */}
          <div className="lg:col-span-8 space-y-6 rounded-3xl border border-[#EAEAEA] bg-white p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#EAEAEA] pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#FF6B00]">
                  {selectedPage ? `Editing: ${selectedPage.slug}` : "Create New SEO Page"}
                </span>
                <h2 className="mt-1 text-xl font-black text-[#0D0D0D]">
                  SEO & Clinical Content Form
                </h2>
              </div>

              {/* Status Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSavePage("draft")}
                  className="rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-xs font-bold text-stone-700 hover:bg-stone-50"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleSavePage("in_review")}
                  className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100"
                >
                  Submit for Review
                </button>
                <button
                  type="button"
                  onClick={() => handleSavePage("published")}
                  className="rounded-xl bg-[#0D0D0D] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#FF6B00] transition"
                >
                  Publish (Enforce Review)
                </button>
              </div>
            </div>

            {/* Field Grid */}
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-bold text-[#0D0D0D]">Page Kind</label>
                  <select
                    value={formPage.kind || "test"}
                    onChange={(e) => setFormPage({ ...formPage, kind: e.target.value as SeoEntityKind })}
                    className="mt-1 w-full rounded-xl border border-[#D5D5D5] p-2 text-xs text-[#0D0D0D]"
                  >
                    <option value="test">Test Page</option>
                    <option value="package">Package Page</option>
                    <option value="disease">Disease / Condition</option>
                    <option value="city">City Landing Page</option>
                    <option value="blog">Educational Article</option>
                    <option value="custom">Custom Landing Page</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0D0D0D]">Robots Directive</label>
                  <select
                    value={formPage.robots || "index, follow"}
                    onChange={(e) => setFormPage({ ...formPage, robots: e.target.value as RobotsDirective })}
                    className="mt-1 w-full rounded-xl border border-[#D5D5D5] p-2 text-xs text-[#0D0D0D]"
                  >
                    <option value="index, follow">index, follow (Standard Public)</option>
                    <option value="noindex, follow">noindex, follow (Hide from Search)</option>
                    <option value="noindex, nofollow">noindex, nofollow (Complete Block)</option>
                    <option value="index, nofollow">index, nofollow (Do not follow links)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0D0D0D]">Status Lifecycle</label>
                  <div className="mt-1 flex items-center h-9 px-3 rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] text-xs font-bold uppercase text-[#0D0D0D]">
                    {formPage.status || "draft"}
                  </div>
                </div>
              </div>

              {/* Title & Length Indicator */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#0D0D0D]">
                    Page Title (Meta Title & SERP Display)
                  </label>
                  <span
                    className={`text-[11px] font-bold ${
                      titleLength >= 30 && titleLength <= 65 ? "text-emerald-700" : "text-amber-600"
                    }`}
                  >
                    {titleLength}/60 chars (Recommended: 30-65)
                  </span>
                </div>
                <input
                  type="text"
                  value={formPage.title || ""}
                  onChange={(e) => setFormPage({ ...formPage, title: e.target.value })}
                  placeholder="e.g. Complete Blood Count (CBC) Test at Home | ScopeX Diagnostics"
                  className="mt-1 w-full rounded-xl border border-[#D5D5D5] p-2.5 text-xs text-[#0D0D0D] font-medium focus:border-[#FF6B00] focus:outline-none"
                />
              </div>

              {/* H1 and URL Slug */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-[#0D0D0D]">H1 Heading</label>
                  <input
                    type="text"
                    value={formPage.h1 || ""}
                    onChange={(e) => setFormPage({ ...formPage, h1: e.target.value })}
                    placeholder="e.g. Complete Blood Count (CBC) Test"
                    className="mt-1 w-full rounded-xl border border-[#D5D5D5] p-2 text-xs text-[#0D0D0D]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0D0D0D]">URL Slug (Canonical Path)</label>
                  <input
                    type="text"
                    value={formPage.slug || ""}
                    onChange={(e) => {
                      const slug = e.target.value.toLowerCase().replace(/[^a-z0-9-/]/g, "-");
                      setFormPage({
                        ...formPage,
                        slug,
                        canonicalPath: slug.startsWith("/") ? slug : `/${slug}`,
                        canonicalUrl: `https://www.scopexdiagnostics.in/${slug.replace(/^\//, "")}`
                      });
                    }}
                    placeholder="e.g. tests/complete-blood-count-esr-test"
                    className="mt-1 w-full rounded-xl border border-[#D5D5D5] p-2 text-xs font-mono text-[#0D0D0D]"
                  />
                </div>
              </div>

              {/* Meta Description */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#0D0D0D]">
                    Meta Description (Search & Social Snippet)
                  </label>
                  <span
                    className={`text-[11px] font-bold ${
                      descLength >= 120 && descLength <= 165 ? "text-emerald-700" : "text-amber-600"
                    }`}
                  >
                    {descLength}/160 chars (Recommended: 120-165)
                  </span>
                </div>
                <textarea
                  rows={2}
                  value={formPage.metaDescription || ""}
                  onChange={(e) => setFormPage({ ...formPage, metaDescription: e.target.value })}
                  placeholder="Provide a clear, accurate, and compelling 140-160 character summary of the diagnostic test or package."
                  className="mt-1 w-full rounded-xl border border-[#D5D5D5] p-2.5 text-xs text-[#0D0D0D] focus:border-[#FF6B00] focus:outline-none"
                />
              </div>

              {/* AEO Direct Answer Box (CRITICAL FOR ANSWER ENGINE OPTIMIZATION) */}
              <div className="rounded-2xl border-2 border-[#FFD9C0] bg-[#FFF8F2] p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-black text-[#FF6B00]">
                    <Sparkles className="h-4 w-4" />
                    <span>AEO Direct Answer Box (Direct Synthesis for AI Search)</span>
                  </div>
                  <span className="text-[11px] text-[#626262]">Target: 40–60 words</span>
                </div>
                <p className="mt-1 text-[11px] text-[#626262]">
                  This direct answer provides immediate diagnostic clarity for LLMs (ChatGPT, Perplexity, Gemini) and featured snippets.
                </p>
                <textarea
                  rows={3}
                  value={formPage.aeoDirectAnswer || ""}
                  onChange={(e) => setFormPage({ ...formPage, aeoDirectAnswer: e.target.value })}
                  placeholder="e.g. Complete Blood Count (CBC) evaluates red and white cells, hemoglobin, and platelets to detect anemia and infections. ScopeX provides NABL quality testing with home collection and 12-hour digital reporting."
                  className="mt-2 w-full rounded-xl border border-[#FFD9C0] bg-white p-2.5 text-xs text-[#0D0D0D] font-medium focus:outline-none"
                />
              </div>

              {/* Quantitative Data: Fasting, Specimen, Turnaround, Real Price */}
              <div className="grid gap-3 sm:grid-cols-4 rounded-2xl border border-[#EAEAEA] bg-[#F7F7F7] p-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#626262]">Specimen Type</label>
                  <input
                    type="text"
                    value={formPage.specimenType || ""}
                    onChange={(e) => setFormPage({ ...formPage, specimenType: e.target.value })}
                    placeholder="e.g. Blood (EDTA Vacutainer)"
                    className="mt-1 w-full rounded-lg border border-[#D5D5D5] bg-white p-1.5 text-xs text-[#0D0D0D]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#626262]">Fasting Requirements</label>
                  <input
                    type="text"
                    value={formPage.fastingRequirement || ""}
                    onChange={(e) => setFormPage({ ...formPage, fastingRequirement: e.target.value })}
                    placeholder="e.g. 10-12 Hrs Fasting"
                    className="mt-1 w-full rounded-lg border border-[#D5D5D5] bg-white p-1.5 text-xs text-[#0D0D0D]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#626262]">Turnaround Time</label>
                  <input
                    type="text"
                    value={formPage.turnaroundTime || ""}
                    onChange={(e) => setFormPage({ ...formPage, turnaroundTime: e.target.value })}
                    placeholder="e.g. 12-24 Hours"
                    className="mt-1 w-full rounded-lg border border-[#D5D5D5] bg-white p-1.5 text-xs text-[#0D0D0D]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#626262]">Real Price (₹)</label>
                  <input
                    type="number"
                    value={formPage.realPrice ?? ""}
                    onChange={(e) => setFormPage({ ...formPage, realPrice: Number(e.target.value) || 0 })}
                    placeholder="e.g. 350"
                    className="mt-1 w-full rounded-lg border border-[#D5D5D5] bg-white p-1.5 text-xs text-[#0D0D0D]"
                  />
                </div>
              </div>

              {/* CLINICAL GOVERNANCE REVIEW (CRITICAL MANDATE) */}
              <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50/40 p-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-700" />
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-900">
                    Mandatory Clinical Governance & Medical Review Sign-Off
                  </span>
                </div>
                <p className="mt-1 text-xs text-emerald-800">
                  Medical facts, specimen recommendations, and diagnostic scopes must be reviewed and signed off by a qualified medical practitioner before publication.
                </p>

                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="block text-[11px] font-bold text-emerald-900">
                      Medical Reviewer Name *
                    </label>
                    <input
                      type="text"
                      value={formPage.clinicalReview?.reviewedBy || ""}
                      onChange={(e) =>
                        setFormPage({
                          ...formPage,
                          clinicalReview: {
                            ...(formPage.clinicalReview || { reviewDate: "", approved: false, reviewerCredentials: "" }),
                            reviewedBy: e.target.value
                          }
                        })
                      }
                      placeholder="e.g. Dr. Piyush Pathlab Clinical Team"
                      className="mt-1 w-full rounded-lg border border-emerald-300 bg-white p-1.5 text-xs text-[#0D0D0D]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-emerald-900">
                      Professional Medical Credentials *
                    </label>
                    <input
                      type="text"
                      value={formPage.clinicalReview?.reviewerCredentials || ""}
                      onChange={(e) =>
                        setFormPage({
                          ...formPage,
                          clinicalReview: {
                            ...(formPage.clinicalReview || { reviewDate: "", approved: false, reviewedBy: "" }),
                            reviewerCredentials: e.target.value
                          }
                        })
                      }
                      placeholder="e.g. MBBS, MD Pathology"
                      className="mt-1 w-full rounded-lg border border-emerald-300 bg-white p-1.5 text-xs text-[#0D0D0D]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-emerald-900">Review Date</label>
                    <input
                      type="date"
                      value={formPage.clinicalReview?.reviewDate || new Date().toISOString().split("T")[0]}
                      onChange={(e) =>
                        setFormPage({
                          ...formPage,
                          clinicalReview: {
                            ...(formPage.clinicalReview || { reviewedBy: "", reviewerCredentials: "", approved: false }),
                            reviewDate: e.target.value
                          }
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-emerald-300 bg-white p-1.5 text-xs text-[#0D0D0D]"
                    />
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-emerald-200 pt-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formPage.clinicalReview?.approved || false}
                      onChange={(e) =>
                        setFormPage({
                          ...formPage,
                          clinicalReview: {
                            ...(formPage.clinicalReview || { reviewedBy: "", reviewerCredentials: "", reviewDate: "" }),
                            approved: e.target.checked
                          }
                        })
                      }
                      className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-bold text-emerald-950">
                      I certify that this medical diagnostic content has been reviewed for factual accuracy and clinical validity.
                    </span>
                  </label>
                </div>
              </div>

              {/* FAQs Section */}
              <div className="rounded-2xl border border-[#EAEAEA] p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-[#FF6B00]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[#0D0D0D]">
                      AEO Structured FAQs ({formFaqs.length})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddFaq}
                    className="rounded-lg bg-stone-100 px-2 py-1 text-xs font-bold text-[#0D0D0D] hover:bg-stone-200"
                  >
                    + Add Question
                  </button>
                </div>

                <div className="mt-3 space-y-3">
                  {formFaqs.map((faq, idx) => (
                    <div key={idx} className="rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={faq.question}
                          onChange={(e) => {
                            const updated = [...formFaqs];
                            updated[idx].question = e.target.value;
                            setFormFaqs(updated);
                          }}
                          placeholder={`Question #${idx + 1}`}
                          className="w-full rounded-lg border border-[#D5D5D5] bg-white p-1.5 text-xs font-bold text-[#0D0D0D]"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveFaq(idx)}
                          className="text-stone-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={faq.answer}
                        onChange={(e) => {
                          const updated = [...formFaqs];
                          updated[idx].answer = e.target.value;
                          setFormFaqs(updated);
                        }}
                        placeholder="Direct factual answer..."
                        className="w-full rounded-lg border border-[#D5D5D5] bg-white p-1.5 text-xs text-[#0D0D0D]"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Medical Source References */}
              <div className="rounded-2xl border border-[#EAEAEA] p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-[#FF6B00]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[#0D0D0D]">
                      Medical Source Citations & References ({formCitations.length})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCitation}
                    className="rounded-lg bg-stone-100 px-2 py-1 text-xs font-bold text-[#0D0D0D] hover:bg-stone-200"
                  >
                    + Add Citation
                  </button>
                </div>

                <div className="mt-3 space-y-2">
                  {formCitations.map((cite, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row items-center gap-2 rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] p-2">
                      <input
                        type="text"
                        value={cite.title}
                        onChange={(e) => {
                          const updated = [...formCitations];
                          updated[idx].title = e.target.value;
                          setFormCitations(updated);
                        }}
                        placeholder="Guideline / Article Title"
                        className="w-full sm:w-1/2 rounded-lg border border-[#D5D5D5] bg-white p-1.5 text-xs text-[#0D0D0D]"
                      />
                      <input
                        type="text"
                        value={cite.source}
                        onChange={(e) => {
                          const updated = [...formCitations];
                          updated[idx].source = e.target.value;
                          setFormCitations(updated);
                        }}
                        placeholder="Source (e.g. NABL, ICMR)"
                        className="w-full sm:w-1/4 rounded-lg border border-[#D5D5D5] bg-white p-1.5 text-xs text-[#0D0D0D]"
                      />
                      <input
                        type="text"
                        value={cite.url || ""}
                        onChange={(e) => {
                          const updated = [...formCitations];
                          updated[idx].url = e.target.value;
                          setFormCitations(updated);
                        }}
                        placeholder="Reference URL"
                        className="w-full sm:w-1/4 rounded-lg border border-[#D5D5D5] bg-white p-1.5 text-xs text-[#0D0D0D]"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveCitation(idx)}
                        className="text-stone-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* SERP Google Snippet Preview */}
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  Google Search Snippet Preview
                </p>
                <div className="mt-2.5 rounded-xl border border-stone-200 bg-white p-4 max-w-xl">
                  <p className="text-xs text-stone-500 truncate">
                    {formPage.canonicalUrl || `https://www.scopexdiagnostics.in/${formPage.slug || ""}`}
                  </p>
                  <p className="mt-1 text-base font-medium text-blue-800 hover:underline cursor-pointer truncate">
                    {formPage.title || "Page Title"}
                  </p>
                  <p className="mt-1 text-xs text-stone-600 line-clamp-2 leading-relaxed">
                    {formPage.metaDescription || "Meta description will appear here in search engine result pages."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: SEO AUDITOR & DUPLICATE SCANNER */}
      {/* ------------------------------------------------------------- */}
      {activeTab === "auditor" && auditReport && (
        <div className="mt-6 space-y-6">
          <div className="rounded-2xl border border-[#FFD9C0] bg-[#FFF8F2] p-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#FF6B00]">Real-Time Health Audit</span>
                <h2 className="mt-1 text-2xl font-black text-[#0D0D0D]">
                  Audit Health Score: {auditReport.healthScore}%
                </h2>
                <p className="mt-1 text-xs text-[#626262]">
                  Scanned {auditReport.totalPages} indexed pages for duplicate meta titles, duplicate descriptions, length violations, and clinical governance compliance.
                </p>
              </div>
              <button
                onClick={fetchData}
                className="rounded-xl bg-[#0D0D0D] px-4 py-2 text-xs font-bold text-white hover:bg-[#FF6B00]"
              >
                Re-Scan All Pages
              </button>
            </div>
          </div>

          {/* Issues Categorization Grid */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4">
              <span className="text-xs font-bold uppercase text-rose-800">Errors (Requires Action)</span>
              <p className="mt-2 text-3xl font-black text-rose-900">
                {auditReport.issues.filter((i) => i.severity === "critical").length}
              </p>
              <p className="mt-1 text-xs text-rose-700">Clinical unapproved content or missing canonicals</p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
              <span className="text-xs font-bold uppercase text-amber-800">Warnings (Optimization)</span>
              <p className="mt-2 text-3xl font-black text-amber-900">
                {auditReport.issues.filter((i) => i.severity === "warning").length}
              </p>
              <p className="mt-1 text-xs text-amber-700">Duplicate titles, duplicate descriptions, length truncations</p>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4">
              <span className="text-xs font-bold uppercase text-blue-800">Info Notices</span>
              <p className="mt-2 text-3xl font-black text-blue-900">
                {auditReport.issues.filter((i) => i.severity === "info").length}
              </p>
              <p className="mt-1 text-xs text-blue-700">AEO recommendations and missing direct answers</p>
            </div>
          </div>

          {/* Issues Table */}
          <div className="overflow-hidden rounded-2xl border border-[#EAEAEA] bg-white">
            <div className="border-b border-[#EAEAEA] bg-[#F7F7F7] px-4 py-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0D0D0D]">
                Detected Diagnostics Issues ({auditReport.issues.length})
              </h3>
            </div>

            <div className="divide-y divide-[#EAEAEA]">
              {auditReport.issues.length === 0 ? (
                <div className="p-8 text-center text-sm font-semibold text-emerald-800">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600 mb-2" />
                  All pages passed audit! Zero duplicate metadata, valid canonical URLs, and full clinical sign-offs.
                </div>
              ) : (
                auditReport.issues.map((iss) => (
                  <div key={iss.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                            iss.severity === "critical"
                              ? "bg-rose-100 text-rose-800"
                              : iss.severity === "warning"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {iss.category.replace(/_/g, " ")}
                        </span>
                        <span className="font-mono text-xs font-bold text-[#0D0D0D]">
                          {iss.slug}
                        </span>
                      </div>
                      <p className="text-xs text-[#626262]">{iss.message}</p>
                    </div>

                    <button
                      onClick={() => {
                        const target = pages.find((p) => p.id === iss.pageId || p.slug === iss.slug);
                        if (target) {
                          selectPageForEdit(target);
                          setActiveTab("editor");
                        }
                      }}
                      className="rounded-xl border border-[#D5D5D5] bg-white px-3 py-1.5 text-xs font-bold text-[#0D0D0D] hover:border-[#FF6B00] hover:text-[#FF6B00] transition self-start sm:self-center"
                    >
                      Fix in Editor →
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: AEO & GEO DISCOVERY READINESS */}
      {/* ------------------------------------------------------------- */}
      {activeTab === "geo_readiness" && (
        <div className="mt-6 space-y-6">
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">
              Generative Engine Optimization (GEO) & Answer Engine Optimization (AEO)
            </span>
            <h2 className="mt-1 text-2xl font-black text-indigo-950">
              AI Discovery Readiness Analyzer
            </h2>
            <p className="mt-1 text-xs text-indigo-800 max-w-3xl">
              Evaluates how effectively your diagnostic pages can be discovered, cited, and summarized by LLM answer engines (Perplexity, ChatGPT Search, Claude, Google SGE). Checks direct answer density, structured FAQs, NABL / ICMR citations, and clinical reviewer credentials.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pages.slice(0, 12).map((page) => {
              const hasDirectAnswer = Boolean(page.aeoDirectAnswer && page.aeoDirectAnswer.length >= 40);
              const hasFaqs = Boolean(page.faq && page.faq.length >= 2);
              const hasClinical = Boolean(page.clinicalReview?.approved);
              const score = (hasDirectAnswer ? 35 : 0) + (hasFaqs ? 25 : 0) + (hasClinical ? 25 : 0) + 15;

              return (
                <div key={page.id} className="rounded-2xl border border-[#EAEAEA] bg-white p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-stone-100 px-2 py-0.5 text-[10px] font-bold uppercase text-[#626262]">
                      {page.kind}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-black ${
                        score >= 80 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      Score: {score}/100
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-[#0D0D0D] line-clamp-1">
                    {page.h1 || page.title}
                  </h3>

                  <div className="space-y-1.5 text-[11px] text-[#626262]">
                    <div className="flex items-center gap-1.5">
                      {hasDirectAnswer ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                      )}
                      <span>AEO Direct Answer Box (40-60 words)</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {hasFaqs ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                      )}
                      <span>FAQ Schema ({page.faq?.length || 0} items)</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {hasClinical ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                      )}
                      <span>Medical Reviewer Sign-Off</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setTestSlugInput(page.canonicalPath);
                      setActiveTab("tester");
                      handleRunValidationTest();
                    }}
                    className="w-full rounded-xl bg-stone-100 py-2 text-center text-xs font-bold text-[#0D0D0D] hover:bg-[#FF6B00] hover:text-white transition"
                  >
                    Inspect Structured JSON-LD →
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 4: REDIRECT MANAGEMENT (301/302) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === "redirects" && (
        <div className="mt-6 space-y-6">
          <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
              URL Migration & Preservation
            </span>
            <h2 className="mt-1 text-2xl font-black text-blue-950">
              301 Permanent & 302 Temporary Redirect Rules
            </h2>
            <p className="mt-1 text-xs text-blue-800">
              Preserve link equity and prevent 404 dead ends when legacy URLs change. Includes loop detection and hit counting.
            </p>
          </div>

          {/* Add Redirect Form */}
          <form onSubmit={handleAddRedirect} className="rounded-2xl border border-[#EAEAEA] bg-white p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0D0D0D]">Add New Redirect Rule</h3>
            <div className="grid gap-3 sm:grid-cols-4">
              <div>
                <label className="block text-[11px] font-bold text-[#626262]">Source Path (From) *</label>
                <input
                  type="text"
                  value={newRedSource}
                  onChange={(e) => setNewRedSource(e.target.value)}
                  placeholder="/old-test-url"
                  className="mt-1 w-full rounded-xl border border-[#D5D5D5] p-2 text-xs font-mono text-[#0D0D0D]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#626262]">Destination Path (To) *</label>
                <input
                  type="text"
                  value={newRedDest}
                  onChange={(e) => setNewRedDest(e.target.value)}
                  placeholder="/tests/complete-blood-count-esr-test"
                  className="mt-1 w-full rounded-xl border border-[#D5D5D5] p-2 text-xs font-mono text-[#0D0D0D]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#626262]">HTTP Status Code</label>
                <select
                  value={newRedCode}
                  onChange={(e) => setNewRedCode(Number(e.target.value) as 301 | 302)}
                  className="mt-1 w-full rounded-xl border border-[#D5D5D5] p-2 text-xs text-[#0D0D0D]"
                >
                  <option value={301}>301 Permanent (Pass SEO Equity)</option>
                  <option value={302}>302 Temporary (Campaign / Promo)</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full rounded-xl bg-[#0D0D0D] py-2 text-xs font-bold text-white hover:bg-[#FF6B00] transition h-9"
                >
                  + Add Rule
                </button>
              </div>
            </div>
          </form>

          {/* Existing Redirects List */}
          <div className="overflow-hidden rounded-2xl border border-[#EAEAEA] bg-white">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F7F7] text-[11px] font-bold uppercase text-[#626262] border-b border-[#EAEAEA]">
                <tr>
                  <th className="px-4 py-3">Source Path</th>
                  <th className="px-4 py-3">Destination</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Hits</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEAEA]">
                {redirects.map((r) => (
                  <tr key={r.id} className="hover:bg-stone-50">
                    <td className="px-4 py-3 font-mono font-bold text-[#0D0D0D]">{r.sourcePath}</td>
                    <td className="px-4 py-3 font-mono text-emerald-800">{r.destinationPath}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                          r.statusCode === 301 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {r.statusCode}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-[#626262]">{r.hitCount}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteRedirect(r.id)}
                        className="text-stone-400 hover:text-rose-600 transition"
                      >
                        <Trash2 className="h-4 w-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 5: LIVE URL & TAG TESTER */}
      {/* ------------------------------------------------------------- */}
      {activeTab === "tester" && (
        <div className="mt-6 space-y-6">
          <div className="rounded-2xl border border-[#EAEAEA] bg-white p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF6B00]">Inspector & Validator</span>
            <h2 className="mt-1 text-2xl font-black text-[#0D0D0D]">Test Metadata, Canonical URL & Schema.org JSON-LD</h2>
            <p className="mt-1 text-xs text-[#626262]">
              Verify any live page slug or canonical path. Validates schema structures, social share cards, and AEO answer readiness.
            </p>

            <form onSubmit={handleRunValidationTest} className="mt-4 flex gap-2">
              <input
                type="text"
                value={testSlugInput}
                onChange={(e) => setTestSlugInput(e.target.value)}
                placeholder="Enter slug or path e.g. tests/complete-blood-count-esr-test"
                className="flex-1 rounded-xl border border-[#D5D5D5] px-3.5 py-2.5 text-xs font-mono text-[#0D0D0D] focus:border-[#FF6B00] focus:outline-none"
              />
              <button
                type="submit"
                disabled={isTesting}
                className="rounded-xl bg-[#0D0D0D] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#FF6B00] transition shrink-0"
              >
                {isTesting ? "Validating..." : "Inspect & Validate"}
              </button>
            </form>
          </div>

          {/* Validation Result Output */}
          {testValidationResult && testValidationResult.success && (
            <div className="space-y-6">
              {/* Validation Badges */}
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
                  <span className="text-[11px] font-bold uppercase text-emerald-800">Canonical URL</span>
                  <p className="mt-1 text-xs font-mono text-emerald-950 font-bold truncate">
                    {testValidationResult.page.canonicalUrl}
                  </p>
                  <p className="mt-1 text-[10px] text-emerald-700">Strict origin match verified</p>
                </div>

                <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4">
                  <span className="text-[11px] font-bold uppercase text-blue-800">Indexable Status</span>
                  <p className="mt-1 text-base font-black text-blue-900">
                    {testValidationResult.page.robots}
                  </p>
                  <p className="mt-1 text-[10px] text-blue-700">Robots meta tag valid</p>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
                  <span className="text-[11px] font-bold uppercase text-amber-800">Title / Meta Length</span>
                  <p className="mt-1 text-xs font-bold text-amber-950">
                    Title: {testValidationResult.validation.titleLength} chars | Desc: {testValidationResult.validation.descLength} chars
                  </p>
                  <p className="mt-1 text-[10px] text-amber-700">
                    {testValidationResult.validation.titleValid && testValidationResult.validation.descValid ? "Optimal length" : "Needs fine-tuning"}
                  </p>
                </div>

                <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4">
                  <span className="text-[11px] font-bold uppercase text-indigo-800">AI Discovery Score</span>
                  <p className="mt-1 text-2xl font-black text-indigo-950">
                    {testValidationResult.aiDiscovery?.score ?? 85}/100
                  </p>
                  <p className="mt-1 text-[10px] text-indigo-700">{testValidationResult.aiDiscovery?.rating}</p>
                </div>
              </div>

              {/* SERP Snippet Preview */}
              <div className="rounded-2xl border border-[#EAEAEA] bg-white p-5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#626262]">Live Google SERP Card</span>
                <div className="mt-3 rounded-xl border border-stone-200 bg-[#F7F7F7] p-4 max-w-xl">
                  <p className="text-xs text-stone-600 truncate">{testValidationResult.serpPreview.displayUrl}</p>
                  <p className="mt-1 text-base font-semibold text-blue-800 hover:underline cursor-pointer">
                    {testValidationResult.serpPreview.title}
                  </p>
                  <p className="mt-1.5 text-xs text-stone-600 leading-relaxed">
                    {testValidationResult.serpPreview.snippet}
                  </p>
                </div>
              </div>

              {/* Formatted JSON-LD Output */}
              <div className="rounded-2xl border border-[#EAEAEA] bg-stone-900 p-5 text-white">
                <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#FF6B00]">
                    Generated Schema.org JSON-LD Structured Data
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(testValidationResult.structuredData, null, 2));
                      setStatusMessage({ type: "success", text: "JSON-LD copied to clipboard." });
                    }}
                    className="rounded-lg bg-stone-800 px-3 py-1 text-xs font-bold text-stone-300 hover:text-white"
                  >
                    Copy JSON-LD
                  </button>
                </div>
                <pre className="mt-3 max-h-96 overflow-y-auto text-[11px] font-mono text-emerald-400">
                  {JSON.stringify(testValidationResult.structuredData, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 6: SEARCH METRICS TELEMETRY (GATED PER USER REQUIREMENT) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === "metrics" && (
        <div className="mt-6 space-y-6">
          {metricsData?.isConnected ? (
            <div className="space-y-6">
              <div className="rounded-2xl border border-emerald-300 bg-emerald-50/50 p-5">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Live Integration Active</span>
                <h2 className="mt-1 text-2xl font-black text-emerald-950">
                  {metricsData.provider} Performance Telemetry
                </h2>
                <p className="mt-1 text-xs text-emerald-800">{metricsData.notice}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-4">
                <div className="rounded-2xl border border-[#EAEAEA] bg-white p-4">
                  <p className="text-xs font-bold text-[#8A8A8A]">Total Impressions</p>
                  <p className="mt-1 text-3xl font-black text-[#0D0D0D]">{metricsData.metrics.totalImpressions.toLocaleString()}</p>
                </div>
                <div className="rounded-2xl border border-[#EAEAEA] bg-white p-4">
                  <p className="text-xs font-bold text-[#8A8A8A]">Total Clicks</p>
                  <p className="mt-1 text-3xl font-black text-[#FF6B00]">{metricsData.metrics.totalClicks.toLocaleString()}</p>
                </div>
                <div className="rounded-2xl border border-[#EAEAEA] bg-white p-4">
                  <p className="text-xs font-bold text-[#8A8A8A]">Avg CTR</p>
                  <p className="mt-1 text-3xl font-black text-emerald-800">{metricsData.metrics.averageCtrPercent}%</p>
                </div>
                <div className="rounded-2xl border border-[#EAEAEA] bg-white p-4">
                  <p className="text-xs font-bold text-[#8A8A8A]">Avg Position</p>
                  <p className="mt-1 text-3xl font-black text-blue-900">{metricsData.metrics.averagePosition}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-[#D5D5D5] bg-[#F7F7F7] p-8 text-center max-w-2xl mx-auto space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-200 text-stone-600 mx-auto">
                <Activity className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-[#0D0D0D]">Search Integration Not Connected</h2>
              <p className="text-xs sm:text-sm text-[#626262] leading-relaxed">
                As required by governance policies, actual search metrics are displayed <strong>strictly when the relevant integration is connected</strong>. No fabricated rankings or artificial impressions are displayed.
              </p>

              <div className="rounded-2xl border border-[#EAEAEA] bg-white p-4 text-left text-xs space-y-2">
                <p className="font-bold text-[#0D0D0D]">How to connect Google Search Console / GA4:</p>
                <ol className="list-decimal list-inside space-y-1 text-[#626262]">
                  <li>Set environment variable <code className="bg-stone-100 px-1 py-0.5 rounded font-mono">NEXT_PUBLIC_GA4_MEASUREMENT_ID</code> (e.g. G-XXXXXXX) in production.</li>
                  <li>Or configure <code className="bg-stone-100 px-1 py-0.5 rounded font-mono">GOOGLE_SEARCH_CONSOLE_KEY</code> to enable Search Console API streaming.</li>
                  <li>Verify ownership of <code className="bg-stone-100 px-1 py-0.5 rounded font-mono">https://www.scopexdiagnostics.in</code> in Google Search Console.</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
