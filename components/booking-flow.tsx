"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useMemo, useState } from "react";
import { bookingCatalog, bookingPackages, bookingTests } from "@/lib/booking-catalog";
import { calculateBookingQuote, formatInr } from "@/lib/offers";
import { clearVerifiedMobile, getVerifiedMobile, storeVerifiedMobile } from "@/lib/otp-client";
import { backendFetch, getStoredAuthToken, getStoredAuthUser, logoutAuthSession, storeAuthToken } from "@/lib/backend-client";
import type { BookingCatalogItem, BookingCustomerInput, BookingPatientInput, FamilyMemberInput } from "@/lib/booking-types";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      on?: (event: "payment.failed", handler: (response: { error?: { description?: string; reason?: string } }) => void) => void;
      open: () => void;
    };
  }
}

type Step = "auth" | "select" | "patient" | "details" | "review" | "success";
type PaymentMethod = "online" | "cod";
type CatalogMode = "packages" | "tests";
type PatientSelectionMode = "same" | "different";

type SavedProfile = {
  full_name?: string | null;
  mobile?: string | null;
  email?: string | null;
  dob?: string | null;
  age?: number | null;
  gender?: string | null;
  address?: string | null;
  city?: string | null;
  preferred_collection_address?: string | null;
  is_profile_complete?: boolean;
};

type SavedFamilyMember = {
  id: string;
  name: string;
  relation: string;
  age?: number | null;
  dob?: string | null;
  gender?: string | null;
  mobile?: string | null;
  is_default?: boolean;
};

type BookingPatient = Omit<BookingPatientInput, "tests"> & {
  source: "self" | "saved" | "new";
  mode: PatientSelectionMode;
  itemIds: string[];
};

type NewFamilyForm = {
  name: string;
  relation: string;
  age: string;
  dob: string;
  gender: string;
  mobile: string;
};

type PreviousReportFile = {
  id: string;
  file: File;
  progress: number;
  status: "ready" | "uploading" | "uploaded" | "error";
  message?: string;
};

const initialCustomer: BookingCustomerInput = {
  fullName: "",
  phone: "",
  email: "",
  city: "",
  address: "",
  preferredDate: "",
  preferredTime: ""
};

const slotOptions = [
  "6:00 AM - 7:00 AM",
  "7:00 AM - 8:00 AM",
  "8:00 AM - 9:00 AM",
  "9:00 AM - 10:00 AM",
  "10:00 AM - 11:00 AM",
  "11:00 AM - 12:00 PM",
  "12:00 PM - 1:00 PM",
  "1:00 PM - 2:00 PM"
];

const emptyNewFamilyForm: NewFamilyForm = {
  name: "",
  relation: "Father",
  age: "",
  dob: "",
  gender: "",
  mobile: ""
};

const relationOptions = ["Father", "Mother", "Wife", "Husband", "Son", "Daughter", "Self", "Other"];

function genderFromRelation(relation: string) {
  const normalized = relation.toLowerCase();
  if (["mother", "wife", "daughter"].includes(normalized)) return "female";
  if (["father", "husband", "son"].includes(normalized)) return "male";
  return "";
}

function loadRazorpayCheckout() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay checkout can only open in the browser."));
  }

  if (window.Razorpay) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById("razorpay-checkout-js") as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Unable to load Razorpay checkout.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = "razorpay-checkout-js";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load Razorpay checkout."));
    document.body.appendChild(script);
  });
}

function createFamilyMember(): FamilyMemberInput {
  return {
    id: crypto.randomUUID(),
    fullName: "",
    relationship: "",
    age: "",
    gender: ""
  };
}

function createSelfPatient(profile: SavedProfile | null, phone: string, itemIds: string[]): BookingPatient {
  return {
    patientId: "self",
    patientType: "self",
    familyMemberId: null,
    name: profile?.full_name || "Self",
    relation: "Self",
    age: profile?.age ? String(profile.age) : "",
    dob: profile?.dob || "",
    gender: profile?.gender || "",
    mobile: profile?.mobile || phone || "",
    source: "self",
    mode: "same",
    itemIds
  };
}

function createPatientFromSavedMember(member: SavedFamilyMember, itemIds: string[]): BookingPatient {
  return {
    patientId: member.id,
    patientType: "family",
    familyMemberId: member.id,
    name: member.name,
    relation: member.relation,
    age: member.age ? String(member.age) : "",
    dob: member.dob || "",
    gender: member.gender || "",
    mobile: member.mobile || "",
    source: "saved",
    mode: "same",
    itemIds
  };
}

function getItemsForPatient(patient: BookingPatient) {
  return patient.itemIds.map((id) => bookingCatalog.find((item) => item.id === id)).filter(Boolean) as BookingCatalogItem[];
}

function getPatientSubtotal(patient: BookingPatient) {
  return getItemsForPatient(patient).reduce((sum, item) => sum + item.price, 0);
}

function SectionTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#F7931E]">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-bold text-[#0D0D0D] md:text-4xl">{title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-[#5f6868] md:text-base">{description}</p>
    </div>
  );
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Unable to read PDF file."));
    reader.readAsDataURL(file);
  });
}

