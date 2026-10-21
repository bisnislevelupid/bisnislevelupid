import { redirect } from "next/navigation";
import { GoogleButton } from "@/components/auth/google-button";
import { getSuperadminSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function MasukAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSuperadminSession();
  if (session) redirect("/panel");
  const { error } = await searchParams;
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#071512", padding: 24, color: "#ecfdf5" }}>
      <section style={{ width: "min(440px, 100%)", background: "#0c1f1b", border: "1px solid rgba(52,211,153,.25)", borderRadius: 20, padding: 32 }}>
        <p style={{ color: "#6ee7b7", fontWeight: 800, letterSpacing: "0.08em", fontSize: "0.72rem" }}>SUPERADMIN</p>
        <h1 style={{ fontSize: "1.7rem", margin: "8px 0 6px" }}>Masuk panel</h1>
        <p style={{ color: "#94a3b8", marginBottom: 24 }}>
          Hanya email yang sudah tercatat sebagai superadmin aktif. Akun peserta tidak membuka panel ini.
        </p>
        {error ? (
          <p style={{ background: "rgba(127,29,29,.45)", color: "#fecaca", borderRadius: 12, padding: "10px 12px", marginBottom: 16, fontSize: "0.88rem" }}>
            Akun Google ini bukan superadmin aktif.
          </p>
        ) : null}
        <GoogleButton realm="superadmin" callbackUrl="/panel" dark />
      </section>
    </main>
  );
}
