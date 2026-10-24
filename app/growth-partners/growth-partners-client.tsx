"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  ShieldCheck,
  Building2,
  Briefcase,
  Network,
  Store,
  CheckCircle2,
  ArrowRight,
  ArrowDown,
  Calendar,
  Clock,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  X,
  FileCheck2,
  Users,
  TestTube2,
  HeartHandshake,
  Stethoscope,
  Building,
  GraduationCap,
  ShoppingBag,
  Pill,
  HardHat,
  Factory,
  Rocket,
  Landmark,
  Layers,
  ChevronDown,
  Zap,
  Cpu,
  FileSpreadsheet,
  Scale,
  Award
} from "lucide-react";
import { growthPartnerBusinessTypes, type GrowthPartnerBusinessType } from "@/lib/validation";

type SubmitState = "idle" | "loading" | "success" | "error";

const mobileRegex = /^[6-9]\d{9}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const formSubmitEndpoint = "https://formsubmit.co/ajax/scopex.lab@gmail.com";
const thankYouPath = "/thank-you";

const heroTrustBadges = [
  { label: "NABL Standards", icon: ShieldCheck, stat: "100% Accredited" },
  { label: "Pan India Reach", icon: MapPin, stat: "Major Metros & Hubs" },
  { label: "1,000+ Test Menu", icon: TestTube2, stat: "Routine & Specialized" },
  { label: "12–24h TAT", icon: Clock, stat: "Guaranteed SLA" }
];

const ecosystemCards = [
  {
    tag: "Hospital Lab Outsource",
    label: "Hospitals & Nursing Homes",
    description: "Reliable outpatient overflow processing with bi-directional LIS interface.",
    icon: Stethoscope,
    badge: "Clinical Care",
    tags: ["STAT Turnaround", "1,000+ Biomarkers", "LIS & HIS Sync"],
    sla: "12h Emergency SLA"
  },
  {
    tag: "Risk Assessment",
    label: "Insurance & TPAs",
    description: "Pre-policy medical checkups and cashless claims with tamper-proof reports.",
    icon: ShieldCheck,
    badge: "Underwriting",
    tags: ["Doorstep Home Visit", "QR-Signed PDF", "Fraud Protection"],
    sla: "Pan-India Coverage"
  },
  {
    tag: "Workforce Care",
    label: "Corporate Wellness",
    description: "Annual executive health checkups and on-site phlebotomy camps for teams.",
    icon: Building2,
    badge: "Employee Care",
    tags: ["On-Site Camps", "Batch Invoicing", "Private Vault"],
    sla: "Custom Health Tiers"
  },
  {
    tag: "Statutory Health",
    label: "Occupational & Pre-Employment",
    description: "Factory Act compliance, periodic medical exams (PME), and fitness certification.",
    icon: Briefcase,
    badge: "Workplace Safety",
    tags: ["PME Fitness Cert", "Multi-Drug Screen", "Heavy Metals"],
    sla: "Audit-Ready"
  },
  {
    tag: "Developer Tech",
    label: "HealthTech Platforms",
    description: "Modern REST APIs and automated phlebotomist dispatch for telehealth apps.",
    icon: Network,
    badge: "Digital Health",
    tags: ["REST Webhooks", "Live Phlebo ETA", "White-Label PDF"],
    sla: "99.9% API Uptime"
  },
  {
    tag: "Retail Franchise",
    label: "Diagnostic Franchises",
    description: "Turnkey diagnostic collection centers with software, branding, and cold-chain pickup.",
    icon: Store,
    badge: "Retail Growth",
    tags: ["Store Branding", "Cloud LIS Included", "High Margins"],
    sla: "Fast Payback"
  }
];

const whyCards = [
  {
    title: "NABL Standards",
    description: "Daily 3-tier calibration & validated reference controls.",
    icon: ShieldCheck,
    tag: "100% Accredited"
  },
  {
    title: "1,000+ Biomarkers",
    description: "Biochemistry, hormones, cancer markers & molecular.",
    icon: TestTube2,
    tag: "Full Menu"
  },
  {
    title: "Fast 12-24h TAT",
    description: "Automated analyzers ensure rapid digital reporting.",
    icon: Clock,
    tag: "Guaranteed SLA"
  },
  {
    title: "Encrypted Reports",
    description: "Pathologist-verified digital PDFs with tamper-proof QR.",
    icon: FileCheck2,
    tag: "WhatsApp Sync"
  },
  {
    title: "Dedicated Lead",
    description: "Single Key Account Director for direct SLA control.",
    icon: Users,
    tag: "Direct Line"
  },
  {
    title: "Cold-Chain Fleet",
    description: "Barcoded sterile vacutainers with temperature tracking.",
    icon: MapPin,
    tag: "Safe Transport"
  },
  {
    title: "Modern REST API",
    description: "Seamless JSON webhooks connecting to your HIS or app.",
    icon: Network,
    tag: "Plug & Play"
  },
  {
    title: "Pan-India Scale",
    description: "Uniform pricing, quality, and reporting across all hubs.",
    icon: Layers,
    tag: "Multi-City"
  }
];

const partnershipModels = [
  {
    title: "Insurance & TPA Partnerships",
    description: "Pre-policy medical underwriting, cashless diagnostics, and claim audits.",
    icon: ShieldCheck,
    badge: "Underwriting",
    services: [
      "Pre-Policy Medical Checkups",
      "Renewal Health Screening",
      "Cashless Outpatient Network",
      "Claim Audit & Investigation"
    ],
    highlight: "Tamper-evident QR PDF reports"
  },
  {
    title: "Corporate Health & Wellness",
    description: "Annual employee preventive checkups and on-site phlebotomy screening days.",
    icon: Building2,
    badge: "Workforce",
    services: [
      "Annual Executive Panels",
      "On-Site Office Phlebotomy Camps",
      "Confidential Employee Portals",
      "Workforce Health Analytics"
    ],
    highlight: "Zero disruption to workdays"
  },
  {
    title: "Pre-Employment & Occupational",
    description: "Statutory medical fitness certifications, factory PME exams, and drug screens.",
    icon: Briefcase,
    badge: "Compliance",
    services: [
      "Pre-Employment Testing",
      "Periodic Medical Exams (PME)",
      "Multi-Panel Drug Screening",
      "Certified Fitness Forms"
    ],
    highlight: "Statutory labor law compliance"
  },
  {
    title: "HealthTech & Telehealth Integration",
    description: "Embed certified diagnostics directly into your telehealth app or clinic workflow.",
    icon: Network,
    badge: "API & LIS",
    services: [
      "REST API & Status Webhooks",
      "White-Label Co-Branded PDFs",
      "Doorstep Phlebotomist Dispatch",
      "Live ETA & Order Tracking"
    ],
    highlight: "Plug-and-play developer SDK"
  },
  {
    title: "Franchise & Collection Centers",
    description: "Turnkey diagnostic collection centers for healthcare entrepreneurs.",
    icon: Store,
    badge: "Franchise",
    services: [
      "Complete Center Branding",
      "Billing & Cloud LIS Software",
      "Daily Cold-Chain Pickup",
      "Trained Phlebotomist Roster"
    ],
    highlight: "Attractive margins & fast ROI"
  }
];

