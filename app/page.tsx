import "./prototype.css";
import { LandingPage } from "@/components/landing/landing-page";
import { Navbar } from "@/components/landing/navbar";
import Link from "next/link";

export default function HomePage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <LandingPage />
      </main>
      <footer style={{ background: "#fff", color: "#64748b", padding: "50px 0 30px", borderTop: "1px solid #e2e8f0", fontSize: "0.88rem" }}>
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 24 }}>
            <div>
              <div style={{ fontWeight: 800, color: "#0f172a", fontSize: "1.25rem" }}>
                Bisnis<span style={{ color: "#059669" }}>LevelUp</span>
              </div>
              <p style={{ maxWidth: 420, marginTop: 8 }}>
                Platform audit fase bisnis untuk membantu entrepreneur Indonesia tumbuh lebih terarah.
              </p>
            </div>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <a href="#features-section">Fitur</a>
              <a href="#pricing-section">Harga</a>
              <a href="#faq-section">FAQ</a>
              <Link href="/panel" style={{ color: "#059669", fontWeight: 600 }}>
                Panel Admin
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
