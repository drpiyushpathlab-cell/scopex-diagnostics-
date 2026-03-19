import Link from "next/link";

const services = [
  {
    title: "Health Packages",
    description: "Comprehensive preventive and specialty packages designed for every age group.",
    href: "/packages"
  },
  {
    title: "Individual Tests",
    description: "Book specific pathology tests with transparent pricing and quick turnaround.",
    href: "/tests"
  },
  {
    title: "Home Collection",
    description: "Certified phlebotomists at your doorstep with safe, timely sample handling.",
    href: "/book-home-collection"
  }
];

export function ServicesSection() {
  return (
    <section className="section-wrap mt-16">
      <div className="mb-8">
        <h2 className="text-2xl font-bold md:text-3xl">Services</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">Designed to maximize convenience, reliability, and health outcomes.</p>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {services.map((service) => (
          <article key={service.title} className="card transition hover:-translate-y-0.5 hover:shadow-premium">
            <h3 className="text-lg font-semibold">{service.title}</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">{service.description}</p>
            <Link href={service.href} className="mt-5 inline-flex text-sm font-semibold text-scopex-orange">
              Explore
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
