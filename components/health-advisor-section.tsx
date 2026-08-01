import { HealthAdvisorForm } from "@/components/health-advisor-form";

const advisorReasons = [
  "Not sure which test or package is right",
  "Understanding needs and required tests",
  "Avoid unnecessary or costly tests",
  "Help with preventive health checkups"
];

const advisorOutcomes = [
  "Personalized test recommendation",
  "Cost-effective test planning",
  "Quick and reliable support",
  "Guidance before and after test"
];

export function HealthAdvisorSection() {
  return (
    <section id="health-advisor" className="container-px pt-12 md:pt-14">
      <div className="section-wrap">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr] lg:items-start">
          <div className="rounded-[30px] border border-[#f1dfce] bg-white p-6 shadow-[0_18px_42px_rgba(16,24,40,0.06)] md:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#F7931E]">Advisor Support</p>
            <h2 className="mt-2 text-3xl font-bold text-[#0D0D0D] md:text-4xl">Talk to a Health Advisor</h2>
            <p className="mt-3 max-w-2xl text-base leading-8 text-[#5f6868] md:text-lg">
              Confused about which test to choose? Get expert guidance in just 2 minutes.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                "Free expert guidance",
                "No unnecessary tests recommended",
                "Quick response within minutes"
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-[#e3efed] bg-[#FFF8F2] px-4 py-4 text-sm font-medium text-[#5f6868]"
                >
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <div className="rounded-[24px] border border-[#e3efed] bg-[#f9fcfb] p-5">
                <h3 className="text-xl font-bold text-[#0D0D0D]">Why Talk to an Advisor?</h3>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-[#5f6868]">
                  {advisorReasons.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#eaf8f5] text-[#F7931E]">
                        <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="m4.5 10 3.5 3.5L15.5 6" />
                        </svg>
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[24px] border border-[#ffe0ce] bg-[#fff8f4] p-5">
                <h3 className="text-xl font-bold text-[#0D0D0D]">What You Get</h3>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-[#5f6868]">
                  {advisorOutcomes.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#fff0e7] text-[11px] font-bold text-[#F7931E]">
                        +
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <HealthAdvisorForm />
        </div>
      </div>
    </section>
  );
}
