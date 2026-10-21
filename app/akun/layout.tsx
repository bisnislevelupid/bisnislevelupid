import { redirect } from "next/navigation";
import { getPesertaSession } from "@/lib/auth/session";
import { getPortalCustomer } from "@/lib/db/portal";
import { PortalShell } from "./portal-shell";
import "./portal.css";

export const dynamic = "force-dynamic";

export default async function AkunLayout({ children }: { children: React.ReactNode }) {
  const session = await getPesertaSession();
  if (!session) redirect("/masuk");
  const customer = await getPortalCustomer(session.id);
  if (!customer) redirect("/masuk");
  return (
    <PortalShell name={customer.name} business={customer.business_name || customer.email}>
      {children}
    </PortalShell>
  );
}
