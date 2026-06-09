import { backendEnv } from "@/backend/src/config/env";

export async function sendSMS(params: { mobile: string; message: string }) {
  const query = new URLSearchParams({
    authkey: backendEnv.MSG91_AUTH_KEY,
    mobiles: `91${params.mobile.replace(/\D/g, "").slice(-10)}`,
    message: params.message,
    sender: backendEnv.MSG91_SENDER_ID,
    route: "4"
  });

  const response = await fetch(`https://control.msg91.com/api/sendhttp.php?${query.toString()}`, {
    method: "GET",
    cache: "no-store"
  });

  return {
    ok: response.ok,
    response: await response.text()
  };
}

export async function sendWhatsApp(params: { mobile: string; templateName: string; bodyValues?: string[] }) {
  const token = process.env.META_WHATSAPP_TOKEN;
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    return { ok: false, skipped: true, reason: "WhatsApp credentials not configured." };
  }

  const response = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: `91${params.mobile.replace(/\D/g, "").slice(-10)}`,
      type: "template",
      template: {
        name: params.templateName,
        language: { code: "en" },
        components: params.bodyValues?.length
          ? [
              {
                type: "body",
                parameters: params.bodyValues.map((text) => ({ type: "text", text }))
              }
            ]
          : undefined
      }
    })
  });

  return {
    ok: response.ok,
    response: await response.text()
  };
}

export async function triggerBookingAutomation(params: {
  mobile: string;
  customerName: string;
  bookingId: string;
}) {
  const message = `Dear ${params.customerName}, your ScopeX booking ${params.bookingId} has been created. Our team will confirm your home collection slot shortly.`;

  await Promise.allSettled([
    sendSMS({ mobile: params.mobile, message }),
    sendWhatsApp({
      mobile: params.mobile,
      templateName: process.env.META_WHATSAPP_BOOKING_TEMPLATE || "scopex_booking_created",
      bodyValues: [params.customerName, params.bookingId]
    })
  ]);
}

export async function triggerPhlebotomistAssignedAutomation(params: {
  mobile: string;
  customerName: string;
  bookingId: string;
  phlebotomistName: string;
  etaMinutes?: number;
}) {
  const eta = params.etaMinutes !== undefined ? ` ETA: ${params.etaMinutes} minutes.` : "";
  const message = `Dear ${params.customerName}, your ScopeX home collection agent ${params.phlebotomistName} has been assigned for booking ${params.bookingId}.${eta}`;

  await Promise.allSettled([
    sendSMS({ mobile: params.mobile, message }),
    sendWhatsApp({
      mobile: params.mobile,
      templateName: process.env.META_WHATSAPP_AGENT_TEMPLATE || "scopex_agent_assigned",
      bodyValues: [params.customerName, params.bookingId, params.phlebotomistName, String(params.etaMinutes ?? "")]
    })
  ]);
}

export async function triggerSampleCollectedAutomation(params: {
  mobile: string;
  customerName: string;
  bookingId: string;
}) {
  const message = `Dear ${params.customerName}, your ScopeX sample for booking ${params.bookingId} has been collected and is now being processed.`;

  await Promise.allSettled([
    sendSMS({ mobile: params.mobile, message }),
    sendWhatsApp({
      mobile: params.mobile,
      templateName: process.env.META_WHATSAPP_COLLECTED_TEMPLATE || "scopex_sample_collected",
      bodyValues: [params.customerName, params.bookingId]
    })
  ]);
}

export async function triggerReportReadyAutomation(params: {
  mobile: string;
  customerName: string;
  bookingId: string;
}) {
  const message = `Dear ${params.customerName}, your ScopeX report for booking ${params.bookingId} is ready. Please login to download it.`;

  await Promise.allSettled([
    sendSMS({ mobile: params.mobile, message }),
    sendWhatsApp({
      mobile: params.mobile,
      templateName: process.env.META_WHATSAPP_REPORT_TEMPLATE || "scopex_report_ready",
      bodyValues: [params.customerName, params.bookingId]
    })
  ]);
}
