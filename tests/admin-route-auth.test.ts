import test from "node:test";
import assert from "node:assert/strict";
import { signAdminAppToken, signAppToken } from "../backend/src/lib/jwt";
import { authorizeBackendRoute } from "../lib/backend-route-auth";

function requestFor(path: string, token?: string, method = "GET") {
  return new Request(`https://scopex.test/api/backend${path}`, {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined
  });
}

test("all admin API paths require a valid server-verified admin session", () => {
  assert.throws(() => authorizeBackendRoute(requestFor("/admin/customer-care/call"), "/admin/customer-care/call"), {
    statusCode: 401
  });

  const patientToken = signAppToken({ userId: "patient-test", role: "patient" });
  assert.throws(
    () => authorizeBackendRoute(requestFor("/admin/customer-care/call", patientToken), "/admin/customer-care/call"),
    { statusCode: 403 }
  );

  const adminToken = signAdminAppToken({ userId: "admin-test", role: "admin" });
  assert.equal(authorizeBackendRoute(requestFor("/admin/customer-care/call", adminToken), "/admin/customer-care/call")?.role, "admin");
});

test("phlebotomist job routes require a phlebotomist or authorized admin role", () => {
  assert.throws(() => authorizeBackendRoute(requestFor("/phlebotomist/jobs"), "/phlebotomist/jobs"), {
    statusCode: 401
  });

  const patientToken = signAppToken({ userId: "patient-test", role: "patient" });
  assert.throws(() => authorizeBackendRoute(requestFor("/phlebotomist/jobs", patientToken), "/phlebotomist/jobs"), {
    statusCode: 403
  });

  const phlebotomistToken = signAppToken({ userId: "phlebotomist-test", role: "phlebotomist" });
  assert.equal(
    authorizeBackendRoute(requestFor("/phlebotomist/jobs", phlebotomistToken), "/phlebotomist/jobs")?.role,
    "phlebotomist"
  );
});

test("phlebotomists can submit assigned handovers but cannot browse the admin partner sample queue", () => {
  const phlebotomistToken = signAppToken({ userId: "phlebotomist-test", role: "phlebotomist" });
  assert.throws(
    () => authorizeBackendRoute(requestFor("/admin/partner-samples", phlebotomistToken), "/admin/partner-samples"),
    { statusCode: 403 }
  );
  assert.equal(
    authorizeBackendRoute(
      requestFor("/admin/partner-samples/sample-test/handover", phlebotomistToken, "POST"),
      "/admin/partner-samples/sample-test/handover"
    )?.role,
    "phlebotomist"
  );
  assert.throws(
    () => authorizeBackendRoute(requestFor("/admin/partner-samples/assign", phlebotomistToken, "POST"), "/admin/partner-samples/assign"),
    { statusCode: 403 }
  );
});

test("admin login remains reachable without a token and is limited to POST", () => {
  assert.equal(authorizeBackendRoute(requestFor("/admin/login", undefined, "POST"), "/admin/login"), null);
  assert.throws(() => authorizeBackendRoute(requestFor("/admin/login"), "/admin/login"), { statusCode: 401 });
});