const timeline = [
  { step: "01", title: "Submit Need", desc: "Share locations & volume requirements.", icon: FileSpreadsheet },
  { step: "02", title: "Review SLA", desc: "Customized rate card & commercials.", icon: Scale },
  { step: "03", title: "Scope Plan", desc: "Logistics & IT mapping alignment.", icon: MapPin },
  { step: "04", title: "Sign Terms", desc: "Clear SLA & partnership agreement.", icon: ShieldCheck },
  { step: "05", title: "Integration", desc: "API testing & staff operational briefing.", icon: Cpu },
  { step: "06", title: "Go Live", desc: "Live operations with dedicated account lead.", icon: Rocket }
];

const industries = [
  { label: "Insurance & TPAs", icon: ShieldCheck },
  { label: "IT & Tech Campuses", icon: Building2 },
  { label: "Manufacturing & Heavy Industry", icon: Factory },
  { label: "Hospitals & Nursing Homes", icon: Stethoscope },
  { label: "Clinics & Polyclinics", icon: HeartHandshake },
  { label: "Banking & Financial Services", icon: Landmark },
  { label: "Educational Institutions", icon: GraduationCap },
  { label: "Retail & Consumer Chains", icon: ShoppingBag },
  { label: "Pharma & Clinical Research", icon: Pill },
  { label: "Infrastructure & Logistics", icon: HardHat },
  { label: "HealthTech Startups", icon: Rocket },
  { label: "Public Sector & Government", icon: Building }
];

const businessCredibility = [
  "NABL Quality Standards & Stringent Calibrations",
  "1,000+ Biomarkers & Clinical Test Menu",
  "Guaranteed 12–24 Hour Report Turnaround",
  "QR-Code Authenticated PDF Digital Reports",
  "Dedicated Key Account Director & Escalation Matrix",
  "Turnkey REST API & Secure HL7 Interfaces",
  "Pan-India Temperature-Monitored Phlebotomy Logistics",
  "Scalable SLA Guarantees for High-Volume Programs"
];

