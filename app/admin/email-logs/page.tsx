import { AdminEmailLogs } from "@/components/admin-email-logs";
import { AdminSessionGuard } from "@/components/admin-session-guard";

export default function AdminEmailLogsPage() {
  return (
    <AdminSessionGuard>
      <main className="min-h-screen bg-[#f4faf8] px-4 py-8 md:px-10">
        <div className="mx-auto max-w-7xl">
          <AdminEmailLogs />
        </div>
      </main>
    </AdminSessionGuard>
  );
}
