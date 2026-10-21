import { redirect } from "next/navigation";
import { GoogleButton } from "@/components/auth/google-button";
import { getPesertaSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function MasukPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getPesertaSession();
  if (session) redirect("/akun");
  const { error } = await searchParams;
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "linear-gradient(180deg,#f0fdf4,#fff)", padding: 24 }}>
      <section style={{ width: "min(440px, 100%)", background: "#fff", border: "1px solid #d1fae5", borderRadius: 24, padding: 32, boxShadow: "0 20px 50px rgba(5,150,105,.08)" }}>
        <p style={{ color: "#059669", fontWeight: 800, letterSpacing: "0.04em", fontSize: "0.78rem" }}>BISNISLEVELUP.ID</p>
        <h1 style={{ fontSize: "1.8rem", margin: "8px 0 6px" }}>Masuk peserta</h1>
        <p style={{ color: "#64748b", marginBottom: 24 }}>Gunakan akun Google yang sama dengan email pembelian audit Anda.</p>
        {error ? (
          <p style={{ background: "#fef2f2", color: "#b91c1c", borderRadius: 12, padding: "10px 12px", marginBottom: 16, fontSize: "0.88rem" }}>
            Login Google ditolak. Akun nonaktif atau tidak bisa dibuat.
          </p>
        ) : null}
        <GoogleButton realm="peserta" callbackUrl="/akun" />
      </section>
    </main>
  );
}
