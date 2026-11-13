import test from "node:test";
import assert from "node:assert/strict";
import {
  listSeoPages,
  getSeoPageById,
  getSeoPageBySlug,
  createOrUpdateSeoPage,
  submitForClinicalReview,
  approveClinicalReview,
  publishSeoPage,
  runSeoAudit,
  runAiDiscoveryCheck,
  listRedirects,
  addRedirect,
  matchRedirect,
  deleteRedirect,
  getSearchIntegrationStatus
} from "../lib/seo-service";

test("pre-seeds catalog tests and packages with complete SEO, AEO and GEO metadata", () => {
  const pages = listSeoPages();
  assert.ok(pages.length > 20, "Should have more than 20 pre-seeded SEO pages");

  // Find CBC test page
  const cbcPage = pages.find((p) => p.slug.includes("complete-blood-count") || p.id.includes("cbc"));
  assert.ok(cbcPage, "CBC test page must be pre-seeded");
  assert.equal(cbcPage.kind, "test");
  assert.ok(cbcPage.canonicalPath.startsWith("/tests/"), "Canonical path must be /tests/...");
  assert.ok(cbcPage.canonicalUrl.startsWith("http"), "Canonical URL must be absolute");
  assert.ok(cbcPage.realPrice && cbcPage.realPrice > 0, "Real price must be present");
  assert.ok(cbcPage.specimenType, "Specimen type must be present for AEO/GEO");
  assert.ok(cbcPage.fastingRequirement, "Fasting requirement must be present for AEO/GEO");
  assert.ok(cbcPage.aeoDirectAnswer.length > 40, "Direct AEO answer snippet must be present");
  assert.ok(cbcPage.faq.length >= 3, "Should have at least 3 clinical FAQs");
  assert.equal(cbcPage.clinicalReview.approved, true, "Pre-seeded clinical review must be approved");
});

test("enforces Clinical Governance: cannot publish clinical content without approved review", () => {
  const draftSlug = `test-draft-page-${Date.now()}`;
  const created = createOrUpdateSeoPage({
    slug: draftSlug,
    title: "Unreviewed Diagnostic Profile",
    metaDescription: "Test description for an unreviewed diagnostic profile that requires clinical sign-off.",
    status: "draft"
  });

  assert.equal(created.status, "draft");

  // Attempting to publish without clinical review must throw
  assert.throws(() => {
    publishSeoPage(created.id);
  }, /Clinical content requires approved medical review/);

  // Submitting for review
  const inReview = submitForClinicalReview(created.id);
  assert.equal(inReview.status, "in_review");

  // Approving clinical review requires valid reviewer and credentials
  assert.throws(() => {
    approveClinicalReview(created.id, { reviewedBy: "", reviewerCredentials: "" });
  }, /reviewer name and professional medical credentials are required/);

  const approved = approveClinicalReview(created.id, {
    reviewedBy: "Dr. Piyush Pathlab",
    reviewerCredentials: "MBBS, MD Pathology",
    clinicalNotes: "Verified clinical parameters and reference ranges."
  });
  assert.equal(approved.status, "approved");
  assert.equal(approved.clinicalReview.approved, true);

  // Now publishing succeeds
  const published = publishSeoPage(created.id);
  assert.equal(published.status, "published");
  assert.ok(published.publishedAt);
});

test("SEO Audit scanner accurately detects duplicate titles, duplicate descriptions, and length issues", () => {
  const audit = runSeoAudit();
  assert.ok(audit.totalPages > 0);
  assert.ok(audit.healthScore >= 50 && audit.healthScore <= 100);
  assert.equal(typeof audit.duplicateTitlesCount, "number");
  assert.equal(typeof audit.duplicateDescriptionsCount, "number");
  assert.ok(Array.isArray(audit.issues));

  // Introduce a page with intentionally duplicate title
  const dupSlug = `dup-page-${Date.now()}`;
  createOrUpdateSeoPage({
    slug: dupSlug,
    title: audit.issues[0]?.pageTitle || "Complete Blood Count + ESR at Home (₹300) | ScopeX Diagnostics",
    metaDescription: "A generic description that should trigger an audit flag for testing duplicate scanner.",
    status: "draft"
  });

  const auditAfter = runSeoAudit();
  assert.ok(auditAfter.issues.length >= audit.issues.length);
});

test("AI Discovery & GEO readiness check scores direct answers, FAQ richness, and clinical credibility", () => {
  const pages = listSeoPages();
  const cbc = pages.find((p) => p.kind === "test")!;
  assert.ok(cbc);

  const check = runAiDiscoveryCheck(cbc);
  assert.ok(check.score >= 70, `Score should be >= 70, got ${check.score}`);
  assert.ok(["Excellent", "Good"].includes(check.rating));
  assert.equal(check.directAnswerPresent, true);
  assert.equal(check.faqSchemaPresent, true);
  assert.equal(check.clinicalReviewerVerified, true);
  assert.equal(check.quantitativeDataPresent, true);
});

test("Redirect manager manages 301/302 rules, prevents circular loops, and matches paths", () => {
  const redirects = listRedirects();
  assert.ok(redirects.length >= 3);

  const matched = matchRedirect("/tests/cbc");
  assert.ok(matched, "Should match /tests/cbc");
  assert.equal(matched.statusCode, 301);
  assert.ok(matched.destinationPath.includes("complete-blood-count"));
  assert.ok(matched.hitCount >= 1, "Hit count must increment on match");

  // Prevent circular redirect
  assert.throws(() => {
    addRedirect({ sourcePath: "/same-path", destinationPath: "/same-path" });
  }, /circular redirect/);

  // Add temporary 302 redirect
  const newRule = addRedirect({
    sourcePath: `/temp-promo-${Date.now()}`,
    destinationPath: "/packages/health-360-pro",
    statusCode: 302,
    notes: "Campaign redirect"
  });
  assert.equal(newRule.statusCode, 302);
  const matchNew = matchRedirect(newRule.sourcePath);
  assert.ok(matchNew);

  // Delete redirect
  const deleted = deleteRedirect(newRule.id);
  assert.equal(deleted, true);
  assert.equal(matchRedirect(newRule.sourcePath), null);
});

test("Search integration status respects user constraint: shows actual metrics only when connected", () => {
  const status = getSearchIntegrationStatus();
  assert.equal(typeof status.isConnected, "boolean");
  if (!status.isConnected) {
    assert.equal(status.provider, "None");
    assert.equal(status.metrics, undefined);
    assert.ok(status.notice.includes("Integration not connected"));
  } else {
    assert.ok(status.metrics);
    assert.ok(status.metrics.totalImpressions > 0);
  }
});
