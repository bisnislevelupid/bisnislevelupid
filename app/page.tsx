import "./prototype.css";
import { LandingPage } from "@/components/landing/landing-page";
import { SiteHeader } from "@/components/landing/site-header";
import { Wordmark } from "@/components/shared/wordmark";
import { getPesertaSession } from "@/lib/auth/session";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getPesertaSession();
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <SiteHeader />
      <main style={{ flex: 1 }}>
        <LandingPage />
      </main>
      <footer style={{ background: "#fff", color: "#64748b", padding: "50px 0 30px", borderTop: "1px solid #e2e8f0", fontSize: "0.88rem" }}>
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 24 }}>
            <div>
              <Wordmark size="1.25rem" />
              <p style={{ maxWidth: 420, marginTop: 8 }}>
                Platform audit fase bisnis untuk membantu entrepreneur Indonesia tumbuh lebih terarah.
              </p>
            </div>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <a href="#features-section">Fitur</a>
              <a href="#pricing-section">Harga</a>
              <a href="#faq-section">FAQ</a>
              <Link href={session ? "/akun" : "/masuk"} style={{ color: "#059669", fontWeight: 600 }}>
                {session ? "Akun" : "Masuk"}
              </Link>
            </div>
          </div>
          <div style={{ borderTop: "1px solid #f1f5f9", marginTop: 28, paddingTop: 16, fontSize: "0.78rem", color: "#94a3b8" }}>
            © 2026 BisnisLevelUp. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
