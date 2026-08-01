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
      : payload.leadType === "growth_partner"
        ? "New SCOPEX Growth Partner Enquiry"
        : "New SCOPEX Health Advisor Request";

  const lines = [
    `Lead Type: ${payload.leadType}`,
    payload.companyName ? `Company: ${payload.companyName}` : undefined,
    payload.contactPerson ? `Contact Person: ${payload.contactPerson}` : undefined,
    `Name: ${payload.name}`,
    payload.designation ? `Designation: ${payload.designation}` : undefined,
    payload.gender ? `Gender: ${payload.gender}` : undefined,
    `Mobile: ${payload.mobileNumber}`,
    payload.officialEmail ? `Official Email: ${payload.officialEmail}` : undefined,
    payload.companyWebsite ? `Website: ${payload.companyWebsite}` : undefined,
    payload.age ? `Age: ${payload.age}` : undefined,
    payload.collectionDate ? `Collection Date: ${payload.collectionDate}` : undefined,
    payload.appointmentDate ? `Appointment Date: ${payload.appointmentDate}` : undefined,
    payload.familyMembers ? `Family Members: ${payload.familyMembers}` : undefined,
    payload.city ? `City: ${payload.city}` : undefined,
    payload.state ? `State: ${payload.state}` : undefined,
    payload.businessType ? `Business Type: ${payload.businessType}` : undefined,
    payload.expectedMonthlyVolume ? `Expected Monthly Volume: ${payload.expectedMonthlyVolume}` : undefined,
    payload.address ? `Address: ${payload.address}` : undefined,
    payload.preferredTime ? `Preferred Time: ${payload.preferredTime}` : undefined,
    payload.purpose ? `Purpose: ${payload.purpose}` : undefined,
    payload.message ? `Message: ${payload.message}` : undefined
  ].filter(Boolean);

  await transporter.sendMail({
    from: `"SCOPEX Website" <${smtpUser}>`,
    to: notifyTo,
    subject,
    text: lines.join("\n")
  });

  if (payload.leadType === "growth_partner" && payload.officialEmail) {
    await transporter.sendMail({
      from: `"SCOPEX Diagnostics" <${smtpUser}>`,
      to: payload.officialEmail,
      subject: "We received your ScopeX Growth Partner enquiry",
      text: [
        `Dear ${payload.contactPerson ?? payload.name},`,
        "",
        "Thank you for your interest in partnering with ScopeX Diagnostics.",
        "Our business team has received your enquiry and will contact you shortly to discuss partnership opportunities.",
        "",
        "Regards,",
        "ScopeX Diagnostics"
      ].join("\n")
    });
  }
}
