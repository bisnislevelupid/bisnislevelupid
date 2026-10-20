import { dashboardStats } from "@/lib/admin/crud";
import { PanelShell } from "./panel-shell";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const stats = await dashboardStats();
  return <PanelShell pending={Number(stats.pending_orders ?? 0)}>{children}</PanelShell>;
}
