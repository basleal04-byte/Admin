import { DashboardShell } from "@/components/layout/dashboard-shell";
import { IdleGuard } from "@/components/idle-guard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell>
      <IdleGuard />
      {children}
    </DashboardShell>
  );
}
