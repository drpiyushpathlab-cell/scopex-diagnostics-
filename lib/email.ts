import nodemailer from "nodemailer";
import type { LeadPayload } from "@/lib/validation";

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT ?? "587");
const smtpUser = process.env.SMTP_USER;
const smtpPassword = process.env.SMTP_PASSWORD;
const notifyTo = process.env.NOTIFICATION_EMAIL_TO;

function getTransporter() {
  if (!smtpHost || !smtpUser || !smtpPassword || !notifyTo) {
    throw new Error("Missing SMTP credentials.");
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPassword }
  });
}

export async function sendLeadNotification(payload: LeadPayload) {
  const transporter = getTransporter();

  const subject =
    payload.leadType === "home_collection"
      ? "New SCOPEX Home Collection Lead"
      : "New SCOPEX Health Advisor Request";

  const lines = [
    `Lead Type: ${payload.leadType}`,
    `Name: ${payload.name}`,
    payload.gender ? `Gender: ${payload.gender}` : undefined,
    `Mobile: ${payload.mobileNumber}`,
    payload.age ? `Age: ${payload.age}` : undefined,
    payload.city ? `City: ${payload.city}` : undefined,
    payload.address ? `Address: ${payload.address}` : undefined,
    payload.preferredTime ? `Preferred Time: ${payload.preferredTime}` : undefined,
    payload.purpose ? `Purpose: ${payload.purpose}` : undefined
  ].filter(Boolean);

  await transporter.sendMail({
    from: `"SCOPEX Website" <${smtpUser}>`,
    to: notifyTo,
    subject,
    text: lines.join("\n")
  });
}
