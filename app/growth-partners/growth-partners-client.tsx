"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { growthPartnerBusinessTypes, type GrowthPartnerBusinessType } from "@/lib/validation";
type IconName =
  | "shield"
  | "test"
  | "clock"
  | "report"
  | "user"
  | "home"
  | "plug"
  | "map"
  | "building"
  | "heart"
  | "briefcase"
  | "network"
  | "store"
  | "check"
  | "factory"
  | "hospital"
  | "bank"
  | "school"
  | "pill"
  | "crane"
  | "rocket"
  | "government";

type SubmitState = "idle" | "loading" | "success" | "error";

const mobileRegex = /^[6-9]\d{9}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const formSubmitEndpoint = "https://formsubmit.co/ajax/scopex.lab@gmail.com";
const thankYouPath = "/thank-you";

const heroTrustBadges = [
  ["NABL Quality", "shield"],
  ["Pan India Network", "map"],
  ["1000+ Diagnostic Tests", "test"],
  ["Expert Business Support", "user"]
] as const;

const ecosystemCards = [
  { label: "Hospitals", description: "Reliable diagnostic partner for better care", icon: "hospital", className: "left-1/2 top-0 -translate-x-1/2", align: "text-center" },
  { label: "Pre-Employment Checkup", description: "Trusted screening for a healthy workforce", icon: "heart", className: "right-0 top-[22%] lg:-right-10 lg:top-[26%] xl:-right-16", align: "text-center md:text-left" },
  { label: "Executive Health Checkup", description: "Comprehensive health insights for leaders", icon: "briefcase", className: "right-0 bottom-[20%] md:bottom-[16%] lg:-right-8 lg:bottom-[10%] xl:-right-12", align: "text-center md:text-left" },
  { label: "HealthTech Platform", description: "Connected digital healthcare workflows", icon: "network", className: "left-1/2 bottom-0 -translate-x-1/2", align: "text-center" },
  { label: "Corporate Wellness", description: "Partnering for a healthier tomorrow", icon: "heart", className: "left-0 bottom-[20%] md:bottom-[16%] lg:-left-8 lg:bottom-[10%] xl:-left-12", align: "text-center md:text-right" },
  { label: "Insurance & TPAs", description: "Accurate reports, simplified claims", icon: "shield", className: "left-0 top-[22%] lg:-left-10 lg:top-[26%] xl:-left-16", align: "text-center md:text-right" }
] as const;

const whyCards = [
  ["NABL Quality Standards", "Quality-led workflows designed for dependable partner delivery.", "shield"],
  ["1000+ Diagnostic Tests", "A broad test menu for wellness, risk, insurance, and clinical needs.", "test"],
  ["Fast Turnaround Time", "Digital-first operations help partners move faster from sample to report.", "clock"],
  ["Digital Reports", "Clean report delivery for employees, customers, platforms, and providers.", "report"],
  ["Dedicated Key Account Manager", "A focused business contact for coordination, SLAs, and growth.", "user"],
  ["Home Collection Network", "Doorstep sample collection for corporate, insurance, and platform users.", "home"],
  ["API & LIS Integration", "Technology-ready workflows for platform and enterprise partnerships.", "plug"],
  ["Scalable Nationwide Partnership Model", "Built to support city expansion, franchise growth, and volume.", "map"]
] as const;

const partnershipModels = [
  {
    title: "Insurance & Health Insurance Partnerships",
    description: "Support insurance companies with trusted diagnostic services for policy issuance, renewals and claims.",
    icon: "shield",
    services: [
      "Pre-policy Medicals",
      "Policy Renewal Health Checkups",
      "Cashless Diagnostics",
      "Claim Investigation",
      "Corporate Insurance Health Programs",
      "Health Risk Assessment"
    ],
    cta: "Partner With ScopeX"
  },
  {
    title: "Corporate Health Programs",
    description: "Complete employee wellness and preventive healthcare solutions.",
    icon: "building",
    services: [
      "Annual Health Checkups",
      "Executive Packages",
      "Employee Wellness",
      "Health Camps",
      "Preventive Screening",
      "Customized Health Packages",
      "On-site Collection",
      "Digital Health Dashboard"
    ],
    cta: "Request Corporate Proposal"
  },
  {
    title: "Pre-Employment & Occupational Health",
    description: "Comprehensive medical fitness services for industries and organizations.",
    icon: "briefcase",
    services: [
      "Pre-Employment Medical Examination",
      "Periodic Medical Examination (PME)",
      "Drug Screening",
      "Medical Fitness Certificate",
      "Vision Testing",
      "Audiometry",
      "ECG",
      "Chest X-ray Coordination",
      "Industrial Health Screening",
      "Occupational Health Programs"
    ],
    cta: "Contact Business Team"
  },
  {
    title: "Healthcare Platform Partnerships",
    description: "Become our diagnostic partner and expand healthcare services through technology.",
    icon: "network",
    services: [
      "Telemedicine Platforms",
      "Digital Health Platforms",
      "HealthTech Companies",
      "Online Consultation Providers",
      "Healthcare Technology Partners",
      "Patient Engagement Platforms",
      "Laboratory Processing",
      "Home Collection",
      "White-label Diagnostics",
      "API Integration",
      "Digital Reports"
    ],
    cta: "Become Platform Partner"
  },
  {
    title: "Franchise & Collection Centre Network",
    description: "Expand ScopeX Diagnostics across India through entrepreneurs and healthcare businesses.",
    icon: "store",
    services: [
      "Collection Centre",
      "Diagnostic Franchise",
      "Satellite Laboratory",
      "Rural Collection Hub",
      "Brand Support",
      "Marketing",
      "Software",
      "LIS",
      "Training",
      "Sample Logistics",
      "Quality Assurance"
    ],
    cta: "Apply for Franchise"
  }
] as const;

