"use client";

import Script from "next/script";
import { useState } from "react";

const MIN_AMOUNT_PAISE = 100;

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      on?: (event: "payment.failed", handler: (response: { error?: { description?: string; reason?: string } }) => void) => void;
      open: () => void;
    };
  }
}

type RazorpayCheckoutButtonProps = {
  amountPaise: number;
  receipt?: string;
  customer?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  label?: string;
  onSuccess?: (paymentId: string) => void;
};

export function RazorpayCheckoutButton({
  amountPaise,
  receipt,
  customer,
  label = "Pay Now",
  onSuccess
}: RazorpayCheckoutButtonProps) {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleCheckout() {
    setMessage("");

    if (amountPaise < MIN_AMOUNT_PAISE) {
      setMessage("Minimum payment amount is Rs. 1.");
      return;
    }

    if (!window.Razorpay) {
      setMessage("Razorpay checkout is still loading. Please try again.");
      return;
    }

    setIsLoading(true);
    try {
      const orderResponse = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountPaise,
          currency: "INR",
          receipt: receipt || `scopex_${Date.now()}`
        })
      });
      const order = await orderResponse.json();

      if (!orderResponse.ok) {
        setIsLoading(false);
        setMessage(order.message || "Unable to create Razorpay order.");
        return;
      }

      const instance = new window.Razorpay({
        key: order.key_id || order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.order_id || order.id,
        name: "ScopeX Diagnostics",
        description: "Diagnostic booking payment",
        prefill: customer,
        theme: { color: "#F7931E" },
        handler: async (response: Record<string, string>) => {
          const verifyResponse = await fetch("/api/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            })
          });
          const verifyResult = await verifyResponse.json().catch(() => ({}));

          if (!verifyResponse.ok) {
            setMessage(verifyResult.message || "Payment verification failed.");
            setIsLoading(false);
            return;
          }

          setMessage("Payment verified successfully.");
          setIsLoading(false);
          onSuccess?.(response.razorpay_payment_id);
        },
        modal: {
          ondismiss: () => {
            setMessage("Payment cancelled.");
            setIsLoading(false);
          }
        }
      });

      instance.on?.("payment.failed", (response) => {
        setMessage(response.error?.description || response.error?.reason || "Payment failed. Please try again.");
        setIsLoading(false);
      });

      instance.open();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to open Razorpay checkout.");
      setIsLoading(false);
    }
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <button type="button" onClick={handleCheckout} disabled={isLoading} className="cta-btn w-full disabled:opacity-60">
        {isLoading ? "Opening Razorpay..." : label}
      </button>
      {message ? <p className="mt-3 text-sm font-semibold text-[#0b7f6f]">{message}</p> : null}
    </>
  );
}
