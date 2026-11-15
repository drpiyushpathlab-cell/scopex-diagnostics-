import test from "node:test";
import assert from "node:assert/strict";
import { ADMIN_PERMISSION_KEYS, validateBuiltInRole, validatePermissionList } from "@/lib/admin-permissions";

test("admin permission configuration accepts only built-in application roles", () => {
  assert.equal(validateBuiltInRole("super_admin"), "super_admin");
  assert.throws(() => validateBuiltInRole("custom_root"), /supported administrator roles/i);
});

test("admin permission configuration rejects unknown permissions and normalizes duplicates", () => {
  assert.deepEqual(validatePermissionList([ADMIN_PERMISSION_KEYS[0], ADMIN_PERMISSION_KEYS[0]]), [ADMIN_PERMISSION_KEYS[0]]);
  assert.throws(() => validatePermissionList(["database.drop_everything"]), /unsupported permission/i);
  assert.throws(() => validatePermissionList("bookings.view"), /must be a list/i);
});