const timeline = [
  "Submit Enquiry",
  "Business Discussion",
  "Requirement Analysis",
  "Proposal & Agreement",
  "Integration & Training",
  "Launch Partnership"
] as const;

const industries = [
  ["Insurance", "shield"],
  ["TPA Companies", "heart"],
  ["Manufacturing", "factory"],
  ["IT Companies", "building"],
  ["Hospitals", "hospital"],
  ["Clinics", "heart"],
  ["Banks", "bank"],
  ["Educational Institutions", "school"],
  ["Retail Chains", "store"],
  ["Pharmaceutical Companies", "pill"],
  ["Construction", "crane"],
  ["Mining", "factory"],
  ["Healthcare Startups", "rocket"],
  ["Diagnostic Centres", "test"],
  ["Corporate Offices", "building"],
  ["Government Organizations", "government"]
] as const;

const businessCredibility = [
  "NABL Quality Standards",
  "1000+ Diagnostic Tests",
  "Fast Turnaround Time",
  "Digital Reports",
  "Dedicated Account Manager",
  "Technology Integration",
  "Home Collection Network",
  "Scalable Enterprise Solutions"
] as const;

const growthPartnerFaqs = [
  {
    question: "Who can become a Growth Partner?",
    answer: "Insurance companies, TPAs, corporate HR teams, hospitals, clinics, healthcare platforms, diagnostic entrepreneurs, franchise investors, and collection centre owners can enquire for suitable partnership models."
  },
  {
    question: "Is there any joining fee?",
    answer: "Joining fee and commercial terms depend on the partnership model, location, service scope, and expected monthly volume. Our business team shares details after reviewing your requirements."
  },
  {
    question: "How long does onboarding take?",
    answer: "Onboarding timelines vary by model. Simple corporate or platform discussions can move quickly, while franchise, integration, or enterprise programs may require requirement analysis, documentation, and training."
  },
  {
    question: "Do you provide dedicated support?",
    answer: "Yes. Growth Partners can receive dedicated business support for coordination, operational planning, reporting workflows, and launch assistance based on the agreed partnership scope."
  },
  {
    question: "Can hospitals integrate with ScopeX?",
    answer: "Yes. Hospitals and clinics can discuss diagnostic support, referral workflows, sample logistics, report delivery, and technology-enabled coordination with ScopeX."
  },
  {
    question: "Do you support API/LIS integration?",
    answer: "Yes. ScopeX can discuss API and LIS integration requirements for healthcare platforms, hospitals, enterprise partners, and digital health workflows."
  },
  {
    question: "Which cities do you currently serve?",
    answer: "ScopeX Diagnostics operates through a growing Pan India partner network. Contact our team to confirm service availability in your city."
  },
  {
    question: "How can I schedule a business meeting?",
    answer: "Submit the Growth Partner form or use the business contact CTA on this page. Our team will review your details and coordinate the next discussion."
  }
] as const;

type GrowthPartnerFormState = {
  companyName: string;
  contactPerson: string;
  designation: string;
  mobileNumber: string;
  officialEmail: string;
  companyWebsite: string;
  city: string;
  state: string;
  businessType: "" | GrowthPartnerBusinessType;
  expectedMonthlyVolume: string;
  message: string;
  consent: boolean;
};

const initialForm: GrowthPartnerFormState = {
  companyName: "",
  contactPerson: "",
  designation: "",
  mobileNumber: "",
  officialEmail: "",
  companyWebsite: "",
  city: "",
  state: "",
  businessType: "" as "" | GrowthPartnerBusinessType,
  expectedMonthlyVolume: "",
  message: "",
  consent: false
};

const meetingBusinessCategories = [
  "HealthTech Platform",
  "Hospital",
  "Corporate",
  "Insurance / TPA",
  "Diagnostic Centre",
  "Franchise / Collection Centre",
  "Government Organization",
  "Other"
] as const;

type MeetingBusinessCategory = "" | (typeof meetingBusinessCategories)[number];

type MeetingFormState = {
  fullName: string;
  companyOrganization: string;
  designation: string;
  businessEmail: string;
  mobileNumber: string;
  city: string;
  businessCategory: MeetingBusinessCategory;
  preferredMeetingDate: string;
  preferredMeetingTime: string;
  additionalRequirements: string;
};

const initialMeetingForm: MeetingFormState = {
  fullName: "",
  companyOrganization: "",
  designation: "",
  businessEmail: "",
  mobileNumber: "",
  city: "",
  businessCategory: "",
  preferredMeetingDate: "",
  preferredMeetingTime: "",
  additionalRequirements: ""
};

