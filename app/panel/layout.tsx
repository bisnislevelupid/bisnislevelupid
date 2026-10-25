import { redirect } from "next/navigation";
import { dashboardStats } from "@/lib/admin/crud";
import { getSuperadminSession } from "@/lib/auth/session";
import { PanelShell } from "./panel-shell";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await getSuperadminSession();
  if (!session) redirect("/masuk-admin");
  const stats = await dashboardStats();
  return (
    <>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@400;600;700;900&display=swap" />
      <PanelShell pending={Number(stats.pending_orders ?? 0)} adminName={session.name || session.email}>
        {children}
      </PanelShell>
    </>
  );
}
