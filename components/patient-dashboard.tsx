"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  FileText,
  Download,
  Calendar,
  User,
  Users,
  LogOut,
  ChevronRight,
  AlertCircle,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  MapPin,
  Phone,
  ArrowRight,
  X
} from "lucide-react";
import { packagesData } from "@/lib/data";
import { backendFetch, getStoredAuthToken, logoutAuthSession } from "@/lib/backend-client";
import { clearVerifiedMobile } from "@/lib/otp-client";

type ProfileRow = {
  id?: string;
  user_id?: string;
  full_name?: string | null;
  mobile?: string | null;
  email?: string | null;
  dob?: string | null;
  age?: number | null;
  gender?: string | null;
  address?: string | null;
  city?: string | null;
  pincode?: string | null;
  preferred_collection_address?: string | null;
  is_profile_complete?: boolean;
};

type FamilyMember = {
  id: string;
  name: string;
  relation: string;
  age?: number | null;
  dob?: string | null;
  gender?: string | null;
  mobile?: string | null;
  health_note?: string | null;
  is_default?: boolean;
};

type BookingRow = {
  id: string;
  booking_id?: string;
  created_at?: string;
  payable_amount?: number;
  payment_status?: string;
  booking_status?: string;
  preferred_date?: string;
  preferred_time?: string;
  patient_type?: "self" | "family";
  family_member_id?: string | null;
  booking_items?: Array<{ item_name?: string; item_type?: string }>;
  reports?: Array<{ id?: string; report_url?: string; status?: string; file_name?: string }>;
};

type TrackingEvent = {
  id?: string;
  status: string;
  note?: string | null;
  eta_minutes?: number | null;
  actor_role?: string | null;
  created_at?: string;
};

type ReportRow = {
  id: string;
  report_url?: string;
  file_name?: string;
  status?: string;
  generated_at?: string;
  bookings?: {
    booking_id?: string;
    preferred_date?: string;
    family_member_id?: string | null;
    patient_type?: "self" | "family";
    booking_items?: Array<{ item_name?: string }>;
  };
};

type ProfileForm = {
  fullName: string;
  mobile: string;
  email: string;
  dob: string;
  age: string;
  gender: string;
  address: string;
  city: string;
  pincode: string;
  preferredCollectionAddress: string;
};

type FamilyForm = {
  id?: string;
  name: string;
  relation: string;
  dob: string;
  age: string;
  gender: string;
  mobile: string;
  healthNote: string;
  isDefault: boolean;
};

const emptyProfileForm: ProfileForm = {
  fullName: "",
  mobile: "",
  email: "",
  dob: "",
  age: "",
  gender: "",
  address: "",
  city: "",
  pincode: "",
  preferredCollectionAddress: ""
};

const emptyFamilyForm: FamilyForm = {
  name: "",
  relation: "Father",
  dob: "",
  age: "",
  gender: "",
  mobile: "",
  healthNote: "",
  isDefault: false
};

const relationOptions = [
  "Father",
  "Mother",
  "Spouse",
  "Child",
  "Brother",
  "Sister",
  "Grandfather",
  "Grandmother",
  "Other"
];

const genderOptions = ["Male", "Female", "Other"];

function rupee(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return "₹0";
  return `₹${value.toLocaleString("en-IN")}`;
}

function patientName(profile: ProfileRow | null) {
  return profile?.full_name?.trim() || "ScopeX Patient";
}