export function BookingFlow() {
  const [step, setStep] = useState<Step>("auth");
  const [otpPhone, setOtpPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [authStatus, setAuthStatus] = useState<"idle" | "loading" | "error">("idle");
  const [catalogMode, setCatalogMode] = useState<CatalogMode>("packages");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [customer, setCustomer] = useState<BookingCustomerInput>(initialCustomer);
  const [familyMembers, setFamilyMembers] = useState<FamilyMemberInput[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("online");
  const [orderId, setOrderId] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");
  const [detailsMessage, setDetailsMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [patientAuthId, setPatientAuthId] = useState<string | undefined>(undefined);
  const [savedProfile, setSavedProfile] = useState<SavedProfile | null>(null);
  const [savedFamilyMembers, setSavedFamilyMembers] = useState<SavedFamilyMember[]>([]);
  const [bookingPatients, setBookingPatients] = useState<BookingPatient[]>([]);
  const [familyPickerOpen, setFamilyPickerOpen] = useState(false);
  const [showNewFamilyForm, setShowNewFamilyForm] = useState(false);
  const [newFamilyForm, setNewFamilyForm] = useState<NewFamilyForm>(emptyNewFamilyForm);
  const [savingFamilyMember, setSavingFamilyMember] = useState(false);
  const [patientCatalogMode, setPatientCatalogMode] = useState<Record<string, CatalogMode>>({});
  const [patientSearch, setPatientSearch] = useState<Record<string, string>>({});
  const [patientMessage, setPatientMessage] = useState("");
  const [previousReports, setPreviousReports] = useState<PreviousReportFile[]>([]);
  const [reportUploadMessage, setReportUploadMessage] = useState("");
  const isLoggedIn = Boolean(getStoredAuthToken() || otpPhone || customer.phone || savedProfile?.mobile);
  const loggedInName = savedProfile?.full_name || customer.fullName || bookingPatients.find((patient) => patient.patientId === "self")?.name || "Patient";
  const loggedInMobile = savedProfile?.mobile || customer.phone || otpPhone;

  useEffect(() => {
    const phone = getVerifiedMobile();
    const token = getStoredAuthToken();
    const authUser = getStoredAuthUser();
    if (authUser?.patientId) setPatientAuthId(authUser.patientId);
    if (authUser?.mobile && !phone) {
      setOtpPhone(authUser.mobile);
      setCustomer((prev) => ({ ...prev, phone: prev.phone || authUser.mobile || "" }));
    }
    if (token) {
      setStep("select");
      void loadPatientContext();
      return;
    }
    if (phone) {
      setOtpPhone(phone);
      setCustomer((prev) => ({ ...prev, phone: phone || prev.phone }));
      setStep("select");
      if (getStoredAuthToken()) void loadPatientContext();
    }
    // Load once from persisted auth/session data on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedIds.length) return;
    setBookingPatients((current) => {
      const base = current.length ? current : [createSelfPatient(savedProfile, customer.phone || otpPhone, selectedIds)];
      return base.map((patient) => (patient.mode === "same" ? { ...patient, itemIds: selectedIds } : patient));
    });
  }, [selectedIds, savedProfile, customer.phone, otpPhone]);

  const selectedItems = useMemo(
    () => selectedIds.map((id) => bookingCatalog.find((item) => item.id === id)).filter(Boolean) as BookingCatalogItem[],
    [selectedIds]
  );

  const visibleCatalog = useMemo(() => {
    const source = catalogMode === "packages" ? bookingPackages : bookingTests;
    const q = search.trim().toLowerCase();
    if (!q) return source;
    return source.filter((item) => `${item.name} ${item.description} ${item.category} ${(item.searchAliases ?? []).join(" ")}`.toLowerCase().includes(q));
  }, [catalogMode, search]);

  const allPatientItems = useMemo(() => bookingPatients.flatMap((patient) => getItemsForPatient(patient)), [bookingPatients]);

  const bookingFamilyMembers = useMemo(
    () =>
      bookingPatients
        .filter((patient) => patient.patientType === "family")
        .map((patient) => ({
          id: patient.familyMemberId || patient.patientId,
          fullName: patient.name,
          relationship: patient.relation,
          age: patient.age || "",
          gender: patient.gender || ""
        })),
    [bookingPatients]
  );

  const quote = useMemo(
    () =>
      calculateBookingQuote({
        items: allPatientItems.length ? allPatientItems : selectedItems,
        familyMembers: bookingFamilyMembers,
        isFirstOrder: true
      }),
    [allPatientItems, bookingFamilyMembers, selectedItems]
  );
  const orderItemsForSummary = allPatientItems.length ? allPatientItems : selectedItems;
  const totalMrp = orderItemsForSummary.reduce((sum, item) => sum + (item.mrp || item.price), 0);
  const packageDiscountTotal = Math.max(0, totalMrp - quote.subtotal);
  const specialDiscountTotal = quote.discountTotal;
  const totalSavings = packageDiscountTotal + specialDiscountTotal;

  function toggleSelection(itemId: string) {
    setSelectedIds((prev) => (prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]));
  }

  function updateCustomer<K extends keyof BookingCustomerInput>(key: K, value: BookingCustomerInput[K]) {
    setCustomer((prev) => ({ ...prev, [key]: value }));
    setDetailsMessage("");
  }

  function addPreviousReports(files: FileList | File[]) {
    const nextFiles = Array.from(files);
    setReportUploadMessage("");

    const validReports: PreviousReportFile[] = [];
    for (const file of nextFiles) {
      if (file.type !== "application/pdf") {
        setReportUploadMessage("Only PDF reports are allowed.");
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        setReportUploadMessage("Each PDF report must be 10 MB or smaller.");
        continue;
      }
      validReports.push({ id: crypto.randomUUID(), file, progress: 0, status: "ready" });
    }

    if (validReports.length) {
      setPreviousReports((current) => [...current, ...validReports]);
    }
  }

  function removePreviousReport(id: string) {
    setPreviousReports((current) => current.filter((report) => report.id !== id));
  }

  async function uploadPreviousReports(bookingId: string, bookingCode?: string) {
    const pending = previousReports.filter((report) => report.status !== "uploaded");
    if (!pending.length) return;

    setReportUploadMessage("Uploading previous medical reports...");
    setPreviousReports((current) => current.map((report) => (pending.some((item) => item.id === report.id) ? { ...report, status: "uploading", progress: 25 } : report)));

    try {
      const files = await Promise.all(
        pending.map(async (report) => ({
          fileName: report.file.name,
          fileSize: report.file.size,
          mimeType: report.file.type,
          fileData: await fileToDataUrl(report.file)
        }))
      );

      setPreviousReports((current) => current.map((report) => (pending.some((item) => item.id === report.id) ? { ...report, progress: 70 } : report)));

      const response = await backendFetch("/report/uploads", {
        method: "POST",
        body: JSON.stringify({
          bookingId,
          bookingCode: bookingCode || "",
          patientName: customer.fullName || bookingPatients[0]?.name || "Patient",
          mobileNumber: customer.phone || loggedInMobile,
          files
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to upload previous reports.");

      setPreviousReports((current) => current.map((report) => (pending.some((item) => item.id === report.id) ? { ...report, status: "uploaded", progress: 100 } : report)));
      setReportUploadMessage("Previous medical reports uploaded successfully.");
    } catch (error) {
      setPreviousReports((current) => current.map((report) => (pending.some((item) => item.id === report.id) ? { ...report, status: "error", progress: 0, message: "Upload failed" } : report)));
      setReportUploadMessage(error instanceof Error ? error.message : "Previous report upload failed.");
    }
  }

  async function logoutPatient() {
    await logoutAuthSession();
    clearVerifiedMobile();
    setStep("auth");
    setOtpPhone("");
    setOtpCode("");
    setOtpRequested(false);
    setAuthMessage("Logged out successfully.");
    setAuthStatus("idle");
    setCustomer(initialCustomer);
    setSavedProfile(null);
    setSavedFamilyMembers([]);
    setBookingPatients([]);
    setPatientAuthId(undefined);
    setSelectedIds([]);
    setFamilyPickerOpen(false);
    setShowNewFamilyForm(false);
    setSubmitMessage("");
    setPatientMessage("");
    setOrderId("");
    setPaymentId("");
    setPreviousReports([]);
    setReportUploadMessage("");
  }

  async function loadPatientContext() {
    try {
      const [profileResponse, familyResponse] = await Promise.all([backendFetch("/user/profile"), backendFetch("/family/list")]);
      const profileData = await profileResponse.json().catch(() => ({}));
      const familyData = await familyResponse.json().catch(() => ({}));
      if (profileResponse.ok && profileData.profile) {
        setSavedProfile(profileData.profile);
        setBookingPatients((current) =>
          current.length
            ? current.map((patient) => (patient.patientId === "self" ? { ...createSelfPatient(profileData.profile, patient.mobile || customer.phone || otpPhone, patient.itemIds), mode: patient.mode } : patient))
            : current
        );
        setCustomer((prev) => ({
          ...prev,
          fullName: prev.fullName || profileData.profile.full_name || "",
          phone: prev.phone || profileData.profile.mobile || "",
          email: prev.email || profileData.profile.email || "",
          city: prev.city || profileData.profile.city || "",
          address: prev.address || profileData.profile.preferred_collection_address || profileData.profile.address || ""
        }));
      }
      if (familyResponse.ok) setSavedFamilyMembers(familyData.familyMembers ?? []);
    } catch {
      // Booking still works with manual details if saved profile data is unavailable.
    }
  }

  function ensureSelfPatient() {
    setBookingPatients((current) => (current.some((patient) => patient.patientId === "self") ? current : [createSelfPatient(savedProfile, customer.phone || otpPhone, selectedIds), ...current]));
  }

  function toggleSavedFamilyMember(member: SavedFamilyMember) {
    setPatientMessage("");
    setBookingPatients((current) => {
      const exists = current.some((patient) => patient.familyMemberId === member.id);
      if (exists) return current.filter((patient) => patient.familyMemberId !== member.id);
      return [...current, createPatientFromSavedMember(member, selectedIds)];
    });
  }

  function removeBookingPatient(patientId: string) {
    if (patientId === "self" && bookingPatients.length === 1) {
      setPatientMessage("At least one patient is required.");
      return;
    }
    setBookingPatients((current) => current.filter((patient) => patient.patientId !== patientId));
  }

  function updateBookingPatient(patientId: string, updates: Partial<BookingPatient>) {
    setBookingPatients((current) => current.map((patient) => (patient.patientId === patientId ? { ...patient, ...updates } : patient)));
  }

  function setPatientMode(patientId: string, mode: PatientSelectionMode) {
    updateBookingPatient(patientId, { mode, itemIds: mode === "same" ? selectedIds : [] });
  }

  function togglePatientItem(patientId: string, itemId: string) {
    setBookingPatients((current) =>
      current.map((patient) => {
        if (patient.patientId !== patientId) return patient;
        const exists = patient.itemIds.includes(itemId);
        return { ...patient, mode: "different", itemIds: exists ? patient.itemIds.filter((id) => id !== itemId) : [...patient.itemIds, itemId] };
      })
    );
  }

  async function addNewFamilyMemberToBooking() {
    if (savingFamilyMember) return;
    if (!getStoredAuthToken()) {
      setStep("auth");
      setPatientMessage("Please login first to add a family member.");
      return;
    }
    if (!newFamilyForm.name.trim()) {
      setPatientMessage("Please enter the family member name.");
      return;
    }
    if (!newFamilyForm.relation) {
      setPatientMessage("Please select the family member relation.");
      return;
    }
    if (!newFamilyForm.age && !newFamilyForm.dob) {
      setPatientMessage("Please add age or date of birth.");
      return;
    }
    if (!newFamilyForm.gender) {
      setPatientMessage("Please select gender before saving this family member.");
      return;
    }
    setPatientMessage("");
    setSavingFamilyMember(true);
    try {
      const response = await backendFetch("/family/add", {
        method: "POST",
        body: JSON.stringify({
          name: newFamilyForm.name.trim(),
          relation: newFamilyForm.relation,
          age: newFamilyForm.age ? Number(newFamilyForm.age) : null,
          dob: newFamilyForm.dob || null,
          gender: newFamilyForm.gender,
          mobile: newFamilyForm.mobile || null
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.familyMember) {
        setPatientMessage(data.message || "Unable to save family member.");
        return;
      }
      const saved = data.familyMember as SavedFamilyMember;
      setSavedFamilyMembers((current) => [saved, ...current.filter((member) => member.id !== saved.id)]);
      setBookingPatients((current) => [...current.filter((patient) => patient.familyMemberId !== saved.id), createPatientFromSavedMember(saved, selectedIds)]);
      setNewFamilyForm(emptyNewFamilyForm);
      setShowNewFamilyForm(false);
    } catch {
      setPatientMessage("Unable to save family member. Please check the backend connection and try again.");
    } finally {
      setSavingFamilyMember(false);
    }
  }

  async function saveMissingPatientDetails() {
    const savedPatients = bookingPatients.filter((patient) => patient.source === "saved" && patient.familyMemberId);
    await Promise.all(
      savedPatients.map((patient) =>
        backendFetch(`/family/${patient.familyMemberId}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: patient.name,
            relation: patient.relation,
            age: patient.age ? Number(patient.age) : null,
            dob: patient.dob || null,
            gender: patient.gender || "",
            mobile: patient.mobile || null
          })
        }).catch(() => null)
      )
    );
  }

  async function continueFromPatients() {
    const nextPatients = bookingPatients.length ? bookingPatients : [createSelfPatient(savedProfile, customer.phone || otpPhone, selectedIds)];
    const invalid = nextPatients.find((patient) => !patient.name.trim() || (!patient.age && !patient.dob) || !patient.gender || patient.itemIds.length === 0);
    if (invalid) {
      setPatientMessage("Every selected patient needs name, age/DOB, gender, and at least one test/package.");
      return;
    }
    setBookingPatients(nextPatients);
    await saveMissingPatientDetails();
    const primary = nextPatients[0];
    setCustomer((prev) => ({
      ...prev,
      fullName: primary.name || prev.fullName,
      phone: primary.mobile || savedProfile?.mobile || prev.phone,
      email: savedProfile?.email || prev.email,
      city: savedProfile?.city || prev.city,
      address: savedProfile?.preferred_collection_address || savedProfile?.address || prev.address
    }));
    setStep("details");
  }

  function addFamilyMember() {
    setFamilyMembers((prev) => [...prev, createFamilyMember()]);
  }

  function updateFamilyMember(memberId: string, key: keyof FamilyMemberInput, value: string) {
    setFamilyMembers((prev) => prev.map((member) => (member.id === memberId ? { ...member, [key]: value } : member)));
  }

  function removeFamilyMember(memberId: string) {
    setFamilyMembers((prev) => prev.filter((member) => member.id !== memberId));
  }

  async function requestOtp() {
    const sanitizedPhone = otpPhone.replace(/\D/g, "");
    if (sanitizedPhone.length !== 10) {
      setAuthStatus("error");
      setAuthMessage("Enter a valid 10-digit mobile number.");
      return;
    }

    setAuthStatus("loading");
    setAuthMessage("");
    try {
      const response = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: sanitizedPhone })
      });
      const data = await response.json();

      if (!response.ok) {
        setAuthStatus("error");
        setAuthMessage(data.message || "Unable to send OTP.");
        return;
      }

      setOtpRequested(true);
      setCustomer((prev) => ({ ...prev, phone: sanitizedPhone }));
      setAuthStatus("idle");
      setAuthMessage(data.message || "OTP sent successfully. Enter the 6-digit code to continue.");
    } catch (error) {
      setAuthStatus("error");
      setAuthMessage(error instanceof Error ? error.message : "Unable to send OTP.");
    }
  }

  async function verifyOtp() {
    setAuthStatus("loading");
    const sanitizedPhone = otpPhone.replace(/\D/g, "");
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: sanitizedPhone, otp: otpCode })
      });
      const data = await response.json();

      if (!response.ok) {
        setAuthStatus("error");
        setAuthMessage(data.message || "Unable to verify OTP.");
        return;
      }

      if (data.token) {
        storeAuthToken(data.token);
      }
      storeVerifiedMobile(sanitizedPhone);
      setPatientAuthId(data.user?.patientId);
      await loadPatientContext();
      setAuthStatus("idle");
      setAuthMessage(data.message || "Login successful.");
      setStep("select");
    } catch (error) {
      setAuthStatus("error");
      setAuthMessage(error instanceof Error ? error.message : "Unable to verify OTP.");
    }
  }

  async function createOrder() {
    setIsSubmitting(true);
    setSubmitMessage("");
    try {
      const bookingCustomer = normalizedCustomer;
      const normalizedPatients = bookingPatients.length ? bookingPatients : [createSelfPatient(savedProfile, bookingCustomer.phone || otpPhone, selectedIds)];
      const bookingPatientsPayload: BookingPatientInput[] = normalizedPatients.map((patient) => ({
        patientId: patient.patientId,
        patientType: patient.patientType,
        familyMemberId: patient.familyMemberId || null,
        name: patient.name,
        relation: patient.relation,
        age: patient.age || "",
        dob: patient.dob || "",
        gender: patient.gender || "",
        mobile: patient.mobile || "",
        tests: getItemsForPatient(patient)
      }));

      const response = await backendFetch("/booking/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: bookingCustomer,
          patientAuthId,
          patientType: bookingPatientsPayload[0]?.patientType || "self",
          familyMemberId: bookingPatientsPayload[0]?.patientType === "family" ? bookingPatientsPayload[0].familyMemberId || null : null,
          bookingPatients: bookingPatientsPayload,
          familyMembers: bookingFamilyMembers,
          items: allPatientItems.length ? allPatientItems : selectedItems,
          quote,
          paymentMethod
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setIsSubmitting(false);
        setSubmitMessage(data.message || "Unable to create order. Please check your details and try again.");
        return null;
      }

      if (!data.orderId) {
        setIsSubmitting(false);
        setSubmitMessage("Booking was not created correctly. Please try again.");
        return null;
      }

      setOrderId(data.orderId);
      setCustomer(bookingCustomer);
      await uploadPreviousReports(data.orderId, data.bookingId);
      return data.orderId as string;
    } catch (error) {
      setIsSubmitting(false);
      setSubmitMessage(error instanceof Error ? error.message : "Unable to create order. Please try again.");
      return null;
    }
  }

  async function handleOnlinePayment() {
    const createdOrderId = await createOrder();
    if (!createdOrderId) return;

    let razorpayOrder: Record<string, unknown>;
    try {
      const razorpayResponse = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(quote.payableAmount * 100),
          currency: "INR",
          receipt: createdOrderId
        })
      });

      razorpayOrder = await razorpayResponse.json().catch(() => ({}));
      if (!razorpayResponse.ok) {
        setIsSubmitting(false);
        setSubmitMessage(typeof razorpayOrder.message === "string" ? razorpayOrder.message : "Unable to create Razorpay order.");
        return;
      }
    } catch (error) {
      setIsSubmitting(false);
      setSubmitMessage(error instanceof Error ? error.message : "Unable to connect to Razorpay. Please try again.");
      return;
    }

    if (!razorpayOrder?.id || !razorpayOrder?.amount || !razorpayOrder?.currency || !razorpayOrder?.keyId) {
      setIsSubmitting(false);
      setSubmitMessage("Invalid Razorpay order response. Please try again.");
      return;
    }

    try {
      await loadRazorpayCheckout();
    } catch (error) {
      setIsSubmitting(false);
      setSubmitMessage(error instanceof Error ? error.message : "Razorpay checkout is unavailable. Please try again.");
      return;
    }

    if (!window.Razorpay) {
      setIsSubmitting(false);
      setSubmitMessage("Razorpay checkout is unavailable. Please refresh and try again.");
      return;
    }

    const instance = new window.Razorpay({
      key: razorpayOrder.keyId,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      order_id: razorpayOrder.id,
      name: "ScopeX Diagnostics",
      description: "Diagnostic booking",
      prefill: {
        name: normalizedCustomer.fullName,
        contact: normalizedCustomer.phone,
        email: normalizedCustomer.email
      },
      theme: { color: "#F7931E" },
      handler: async (response: Record<string, string>) => {
        setIsSubmitting(true);
        setSubmitMessage("Verifying payment...");
        const verifyResponse = await backendFetch("/payment/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: createdOrderId,
            razorpayOrderId: response.razorpay_order_id || razorpayOrder.id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
            amount: quote.payableAmount
          })
        });

        const verifyData = await verifyResponse.json().catch(() => ({}));
        if (!verifyResponse.ok) {
          setIsSubmitting(false);
          setSubmitMessage(verifyData.message || "Payment verification failed. Please contact support.");
          return;
        }

        setPaymentId(response.razorpay_payment_id ?? "");
        setIsSubmitting(false);
        setStep("success");
      },
      modal: {
        ondismiss: () => {
          setIsSubmitting(false);
          setSubmitMessage("Payment window closed. You can try again.");
        }
      }
    });

    instance.on?.("payment.failed", (response: { error?: { description?: string; reason?: string } }) => {
      setIsSubmitting(false);
      setSubmitMessage(response.error?.description || response.error?.reason || "Payment failed. Please try again.");
    });

    try {
      instance.open();
      setIsSubmitting(false);
      setSubmitMessage("Razorpay payment window opened. Complete payment there.");
    } catch (error) {
      setIsSubmitting(false);
      setSubmitMessage(error instanceof Error ? error.message : "Unable to open Razorpay checkout.");
    }
  }

  async function handleCodConfirmation() {
    const createdOrderId = await createOrder();
    if (!createdOrderId) return;
    setIsSubmitting(false);
    setStep("success");
  }

  const patientSelectionValid =
    bookingPatients.length > 0 &&
    bookingPatients.every((patient) => patient.name.trim() && (patient.age || patient.dob) && patient.gender && patient.itemIds.length > 0);
  const newFamilyMemberReady =
    Boolean(newFamilyForm.name.trim()) &&
    Boolean(newFamilyForm.relation) &&
    Boolean(newFamilyForm.age || newFamilyForm.dob) &&
    Boolean(newFamilyForm.gender);

  const normalizedCustomer = useMemo<BookingCustomerInput>(() => {
    const cleanAddress = customer.address.trim();
    const cleanCity =
      customer.city.trim() ||
      savedProfile?.city?.trim() ||
      (cleanAddress.toLowerCase().includes("indore") ? "Indore" : "");

    return {
      fullName: customer.fullName.trim(),
      phone: customer.phone.replace(/\D/g, "").slice(0, 10),
      email: customer.email.trim(),
      city: cleanCity,
      address: cleanAddress,
      preferredDate: customer.preferredDate,
      preferredTime: customer.preferredTime
    };
  }, [customer, savedProfile]);

  const missingDetailLabels = useMemo(() => {
    const missing: string[] = [];
    if (!patientSelectionValid) missing.push("complete patient details and selected tests");
    if (!normalizedCustomer.fullName) missing.push("patient name");
    if (!/^\d{10}$/.test(normalizedCustomer.phone)) missing.push("10-digit mobile number");
    if (!normalizedCustomer.address) missing.push("collection address");
    if (!normalizedCustomer.city) missing.push("city");
    if (!normalizedCustomer.preferredDate) missing.push("collection date");
    if (!normalizedCustomer.preferredTime) missing.push("collection time");
    return missing;
  }, [normalizedCustomer, patientSelectionValid]);

  const detailsValid = missingDetailLabels.length === 0;

  function continueToReview() {
    if (!detailsValid) {
      setDetailsMessage(`Please complete: ${missingDetailLabels.join(", ")}.`);
      return;
    }
    setDetailsMessage("");
    setCustomer(normalizedCustomer);
    setStep("review");
  }

  return (
    <div className="space-y-6">
      <Script id="razorpay-checkout-js" src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />

      {step !== "auth" && isLoggedIn ? (
        <div className="flex flex-col gap-4 rounded-[24px] border border-[#f1dfce] bg-white p-4 shadow-[0_12px_28px_rgba(16,24,40,0.05)] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#F7931E]">Logged in</p>
            <h3 className="mt-1 text-xl font-bold text-[#0D0D0D]">Hi, {loggedInName}</h3>
            {loggedInMobile ? <p className="mt-1 text-sm text-[#5f6868]">Mobile: {loggedInMobile}</p> : null}
          </div>
          <button type="button" onClick={logoutPatient} className="secondary-btn w-full sm:w-auto">
            Logout
          </button>
        </div>
      ) : null}

      {step === "auth" ? (
        <div className="rounded-[28px] border border-[#f1dfce] bg-white p-6 shadow-[0_16px_36px_rgba(16,24,40,0.06)]">
          <SectionTitle
            eyebrow="Patient Login"
            title="Login with OTP to start booking"
            description="Secure patient login lets us save your details, family members, offers, and orders in one place."
          />

          <div className="mt-6 grid gap-4 md:max-w-md">
            <input
              value={otpPhone}
              onChange={(event) => setOtpPhone(event.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="10-digit mobile number"
              inputMode="numeric"
              className="rounded-2xl border border-[#f1dfce] bg-white px-4 py-3 text-sm text-[#0D0D0D] outline-none transition focus:border-[#F7931E]"
            />
            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={requestOtp} className="cta-btn w-full sm:w-auto" disabled={authStatus === "loading"}>
                {authStatus === "loading" ? "Sending..." : "Send OTP"}
              </button>
              {otpRequested ? (
                <input
                  value={otpCode}
                  onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Enter OTP"
                  inputMode="numeric"
                  className="rounded-2xl border border-[#f1dfce] bg-white px-4 py-3 text-sm text-[#0D0D0D] outline-none transition focus:border-[#F7931E]"
                />
              ) : null}
            </div>
            {otpRequested ? (
              <button type="button" onClick={verifyOtp} className="secondary-btn w-full sm:w-fit" disabled={authStatus === "loading" || otpCode.length !== 6}>
                Verify OTP
              </button>
            ) : null}
            {authMessage ? <p className={`text-sm ${authStatus === "error" ? "text-red-600" : "text-[#F7931E]"}`}>{authMessage}</p> : null}
          </div>
        </div>
      ) : null}

      {step === "select" ? (
        <div className="rounded-[28px] border border-[#f1dfce] bg-white p-6 shadow-[0_16px_36px_rgba(16,24,40,0.06)]">
          <SectionTitle
            eyebrow="Step 1"
            title="Choose tests and packages"
            description="Select one or more packages or tests. We will automatically apply first-time and family discounts at checkout."
          />

          <div className="mt-6 flex flex-wrap gap-3">
            {(["packages", "tests"] as CatalogMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setCatalogMode(mode)}
                className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${catalogMode === mode ? "bg-[#F7931E] text-white" : "bg-[#eef7f6] text-[#264547]"}`}
              >
                {mode}
              </button>
            ))}
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`Search ${catalogMode}`}
              className="min-w-[260px] flex-1 rounded-full border border-[#f1dfce] px-4 py-2.5 text-sm outline-none focus:border-[#F7931E]"
            />
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {visibleCatalog.map((item) => {
              const selected = selectedIds.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleSelection(item.id)}
                  className={`rounded-[24px] border p-5 text-left transition ${selected ? "border-[#F7931E] bg-[#FFF8F2] shadow-[0_16px_36px_rgba(15,143,124,0.08)]" : "border-[#f1dfce] bg-white hover:border-[#cfe4df]"}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#F7931E]">{item.kind}</p>
                      <h3 className="mt-2 text-xl font-bold text-[#0D0D0D]">{item.name}</h3>
                      <p className="mt-2 text-sm leading-7 text-[#5f6868]">{item.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-extrabold text-[#F7931E]">{formatInr(item.price)}</p>
                      <p className="text-xs text-[#7c8f90] line-through">{formatInr(item.mrp)}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="rounded-full bg-[#fff7f1] px-3 py-1 font-semibold text-[#F7931E]">{item.discount}% OFF</span>
                    <span className={`font-semibold ${selected ? "text-[#F7931E]" : "text-[#264547]"}`}>{selected ? "Selected" : "Tap to add"}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex flex-col gap-3 rounded-[24px] border border-[#f1dfce] bg-[#FFF8F2] p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#0D0D0D]">{selectedItems.length} item(s) selected</p>
              <p className="text-sm text-[#5f6868]">Subtotal: {formatInr(quote.subtotal)}</p>
            </div>
            <button type="button" onClick={() => setStep("patient")} className="cta-btn w-full md:w-auto" disabled={!selectedItems.length}>
              Continue
            </button>
          </div>
        </div>
      ) : null}

      {step === "patient" ? (
        <div className="rounded-[28px] border border-[#f1dfce] bg-white p-6 shadow-[0_16px_36px_rgba(16,24,40,0.06)]">
          <SectionTitle
            eyebrow="Step 2"
            title="Select patients and tests"
            description="Choose Self or saved family members, then keep the same tests or assign different tests for each patient."
          />

          <div className="mt-6 rounded-[24px] border border-[#f1dfce] bg-[#FFF8F2] p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-bold text-[#0D0D0D]">Patients in this booking</h3>
                <p className="mt-1 text-sm text-[#5f6868]">Select multiple saved members without creating duplicates.</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button type="button" onClick={ensureSelfPatient} className="secondary-btn w-full sm:w-auto">Add Self</button>
                <button type="button" onClick={() => setFamilyPickerOpen((current) => !current)} className="cta-btn w-full sm:w-auto">Add family member</button>
              </div>
            </div>

            {familyPickerOpen ? (
              <div className="mt-5 rounded-[24px] border border-[#f1dfce] bg-white p-4">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {savedFamilyMembers.map((member) => {
                    const selected = bookingPatients.some((patient) => patient.familyMemberId === member.id);
                    return (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => toggleSavedFamilyMember(member)}
                        className={`rounded-[20px] border p-4 text-left transition ${selected ? "border-[#F7931E] bg-[#effaf7]" : "border-[#f1dfce] bg-white hover:border-[#F7931E]"}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-bold text-[#0D0D0D]">{member.name}</p>
                            <p className="mt-1 text-sm text-[#5f6868]">{member.relation} - {member.age ? `${member.age} yrs` : member.dob || "Age missing"} - {member.gender || "Gender missing"}</p>
                          </div>
                          {member.is_default ? <span className="rounded-full bg-[#e9fbf7] px-2 py-1 text-[10px] font-bold uppercase text-[#F7931E]">Default</span> : null}
                        </div>
                        <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-[#F7931E]">{selected ? "Selected" : "Tap to select"}</p>
                      </button>
                    );
                  })}
                  {savedFamilyMembers.length === 0 ? <p className="rounded-[20px] border border-[#f1dfce] bg-[#FFF8F2] p-4 text-sm text-[#5f6868]">No saved family members yet.</p> : null}
                </div>

                <button type="button" onClick={() => setShowNewFamilyForm((current) => !current)} className="secondary-btn mt-4 w-full sm:w-auto">
                  {showNewFamilyForm ? "Hide new member form" : "Add new family member"}
                </button>

                {showNewFamilyForm ? (
                  <div className="mt-4 grid gap-3 rounded-[20px] border border-[#f1dfce] bg-[#FFF8F2] p-4 md:grid-cols-3">
                    <input value={newFamilyForm.name} onChange={(event) => setNewFamilyForm((current) => ({ ...current, name: event.target.value }))} placeholder="Name" className="rounded-2xl border border-[#f1dfce] px-4 py-3 text-sm outline-none focus:border-[#F7931E]" />
                    <select
                      value={newFamilyForm.relation}
                      onChange={(event) => {
                        const relation = event.target.value;
                        setNewFamilyForm((current) => ({
                          ...current,
                          relation,
                          gender: current.gender || genderFromRelation(relation)
                        }));
                      }}
                      className="rounded-2xl border border-[#f1dfce] px-4 py-3 text-sm outline-none focus:border-[#F7931E]"
                    >
                      {relationOptions.map((relation) => <option key={relation}>{relation}</option>)}
                    </select>
                    <input value={newFamilyForm.age} onChange={(event) => setNewFamilyForm((current) => ({ ...current, age: event.target.value.replace(/\D/g, "").slice(0, 3) }))} placeholder="Age" inputMode="numeric" className="rounded-2xl border border-[#f1dfce] px-4 py-3 text-sm outline-none focus:border-[#F7931E]" />
                    <input value={newFamilyForm.dob} onChange={(event) => setNewFamilyForm((current) => ({ ...current, dob: event.target.value }))} type="date" className="rounded-2xl border border-[#f1dfce] px-4 py-3 text-sm outline-none focus:border-[#F7931E]" />
                    <select value={newFamilyForm.gender} onChange={(event) => setNewFamilyForm((current) => ({ ...current, gender: event.target.value }))} className={`rounded-2xl border px-4 py-3 text-sm outline-none focus:border-[#F7931E] ${newFamilyForm.gender ? "border-[#f1dfce]" : "border-[#F7931E] bg-[#fff8f3]"}`}>
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                    <input value={newFamilyForm.mobile} onChange={(event) => setNewFamilyForm((current) => ({ ...current, mobile: event.target.value.replace(/\D/g, "").slice(0, 10) }))} placeholder="Mobile optional" inputMode="numeric" className="rounded-2xl border border-[#f1dfce] px-4 py-3 text-sm outline-none focus:border-[#F7931E]" />
                    <button type="button" onClick={addNewFamilyMemberToBooking} disabled={!newFamilyMemberReady || savingFamilyMember} className="cta-btn md:col-span-3 disabled:cursor-not-allowed disabled:opacity-60">
                      {savingFamilyMember ? "Saving member..." : "Save and add to booking"}
                    </button>
                    {!newFamilyMemberReady ? <p className="text-xs font-semibold text-[#F7931E] md:col-span-3">Name, relation, age/DOB, and gender are required.</p> : null}
                  </div>
                ) : null}
              </div>
            ) : null}

            {patientMessage ? <p className="mt-4 text-sm font-semibold text-red-600">{patientMessage}</p> : null}
          </div>

          <div className="mt-6 grid gap-4">
            {bookingPatients.length === 0 ? (
              <div className="rounded-[24px] border border-[#ffd6bf] bg-[#fff7f1] p-5 text-sm text-[#8a3b13]">
                Add Self or a saved family member to continue.
              </div>
            ) : null}

            {bookingPatients.map((patient) => {
              const patientMode = patientCatalogMode[patient.patientId] || "packages";
              const query = (patientSearch[patient.patientId] || "").trim().toLowerCase();
              const patientCatalog = (patientMode === "packages" ? bookingPackages : bookingTests).filter((item) =>
                !query ? true : `${item.name} ${item.category} ${item.description}`.toLowerCase().includes(query)
              );
              const patientItems = getItemsForPatient(patient);
              const missingDetails = !patient.age && !patient.dob || !patient.gender;
              return (
                <article key={patient.patientId} className="overflow-hidden rounded-[30px] border border-[#f1dfce] bg-white shadow-[0_14px_34px_rgba(16,24,40,0.06)]">
                  <div className="border-b border-[#e5f0ee] bg-gradient-to-r from-[#f6fffc] via-white to-[#fff7f1] p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#e9fbf7] text-xl font-black uppercase text-[#F7931E]">
                          {(patient.name || patient.relation || "P").slice(0, 1)}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-[#e9fbf7] px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[#F7931E]">{patient.relation}</span>
                            {missingDetails ? <span className="rounded-full bg-[#fff3ea] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#F7931E]">Details needed</span> : null}
                          </div>
                          <h3 className="mt-2 text-2xl font-black text-[#0D0D0D]">{patient.name || "Patient name"}</h3>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-full border border-[#f1dfce] bg-white px-3 py-1 text-xs font-bold text-[#264547]">{patientItems.length} selected item(s)</span>
                            <span className="rounded-full border border-[#ffd8bf] bg-white px-3 py-1 text-xs font-bold text-[#F7931E]">{formatInr(getPatientSubtotal(patient))}</span>
                            <span className="rounded-full border border-[#f1dfce] bg-white px-3 py-1 text-xs font-bold text-[#264547]">{patient.mode === "same" ? "Same package" : "Custom tests"}</span>
                          </div>
                        </div>
                      </div>
                      <button type="button" onClick={() => removeBookingPatient(patient.patientId)} className="rounded-full border border-[#ffd8bf] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#F7931E] transition hover:bg-[#fff3ea]">Remove</button>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="grid gap-3 md:grid-cols-4">
                      <label className="space-y-1">
                        <span className="text-[11px] font-black uppercase tracking-[0.16em] text-[#789092]">Patient name</span>
                        <input value={patient.name} onChange={(event) => updateBookingPatient(patient.patientId, { name: event.target.value })} placeholder="Patient name" className="w-full rounded-2xl border border-[#f1dfce] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#F7931E] focus:ring-4 focus:ring-[#e9fbf7]" />
                      </label>
                      <label className="space-y-1">
                        <span className="text-[11px] font-black uppercase tracking-[0.16em] text-[#789092]">Age</span>
                        <input value={patient.age || ""} onChange={(event) => updateBookingPatient(patient.patientId, { age: event.target.value.replace(/\D/g, "").slice(0, 3) })} placeholder="Age" inputMode="numeric" className="w-full rounded-2xl border border-[#f1dfce] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#F7931E] focus:ring-4 focus:ring-[#e9fbf7]" />
                      </label>
                      <label className="space-y-1">
                        <span className="text-[11px] font-black uppercase tracking-[0.16em] text-[#789092]">DOB optional</span>
                        <input value={patient.dob || ""} onChange={(event) => updateBookingPatient(patient.patientId, { dob: event.target.value })} type="date" className="w-full rounded-2xl border border-[#f1dfce] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#F7931E] focus:ring-4 focus:ring-[#e9fbf7]" />
                      </label>
                      <label className="space-y-1">
                        <span className="text-[11px] font-black uppercase tracking-[0.16em] text-[#789092]">Gender</span>
                        <select value={patient.gender || ""} onChange={(event) => updateBookingPatient(patient.patientId, { gender: event.target.value })} className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none transition focus:border-[#F7931E] focus:ring-4 focus:ring-[#e9fbf7] ${patient.gender ? "border-[#f1dfce]" : "border-[#F7931E]"}`}>
                          <option value="">Select gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </label>
                    </div>
                    {missingDetails ? <p className="mt-3 rounded-2xl bg-[#fff7f1] px-4 py-3 text-xs font-bold text-[#b4480f]">Complete age/DOB and gender before proceeding.</p> : null}

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <button type="button" onClick={() => setPatientMode(patient.patientId, "same")} className={`rounded-2xl border px-4 py-4 text-left transition ${patient.mode === "same" ? "border-[#F7931E] bg-[#effaf7] shadow-[0_8px_18px_rgba(15,143,124,0.12)]" : "border-[#f1dfce] bg-white hover:border-[#F7931E]"}`}>
                        <span className="text-sm font-black text-[#0D0D0D]">Apply same test/package</span>
                        <span className="mt-1 block text-xs text-[#5f6868]">Copy selected main cart items</span>
                      </button>
                      <button type="button" onClick={() => setPatientMode(patient.patientId, "different")} className={`rounded-2xl border px-4 py-4 text-left transition ${patient.mode === "different" ? "border-[#F7931E] bg-[#effaf7] shadow-[0_8px_18px_rgba(15,143,124,0.12)]" : "border-[#f1dfce] bg-white hover:border-[#F7931E]"}`}>
                        <span className="text-sm font-black text-[#0D0D0D]">Choose different test/package</span>
                        <span className="mt-1 block text-xs text-[#5f6868]">Assign custom items to this patient</span>
                      </button>
                    </div>

                    {patient.mode === "different" ? (
                    <div className="mt-5 rounded-[24px] border border-[#f1dfce] bg-[#FFF8F2] p-4">
                      <div className="flex flex-col gap-3 md:flex-row">
                        <div className="flex gap-2">
                          {(["packages", "tests"] as CatalogMode[]).map((mode) => (
                            <button key={mode} type="button" onClick={() => setPatientCatalogMode((current) => ({ ...current, [patient.patientId]: mode }))} className={`rounded-full px-4 py-2 text-sm font-black capitalize transition ${patientMode === mode ? "bg-[#F7931E] text-white shadow-[0_8px_18px_rgba(15,143,124,0.16)]" : "bg-white text-[#F7931E] hover:bg-[#effaf7]"}`}>{mode}</button>
                          ))}
                        </div>
                        <input value={patientSearch[patient.patientId] || ""} onChange={(event) => setPatientSearch((current) => ({ ...current, [patient.patientId]: event.target.value }))} placeholder="Search tests or packages" className="min-w-0 flex-1 rounded-full border border-[#f1dfce] px-4 py-2.5 text-sm outline-none focus:border-[#F7931E]" />
                      </div>
                      <div className="mt-4 grid max-h-72 gap-3 overflow-y-auto pr-1 md:grid-cols-2">
                        {patientCatalog.map((item) => {
                          const picked = patient.itemIds.includes(item.id);
                          const saving = Math.max(0, item.mrp - item.price);
                          return (
                            <button key={item.id} type="button" onClick={() => togglePatientItem(patient.patientId, item.id)} className={`rounded-2xl border p-4 text-left transition hover:border-[#F7931E] ${picked ? "border-[#F7931E] bg-white shadow-[0_10px_22px_rgba(15,143,124,0.12)]" : "border-[#f1dfce] bg-white/80"}`}>
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-bold text-[#0D0D0D]">{item.name}</p>
                                  <p className="mt-1 text-xs text-[#5f6868]">{item.kind} - {item.category}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-black text-[#F7931E]">{formatInr(item.price)}</p>
                                  {saving > 0 ? <p className="text-[11px] font-semibold text-[#7c8f90] line-through">{formatInr(item.mrp)}</p> : null}
                                </div>
                              </div>
                              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                                <div className="flex flex-wrap gap-2">
                                  {item.discount > 0 ? <span className="rounded-full bg-[#fff3ea] px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-[#F7931E]">{item.discount}% OFF</span> : null}
                                  {saving > 0 ? <span className="rounded-full bg-[#e9fbf7] px-2.5 py-1 text-[11px] font-bold text-[#F7931E]">Save {formatInr(saving)}</span> : null}
                                </div>
                                <p className="text-xs font-black uppercase tracking-[0.12em] text-[#F7931E]">{picked ? "Selected" : "Add"}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-6 flex justify-between gap-3">
            <button type="button" onClick={() => setStep("select")} className="secondary-btn w-full sm:w-auto">Back</button>
            <button type="button" onClick={continueFromPatients} className="cta-btn w-full sm:w-auto">Continue to slot</button>
          </div>
        </div>
      ) : null}
      {step === "details" ? (
        <div className="rounded-[28px] border border-[#f1dfce] bg-white p-6 shadow-[0_16px_36px_rgba(16,24,40,0.06)]">
          <SectionTitle
            eyebrow="Step 2"
            title="Slot and home collection address"
            description="Confirm the collection date, time slot, and address. Selected patients and their tests are shown below."
          />

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <input value={customer.fullName} onChange={(e) => updateCustomer("fullName", e.target.value)} placeholder="Full Name" className="rounded-2xl border border-[#f1dfce] px-4 py-3 text-sm outline-none focus:border-[#F7931E]" />
            <input value={customer.phone} onChange={(e) => updateCustomer("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="Mobile Number" className="rounded-2xl border border-[#f1dfce] px-4 py-3 text-sm outline-none focus:border-[#F7931E]" />
            <input value={customer.email} onChange={(e) => updateCustomer("email", e.target.value)} placeholder="Email" className="rounded-2xl border border-[#f1dfce] px-4 py-3 text-sm outline-none focus:border-[#F7931E]" />
            <input value={customer.city} onChange={(e) => updateCustomer("city", e.target.value)} placeholder="City" className="rounded-2xl border border-[#f1dfce] px-4 py-3 text-sm outline-none focus:border-[#F7931E]" />
            <input value={customer.preferredDate} onChange={(e) => updateCustomer("preferredDate", e.target.value)} type="date" min={new Date().toISOString().split("T")[0]} className="rounded-2xl border border-[#f1dfce] px-4 py-3 text-sm outline-none focus:border-[#F7931E]" />
            <select value={customer.preferredTime} onChange={(e) => updateCustomer("preferredTime", e.target.value)} className="rounded-2xl border border-[#f1dfce] px-4 py-3 text-sm outline-none focus:border-[#F7931E]">
              <option value="">Preferred collection time</option>
              {slotOptions.map((slot) => (
                <option key={slot} value={slot}>{slot}</option>
              ))}
            </select>
            <input value={customer.address} onChange={(e) => updateCustomer("address", e.target.value)} placeholder="Address" className="rounded-2xl border border-[#f1dfce] px-4 py-3 text-sm outline-none focus:border-[#F7931E] md:col-span-2" />
          </div>

          <div className="mt-6 rounded-[24px] border border-dashed border-[#bddbd6] bg-[#FFF8F2] p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h3 className="text-xl font-bold text-[#0D0D0D]">Upload previous medical reports</h3>
                <p className="mt-1 text-sm text-[#5f6868]">Optional. PDF only, up to 10 MB each. Multiple uploads allowed.</p>
              </div>
              <label className="secondary-btn cursor-pointer">
                Choose PDFs
                <input
                  type="file"
                  accept="application/pdf"
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    if (event.target.files) addPreviousReports(event.target.files);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
            </div>
            <div
              className="mt-4 rounded-[20px] border border-dashed border-[#f7d7bb] bg-white px-4 py-6 text-center text-sm text-[#5f6868]"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                addPreviousReports(event.dataTransfer.files);
              }}
            >
              Drag & drop PDF reports here
            </div>
            {previousReports.length ? (
              <div className="mt-4 grid gap-3">
                {previousReports.map((report) => (
                  <div key={report.id} className="rounded-2xl border border-[#f1dfce] bg-white p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-[#0D0D0D]">{report.file.name}</p>
                        <p className="text-xs text-[#7c8f90]">{(report.file.size / (1024 * 1024)).toFixed(2)} MB - {report.status}</p>
                      </div>
                      <button type="button" onClick={() => removePreviousReport(report.id)} className="text-xs font-black uppercase tracking-[0.12em] text-[#F7931E]">Remove</button>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e7f2f0]">
                      <div className="h-full rounded-full bg-[#F7931E] transition-all" style={{ width: `${report.progress}%` }} />
                    </div>
                    {report.message ? <p className="mt-2 text-xs text-red-600">{report.message}</p> : null}
                  </div>
                ))}
              </div>
            ) : null}
            {reportUploadMessage ? <p className="mt-3 text-sm font-semibold text-[#F7931E]">{reportUploadMessage}</p> : null}
          </div>

          <div className="mt-8 rounded-[24px] border border-[#f1dfce] bg-[#FFF8F2] p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-bold text-[#0D0D0D]">Selected patients</h3>
                <p className="mt-1 text-sm text-[#5f6868]">Review patient-wise test count and price before payment.</p>
              </div>
              <button type="button" onClick={() => setStep("patient")} className="secondary-btn w-full sm:w-auto">Edit patients/tests</button>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {bookingPatients.map((patient) => (
                <article key={patient.patientId} className="rounded-[20px] border border-[#f1dfce] bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-[#0D0D0D]">{patient.name}</p>
                      <p className="mt-1 text-sm text-[#5f6868]">{patient.relation} - {patient.age || patient.dob} - {patient.gender}</p>
                    </div>
                    <p className="font-bold text-[#F7931E]">{formatInr(getPatientSubtotal(patient))}</p>
                  </div>
                  <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-[#F7931E]">{getItemsForPatient(patient).length} selected item(s)</p>
                </article>
              ))}
            </div>
          </div>

          {detailsMessage ? <p className="mt-4 text-sm font-semibold text-red-600">{detailsMessage}</p> : null}

          <div className="mt-6 flex justify-between gap-3">
            <button type="button" onClick={() => setStep("patient")} className="secondary-btn w-full sm:w-auto">Back</button>
            <button type="button" onClick={continueToReview} className="cta-btn w-full sm:w-auto">Review & Pay</button>
          </div>
        </div>
      ) : null}

      {step === "review" ? (
        <div className="rounded-[28px] border border-[#f1dfce] bg-white p-6 shadow-[0_16px_36px_rgba(16,24,40,0.06)]">
          <SectionTitle
            eyebrow="Step 3"
            title="Review booking and payment"
            description="Review your items, discounts, and choose how you want to pay. Online payments are powered by Razorpay."
          />

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4">
              <div className="rounded-[24px] border border-[#f1dfce] bg-[#FFF8F2] p-5">
                <h3 className="text-xl font-bold text-[#0D0D0D]">Patient-wise selected items</h3>
                <div className="mt-4 space-y-3">
                  {bookingPatients.map((patient) => (
                    <div key={patient.patientId} className="rounded-2xl bg-white px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-[#0D0D0D]">{patient.name}</p>
                          <p className="text-sm text-[#5f6868]">{patient.relation} - {getItemsForPatient(patient).length} item(s)</p>
                        </div>
                        <p className="font-bold text-[#F7931E]">{formatInr(getPatientSubtotal(patient))}</p>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {getItemsForPatient(patient).map((item) => (
                          <span key={`${patient.patientId}-${item.id}`} className="rounded-full bg-[#effaf7] px-3 py-1 text-xs font-bold text-[#F7931E]">{item.name}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[24px] border border-[#f1dfce] bg-[#FFF8F2] p-5">
                <h3 className="text-xl font-bold text-[#0D0D0D]">Payment method</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <button type="button" onClick={() => setPaymentMethod("online")} className={`rounded-[20px] border px-4 py-4 text-left ${paymentMethod === "online" ? "border-[#F7931E] bg-white" : "border-[#f1dfce] bg-white"}`}>
                    <p className="font-semibold text-[#0D0D0D]">Pay Online</p>
                    <p className="mt-1 text-sm text-[#5f6868]">UPI, cards, net banking via Razorpay</p>
                  </button>
                  <button type="button" onClick={() => setPaymentMethod("cod")} className={`rounded-[20px] border px-4 py-4 text-left ${paymentMethod === "cod" ? "border-[#F7931E] bg-white" : "border-[#f1dfce] bg-white"}`}>
                    <p className="font-semibold text-[#0D0D0D]">Pay at Home</p>
                    <p className="mt-1 text-sm text-[#5f6868]">Confirm booking now, pay at collection time</p>
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-[#f1dfce] bg-[#FFF8F2] p-5">
              <h3 className="text-xl font-bold text-[#0D0D0D]">Order summary</h3>
              <div className="mt-4 space-y-3 text-sm text-[#5f6868]">
                <div className="flex justify-between"><span>Total MRP</span><span>{formatInr(totalMrp)}</span></div>
                {packageDiscountTotal > 0 ? (
                  <div className="flex justify-between text-[#F7931E]"><span>Package/Test discount</span><span>- {formatInr(packageDiscountTotal)}</span></div>
                ) : null}
                <div className="flex justify-between"><span>Subtotal after discount</span><span>{formatInr(quote.subtotal)}</span></div>
                {quote.appliedOffers.map((offer) => (
                  <div key={offer.code} className="flex justify-between text-[#F7931E]"><span>{offer.title}</span><span>- {formatInr(offer.discountAmount)}</span></div>
                ))}
                {specialDiscountTotal > 0 ? (
                  <div className="flex justify-between font-semibold text-[#F7931E]"><span>Special discount total</span><span>- {formatInr(specialDiscountTotal)}</span></div>
                ) : null}
                <div className="border-t border-[#f1dfce] pt-3 flex justify-between text-base font-bold text-[#0D0D0D]"><span>Payable</span><span>{formatInr(quote.payableAmount)}</span></div>
                {totalSavings > 0 ? (
                  <div className="rounded-2xl bg-[#e9fbf7] px-4 py-3 text-center font-black text-[#F7931E]">You save {formatInr(totalSavings)} on this booking</div>
                ) : null}
              </div>

              <div className="mt-4 rounded-2xl bg-white p-4 text-sm text-[#5f6868]">
                <p><span className="font-semibold text-[#0D0D0D]">Patient:</span> {normalizedCustomer.fullName}</p>
                <p className="mt-1"><span className="font-semibold text-[#0D0D0D]">Collection:</span> {normalizedCustomer.preferredDate} - {normalizedCustomer.preferredTime}</p>
                <p className="mt-1"><span className="font-semibold text-[#0D0D0D]">Address:</span> {normalizedCustomer.address}, {normalizedCustomer.city}</p>
                <p className="mt-1"><span className="font-semibold text-[#0D0D0D]">Patients covered:</span> {bookingPatients.length}</p>
              </div>

              <div className="mt-5 flex flex-col gap-3">
                {paymentMethod === "online" ? (
                  <button type="button" onClick={handleOnlinePayment} className="cta-btn w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Opening Razorpay..." : "Pay with Razorpay"}
                  </button>
                ) : (
                  <button type="button" onClick={handleCodConfirmation} className="cta-btn w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Creating order..." : "Confirm booking"}
                  </button>
                )}
                <button type="button" onClick={() => setStep("patient")} className="secondary-btn w-full">Back</button>
              </div>
              {submitMessage ? <p className="mt-4 text-sm text-red-600">{submitMessage}</p> : null}
            </div>
          </div>
        </div>
      ) : null}

      {step === "success" ? (
        <div className="rounded-[28px] border border-[#f1dfce] bg-white p-6 shadow-[0_16px_36px_rgba(16,24,40,0.06)]">
          <SectionTitle
            eyebrow="Booking confirmed"
            title="Your ScopeX booking is created"
            description="We have saved your booking. Our operations team will coordinate collection, and your patient dashboard can track the order status."
          />
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-[20px] border border-[#f1dfce] bg-[#FFF8F2] p-4">
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#F7931E]">Order ID</p>
              <p className="mt-2 text-xl font-bold text-[#0D0D0D]">{orderId}</p>
            </div>
            <div className="rounded-[20px] border border-[#f1dfce] bg-[#FFF8F2] p-4">
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#F7931E]">Payment</p>
              <p className="mt-2 text-xl font-bold text-[#0D0D0D]">{paymentMethod === "online" ? "Paid online" : "Pay at home"}</p>
            </div>
            <div className="rounded-[20px] border border-[#f1dfce] bg-[#FFF8F2] p-4">
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#F7931E]">Reference</p>
              <p className="mt-2 text-xl font-bold text-[#0D0D0D]">{paymentId || "Pending"}</p>
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/patient" className="cta-btn w-full sm:w-auto">Go to patient dashboard</Link>
            <Link href="/health-advisor" className="secondary-btn w-full sm:w-auto">Talk to Advisor</Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}



