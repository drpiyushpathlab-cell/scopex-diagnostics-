import Link from "next/link";

export default function PatientGoogleCallbackPage() {
  return (
    <section className="section-wrap py-14">
      <div className="rounded-[28px] border border-[#f1dfce] bg-white p-6 shadow-[0_16px_36px_rgba(16,24,40,0.06)]">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#F7931E]">Patient Login</p>
        <h1 className="mt-2 text-3xl font-black text-[#0D0D0D] md:text-4xl">Use mobile OTP to continue</h1>
        <p className="mt-4 text-[#5f6868]">
          Google login is disabled while ScopeX uses the Supabase-only patient backend. Mobile OTP is active for bookings,
          family members, and profile saves.
        </p>
        <Link href="/patient/login" className="cta-btn mt-6 inline-flex text-xs">
          Back to Login
        </Link>
      </div>
    </section>
  );
}
