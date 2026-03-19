import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Process",
  description: "Understand the SCOPEX diagnostics flow from booking to report delivery."
};

const steps = [
  {
    title: "1. Booking",
    description: "Choose package or tests and submit your preferred slot through our online booking flow."
  },
  {
    title: "2. Sample Collection",
    description: "A trained SCOPEX technician visits your home with sterile kits for secure sample collection."
  },
  {
    title: "3. Testing",
    description: "Samples are processed in controlled environments with calibrated instruments and quality checks."
  },
  {
    title: "4. Report Delivery",
    description: "Digital reports are shared quickly, with advisor support available for interpretation."
  }
];

export default function ProcessPage() {
  return (
    <section className="section-wrap py-14">
      <h1 className="text-3xl font-bold">How It Works</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">A simple and reliable diagnostic journey designed around your convenience.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {steps.map((step) => (
          <article key={step.title} className="card">
            <h2 className="text-xl font-semibold">{step.title}</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">{step.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
