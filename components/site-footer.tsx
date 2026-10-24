import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { Phone, Mail, MapPin, ShieldCheck, Heart } from "lucide-react";

const popularTests = [
  { label: "CBC Test (Complete Blood Count)", href: "/tests?focus=basic-tests&filter=blood&search=cbc" },
  { label: "Thyroid Profile (T3, T4, TSH)", href: "/tests?focus=profile-tests&filter=profile&search=thyroid" },
  { label: "Diabetes Screen (HbA1c + Sugar)", href: "/tests?focus=basic-tests&filter=blood&search=hba1c" },
  { label: "Lipid Profile (Cholesterol)", href: "/tests?focus=profile-tests&filter=profile&search=lipid" },
  { label: "Liver Function Test (LFT)", href: "/tests?focus=organ-function-tests&filter=profile&search=liver" },
  { label: "Kidney Function Test (KFT)", href: "/tests?focus=organ-function-tests&filter=profile&search=kidney" },
  { label: "Vitamin D & B12 Test", href: "/tests?focus=hormone-special-tests&filter=hormone&search=vitamin%20d" }
];

const healthPackages = [
  { label: "Health 360 Pro Full Body", href: "/packages/health-360-pro" },
  { label: "Burnout Predictor Basic", href: "/packages/burnout-predictor-basic" },
  { label: "Burnout Predictor Pro", href: "/packages/burnout-predictor-pro" },
  { label: "Gut Health & Digestion Check", href: "/packages/gut-health-check" },
  { label: "Senior Citizen Wellness Panel", href: "/packages" },
  { label: "Women Preventive Health Panel", href: "/packages" }
];

const partnerLinks = [
  { label: "Collection Centre Partners", href: "/growth-partners#partnership-models" },
  { label: "Clinics & Doctors", href: "/growth-partners#partnership-models" },
  { label: "Corporate Health Programs", href: "/growth-partners#partnership-models" },
  { label: "Insurance & TPA Diagnostics", href: "/growth-partners#partnership-models" },
  { label: "Partner Onboarding Enquiries", href: "/growth-partners" }
];

export function SiteFooter() {
  return (
    <footer className="border-t border-[#EAEAEA] bg-white pt-14 pb-10 text-[#0D0D0D]">
      <div className="section-wrap">
        {/* Main Footer Columns */}
        <div className="grid gap-10 lg:grid-cols-5 sm:grid-cols-2">
          {/* Col 1: Brand, Tagline, Positioning */}
          <div className="lg:col-span-2 space-y-4">
            <BrandLogo />
            <div className="space-y-1">
              <p className="text-sm font-extrabold text-[#FF6B00] tracking-wide">
                Your Health. Decoded.
              </p>
              <p className="text-xs font-semibold text-[#0D0D0D]">
                Real Prices. Faster Diagnostics. Better Guidance.
              </p>
            </div>
            <p className="text-xs leading-relaxed text-[#626262] max-w-sm">
              ScopeX Diagnostics is a tech-enabled diagnostic platform providing transparently priced blood tests and comprehensive health packages with certified home sample collection across major Indian cities.
            </p>
            <div className="flex items-center gap-2 pt-1 text-xs text-[#0D0D0D] font-medium">
              <ShieldCheck className="h-4 w-4 text-[#FF6B00]" />
              <span>NABL Quality Standards · Safe Barcoded Cold-Chain</span>
            </div>
          </div>

          {/* Col 2: Popular Tests */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0D0D0D]">
              Popular Tests
            </h3>
            <ul className="mt-4 space-y-2.5 text-xs text-[#626262]">
              {popularTests.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="hover:text-[#FF6B00] transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Packages & Partners */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0D0D0D]">
              Packages &amp; Partners
            </h3>
            <ul className="mt-4 space-y-2.5 text-xs text-[#626262]">
              {healthPackages.slice(0, 4).map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="hover:text-[#FF6B00] transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
              <li className="pt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0D0D0D]">
                  Growth Partners:
                </span>
              </li>
              {partnerLinks.slice(0, 3).map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="hover:text-[#FF6B00] transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Contact & Support */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0D0D0D]">
              Customer Support
            </h3>
            <div className="mt-4 space-y-3 text-xs text-[#626262]">
              <div className="flex items-start gap-2.5">
                <Phone className="h-4 w-4 text-[#FF6B00] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#0D0D0D]">+91-8989273440</p>
                  <p className="text-[11px] text-[#626262]">Mon - Sun: 6:00 AM - 9:00 PM</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Mail className="h-4 w-4 text-[#FF6B00] shrink-0 mt-0.5" />
                <div>
                  <a href="mailto:support@scopexdiagnostics.in" className="hover:text-[#FF6B00]">
                    support@scopexdiagnostics.in
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-[#FF6B00] shrink-0 mt-0.5" />
                <p>Pan India Home Sample Collection Network</p>
              </div>
            </div>

            <div className="mt-5">
              <Link
                href="/book-home-collection"
                className="cta-btn w-full rounded-xl py-2.5 text-center text-xs font-bold"
              >
                Book Home Collection
              </Link>
            </div>
          </div>
        </div>

        {/* Medical Disclaimer & Service Statement */}
        <div className="mt-12 rounded-2xl border border-[#EAEAEA] bg-[#F7F7F7] p-5 text-xs text-[#626262] leading-relaxed">
          <p className="font-bold text-[#0D0D0D] mb-1">Medical Disclaimer &amp; Service Information</p>
          <p>
            Diagnostic tests and preventive health packages provided through ScopeX Diagnostics are intended for clinical investigation, routine screening, and wellness tracking. All tests are conducted by certified medical technicians and processed through accredited partner pathology laboratories. Reports should always be interpreted in consultation with a qualified medical practitioner.
          </p>
        </div>

        {/* Bottom Legal Bar */}
        <div className="mt-8 flex flex-col gap-4 border-t border-[#EAEAEA] pt-6 text-xs text-[#626262] md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} SCOPEX Diagnostics India. All rights reserved.</p>
          <div className="flex flex-wrap gap-4 sm:gap-6">
            <Link href="/about" className="hover:text-[#0D0D0D]">About</Link>
            <Link href="/contact" className="hover:text-[#0D0D0D]">Contact</Link>
            <Link href="/privacy-policy" className="hover:text-[#0D0D0D]">Privacy Policy</Link>
            <Link href="/terms-and-conditions" className="hover:text-[#0D0D0D]">Terms &amp; Conditions</Link>
            <Link href="/refund-policy" className="hover:text-[#0D0D0D]">Cancellation &amp; Refund</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
