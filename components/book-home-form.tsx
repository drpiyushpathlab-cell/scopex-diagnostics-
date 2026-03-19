"use client";

import { FormEvent, useState } from "react";
import { homeCollectionTimeSlots } from "@/lib/validation";
import { submitViaFormSubmit } from "@/lib/formsubmit";

type SubmitState = "idle" | "loading" | "success" | "error" | "duplicate";
const mobileRegex = /^[6-9]\d{9}$/;

export function BookHomeForm() {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [collectionDate, setCollectionDate] = useState("");
  const [familyMembers, setFamilyMembers] = useState("Self only");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [status, setStatus] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const sanitizedMobile = mobileNumber.replace(/\D/g, "");
    if (!mobileRegex.test(sanitizedMobile)) {
      setStatus("error");
      setMessage("Enter a valid 10-digit mobile number.");
      return;
    }

    try {
      await submitViaFormSubmit({
        leadType: "home_collection",
        name,
        age: Number(age),
        mobileNumber: sanitizedMobile,
        collectionDate,
        familyMembers,
        city,
        address,
        preferredTime
      });

      setStatus("success");
      setMessage("Your booking request was submitted.");
      setName("");
      setAge("");
      setMobileNumber("");
      setCollectionDate("");
      setFamilyMembers("Self only");
      setCity("");
      setAddress("");
      setPreferredTime("");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Submission failed.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="card mt-6 space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="rounded-lg border border-black/15 bg-transparent px-4 py-3 text-sm dark:border-white/20"
        />
        <input
          required
          type="number"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          placeholder="Age"
          className="rounded-lg border border-black/15 bg-transparent px-4 py-3 text-sm dark:border-white/20"
        />
        <input
          required
          value={mobileNumber}
          onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
          placeholder="Mobile Number"
          inputMode="numeric"
          maxLength={10}
          pattern="[0-9]{10}"
          className="rounded-lg border border-black/15 bg-transparent px-4 py-3 text-sm dark:border-white/20"
        />
        <input
          required
          type="date"
          value={collectionDate}
          onChange={(e) => setCollectionDate(e.target.value)}
          min={new Date().toISOString().split("T")[0]}
          className="rounded-lg border border-black/15 bg-transparent px-4 py-3 text-sm dark:border-white/20"
        />
        <select
          required
          value={familyMembers}
          onChange={(e) => setFamilyMembers(e.target.value)}
          className="rounded-lg border border-black/15 bg-transparent px-4 py-3 text-sm dark:border-white/20"
        >
          <option value="Self only" className="bg-[var(--bg)]">
            Self only
          </option>
          <option value="2" className="bg-[var(--bg)]">
            2
          </option>
          <option value="3" className="bg-[var(--bg)]">
            3
          </option>
          <option value="4" className="bg-[var(--bg)]">
            4
          </option>
          <option value="5" className="bg-[var(--bg)]">
            5
          </option>
          <option value="6" className="bg-[var(--bg)]">
            6
          </option>
        </select>
        <input
          required
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="City"
          className="rounded-lg border border-black/15 bg-transparent px-4 py-3 text-sm dark:border-white/20"
        />
        <input
          required
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Address"
          className="rounded-lg border border-black/15 bg-transparent px-4 py-3 text-sm dark:border-white/20 md:col-span-2"
        />
        <select
          required
          value={preferredTime}
          onChange={(e) => setPreferredTime(e.target.value)}
          className="rounded-lg border border-black/15 bg-transparent px-4 py-3 text-sm dark:border-white/20 md:col-span-2"
        >
          <option value="">Preferred Time for Home Collection</option>
          {homeCollectionTimeSlots.map((slot) => (
            <option key={slot} value={slot} className="bg-[var(--bg)]">
              {slot}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className="cta-btn w-full md:w-auto" disabled={status === "loading"}>
        {status === "loading" ? "Submitting..." : "Submit Booking"}
      </button>
      {message ? (
        <p
          className={`text-sm ${
            status === "success"
              ? "text-green-600"
              : status === "duplicate"
                ? "text-yellow-600"
                : status === "error"
                  ? "text-red-600"
                  : "text-[var(--muted)]"
          }`}
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
