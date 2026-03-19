const steps = [
  {
    title: "Step 1: Book",
    description: "Choose your package or test, select home collection, and submit your preferred slot in minutes."
  },
  {
    title: "Step 2: Sample Collection",
    description: "A trained SCOPEX phlebotomist visits your home with sterile kits for safe and convenient collection."
  },
  {
    title: "Step 3: Report",
    description: "Your sample is processed with quality checks and the digital report is shared quickly with support when needed."
  }
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="section-wrap mt-16 scroll-mt-32">
      <div className="premium-panel rounded-[28px] p-7 md:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#FF6A00]">How It Works</p>
        <h2 className="mt-3 text-3xl font-bold md:text-4xl">Diagnostics designed around speed, comfort, and clarity.</h2>
        <p className="premium-muted mt-3 max-w-2xl text-sm leading-7 md:text-base">
          Book once, get collected at home, and receive reports without friction.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <article key={step.title} className="premium-card rounded-[24px] p-5 md:p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FF6A00] text-sm font-bold text-white">{index + 1}</div>
              <h3 className="mt-4 text-xl font-bold">{step.title}</h3>
              <p className="premium-muted mt-3 text-sm leading-7">{step.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
