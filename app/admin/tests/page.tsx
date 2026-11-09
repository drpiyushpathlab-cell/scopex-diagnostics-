"use client";

import { useEffect, useState } from "react";
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
  MapPin,
  Clock,
  Droplet,
  Tag,
  Sliders,
  Sparkles,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  FileSpreadsheet,
  Upload,
  Download,
  FileText,
  AlertTriangle
} from "lucide-react";

type DiagnosticTest = {
  id: string;
  code?: string;
  name: string;
  slug?: string;
  price: number;
  mrp?: number;
  discount?: number;
  discountCapPercent?: number;
  discountCapRupees?: number;
  isBundleEligible?: boolean;
  category: string;
  group: string;
  components?: string[];
  specimenType?: string;
  preparation?: string;
  fastingHours?: string;
  tat?: string;
  isActive?: boolean;
  seoTitle?: string;
  seoDescription?: string;
};

type BundleDiscountSlab = {
  id: string;
  title: string;
  criteriaType: "test_count" | "spend";
  minCount?: number;
  maxCount?: number;
  minSpend?: number;
  maxSpend?: number;
  discountType: "percent" | "fixed";
  value: number;
  active: boolean;
  priority?: number;
};

type CategoryItem = {
  id: string;
  slug: string;
  name: string;
  sort_order: number;
  active: boolean;
};

type ServiceArea = {
  id: string;
  pincode: string;
  city: string;
  area: string;
  home_collection_enabled: boolean;
  centre_visit_enabled: boolean;
  collection_charge: number;
  minimum_order_value: number;
  active: boolean;
};

export default function AdminTestsManagementPage() {
  return (
    <AdminSessionGuard>
      <AdminTestsContent />
    </AdminSessionGuard>
  );
}

