"use client";

import { useState } from "react";
import { PhoneCall } from "lucide-react";
import { QuickLeadModal } from "@/components/quick-lead-modal";

type Props = {
  itemType: "test" | "package";
  itemId: string;
  itemName: string;
  itemPrice?: number;
  label?: string;
  className?: string;
  variant?: "primary" | "secondary" | "outline";
};

export function QuickLeadTrigger({
  itemType,
  itemId,
  itemName,
  itemPrice,
  label = "Request Callback",
  className = "",
  variant = "secondary"
}: Props) {
  const [open, setOpen] = useState(false);

  const baseStyle =
    variant === "primary"
      ? "bg-[#0D0D0D] text-white hover:bg-[#FF6B00]"
      : variant === "outline"
      ? "border border-[#FF6B00] text-[#FF6B00] hover:bg-[#FFF4E8]"
      : "bg-white border border-stone-300 text-stone-800 hover:border-[#FF6B00] hover:text-[#FF6B00]";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition shadow-sm ${baseStyle} ${className}`}
      >
        <PhoneCall className="h-3.5 w-3.5 text-[#FF6B00]" />
        <span>{label}</span>
      </button>

      <QuickLeadModal
        isOpen={open}
        onClose={() => setOpen(false)}
        itemType={itemType}
        itemId={itemId}
        itemName={itemName}
        itemPrice={itemPrice}
      />
    </>
  );
}
