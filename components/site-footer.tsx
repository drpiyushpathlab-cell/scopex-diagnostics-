import { BrandLogo } from "@/components/brand-logo";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-black/10 py-10 dark:border-white/10">
      <div className="section-wrap flex flex-col items-start justify-between gap-5 md:flex-row">
        <div>
          <BrandLogo href="" compact />
          <p className="mt-2 max-w-md text-sm text-[var(--muted)]">
            Premium diagnostics with fast reports, accurate testing, and trusted home sample collection.
          </p>
        </div>
        <p className="text-sm text-[var(--muted)]">(c) {new Date().getFullYear()} SCOPEX DIAGNOSTICS. All rights reserved.</p>
      </div>
    </footer>
  );
}