const growthPartnerFaqs = [
  {
    question: "Who can become a Growth Partner with ScopeX?",
    answer:
      "We partner with insurance companies, TPAs, corporate HR teams, hospitals, polyclinics, telemedicine platforms, diagnostic entrepreneurs, and collection center owners seeking reliable, transparent laboratory diagnostics."
  },
  {
    question: "Is there any franchise fee or upfront joining deposit?",
    answer:
      "Commercial terms depend strictly on the partnership model, regional territory, service scope, and expected monthly volume. Our business development team provides complete transparency on commercials after reviewing your initial requirement."
  },
  {
    question: "How long does partner onboarding and launch take?",
    answer:
      "Standard corporate and platform agreements can be operational within 3–7 business days. Collection center franchises and custom API integrations typically take 7–14 days, including staff training and operational dry runs."
  },
  {
    question: "Do you provide dedicated account management?",
    answer:
      "Yes. Every B2B and institutional partner is assigned a dedicated Account Director who oversees day-to-day coordination, sample pickup logistics, reporting SLAs, and priority customer support."
  },
  {
    question: "Can our hospital or clinic outsource specific pathology profiles?",
    answer:
      "Yes. ScopeX supports outpatient lab outsourcing, specialized hormone/molecular testing, and routine overflow sample processing with daily temperature-controlled sample pickups and bidirectional LIS integration."
  },
  {
    question: "Do you offer API and LIS integration for digital platforms?",
    answer:
      "Yes. We offer developer-friendly REST APIs and webhooks for booking tests, dispatching phlebotomists, tracking sample logistics, and receiving encrypted JSON/PDF reports directly into your electronic medical record (EMR)."
  },
  {
    question: "Which Indian cities and regions do you service?",
    answer:
      "ScopeX Diagnostics operates across a rapidly expanding Pan-India network covering major metros, tier 1, and key tier 2 cities. Contact our business team to confirm coverage for your specific operational locations."
  },
  {
    question: "How quickly will your team respond to my business enquiry?",
    answer:
      "Our Business Development Team evaluates all submissions within 2 to 4 business hours and coordinates an introductory call or product demo at your convenience."
  }
];

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
  "Hospital / Clinic",
  "Corporate / Employer",
  "Insurance / TPA",
  "Diagnostic Centre Franchise",
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

  // Clean 4 to 5 Field Hero Quick Enquiry Popup Form
  const [proposalModalOpen, setProposalModalOpen] = useState(false);
  const [heroForm, setHeroForm] = useState({
    fullName: "",
    mobileNumber: "",
    officialEmail: "",
    companyName: "",
    partnerType: "Diagnostic Collection Center / Franchise"
  });
  const [heroStatus, setHeroStatus] = useState<SubmitState>("idle");
  const [heroMessage, setHeroMessage] = useState("");

  function openProposalModal() {
    setProposalModalOpen(true);
    setHeroStatus("idle");
    setHeroMessage("");
  }

  function closeProposalModal() {
    setProposalModalOpen(false);
    setHeroStatus("idle");
    setHeroMessage("");
  }

  function updateHeroField(key: keyof typeof heroForm, value: string) {
    setHeroForm((curr) => ({ ...curr, [key]: value }));
    if (heroStatus !== "idle") {
      setHeroStatus("idle");
      setHeroMessage("");
    }
  }

  async function onHeroEnquirySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setHeroStatus("loading");
    setHeroMessage("");

    const sanitizedMobile = heroForm.mobileNumber.replace(/\D/g, "");

    if (!heroForm.fullName.trim()) {
      setHeroStatus("error");
      setHeroMessage("Please enter your contact name.");
      return;
    }
    if (!mobileRegex.test(sanitizedMobile)) {
      setHeroStatus("error");
      setHeroMessage("Please enter a valid 10-digit Indian mobile number.");
      return;
    }
    if (!emailRegex.test(heroForm.officialEmail.trim())) {
      setHeroStatus("error");
      setHeroMessage("Please enter a valid official business email.");
      return;
    }
    if (!heroForm.companyName.trim()) {
      setHeroStatus("error");
      setHeroMessage("Please enter your company / center name.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("_subject", `Express Partner Lead: ${heroForm.companyName.trim()}`);
      formData.append("_template", "table");
      formData.append("_captcha", "false");
      formData.append("leadSource", "Partner Hero Quick Enquire Popup");
      formData.append("contactPerson", heroForm.fullName.trim());
      formData.append("mobileNumber", sanitizedMobile);
      formData.append("officialEmail", heroForm.officialEmail.trim());
      formData.append("organizationName", heroForm.companyName.trim());
      formData.append("partnershipType", heroForm.partnerType);

      const response = await fetch(formSubmitEndpoint, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: formData
      });

      if (!response.ok) {
        throw new Error("Unable to submit enquiry right now. Please try again.");
      }

      setHeroStatus("success");
      setHeroMessage("Thank you! Our Partnership Director will connect with you within 2 business hours.");
      setHeroForm({
        fullName: "",
        mobileNumber: "",
        officialEmail: "",
        companyName: "",
        partnerType: "Diagnostic Collection Center / Franchise"
      });
      window.setTimeout(() => {
        setProposalModalOpen(false);
        router.push(thankYouPath);
      }, 1500);
    } catch (err) {
      setHeroStatus("error");
      setHeroMessage(err instanceof Error ? err.message : "Submission failed. Please call our direct line.");
    }
  }

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
    <div className="bg-[#FFFFFF] text-[#0D0D0D] min-h-screen">
      {/* 1. HERO SECTION (Option C Design System: Pure White Background, Apple-grade Precision + Clean 5-Field Enquiry Form) */}
      <section className="border-b border-[#EAEAEA] bg-white py-12 sm:py-16 lg:py-20">
        <div className="section-wrap">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-14 items-center">
            {/* Left Column: Hero Content & CTAs */}
            <div>
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 rounded-full border border-[#FFD9C0] bg-[#FFF4E8] px-3.5 py-1 text-xs font-bold text-[#FF6B00]">
                <Sparkles className="h-3.5 w-3.5 text-[#FF6B00]" />
                <span>Pan India Diagnostic Partner Network • Enterprise Pathology</span>
              </div>

              {/* Main Headline */}
              <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-black text-[#0D0D0D] tracking-tight leading-[1.08]">
                Partner with India&apos;s Modern Diagnostics Network.
              </h1>

              {/* Highlighted Tagline */}
              <p className="mt-3 text-base sm:text-xl font-extrabold text-[#FF6B00]">
                Scalable B2B Pathology. Real SLAs. Unified Tech.
              </p>

              {/* Description */}
              <p className="mt-3 text-xs sm:text-sm lg:text-base leading-relaxed text-[#626262] max-w-xl">
                Modular pathology infrastructure for hospitals, corporate wellness, insurance TPAs, diagnostic franchises, and healthtech platforms.
              </p>

              {/* Digitized Trust Badges Bar */}
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {heroTrustBadges.map((badge) => {
                  const IconComponent = badge.icon;
                  return (
                    <div
                      key={badge.label}
                      className="rounded-2xl border border-[#EAEAEA] bg-[#F7F7F7] p-3 text-left transition hover:border-[#FF6B00]/60 hover:bg-white"
                    >
                      <div className="flex items-center gap-1.5 text-[#FF6B00]">
                        <IconComponent className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#0D0D0D] truncate">
                          {badge.label}
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-black text-[#FF6B00]">
                        {badge.stat}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Dual Action CTAs */}
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={openProposalModal}
                  className="cta-btn cursor-pointer inline-flex items-center gap-2 shadow-[0_10px_25px_rgba(255,107,0,0.35)]"
                  aria-label="Apply Now for Partnership with ScopeX Diagnostics"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Apply Now</span>
                </button>
                <button
                  type="button"
                  onClick={openMeetingModal}
                  className="inline-flex min-h-[46px] items-center justify-center rounded-[14px] border border-[#0D0D0D] bg-white px-5 py-3 text-xs font-extrabold uppercase tracking-[0.12em] text-[#0D0D0D] transition hover:bg-[#F7F7F7] cursor-pointer"
                  aria-label="Schedule a business meeting with ScopeX Diagnostics"
                >
                  <Calendar className="mr-2 h-4 w-4 text-[#FF6B00]" />
                  Schedule Meeting
                </button>
                <button
                  type="button"
                  onClick={scrollToForm}
                  className="inline-flex min-h-[46px] items-center justify-center rounded-[14px] border border-[#EAEAEA] bg-white px-4 py-3 text-xs font-bold text-[#626262] hover:text-[#0D0D0D] hover:border-[#0D0D0D] transition cursor-pointer"
                  aria-label="Explore partnership models"
                >
                  Explore Models
                </button>
                <Link
                  href="tel:+918989273440"
                  className="inline-flex min-h-[46px] items-center justify-center rounded-[14px] border border-[#EAEAEA] bg-white px-4 py-3 text-xs font-bold text-[#626262] hover:text-[#0D0D0D] hover:border-[#0D0D0D] transition"
                >
                  <Phone className="mr-1.5 h-3.5 w-3.5 text-[#FF6B00]" />
                  <span>+91 89892 73440</span>
                </Link>
              </div>
            </div>

            {/* Right Column: Premium Diagnostic Healthcare Partnership Handshake Showcase */}
            <div className="w-full relative">
              <div className="relative overflow-hidden rounded-3xl border border-[#EAEAEA] bg-white shadow-[0_25px_60px_rgba(13,13,13,0.12)] group">
                {/* Real High-Resolution Healthcare Partnership Handshake Picture */}
                <div className="relative aspect-[4/3] sm:aspect-[16/11] w-full overflow-hidden bg-stone-100">
                  <Image
                    src="/images/partner-handshake.jpg"
                    alt="ScopeX Healthcare Diagnostics Partnership Agreement Handshake"
                    fill
                    className="object-cover object-center transition duration-700 group-hover:scale-105"
                    priority
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                    referrerPolicy="no-referrer"
                  />
                  {/* Floating Pill: Verified B2B Diagnostic Partner Network */}
                  <div className="absolute top-4 left-4 z-10">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/90 backdrop-blur-md px-3.5 py-1.5 text-xs font-bold text-[#0D0D0D] shadow-md">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                      <span>Verified Diagnostic Partner Network</span>
                    </div>
                  </div>

                  {/* Floating Stat Chip Top-Right */}
                  <div className="absolute top-4 right-4 z-10 hidden sm:block">
                    <div className="rounded-xl border border-white/40 bg-white/95 backdrop-blur-md px-3 py-1.5 text-[11px] font-black text-[#0D0D0D] shadow-md">
                      <span className="text-[#FF6B00]">★</span> Direct SLA Contract
                    </div>
                  </div>

                  {/* Floating Action Button Bottom-Right */}
                  <div className="absolute bottom-4 right-4 z-10">
                    <button
                      type="button"
                      onClick={openProposalModal}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-white/40 bg-[#0D0D0D]/90 backdrop-blur-md px-3.5 py-2 text-xs font-bold text-white hover:bg-[#FF6B00] transition shadow-lg cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-[#FF6B00]" />
                      <span>Apply Now</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Bottom Trust Row Under Image */}
                <div className="grid grid-cols-3 divide-x divide-[#EAEAEA] bg-[#FAFAFA] p-3 text-center text-xs">
                  <div>
                    <p className="text-[10px] font-semibold text-[#8A8A8A] uppercase">Sample Barcoding</p>
                    <p className="font-bold text-[#0D0D0D]">100% Traceable</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-[#8A8A8A] uppercase">Cold-Chain Fleet</p>
                    <p className="font-bold text-[#0D0D0D]">Active Monitoring</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-[#8A8A8A] uppercase">API &amp; LIS Hook</p>
                    <p className="font-bold text-[#FF6B00]">Real-Time Sync</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE SCOPEX ENTERPRISE ECOSYSTEM (Apple/Fintech Clean 6-Vertical Interactive Grid) */}
      <section className="py-16 sm:py-20 border-b border-[#EAEAEA] bg-[#F7F7F7]">
        <div className="section-wrap">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#FF6B00]">
                Ecosystem
              </span>
              <h2 className="mt-2 text-2xl sm:text-4xl font-black text-[#0D0D0D] tracking-tight">
                Enterprise Verticals We Power
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#626262] max-w-md">
              From hospital lab outsourcing to high-velocity insurance underwriting, ScopeX provides modular diagnostic infrastructure.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {ecosystemCards.map((card) => {
              const CardIcon = card.icon;
              return (
                <div
                  key={card.label}
                  className="group rounded-2xl border border-[#EAEAEA] bg-white p-6 shadow-xs transition duration-200 hover:-translate-y-1 hover:border-[#FF6B00]/70 hover:shadow-md flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF4E8] text-[#FF6B00]">
                        <CardIcon className="h-5 w-5" />
                      </div>
                      <span className="rounded-lg bg-[#F7F7F7] border border-[#EAEAEA] px-2.5 py-1 text-[11px] font-bold text-[#626262]">
                        {card.badge}
                      </span>
                    </div>
                    <span className="mt-4 block text-[11px] font-bold uppercase tracking-wider text-[#FF6B00]">
                      {card.tag}
                    </span>
                    <h3 className="mt-1 text-lg sm:text-xl font-bold text-[#0D0D0D] group-hover:text-[#FF6B00] transition-colors">
                      {card.label}
                    </h3>
                    <p className="mt-2 text-xs text-[#626262] leading-relaxed">
                      {card.description}
                    </p>

                    {/* Digitized Feature Tags */}
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {card.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 rounded-md bg-[#F7F7F7] border border-[#EAEAEA] px-2 py-0.5 text-[10px] font-bold text-[#4A4A4A]"
                        >
                          <CheckCircle2 className="h-2.5 w-2.5 text-[#FF6B00]" />
                          <span>{tag}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-[#EAEAEA] flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#FF6B00]">
                      {card.sla}
                    </span>
                    <button
                      type="button"
                      onClick={scrollToForm}
                      className="inline-flex items-center text-xs font-bold text-[#0D0D0D] group-hover:text-[#FF6B00] transition-colors cursor-pointer"
                    >
                      <span>Partner Now</span>
                      <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. WHY ORGANIZATIONS CHOOSE SCOPEX (8 Clean Fintech Feature Cards) */}
      <section className="py-16 sm:py-20 border-b border-[#EAEAEA] bg-white">
        <div className="section-wrap">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#FF6B00]">
              Operational Excellence
            </span>
            <h2 className="mt-2 text-2xl sm:text-4xl font-black text-[#0D0D0D] tracking-tight">
              Why Leading Organizations Choose ScopeX
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-[#626262]">
              Clinical rigor, temperature-controlled cold chains, transparent commercials, and real-time electronic reporting.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {whyCards.map((card) => {
              const CardIcon = card.icon;
              return (
                <div
                  key={card.title}
                  className="rounded-2xl border border-[#EAEAEA] bg-[#F7F7F7] p-5 transition duration-200 hover:bg-white hover:border-[#FF6B00]/60 hover:shadow-md flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-[#EAEAEA] text-[#FF6B00] shadow-2xs">
                        <CardIcon className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] font-bold text-[#FF6B00] bg-[#FFF4E8] px-2 py-0.5 rounded-md border border-[#FFD9C0]">
                        {card.tag}
                      </span>
                    </div>
                    <h3 className="mt-3.5 text-sm sm:text-base font-bold text-[#0D0D0D]">
                      {card.title}
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#626262]">
                      {card.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. PARTNERSHIP MODELS IN DETAIL */}
      <section id="partnership-models" className="py-16 sm:py-20 border-b border-[#EAEAEA] bg-[#F7F7F7]">
        <div className="section-wrap">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#FF6B00]">
              Structured Engagements
            </span>
            <h2 className="mt-2 text-2xl sm:text-4xl font-black text-[#0D0D0D] tracking-tight">
              Our Growth Partnership Models
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-[#626262]">
              Select a specialized engagement tailored to your organization&apos;s healthcare roadmap and operational volume.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {partnershipModels.map((model, idx) => {
              const ModelIcon = model.icon;
              return (
                <article
                  key={model.title}
                  className={`rounded-2xl border border-[#EAEAEA] bg-white p-6 sm:p-7 shadow-xs flex flex-col justify-between ${
                    idx === 4 ? "lg:col-span-2" : ""
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF4E8] text-[#FF6B00]">
                          <ModelIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF6B00]">
                            {model.badge}
                          </span>
                          <h3 className="text-lg sm:text-xl font-bold text-[#0D0D0D]">
                            {model.title}
                          </h3>
                        </div>
                      </div>
                      <span className="hidden sm:inline-flex rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 shrink-0">
                        {model.highlight}
                      </span>
                    </div>

                    <p className="mt-2.5 text-xs text-[#626262] leading-relaxed">
                      {model.description}
                    </p>

                    <div className="mt-4 border-t border-[#EAEAEA] pt-3.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8A8A] block mb-2">
                        Key Inclusions &amp; Deliverables
                      </span>
                      <div className="grid gap-2 sm:grid-cols-2 text-xs text-[#0D0D0D]">
                        {model.services.map((service) => (
                          <div
                            key={service}
                            className="flex items-center gap-2 rounded-lg bg-[#F7F7F7] border border-[#EAEAEA] px-2.5 py-1.5"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-[#FF6B00] shrink-0" />
                            <span className="text-[11px] font-semibold text-[#0D0D0D] truncate">{service}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-3.5 border-t border-[#EAEAEA] flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#626262]">
                      Custom Commercial SLAs
                    </span>
                    <button
                      type="button"
                      onClick={scrollToForm}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#0D0D0D] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#FF6B00] cursor-pointer"
                    >
                      <span>Inquire Now</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. 6-STEP IMPLEMENTATION ROADMAP (Clean Horizontal/Vertical Timeline) */}
      <section className="py-16 sm:py-20 border-b border-[#EAEAEA] bg-white">
        <div className="section-wrap">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#FF6B00]">
              Operational Roadmap
            </span>
            <h2 className="mt-2 text-2xl sm:text-4xl font-black text-[#0D0D0D] tracking-tight">
              From Inquiry to Launch with Predictable SLAs
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-[#626262]">
              Our streamlined onboarding program gets your enterprise pathology operations running in days, not months.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            {timeline.map((item, idx) => {
              const StepIcon = item.icon;
              return (
                <div
                  key={item.step}
                  className="relative rounded-2xl border border-[#EAEAEA] bg-[#F7F7F7] p-4 sm:p-5 flex flex-col justify-between hover:bg-white hover:border-[#FF6B00]/60 hover:shadow-xs transition"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-[#EAEAEA] text-[#FF6B00] shadow-2xs">
                        <StepIcon className="h-4 w-4" />
                      </div>
                      <span className="text-[11px] font-black text-[#8A8A8A] font-mono">
                        {item.step}
                      </span>
                    </div>
                    <h3 className="mt-3.5 text-sm font-bold text-[#0D0D0D]">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-xs text-[#626262] leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                  {idx < timeline.length - 1 ? (
                    <div className="mt-3 flex justify-center lg:hidden">
                      <ArrowDown className="h-3.5 w-3.5 text-[#FF6B00]" />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. INDUSTRIES WE SERVE */}
      <section className="py-16 sm:py-20 border-b border-[#EAEAEA] bg-[#F7F7F7]">
        <div className="section-wrap">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#FF6B00]">
                Sectors
              </span>
              <h2 className="mt-2 text-2xl sm:text-4xl font-black text-[#0D0D0D] tracking-tight">
                Industries We Serve
              </h2>
            </div>
            <button
              type="button"
              onClick={scrollToForm}
              className="inline-flex items-center text-xs font-bold text-[#FF6B00] hover:underline cursor-pointer"
            >
              Discuss your sector requirements &rarr;
            </button>
          </div>

          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {industries.map((ind) => {
              const IndIcon = ind.icon;
              return (
                <div
                  key={ind.label}
                  className="flex items-center gap-3 rounded-xl border border-[#EAEAEA] bg-white p-3.5 shadow-2xs hover:border-[#FF6B00]/60 transition"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FFF4E8] text-[#FF6B00]">
                    <IndIcon className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-[#0D0D0D] truncate">
                    {ind.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. SIGNATURE CARBON BLACK ENTERPRISE CREDIBILITY & SLA COMMITMENTS (Requested Dark Aesthetic) */}
      <section className="py-16 sm:py-24 border-b border-stone-800 bg-[#0D0D0D] text-white relative overflow-hidden">
        {/* Glowing orange ambient backdrop */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 h-[420px] w-[420px] rounded-full bg-[#FF6B00]/22 blur-[110px] pointer-events-none" />

        <div className="section-wrap relative z-10">
          <div className="grid gap-10 lg:grid-cols-2 items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-stone-700 bg-stone-900/90 px-3.5 py-1 text-xs font-bold text-[#FF6B00]">
                <ShieldCheck className="h-3.5 w-3.5 text-[#FF6B00]" />
                <span>Enterprise SLA Guarantee · NABL Standards</span>
              </span>
              <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                Enterprise Standards You Can Stake Your Brand On.
              </h2>
              <p className="mt-4 text-xs sm:text-sm text-stone-300 leading-relaxed max-w-xl">
                Whether deploying 50 employee medical checkups or 50,000 pan-India insurance underwriting visits, ScopeX Diagnostics delivers unified tracking, digital cold chains, and verified pathologist signatures.
              </p>

              <div className="mt-8 grid gap-3 text-xs font-semibold text-stone-200 sm:grid-cols-2">
                {businessCredibility.map((item) => (
                  <div key={item} className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-[#FF6B00] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={openMeetingModal}
                  className="cta-btn cursor-pointer shadow-[0_8px_24px_rgba(255,107,0,0.35)]"
                >
                  Schedule Strategy Briefing
                </button>
                <button
                  type="button"
                  onClick={scrollToForm}
                  className="rounded-xl border border-stone-700 bg-stone-900/90 px-6 py-3 text-xs font-bold text-white hover:border-[#FF6B00] hover:bg-stone-800 transition"
                >
                  Request Rate Card
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-stone-800 bg-stone-900/80 p-8 sm:p-10 shadow-2xl backdrop-blur-sm">
              <div className="space-y-6">
                <div>
                  <span className="text-4xl sm:text-5xl font-black text-[#FF6B00] tabular-nums">
                    99.8%
                  </span>
                  <p className="mt-1 text-sm font-bold text-white">On-Time SLA Delivery</p>
                  <p className="text-xs text-stone-400">Phlebotomy visit punctuality and report dispatch rate.</p>
                </div>
                <div className="border-t border-stone-800 pt-6">
                  <span className="text-4xl sm:text-5xl font-black text-white tabular-nums">
                    100%
                  </span>
                  <p className="mt-1 text-sm font-bold text-white">Barcoded Cold-Chain Integrity</p>
                  <p className="text-xs text-stone-400">Every specimen trackable with tamper-evident seal numbers.</p>
                </div>
                <div className="border-t border-stone-800 pt-6">
                  <span className="text-4xl sm:text-5xl font-black text-[#FF6B00] tabular-nums">
                    1,000+
                  </span>
                  <p className="mt-1 text-sm font-bold text-white">Verified Pathology Menus</p>
                  <p className="text-xs text-stone-400">Routine biochemistry, wellness profiles, and advanced genetics.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FREQUENTLY ASKED QUESTIONS */}
      <section className="py-16 sm:py-20 border-b border-[#EAEAEA] bg-[#F7F7F7]">
        <div className="section-wrap">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#FF6B00]">
              Clarity &amp; Answers
            </span>
            <h2 className="mt-2 text-2xl sm:text-4xl font-black text-[#0D0D0D] tracking-tight">
              B2B Partnership FAQs
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-[#626262]">
              Quick answers for organizations evaluating ScopeX Diagnostics as a business or clinical partner.
            </p>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-2">
            {growthPartnerFaqs.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-2xl border border-[#EAEAEA] bg-white p-5 shadow-2xs transition"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold text-[#0D0D0D]">
                  <span>{faq.question}</span>
                  <ChevronDown className="h-4 w-4 text-[#FF6B00] transition-transform duration-200 group-open:rotate-180 shrink-0" />
                </summary>
                <p className="mt-3 text-xs sm:text-sm leading-relaxed text-[#626262] border-t border-[#EAEAEA] pt-3">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 9. HIGH-CONVERTING B2B LEAD INQUIRY FORM */}
      <section id="growth-partner-form" className="py-16 sm:py-24 bg-white">
        <div className="section-wrap">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] items-start">
            {/* Left Column: Form introduction & Direct contact */}
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#FF6B00]">
                Start A Conversation
              </span>
              <h2 className="mt-2 text-3xl sm:text-4xl font-black text-[#0D0D0D] tracking-tight">
                Become a ScopeX Growth Partner
              </h2>
              <p className="mt-4 text-xs sm:text-sm leading-relaxed text-[#626262]">
                Share your organization&apos;s requirements, projected monthly volume, and locations. A dedicated business development lead will review your application and respond within 2–4 business hours.
              </p>

              {/* Contact Card */}
              <div className="mt-8 rounded-2xl border border-[#EAEAEA] bg-[#F7F7F7] p-6 space-y-4">
                <p className="text-xs font-bold uppercase tracking-wider text-[#0D0D0D]">
                  Direct Corporate Desk
                </p>
                <div className="flex items-center gap-3 text-xs text-[#0D0D0D] font-medium">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-[#EAEAEA] text-[#FF6B00]">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-[#626262] uppercase tracking-wider">Business Phone</p>
                    <a href="tel:+918989273440" className="hover:text-[#FF6B00] font-bold">
                      +91 89892 73440
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-[#0D0D0D] font-medium">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-[#EAEAEA] text-[#FF6B00]">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-[#626262] uppercase tracking-wider">Corporate Inquiries</p>
                    <a href="mailto:scopex.lab@gmail.com" className="hover:text-[#FF6B00] font-bold">
                      scopex.lab@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-[#0D0D0D] font-medium">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-[#EAEAEA] text-[#FF6B00]">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-[#626262] uppercase tracking-wider">Response Window</p>
                    <p className="font-bold">Monday – Saturday, 8:00 AM – 8:00 PM</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Sleek Enterprise Form */}
            <div className="rounded-3xl border border-[#EAEAEA] bg-white p-6 sm:p-10 shadow-[0_16px_40px_rgba(13,13,13,0.06)]">
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0D0D0D] mb-1.5">
                      Company Name *
                    </label>
                    <input
                      required
                      value={form.companyName}
                      onChange={(e) => updateField("companyName", e.target.value)}
                      placeholder="e.g. Acme Health Corp"
                      className="w-full rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#0D0D0D] placeholder-[#8A8A8A] focus:border-[#FF6B00] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0D0D0D] mb-1.5">
                      Contact Person *
                    </label>
                    <input
                      required
                      value={form.contactPerson}
                      onChange={(e) => updateField("contactPerson", e.target.value)}
                      placeholder="e.g. Dr. Rajesh Sharma"
                      className="w-full rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#0D0D0D] placeholder-[#8A8A8A] focus:border-[#FF6B00] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0D0D0D] mb-1.5">
                      Designation *
                    </label>
                    <input
                      required
                      value={form.designation}
                      onChange={(e) => updateField("designation", e.target.value)}
                      placeholder="e.g. Head of HR / Medical Director"
                      className="w-full rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#0D0D0D] placeholder-[#8A8A8A] focus:border-[#FF6B00] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0D0D0D] mb-1.5">
                      Mobile Number *
                    </label>
                    <input
                      required
                      type="tel"
                      value={form.mobileNumber}
                      onChange={(e) => updateField("mobileNumber", e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      className="w-full rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#0D0D0D] placeholder-[#8A8A8A] focus:border-[#FF6B00] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0D0D0D] mb-1.5">
                      Official Email *
                    </label>
                    <input
                      required
                      type="email"
                      value={form.officialEmail}
                      onChange={(e) => updateField("officialEmail", e.target.value)}
                      placeholder="name@company.com"
                      className="w-full rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#0D0D0D] placeholder-[#8A8A8A] focus:border-[#FF6B00] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0D0D0D] mb-1.5">
                      Company Website (Optional)
                    </label>
                    <input
                      value={form.companyWebsite}
                      onChange={(e) => updateField("companyWebsite", e.target.value)}
                      placeholder="https://company.com"
                      className="w-full rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#0D0D0D] placeholder-[#8A8A8A] focus:border-[#FF6B00] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0D0D0D] mb-1.5">
                      City *
                    </label>
                    <input
                      required
                      value={form.city}
                      onChange={(e) => updateField("city", e.target.value)}
                      placeholder="e.g. Mumbai / Bangalore / Delhi"
                      className="w-full rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#0D0D0D] placeholder-[#8A8A8A] focus:border-[#FF6B00] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0D0D0D] mb-1.5">
                      State *
                    </label>
                    <input
                      required
                      value={form.state}
                      onChange={(e) => updateField("state", e.target.value)}
                      placeholder="e.g. Maharashtra"
                      className="w-full rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#0D0D0D] placeholder-[#8A8A8A] focus:border-[#FF6B00] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0D0D0D] mb-1.5">
                      Business Category *
                    </label>
                    <select
                      required
                      value={form.businessType}
                      onChange={(e) => updateField("businessType", e.target.value as GrowthPartnerBusinessType)}
                      className="w-full rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#0D0D0D] focus:border-[#FF6B00] focus:bg-white focus:outline-none"
                    >
                      <option value="">Select Partnership Model</option>
                      {growthPartnerBusinessTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0D0D0D] mb-1.5">
                      Expected Monthly Volume *
                    </label>
                    <input
                      required
                      value={form.expectedMonthlyVolume}
                      onChange={(e) => updateField("expectedMonthlyVolume", e.target.value)}
                      placeholder="e.g. 50–200 tests/month"
                      className="w-full rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#0D0D0D] placeholder-[#8A8A8A] focus:border-[#FF6B00] focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0D0D0D] mb-1.5">
                    Partnership Scope &amp; Requirements *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={form.message}
                    onChange={(e) => updateField("message", e.target.value)}
                    placeholder="Tell us about your organization, key test requirements, desired turnaround time, and preferred launch timeline..."
                    className="w-full rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#0D0D0D] placeholder-[#8A8A8A] focus:border-[#FF6B00] focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] p-3.5">
                  <label className="flex items-start gap-2.5 text-xs text-[#626262] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.consent}
                      onChange={(e) => updateField("consent", e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded accent-[#FF6B00]"
                    />
                    <span>
                      I authorize ScopeX Diagnostics to contact me via email, phone, or WhatsApp regarding business partnership proposals and diagnostic service agreements.
                    </span>
                  </label>
                </div>

                {message ? (
                  <div
                    className={`rounded-xl px-4 py-3 text-xs font-semibold ${
                      status === "success"
                        ? "bg-[#FFF4E8] text-[#FF6B00] border border-[#FFD9C0]"
                        : "bg-red-50 text-red-600 border border-red-200"
                    }`}
                  >
                    {message}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="cta-btn w-full disabled:opacity-60 cursor-pointer"
                >
                  {status === "loading" ? "Submitting Inquiry..." : "Submit Business Enquiry"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* 10. SCHEDULE BUSINESS MEETING MODAL (Apple-Grade Dialog) */}
      {meetingOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="meeting-modal-title"
        >
          <div className="max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#EAEAEA] bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#EAEAEA] bg-white px-6 py-4.5">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF6B00]">
                  Direct Executive Consultation
                </span>
                <h3 id="meeting-modal-title" className="text-xl font-bold text-[#0D0D0D]">
                  Schedule a Business Meeting
                </h3>
              </div>
              <button
                type="button"
                onClick={closeMeetingModal}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#EAEAEA] text-[#0D0D0D] hover:bg-[#F7F7F7] cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {meetingStatus === "success" ? (
              <div className="p-8 text-center space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF4E8] text-[#FF6B00]">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h4 className="text-xl font-bold text-[#0D0D0D]">Meeting Request Submitted</h4>
                <p className="text-xs sm:text-sm text-[#626262] max-w-md mx-auto">
                  {meetingMessage}
                </p>
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={closeMeetingModal}
                    className="cta-btn w-full sm:w-auto"
                  >
                    Done
                  </button>
                  <button
                    type="button"
                    onClick={scheduleAnotherMeeting}
                    className="rounded-xl border border-[#EAEAEA] px-5 py-2.5 text-xs font-bold text-[#0D0D0D] hover:bg-[#F7F7F7]"
                  >
                    Schedule Another
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={onMeetingSubmit} className="p-6 sm:p-8 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0D0D0D] mb-1">
                      Full Name *
                    </label>
                    <input
                      required
                      value={meetingForm.fullName}
                      onChange={(e) => updateMeetingField("fullName", e.target.value)}
                      placeholder="e.g. Rahul Verma"
                      className="w-full rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#0D0D0D] focus:border-[#FF6B00] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0D0D0D] mb-1">
                      Organization Name *
                    </label>
                    <input
                      required
                      value={meetingForm.companyOrganization}
                      onChange={(e) => updateMeetingField("companyOrganization", e.target.value)}
                      placeholder="e.g. Care Plus Clinics"
                      className="w-full rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#0D0D0D] focus:border-[#FF6B00] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0D0D0D] mb-1">
                      Designation
                    </label>
                    <input
                      value={meetingForm.designation}
                      onChange={(e) => updateMeetingField("designation", e.target.value)}
                      placeholder="e.g. COO / Head of Ops"
                      className="w-full rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#0D0D0D] focus:border-[#FF6B00] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0D0D0D] mb-1">
                      Business Email *
                    </label>
                    <input
                      required
                      type="email"
                      value={meetingForm.businessEmail}
                      onChange={(e) => updateMeetingField("businessEmail", e.target.value)}
                      placeholder="r.verma@careplus.com"
                      className="w-full rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#0D0D0D] focus:border-[#FF6B00] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0D0D0D] mb-1">
                      Mobile Number *
                    </label>
                    <input
                      required
                      type="tel"
                      value={meetingForm.mobileNumber}
                      onChange={(e) => updateMeetingField("mobileNumber", e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="10-digit mobile"
                      maxLength={10}
                      className="w-full rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#0D0D0D] focus:border-[#FF6B00] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0D0D0D] mb-1">
                      Operational City *
                    </label>
                    <input
                      required
                      value={meetingForm.city}
                      onChange={(e) => updateMeetingField("city", e.target.value)}
                      placeholder="e.g. Bengaluru"
                      className="w-full rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#0D0D0D] focus:border-[#FF6B00] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0D0D0D] mb-1">
                      Business Category *
                    </label>
                    <select
                      required
                      value={meetingForm.businessCategory}
                      onChange={(e) => updateMeetingField("businessCategory", e.target.value as MeetingBusinessCategory)}
                      className="w-full rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#0D0D0D] focus:border-[#FF6B00] focus:bg-white focus:outline-none"
                    >
                      <option value="">Select Category</option>
                      {meetingBusinessCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0D0D0D] mb-1">
                      Preferred Date *
                    </label>
                    <input
                      required
                      type="date"
                      min={todayInputDate}
                      value={meetingForm.preferredMeetingDate}
                      onChange={(e) => updateMeetingField("preferredMeetingDate", e.target.value)}
                      className="w-full rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#0D0D0D] focus:border-[#FF6B00] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0D0D0D] mb-1">
                      Preferred Time Slot *
                    </label>
                    <input
                      required
                      type="time"
                      value={meetingForm.preferredMeetingTime}
                      onChange={(e) => updateMeetingField("preferredMeetingTime", e.target.value)}
                      className="w-full rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#0D0D0D] focus:border-[#FF6B00] focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0D0D0D] mb-1">
                    Agenda / Specific Questions
                  </label>
                  <textarea
                    rows={3}
                    value={meetingForm.additionalRequirements}
                    onChange={(e) => updateMeetingField("additionalRequirements", e.target.value)}
                    placeholder="Briefly state what you'd like to discuss (e.g., corporate camp pricing, LIS API documentation, collection center franchise)..."
                    className="w-full rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#0D0D0D] focus:border-[#FF6B00] focus:bg-white focus:outline-none"
                  />
                </div>

                {meetingMessage ? (
                  <p className="rounded-xl bg-red-50 px-4 py-2.5 text-xs text-red-600 border border-red-200">
                    {meetingMessage}
                  </p>
                ) : null}

                <div className="pt-2 flex flex-col sm:flex-row justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeMeetingModal}
                    className="rounded-xl border border-[#EAEAEA] px-5 py-2.5 text-xs font-bold text-[#626262] hover:text-[#0D0D0D]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!isMeetingFormComplete || meetingStatus === "loading"}
                    className="cta-btn disabled:opacity-50 cursor-pointer"
                  >
                    {meetingStatus === "loading" ? "Scheduling..." : "Confirm Meeting Request"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}

      {/* Quick Partner Proposal / Apply Now Popup Modal */}
      {proposalModalOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="proposal-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D0D0D]/75 backdrop-blur-sm overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeProposalModal();
          }}
        >
          <div className="relative w-full max-w-lg rounded-3xl border border-[#EAEAEA] bg-white p-6 sm:p-8 shadow-2xl my-8">
            {/* Close Button */}
            <button
              type="button"
              onClick={closeProposalModal}
              aria-label="Close modal"
              className="absolute right-4 top-4 rounded-full p-2 text-[#626262] hover:bg-[#F7F7F7] hover:text-[#0D0D0D] transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Top Subtle Amber Indicator */}
            <div className="flex items-center justify-between mb-2 pr-8">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[#FFD9C0] bg-[#FFF4E8] px-3 py-0.5 text-[11px] font-bold text-[#FF6B00]">
                <Zap className="h-3 w-3 text-[#FF6B00]" />
                <span>Quick Partner Proposal</span>
              </div>
              <span className="text-[11px] font-semibold text-[#8A8A8A]">
                2h Response SLA
              </span>
            </div>

            <h3 id="proposal-modal-title" className="text-xl sm:text-2xl font-black text-[#0D0D0D] tracking-tight">
              Get Partnership Proposal
            </h3>
            <p className="mt-1 text-xs text-[#626262]">
              Fill 5 basic fields to receive customized pricing &amp; operational details.
            </p>

            {heroMessage ? (
              <div
                className={`mt-4 rounded-xl p-3 text-xs font-semibold ${
                  heroStatus === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {heroMessage}
              </div>
            ) : null}

            {heroStatus === "success" ? (
              <div className="mt-6 text-center py-6 space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h4 className="text-xl font-bold text-[#0D0D0D]">Proposal Request Submitted</h4>
                <p className="text-xs sm:text-sm text-[#626262] max-w-sm mx-auto">
                  Thank you! Our Partnership Director will connect with you within 2 business hours with full pricing and SLA models.
                </p>
                <button
                  type="button"
                  onClick={closeProposalModal}
                  className="cta-btn cursor-pointer text-xs"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <form onSubmit={onHeroEnquirySubmit} className="mt-4 space-y-3.5">
                {/* Field 1: Contact Person Name */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0D0D0D] mb-1">
                    Contact Name <span className="text-[#FF6B00]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={heroForm.fullName}
                    onChange={(e) => updateHeroField("fullName", e.target.value)}
                    placeholder="e.g. Dr. Rajesh Sharma"
                    className="w-full rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-3.5 py-2.5 text-xs font-semibold text-[#0D0D0D] placeholder-[#8A8A8A] focus:border-[#FF6B00] focus:bg-white focus:outline-none transition"
                  />
                </div>

                {/* Field 2: Mobile Number */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0D0D0D] mb-1">
                    Mobile Number <span className="text-[#FF6B00]">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-xs font-bold text-[#626262]">+91</span>
                    <input
                      type="tel"
                      required
                      inputMode="numeric"
                      maxLength={10}
                      value={heroForm.mobileNumber}
                      onChange={(e) => updateHeroField("mobileNumber", e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="98765 43210"
                      className="w-full rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] pl-11 pr-3.5 py-2.5 text-xs font-semibold text-[#0D0D0D] placeholder-[#8A8A8A] focus:border-[#FF6B00] focus:bg-white focus:outline-none transition"
                    />
                  </div>
                </div>

                {/* Field 3: Official Email */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0D0D0D] mb-1">
                    Official Email <span className="text-[#FF6B00]">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={heroForm.officialEmail}
                    onChange={(e) => updateHeroField("officialEmail", e.target.value)}
                    placeholder="rajesh@hospital.com"
                    className="w-full rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-3.5 py-2.5 text-xs font-semibold text-[#0D0D0D] placeholder-[#8A8A8A] focus:border-[#FF6B00] focus:bg-white focus:outline-none transition"
                  />
                </div>

                {/* Field 4: Organization / Center Name */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0D0D0D] mb-1">
                    Organization / Center Name <span className="text-[#FF6B00]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={heroForm.companyName}
                    onChange={(e) => updateHeroField("companyName", e.target.value)}
                    placeholder="e.g. Metro Care Hospital / Health Clinic"
                    className="w-full rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-3.5 py-2.5 text-xs font-semibold text-[#0D0D0D] placeholder-[#8A8A8A] focus:border-[#FF6B00] focus:bg-white focus:outline-none transition"
                  />
                </div>

                {/* Field 5: Partnership Type */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0D0D0D] mb-1">
                    Partnership Category <span className="text-[#FF6B00]">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={heroForm.partnerType}
                      onChange={(e) => updateHeroField("partnerType", e.target.value)}
                      className="w-full appearance-none rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-3.5 py-2.5 text-xs font-semibold text-[#0D0D0D] focus:border-[#FF6B00] focus:bg-white focus:outline-none transition pr-8 cursor-pointer"
                    >
                      <option value="Diagnostic Collection Center / Franchise">Diagnostic Collection Center / Franchise</option>
                      <option value="Hospital & Nursing Home Lab Outsourcing">Hospital &amp; Nursing Home Lab Outsourcing</option>
                      <option value="Corporate Health & Wellness Program">Corporate Health &amp; Wellness Program</option>
                      <option value="Insurance & TPA Diagnostics">Insurance &amp; TPA Diagnostics</option>
                      <option value="HealthTech Platform / API Integration">HealthTech Platform / API Integration</option>
                      <option value="Clinics & Polyclinics Network">Clinics &amp; Polyclinics Network</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#626262] pointer-events-none" />
                  </div>
                </div>

                {/* Submit CTA */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={heroStatus === "loading"}
                    className="cta-btn w-full justify-center py-3 text-xs font-bold uppercase tracking-wider cursor-pointer shadow-[0_8px_24px_rgba(255,107,0,0.35)]"
                  >
                    {heroStatus === "loading" ? "Submitting Proposal..." : "Request Partner Proposal →"}
                  </button>
                </div>

                {/* Trust Footer */}
                <div className="mt-3 flex items-center justify-between text-[11px] text-[#8A8A8A] border-t border-[#EAEAEA] pt-3">
                  <span className="flex items-center gap-1 text-emerald-700 font-medium">
                    <CheckCircle2 className="h-3 w-3 shrink-0" />
                    <span>100% Confidential</span>
                  </span>
                  <span>Direct Key Account Director Review</span>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
