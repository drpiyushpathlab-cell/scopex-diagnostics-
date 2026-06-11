import Link from "next/link";

const popularTests = [
  { label: "CBC Test", href: "/tests?focus=basic-tests&filter=blood&search=cbc" },
  { label: "Thyroid Profile", href: "/tests?focus=profile-tests&filter=profile&search=thyroid" },
  { label: "Diabetes (HbA1c)", href: "/tests?focus=basic-tests&filter=blood&search=hba1c" },
  { label: "Lipid Profile", href: "/tests?focus=profile-tests&filter=profile&search=lipid" },
  { label: "Liver Function Test", href: "/tests?focus=organ-function-tests&filter=profile&search=liver" },
  { label: "Kidney Function Test", href: "/tests?focus=organ-function-tests&filter=profile&search=kidney" },
  { label: "Vitamin D Test", href: "/tests?focus=hormone-special-tests&filter=hormone&search=vitamin%20d" }
];

const healthPackages = [
  { label: "Full Body Checkup", href: "/packages" },
  { label: "Women Health Package", href: "/packages" },
  { label: "Senior Citizen Package", href: "/packages" },
  { label: "Fever Panel", href: "/tests" },
  { label: "Heart Health Package", href: "/packages" }
];

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-[#deece9] bg-white py-12">
      <div className="section-wrap">
        <div className="grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <h2 className="text-2xl font-bold text-[#102a2d]">ScopeX Diagnostics</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              ScopeX Diagnostics is a tech-enabled diagnostic platform providing accurate blood tests and full body
              health checkups with home sample collection. We ensure reliable, fast, and affordable diagnostic services
              with advanced lab technology.
            </p>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              Currently serving <strong>Lucknow</strong>. Expanding rapidly across India.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-[#102a2d]">Popular Tests</h3>
            <ul className="mt-4 space-y-2.5 text-sm leading-7 text-[var(--muted)]">
              {popularTests.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="hover:text-[#0f8f7c]">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold text-[#102a2d]">Health Packages</h3>
            <ul className="mt-4 space-y-2.5 text-sm leading-7 text-[var(--muted)]">
              {healthPackages.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="hover:text-[#0f8f7c]">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold text-[#102a2d]">Service Locations</h3>
            <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
              <strong>Available in:</strong>
              <br />
              <Link href="/" className="hover:text-[#0f8f7c]">
                Lucknow
              </Link>
            </p>
            <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
              <strong>Launching Soon:</strong>
              <br />
              Pune / Kanpur / Gorakhpur / Raipur / Nagpur / Varanasi
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-[#102a2d]">Contact</h3>
            <div className="mt-4 space-y-2 text-sm leading-7 text-[var(--muted)]">
              <p>+91-8989273440</p>
              <p>support@scopexdiagnostics.in</p>
              <p>Lucknow, India</p>
            </div>

            <h4 className="mt-5 text-base font-bold text-[#102a2d]">Book Test</h4>
            <Link href="/book-home-collection" className="cta-btn mt-3 w-full justify-center text-center">
              Book Now
            </Link>
          </div>
        </div>

        <div className="mt-10 rounded-[26px] border border-[#deece9] bg-[#f7fbfa] p-6">
          <h3 className="text-xl font-bold text-[#102a2d]">Book Blood Test at Home in Lucknow</h3>
          <p className="mt-3 text-sm leading-8 text-[var(--muted)] md:text-base">
            Book blood tests and full body health checkups at home in Lucknow with ScopeX Diagnostics. Our trained
            phlebotomists ensure safe sample collection with fast report delivery. Choose from a wide range of
            diagnostic tests including CBC, thyroid, diabetes, vitamin tests, and preventive health packages.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-[#deece9] pt-6 text-sm text-[var(--muted)] md:flex-row md:items-center md:justify-between">
          <p>© 2026 ScopeX Diagnostics. All Rights Reserved.</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/privacy-policy">Privacy Policy</Link>
            <Link href="/terms-and-conditions">Terms &amp; Conditions</Link>
            <Link href="/refund-policy">Refund &amp; Cancellation Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}


