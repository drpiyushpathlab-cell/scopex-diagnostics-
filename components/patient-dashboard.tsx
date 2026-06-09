"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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

const relationOptions = ["Father", "Mother", "Wife", "Husband", "Son", "Daughter", "Self", "Other"];
const genderOptions = ["male", "female", "other"];

function rupee(value?: number) {
  return `Rs ${Number(value || 0).toLocaleString("en-IN")}`;
}

function normalizeProfile(profile?: ProfileRow | null): ProfileForm {
  return {
    fullName: profile?.full_name || "",
    mobile: profile?.mobile || "",
    email: profile?.email || "",
    dob: profile?.dob || "",
    age: profile?.age ? String(profile.age) : "",
    gender: profile?.gender || "",
    address: profile?.address || "",
    city: profile?.city || "",
    pincode: profile?.pincode || "",
    preferredCollectionAddress: profile?.preferred_collection_address || profile?.address || ""
  };
}

function patientName(profile?: ProfileRow | null) {
  return profile?.full_name || profile?.mobile || "Patient";
}

function formatStatus(value?: string) {
  return String(value || "pending")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isBookingCancelable(booking: BookingRow) {
  const status = String(booking.booking_status || "");
  const paymentStatus = String(booking.payment_status || "");
  return !["collected", "processing", "completed", "cancelled"].includes(status) && !["paid", "captured", "advance_paid"].includes(paymentStatus);
}

function isBookingModifiable(booking: BookingRow) {
  const status = String(booking.booking_status || "");
  const paymentStatus = String(booking.payment_status || "");
  return ["draft", "confirmed", "pending"].includes(status || "pending") && !["paid", "captured", "advance_paid"].includes(paymentStatus);
}

function reportLinkFromBooking(booking: BookingRow) {
  return booking.reports?.find((report) => report.report_url)?.report_url || "";
}

export function PatientDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [profileForm, setProfileForm] = useState<ProfileForm>(emptyProfileForm);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [familyForm, setFamilyForm] = useState<FamilyForm>(emptyFamilyForm);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [showProfileFlow, setShowProfileFlow] = useState(false);
  const [profileStep, setProfileStep] = useState(1);
  const [consent, setConsent] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [familySaving, setFamilySaving] = useState(false);
  const [selectedPatientFilter, setSelectedPatientFilter] = useState("self");
  const [tracking, setTracking] = useState<Record<string, TrackingEvent[]>>({});
  const [expandedTrackingId, setExpandedTrackingId] = useState("");
  const [busyBookingId, setBusyBookingId] = useState("");

  const featuredPackage = useMemo(() => {
    const latestPackageName = bookings.flatMap((booking) => booking.booking_items ?? []).find((item) => item.item_type === "package")?.item_name;
    return packagesData.find((item) => item.name === latestPackageName) || packagesData.find((item) => item.featured) || packagesData[0];
  }, [bookings]);

  const profileIncomplete = !profile?.is_profile_complete;
  const requiredPersonalComplete = Boolean(
    profileForm.fullName.trim() &&
      /^\d{10}$/.test(profileForm.mobile.replace(/\D/g, "")) &&
      (profileForm.age || profileForm.dob) &&
      profileForm.gender &&
      profileForm.address.trim() &&
      profileForm.pincode.trim()
  );
  const canSaveProfile = requiredPersonalComplete && consent;

  useEffect(() => {
    if (!getStoredAuthToken()) {
      setMessage("Please login with OTP to view your dashboard.");
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
    if (!canSaveProfile) return;
    setSavingProfile(true);
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
      setMessage("Profile saved. Future bookings will be faster.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function saveFamilyMember() {
    if (!familyForm.name.trim() || !familyForm.relation || (!familyForm.age && !familyForm.dob) || !familyForm.gender) {
      setMessage("Add name, relation, age/DOB, and gender for the family member.");
      return;
    }
    setFamilySaving(true);
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
      await loadFamilyMembers();
      setFamilyForm(emptyFamilyForm);
      setMessage(familyForm.id ? "Family member updated." : "Family member saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save family member.");
    } finally {
      setFamilySaving(false);
    }
  }

  async function loadFamilyMembers() {
    const response = await backendFetch("/family/list");
    const data = await response.json();
    if (response.ok) setFamilyMembers(data.familyMembers ?? []);
  }

  async function deleteFamilyMember(id: string) {
    const response = await backendFetch(`/family/${id}`, { method: "DELETE" });
    if (response.ok) {
      setFamilyMembers((current) => current.filter((member) => member.id !== id));
    }
  }

  async function makeDefault(id: string) {
    const response = await backendFetch(`/family/${id}/default`, { method: "POST" });
    if (response.ok) await loadFamilyMembers();
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
    const ok = window.confirm("Cancel this booking? This is available only before payment or sample processing starts.");
    if (!ok) return;

    setBusyBookingId(booking.id);
    try {
      const response = await backendFetch(`/booking/${booking.id}/cancel`, { method: "PATCH" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to cancel booking.");
      setBookings((current) => current.map((item) => (item.id === booking.id ? { ...item, booking_status: "cancelled" } : item)));
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
      <section className="section-wrap py-14">
        <div className="rounded-[28px] border border-[#deece9] bg-white p-6 text-[#5a7273] shadow-[0_16px_36px_rgba(16,24,40,0.06)]">
          Loading your patient dashboard...
        </div>
      </section>
    );
  }

  if (!getStoredAuthToken()) {
    return (
      <section className="section-wrap py-14">
        <div className="rounded-[28px] border border-[#deece9] bg-white p-6 shadow-[0_16px_36px_rgba(16,24,40,0.06)]">
          <h1 className="text-3xl font-bold text-[#102a2d]">Login required</h1>
          <p className="mt-3 text-[#5a7273]">{message}</p>
          <Link href="/patient/login" className="cta-btn mt-5 inline-flex">Login with OTP</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="section-wrap pb-28 pt-8 md:py-12">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[30px] border border-[#deece9] bg-white p-5 shadow-[0_16px_36px_rgba(16,24,40,0.06)] md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0f8f7c]">Patient Dashboard</p>
          <h1 className="mt-2 text-3xl font-bold text-[#102a2d] md:text-5xl">Welcome, {patientName(profile)}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#5a7273] md:text-base">
            Manage patient details, saved family members, home collection bookings, and reports from one clean workspace.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setShowProfileFlow(true)}
              className="secondary-btn w-full justify-center sm:w-auto"
            >
              Complete Details
            </button>
            <button
              type="button"
              onClick={logoutPatient}
              className="rounded-full border border-[#ffd6bf] px-6 py-3 text-sm font-black uppercase tracking-[0.14em] text-[#f37021] transition hover:bg-[#fff3ea]"
            >
              Logout
            </button>
          </div>

          {profileIncomplete ? (
            <div className="mt-5 rounded-[22px] border border-[#ffd6bf] bg-[#fff7f1] p-4 text-sm text-[#8a3b13]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-semibold">Complete your health profile for faster bookings.</p>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowProfileFlow(true)} className="rounded-full bg-[#ff6a00] px-5 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white">Complete Details</button>
                  <button type="button" onClick={() => setShowProfileFlow(false)} className="rounded-full border border-[#ffd6bf] px-5 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#8a3b13]">Skip for now</button>
                </div>
              </div>
            </div>
          ) : null}

          {message ? <p className="mt-4 text-sm font-medium text-[#0f8f7c]">{message}</p> : null}

          <div className="mt-6 rounded-[26px] border border-[#deece9] bg-[#f7fbfa] p-5">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0f8f7c]">Selected package</p>
                <h2 className="mt-2 text-2xl font-bold text-[#102a2d]">{featuredPackage.name}</h2>
                <p className="mt-1 text-sm text-[#5a7273]">{featuredPackage.tagline}</p>
                <p className="mt-3 text-sm text-[#5a7273]">{featuredPackage.overview.length} included tests</p>
              </div>
              <div className="rounded-[22px] bg-white p-4 text-left shadow-sm md:text-right">
                <p className="text-3xl font-black text-[#ff6a00]">{rupee(featuredPackage.price)}</p>
                <p className="text-xs text-[#7c8f90] line-through">MRP {rupee(featuredPackage.mrp)}</p>
                <p className="text-xs font-bold text-[#0f8f7c]">{featuredPackage.discount}% OFF</p>
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link href={`/packages/${featuredPackage.id}`} className="secondary-btn w-full justify-center sm:w-auto">View details</Link>
              <Link href={`/book-home-collection?package=${encodeURIComponent(featuredPackage.name)}`} className="cta-btn w-full justify-center sm:w-auto">Book now</Link>
            </div>
          </div>
        </div>

        <div className="rounded-[30px] border border-[#deece9] bg-white p-5 shadow-[0_16px_36px_rgba(16,24,40,0.06)] md:p-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0f8f7c]">Saved patients</p>
              <h2 className="mt-2 text-2xl font-bold text-[#102a2d]">Family members</h2>
            </div>
            <span className="rounded-full bg-[#effaf7] px-3 py-1 text-xs font-bold text-[#0f8f7c]">{familyMembers.length}/10</span>
          </div>

          <div className="mt-5 grid gap-3">
            <article className="rounded-2xl border border-[#deece9] bg-[#f7fbfa] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-[#102a2d]">Self</p>
                  <p className="text-sm text-[#5a7273]">{profile?.mobile || "Mobile saved after login"}</p>
                </div>
                {profile?.is_profile_complete ? <span className="rounded-full bg-[#e8f7f3] px-3 py-1 text-xs font-bold text-[#0f8f7c]">Ready</span> : null}
              </div>
            </article>
            {familyMembers.map((member) => (
              <article key={member.id} className="rounded-2xl border border-[#deece9] bg-[#f7fbfa] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-bold text-[#102a2d]">{member.name} {member.is_default ? <span className="text-xs text-[#0f8f7c]">Default</span> : null}</p>
                    <p className="text-sm text-[#5a7273]">
                      {member.relation} - {member.age ? `${member.age} yrs` : member.dob || "Age pending"} - {member.gender || "Gender pending"}
                    </p>
                    {member.health_note ? <p className="mt-1 text-xs text-[#7c8f90]">{member.health_note}</p> : null}
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.12em]">
                    <button type="button" onClick={() => setFamilyForm({ id: member.id, name: member.name, relation: member.relation, dob: member.dob || "", age: member.age ? String(member.age) : "", gender: member.gender || "", mobile: member.mobile || "", healthNote: member.health_note || "", isDefault: Boolean(member.is_default) })} className="text-[#0f8f7c]">Edit</button>
                    <button type="button" onClick={() => makeDefault(member.id)} className="text-[#0f8f7c]">Default</button>
                    <button type="button" onClick={() => deleteFamilyMember(member.id)} className="text-red-500">Delete</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-[30px] border border-[#deece9] bg-white p-5 shadow-[0_16px_36px_rgba(16,24,40,0.06)] md:p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0f8f7c]">Add Family Member</p>
            <h2 className="mt-2 text-2xl font-bold text-[#102a2d]">Reuse saved details in future bookings</h2>
          </div>
          {familyForm.id ? <button type="button" onClick={() => setFamilyForm(emptyFamilyForm)} className="secondary-btn w-fit">Cancel edit</button> : null}
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <input value={familyForm.name} onChange={(event) => setFamilyForm((current) => ({ ...current, name: event.target.value }))} placeholder="Name" className="form-field" />
          <select value={familyForm.relation} onChange={(event) => setFamilyForm((current) => ({ ...current, relation: event.target.value }))} className="form-field">
            {relationOptions.map((relation) => <option key={relation}>{relation}</option>)}
          </select>
          <input value={familyForm.age} onChange={(event) => setFamilyForm((current) => ({ ...current, age: event.target.value.replace(/\D/g, "").slice(0, 3) }))} placeholder="Age" inputMode="numeric" className="form-field" />
          <select value={familyForm.gender} onChange={(event) => setFamilyForm((current) => ({ ...current, gender: event.target.value }))} className="form-field">
            <option value="">Gender</option>
            {genderOptions.map((gender) => <option key={gender} value={gender}>{gender}</option>)}
          </select>
          <input value={familyForm.dob} onChange={(event) => setFamilyForm((current) => ({ ...current, dob: event.target.value }))} type="date" className="form-field" />
          <input value={familyForm.mobile} onChange={(event) => setFamilyForm((current) => ({ ...current, mobile: event.target.value.replace(/\D/g, "").slice(0, 10) }))} placeholder="Mobile optional" inputMode="numeric" className="form-field" />
          <input value={familyForm.healthNote} onChange={(event) => setFamilyForm((current) => ({ ...current, healthNote: event.target.value }))} placeholder="Health note optional" className="form-field md:col-span-2" />
        </div>
        <label className="mt-4 flex items-center gap-3 text-sm text-[#5a7273]">
          <input type="checkbox" checked={familyForm.isDefault} onChange={(event) => setFamilyForm((current) => ({ ...current, isDefault: event.target.checked }))} />
          Mark as default patient
        </label>
        <button type="button" onClick={saveFamilyMember} disabled={familySaving} className="cta-btn mt-5 w-full sm:w-auto">
          {familySaving ? "Saving..." : familyForm.id ? "Update Family Member" : "Add Family Member"}
        </button>
      </div>

      <div className="mt-6 rounded-[30px] border border-[#deece9] bg-white p-5 shadow-[0_16px_36px_rgba(16,24,40,0.06)] md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0f8f7c]">History & Reports</p>
            <h2 className="mt-2 text-2xl font-bold text-[#102a2d]">Member-wise records</h2>
          </div>
          <select value={selectedPatientFilter} onChange={(event) => setSelectedPatientFilter(event.target.value)} className="form-field max-w-xs">
            <option value="self">Self</option>
            <option value="all">All patients</option>
            {familyMembers.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
          </select>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <div className="rounded-[24px] border border-[#deece9] bg-[#f7fbfa] p-5">
            <h3 className="text-xl font-bold text-[#102a2d]">Previous bookings</h3>
            <div className="mt-4 grid gap-3">
              {filteredBookings.length === 0 ? <p className="text-sm text-[#5a7273]">No bookings found for this patient yet.</p> : null}
              {filteredBookings.map((booking) => (
                <article key={booking.id} className="rounded-[22px] border border-[#deece9] bg-white p-4 shadow-[0_10px_22px_rgba(16,42,45,0.04)]">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-bold text-[#102a2d]">{booking.booking_id || `Booking #${booking.id.slice(0, 8)}`}</p>
                      <p className="mt-1 text-sm text-[#5a7273]">{booking.preferred_date || "Date pending"} - {booking.preferred_time || "Slot pending"}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#effaf7] px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#0f8f7c]">{formatStatus(booking.booking_status)}</span>
                      <span className="rounded-full bg-[#fff3ea] px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#f37021]">{formatStatus(booking.payment_status || "payment pending")}</span>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl bg-[#f7fbfa] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#0f8f7c]">Selected items</p>
                      <p className="font-black text-[#f37021]">{rupee(booking.payable_amount)}</p>
                    </div>
                    <p className="mt-2 text-sm text-[#5a7273]">
                      {booking.booking_items?.map((item) => item.item_name).filter(Boolean).join(", ") || "Items pending"}
                    </p>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => toggleTracking(booking.id)}
                      className="rounded-full border border-[#cfe5e1] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#0f8f7c] transition hover:border-[#0f8f7c] hover:bg-[#effaf7]"
                    >
                      {busyBookingId === booking.id && expandedTrackingId === booking.id ? "Loading..." : expandedTrackingId === booking.id ? "Hide Tracking" : "Track Order"}
                    </button>
                    {reportLinkFromBooking(booking) ? (
                      <a
                        href={reportLinkFromBooking(booking)}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-[#cfe5e1] px-4 py-2 text-center text-xs font-black uppercase tracking-[0.14em] text-[#0f8f7c] transition hover:border-[#0f8f7c] hover:bg-[#effaf7]"
                      >
                        View Report
                      </a>
                    ) : (
                      <span className="rounded-full border border-[#deece9] px-4 py-2 text-center text-xs font-black uppercase tracking-[0.14em] text-[#7c8f90]">
                        Report Pending
                      </span>
                    )}
                    {isBookingModifiable(booking) ? (
                      <Link
                        href={`/book-home-collection?modifyBookingId=${booking.id}`}
                        className="rounded-full border border-[#cfe5e1] px-4 py-2 text-center text-xs font-black uppercase tracking-[0.14em] text-[#0f8f7c] transition hover:border-[#0f8f7c] hover:bg-[#effaf7]"
                      >
                        Modify
                      </Link>
                    ) : (
                      <span className="rounded-full border border-[#deece9] px-4 py-2 text-center text-xs font-black uppercase tracking-[0.14em] text-[#7c8f90]">
                        Locked
                      </span>
                    )}
                    {isBookingCancelable(booking) ? (
                      <button
                        type="button"
                        onClick={() => cancelBooking(booking)}
                        disabled={busyBookingId === booking.id}
                        className="rounded-full border border-[#ffd6bf] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#f37021] transition hover:bg-[#fff3ea] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {busyBookingId === booking.id ? "Please wait..." : "Cancel"}
                      </button>
                    ) : (
                      <span className="rounded-full border border-[#deece9] px-4 py-2 text-center text-xs font-black uppercase tracking-[0.14em] text-[#7c8f90]">
                        Cancel Closed
                      </span>
                    )}
                  </div>

                  {expandedTrackingId === booking.id ? (
                    <div className="mt-4 rounded-[18px] border border-[#deece9] bg-[#fbfefe] p-4">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0f8f7c]">Order Timeline</p>
                      <div className="mt-3 space-y-3">
                        {(tracking[booking.id]?.length ? tracking[booking.id] : [{ status: booking.booking_status || "confirmed", note: "Current order status" }]).map((event, index) => (
                          <div key={`${booking.id}-${event.id || index}`} className="flex gap-3">
                            <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${index === (tracking[booking.id]?.length || 1) - 1 ? "bg-[#f37021]" : "bg-[#0f8f7c]"}`} />
                            <div>
                              <p className="text-sm font-bold text-[#102a2d]">{formatStatus(event.status)}</p>
                              {event.note ? <p className="text-xs text-[#5a7273]">{event.note}</p> : null}
                              {event.eta_minutes ? <p className="text-xs font-semibold text-[#0f8f7c]">ETA: {event.eta_minutes} minutes</p> : null}
                              {event.created_at ? <p className="text-[11px] text-[#7c8f90]">{new Date(event.created_at).toLocaleString("en-IN")}</p> : null}
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
          <div className="rounded-[24px] border border-[#deece9] bg-[#f7fbfa] p-5">
            <h3 className="text-xl font-bold text-[#102a2d]">Reports</h3>
            <div className="mt-4 grid gap-3">
              {filteredReports.length === 0 ? <p className="text-sm text-[#5a7273]">Reports will appear here after lab processing.</p> : null}
              {filteredReports.map((report) => (
                <article key={report.id} className="rounded-2xl border border-[#deece9] bg-white p-4">
                  <p className="font-bold text-[#102a2d]">{report.file_name || report.bookings?.booking_id || "Diagnostic Report"}</p>
                  <p className="mt-1 text-sm text-[#5a7273]">{report.status || "pending"}</p>
                  {report.report_url ? <a href={report.report_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-sm font-bold text-[#0f8f7c]">View / Download</a> : null}
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showProfileFlow ? (
        <div className="fixed inset-0 z-[80] overflow-y-auto bg-[#102a2d]/45 px-4 py-6 backdrop-blur-sm">
          <div className="mx-auto max-w-4xl rounded-[30px] bg-white p-5 shadow-2xl md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0f8f7c]">Step {profileStep} of 3</p>
                <h2 className="mt-2 text-3xl font-bold text-[#102a2d]">Complete Your Health Profile</h2>
                <p className="mt-2 text-sm leading-7 text-[#5a7273]">Save your personal and family details once for faster bookings in future.</p>
              </div>
              <button type="button" onClick={() => setShowProfileFlow(false)} className="rounded-full border border-[#deece9] px-5 py-2 text-sm font-bold text-[#102a2d]">Skip for now</button>
            </div>

            <div className="mt-6 grid gap-2 sm:grid-cols-3">
              {["Personal Details", "Family Members", "Save & Continue"].map((label, index) => (
                <button key={label} type="button" onClick={() => setProfileStep(index + 1)} className={`rounded-full px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] ${profileStep === index + 1 ? "bg-[#0f8f7c] text-white" : "bg-[#effaf7] text-[#0f8f7c]"}`}>
                  {label}
                </button>
              ))}
            </div>

            {profileStep === 1 ? (
              <div className="mt-6 grid gap-3 md:grid-cols-2">
                <input value={profileForm.fullName} onChange={(event) => setProfileForm((current) => ({ ...current, fullName: event.target.value }))} placeholder="Full name *" className="form-field" />
                <input value={profileForm.mobile} onChange={(event) => setProfileForm((current) => ({ ...current, mobile: event.target.value.replace(/\D/g, "").slice(0, 10) }))} placeholder="Mobile number *" inputMode="numeric" className="form-field" />
                <input value={profileForm.email} onChange={(event) => setProfileForm((current) => ({ ...current, email: event.target.value }))} placeholder="Email" className="form-field" />
                <div className="grid grid-cols-2 gap-3">
                  <input value={profileForm.age} onChange={(event) => setProfileForm((current) => ({ ...current, age: event.target.value.replace(/\D/g, "").slice(0, 3) }))} placeholder="Age *" inputMode="numeric" className="form-field" />
                  <input value={profileForm.dob} onChange={(event) => setProfileForm((current) => ({ ...current, dob: event.target.value }))} type="date" className="form-field" />
                </div>
                <select value={profileForm.gender} onChange={(event) => setProfileForm((current) => ({ ...current, gender: event.target.value }))} className="form-field">
                  <option value="">Gender *</option>
                  {genderOptions.map((gender) => <option key={gender} value={gender}>{gender}</option>)}
                </select>
                <input value={profileForm.city} onChange={(event) => setProfileForm((current) => ({ ...current, city: event.target.value }))} placeholder="City" className="form-field" />
                <input value={profileForm.pincode} onChange={(event) => setProfileForm((current) => ({ ...current, pincode: event.target.value.replace(/\D/g, "").slice(0, 10) }))} placeholder="Pincode *" inputMode="numeric" className="form-field" />
                <textarea value={profileForm.address} onChange={(event) => setProfileForm((current) => ({ ...current, address: event.target.value }))} placeholder="Address for home collection *" className="form-field min-h-24 md:col-span-2" />
                <textarea value={profileForm.preferredCollectionAddress} onChange={(event) => setProfileForm((current) => ({ ...current, preferredCollectionAddress: event.target.value }))} placeholder="Preferred home collection address" className="form-field min-h-20 md:col-span-2" />
              </div>
            ) : null}

            {profileStep === 2 ? (
              <div className="mt-6">
                <p className="text-sm leading-7 text-[#5a7273]">Add family members now or skip this step. You can always add them before future bookings.</p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {familyMembers.length === 0 ? <p className="rounded-2xl border border-[#deece9] bg-[#f7fbfa] p-4 text-sm text-[#5a7273]">No family members saved yet.</p> : null}
                  {familyMembers.map((member) => (
                    <article key={member.id} className="rounded-2xl border border-[#deece9] bg-[#f7fbfa] p-4">
                      <p className="font-bold text-[#102a2d]">{member.name}</p>
                      <p className="text-sm text-[#5a7273]">{member.relation} - {member.age || member.dob || "Age pending"}</p>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}

            {profileStep === 3 ? (
              <div className="mt-6 rounded-[24px] border border-[#deece9] bg-[#f7fbfa] p-5">
                <h3 className="text-xl font-bold text-[#102a2d]">Ready to save</h3>
                <p className="mt-2 text-sm leading-7 text-[#5a7273]">Your details will be reused for future bookings, patient selection, reports, and family member history.</p>
                {!requiredPersonalComplete ? <p className="mt-3 text-sm font-semibold text-red-600">Please complete required personal details first.</p> : null}
                <label className="mt-4 flex items-start gap-3 text-sm leading-6 text-[#5a7273]">
                  <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-1" />
                  I consent to securely save my personal and family health details for future bookings.
                </label>
              </div>
            ) : null}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
              <button type="button" onClick={() => setProfileStep((step) => Math.max(1, step - 1))} className="secondary-btn" disabled={profileStep === 1}>Back</button>
              {profileStep < 3 ? (
                <button type="button" onClick={() => setProfileStep((step) => Math.min(3, step + 1))} className="cta-btn">Continue</button>
              ) : (
                <button type="button" onClick={saveProfile} disabled={!canSaveProfile || savingProfile} className="cta-btn disabled:cursor-not-allowed disabled:opacity-50">
                  {savingProfile ? "Saving..." : "Save & Continue"}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
