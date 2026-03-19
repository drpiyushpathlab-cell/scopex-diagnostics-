const points = [
  "NABL-aligned process with strict quality controls",
  "Fast report delivery with real-time support",
  "Experienced technicians and clinical advisors",
  "Premium customer experience with transparent pricing"
];

export function WhyChooseUs() {
  return (
    <section id="why-scopex" className="section-wrap mt-16 scroll-mt-32">
      <div className="grid gap-6 rounded-3xl border border-black/10 bg-[var(--surface)] p-7 dark:border-white/10 md:grid-cols-[1.2fr_1fr] md:p-10">
        <div>
          <h2 className="text-2xl font-bold md:text-3xl">Why Choose SCOPEX</h2>
          <p className="mt-3 max-w-2xl text-sm text-[var(--muted)]">
            We combine medical precision with premium wellness convenience, enabling confident and seamless access to diagnostics.
          </p>
          <ul className="mt-6 space-y-3">
            {points.map((point) => (
              <li key={point} className="flex items-start gap-2 text-sm">
                <span className="mt-1 h-2 w-2 rounded-full bg-scopex-orange" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative rounded-2xl border border-scopex-orange/30 bg-black p-6 text-white">
          <p className="text-xs uppercase tracking-[0.16em] text-white/80">Commitment</p>
          <p className="mt-2 text-4xl font-bold text-scopex-orange">~100%</p>
          <p className="text-sm text-white/80">On-time home sample collections in major city zones.</p>
          <p className="mt-6 text-xs uppercase tracking-[0.16em] text-white/80">Reports</p>
          <p className="mt-2 text-4xl font-bold text-scopex-orange">24 to 48 hours</p>
          <p className="text-sm text-white/80">Average turnaround time for standard wellness panels.</p>
        </div>
      </div>
    </section>
  );
}