function formatStatus(status?: string) {
  if (!status) return "Confirmed";
  return status
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function reportLinkFromBooking(booking: BookingRow) {
  return booking.reports?.find((report) => report.report_url)?.report_url || "";
}

function isBookingModifiable(booking: BookingRow) {
  const status = (booking.booking_status || "").toLowerCase();
  return status === "pending" || status === "confirmed";
}

function isBookingCancelable(booking: BookingRow) {
  const status = (booking.booking_status || "").toLowerCase();
  const paymentStatus = (booking.payment_status || "").toLowerCase();
  if (status === "cancelled" || status === "sample_collected" || status === "in_lab" || status === "completed") {
    return false;
  }
  return paymentStatus !== "paid";
}

function normalizeProfile(profile?: ProfileRow | null): ProfileForm {
  return {
    fullName: profile?.full_name ?? "",
    mobile: profile?.mobile ?? "",
    email: profile?.email ?? "",
    dob: profile?.dob ?? "",
    age: profile?.age ? String(profile?.age) : "",
    gender: profile?.gender ?? "",
    address: profile?.address ?? "",
    city: profile?.city ?? "",
    pincode: profile?.pincode ?? "",
    preferredCollectionAddress: profile?.preferred_collection_address ?? ""
  };
}

export function PatientDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [profileForm, setProfileForm] = useState<ProfileForm>(emptyProfileForm);
  const [familyForm, setFamilyForm] = useState<FamilyForm>(emptyFamilyForm);
  const [familySaving, setFamilySaving] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [showProfileFlow, setShowProfileFlow] = useState(false);
  const [profileStep, setProfileStep] = useState(1);
  const [consent, setConsent] = useState(false);
  const [profileFlowMessage, setProfileFlowMessage] = useState("");
  const [selectedPatientFilter, setSelectedPatientFilter] = useState("all");
  const [expandedTrackingId, setExpandedTrackingId] = useState("");
  const [tracking, setTracking] = useState<Record<string, TrackingEvent[]>>({});
  const [busyBookingId, setBusyBookingId] = useState("");

  const featuredPackage = useMemo(() => {
    return (
      packagesData.find((item) => item.id === "health-360-pro") ||
      packagesData.find((item) => item.featured) ||
      packagesData[0]
    );
  }, []);

  const profileIncomplete = !profile?.is_profile_complete;
  const requiredPersonalComplete = Boolean(
    profileForm.fullName.trim() &&
      /^\d{10}$/.test(profileForm.mobile.replace(/\D/g, "")) &&
      (profileForm.age || profileForm.dob) &&
      profileForm.gender &&
      profileForm.address.trim() &&
      profileForm.pincode.trim()
  );

  useEffect(() => {
    if (!getStoredAuthToken()) {
      setMessage("Please login to view your dashboard.");
      setLoading(false);
      return;
    }
    void loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    try {
      const [profileResponse, familyResponse, bookingResponse, reportResponse] = await Promise.all([
        backendFetch("/user/profile"),
        backendFetch("/family/list"),
        backendFetch("/booking/history"),
        backendFetch("/reports/user")
      ]);

      const profileData = await profileResponse.json().catch(() => ({}));
      const familyData = await familyResponse.json().catch(() => ({}));
      const bookingData = await bookingResponse.json().catch(() => ({}));
      const reportData = await reportResponse.json().catch(() => ({}));

      if (!profileResponse.ok) throw new Error(profileData.message || "Unable to load profile.");

      setProfile(profileData.profile ?? null);
      setProfileForm(normalizeProfile(profileData.profile));
      setFamilyMembers(familyResponse.ok ? familyData.familyMembers ?? [] : []);
      setBookings(bookingResponse.ok ? bookingData.bookings ?? [] : []);
      setReports(reportResponse.ok ? reportData.reports ?? [] : []);
      setMessage("");

      if (!profileData.profile?.is_profile_complete) {
        setShowProfileFlow(true);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load dashboard.");
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile() {
    if (!requiredPersonalComplete) {
      setProfileFlowMessage("Please complete required personal details first.");
      return;
    }
    if (!consent) {
      setProfileFlowMessage("Please tick the consent checkbox before saving.");
      return;
    }
    setSavingProfile(true);
    setProfileFlowMessage("");
    try {
      const response = await backendFetch("/user/profile", {
        method: "PATCH",
        body: JSON.stringify({
          fullName: profileForm.fullName,
          mobile: profileForm.mobile,
          email: profileForm.email,
          dob: profileForm.dob || null,
          age: profileForm.age ? Number(profileForm.age) : null,
          gender: profileForm.gender,
          address: profileForm.address,
          city: profileForm.city,
          pincode: profileForm.pincode,
          preferredCollectionAddress: profileForm.preferredCollectionAddress || profileForm.address
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to save profile.");
      setProfile(data.profile);
      setProfileForm(normalizeProfile(data.profile));
      setShowProfileFlow(false);
      setProfileStep(1);
      setConsent(false);
      setProfileFlowMessage("Profile saved successfully.");
      setMessage("Profile saved. Future bookings will be faster.");
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : "Unable to save profile.";
      setProfileFlowMessage(nextMessage);
      setMessage(nextMessage);
    } finally {
      setSavingProfile(false);
    }
  }

  async function saveFamilyMember() {
    if (!familyForm.name.trim() || !familyForm.relation || (!familyForm.age && !familyForm.dob) || !familyForm.gender) {
      setProfileFlowMessage("Add name, relation, age/DOB, and gender for the family member.");
      setMessage("Add name, relation, age/DOB, and gender for the family member.");
      return;
    }
    setFamilySaving(true);
    setProfileFlowMessage("");
    try {
      const endpoint = familyForm.id ? `/family/${familyForm.id}` : "/family/add";
      const response = await backendFetch(endpoint, {
        method: familyForm.id ? "PATCH" : "POST",
        body: JSON.stringify({
          name: familyForm.name,
          relation: familyForm.relation,
          dob: familyForm.dob || null,
          age: familyForm.age ? Number(familyForm.age) : null,
          gender: familyForm.gender,
          mobile: familyForm.mobile || null,
          healthNote: familyForm.healthNote || null,
          isDefault: familyForm.isDefault
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to save family member.");
      const savedMember = data.familyMember as FamilyMember | undefined;
      if (savedMember) {
        setFamilyMembers((current) => {
          const withoutSaved = current.filter((member) => member.id !== savedMember.id);
          const normalized = savedMember.is_default
            ? withoutSaved.map((member) => ({ ...member, is_default: false }))
            : withoutSaved;
          return [savedMember, ...normalized];
        });
      }
      await loadFamilyMembers();
      setFamilyForm(emptyFamilyForm);
      const nextMessage = familyForm.id ? "Family member updated." : "Family member saved.";
      setProfileFlowMessage(nextMessage);
      setMessage(nextMessage);
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : "Unable to save family member.";
      setProfileFlowMessage(nextMessage);
      setMessage(nextMessage);
    } finally {
      setFamilySaving(false);
    }
  }

  async function loadFamilyMembers() {
    const response = await backendFetch("/family/list");
    const data = await response.json().catch(() => ({}));
    if (response.ok) setFamilyMembers(data.familyMembers ?? []);
  }

  async function deleteFamilyMember(id: string) {
    const response = await backendFetch(`/family/${id}`, { method: "DELETE" });
    if (response.ok) {
      setFamilyMembers((current) => current.filter((member) => member.id !== id));
      setProfileFlowMessage("Family member deleted.");
      setMessage("Family member deleted.");
    }
  }

  async function makeDefault(id: string) {
    const response = await backendFetch(`/family/${id}/default`, { method: "POST" });
    if (response.ok) {
      await loadFamilyMembers();
      setProfileFlowMessage("Default family member updated.");
      setMessage("Default family member updated.");
    }
  }

  async function logoutPatient() {
    await logoutAuthSession();
    clearVerifiedMobile();
    setProfile(null);
    setFamilyMembers([]);
    setBookings([]);
    setReports([]);
    setMessage("Logged out successfully.");
    router.push("/patient/login");
    router.refresh();
  }

  async function toggleTracking(bookingId: string) {
    if (expandedTrackingId === bookingId) {
      setExpandedTrackingId("");
      return;
    }

    setExpandedTrackingId(bookingId);
    if (tracking[bookingId]) return;

    setBusyBookingId(bookingId);
    try {
      const response = await backendFetch(`/booking/track/${bookingId}`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to load order tracking.");
      setTracking((current) => ({ ...current, [bookingId]: data.timeline ?? [] }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load order tracking.");
    } finally {
      setBusyBookingId("");
    }
  }

  async function cancelBooking(booking: BookingRow) {
    const ok = window.confirm(
      "Cancel this booking? This is available only before payment or sample processing starts."
    );
    if (!ok) return;

    setBusyBookingId(booking.id);
    try {
      const response = await backendFetch(`/booking/${booking.id}/cancel`, { method: "PATCH" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to cancel booking.");
      setBookings((current) =>
        current.map((item) => (item.id === booking.id ? { ...item, booking_status: "cancelled" } : item))
      );
      setTracking((current) => ({
        ...current,
        [booking.id]: [
          ...(current[booking.id] ?? []),
          { status: "cancelled", note: "Cancelled by patient", created_at: new Date().toISOString() }
        ]
      }));
      setMessage("Booking cancelled successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to cancel booking.");
    } finally {
      setBusyBookingId("");
    }
  }

  const filteredBookings = bookings.filter((booking) => {
    if (selectedPatientFilter === "all") return true;
    if (selectedPatientFilter === "self") return booking.patient_type !== "family" && !booking.family_member_id;
    return booking.family_member_id === selectedPatientFilter;
  });

  const filteredReports = reports.filter((report) => {
    const booking = report.bookings;
    if (selectedPatientFilter === "all") return true;
    if (selectedPatientFilter === "self") return booking?.patient_type !== "family" && !booking?.family_member_id;
    return booking?.family_member_id === selectedPatientFilter;
  });

  if (loading) {
    return (
      <section className="bg-[#FFFFFF] min-h-[70vh] flex items-center justify-center py-16">
        <div className="section-wrap max-w-md w-full">
          <div className="rounded-2xl border border-[#EAEAEA] bg-white p-8 text-center shadow-xs">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFF4E8] text-[#FF6B00] animate-pulse">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-bold text-[#0D0D0D]">Loading Patient Portal</h3>
            <p className="mt-1 text-xs text-[#626262]">Fetching your verified health records...</p>
          </div>
        </div>
      </section>
    );
  }

  if (!getStoredAuthToken()) {
    return (
      <section className="bg-[#FFFFFF] min-h-[70vh] flex items-center justify-center py-16">
        <div className="section-wrap max-w-md w-full">
          <div className="rounded-3xl border border-[#EAEAEA] bg-white p-8 text-center shadow-md">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFF4E8] text-[#FF6B00]">
              <User className="h-6 w-6" />
            </div>
            <h1 className="mt-4 text-2xl font-black text-[#0D0D0D]">Login Required</h1>
            <p className="mt-2 text-xs sm:text-sm text-[#626262]">
              {message || "Please sign in with your mobile OTP to view bookings and digital reports."}
            </p>
            <Link href="/patient/login" className="cta-btn mt-6 inline-flex w-full justify-center">
              Login to Patient Portal
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="bg-[#FFFFFF] min-h-screen text-[#0D0D0D] pb-24">
      {/* 1. SIGNATURE CARBON BLACK COMMAND CENTER (After Login Theme matching Option C & dark reports section) */}
      <section className="relative overflow-hidden bg-[#0D0D0D] text-white pt-10 pb-12 sm:pt-14 sm:pb-16 border-b border-stone-800">
        {/* Subtle orange ambient glow on the right */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 h-[380px] w-[380px] rounded-full bg-[#FF6B00]/22 blur-[100px] pointer-events-none" />

        <div className="section-wrap relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-2xl">
              {/* Patient Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-stone-700 bg-stone-900/90 px-3.5 py-1 text-xs font-semibold text-[#FF6B00]">
                <ShieldCheck className="h-3.5 w-3.5 text-[#FF6B00]" />
                <span>ScopeX Verified Patient Workspace</span>
              </div>

              {/* Patient Name Heading */}
              <h1 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                Welcome back, {patientName(profile)}
              </h1>

              <p className="mt-2 text-xs sm:text-sm text-stone-300 leading-relaxed max-w-xl">
                Track doorstep phlebotomy visits, download NABL-accredited diagnostic reports, and manage health checkups for your family.
              </p>

              {/* Status pills */}
              <div className="mt-4 flex flex-wrap items-center gap-2.5 text-xs text-stone-300">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-stone-700 bg-stone-900/80 px-2.5 py-1">
                  <Phone className="h-3 w-3 text-[#FF6B00]" />
                  <span>{profile?.mobile || "Registered Mobile"}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-stone-700 bg-stone-900/80 px-2.5 py-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  <span>{profile?.is_profile_complete ? "Profile Complete" : "Profile Pending"}</span>
                </span>
              </div>
            </div>

            {/* Quick Actions in Dark Header */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
              <Link
                href="/book-home-collection"
                className="cta-btn text-center justify-center cursor-pointer shadow-[0_10px_28px_rgba(255,107,0,0.35)]"
              >
                Book Home Collection
              </Link>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowProfileFlow(true)}
                  className="flex-1 rounded-xl border border-stone-700 bg-stone-900/90 px-4 py-2.5 text-xs font-bold text-white hover:border-[#FF6B00] hover:bg-stone-800 transition text-center cursor-pointer"
                >
                  Edit Profile
                </button>
                <button
                  type="button"
                  onClick={logoutPatient}
                  className="rounded-xl border border-stone-800 bg-stone-900/60 p-2.5 text-stone-400 hover:text-red-400 hover:border-red-500/40 transition cursor-pointer"
                  title="Logout"
                  aria-label="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Metrics Cards inside Dark Hero */}
          <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="rounded-2xl border border-stone-800 bg-stone-900/70 p-4 backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Total Bookings</p>
              <p className="mt-1 text-2xl sm:text-3xl font-black text-white">{bookings.length}</p>
              <p className="mt-1 text-[11px] text-stone-400">Home collections</p>
            </div>
            <div className="rounded-2xl border border-stone-800 bg-stone-900/70 p-4 backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Digital Reports</p>
              <p className="mt-1 text-2xl sm:text-3xl font-black text-[#FF6B00]">{reports.length}</p>
              <p className="mt-1 text-[11px] text-stone-400">Pathologist-verified</p>
            </div>
            <div className="rounded-2xl border border-stone-800 bg-stone-900/70 p-4 backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Family Members</p>
              <p className="mt-1 text-2xl sm:text-3xl font-black text-white">{familyMembers.length + 1}</p>
              <p className="mt-1 text-[11px] text-stone-400">Self + Family</p>
            </div>
            <div className="rounded-2xl border border-stone-800 bg-stone-900/70 p-4 backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Profile Health</p>
              <p className="mt-1 text-2xl sm:text-3xl font-black text-emerald-400">
                {profile?.is_profile_complete ? "100%" : "60%"}
              </p>
              <p className="mt-1 text-[11px] text-stone-400">
                {profile?.is_profile_complete ? "Fully verified" : "Action recommended"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Workspace Body */}
      <div className="section-wrap mt-8 sm:mt-10 space-y-8">
        {/* Profile Incomplete Notification Banner */}
        {profileIncomplete ? (
          <div className="rounded-2xl border border-[#FFD9C0] bg-[#FFF4E8] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-[#FF6B00] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs sm:text-sm font-bold text-[#0D0D0D]">
                  Complete your health profile for seamless home collection
                </p>
                <p className="text-xs text-[#626262]">
                  Add your home address and date of birth so your collection partner can arrive on time.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowProfileFlow(true)}
                className="cta-btn py-2 px-4 text-[11px]"
              >
                Complete Profile
              </button>
              <button
                type="button"
                onClick={() => setShowProfileFlow(false)}
                className="rounded-xl border border-[#EAEAEA] bg-white px-3.5 py-2 text-[11px] font-bold text-[#626262] hover:text-[#0D0D0D]"
              >
                Dismiss
              </button>
            </div>
          </div>
        ) : null}

        {message ? (
          <div className="rounded-xl bg-[#F7F7F7] border border-[#EAEAEA] px-4 py-2.5 text-xs font-semibold text-[#0D0D0D]">
            {message}
          </div>
        ) : null}

        {/* 2-Column Dashboard Layout */}
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Left Column: Recommended Package + Bookings & History */}
          <div className="space-y-8">
            {/* Featured Recommended Package Card with Carbon Black contrast accent */}
            <div className="rounded-3xl border border-[#EAEAEA] bg-white p-6 sm:p-7 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="rounded-lg bg-[#FFF4E8] px-2.5 py-1 text-xs font-bold text-[#FF6B00]">
                  Recommended For You
                </span>
                <span className="text-xs font-semibold text-[#626262]">
                  {featuredPackage.overview.length} Included Tests
                </span>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-[#0D0D0D]">
                    {featuredPackage.name}
                  </h3>
                  <p className="mt-1 text-xs text-[#626262]">{featuredPackage.tagline}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-2xl sm:text-3xl font-black text-[#0D0D0D]">
                    {rupee(featuredPackage.price)}
                  </p>
                  <p className="text-[11px] text-[#626262]">ScopeX verified price</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2 text-xs text-[#0D0D0D]">
                {featuredPackage.overview.slice(0, 4).map((test) => (
                  <span
                    key={test}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#EAEAEA] bg-[#F7F7F7] px-2.5 py-1 text-[11px] font-semibold"
                  >
                    <CheckCircle2 className="h-3 w-3 text-[#FF6B00]" />
                    {test}
                  </span>
                ))}
              </div>

              <div className="mt-6 pt-5 border-t border-[#EAEAEA] flex items-center gap-3">
                <Link
                  href={`/book-home-collection?package=${encodeURIComponent(featuredPackage.name)}`}
                  className="cta-btn flex-1 text-center justify-center"
                >
                  Book Package Now
                </Link>
                <Link
                  href={`/packages/${featuredPackage.id}`}
                  className="rounded-xl border border-[#0D0D0D] bg-white px-5 py-2.5 text-xs font-bold text-[#0D0D0D] hover:bg-[#F7F7F7] text-center"
                >
                  View Details
                </Link>
              </div>
            </div>

            {/* Member-Wise Bookings & Real-Time Tracking */}
            <div className="rounded-3xl border border-[#EAEAEA] bg-white p-6 sm:p-7 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#EAEAEA] pb-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#FF6B00]">
                    Order History
                  </span>
                  <h2 className="mt-1 text-xl font-bold text-[#0D0D0D]">
                    Home Collection Bookings
                  </h2>
                </div>

                {/* Filter Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#626262]">Filter:</span>
                  <select
                    value={selectedPatientFilter}
                    onChange={(e) => setSelectedPatientFilter(e.target.value)}
                    className="rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-3 py-1.5 text-xs font-bold text-[#0D0D0D] focus:border-[#FF6B00] focus:outline-none"
                  >
                    <option value="all">All Patients</option>
                    <option value="self">Self</option>
                    {familyMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {filteredBookings.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#EAEAEA] bg-[#F7F7F7] p-8 text-center">
                    <Calendar className="mx-auto h-8 w-8 text-[#8A8A8A]" />
                    <p className="mt-2 text-xs sm:text-sm font-semibold text-[#0D0D0D]">
                      No bookings found
                    </p>
                    <p className="mt-1 text-xs text-[#626262]">
                      You haven&apos;t booked any home collection for this patient yet.
                    </p>
                    <Link
                      href="/book-home-collection"
                      className="cta-btn mt-4 inline-flex text-xs py-2 px-5"
                    >
                      Book First Test
                    </Link>
                  </div>
                ) : null}

                {filteredBookings.map((booking) => (
                  <article
                    key={booking.id}
                    className="rounded-2xl border border-[#EAEAEA] bg-white p-5 shadow-2xs hover:border-[#FF6B00]/60 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#0D0D0D]">
                            {booking.booking_id || `Booking #${booking.id.slice(0, 8)}`}
                          </span>
                          <span className="rounded-md bg-[#F7F7F7] px-2 py-0.5 text-[10px] font-bold text-[#626262]">
                            {booking.patient_type === "family" ? "Family" : "Self"}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-[#626262] flex items-center gap-1.5">
                          <Calendar className="h-3 w-3 text-[#FF6B00]" />
                          <span>{booking.preferred_date || "Date Pending"}</span>
                          <span>•</span>
                          <Clock className="h-3 w-3 text-[#FF6B00]" />
                          <span>{booking.preferred_time || "Slot Pending"}</span>
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#FFF4E8] px-3 py-1 text-[11px] font-bold text-[#FF6B00]">
                          {formatStatus(booking.booking_status)}
                        </span>
                        <span className="rounded-full bg-[#F7F7F7] border border-[#EAEAEA] px-3 py-1 text-[11px] font-semibold text-[#0D0D0D]">
                          {formatStatus(booking.payment_status || "Payment Pending")}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] p-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#0D0D0D]">Selected Diagnostic Items</span>
                        <span className="font-black text-[#FF6B00]">{rupee(booking.payable_amount)}</span>
                      </div>
                      <p className="mt-1.5 text-xs text-[#626262]">
                        {booking.booking_items?.map((item) => item.item_name).filter(Boolean).join(", ") ||
                          "Tests / Packages pending"}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2.5 pt-2 border-t border-[#EAEAEA]">
                      <button
                        type="button"
                        onClick={() => toggleTracking(booking.id)}
                        className="rounded-xl border border-[#EAEAEA] bg-white px-3.5 py-1.5 text-xs font-bold text-[#0D0D0D] hover:border-[#FF6B00] hover:text-[#FF6B00] transition cursor-pointer"
                      >
                        {busyBookingId === booking.id && expandedTrackingId === booking.id
                          ? "Loading..."
                          : expandedTrackingId === booking.id
                          ? "Hide Tracking"
                          : "Track Phlebotomist"}
                      </button>

                      {reportLinkFromBooking(booking) ? (
                        <a
                          href={reportLinkFromBooking(booking)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[#0D0D0D] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#FF6B00] transition"
                        >
                          <Download className="h-3 w-3" />
                          <span>View Report</span>
                        </a>
                      ) : (
                        <span className="text-xs text-[#8A8A8A] font-medium">Report in Progress</span>
                      )}

                      {isBookingCancelable(booking) ? (
                        <button
                          type="button"
                          onClick={() => cancelBooking(booking)}
                          disabled={busyBookingId === booking.id}
                          className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 transition cursor-pointer ml-auto"
                        >
                          {busyBookingId === booking.id ? "Please wait..." : "Cancel"}
                        </button>
                      ) : null}
                    </div>

                    {/* Expandable Order Tracking Timeline */}
                    {expandedTrackingId === booking.id ? (
                      <div className="mt-4 rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] p-4 text-xs">
                        <p className="font-bold uppercase tracking-wider text-[#FF6B00] text-[10px]">
                          Live Phlebotomy &amp; Lab Timeline
                        </p>
                        <div className="mt-3 space-y-3">
                          {(tracking[booking.id]?.length
                            ? tracking[booking.id]
                            : [{ status: booking.booking_status || "confirmed", note: "Order confirmed in system." }]
                          ).map((event, index) => (
                            <div key={`${booking.id}-${event.id || index}`} className="flex items-start gap-3">
                              <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#FF6B00]" />
                              <div>
                                <p className="font-bold text-[#0D0D0D]">{formatStatus(event.status)}</p>
                                {event.note ? <p className="text-[#626262]">{event.note}</p> : null}
                                {event.eta_minutes ? (
                                  <p className="font-semibold text-[#FF6B00]">
                                    Estimated Arrival: {event.eta_minutes} mins
                                  </p>
                                ) : null}
                                {event.created_at ? (
                                  <p className="text-[10px] text-[#8A8A8A]">
                                    {new Date(event.created_at).toLocaleString("en-IN")}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Family Members & Diagnostic Reports List */}
          <div className="space-y-8">
            {/* Reports Showcase Box (Signature Dark Card matching user screenshot) */}
            <div className="rounded-3xl border border-[#EAEAEA] bg-[#0D0D0D] p-6 text-white shadow-md relative overflow-hidden">
              <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[#FF6B00]/25 blur-3xl pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF6B00]">
                    Verified Reports
                  </span>
                  <span className="text-xs text-stone-400">NABL Lab Certified</span>
                </div>

                <h3 className="mt-2 text-xl font-bold text-white">Your Diagnostic Reports</h3>
                <p className="mt-1 text-xs text-stone-300">
                  Access authenticated digital PDF reports verified by certified MD pathologists.
                </p>

                <div className="mt-5 space-y-3">
                  {filteredReports.length === 0 ? (
                    <div className="rounded-2xl border border-stone-800 bg-stone-900/80 p-5 text-center text-xs text-stone-400">
                      Reports will appear here once your collected sample is analyzed by our NABL laboratory partner.
                    </div>
                  ) : null}

                  {filteredReports.map((report) => (
                    <div
                      key={report.id}
                      className="rounded-2xl border border-stone-800 bg-stone-900/90 p-4 flex items-center justify-between gap-3 hover:border-[#FF6B00]/70 transition"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">
                          {report.file_name || report.bookings?.booking_id || "Diagnostic Report"}
                        </p>
                        <p className="text-[10px] text-stone-400">
                          Status: <span className="text-emerald-400 uppercase font-semibold">{report.status || "Ready"}</span>
                        </p>
                      </div>

                      {report.report_url ? (
                        <a
                          href={report.report_url}
                          target="_blank"
                          rel="noreferrer"
                          className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-[#FF6B00] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#E85900] transition"
                        >
                          <Download className="h-3 w-3" />
                          <span>Download</span>
                        </a>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Family Members Management */}
            <div className="rounded-3xl border border-[#EAEAEA] bg-white p-6 sm:p-7 shadow-xs">
              <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#FF6B00]">
                    Family Health
                  </span>
                  <h3 className="mt-1 text-xl font-bold text-[#0D0D0D]">
                    Saved Family Members
                  </h3>
                </div>
                <span className="rounded-lg bg-[#F7F7F7] border border-[#EAEAEA] px-2.5 py-1 text-xs font-bold text-[#0D0D0D]">
                  {familyMembers.length + 1} Saved
                </span>
              </div>

              {/* Members List */}
              <div className="mt-5 space-y-3">
                {/* Self card */}
                <div className="rounded-2xl border border-[#EAEAEA] bg-[#F7F7F7] p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-[#0D0D0D]">{patientName(profile)}</p>
                      <span className="rounded-md bg-[#FFF4E8] px-2 py-0.5 text-[10px] font-bold text-[#FF6B00]">
                        Primary / Self
                      </span>
                    </div>
                    <p className="text-xs text-[#626262] mt-0.5">{profile?.mobile || "Registered Mobile"}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowProfileFlow(true)}
                    className="text-xs font-bold text-[#FF6B00] hover:underline cursor-pointer"
                  >
                    Edit
                  </button>
                </div>

                {familyMembers.map((member) => (
                  <div
                    key={member.id}
                    className="rounded-2xl border border-[#EAEAEA] bg-white p-4 flex items-center justify-between hover:border-[#FF6B00]/60 transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-[#0D0D0D]">{member.name}</p>
                        {member.is_default ? (
                          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                            Default
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-[#626262] mt-0.5">
                        {member.relation} • {member.age ? `${member.age} yrs` : member.dob || "Age pending"} •{" "}
                        {member.gender || "Gender pending"}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <button
                        type="button"
                        onClick={() =>
                          setFamilyForm({
                            id: member.id,
                            name: member.name,
                            relation: member.relation,
                            dob: member.dob || "",
                            age: member.age ? String(member.age) : "",
                            gender: member.gender || "",
                            mobile: member.mobile || "",
                            healthNote: member.health_note || "",
                            isDefault: Boolean(member.is_default)
                          })
                        }
                        className="text-[#0D0D0D] hover:text-[#FF6B00] font-bold cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteFamilyMember(member.id)}
                        className="text-red-600 hover:text-red-700 font-bold cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add / Edit Family Member Form */}
              <div className="mt-6 pt-5 border-t border-[#EAEAEA]">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#0D0D0D]">
                    {familyForm.id ? "Edit Family Member" : "Add New Family Member"}
                  </p>
                  {familyForm.id ? (
                    <button
                      type="button"
                      onClick={() => setFamilyForm(emptyFamilyForm)}
                      className="text-xs text-[#626262] hover:text-[#0D0D0D] cursor-pointer"
                    >
                      Cancel
                    </button>
                  ) : null}
                </div>

                <div className="mt-3.5 space-y-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    <input
                      value={familyForm.name}
                      onChange={(e) => setFamilyForm((c) => ({ ...c, name: e.target.value }))}
                      placeholder="Full Name *"
                      className="rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-3 py-2 text-xs font-semibold text-[#0D0D0D] focus:border-[#FF6B00] focus:bg-white focus:outline-none"
                    />
                    <select
                      value={familyForm.relation}
                      onChange={(e) => setFamilyForm((c) => ({ ...c, relation: e.target.value }))}
                      className="rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-3 py-2 text-xs font-semibold text-[#0D0D0D] focus:border-[#FF6B00] focus:bg-white focus:outline-none"
                    >
                      {relationOptions.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <input
                      value={familyForm.age}
                      onChange={(e) =>
                        setFamilyForm((c) => ({ ...c, age: e.target.value.replace(/\D/g, "").slice(0, 3) }))
                      }
                      placeholder="Age *"
                      inputMode="numeric"
                      className="rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-3 py-2 text-xs font-semibold text-[#0D0D0D] focus:border-[#FF6B00] focus:bg-white focus:outline-none"
                    />
                    <select
                      value={familyForm.gender}
                      onChange={(e) => setFamilyForm((c) => ({ ...c, gender: e.target.value }))}
                      className="rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-3 py-2 text-xs font-semibold text-[#0D0D0D] focus:border-[#FF6B00] focus:bg-white focus:outline-none"
                    >
                      <option value="">Gender *</option>
                      {genderOptions.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>

                  <input
                    value={familyForm.mobile}
                    onChange={(e) =>
                      setFamilyForm((c) => ({ ...c, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) }))
                    }
                    placeholder="Mobile number (optional)"
                    inputMode="numeric"
                    className="w-full rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-3 py-2 text-xs font-semibold text-[#0D0D0D] focus:border-[#FF6B00] focus:bg-white focus:outline-none"
                  />

                  <label className="flex items-center gap-2 text-xs text-[#626262] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={familyForm.isDefault}
                      onChange={(e) => setFamilyForm((c) => ({ ...c, isDefault: e.target.checked }))}
                      className="h-3.5 w-3.5 rounded accent-[#FF6B00]"
                    />
                    <span>Mark as default patient for quick bookings</span>
                  </label>

                  <button
                    type="button"
                    onClick={saveFamilyMember}
                    disabled={familySaving}
                    className="w-full rounded-xl bg-[#0D0D0D] py-2.5 text-xs font-bold text-white hover:bg-[#FF6B00] transition disabled:opacity-50 cursor-pointer"
                  >
                    {familySaving ? "Saving..." : familyForm.id ? "Update Family Member" : "Save Family Member"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. PROFILE MODAL WIZARD */}
      {showProfileFlow ? (
        <div className="fixed inset-0 z-[80] overflow-y-auto bg-black/60 px-4 py-6 backdrop-blur-sm flex items-center justify-center">
          <div className="w-full max-w-2xl rounded-3xl border border-[#EAEAEA] bg-white p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF6B00]">
                  Step {profileStep} of 3
                </span>
                <h3 className="text-xl font-bold text-[#0D0D0D]">Complete Your Health Profile</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowProfileFlow(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[#EAEAEA] text-[#0D0D0D] hover:bg-[#F7F7F7]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              {["Personal Details", "Family Members", "Consent & Save"].map((label, index) => (
                <div
                  key={label}
                  className={`rounded-xl py-2 text-center text-xs font-bold ${
                    profileStep === index + 1
                      ? "bg-[#0D0D0D] text-white"
                      : profileStep > index + 1
                      ? "bg-[#FFF4E8] text-[#FF6B00]"
                      : "bg-[#F7F7F7] text-[#8A8A8A]"
                  }`}
                >
                  {label}
                </div>
              ))}
            </div>

            {profileStep === 1 ? (
              <div className="mt-6 space-y-3.5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm((c) => ({ ...c, fullName: e.target.value }))}
                    placeholder="Full Name *"
                    className="rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-3.5 py-2 text-xs font-semibold text-[#0D0D0D] focus:border-[#FF6B00] focus:bg-white focus:outline-none"
                  />
                  <input
                    value={profileForm.mobile}
                    onChange={(e) =>
                      setProfileForm((c) => ({ ...c, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) }))
                    }
                    placeholder="Mobile Number *"
                    inputMode="numeric"
                    className="rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-3.5 py-2 text-xs font-semibold text-[#0D0D0D] focus:border-[#FF6B00] focus:bg-white focus:outline-none"
                  />
                  <input
                    value={profileForm.email}
                    onChange={(e) => setProfileForm((c) => ({ ...c, email: e.target.value }))}
                    placeholder="Email Address"
                    type="email"
                    className="rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-3.5 py-2 text-xs font-semibold text-[#0D0D0D] focus:border-[#FF6B00] focus:bg-white focus:outline-none"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={profileForm.age}
                      onChange={(e) =>
                        setProfileForm((c) => ({ ...c, age: e.target.value.replace(/\D/g, "").slice(0, 3) }))
                      }
                      placeholder="Age *"
                      inputMode="numeric"
                      className="rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-3.5 py-2 text-xs font-semibold text-[#0D0D0D] focus:border-[#FF6B00] focus:bg-white focus:outline-none"
                    />
                    <select
                      value={profileForm.gender}
                      onChange={(e) => setProfileForm((c) => ({ ...c, gender: e.target.value }))}
                      className="rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-3.5 py-2 text-xs font-semibold text-[#0D0D0D] focus:border-[#FF6B00] focus:bg-white focus:outline-none"
                    >
                      <option value="">Gender *</option>
                      {genderOptions.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    value={profileForm.city}
                    onChange={(e) => setProfileForm((c) => ({ ...c, city: e.target.value }))}
                    placeholder="City"
                    className="rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-3.5 py-2 text-xs font-semibold text-[#0D0D0D] focus:border-[#FF6B00] focus:bg-white focus:outline-none"
                  />
                  <input
                    value={profileForm.pincode}
                    onChange={(e) =>
                      setProfileForm((c) => ({ ...c, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) }))
                    }
                    placeholder="Pincode *"
                    inputMode="numeric"
                    className="rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-3.5 py-2 text-xs font-semibold text-[#0D0D0D] focus:border-[#FF6B00] focus:bg-white focus:outline-none"
                  />
                </div>
                <textarea
                  value={profileForm.address}
                  onChange={(e) => setProfileForm((c) => ({ ...c, address: e.target.value }))}
                  placeholder="Complete Address for Doorstep Sample Collection *"
                  rows={2}
                  className="w-full rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-3.5 py-2 text-xs font-semibold text-[#0D0D0D] focus:border-[#FF6B00] focus:bg-white focus:outline-none"
                />
              </div>
            ) : null}

            {profileStep === 2 ? (
              <div className="mt-6 space-y-4">
                <p className="text-xs text-[#626262]">
                  You have saved {familyMembers.length} family member(s). You can add more now or anytime later from your dashboard.
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {familyMembers.map((m) => (
                    <div
                      key={m.id}
                      className="rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] p-3 text-xs flex items-center justify-between"
                    >
                      <span className="font-bold text-[#0D0D0D]">{m.name} ({m.relation})</span>
                      <span className="text-[#626262]">{m.age ? `${m.age} yrs` : ""}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {profileStep === 3 ? (
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-[#EAEAEA] bg-[#F7F7F7] p-5 text-xs text-[#626262] leading-relaxed">
                  <p className="font-bold text-[#0D0D0D]">Data Privacy &amp; Encryption</p>
                  <p className="mt-1">
                    Your diagnostic data, addresses, and family records are stored securely with HIPAA and ISO-grade encryption. Information is used exclusively to facilitate blood sample collection and authenticated report delivery.
                  </p>
                </div>
                <label className="flex items-start gap-2.5 text-xs text-[#0D0D0D] font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded accent-[#FF6B00]"
                  />
                  <span>
                    I confirm the above details are accurate and authorize ScopeX Diagnostics to store them for home collection scheduling.
                  </span>
                </label>
              </div>
            ) : null}

            {profileFlowMessage ? (
              <p className="mt-4 text-xs font-semibold text-[#FF6B00]">{profileFlowMessage}</p>
            ) : null}

            <div className="mt-6 pt-4 border-t border-[#EAEAEA] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setProfileStep((s) => Math.max(1, s - 1))}
                disabled={profileStep === 1}
                className="rounded-xl border border-[#EAEAEA] px-4 py-2 text-xs font-bold text-[#626262] disabled:opacity-30"
              >
                Back
              </button>

              {profileStep < 3 ? (
                <button
                  type="button"
                  onClick={() => setProfileStep((s) => Math.min(3, s + 1))}
                  className="cta-btn py-2 px-5 text-xs"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  onClick={saveProfile}
                  disabled={savingProfile || !consent}
                  className="cta-btn py-2 px-6 text-xs disabled:opacity-50"
                >
                  {savingProfile ? "Saving Profile..." : "Save & Complete"}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
