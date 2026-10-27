import { getPesertaSession } from "@/lib/auth/session";
import { Navbar, type PublicAccount } from "@/components/landing/navbar";

export async function SiteHeader() {
  const session = await getPesertaSession();
  const account: PublicAccount | null = session
    ? { name: session.name, email: session.email, image: session.image }
    : null;
  return <Navbar account={account} />;
}
