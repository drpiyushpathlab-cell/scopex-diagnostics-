"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminSessionGuard } from "@/components/admin-session-guard";
import { backendFetch } from "@/lib/backend-client";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Lock,
  Sparkles,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Tag,
  Layers,
  Percent,
  Download,
  FileSpreadsheet
} from "lucide-react";

type DiagnosticTest = {
  id: string;
  name: string;
  price: number;
  mrp?: number;
  category: string;
  group: string;
};

type FixedPackageAdminItem = {
  id: string;
  name: string;
  section: string;
  badge: string;
  packageType?: "fixed" | "custom";
  allowExtraDiscount?: boolean;
  price: number;
  mrp: number;
  discount: number;
  savings?: number;
  tagline: string;
  overview: string[];
  testIds?: string[];
  bestFor?: string[];
  whyPackage?: string[];
  featured?: boolean;
  isActive?: boolean;
};

export default function AdminPackagesPage() {
  return (
    <AdminSessionGuard>
      <AdminPackagesContent />
    </AdminSessionGuard>
  );
}

function AdminPackagesContent() {
  const [packages, setPackages] = useState<FixedPackageAdminItem[]>([]);
  const [allTests, setAllTests] = useState<DiagnosticTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [sectionFilter, setSectionFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<FixedPackageAdminItem | null>(null);
  const [testSearchInModal, setTestSearchInModal] = useState("");

  const [formData, setFormData] = useState<{
    name: string;
    section: string;
    badge: string;
    tagline: string;
    price: number;
    mrp: number;
    allowExtraDiscount: boolean;
    isActive: boolean;
    selectedTestIds: string[];
  }>({
    name: "",
    section: "Preventive Health",
    badge: "Best Value",
    tagline: "",
    price: 1499,
    mrp: 2999,
    allowExtraDiscount: false,
    isActive: true,
    selectedTestIds: []
  });

  async function loadData() {
    setLoading(true);
    setFeedback(null);
    try {
      const [pkgRes, testsRes] = await Promise.all([
        backendFetch("/admin/packages"),
        backendFetch("/admin/tests")
      ]);

      if (pkgRes.ok) {
        const pkgData = await pkgRes.json();
        setPackages(pkgData.packages ?? []);
      }
      if (testsRes.ok) {
        const testsData = await testsRes.json();
        setAllTests(testsData.tests ?? []);
      }
    } catch (err) {
      setFeedback({
        message: err instanceof Error ? err.message : "Failed to load packages.",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const filteredPackages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return packages.filter((pkg) => {
      if (sectionFilter !== "All" && pkg.section?.toLowerCase() !== sectionFilter.toLowerCase()) {
        return false;
      }
      if (statusFilter === "active" && pkg.isActive === false) return false;
      if (statusFilter === "inactive" && pkg.isActive !== false) return false;
      if (!q) return true;
      return (
        pkg.name.toLowerCase().includes(q) ||
        pkg.id.toLowerCase().includes(q) ||
        (pkg.overview || []).some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [packages, searchQuery, sectionFilter, statusFilter]);

  function openCreateModal() {
    setEditingPkg(null);
    setTestSearchInModal("");
    setFormData({
      name: "",
      section: "Preventive Health",
      badge: "Best Value",
      tagline: "Comprehensive preventive diagnostic profile",
      price: 1499,
      mrp: 2999,
      allowExtraDiscount: false,
      isActive: true,
      selectedTestIds: allTests.slice(0, 5).map((t) => t.id)
    });
    setIsModalOpen(true);
  }

  function openEditModal(pkg: FixedPackageAdminItem) {
    setEditingPkg(pkg);
    setTestSearchInModal("");

    // Resolve testIds if empty by matching test names in overview
    const resolvedIds = (pkg.testIds && pkg.testIds.length > 0)
      ? pkg.testIds
      : (pkg.overview || []).map((name) => {
          const matched = allTests.find((t) => t.name.toLowerCase() === name.toLowerCase());
          return matched ? matched.id : name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        });

    setFormData({
      name: pkg.name,
      section: pkg.section || "Preventive Health",
      badge: pkg.badge || "Best Value",
      tagline: pkg.tagline || "",
      price: pkg.price,
      mrp: pkg.mrp || Math.round(pkg.price * 1.5),
      allowExtraDiscount: Boolean(pkg.allowExtraDiscount),
      isActive: pkg.isActive !== false,
      selectedTestIds: resolvedIds
    });
    setIsModalOpen(true);
  }

  function toggleTestInModal(testId: string) {
    setFormData((prev) => {
      const exists = prev.selectedTestIds.includes(testId);
      return {
        ...prev,
        selectedTestIds: exists
          ? prev.selectedTestIds.filter((id) => id !== testId)
          : [...prev.selectedTestIds, testId]
      };
    });
  }

  // Calculate live savings
  const liveSavingsAmount = formData.mrp > formData.price ? formData.mrp - formData.price : 0;
  const liveSavingsPercent = formData.mrp > formData.price ? Math.round((liveSavingsAmount / formData.mrp) * 100) : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFeedback({ message: "Package name is required.", type: "error" });
      return;
    }
    if (formData.selectedTestIds.length === 0) {
      setFeedback({ message: "Please select at least one test for this fixed package.", type: "error" });
      return;
    }
    if (formData.price < 0 || formData.mrp < formData.price) {
      setFeedback({ message: "Reference market price (MRP) must be greater than or equal to selling price.", type: "error" });
      return;
    }

    // Resolve test names for overview
    const resolvedOverview = formData.selectedTestIds.map((tid) => {
      const test = allTests.find((t) => t.id === tid);
      return test ? test.name : tid;
    });

    try {
      const payload = {
        name: formData.name.trim(),
        section: formData.section,
        badge: formData.badge,
        tagline: formData.tagline.trim(),
        price: Number(formData.price),
        mrp: Number(formData.mrp),
        allowExtraDiscount: formData.allowExtraDiscount,
        isActive: formData.isActive,
        testIds: formData.selectedTestIds,
        overview: resolvedOverview
      };

      if (editingPkg) {
        const res = await backendFetch(`/admin/packages/${editingPkg.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to update package.");
        setFeedback({ message: `Package "${data.package.name}" updated successfully.`, type: "success" });
      } else {
        const res = await backendFetch("/admin/packages", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to create package.");
        setFeedback({ message: `Package "${data.package.name}" created successfully.`, type: "success" });
      }

      setIsModalOpen(false);
      void loadData();
    } catch (err) {
      setFeedback({
        message: err instanceof Error ? err.message : "Error saving package.",
        type: "error"
      });
    }
  }

  async function handleToggleActive(pkg: FixedPackageAdminItem) {
    try {
      const newActive = pkg.isActive === false;
      const res = await backendFetch(`/admin/packages/${pkg.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: newActive })
      });
      if (!res.ok) throw new Error("Failed to update status.");
      setFeedback({
        message: `Package "${pkg.name}" ${newActive ? "activated" : "deactivated"}.`,
        type: "success"
      });
      void loadData();
    } catch (err) {
      setFeedback({
        message: err instanceof Error ? err.message : "Failed to toggle status.",
        type: "error"
      });
    }
  }

  async function handleExportPackagesCsv() {
    if (packages.length === 0) {
      setFeedback({
        message: "No fixed packages available to export.",
        type: "error"
      });
      return;
    }

    setIsExporting(true);
    try {
      // First attempt server-generated CSV download
      const res = await backendFetch("/admin/packages/export");
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const dateStr = new Date().toISOString().split("T")[0];
        link.href = url;
        link.setAttribute("download", `scopex_fixed_packages_${dateStr}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setFeedback({
          message: `Successfully exported ${packages.length} fixed packages to CSV (scopex_fixed_packages_${dateStr}.csv).`,
          type: "success"
        });
        return;
      }
      throw new Error("Server export endpoint unavailable, falling back to client-side CSV generator.");
    } catch {
      // Client-side fallback generator ensuring zero failure
      try {
        const headers = [
          "Package ID",
          "Package Name",
          "Category",
          "Tagline",
          "Badge",
          "Package Type",
          "Selling Price (INR)",
          "Reference Market MRP (INR)",
          "Valid Savings (INR)",
          "Discount (%)",
          "Allow Additional Bundle Discount",
          "Included Tests Count",
          "Included Tests List",
          "Target Demographics",
          "Key Highlights",
          "Featured",
          "Catalog Status"
        ];

        const escapeCsv = (val: unknown) => {
          if (val === null || val === undefined) return '""';
          const str = String(val);
          return `"${str.replace(/"/g, '""')}"`;
        };

        const rows = packages.map((pkg) => {
          const mrp = pkg.mrp || Math.round(pkg.price * 1.5);
          const savings = mrp > pkg.price ? mrp - pkg.price : 0;
          const discount = mrp > pkg.price ? Math.round((savings / mrp) * 100) : 0;

          const testNames =
            pkg.overview && pkg.overview.length > 0
              ? pkg.overview
              : (pkg.testIds || []).map((tid) => {
                  const match = allTests.find((t) => t.id === tid);
                  return match ? match.name : tid;
                });

          return [
            escapeCsv(pkg.id),
            escapeCsv(pkg.name),
            escapeCsv(pkg.section || "Preventive Health"),
            escapeCsv(pkg.tagline || ""),
            escapeCsv(pkg.badge || ""),
            escapeCsv(pkg.packageType || "fixed"),
            escapeCsv(pkg.price),
            escapeCsv(mrp),
            escapeCsv(savings),
            escapeCsv(`${discount}%`),
            escapeCsv(pkg.allowExtraDiscount ? "Yes" : "No"),
            escapeCsv(testNames.length),
            escapeCsv(testNames.join("; ")),
            escapeCsv((pkg.bestFor || []).join("; ")),
            escapeCsv((pkg.whyPackage || []).join("; ")),
            escapeCsv(Boolean(pkg.featured) ? "Yes" : "No"),
            escapeCsv(pkg.isActive !== false ? "Active" : "Inactive")
          ].join(",");
        });

        const csvContent = "\uFEFF" + [headers.map(escapeCsv).join(","), ...rows].join("\r\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const dateStr = new Date().toISOString().split("T")[0];
        link.href = url;
        link.setAttribute("download", `scopex_fixed_packages_${dateStr}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setFeedback({
          message: `Successfully exported ${packages.length} fixed packages to CSV (scopex_fixed_packages_${dateStr}.csv).`,
          type: "success"
        });
      } catch (clientErr) {
        setFeedback({
          message: clientErr instanceof Error ? clientErr.message : "Failed to export packages to CSV.",
          type: "error"
        });
      }
    } finally {
      setIsExporting(false);
    }
  }

  // Filter tests inside modal
  const filteredModalTests = useMemo(() => {
    const q = testSearchInModal.trim().toLowerCase();
    if (!q) return allTests;
    return allTests.filter((t) => t.name.toLowerCase().includes(q) || t.id.toLowerCase().includes(q));
  }, [allTests, testSearchInModal]);

  return (
    <div className="section-wrap py-10">
      {/* Header & Navigation */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#EAEAEA] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 text-xs font-semibold text-stone-500 hover:text-[#FF6B00]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Admin Panel</span>
            </Link>
            <span className="text-xs text-stone-300">/</span>
            <span className="text-xs font-bold text-[#FF6B00]">Type 1: Fixed Packages</span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-black text-[#0D0D0D] tracking-tight">
            Fixed Packages Master
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#626262]">
            Curate included tests, set reference market price &amp; fixed selling price, and manage bundle discount eligibility.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/admin/tests" className="secondary-btn text-xs py-2 px-3">
            Go to Test Master
          </Link>
          <button
            type="button"
            onClick={handleExportPackagesCsv}
            disabled={loading || packages.length === 0 || isExporting}
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs font-bold text-stone-800 shadow-xs hover:border-[#FF6B00] hover:text-[#FF6B00] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Download full list of fixed packages as CSV report"
          >
            <Download className={`h-4 w-4 text-[#FF6B00] ${isExporting ? "animate-bounce" : ""}`} />
            <span>{isExporting ? "Exporting CSV..." : "Export Packages to CSV"}</span>
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="cta-btn text-xs py-2 px-3.5 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>New Fixed Package</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`mt-4 flex items-center justify-between rounded-xl p-4 text-xs font-semibold ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button type="button" onClick={() => setFeedback(null)} className="text-stone-400 hover:text-stone-700">
            ✕
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[#EAEAEA] bg-white p-4">
          <p className="text-[11px] font-bold uppercase text-stone-500">Total Fixed Packages</p>
          <p className="mt-1 text-2xl font-black text-[#0D0D0D] tabular-nums">{packages.length}</p>
        </div>
        <div className="rounded-xl border border-[#EAEAEA] bg-white p-4">
          <p className="text-[11px] font-bold uppercase text-emerald-700">Active in Catalog</p>
          <p className="mt-1 text-2xl font-black text-emerald-700 tabular-nums">
            {packages.filter((p) => p.isActive !== false).length}
          </p>
        </div>
        <div className="rounded-xl border border-[#EAEAEA] bg-white p-4">
          <p className="text-[11px] font-bold uppercase text-stone-500">Bundle Discount Excluded</p>
          <p className="mt-1 text-2xl font-black text-stone-700 tabular-nums">
            {packages.filter((p) => !p.allowExtraDiscount).length}
          </p>
          <p className="text-[10px] text-stone-400">Strict fixed pricing enforced</p>
        </div>
        <div className="rounded-xl border border-[#EAEAEA] bg-white p-4">
          <p className="text-[11px] font-bold uppercase text-[#FF6B00]">Extra Discount Allowed</p>
          <p className="mt-1 text-2xl font-black text-[#FF6B00] tabular-nums">
            {packages.filter((p) => p.allowExtraDiscount).length}
          </p>
          <p className="text-[10px] text-stone-400">Explicitly authorized</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search fixed packages by name, ID, or included test..."
            className="w-full rounded-xl border border-[#EAEAEA] bg-white pl-9 pr-4 py-2 text-xs text-[#0D0D0D] outline-none focus:border-[#FF6B00]"
          />
        </div>
        <select
          value={sectionFilter}
          onChange={(e) => setSectionFilter(e.target.value)}
          className="rounded-xl border border-[#EAEAEA] bg-white px-3 py-2 text-xs font-semibold text-[#0D0D0D] outline-none focus:border-[#FF6B00]"
        >
          <option value="All">All Categories</option>
          <option value="Preventive Health">Preventive Health</option>
          <option value="Stress & Lifestyle">Stress &amp; Lifestyle</option>
          <option value="Advanced & Specialized">Advanced &amp; Specialized</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="rounded-xl border border-[#EAEAEA] bg-white px-3 py-2 text-xs font-semibold text-[#0D0D0D] outline-none focus:border-[#FF6B00]"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
        <button
          type="button"
          onClick={loadData}
          className="flex items-center gap-1.5 rounded-xl border border-[#EAEAEA] bg-white px-3 py-2 text-xs font-semibold text-stone-600 hover:text-[#0D0D0D]"
          title="Refresh"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Packages Table */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-[#EAEAEA] bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FBFBFB] border-b border-[#EAEAEA] text-stone-600 uppercase tracking-wider font-bold">
              <tr>
                <th className="py-3 px-4">Package</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Selling Price</th>
                <th className="py-3 px-4">Market MRP</th>
                <th className="py-3 px-4">Valid Savings</th>
                <th className="py-3 px-4">Included Tests</th>
                <th className="py-3 px-4">Bundle Discount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEAEA]">
              {filteredPackages.map((pkg) => {
                const mrp = pkg.mrp || Math.round(pkg.price * 1.5);
                const savings = mrp > pkg.price ? mrp - pkg.price : 0;
                const savingsPercent = mrp > pkg.price ? Math.round((savings / mrp) * 100) : 0;

                return (
                  <tr key={pkg.id} className="hover:bg-[#FDFDFD] transition">
                    <td className="py-3.5 px-4 font-bold text-[#0D0D0D]">
                      <div>{pkg.name}</div>
                      <div className="text-[10px] font-normal text-stone-400">{pkg.id}</div>
                    </td>
                    <td className="py-3.5 px-4 text-stone-600">{pkg.section}</td>
                    <td className="py-3.5 px-4 font-extrabold text-[#0D0D0D] tabular-nums">
                      ₹{new Intl.NumberFormat("en-IN").format(pkg.price)}
                    </td>
                    <td className="py-3.5 px-4 text-stone-400 line-through tabular-nums">
                      ₹{new Intl.NumberFormat("en-IN").format(mrp)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700 tabular-nums">
                      ₹{new Intl.NumberFormat("en-IN").format(savings)} ({savingsPercent}%)
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 font-semibold text-stone-700">
                        <Lock className="h-3 w-3 text-stone-400" />
                        <span>{pkg.overview.length} locked tests</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {pkg.allowExtraDiscount ? (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                          Allowed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-stone-600 border border-stone-200">
                          Excluded
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {pkg.isActive !== false ? (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(pkg)}
                          className="rounded-lg p-1.5 text-stone-600 hover:bg-stone-100 hover:text-[#0D0D0D] transition"
                          title="Edit Package"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(pkg)}
                          className={`rounded-lg px-2 py-1 text-[11px] font-semibold transition ${
                            pkg.isActive !== false
                              ? "text-rose-600 hover:bg-rose-50"
                              : "text-emerald-700 hover:bg-emerald-50"
                          }`}
                        >
                          {pkg.isActive !== false ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredPackages.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-xs text-stone-500">
                    No fixed packages match your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Fixed Package Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF6B00]">Type 1: Fixed Package</span>
                <h3 className="text-lg font-black text-[#0D0D0D]">
                  {editingPkg ? `Edit ${editingPkg.name}` : "Create New Fixed Package"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-[#0D0D0D] p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              {/* Name & Category */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Package Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. HEALTH 360 ADVANCED"
                    className="w-full rounded-xl border border-[#EAEAEA] p-2.5 font-semibold text-[#0D0D0D] outline-none focus:border-[#FF6B00]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Section / Category</label>
                  <select
                    value={formData.section}
                    onChange={(e) => setFormData((prev) => ({ ...prev, section: e.target.value }))}
                    className="w-full rounded-xl border border-[#EAEAEA] p-2.5 font-semibold text-[#0D0D0D] outline-none focus:border-[#FF6B00]"
                  >
                    <option value="Preventive Health">Preventive Health</option>
                    <option value="Stress & Lifestyle">Stress &amp; Lifestyle</option>
                    <option value="Advanced & Specialized">Advanced &amp; Specialized</option>
                  </select>
                </div>
              </div>

              {/* Tagline & Badge */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Badge Tag</label>
                  <select
                    value={formData.badge}
                    onChange={(e) => setFormData((prev) => ({ ...prev, badge: e.target.value }))}
                    className="w-full rounded-xl border border-[#EAEAEA] p-2.5 font-semibold text-[#0D0D0D] outline-none focus:border-[#FF6B00]"
                  >
                    <option value="Most Popular">Most Popular</option>
                    <option value="Best Value">Best Value</option>
                    <option value="Recommended">Recommended</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Start Here">Start Here</option>
                    <option value="Specialized">Specialized</option>
                    <option value="Women Health">Women Health</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Tagline</label>
                  <input
                    type="text"
                    value={formData.tagline}
                    onChange={(e) => setFormData((prev) => ({ ...prev, tagline: e.target.value }))}
                    placeholder="e.g. Complete Annual Health Check"
                    className="w-full rounded-xl border border-[#EAEAEA] p-2.5 text-[#0D0D0D] outline-none focus:border-[#FF6B00]"
                  />
                </div>
              </div>

              {/* Pricing & Auto-Calculated Savings */}
              <div className="rounded-xl border border-[#EAEAEA] bg-[#FBFBFB] p-4 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      Fixed Selling Price (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={formData.price}
                      onChange={(e) => setFormData((prev) => ({ ...prev, price: Number(e.target.value) }))}
                      className="w-full rounded-xl border border-[#EAEAEA] bg-white p-2.5 font-bold text-[#0D0D0D] outline-none focus:border-[#FF6B00]"
                    />
                    <p className="mt-1 text-[10px] text-stone-400">Fixed price paid by customer</p>
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      Reference Market Price MRP (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={formData.mrp}
                      onChange={(e) => setFormData((prev) => ({ ...prev, mrp: Number(e.target.value) }))}
                      className="w-full rounded-xl border border-[#EAEAEA] bg-white p-2.5 font-bold text-[#0D0D0D] outline-none focus:border-[#FF6B00]"
                    />
                    <p className="mt-1 text-[10px] text-stone-400">Reference individual lab price</p>
                  </div>
                </div>

                {/* Automated Savings Display */}
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-center">
                  <span className="text-[11px] font-bold text-emerald-800">
                    Automatic Savings: ₹{new Intl.NumberFormat("en-IN").format(liveSavingsAmount)} ({liveSavingsPercent}% Off)
                  </span>
                </div>
              </div>

              {/* Bundle Discount Permission (Strict Admin Control) */}
              <div className="rounded-xl border border-stone-200 p-3.5 bg-white">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.allowExtraDiscount}
                    onChange={(e) => setFormData((prev) => ({ ...prev, allowExtraDiscount: e.target.checked }))}
                    className="mt-0.5 rounded text-[#FF6B00] focus:ring-[#FF6B00]"
                  />
                  <div>
                    <span className="font-bold text-[#0D0D0D]">
                      Allow Additional Bundle Discount at Checkout
                    </span>
                    <p className="text-[11px] text-stone-500 leading-relaxed mt-0.5">
                      Rule requirement: By default, fixed packages have built-in package savings and do NOT apply extra bundle discounts. Check this only if you explicitly authorize additional bundle discounting for this package.
                    </p>
                  </div>
                </label>
              </div>

              {/* Test Selection from Test Master */}
              <div className="rounded-xl border border-[#EAEAEA] p-4 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#0D0D0D]">
                    Included Tests ({formData.selectedTestIds.length} Selected) *
                  </label>
                  <span className="text-[11px] text-stone-400">Customer cannot edit these tests</span>
                </div>

                <input
                  type="text"
                  value={testSearchInModal}
                  onChange={(e) => setTestSearchInModal(e.target.value)}
                  placeholder="Filter available tests to include..."
                  className="w-full rounded-xl border border-[#EAEAEA] bg-[#FBFBFB] p-2 text-xs text-[#0D0D0D] outline-none focus:border-[#FF6B00]"
                />

                <div className="max-h-48 overflow-y-auto space-y-1.5 border border-[#EAEAEA] rounded-xl p-2 bg-[#FAFAFA]">
                  {filteredModalTests.map((test) => {
                    const isSelected = formData.selectedTestIds.includes(test.id);
                    return (
                      <label
                        key={test.id}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                          isSelected ? "bg-[#FFF4E8] text-[#0D0D0D]" : "hover:bg-white text-stone-600"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleTestInModal(test.id)}
                            className="text-[#FF6B00] focus:ring-[#FF6B00]"
                          />
                          <span className="font-semibold truncate">{test.name}</span>
                        </div>
                        <span className="text-[11px] font-bold text-stone-500 shrink-0 ml-2">
                          ₹{test.price}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pkgActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded text-[#FF6B00] focus:ring-[#FF6B00]"
                />
                <label htmlFor="pkgActive" className="font-bold text-stone-700 cursor-pointer">
                  Active (visible on customer website)
                </label>
              </div>

              {/* Modal Actions */}
              <div className="mt-5 flex items-center justify-end gap-2 border-t border-[#EAEAEA] pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="secondary-btn text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cta-btn text-xs py-2 px-5 cursor-pointer"
                >
                  {editingPkg ? "Save Changes" : "Create Package"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