function getTodayInputDate() {
  const today = new Date();
  const localOffsetMs = today.getTimezoneOffset() * 60 * 1000;
  return new Date(today.getTime() - localOffsetMs).toISOString().slice(0, 10);
}
function Icon({ name, className = "h-6 w-6" }: { name: IconName; className?: string }) {
  const common = { className, fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true, focusable: false };

  switch (name) {
    case "shield":
      return <svg viewBox="0 0 24 24" {...common}><path d="M12 3 19 7v5c0 4.2-2.9 7.9-7 9-4.1-1.1-7-4.8-7-9V7l7-4Z" /><path d="m9.4 12 1.7 1.7 3.5-3.7" /></svg>;
    case "test":
      return <svg viewBox="0 0 24 24" {...common}><path d="M10 3v6.5L5.7 17a2.8 2.8 0 0 0 2.4 4h7.8a2.8 2.8 0 0 0 2.4-4L14 9.5V3" /><path d="M8 3h8" /><path d="M7.8 16h8.4" /></svg>;
    case "clock":
      return <svg viewBox="0 0 24 24" {...common}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>;
    case "report":
      return <svg viewBox="0 0 24 24" {...common}><path d="M7 3.5h7l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 20V5A1.5 1.5 0 0 1 7.5 3.5Z" /><path d="M14 3.5V8h4" /><path d="M9 12h6M9 15.5h6" /></svg>;
    case "user":
      return <svg viewBox="0 0 24 24" {...common}><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></svg>;
    case "home":
      return <svg viewBox="0 0 24 24" {...common}><path d="M3 11.5 12 4l9 7.5" /><path d="M6.5 10.5V20h11v-9.5" /><path d="M9.5 20v-5h5v5" /></svg>;
    case "plug":
      return <svg viewBox="0 0 24 24" {...common}><path d="M9 7V3M15 7V3" /><path d="M7 7h10v4a5 5 0 0 1-10 0V7Z" /><path d="M12 16v5" /><path d="M8 21h8" /></svg>;
    case "map":
      return <svg viewBox="0 0 24 24" {...common}><path d="m8 5-5 2v13l5-2 8 2 5-2V5l-5 2-8-2Z" /><path d="M8 5v13M16 7v13" /></svg>;
    case "building":
      return <svg viewBox="0 0 24 24" {...common}><path d="M5 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" /><path d="M3 21h18M9 7h4M9 11h4M9 15h4" /></svg>;
    case "heart":
      return <svg viewBox="0 0 24 24" {...common}><path d="M20 8.5c0 5-8 10.5-8 10.5S4 13.5 4 8.5A4.3 4.3 0 0 1 12 6a4.3 4.3 0 0 1 8 2.5Z" /></svg>;
    case "briefcase":
      return <svg viewBox="0 0 24 24" {...common}><path d="M9 6V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1" /><path d="M4 7h16v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z" /><path d="M4 12h16" /></svg>;
    case "network":
      return <svg viewBox="0 0 24 24" {...common}><circle cx="6" cy="7" r="2.5" /><circle cx="18" cy="7" r="2.5" /><circle cx="12" cy="17" r="2.5" /><path d="m8 8.8 2.6 5.2M16 8.8 13.4 14M8.5 7h7" /></svg>;
    case "store":
      return <svg viewBox="0 0 24 24" {...common}><path d="M4 10h16l-1.5-6h-13L4 10Z" /><path d="M5 10v10h14V10" /><path d="M9 20v-5h6v5" /></svg>;
    case "check":
      return <svg viewBox="0 0 24 24" {...common}><path d="m5 12.5 4 4L19 6.5" /></svg>;
    case "factory":
      return <svg viewBox="0 0 24 24" {...common}><path d="M4 21V9l5 3V9l5 3V7h6v14H4Z" /><path d="M8 17h1M12 17h1M16 17h1" /></svg>;
    case "hospital":
      return <svg viewBox="0 0 24 24" {...common}><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" /><path d="M9 21v-5h6v5M9 8h6M12 5v6" /></svg>;
    case "bank":
      return <svg viewBox="0 0 24 24" {...common}><path d="M4 9h16L12 4 4 9Z" /><path d="M6 10v8M10 10v8M14 10v8M18 10v8M4 20h16" /></svg>;
    case "school":
      return <svg viewBox="0 0 24 24" {...common}><path d="m3 9 9-5 9 5-9 5-9-5Z" /><path d="M7 11.5v4c3 2 7 2 10 0v-4" /></svg>;
    case "pill":
      return <svg viewBox="0 0 24 24" {...common}><path d="M10 21 21 10a4.2 4.2 0 0 0-6-6L4 15a4.2 4.2 0 0 0 6 6Z" /><path d="m8.5 10.5 5 5" /></svg>;
    case "crane":
      return <svg viewBox="0 0 24 24" {...common}><path d="M4 21h16M6 21V7h8l4 4" /><path d="M6 7l8 8M14 7v8M18 11v4" /></svg>;
    case "rocket":
      return <svg viewBox="0 0 24 24" {...common}><path d="M14 4c3 0 5 0 6 1-1 6-4 9-9 11L8 13c2-5 5-8 6-9Z" /><path d="M8 13 5 14l-1 5 5-1 2-2" /><path d="M15 9h.01" /></svg>;
    case "government":
      return <svg viewBox="0 0 24 24" {...common}><path d="M4 9h16L12 4 4 9Z" /><path d="M5 20h14M7 10v7M12 10v7M17 10v7" /></svg>;
  }
}

