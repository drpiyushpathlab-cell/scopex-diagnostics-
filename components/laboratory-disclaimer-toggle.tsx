"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

export function LaboratoryDisclaimerToggle() {
  const [isOpen, setIsOpen] = useState(false);
  const contentId = useId();

  return (
    <div className="mt-3 border-t border-[#E5E5E5] pt-3">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls={contentId}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0D0D0D] hover:text-[#FF6B00] transition-colors cursor-pointer"
      >
        <span>Laboratory &amp; Testing Disclaimer</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-[#FF6B00] transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={contentId}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="mt-2.5 space-y-2.5 text-xs text-[#626262] leading-relaxed">
              <p>
                Diagnostic tests may be processed through NABL-accredited or non-NABL-accredited partner laboratories, depending on test availability, geographical location and operational requirements. NABL accreditation is applicable only to laboratories and specific testing parameters covered under their valid accreditation scope.
              </p>
              <p>
                Partner laboratories are expected to maintain appropriate quality control procedures and comply with applicable statutory and regulatory requirements. The respective performing laboratory is responsible for the technical processing, validation and issuance of test reports.
              </p>
              <p>
                SCOPEX facilitates diagnostic testing services through its partner laboratory network. Laboratory accreditation status, testing facilities and scope may vary by location and test. Customers may contact our support team for relevant laboratory details before booking.
              </p>
              <p>
                This disclaimer does not exclude or limit any liability that cannot legally be excluded under applicable Indian laws.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