function AdminTestsContent() {
  const [activeTab, setActiveTab] = useState<"tests" | "bundle-slabs" | "categories" | "serviceability">("tests");
  const [tests, setTests] = useState<DiagnosticTest[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>([]);
  const [bundleSlabs, setBundleSlabs] = useState<BundleDiscountSlab[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Bundle Slabs Modal State
  const [isSlabModalOpen, setIsSlabModalOpen] = useState(false);
  const [editingSlab, setEditingSlab] = useState<BundleDiscountSlab | null>(null);
  const [slabForm, setSlabForm] = useState<{
    title: string;
    criteriaType: "test_count" | "spend";
    minCount: number;
    maxCount: number | "";
    minSpend: number;
    maxSpend: number | "";
    discountType: "percent" | "fixed";
    value: number;
    active: boolean;
  }>({
    title: "",
    criteriaType: "test_count",
    minCount: 2,
    maxCount: "",
    minSpend: 2000,
    maxSpend: "",
    discountType: "percent",
    value: 5,
    active: true
  });

  // Search & Filter state for Tests
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Modal State for Test
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<DiagnosticTest | null>(null);
  const [testForm, setTestForm] = useState<{
    name: string;
    code: string;
    slug: string;
    price: number;
    mrp: number;
    discountCapPercent: number;
    discountCapRupees: number;
    isBundleEligible: boolean;
    category: string;
    group: string;
    specimenType: string;
    fastingHours: string;
    preparation: string;
    tat: string;
    componentsText: string;
    seoTitle: string;
    seoDescription: string;
    isActive: boolean;
  }>({
    name: "",
    code: "",
    slug: "",
    price: 300,
    mrp: 500,
    discountCapPercent: 20,
    discountCapRupees: 50,
    isBundleEligible: true,
    category: "Blood",
    group: "Basic Tests",
    specimenType: "Whole Blood EDTA",
    fastingHours: "No fasting required",
    preparation: "Standard hydration before collection.",
    tat: "12-24 Hrs",
    componentsText: "",
    seoTitle: "",
    seoDescription: "",
    isActive: true
  });

  // Category Form State
  const [newCatName, setNewCatName] = useState("");
  const [newCatOrder, setNewCatOrder] = useState(10);

  // Service Area Modal State
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
  const [areaForm, setAreaForm] = useState({
    city: "Indore",
    pincode: "",
    area: "",
    home_collection_enabled: true,
    centre_visit_enabled: true,
    collection_charge: 99,
    minimum_order_value: 600
  });

  // CSV Bulk Upload State
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvInputTab, setCsvInputTab] = useState<"file" | "paste">("file");
  const [csvRawText, setCsvRawText] = useState("");
  const [csvFileName, setCsvFileName] = useState("");
  const [isUploadingCsv, setIsUploadingCsv] = useState(false);
  const [parsedCsvRecords, setParsedCsvRecords] = useState<
    Array<{
      id: string;
      name: string;
      slug: string;
      price: number;
      mrp: number;
      discountCapPercent: number;
      category: string;
      group: string;
      specimenType: string;
      fastingHours: string;
      preparation: string;
      tat: string;
      components: string[];
      isActive: boolean;
      seoTitle: string;
      seoDescription: string;
      isExisting: boolean;
      isValid: boolean;
      errorMessage?: string;
    }>
  >([]);

  function downloadCsvTemplate() {
    const templateContent = [
      "code,name,category,group,price,mrp,discountCapPercent,specimenType,fastingHours,preparation,tat,components,isActive,seoTitle,seoDescription",
      'cbc,Complete Blood Count (CBC),Blood,Basic Tests,350,550,20,Whole Blood EDTA,No fasting required,Stay well hydrated before collection,12-24 Hrs,"Hemoglobin; WBC; RBC; Platelets; Neutrophils",true,Complete Blood Count Test at Home | ScopeX Diagnostics,Book Complete Blood Count test with certified NABL lab processing.',
      'lipid-profile,Lipid Profile - Comprehensive,Blood,Basic Tests,650,1100,25,Blood Serum,10-12 hours overnight fasting,Do not consume high-fat meal on previous night,12-24 Hrs,"Total Cholesterol; HDL; LDL; VLDL; Triglycerides",true,Lipid Profile Test at Home | ScopeX Diagnostics,Complete cholesterol screening with accurate lipid breakdown.',
      'thyroid-profile,Thyroid Profile Total (T3-T4-TSH),Thyroid,Basic Tests,450,800,20,Blood Serum,No fasting required,Standard morning collection recommended,12-24 Hrs,"Total T3; Total T4; TSH Ultra",true,Thyroid Profile Test at Home | ScopeX Diagnostics,Accurate thyroid hormone screening for metabolism and energy balance.',
      'lft,Liver Function Test (LFT),Liver,Basic Tests,750,1300,20,Blood Serum,8 hours fasting,Avoid alcohol for 24 hours prior to test,12-24 Hrs,"SGOT; SGPT; Bilirubin; Alkaline Phosphatase",true,Liver Function Test at Home | ScopeX Diagnostics,Comprehensive liver enzyme and protein diagnostic evaluation.',
      'fasting-blood-sugar,Fasting Blood Sugar (FBS),Diabetes,Basic Tests,120,200,15,Fluoride Plasma,8-10 hours fasting,Water is permitted during the fasting interval,6-12 Hrs,"Glucose Fasting",true,Fasting Blood Sugar Test at Home | ScopeX Diagnostics,Accurate blood glucose evaluation for diabetic screening.'
    ].join("\n");

    const blob = new Blob([templateContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "scopex_diagnostic_tests_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function parseCsvString(csvString: string) {
    if (!csvString.trim()) {
      setParsedCsvRecords([]);
      return;
    }

    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = "";
    let insideQuotes = false;

    for (let i = 0; i < csvString.length; i++) {
      const char = csvString[i];
      const nextChar = csvString[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          currentField += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === "," && !insideQuotes) {
        currentRow.push(currentField.trim());
        currentField = "";
      } else if ((char === "\r" || char === "\n") && !insideQuotes) {
        if (char === "\r" && nextChar === "\n") i++;
        currentRow.push(currentField.trim());
        currentField = "";
        if (currentRow.some((f) => f.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
      } else {
        currentField += char;
      }
    }

    if (currentField || currentRow.length > 0) {
      currentRow.push(currentField.trim());
      if (currentRow.some((f) => f.length > 0)) {
        rows.push(currentRow);
      }
    }

    if (rows.length < 2) {
      setParsedCsvRecords([]);
      return;
    }

    const headers = rows[0].map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));
    const records = [];

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      const map: Record<string, string> = {};
      headers.forEach((h, idx) => {
        map[h] = row[idx] || "";
      });

      const name = (map.name || map.testname || "").trim();
      const rawPrice = map.price || map.realprice || map.sellingprice;
      const price = Number(rawPrice);
      const rawCode = (map.code || map.id || map.slug || "").trim();
      const slug = rawCode
        ? rawCode.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
        : name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      const id = rawCode || slug;

      const existing = tests.find(
        (t) => (t.slug && t.slug === slug) || t.id.toLowerCase() === id.toLowerCase() || t.name.toLowerCase() === name.toLowerCase()
      );

      const rawMrp = map.mrp || map.referenceprice || map.pricemrp;
      const mrp = Number(rawMrp) && Number(rawMrp) >= price ? Number(rawMrp) : Math.round((price || 300) * 1.5);
      const rawCap = map.discountcappercent || map.discountcap || map.cap;
      const discountCapPercent = rawCap && !isNaN(Number(rawCap)) ? Math.min(100, Math.max(0, Number(rawCap))) : (existing?.discountCapPercent ?? 20);

      const components = map.components
        ? map.components.split(/[,;|]/).map((c) => c.trim()).filter(Boolean)
        : existing?.components || [name];

      const rawActive = map.isactive || map.active;
      const isActive = rawActive ? (rawActive.toLowerCase() === "true" || rawActive.toLowerCase() === "yes" || rawActive === "1") : (existing?.isActive !== false);

      let isValid = true;
      let errorMessage = "";
      if (!name) {
        isValid = false;
        errorMessage = "Missing test name";
      } else if (isNaN(price) || price < 0) {
        isValid = false;
        errorMessage = "Invalid selling price";
      }

      records.push({
        id,
        name,
        slug,
        price: isNaN(price) ? 0 : price,
        mrp,
        discountCapPercent,
        category: map.category || existing?.category || "Blood",
        group: map.group || existing?.group || "Basic Tests",
        specimenType: map.specimentype || map.sampletype || existing?.specimenType || "Blood Serum",
        fastingHours: map.fastinghours || map.fasting || existing?.fastingHours || "No fasting required",
        preparation: map.preparation || map.preparationinstructions || existing?.preparation || "Standard hydration before collection.",
        tat: map.tat || map.tathours || existing?.tat || "12-24 Hrs",
        components,
        isActive,
        seoTitle: map.seotitle || existing?.seoTitle || `${name} at Home | ScopeX Diagnostics`,
        seoDescription: map.seodescription || existing?.seoDescription || `Book ${name} with ScopeX Diagnostics with home sample collection.`,
        isExisting: Boolean(existing),
        isValid,
        errorMessage
      });
    }

    setParsedCsvRecords(records);
  }

  function handleCsvFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = String(event.target?.result || "");
      setCsvRawText(text);
      parseCsvString(text);
    };
    reader.readAsText(file);
  }

  async function handleBulkImportSubmit() {
    const validRows = parsedCsvRecords.filter((r) => r.isValid);
    if (validRows.length === 0) {
      notify("No valid test records to import.", "error");
      return;
    }

    setIsUploadingCsv(true);
    try {
      const res = await backendFetch("/admin/tests/bulk-upload", {
        method: "POST",
        body: JSON.stringify(validRows)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to bulk upload tests.");

      notify(`Bulk upload complete! ${data.createdCount} created, ${data.updatedCount} updated.`);
      setIsCsvModalOpen(false);
      setParsedCsvRecords([]);
      setCsvRawText("");
      setCsvFileName("");
      await loadData();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Error processing bulk CSV upload.", "error");
    } finally {
      setIsUploadingCsv(false);
    }
  }

  async function loadData() {
    setLoading(true);
    try {
      const [testsRes, catRes, areasRes, slabsRes] = await Promise.all([
        backendFetch("/admin/tests"),
        backendFetch("/admin/categories"),
        backendFetch("/admin/service-areas"),
        backendFetch("/admin/bundle-slabs")
      ]);

      if (testsRes.ok) {
        const data = await testsRes.json();
        setTests(data.tests || []);
      }
      if (catRes.ok) {
        const data = await catRes.json();
        setCategories(data.categories || []);
      }
      if (areasRes.ok) {
        const data = await areasRes.json();
        setServiceAreas(data.areas || []);
      }
      if (slabsRes.ok) {
        const data = await slabsRes.json();
        setBundleSlabs(data.slabs || []);
      }
    } catch (err) {
      setFeedback({
        message: err instanceof Error ? err.message : "Failed to load test master data.",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  function notify(message: string, type: "success" | "error" = "success") {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  }

  // Open Add Test Modal
  function handleOpenAddTest() {
    setEditingTest(null);
    setTestForm({
      name: "",
      code: "",
      slug: "",
      price: 350,
      mrp: 600,
      discountCapPercent: 20,
      discountCapRupees: 50,
      isBundleEligible: true,
      category: "Blood",
      group: "Basic Tests",
      specimenType: "Whole Blood EDTA",
      fastingHours: "No fasting required",
      preparation: "Stay hydrated with plain water before phlebotomist arrival.",
      tat: "12-24 Hrs",
      componentsText: "",
      seoTitle: "",
      seoDescription: "",
      isActive: true
    });
    setIsTestModalOpen(true);
  }

  // Open Edit Test Modal
  function handleOpenEditTest(test: DiagnosticTest) {
    setEditingTest(test);
    setTestForm({
      name: test.name,
      code: test.code || test.id || "",
      slug: test.slug || test.id,
      price: test.price,
      mrp: test.mrp || Math.round(test.price * 1.5),
      discountCapPercent: test.discountCapPercent ?? 20,
      discountCapRupees: test.discountCapRupees ?? 50,
      isBundleEligible: test.isBundleEligible !== false,
      category: test.category || "Blood",
      group: test.group || "Basic Tests",
      specimenType: test.specimenType || "Whole Blood EDTA",
      fastingHours: test.fastingHours || "No fasting required",
      preparation: test.preparation || "",
      tat: test.tat || "12-24 Hrs",
      componentsText: (test.components || []).join(", "),
      seoTitle: test.seoTitle || "",
      seoDescription: test.seoDescription || "",
      isActive: test.isActive !== false
    });
    setIsTestModalOpen(true);
  }

  // Submit Add or Edit Test
  async function handleSaveTest(e: React.FormEvent) {
    e.preventDefault();
    if (!testForm.name.trim()) {
      notify("Test name is required.", "error");
      return;
    }
    if (testForm.price <= 0) {
      notify("Please specify a valid selling price greater than 0.", "error");
      return;
    }

    const components = testForm.componentsText
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);

    const payload = {
      name: testForm.name.trim(),
      code: testForm.code.trim() || undefined,
      slug: testForm.slug.trim() || undefined,
      price: Number(testForm.price),
      mrp: Number(testForm.mrp) || Math.round(Number(testForm.price) * 1.4),
      discountCapPercent: Number(testForm.discountCapPercent),
      discountCapRupees: Number(testForm.discountCapRupees),
      isBundleEligible: Boolean(testForm.isBundleEligible),
      category: testForm.category,
      group: testForm.group,
      specimenType: testForm.specimenType,
      fastingHours: testForm.fastingHours,
      preparation: testForm.preparation,
      tat: testForm.tat,
      components: components.length > 0 ? components : [testForm.name.trim()],
      seoTitle: testForm.seoTitle,
      seoDescription: testForm.seoDescription,
      isActive: testForm.isActive
    };

    try {
      if (editingTest) {
        // Edit
        const res = await backendFetch(`/admin/tests/${editingTest.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to update test.");

        setTests((prev) => prev.map((t) => (t.id === editingTest.id ? data.test : t)));
        notify(`Updated test "${data.test.name}" successfully! Historical booking prices are preserved.`);
      } else {
        // Create
        const res = await backendFetch("/admin/tests", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to create test.");

        setTests((prev) => [data.test, ...prev]);
        notify(`Created test "${data.test.name}" successfully.`);
      }
      setIsTestModalOpen(false);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Error saving test.", "error");
    }
  }

  // Bundle Slabs Handlers
  function handleOpenAddSlab() {
    setEditingSlab(null);
    setSlabForm({
      title: "",
      criteriaType: "test_count",
      minCount: 2,
      maxCount: "",
      minSpend: 2000,
      maxSpend: "",
      discountType: "percent",
      value: 5,
      active: true
    });
    setIsSlabModalOpen(true);
  }

  function handleOpenEditSlab(slab: BundleDiscountSlab) {
    setEditingSlab(slab);
    setSlabForm({
      title: slab.title,
      criteriaType: slab.criteriaType || "test_count",
      minCount: slab.minCount ?? 2,
      maxCount: slab.maxCount ?? "",
      minSpend: slab.minSpend ?? 2000,
      maxSpend: slab.maxSpend ?? "",
      discountType: slab.discountType || "percent",
      value: slab.value,
      active: slab.active !== false
    });
    setIsSlabModalOpen(true);
  }

  async function handleToggleSlabActive(slab: BundleDiscountSlab) {
    const nextStatus = !slab.active;
    try {
      const res = await backendFetch(`/admin/bundle-slabs/${slab.id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: nextStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update slab status.");

      setBundleSlabs((prev) => prev.map((s) => (s.id === slab.id ? { ...s, active: nextStatus } : s)));
      notify(`Slab "${slab.title}" marked as ${nextStatus ? "Active" : "Inactive"}.`);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Error updating slab status.", "error");
    }
  }

  async function handleSaveSlab(e: React.FormEvent) {
    e.preventDefault();
    if (!slabForm.title.trim()) {
      notify("Slab title is required.", "error");
      return;
    }
    if (slabForm.value <= 0) {
      notify("Discount value must be greater than 0.", "error");
      return;
    }

    const payload = {
      title: slabForm.title.trim(),
      criteriaType: slabForm.criteriaType,
      minCount: slabForm.criteriaType === "test_count" ? Number(slabForm.minCount) : undefined,
      maxCount: slabForm.criteriaType === "test_count" && slabForm.maxCount !== "" ? Number(slabForm.maxCount) : undefined,
      minSpend: slabForm.criteriaType === "spend" ? Number(slabForm.minSpend) : undefined,
      maxSpend: slabForm.criteriaType === "spend" && slabForm.maxSpend !== "" ? Number(slabForm.maxSpend) : undefined,
      discountType: slabForm.discountType,
      value: Number(slabForm.value),
      active: slabForm.active
    };

    try {
      if (editingSlab) {
        const res = await backendFetch(`/admin/bundle-slabs/${editingSlab.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to update slab.");

        setBundleSlabs((prev) => prev.map((s) => (s.id === editingSlab.id ? data.slab : s)));
        notify(`Updated bundle slab "${data.slab.title}" successfully!`);
      } else {
        const res = await backendFetch("/admin/bundle-slabs", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to create slab.");

        setBundleSlabs((prev) => [...prev, data.slab]);
        notify(`Created bundle slab "${data.slab.title}" successfully!`);
      }
      setIsSlabModalOpen(false);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Error saving slab.", "error");
    }
  }

  async function handleDeleteSlab(id: string) {
    if (!confirm("Are you sure you want to delete this bundle slab?")) return;
    try {
      const res = await backendFetch(`/admin/bundle-slabs/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to delete slab.");
      }
      setBundleSlabs((prev) => prev.filter((s) => s.id !== id));
      notify("Bundle discount slab deleted.");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Error deleting slab.", "error");
    }
  }

  async function handleResetSlabs() {
    if (!confirm("Reset all bundle slabs to default standard percentages (2 tests: 5%, 3-4 tests: 8%, 5+ tests: 12%)?")) return;
    try {
      const res = await backendFetch("/admin/bundle-slabs/reset", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reset slabs.");
      setBundleSlabs(data.slabs || []);
      notify("Reset to default configurable bundle slabs.");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Error resetting slabs.", "error");
    }
  }

  // Quick toggle active / inactive
  async function handleToggleStatus(test: DiagnosticTest) {
    const nextStatus = !test.isActive;
    try {
      const res = await backendFetch(`/admin/tests/${test.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: nextStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update status.");

      setTests((prev) => prev.map((t) => (t.id === test.id ? { ...t, isActive: nextStatus } : t)));
      notify(`Test "${test.name}" marked as ${nextStatus ? "Active" : "Inactive"}.`);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Error updating status.", "error");
    }
  }

  // Add Category
  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      const res = await backendFetch("/admin/categories", {
        method: "POST",
        body: JSON.stringify({ name: newCatName.trim(), sort_order: Number(newCatOrder) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to add category.");

      setCategories((prev) => [...prev, data.category]);
      setNewCatName("");
      notify(`Category "${data.category.name}" added successfully.`);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Error creating category.", "error");
    }
  }

  // Add Service Area
  async function handleSaveArea(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(areaForm.pincode.trim())) {
      notify("PIN code must be a valid 6-digit numeric postal code.", "error");
      return;
    }

    try {
      const res = await backendFetch("/admin/service-areas", {
        method: "POST",
        body: JSON.stringify(areaForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to add service area.");

      setServiceAreas((prev) => [data.area, ...prev]);
      setIsAreaModalOpen(false);
      setAreaForm({
        city: "Indore",
        pincode: "",
        area: "",
        home_collection_enabled: true,
        centre_visit_enabled: true,
        collection_charge: 99,
        minimum_order_value: 600
      });
      notify(`Service area for PIN ${data.area.pincode} (${data.area.city}) configured.`);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Error adding service area.", "error");
    }
  }

  // Toggle Home Collection on Service Area
  async function handleToggleAreaHomeCollection(area: ServiceArea) {
    const nextVal = !area.home_collection_enabled;
    try {
      const res = await backendFetch(`/admin/service-areas/${area.id}`, {
        method: "PATCH",
        body: JSON.stringify({ home_collection_enabled: nextVal })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update service area.");

      setServiceAreas((prev) =>
        prev.map((a) => (a.id === area.id ? { ...a, home_collection_enabled: nextVal } : a))
      );
      notify(`Home collection for PIN ${area.pincode} set to ${nextVal ? "Enabled" : "Disabled"}.`);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Error updating service area.", "error");
    }
  }

  // Filtered Tests
  const filteredTests = tests.filter((t) => {
    const matchesSearch =
      !searchQuery.trim() ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.components || []).some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      categoryFilter === "All" || t.category.toLowerCase() === categoryFilter.toLowerCase();

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && t.isActive !== false) ||
      (statusFilter === "inactive" && t.isActive === false);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#F7F7F7] p-4 sm:p-6 lg:p-10">
      <div className="mx-auto max-w-7xl">
        {/* Top Header & Navigation */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Link
                href="/admin/dashboard"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#FF6B00] hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Admin Dashboard</span>
              </Link>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-black text-[#0D0D0D] tracking-tight">
              Test Master & Service Management
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#626262]">
              Configure diagnostic tests, reference prices, discount caps, clinical parameters, and city-wise serviceability.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadData}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#EAEAEA] bg-white px-3.5 py-2 text-xs font-bold text-[#0D0D0D] shadow-xs hover:border-[#FF6B00]"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-[#FF6B00] ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
            {activeTab === "tests" ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCsvModalOpen(true);
                    setParsedCsvRecords([]);
                    setCsvRawText("");
                    setCsvFileName("");
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs font-bold text-stone-800 shadow-xs hover:border-[#FF6B00] hover:text-[#FF6B00] transition cursor-pointer"
                >
                  <FileSpreadsheet className="h-4 w-4 text-[#FF6B00]" />
                  <span>Bulk CSV Upload</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenAddTest}
                  className="cta-btn text-xs font-bold flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add New Test</span>
                </button>
              </div>
            ) : activeTab === "bundle-slabs" ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetSlabs}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs font-bold text-stone-800 shadow-xs hover:border-[#FF6B00] hover:text-[#FF6B00] transition cursor-pointer"
                  title="Reset to default configurable slabs (2 tests: 5%, 3-4 tests: 8%, 5+ tests: 12%)"
                >
                  <RefreshCw className="h-4 w-4 text-[#FF6B00]" />
                  <span>Reset Slabs</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenAddSlab}
                  className="cta-btn text-xs font-bold flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Discount Slab</span>
                </button>
              </div>
            ) : activeTab === "serviceability" ? (
              <button
                type="button"
                onClick={() => setIsAreaModalOpen(true)}
                className="cta-btn text-xs font-bold flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>Add PIN Code</span>
              </button>
            ) : null}
          </div>
        </div>

        {/* Global Feedback Alert */}
        {feedback ? (
          <div
            className={`mt-4 rounded-xl p-3.5 text-xs font-semibold flex items-center gap-2 ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                : "bg-red-50 text-red-900 border border-red-200"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <span>{feedback.message}</span>
          </div>
        ) : null}

        {/* Tab Selection */}
        <div className="mt-6 flex items-center gap-2 border-b border-[#EAEAEA] pb-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("tests")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === "tests"
                ? "bg-[#0D0D0D] text-white shadow-xs"
                : "bg-white text-[#626262] hover:text-[#0D0D0D] border border-[#EAEAEA]"
            }`}
          >
            Diagnostic Tests Master ({tests.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("bundle-slabs")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === "bundle-slabs"
                ? "bg-[#0D0D0D] text-white shadow-xs"
                : "bg-white text-[#626262] hover:text-[#0D0D0D] border border-[#EAEAEA]"
            }`}
          >
            Bundle Discount Slabs ({bundleSlabs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("categories")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === "categories"
                ? "bg-[#0D0D0D] text-white shadow-xs"
                : "bg-white text-[#626262] hover:text-[#0D0D0D] border border-[#EAEAEA]"
            }`}
          >
            Categories & Parameters ({categories.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("serviceability")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === "serviceability"
                ? "bg-[#0D0D0D] text-white shadow-xs"
                : "bg-white text-[#626262] hover:text-[#0D0D0D] border border-[#EAEAEA]"
            }`}
          >
            Service Availability ({serviceAreas.length} PINs)
          </button>
        </div>

        {/* TAB 1: DIAGNOSTIC TESTS MASTER */}
        {activeTab === "tests" ? (
          <div className="mt-6 space-y-4">
            {/* Filter Bar */}
            <div className="rounded-2xl border border-[#EAEAEA] bg-white p-4 shadow-xs">
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A8A8A]" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by test name, code, biomarker, or keyword..."
                    className="w-full rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] pl-10 pr-4 py-2 text-xs sm:text-sm font-semibold text-[#0D0D0D] focus:border-[#FF6B00] focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="rounded-xl border border-[#EAEAEA] bg-white px-3 py-2 text-xs font-semibold text-[#0D0D0D] focus:border-[#FF6B00]"
                  >
                    <option value="All">All Categories</option>
                    <option value="Blood">Blood</option>
                    <option value="Hormone">Hormone</option>
                    <option value="Profile">Profile</option>
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="rounded-xl border border-[#EAEAEA] bg-white px-3 py-2 text-xs font-semibold text-[#0D0D0D] focus:border-[#FF6B00]"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tests Master Table */}
            <div className="overflow-hidden rounded-2xl border border-[#EAEAEA] bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[#EAEAEA] bg-[#F7F7F7] text-[11px] font-bold uppercase tracking-wider text-[#626262]">
                    <tr>
                      <th className="px-4 py-3.5">Test / Slug</th>
                      <th className="px-4 py-3.5">Category & Group</th>
                      <th className="px-4 py-3.5">Real Selling Price</th>
                      <th className="px-4 py-3.5">Ref. MRP / Savings</th>
                      <th className="px-4 py-3.5">Discount Cap</th>
                      <th className="px-4 py-3.5">Specimen & Fasting</th>
                      <th className="px-4 py-3.5">TAT</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAEAEA]">
                    {filteredTests.map((test) => {
                      const isActive = test.isActive !== false;
                      const mrp = test.mrp || Math.round(test.price * 1.5);
                      const savings = Math.max(0, mrp - test.price);
                      const savingsPercent = Math.round((savings / mrp) * 100);

                      return (
                        <tr
                          key={test.id}
                          className={`hover:bg-[#FFFDFB] transition-colors ${
                            !isActive ? "opacity-60 bg-stone-50" : ""
                          }`}
                        >
                          <td className="px-4 py-3.5">
                            <p className="font-bold text-[#0D0D0D] text-sm">{test.name}</p>
                            <p className="text-[10px] text-[#8A8A8A] font-mono mt-0.5">/{test.slug || test.id}</p>
                            {test.components && test.components.length > 0 ? (
                              <p className="text-[10px] text-[#FF6B00] font-semibold mt-0.5">
                                {test.components.length} parameters configured
                              </p>
                            ) : null}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="rounded-md bg-[#FFF4E8] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#FF6B00]">
                              {test.category}
                            </span>
                            <p className="mt-1 text-[11px] text-[#626262] font-medium">{test.group}</p>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="text-sm font-black text-[#0D0D0D]">₹{test.price}</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="text-xs text-[#8A8A8A] line-through font-semibold">₹{mrp}</p>
                            <p className="text-[10px] font-bold text-emerald-700">
                              Save ₹{savings} ({savingsPercent}%)
                            </p>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-[#0D0D0D] block w-fit">
                              Cap: {test.discountCapPercent ?? 20}%
                              {test.discountCapRupees ? ` / ₹${test.discountCapRupees}` : ""}
                            </span>
                            <span
                              className={`mt-1 inline-block text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                                test.isBundleEligible !== false
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-stone-100 text-stone-500"
                              }`}
                            >
                              {test.isBundleEligible !== false ? "✓ Bundle Eligible" : "✗ Ineligible"}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="text-[11px] font-semibold text-[#0D0D0D]">{test.specimenType || "Blood"}</p>
                            <p className="text-[10px] text-[#626262]">{test.fastingHours || "No Fasting"}</p>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="text-[11px] font-medium text-[#626262]">{test.tat || "12-24 Hrs"}</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(test)}
                              className={`cursor-pointer inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                isActive
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                  : "bg-stone-100 text-stone-600 border border-stone-200"
                              }`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-600" : "bg-stone-400"}`} />
                              <span>{isActive ? "Active" : "Inactive"}</span>
                            </button>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditTest(test)}
                                className="rounded-lg border border-[#EAEAEA] bg-white p-1.5 text-[#0D0D0D] hover:border-[#FF6B00] hover:text-[#FF6B00] transition"
                                title="Edit Test Details & Pricing"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(test)}
                                className="rounded-lg border border-[#EAEAEA] bg-white p-1.5 text-stone-500 hover:border-red-500 hover:text-red-500 transition"
                                title={isActive ? "Deactivate Test" : "Activate Test"}
                              >
                                {isActive ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filteredTests.length === 0 ? (
                <div className="p-10 text-center">
                  <p className="text-sm font-bold text-[#0D0D0D]">No diagnostic tests found</p>
                  <p className="mt-1 text-xs text-[#626262]">Try modifying your search or filter criteria.</p>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* TAB: BUNDLE DISCOUNT SLABS */}
        {activeTab === "bundle-slabs" ? (
          <div className="mt-6 space-y-6">
            {/* Rules Info Banner */}
            <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-5 shadow-xs">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-[#FF6B00] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                      ScopeX Engine
                    </span>
                    <h3 className="text-base font-bold text-[#0D0D0D]">Configurable Bundle Discount Slabs</h3>
                  </div>
                  <p className="mt-1 text-xs text-[#626262] max-w-3xl">
                    Configure progressive discount slabs based on eligible test count or cart spend.
                    The pricing engine strictly applies the <strong>highest eligible slab</strong> by default (not cumulative) and enforces each test&apos;s configured discount caps separately (lower of % and ₹ cap).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenAddSlab}
                  className="cta-btn text-xs font-bold flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Slab</span>
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                <div className="rounded-xl bg-white p-3 border border-amber-200/80">
                  <p className="font-bold text-[#0D0D0D]">Rule 1: Highest Eligible</p>
                  <p className="text-[#626262] mt-0.5 text-[11px]">Single best slab applied, never cumulative stacking.</p>
                </div>
                <div className="rounded-xl bg-white p-3 border border-amber-200/80">
                  <p className="font-bold text-[#0D0D0D]">Rule 2 &amp; 3: Lower Cap Enforced</p>
                  <p className="text-[#626262] mt-0.5 text-[11px]">Enforces lower of % and ₹ cap separately per test.</p>
                </div>
                <div className="rounded-xl bg-white p-3 border border-amber-200/80">
                  <p className="font-bold text-[#0D0D0D]">Rule 4 &amp; 5: Duplicate Prevention</p>
                  <p className="text-[#626262] mt-0.5 text-[11px]">Prevents duplicate discounts across packages &amp; coupons.</p>
                </div>
                <div className="rounded-xl bg-white p-3 border border-amber-200/80">
                  <p className="font-bold text-[#0D0D0D]">Rule 6: Fixed Packages Isolated</p>
                  <p className="text-[#626262] mt-0.5 text-[11px]">Fixed packages use fixed selling price by default.</p>
                </div>
              </div>
            </div>

            {/* Slabs Table */}
            <div className="rounded-2xl border border-[#EAEAEA] bg-white shadow-xs overflow-hidden">
              <div className="border-b border-[#EAEAEA] px-5 py-4 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-[#0D0D0D] text-sm">Active &amp; Inactive Bundle Slabs ({bundleSlabs.length})</h4>
                  <p className="text-xs text-[#626262]">Configured discount thresholds for multi-test home collection orders</p>
                </div>
                <button
                  type="button"
                  onClick={handleResetSlabs}
                  className="text-xs font-bold text-[#FF6B00] hover:underline cursor-pointer"
                >
                  Reset to Standard Examples (2 tests: 5%, 3-4 tests: 8%, 5+ tests: 12%)
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F7F7F7] font-bold text-[#626262]">
                    <tr>
                      <th className="px-5 py-3.5">Slab Name</th>
                      <th className="px-5 py-3.5">Eligibility Criteria</th>
                      <th className="px-5 py-3.5">Threshold Range</th>
                      <th className="px-5 py-3.5">Discount Value</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAEAEA]">
                    {bundleSlabs.map((slab) => {
                      const isActive = slab.active !== false;
                      const isCount = slab.criteriaType === "test_count" || (!slab.criteriaType && slab.minCount !== undefined);
                      const thresholdText = isCount
                        ? slab.maxCount
                          ? `${slab.minCount} – ${slab.maxCount} tests`
                          : `${slab.minCount}+ tests`
                        : slab.maxSpend
                        ? `₹${slab.minSpend?.toLocaleString("en-IN")} – ₹${slab.maxSpend?.toLocaleString("en-IN")}`
                        : `₹${slab.minSpend?.toLocaleString("en-IN")}+ spend`;

                      return (
                        <tr key={slab.id} className={`hover:bg-[#FFFDFB] transition ${!isActive ? "opacity-60 bg-stone-50" : ""}`}>
                          <td className="px-5 py-3.5">
                            <p className="font-bold text-[#0D0D0D] text-sm">{slab.title}</p>
                            <p className="text-[10px] text-stone-400 font-mono mt-0.5">ID: {slab.id}</p>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${isCount ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-purple-50 text-purple-700 border border-purple-200"}`}>
                              {isCount ? "Eligible Test Count" : "Eligible Spend (₹)"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="font-bold text-[#0D0D0D]">{thresholdText}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-sm font-black text-[#FF6B00]">
                              {slab.discountType === "percent" ? `${slab.value}% OFF` : `₹${slab.value} FLAT OFF`}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <button
                              type="button"
                              onClick={() => handleToggleSlabActive(slab)}
                              className={`cursor-pointer inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                isActive ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-stone-100 text-stone-600 border border-stone-200"
                              }`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-600" : "bg-stone-400"}`} />
                              <span>{isActive ? "Active" : "Inactive"}</span>
                            </button>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditSlab(slab)}
                                className="rounded-lg border border-[#EAEAEA] bg-white p-1.5 text-[#0D0D0D] hover:border-[#FF6B00] hover:text-[#FF6B00] transition"
                                title="Edit Slab"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSlab(slab.id)}
                                className="rounded-lg border border-[#EAEAEA] bg-white p-1.5 text-stone-500 hover:border-red-500 hover:text-red-500 transition"
                                title="Delete Slab"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}

        {/* TAB 2: CATEGORIES & PARAMETERS */}
        {activeTab === "categories" ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {/* Add Category Form */}
            <div className="rounded-2xl border border-[#EAEAEA] bg-white p-5 shadow-xs">
              <h3 className="text-base font-bold text-[#0D0D0D]">Add Test Category</h3>
              <p className="mt-1 text-xs text-[#626262]">
                Organize tests into clinical classifications (e.g., Blood, Hormone, Profile, Infectious Disease).
              </p>

              <form onSubmit={handleAddCategory} className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#0D0D0D]">Category Name</label>
                  <input
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="e.g. Allergy & Immunology"
                    className="mt-1 w-full rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-3 py-2 text-xs font-semibold focus:border-[#FF6B00] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0D0D0D]">Sort Order</label>
                  <input
                    type="number"
                    value={newCatOrder}
                    onChange={(e) => setNewCatOrder(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-3 py-2 text-xs font-semibold focus:border-[#FF6B00] focus:outline-none"
                  />
                </div>
                <button type="submit" className="cta-btn w-full text-xs font-bold">
                  Add Category
                </button>
              </form>
            </div>

            {/* Categories List */}
            <div className="rounded-2xl border border-[#EAEAEA] bg-white p-5 shadow-xs lg:col-span-2">
              <h3 className="text-base font-bold text-[#0D0D0D]">Active Test Categories</h3>
              <div className="mt-4 divide-y divide-[#EAEAEA]">
                {categories.map((cat) => {
                  const testsCount = tests.filter(
                    (t) => t.category.toLowerCase() === cat.name.toLowerCase() || t.category.toLowerCase() === cat.slug.toLowerCase()
                  ).length;

                  return (
                    <div key={cat.id} className="py-3 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#0D0D0D]">{cat.name}</span>
                          <span className="rounded bg-stone-100 px-2 py-0.5 text-[10px] font-mono text-[#626262]">
                            {cat.slug}
                          </span>
                        </div>
                        <p className="text-xs text-[#8A8A8A] mt-0.5">Sort priority: {cat.sort_order}</p>
                      </div>
                      <span className="rounded-full bg-[#FFF4E8] px-3 py-1 text-xs font-bold text-[#FF6B00]">
                        {testsCount} Tests Linked
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        {/* TAB 3: SERVICE AVAILABILITY (CITIES & PIN CODES) */}
        {activeTab === "serviceability" ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-[#EAEAEA] bg-white p-4 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-[#0D0D0D]">Service Availability by City & Postal Code</h3>
                <p className="text-xs text-[#626262] mt-0.5">
                  Configure active serviceable pincodes, doorstep phlebotomy charges, and minimum order requirements.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAreaModalOpen(true)}
                className="cta-btn text-xs font-bold flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>Add Service Area</span>
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[#EAEAEA] bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[#EAEAEA] bg-[#F7F7F7] text-[11px] font-bold uppercase tracking-wider text-[#626262]">
                    <tr>
                      <th className="px-4 py-3.5">PIN Code</th>
                      <th className="px-4 py-3.5">City & Area</th>
                      <th className="px-4 py-3.5">Home Collection</th>
                      <th className="px-4 py-3.5">Centre Visit</th>
                      <th className="px-4 py-3.5">Collection Fee</th>
                      <th className="px-4 py-3.5">Min Order Value</th>
                      <th className="px-4 py-3.5 text-right">Toggle Availability</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAEAEA]">
                    {serviceAreas.map((area) => (
                      <tr key={area.id} className="hover:bg-[#FFFDFB] transition-colors">
                        <td className="px-4 py-3.5">
                          <span className="font-mono font-bold text-sm text-[#0D0D0D]">{area.pincode}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-bold text-[#0D0D0D]">{area.city}</p>
                          <p className="text-[11px] text-[#626262]">{area.area}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              area.home_collection_enabled
                                ? "bg-emerald-50 text-emerald-800"
                                : "bg-red-50 text-red-800"
                            }`}
                          >
                            {area.home_collection_enabled ? "Enabled" : "Disabled"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              area.centre_visit_enabled
                                ? "bg-emerald-50 text-emerald-800"
                                : "bg-stone-100 text-stone-600"
                            }`}
                          >
                            {area.centre_visit_enabled ? "Available" : "Not Offered"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-bold text-[#0D0D0D]">₹{area.collection_charge}</td>
                        <td className="px-4 py-3.5 font-bold text-[#0D0D0D]">₹{area.minimum_order_value}</td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleToggleAreaHomeCollection(area)}
                            className="rounded-lg border border-[#EAEAEA] bg-white px-3 py-1.5 text-xs font-bold text-[#0D0D0D] hover:border-[#FF6B00] transition"
                          >
                            {area.home_collection_enabled ? "Turn Off" : "Turn On"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}

        {/* TEST MODAL: ADD / EDIT */}
        {isTestModalOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
            <div className="relative my-8 w-full max-w-3xl rounded-3xl border border-[#EAEAEA] bg-white p-6 shadow-2xl sm:p-8">
              <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-[#0D0D0D]">
                    {editingTest ? "Edit Diagnostic Test" : "Add New Diagnostic Test"}
                  </h2>
                  <p className="text-xs text-[#626262] mt-0.5">
                    Real prices, discount caps, clinical sample rules, and SEO page metadata.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTestModalOpen(false)}
                  className="rounded-xl border border-[#EAEAEA] bg-white p-2 text-stone-500 hover:text-black"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveTest} className="mt-6 space-y-4">
                {/* 1. Basic Info */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-bold text-[#0D0D0D]">Test Name *</label>
                    <input
                      value={testForm.name}
                      onChange={(e) => setTestForm({ ...testForm, name: e.target.value })}
                      placeholder="e.g. Complete Blood Count + ESR"
                      className="mt-1 w-full rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-3.5 py-2.5 text-xs font-semibold focus:border-[#FF6B00] focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#0D0D0D]">
                      Test Code (LIS Mapping)
                    </label>
                    <input
                      value={testForm.code}
                      onChange={(e) => setTestForm({ ...testForm, code: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "") })}
                      placeholder="e.g. cbc-001"
                      className="mt-1 w-full rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-3.5 py-2.5 text-xs font-mono font-bold focus:border-[#FF6B00] focus:outline-none"
                    />
                    <p className="text-[10px] text-stone-500 mt-1">Short unique alphanumeric code for internal DB &amp; LIS mapping</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#0D0D0D]">URL Slug</label>
                    <input
                      value={testForm.slug}
                      onChange={(e) => setTestForm({ ...testForm, slug: e.target.value })}
                      placeholder="e.g. cbc-esr-test"
                      className="mt-1 w-full rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-3.5 py-2.5 text-xs font-semibold focus:border-[#FF6B00] focus:outline-none"
                    />
                    <p className="text-[10px] text-stone-500 mt-1">SEO canonical link identifier</p>
                  </div>
                </div>

                {/* 2. Classification & Pricing Engine Caps */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-[#0D0D0D]">Category</label>
                    <select
                      value={testForm.category}
                      onChange={(e) => setTestForm({ ...testForm, category: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-3.5 py-2.5 text-xs font-semibold focus:border-[#FF6B00]"
                    >
                      <option value="Blood">Blood</option>
                      <option value="Hormone">Hormone</option>
                      <option value="Profile">Profile</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#0D0D0D]">Group</label>
                    <select
                      value={testForm.group}
                      onChange={(e) => setTestForm({ ...testForm, group: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-3.5 py-2.5 text-xs font-semibold focus:border-[#FF6B00]"
                    >
                      <option value="Basic Tests">Basic Tests</option>
                      <option value="Profile Tests">Profile Tests</option>
                      <option value="Organ Function Tests">Organ Function Tests</option>
                      <option value="Hormone & Special Tests">Hormone & Special Tests</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-[#0D0D0D]">Real Selling Price (₹) *</label>
                    <input
                      type="number"
                      min={0}
                      value={testForm.price}
                      onChange={(e) => setTestForm({ ...testForm, price: Number(e.target.value) })}
                      className="mt-1 w-full rounded-xl border border-[#FFD9C0] bg-[#FFF8F2] px-3.5 py-2.5 text-sm font-black text-[#0D0D0D] focus:border-[#FF6B00] focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#0D0D0D]">Reference Market MRP (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={testForm.mrp}
                      onChange={(e) => setTestForm({ ...testForm, mrp: Number(e.target.value) })}
                      className="mt-1 w-full rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-3.5 py-2.5 text-sm font-semibold text-[#626262] focus:border-[#FF6B00] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Pricing Engine Caps & Bundle Rules */}
                <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-[#FF6B00]" />
                    <span className="text-xs font-black text-[#0D0D0D]">Pricing Engine Discount Caps & Eligibility</span>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-[#0D0D0D]">Maximum Discount Percentage (%)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={testForm.discountCapPercent}
                        onChange={(e) => setTestForm({ ...testForm, discountCapPercent: Number(e.target.value) })}
                        placeholder="e.g. 20"
                        className="mt-1 w-full rounded-xl border border-[#EAEAEA] bg-white px-3.5 py-2 text-xs font-semibold focus:border-[#FF6B00] focus:outline-none"
                      />
                      <p className="text-[10px] text-stone-500 mt-1">Cap as % of real selling price</p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#0D0D0D]">Maximum Fixed Rupee Cap (₹)</label>
                      <input
                        type="number"
                        min={0}
                        value={testForm.discountCapRupees}
                        onChange={(e) => setTestForm({ ...testForm, discountCapRupees: Number(e.target.value) })}
                        placeholder="e.g. 50"
                        className="mt-1 w-full rounded-xl border border-[#EAEAEA] bg-white px-3.5 py-2 text-xs font-semibold focus:border-[#FF6B00] focus:outline-none"
                      />
                      <p className="text-[10px] text-stone-500 mt-1">Rule 3: Enforces lower cap when both % and ₹ exist</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#0D0D0D]">Bundle Discount Eligibility</p>
                      <p className="text-[10px] text-stone-500">Allow this test to count towards multi-test bundle discount slabs</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={testForm.isBundleEligible}
                        onChange={(e) => setTestForm({ ...testForm, isBundleEligible: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                </div>

                {/* 3. Clinical Attributes */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-bold text-[#0D0D0D]">Specimen Type</label>
                    <input
                      value={testForm.specimenType}
                      onChange={(e) => setTestForm({ ...testForm, specimenType: e.target.value })}
                      placeholder="e.g. Whole Blood EDTA / Serum"
                      className="mt-1 w-full rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-3.5 py-2 text-xs font-semibold focus:border-[#FF6B00] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#0D0D0D]">Fasting Requirement</label>
                    <input
                      value={testForm.fastingHours}
                      onChange={(e) => setTestForm({ ...testForm, fastingHours: e.target.value })}
                      placeholder="e.g. 10-12 hrs fasting / No fasting"
                      className="mt-1 w-full rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-3.5 py-2 text-xs font-semibold focus:border-[#FF6B00] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#0D0D0D]">Report TAT</label>
                    <input
                      value={testForm.tat}
                      onChange={(e) => setTestForm({ ...testForm, tat: e.target.value })}
                      placeholder="e.g. 12-24 Hrs"
                      className="mt-1 w-full rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-3.5 py-2 text-xs font-semibold focus:border-[#FF6B00] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0D0D0D]">Preparation Instructions</label>
                  <textarea
                    rows={2}
                    value={testForm.preparation}
                    onChange={(e) => setTestForm({ ...testForm, preparation: e.target.value })}
                    placeholder="Patient instructions before sample collection..."
                    className="mt-1 w-full rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] p-2.5 text-xs font-medium focus:border-[#FF6B00] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0D0D0D]">
                    Included Biomarkers / Parameters (comma separated)
                  </label>
                  <textarea
                    rows={2}
                    value={testForm.componentsText}
                    onChange={(e) => setTestForm({ ...testForm, componentsText: e.target.value })}
                    placeholder="e.g. Total Cholesterol, Triglycerides, HDL, LDL Direct"
                    className="mt-1 w-full rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] p-2.5 text-xs font-medium focus:border-[#FF6B00] focus:outline-none"
                  />
                </div>

                {/* 4. SEO Metadata */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-[#0D0D0D]">SEO Meta Title</label>
                    <input
                      value={testForm.seoTitle}
                      onChange={(e) => setTestForm({ ...testForm, seoTitle: e.target.value })}
                      placeholder="e.g. Lipid Profile Test at Home | ScopeX Diagnostics"
                      className="mt-1 w-full rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-3.5 py-2 text-xs font-medium focus:border-[#FF6B00] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#0D0D0D]">SEO Meta Description</label>
                    <input
                      value={testForm.seoDescription}
                      onChange={(e) => setTestForm({ ...testForm, seoDescription: e.target.value })}
                      placeholder="e.g. Book Lipid Profile blood test at home with fast reports..."
                      className="mt-1 w-full rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-3.5 py-2 text-xs font-medium focus:border-[#FF6B00] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isActiveCheck"
                    checked={testForm.isActive}
                    onChange={(e) => setTestForm({ ...testForm, isActive: e.target.checked })}
                    className="h-4 w-4 rounded accent-[#FF6B00]"
                  />
                  <label htmlFor="isActiveCheck" className="text-xs font-bold text-[#0D0D0D] cursor-pointer">
                    Publish as Active (Available in customer search & home booking)
                  </label>
                </div>

                <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#EAEAEA] pt-4">
                  <button
                    type="button"
                    onClick={() => setIsTestModalOpen(false)}
                    className="rounded-xl border border-[#EAEAEA] bg-white px-5 py-2.5 text-xs font-bold text-[#626262] hover:text-[#0D0D0D]"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="cta-btn text-xs font-bold">
                    {editingTest ? "Update Test Master" : "Create Test"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {/* SERVICE AREA MODAL */}
        {isAreaModalOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="relative w-full max-w-lg rounded-3xl border border-[#EAEAEA] bg-white p-6 shadow-2xl sm:p-8">
              <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-4">
                <h2 className="text-xl font-black text-[#0D0D0D]">Add Serviceable PIN Code</h2>
                <button
                  type="button"
                  onClick={() => setIsAreaModalOpen(false)}
                  className="rounded-xl border border-[#EAEAEA] p-2 text-stone-500 hover:text-black"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveArea} className="mt-4 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-[#0D0D0D]">City *</label>
                    <input
                      value={areaForm.city}
                      onChange={(e) => setAreaForm({ ...areaForm, city: e.target.value })}
                      placeholder="e.g. Indore"
                      className="mt-1 w-full rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-3 py-2 text-xs font-semibold focus:border-[#FF6B00] focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#0D0D0D]">PIN Code (6 digits) *</label>
                    <input
                      value={areaForm.pincode}
                      onChange={(e) => setAreaForm({ ...areaForm, pincode: e.target.value })}
                      placeholder="e.g. 452010"
                      maxLength={6}
                      className="mt-1 w-full rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-3 py-2 text-xs font-mono font-bold focus:border-[#FF6B00] focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0D0D0D]">Area / Landmark</label>
                  <input
                    value={areaForm.area}
                    onChange={(e) => setAreaForm({ ...areaForm, area: e.target.value })}
                    placeholder="e.g. Palasia / Old Town"
                    className="mt-1 w-full rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-3 py-2 text-xs font-semibold focus:border-[#FF6B00] focus:outline-none"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-[#0D0D0D]">Collection Fee (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={areaForm.collection_charge}
                      onChange={(e) => setAreaForm({ ...areaForm, collection_charge: Number(e.target.value) })}
                      className="mt-1 w-full rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-3 py-2 text-xs font-semibold focus:border-[#FF6B00] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#0D0D0D]">Free Min Order (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={areaForm.minimum_order_value}
                      onChange={(e) => setAreaForm({ ...areaForm, minimum_order_value: Number(e.target.value) })}
                      className="mt-1 w-full rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-3 py-2 text-xs font-semibold focus:border-[#FF6B00] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#EAEAEA]">
                  <button
                    type="button"
                    onClick={() => setIsAreaModalOpen(false)}
                    className="rounded-xl border border-[#EAEAEA] bg-white px-4 py-2 text-xs font-bold text-[#626262]"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="cta-btn text-xs font-bold">
                    Save PIN Code
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {/* CSV BULK UPLOAD MODAL */}
        {isCsvModalOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-5 backdrop-blur-xs">
            <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col border border-[#EAEAEA]">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-[#EAEAEA] px-6 py-4 bg-[#FAFAFA]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-[#FF6B00]/10 px-2 py-0.5 text-[11px] font-bold text-[#FF6B00]">
                      DIAGNOSTIC TEST MASTER
                    </span>
                    <span className="text-xs text-stone-500">· Mass Creation &amp; Updates</span>
                  </div>
                  <h3 className="mt-1 text-lg font-extrabold text-[#0D0D0D]">
                    Bulk Diagnostic Tests CSV Upload
                  </h3>
                  <p className="mt-0.5 text-xs text-[#626262]">
                    Import tests via CSV. Tests matching existing codes or names will update; new ones will be created.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={downloadCsvTemplate}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-xs font-bold text-stone-800 shadow-xs hover:border-[#FF6B00] hover:text-[#FF6B00] transition cursor-pointer"
                    title="Download pre-formatted CSV template with sample diagnostic tests"
                  >
                    <Download className="h-3.5 w-3.5 text-[#FF6B00]" />
                    <span>Download CSV Template</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCsvModalOpen(false)}
                    className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Mode Selector Tabs */}
                <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
                  <button
                    type="button"
                    onClick={() => setCsvInputTab("file")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                      csvInputTab === "file"
                        ? "bg-[#0D0D0D] text-white"
                        : "bg-stone-100 text-stone-600 hover:text-stone-900"
                    }`}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload CSV File</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCsvInputTab("paste")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                      csvInputTab === "paste"
                        ? "bg-[#0D0D0D] text-white"
                        : "bg-stone-100 text-stone-600 hover:text-stone-900"
                    }`}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>Paste Raw CSV Text</span>
                  </button>
                </div>

                {/* Input Area */}
                {csvInputTab === "file" ? (
                  <div className="rounded-xl border-2 border-dashed border-stone-300 bg-[#FAFAFA] p-6 text-center hover:border-[#FF6B00] transition">
                    <FileSpreadsheet className="mx-auto h-10 w-10 text-stone-400" />
                    <p className="mt-2 text-xs font-bold text-stone-800">
                      Select or drop your diagnostic tests CSV file
                    </p>
                    <p className="mt-1 text-[11px] text-stone-500">
                      Supports .csv files with headers: code, name, category, group, price, mrp, discountCapPercent, specimenType, fastingHours, etc.
                    </p>
                    <label className="mt-4 inline-flex items-center gap-2 cursor-pointer rounded-xl bg-[#0D0D0D] px-4 py-2 text-xs font-bold text-white hover:bg-stone-800 transition">
                      <Upload className="h-3.5 w-3.5 text-[#FF6B00]" />
                      <span>{csvFileName ? `Replace: ${csvFileName}` : "Browse CSV File"}</span>
                      <input
                        type="file"
                        accept=".csv,text/csv"
                        className="hidden"
                        onChange={handleCsvFileSelect}
                      />
                    </label>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-stone-600">
                      <label className="font-bold">Paste CSV Rows (including header line):</label>
                      <button
                        type="button"
                        onClick={() => {
                          const sample = [
                            "code,name,category,group,price,mrp,discountCapPercent,specimenType,fastingHours,preparation,tat,components,isActive",
                            'cbc,Complete Blood Count (CBC),Blood,Basic Tests,350,550,20,Whole Blood EDTA,No fasting required,Hydrate normally,12-24 Hrs,"Hemoglobin; WBC; Platelets",true',
                            'lipid-profile,Lipid Profile,Blood,Basic Tests,650,1100,25,Blood Serum,10-12 hours fasting,Overnight fasting,12-24 Hrs,"Cholesterol; HDL; LDL; Triglycerides",true',
                            'tsh-ultra,TSH Ultra-Sensitive,Thyroid,Basic Tests,280,450,20,Blood Serum,No fasting required,Morning sample preferred,12-24 Hrs,"TSH",true'
                          ].join("\n");
                          setCsvRawText(sample);
                          parseCsvString(sample);
                        }}
                        className="text-[11px] font-semibold text-[#FF6B00] hover:underline"
                      >
                        Load Sample Data
                      </button>
                    </div>
                    <textarea
                      rows={6}
                      value={csvRawText}
                      onChange={(e) => {
                        setCsvRawText(e.target.value);
                        parseCsvString(e.target.value);
                      }}
                      placeholder="code,name,category,group,price,mrp,discountCapPercent,specimenType,fastingHours,tat,components,isActive..."
                      className="w-full rounded-xl border border-stone-300 bg-stone-50 p-3 text-xs font-mono text-stone-900 focus:border-[#FF6B00] focus:bg-white focus:outline-none"
                    />
                  </div>
                )}

                {/* Validation & Preview Section */}
                {parsedCsvRecords.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-stone-900">
                          Parsed Preview ({parsedCsvRecords.length} records)
                        </span>
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span className="rounded-md bg-emerald-100 px-2 py-0.5 font-bold text-emerald-800">
                            {parsedCsvRecords.filter((r) => r.isValid && !r.isExisting).length} New
                          </span>
                          <span className="rounded-md bg-blue-100 px-2 py-0.5 font-bold text-blue-800">
                            {parsedCsvRecords.filter((r) => r.isValid && r.isExisting).length} Updates
                          </span>
                          {parsedCsvRecords.some((r) => !r.isValid) && (
                            <span className="rounded-md bg-rose-100 px-2 py-0.5 font-bold text-rose-800">
                              {parsedCsvRecords.filter((r) => !r.isValid).length} Errors
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-[11px] text-stone-500">
                        Review parsed columns before committing to database
                      </span>
                    </div>

                    <div className="max-h-72 overflow-x-auto overflow-y-auto rounded-xl border border-stone-200">
                      <table className="w-full text-left text-xs">
                        <thead className="sticky top-0 bg-stone-100 text-stone-700 font-bold border-b border-stone-200">
                          <tr>
                            <th className="px-3 py-2">Action</th>
                            <th className="px-3 py-2">Code / Slug</th>
                            <th className="px-3 py-2">Test Name</th>
                            <th className="px-3 py-2">Category</th>
                            <th className="px-3 py-2 text-right">Selling Price</th>
                            <th className="px-3 py-2 text-right">MRP</th>
                            <th className="px-3 py-2 text-center">Cap %</th>
                            <th className="px-3 py-2">Specimen</th>
                            <th className="px-3 py-2">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 bg-white">
                          {parsedCsvRecords.map((row, idx) => {
                            const savingsAmt = row.mrp > row.price ? row.mrp - row.price : 0;
                            const savingsPct = row.mrp > row.price ? Math.round((savingsAmt / row.mrp) * 100) : 0;

                            return (
                              <tr
                                key={`${row.id}-${idx}`}
                                className={!row.isValid ? "bg-rose-50/50" : row.isExisting ? "bg-blue-50/20" : "hover:bg-stone-50"}
                              >
                                <td className="px-3 py-2 font-mono whitespace-nowrap">
                                  {!row.isValid ? (
                                    <span className="inline-flex items-center gap-1 rounded bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                                      <AlertTriangle className="h-3 w-3" />
                                      ERROR
                                    </span>
                                  ) : row.isExisting ? (
                                    <span className="inline-flex items-center gap-1 rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                                      ✎ UPDATE
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                      + CREATE
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-2 font-mono text-stone-600">{row.slug || row.id}</td>
                                <td className="px-3 py-2 font-bold text-stone-900">
                                  {row.name}
                                  {!row.isValid && row.errorMessage && (
                                    <p className="text-[10px] font-normal text-rose-600">{row.errorMessage}</p>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-stone-600">{row.category}</td>
                                <td className="px-3 py-2 text-right font-bold text-stone-900">
                                  ₹{row.price}
                                </td>
                                <td className="px-3 py-2 text-right text-stone-500">
                                  ₹{row.mrp}
                                  {savingsPct > 0 && (
                                    <span className="ml-1 text-[10px] text-emerald-700 font-semibold">
                                      ({savingsPct}%)
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-center font-bold text-stone-700">
                                  {row.discountCapPercent}%
                                </td>
                                <td className="px-3 py-2 text-stone-600 text-[11px] truncate max-w-[140px]" title={row.specimenType}>
                                  {row.specimenType}
                                </td>
                                <td className="px-3 py-2 text-[11px]">
                                  {row.isActive ? (
                                    <span className="text-emerald-700 font-medium">Active</span>
                                  ) : (
                                    <span className="text-stone-400">Inactive</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between border-t border-[#EAEAEA] px-6 py-4 bg-[#FAFAFA]">
                <div className="text-xs text-stone-600">
                  {parsedCsvRecords.length > 0 ? (
                    <span>
                      Ready:{" "}
                      <strong className="text-stone-900">
                        {parsedCsvRecords.filter((r) => r.isValid).length}
                      </strong>{" "}
                      valid of {parsedCsvRecords.length} records.
                    </span>
                  ) : (
                    <span>Upload or paste CSV to see live preview.</span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCsvModalOpen(false)}
                    className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-xs font-bold text-stone-700 hover:bg-stone-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleBulkImportSubmit}
                    disabled={isUploadingCsv || parsedCsvRecords.filter((r) => r.isValid).length === 0}
                    className="cta-btn text-xs font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isUploadingCsv ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin text-white" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        <span>
                          Import &amp; Save {parsedCsvRecords.filter((r) => r.isValid).length} Tests
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* MODAL: ADD / EDIT BUNDLE DISCOUNT SLAB */}
        {isSlabModalOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
            <div className="relative my-8 w-full max-w-lg rounded-3xl border border-[#EAEAEA] bg-white p-6 shadow-2xl sm:p-8">
              <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-4">
                <div>
                  <h2 className="text-xl font-black text-[#0D0D0D]">
                    {editingSlab ? "Edit Bundle Discount Slab" : "Create New Bundle Slab"}
                  </h2>
                  <p className="text-xs text-[#626262] mt-0.5">
                    Define test count or spend thresholds and discount rates.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSlabModalOpen(false)}
                  className="rounded-xl border border-[#EAEAEA] bg-white p-2 text-stone-500 hover:text-black"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveSlab} className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#0D0D0D]">Slab Title *</label>
                  <input
                    value={slabForm.title}
                    onChange={(e) => setSlabForm({ ...slabForm, title: e.target.value })}
                    placeholder="e.g. 8% Bundle Savings (3–4 Tests)"
                    className="mt-1 w-full rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-3.5 py-2.5 text-xs font-semibold focus:border-[#FF6B00] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0D0D0D]">Eligibility Criteria Basis *</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setSlabForm({ ...slabForm, criteriaType: "test_count" })}
                      className={`rounded-xl px-3 py-2 text-xs font-bold border transition ${
                        slabForm.criteriaType === "test_count"
                          ? "border-[#FF6B00] bg-orange-50 text-[#FF6B00]"
                          : "border-stone-200 bg-white text-stone-700"
                      }`}
                    >
                      Eligible Test Count
                    </button>
                    <button
                      type="button"
                      onClick={() => setSlabForm({ ...slabForm, criteriaType: "spend" })}
                      className={`rounded-xl px-3 py-2 text-xs font-bold border transition ${
                        slabForm.criteriaType === "spend"
                          ? "border-[#FF6B00] bg-orange-50 text-[#FF6B00]"
                          : "border-stone-200 bg-white text-stone-700"
                      }`}
                    >
                      Eligible Spend (₹)
                    </button>
                  </div>
                </div>

                {slabForm.criteriaType === "test_count" ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#0D0D0D]">Min Test Count *</label>
                      <input
                        type="number"
                        min={1}
                        value={slabForm.minCount}
                        onChange={(e) => setSlabForm({ ...slabForm, minCount: Number(e.target.value) })}
                        placeholder="e.g. 2"
                        className="mt-1 w-full rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-3.5 py-2 text-xs font-semibold focus:border-[#FF6B00] focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#0D0D0D]">Max Test Count (Optional)</label>
                      <input
                        type="number"
                        min={1}
                        value={slabForm.maxCount}
                        onChange={(e) => setSlabForm({ ...slabForm, maxCount: e.target.value === "" ? "" : Number(e.target.value) })}
                        placeholder="Leave blank for 5+ tests"
                        className="mt-1 w-full rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-3.5 py-2 text-xs font-semibold focus:border-[#FF6B00] focus:outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#0D0D0D]">Min Eligible Spend (₹) *</label>
                      <input
                        type="number"
                        min={1}
                        value={slabForm.minSpend}
                        onChange={(e) => setSlabForm({ ...slabForm, minSpend: Number(e.target.value) })}
                        placeholder="e.g. 2500"
                        className="mt-1 w-full rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-3.5 py-2 text-xs font-semibold focus:border-[#FF6B00] focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#0D0D0D]">Max Eligible Spend (₹)</label>
                      <input
                        type="number"
                        min={1}
                        value={slabForm.maxSpend}
                        onChange={(e) => setSlabForm({ ...slabForm, maxSpend: e.target.value === "" ? "" : Number(e.target.value) })}
                        placeholder="Leave blank for no upper limit"
                        className="mt-1 w-full rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-3.5 py-2 text-xs font-semibold focus:border-[#FF6B00] focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#0D0D0D]">Discount Type *</label>
                    <select
                      value={slabForm.discountType}
                      onChange={(e) => setSlabForm({ ...slabForm, discountType: e.target.value as "percent" | "fixed" })}
                      className="mt-1 w-full rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-3.5 py-2 text-xs font-semibold focus:border-[#FF6B00]"
                    >
                      <option value="percent">Percentage (%)</option>
                      <option value="fixed">Fixed Rupees (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#0D0D0D]">
                      Discount Value ({slabForm.discountType === "percent" ? "%" : "₹"}) *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={slabForm.discountType === "percent" ? 100 : undefined}
                      value={slabForm.value}
                      onChange={(e) => setSlabForm({ ...slabForm, value: Number(e.target.value) })}
                      placeholder={slabForm.discountType === "percent" ? "e.g. 8" : "e.g. 200"}
                      className="mt-1 w-full rounded-xl border border-[#FFD9C0] bg-[#FFF8F2] px-3.5 py-2 text-sm font-black text-[#0D0D0D] focus:border-[#FF6B00] focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 p-3">
                  <div>
                    <p className="text-xs font-bold text-[#0D0D0D]">Slab Status</p>
                    <p className="text-[10px] text-stone-500">Active slabs are immediately evaluated by the checkout engine</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={slabForm.active}
                      onChange={(e) => setSlabForm({ ...slabForm, active: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsSlabModalOpen(false)}
                    className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-xs font-bold text-stone-700 hover:bg-stone-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="cta-btn text-xs font-bold px-5 py-2 cursor-pointer">
                    {editingSlab ? "Update Slab" : "Save Slab"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
