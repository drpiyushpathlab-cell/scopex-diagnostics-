import { AdminRolesPermissions } from "@/components/admin-roles-permissions";
import { AdminSessionGuard } from "@/components/admin-session-guard";

export default function RolesPermissionsPage() {
  return (
    <AdminSessionGuard>
      <main className="min-h-screen bg-[#f4faf8] px-4 py-8 md:px-10">
        <div className="mx-auto max-w-7xl">
          <AdminRolesPermissions />
        </div>
      </main>
    </AdminSessionGuard>
  );
}