function scrollToForm() {
  document.getElementById("growth-partner-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function GrowthPartnersClient() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [meetingForm, setMeetingForm] = useState(initialMeetingForm);
  const [meetingStatus, setMeetingStatus] = useState<SubmitState>("idle");
  const [meetingMessage, setMeetingMessage] = useState("");
  const todayInputDate = getTodayInputDate();
  const sanitizedMeetingMobile = meetingForm.mobileNumber.replace(/\D/g, "");
  const isMeetingFormComplete = Boolean(
    meetingForm.fullName.trim() &&
    meetingForm.companyOrganization.trim() &&
    meetingForm.businessEmail.trim() &&
    meetingForm.mobileNumber.trim() &&
    meetingForm.city.trim() &&
    meetingForm.businessCategory &&
    meetingForm.preferredMeetingDate &&
    meetingForm.preferredMeetingTime &&
    emailRegex.test(meetingForm.businessEmail.trim()) &&
    mobileRegex.test(sanitizedMeetingMobile) &&
    meetingForm.preferredMeetingDate >= todayInputDate
  );

  function updateField<T extends keyof GrowthPartnerFormState>(key: T, value: GrowthPartnerFormState[T]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateMeetingField<T extends keyof MeetingFormState>(key: T, value: MeetingFormState[T]) {
    setMeetingForm((current) => ({ ...current, [key]: value }));
    if (meetingStatus !== "idle") {
      setMeetingStatus("idle");
      setMeetingMessage("");
    }
  }

  function openMeetingModal() {
    setMeetingOpen(true);
    setMeetingStatus("idle");
    setMeetingMessage("");
  }

  function closeMeetingModal() {
    setMeetingOpen(false);
    setMeetingStatus("idle");
    setMeetingMessage("");
  }

  function scheduleAnotherMeeting() {
    setMeetingForm(initialMeetingForm);
    setMeetingStatus("idle");
    setMeetingMessage("");
  }

  async function onMeetingSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMeetingStatus("loading");
    setMeetingMessage("");

    const requiredFields = [
      meetingForm.fullName,
      meetingForm.companyOrganization,
      meetingForm.businessEmail,
      meetingForm.mobileNumber,
      meetingForm.city,
      meetingForm.businessCategory,
      meetingForm.preferredMeetingDate,
      meetingForm.preferredMeetingTime
    ];

    if (requiredFields.some((value) => !value.trim())) {
      setMeetingStatus("error");
      setMeetingMessage("Please complete all required meeting fields.");
      return;
    }
    if (!emailRegex.test(meetingForm.businessEmail.trim())) {
      setMeetingStatus("error");
      setMeetingMessage("Enter a valid business email address.");
      return;
    }
    if (!mobileRegex.test(sanitizedMeetingMobile)) {
      setMeetingStatus("error");
      setMeetingMessage("Enter a valid 10-digit Indian mobile number.");
      return;
    }
    if (meetingForm.preferredMeetingDate < todayInputDate) {
      setMeetingStatus("error");
      setMeetingMessage("Please select today or a future meeting date.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("_subject", "New ScopeX Business Meeting Request");
      formData.append("_template", "table");
      formData.append("_captcha", "false");
      formData.append("leadType", "Business Meeting Request");
      formData.append("fullName", meetingForm.fullName.trim());
      formData.append("companyOrganization", meetingForm.companyOrganization.trim());
      formData.append("designation", meetingForm.designation.trim());
      formData.append("businessEmail", meetingForm.businessEmail.trim());
      formData.append("mobileNumber", sanitizedMeetingMobile);
      formData.append("city", meetingForm.city.trim());
      formData.append("businessCategory", meetingForm.businessCategory);
      formData.append("preferredMeetingDate", meetingForm.preferredMeetingDate);
      formData.append("preferredMeetingTime", meetingForm.preferredMeetingTime);
      formData.append("additionalRequirements", meetingForm.additionalRequirements.trim());

      const response = await fetch(formSubmitEndpoint, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: formData
      });

      if (!response.ok) {
        throw new Error("Unable to schedule meeting. Please try again.");
      }

      setMeetingStatus("success");
      setMeetingMessage("Thank you! Your meeting request has been received. Our Business Development Team will contact you shortly.");
    } catch (error) {
      setMeetingStatus("error");
      setMeetingMessage(error instanceof Error ? error.message : "Unable to schedule meeting. Please try again.");
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const sanitizedMobile = form.mobileNumber.replace(/\D/g, "");
    const requiredTextFields = [
      form.companyName,
      form.contactPerson,
      form.designation,
      form.city,
      form.state,
      form.businessType,
      form.expectedMonthlyVolume,
      form.message
    ];

    if (requiredTextFields.some((value) => !value.trim())) {
      setStatus("error");
      setMessage("Please complete all required fields.");
      return;
    }
    if (form.message.trim().length < 10) {
      setStatus("error");
      setMessage("Message must be at least 10 characters.");
      return;
    }
    if (!mobileRegex.test(sanitizedMobile)) {
      setStatus("error");
      setMessage("Enter a valid 10-digit Indian mobile number.");
      return;
    }
    if (!emailRegex.test(form.officialEmail.trim())) {
      setStatus("error");
      setMessage("Enter a valid official email address.");
      return;
    }
    if (!form.consent) {
      setStatus("error");
      setMessage("Please agree to be contacted by ScopeX Diagnostics.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("_subject", "New ScopeX Business Lead Form Submission");
      formData.append("_template", "table");
      formData.append("_captcha", "false");
      formData.append("leadType", "Growth Partner");
      formData.append("companyName", form.companyName.trim());
      formData.append("contactPerson", form.contactPerson.trim());
      formData.append("designation", form.designation.trim());
      formData.append("mobileNumber", sanitizedMobile);
      formData.append("officialEmail", form.officialEmail.trim());
      formData.append("companyWebsite", form.companyWebsite.trim());
      formData.append("city", form.city.trim());
      formData.append("state", form.state.trim());
      formData.append("businessType", form.businessType);
      formData.append("expectedMonthlyVolume", form.expectedMonthlyVolume.trim());
      formData.append("message", form.message.trim());
      formData.append("consent", "Agreed to be contacted by ScopeX Diagnostics");

      const response = await fetch(formSubmitEndpoint, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: formData
      });

      if (!response.ok) {
        throw new Error("Unable to submit enquiry. Please try again.");
      }

      setStatus("success");
      setMessage("Thank you. Your partnership enquiry has been submitted successfully. Redirecting you now...");
      setForm(initialForm);
      window.setTimeout(() => router.push(thankYouPath), 1200);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to submit enquiry. Please try again.");
    }
  }

  return (
    <>
      <section className="container-px relative isolate overflow-hidden bg-white py-14 md:py-20 lg:py-24">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_16%_18%,rgba(247,147,30,0.14),transparent_28%),radial-gradient(circle_at_84%_24%,rgba(247,147,30,0.08),transparent_24%),linear-gradient(180deg,#FFF8F2_0%,#FFEEDC_58%,#FFE2C2_100%)]" />
        <div className="growth-hero-grid pointer-events-none absolute inset-0 -z-10 opacity-[0.38]" />
        <div className="section-wrap">
          <div className="grid min-h-[680px] items-center gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-12 xl:grid-cols-[1fr_1fr] xl:gap-16">
            <div className="max-w-3xl">
              <p className="growth-fade-up text-sm font-bold uppercase tracking-[0.22em] text-[#F7931E]">Growth Partners</p>
              <h1 className="growth-fade-up mt-4 max-w-4xl text-4xl font-extrabold leading-[1.05] text-[#0D0D0D] md:text-6xl lg:text-[64px]">
                Partner with India&apos;s Next-Generation Diagnostics Network
              </h1>
              <p className="growth-fade-up mt-6 max-w-3xl text-base leading-8 text-[#4e5f60] md:text-lg">
                Expand your healthcare services with ScopeX Diagnostics. We enable hospitals, insurance companies, corporates, diagnostic centers, healthcare startups, and government organizations with reliable diagnostics, nationwide reach, and technology-driven healthcare solutions.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                {heroTrustBadges.map(([label, icon], index) => (
                  <div key={label} className="growth-badge flex min-h-[44px] items-center gap-2 rounded-full border border-[#f5ddc7] bg-white/90 px-4 py-2 text-sm font-semibold text-[#0D0D0D] shadow-[0_10px_24px_rgba(13,13,13,0.05)]" style={{ animationDelay: `${120 + index * 80}ms` }}>
                    <span className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-[#fff3e5] text-[#F7931E]"><Icon name={icon as IconName} className="h-3.5 w-3.5" /></span>
                    {label}
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={scrollToForm} className="cta-btn w-full sm:w-auto" aria-label="Become a Growth Partner with ScopeX Diagnostics">
                  Become a Growth Partner
                </button>
                <button type="button" onClick={openMeetingModal} className="secondary-btn w-full border-[#F7931E] text-[#F7931E] hover:bg-[#fff7ef] sm:w-auto" aria-label="Schedule a business meeting with ScopeX Diagnostics">
                  Schedule Business Meeting
                </button>
              </div>
            </div>

            <div className="relative mx-auto h-[980px] w-full max-w-[720px] sm:h-[940px] md:h-[720px] lg:h-[780px]" aria-hidden="true">
              <div className="absolute inset-4 rounded-full border border-[#f2ddca]/80" />
              <div className="absolute inset-16 rounded-full border border-[#f2ddca]/70" />
              <div className="absolute inset-28 rounded-full border border-dashed border-[#f7cda5]" />
              <svg className="absolute inset-0 h-full w-full text-[#F7931E]" viewBox="0 0 720 720" fill="none" aria-hidden="true">
                <path className="growth-line" d="M360 360 L360 110" />
                <path className="growth-line growth-line-delay-1" d="M360 360 L588 230" />
                <path className="growth-line growth-line-delay-2" d="M360 360 L552 560" />
                <path className="growth-line growth-line-delay-3" d="M360 360 L360 622" />
                <path className="growth-line growth-line-delay-4" d="M360 360 L168 560" />
                <path className="growth-line growth-line-delay-5" d="M360 360 L132 230" />
                <circle cx="360" cy="165" r="5" fill="currentColor" />
                <circle cx="542" cy="255" r="5" fill="currentColor" />
                <circle cx="510" cy="514" r="5" fill="currentColor" />
                <circle cx="360" cy="564" r="5" fill="currentColor" />
                <circle cx="210" cy="514" r="5" fill="currentColor" />
                <circle cx="178" cy="255" r="5" fill="currentColor" />
              </svg>

              <div className="absolute left-1/2 top-1/2 z-20 flex h-40 w-40 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-[#F7931E] bg-[#0D0D0D] text-center text-white shadow-[0_24px_70px_rgba(13,13,13,0.24)] sm:h-44 sm:w-44">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F7931E] text-white"><Icon name="network" className="h-7 w-7" /></span>
                <span className="mt-4 text-xl font-extrabold uppercase tracking-[0.18em]">ScopeX</span>
                <span className="text-sm font-bold uppercase tracking-[0.2em] text-[#F7931E]">Platform</span>
              </div>

              {ecosystemCards.map((card, index) => (
                <div key={card.label} className={`growth-ecosystem-card absolute z-10 flex w-[120px] flex-col items-center sm:w-[150px] md:w-[168px] lg:w-[180px] ${card.align} ${card.className}`} style={{ animationDelay: `${index * 180}ms` }}>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#f7cda5] bg-white text-[#F7931E] shadow-[0_18px_44px_rgba(247,147,30,0.13)] sm:h-20 sm:w-20 lg:h-24 lg:w-24">
                    <Icon name={card.icon as IconName} className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12" />
                  </div>
                  <p className="mt-4 text-[0.72rem] font-extrabold uppercase leading-5 tracking-[0.08em] text-[#0D0D0D] sm:text-sm lg:text-base">{card.label}</p>
                  <p className="mt-2 max-w-[170px] text-[0.68rem] font-medium leading-4 text-[#2f3434] sm:text-xs lg:text-sm lg:leading-5">{card.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container-px relative isolate overflow-hidden py-12 md:py-14">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_8%,rgba(247,147,30,0.16),transparent_28%),radial-gradient(circle_at_86%_18%,rgba(247,147,30,0.10),transparent_24%),linear-gradient(180deg,#FFE2C2_0%,#FFF8F2_34%,#FFEEDC_72%,#FFE2C2_100%)]" />
        <div className="growth-warm-section-grid pointer-events-none absolute inset-0 -z-10" />
        <svg className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-full w-full text-[#F7931E]/20" viewBox="0 0 1440 520" fill="none" aria-hidden="true" preserveAspectRatio="none">
          <path className="growth-warm-curve" d="M-80 98C196 8 360 28 574 118C816 220 1006 224 1520 84" />
          <path className="growth-warm-curve growth-line-delay-2" d="M-80 374C192 274 420 284 646 362C910 454 1092 424 1520 286" />
        </svg>
        <div className="section-wrap">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#F7931E]">Why Partner With ScopeX</p>
            <h2 className="mt-2 text-3xl font-bold text-[#0D0D0D] md:text-4xl">Why Leading Organizations Choose ScopeX</h2>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {whyCards.map(([title, description, icon]) => (
              <article key={title} className="group rounded-[26px] border border-[#f1dfce] bg-white p-5 shadow-[0_16px_36px_rgba(13,13,13,0.06)] transition duration-300 hover:-translate-y-1 hover:border-[#f7cda5] hover:shadow-[0_22px_46px_rgba(247,147,30,0.13)]">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-[#f7d7bb] bg-[#fff3e5] text-[#F7931E] transition group-hover:border-[#F7931E] group-hover:bg-[#F7931E] group-hover:text-white">
                  <Icon name={icon} />
                </div>
                <h3 className="mt-4 text-lg font-bold text-[#0D0D0D]">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-[#5f6868]">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="container-px growth-warm-page-section py-12 md:py-14">
        <div className="section-wrap">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#F7931E]">Partnership Models</p>
            <h2 className="mt-2 text-3xl font-bold text-[#0D0D0D] md:text-4xl">Our Growth Partnership Models</h2>
          </div>
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {partnershipModels.map((model, index) => (
              <article key={model.title} className={`${index === 4 ? "lg:col-span-2" : ""} rounded-[28px] border border-[#f1dfce] bg-white p-5 shadow-[0_16px_36px_rgba(16,24,40,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_46px_rgba(16,24,40,0.11)] md:p-6`}>
                <div className="flex flex-col gap-5 md:flex-row">
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-[22px] border border-[#f7d7bb] bg-[#fff3e5] text-[#F7931E]">
                    <Icon name={model.icon as IconName} className="h-8 w-8" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-2xl font-bold text-[#0D0D0D]">{model.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-[#5f6868]">{model.description}</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {model.services.map((service) => (
                        <span key={service} className="rounded-full border border-[#f1dfce] bg-[#FFF8F2] px-3 py-1.5 text-xs font-semibold text-[#5f6868]">
                          {service}
                        </span>
                      ))}
                    </div>
                    <button type="button" onClick={scrollToForm} className="mt-6 inline-flex min-h-[44px] items-center text-sm font-bold uppercase tracking-[0.12em] text-[#F7931E] transition hover:text-[#F7931E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F7931E]" aria-label={`Explore partnership options for ${model.title}`}>
                      Explore Partnership Options
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="container-px growth-warm-page-section py-12 md:py-14">
        <div className="section-wrap">
          <div className="rounded-[30px] border border-[#f1dfce] bg-white p-6 shadow-[0_18px_42px_rgba(16,24,40,0.06)] md:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#F7931E]">How We Partner</p>
            <h2 className="mt-2 text-3xl font-bold text-[#0D0D0D] md:text-4xl">From enquiry to launch, with clear handoffs</h2>
            <div className="mt-7 grid gap-4 md:grid-cols-3 lg:grid-cols-6">
              {timeline.map((step, index) => (
                <div key={step} className="relative rounded-[22px] border border-[#f1dfce] bg-[#FFF8F2] p-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F7931E] text-sm font-bold text-white">{index + 1}</span>
                  <h3 className="mt-4 text-base font-bold text-[#0D0D0D]">{step}</h3>
                  {index < timeline.length - 1 ? <span className="mt-4 block text-2xl font-bold text-[#F7931E] md:hidden">â†“</span> : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container-px growth-warm-page-section py-12 md:py-14">
        <div className="section-wrap">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#F7931E]">Industries We Serve</p>
            <h2 className="mt-2 text-3xl font-bold text-[#0D0D0D] md:text-4xl">Built for high-trust healthcare programs</h2>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {industries.map(([label, icon]) => (
              <div key={label} className="flex items-center gap-3 rounded-[22px] border border-[#f1dfce] bg-white p-4 text-sm font-semibold text-[#5f6868] shadow-[0_10px_24px_rgba(16,24,40,0.04)]">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#fff3e5] text-[#F7931E]">
                  <Icon name={icon as IconName} className="h-5 w-5" />
                </span>
                {label}
              </div>
            ))}
          </div>
          <button type="button" onClick={scrollToForm} className="secondary-btn mt-6" aria-label="Discuss your business requirements with ScopeX Diagnostics">
            Discuss Your Requirements
          </button>
        </div>
      </section>

      <section className="container-px growth-warm-page-section py-12 md:py-14">
        <div className="section-wrap">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#F7931E]">Business Credibility</p>
            <h2 className="mt-2 text-3xl font-bold text-[#0D0D0D] md:text-4xl">Why Businesses Partner With ScopeX</h2>
            <p className="mt-3 text-sm leading-8 text-[#5f6868] md:text-base">
              Enterprise teams need quality, speed, technology, and dependable operational support. ScopeX is built to support structured healthcare programs at scale.
            </p>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {businessCredibility.map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-[24px] border border-[#f1dfce] bg-white p-5 shadow-[0_14px_30px_rgba(16,24,40,0.05)]">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#fff4ed] text-[#F7931E]">
                  <Icon name="check" className="h-5 w-5" />
                </div>
                <p className="pt-1 text-base font-bold leading-7 text-[#0D0D0D]">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-px growth-warm-page-section py-12 md:py-14">
        <div className="section-wrap">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#F7931E]">Frequently Asked Questions</p>
            <h2 className="mt-2 text-3xl font-bold text-[#0D0D0D] md:text-4xl">Common B2B Partnership Questions</h2>
            <p className="mt-3 text-sm leading-8 text-[#5f6868] md:text-base">
              Quick answers for organizations evaluating ScopeX Diagnostics as a business, technology, or diagnostic network partner.
            </p>
          </div>
          <div className="mt-6 grid gap-3 lg:grid-cols-2">
            {growthPartnerFaqs.map((item) => (
              <details key={item.question} className="group rounded-[24px] border border-[#f1dfce] bg-white p-5 shadow-[0_14px_30px_rgba(16,24,40,0.05)]">
                <summary className="flex min-h-[44px] cursor-pointer list-none items-start justify-between gap-4 rounded-2xl text-base font-bold leading-7 text-[#0D0D0D] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F7931E]">
                  <span>{item.question}</span>
                  <span className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#fff4ed] text-[#F7931E] transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-4 text-sm leading-7 text-[#5f6868]">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section id="growth-partner-form" className="container-px growth-warm-page-section py-12 md:py-14">
        <div className="section-wrap">
          <div className="grid gap-7 lg:grid-cols-[0.75fr_1fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#F7931E]">Become A Growth Partner</p>
              <h2 className="mt-2 text-3xl font-bold text-[#0D0D0D] md:text-4xl">Start a partnership conversation</h2>
              <p className="mt-4 text-sm leading-8 text-[#5f6868] md:text-base">
                Share your business requirements and expected monthly volume. ScopeX Diagnostics will evaluate the right partnership model and contact you for the next discussion.
              </p>
            </div>

            <form onSubmit={onSubmit} className="rounded-[30px] border border-[#f1dfce] bg-white p-5 shadow-[0_18px_42px_rgba(16,24,40,0.06)] md:p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <input required value={form.companyName} onChange={(e) => updateField("companyName", e.target.value)} placeholder="Company Name" className="form-field" aria-label="Company Name" />
                <input required value={form.contactPerson} onChange={(e) => updateField("contactPerson", e.target.value)} placeholder="Contact Person" className="form-field" aria-label="Contact Person" />
                <input required value={form.designation} onChange={(e) => updateField("designation", e.target.value)} placeholder="Designation" className="form-field" aria-label="Designation" />
                <input required value={form.mobileNumber} onChange={(e) => updateField("mobileNumber", e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="Mobile Number" inputMode="numeric" maxLength={10} pattern="[0-9]{10}" className="form-field" aria-label="Mobile Number" />
                <input required type="email" value={form.officialEmail} onChange={(e) => updateField("officialEmail", e.target.value)} placeholder="Official Email" className="form-field" aria-label="Official Email" />
                <input value={form.companyWebsite} onChange={(e) => updateField("companyWebsite", e.target.value)} placeholder="Company Website" className="form-field" aria-label="Company Website" />
                <input required value={form.city} onChange={(e) => updateField("city", e.target.value)} placeholder="City" className="form-field" aria-label="City" />
                <input required value={form.state} onChange={(e) => updateField("state", e.target.value)} placeholder="State" className="form-field" aria-label="State" />
                <select required value={form.businessType} onChange={(e) => updateField("businessType", e.target.value as GrowthPartnerBusinessType)} className="form-field" aria-label="Business Type">
                  <option value="">Business Type</option>
                  {growthPartnerBusinessTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <input required value={form.expectedMonthlyVolume} onChange={(e) => updateField("expectedMonthlyVolume", e.target.value)} placeholder="Expected Monthly Volume" className="form-field" aria-label="Expected Monthly Volume" />
                <textarea required value={form.message} onChange={(e) => updateField("message", e.target.value)} placeholder="Message" rows={5} className="form-field md:col-span-2" aria-label="Message" />
              </div>

              <label className="mt-4 flex gap-3 rounded-2xl border border-[#f1dfce] bg-[#FFF8F2] p-4 text-sm leading-6 text-[#5f6868]">
                <input type="checkbox" checked={form.consent} onChange={(e) => updateField("consent", e.target.checked)} className="mt-1 h-4 w-4 accent-[#F7931E]" />
                <span>I agree to be contacted by ScopeX Diagnostics regarding partnership opportunities.</span>
              </label>

              <button type="submit" disabled={status === "loading"} className="cta-btn mt-5 w-full disabled:opacity-60" aria-label="Submit business enquiry to ScopeX Diagnostics">
                {status === "loading" ? "Submitting..." : "Submit Business Enquiry"}
              </button>
              {message ? (
                <p className={`mt-4 rounded-2xl px-4 py-3 text-sm ${status === "success" ? "bg-[#fff3e5] text-[#B45309]" : "bg-red-50 text-red-600"}`} role="status">
                  {message}
                </p>
              ) : null}
            </form>
          </div>
        </div>
      </section>

      <section className="container-px growth-warm-page-section py-12 md:py-14">
        <div className="section-wrap rounded-[30px] border border-[#f1dfce] bg-white p-6 shadow-[0_18px_42px_rgba(16,24,40,0.06)] md:p-8">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#F7931E]">Partner With ScopeX</p>
              <h2 className="mt-2 text-3xl font-bold text-[#0D0D0D] md:text-4xl">Let&apos;s Grow Healthcare Together</h2>
              <p className="mt-3 max-w-3xl text-sm leading-8 text-[#5f6868] md:text-base">
                Join ScopeX Diagnostics and become part of a trusted diagnostic network delivering quality healthcare solutions across India.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
              <button type="button" onClick={openMeetingModal} className="cta-btn" aria-label="Schedule a business meeting with ScopeX Diagnostics">
                Schedule a Business Meeting
              </button>
              <Link href="tel:+918989273440" className="secondary-btn" aria-label="Contact ScopeX business development by phone">
                Contact Business Development
              </Link>
            </div>
          </div>
        </div>
      </section>
    
      {meetingOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#0D0D0D]/45 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="meeting-modal-title">
          <div className="growth-modal-panel max-h-[calc(100vh-3rem)] w-full max-w-3xl overflow-y-auto rounded-[30px] border border-[#f1dfce] bg-white shadow-[0_28px_80px_rgba(13,13,13,0.22)]">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#f1dfce] bg-white/95 px-5 py-4 backdrop-blur md:px-7">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F7931E]">Business Meeting</p>
                <h2 id="meeting-modal-title" className="mt-1 text-2xl font-bold text-[#0D0D0D]">Schedule a Business Meeting</h2>
              </div>
              <button type="button" onClick={closeMeetingModal} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#f1dfce] bg-[#FFF8F2] text-2xl leading-none text-[#0D0D0D] transition hover:-translate-y-0.5 hover:border-[#F7931E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7931E]" aria-label="Close meeting scheduler">
                ×
              </button>
            </div>

            {meetingStatus === "success" ? (
              <div className="px-5 py-8 md:px-7">
                <div className="rounded-[26px] border border-[#f1dfce] bg-[#FFF8F2] p-6 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F7931E]/10 text-[#F7931E]">
                    <Icon name="check" className="h-7 w-7" />
                  </div>
                  <p className="mt-5 text-lg font-semibold leading-8 text-[#0D0D0D]" role="status">{meetingMessage}</p>
                  <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                    <button type="button" onClick={closeMeetingModal} className="secondary-btn">Close</button>
                    <button type="button" onClick={scheduleAnotherMeeting} className="cta-btn">Schedule Another Meeting</button>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={onMeetingSubmit} className="px-5 py-6 md:px-7" noValidate>
                <div className="grid gap-4 md:grid-cols-2">
                  <input required value={meetingForm.fullName} onChange={(e) => updateMeetingField("fullName", e.target.value)} placeholder="Full Name *" className="form-field" aria-label="Full Name" />
                  <input required value={meetingForm.companyOrganization} onChange={(e) => updateMeetingField("companyOrganization", e.target.value)} placeholder="Company / Organization *" className="form-field" aria-label="Company or Organization" />
                  <input value={meetingForm.designation} onChange={(e) => updateMeetingField("designation", e.target.value)} placeholder="Designation" className="form-field" aria-label="Designation" />
                  <input required type="email" value={meetingForm.businessEmail} onChange={(e) => updateMeetingField("businessEmail", e.target.value)} placeholder="Business Email *" className="form-field" aria-label="Business Email" />
                  <input required value={meetingForm.mobileNumber} onChange={(e) => updateMeetingField("mobileNumber", e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="Mobile Number *" inputMode="numeric" maxLength={10} pattern="[0-9]{10}" className="form-field" aria-label="Mobile Number" />
                  <input required value={meetingForm.city} onChange={(e) => updateMeetingField("city", e.target.value)} placeholder="City *" className="form-field" aria-label="City" />
                  <select required value={meetingForm.businessCategory} onChange={(e) => updateMeetingField("businessCategory", e.target.value as MeetingBusinessCategory)} className="form-field" aria-label="Business Category">
                    <option value="">Business Category *</option>
                    {meetingBusinessCategories.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  <input required type="date" min={todayInputDate} value={meetingForm.preferredMeetingDate} onChange={(e) => updateMeetingField("preferredMeetingDate", e.target.value)} className="form-field" aria-label="Preferred Meeting Date" />
                  <input required type="time" value={meetingForm.preferredMeetingTime} onChange={(e) => updateMeetingField("preferredMeetingTime", e.target.value)} className="form-field" aria-label="Preferred Meeting Time" />
                  <textarea value={meetingForm.additionalRequirements} onChange={(e) => updateMeetingField("additionalRequirements", e.target.value)} placeholder="Additional Requirements (Optional)" rows={4} className="form-field md:col-span-2" aria-label="Additional Requirements" />
                </div>

                {meetingMessage ? (
                  <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">{meetingMessage}</p>
                ) : null}

                <div className="mt-6 flex flex-col justify-end gap-3 sm:flex-row">
                  <button type="button" onClick={closeMeetingModal} className="secondary-btn">Cancel</button>
                  <button type="submit" disabled={!isMeetingFormComplete || meetingStatus === "loading"} className="cta-btn disabled:pointer-events-none disabled:opacity-50" aria-label="Submit ScopeX business meeting request">
                    {meetingStatus === "loading" ? "Scheduling..." : "Schedule Meeting"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}    </>
  );
}



