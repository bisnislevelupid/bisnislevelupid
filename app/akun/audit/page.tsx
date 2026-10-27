import Link from "next/link";
import { getPesertaSession } from "@/lib/auth/session";
import { getInstrument, getPortalCustomer, getSessionBundle, listOwnedAudits } from "@/lib/db/portal";
import { AuditRunner } from "./runner";
import { StartAuditForm } from "./start-form";

export const dynamic = "force-dynamic";

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ sesi?: string }> }) {
  const session = await getPesertaSession();
  if (!session?.id) return null;
  const customerId = session.id;
  const { sesi } = await searchParams;
  const [owned, customer] = await Promise.all([listOwnedAudits(customerId), getPortalCustomer(customerId)]);
  const requested = sesi ? owned.find((item) => item.session?.id === sesi) : undefined;

  if (requested?.session?.status === "COMPLETED") {
    return (
      <p>
        Sesi ini sudah dikirim. <Link href={`/akun/laporan?sesi=${sesi}`}>Lihat laporan</Link>
      </p>
    );
  }

  const running =
    (requested?.session?.status === "IN_PROGRESS" ? requested : undefined) ??
    (!sesi ? owned.find((item) => item.session?.status === "IN_PROGRESS") : undefined);
  const sessionId = running?.session?.status === "IN_PROGRESS" ? running.session.id : "";
  if (!sessionId || !running) {
    return (
      <section style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 24, padding: 20 }}>
        <h1 style={{ marginTop: 0 }}>{owned.length ? "Sebelum mulai" : "Audit belum terbuka"}</h1>
        <p style={{ color: "#64748b" }}>
          {owned.length
            ? "Isi profil pengisi. Jawaban nanti tersimpan dan bisa dilanjutkan."
            : "Instrumen muncul setelah pembayaran pesanan berstatus lunas."}
        </p>
        {owned.length ? (
          <StartAuditForm
            options={owned}
            defaults={{
              name: customer?.name ?? "",
              company: customer?.business_name ?? "",
              field: customer?.business_field ?? "",
              year: customer?.business_start_year ?? null,
            }}
          />
        ) : (
          <Link href="/#pricing-section" style={{ fontWeight: 800, color: "#047857" }}>
            Beli paket audit
          </Link>
        )}
      </section>
    );
  }

  const bundle = await getSessionBundle(customerId, sessionId);
  if (!bundle) return <p>Sesi tidak ditemukan.</p>;
  const instrument = await getInstrument(bundle.session.audit_code);
  if (!instrument?.sections?.length || !instrument.questions?.length) return <p>Instrumen tidak tersedia.</p>;

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>{instrument.name}</h1>
      <p style={{ color: "#64748b" }}>{instrument.fromPhase} menuju {instrument.toPhase}</p>
      <AuditRunner instrument={instrument} sessionId={sessionId} initialAnswers={bundle.answers} locked={bundle.session.locked} />
    </div>
  );
}
