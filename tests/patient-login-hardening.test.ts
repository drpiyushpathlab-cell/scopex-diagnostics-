import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createMsg91OtpSender } from "../backend/src/lib/msg91";
import { createOtpChallengeToken, verifyOtpChallengeToken } from "../backend/src/lib/otp";

test("MSG91 sender refuses to simulate when required credentials are missing", async () => {
  let called = false;
  const sender = createMsg91OtpSender({}, async () => {
    called = true;
    return new Response("{}", { status: 200 });
  });

  await assert.rejects(sender("9876543210", "123456"), (error: unknown) => {
    assert.equal((error as { code?: string }).code, "OTP_PROVIDER_UNAVAILABLE");
    return true;
  });
  assert.equal(called, false);
});

test("MSG91 request uses auth header, international mobile and configured OTP template", async () => {
  let requestUrl = "";
  let requestInit: RequestInit | undefined;
  const sender = createMsg91OtpSender(
    { authKey: "test-auth-key", templateId: "test-template" },
    async (input, init) => {
      requestUrl = String(input);
      requestInit = init;
      return new Response(JSON.stringify({ type: "success", request_id: "test-request" }), { status: 200 });
    }
  );

  const result = await sender("9876543210", "123456");
  const url = new URL(requestUrl);
  assert.equal(url.pathname, "/api/v5/otp");
  assert.equal(url.searchParams.get("template_id"), "test-template");
  assert.equal(url.searchParams.get("mobile"), "919876543210");
  assert.equal(requestInit?.method, "POST");
  assert.equal(new Headers(requestInit?.headers).get("authkey"), "test-auth-key");
  assert.deepEqual(result, { type: "success", request_id: "test-request" });
  assert.equal(JSON.stringify(result).includes("123456"), false);
});

test("MSG91 authentication/provider errors become a safe error without exposing provider text", async () => {
  const sender = createMsg91OtpSender({ authKey: "test-auth-key", templateId: "test-template" }, async () =>
    new Response(JSON.stringify({ type: "error", message: "sensitive provider detail" }), { status: 401 })
  );

  await assert.rejects(sender("9876543210", "123456"), (error: unknown) => {
    assert.equal((error as Error).message, "OTP provider could not send a code. Please try again.");
    assert.equal((error as { code?: string }).code, "OTP_PROVIDER_UNAVAILABLE");
    return true;
  });
});

test("signed OTP challenges reject wrong and expired codes without returning OTP data", () => {
  const mobile = "9876543210";
  const challenge = createOtpChallengeToken(mobile, "123456");
  assert.equal(verifyOtpChallengeToken(challenge, mobile, "123456"), undefined);
  assert.throws(() => verifyOtpChallengeToken(challenge, mobile, "000000"));

  const originalNow = Date.now;
  try {
    Date.now = () => 1_000;
    const expired = createOtpChallengeToken(mobile, "654321");
    Date.now = () => 400_000;
    assert.throws(() => verifyOtpChallengeToken(expired, mobile, "654321"), (error: unknown) => {
      assert.equal((error as { code?: string }).code, "OTP_EXPIRED");
      return true;
    });
  } finally {
    Date.now = originalNow;
  }
});

test("atomic patient registration draft omits generated users.mobile and restricts function execution", async () => {
  const sql = await readFile("migrations/20261114090000_atomic_patient_user_upsert.sql", "utf8");
  assert.match(sql, /pg_advisory_xact_lock/);
  assert.match(sql, /insert into public\.users \(phone, role, patient_id, is_active\)/i);
  assert.doesNotMatch(sql, /insert into public\.users\s*\([^)]*\bmobile\b/i);
  assert.match(sql, /revoke all on function[\s\S]*from anon/i);
  assert.match(sql, /revoke all on function[\s\S]*from authenticated/i);
  assert.match(sql, /grant execute on function[\s\S]*to service_role/i);
});

test("patient OTP response and UI no longer expose or autofill OTP values", async () => {
  const route = await readFile("app/api/send-otp/route.ts", "utf8");
  const backendAuth = await readFile("backend/src/routes/auth.ts", "utf8");
  const component = await readFile("components/otp-login-card.tsx", "utf8");
  const provider = await readFile("backend/src/lib/msg91.ts", "utf8");
  assert.doesNotMatch(route, /debugOtp|Demo OTP|console\.(log|warn|error).*otp/i);
  assert.match(backendAuth, /process\.env\.NODE_ENV !== "production" && process\.env\.ALLOW_DEBUG_OTP === "true"/);
  assert.doesNotMatch(backendAuth, /debugOtp/);
  assert.doesNotMatch(component, /debugOtp/);
  assert.doesNotMatch(provider, /Simulated OTP|Demo OTP|console\.(log|warn).*otp/i);
});
