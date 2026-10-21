import Link from "next/link";
import { getPesertaSession } from "@/lib/auth/session";
import { getReport, listCatalog, listOwnedAudits, listReports } from "@/lib/db/portal";
import { statusLabel } from "@/lib/portal/labels";
import { suggestUpsells } from "@/lib/portal/upsell";

export const dynamic = "force-dynamic";

export default async function LaporanPage({ searchParams }: { searchParams: Promise<{ sesi?: string }> }) {
  const session = await getPesertaSession();
  if (!session?.id) return null;
  const customerId = session.id;
  const { sesi } = await searchParams;
  const reports = await listReports(customerId);
  const sessionId = sesi || reports[0]?.session_id;
  if (!sessionId) {
    return (
      <section style={{ background: "#fff", borderRadius: 24, padding: 20, border: "1px solid #e2e8f0" }}>
        <h1>Laporan belum ada</h1>
        <p>Selesaikan satu instrumen audit untuk membuka diagnosis.</p>
        <Link href="/akun/audit">Ke lembar audit</Link>
      </section>
    );
  }
  const [report, catalog, owned] = await Promise.all([
    getReport(customerId, sessionId),
    listCatalog(),
    listOwnedAudits(customerId),
  ]);
  if (!report) return <p>Laporan tidak ditemukan.</p>;
  const label = statusLabel(report.status);
  const upsells = suggestUpsells(report, catalog, owned.map((item) => item.code));

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0 }}>Laporan {report.company || report.respondent}</h1>
          <p style={{ color: "#64748b" }}>{report.auditName}</p>
        </div>
        <a href={`/api/akun/laporan/${report.sessionId}/pdf`} style={{ background: "#059669", color: "#fff", borderRadius: 999, padding: "12px 16px", fontWeight: 800 }}>
          Unduh PDF
        </a>
      </div>
      {reports.length > 1 ? (
        <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
          {reports.map((item) => (
            <Link key={item.session_id} href={`/akun/laporan?sesi=${item.session_id}`} style={{ whiteSpace: "nowrap", padding: "8px 12px", borderRadius: 999, background: item.session_id === sessionId ? "#0f172a" : "#fff", color: item.session_id === sessionId ? "#fff" : "#334155", fontWeight: 700 }}>
              {item.name}
            </Link>
          ))}
        </div>
      ) : null}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12 }}>
        <article style={{ background: "#fff", borderRadius: 20, padding: 20, border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 13, color: "#64748b" }}>{report.fromPhase}</div>
          <h2 style={{ margin: "6px 0" }}>{label.title}</h2>
          <span style={{ background: label.bg, color: label.color, borderRadius: 999, padding: "4px 10px", fontWeight: 800 }}>{label.tone}</span>
          {report.crisis ? <p>{report.crisis}</p> : null}
          <p>Butir kunci Tidak: {report.keyTidak} / {report.keyTotal}</p>
        </article>
        <article style={{ background: "#fff", borderRadius: 20, padding: 20, border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 42, fontWeight: 900, color: "#d97706" }}>{Number(report.score).toFixed(1)}%</div>
          <div>Jawaban Ya {report.ya} dari {report.total} butir</div>
        </article>
      </section>
      <section style={{ background: "#fff", borderRadius: 20, padding: 20, border: "1px solid #e2e8f0", display: "grid", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Kesehatan seksi</h2>
        {report.sections.map((section) => (
          <div key={section.code}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontWeight: 700 }}>
              <span>{section.code}. {section.name}{section.keyPass ? "" : " · kunci gagal"}</span>
              <span>{Number(section.score).toFixed(0)}%</span>
            </div>
            <div style={{ height: 10, background: "#f1f5f9", borderRadius: 999 }}>
              <div style={{ width: `${Math.min(100, Number(section.score))}%`, height: "100%", background: section.color, borderRadius: 999 }} />
            </div>
          </div>
        ))}
      </section>
      <section style={{ background: "#fff", borderRadius: 20, padding: 20, border: "1px solid #e2e8f0" }}>
        <h2>Butir yang dijawab Tidak</h2>
        {report.gaps.length === 0 ? <p>Tidak ada.</p> : (
          <ul style={{ paddingLeft: 18 }}>
            {report.gaps.map((gap) => (
              <li key={gap.number} style={{ marginBottom: 8 }}>
                {gap.isKey ? <strong>Prioritas kritis · </strong> : null}
                #{gap.number} {gap.section}: {gap.text}
              </li>
            ))}
          </ul>
        )}
      </section>
      <section style={{ background: "#fff", borderRadius: 20, padding: 20, border: "1px solid #e2e8f0" }}>
        <h2>Rekomendasi</h2>
        {report.recommendations.length === 0 ? <p>Belum ada rekomendasi yang terpicu dari jawaban Tidak.</p> : (
          <div style={{ display: "grid", gap: 10 }}>
            {report.recommendations.map((item) => (
              <article key={item.id}>
                <div style={{ fontSize: 12, fontWeight: 800, color: item.critical ? "#b45309" : "#64748b" }}>
                  {item.critical ? "PRIORITAS KRITIS · " : ""}{item.type}
                </div>
                <strong>{item.title}</strong>
                <p style={{ margin: "4px 0", color: "#475569" }}>{item.description}</p>
              </article>
            ))}
          </div>
        )}
        <h3>30 / 60 / 90 hari</h3>
        <p>30 hari: tutup butir kunci yang masih Tidak.</p>
        <p>60 hari: angkat seksi di bawah 80%.</p>
        <p>90 hari: ulangi audit setelah fondasi tertutup.</p>
        {report.nextPhase ? <p>Fase berikutnya: {report.nextPhase}</p> : null}
      </section>
      {upsells.length ? (
        <section className="catalog-grid">
          {upsells.map((item) => (
            <article key={item.product.code} style={{ background: "#fff", borderRadius: 20, padding: 16, border: "1px solid #e2e8f0" }}>
              <div style={{ color: "#64748b" }}>{item.reason}</div>
              <h3>{item.product.name}</h3>
              <Link href={`/checkout?product=${item.product.code}`} style={{ fontWeight: 800, color: "#047857" }}>Checkout</Link>
            </article>
          ))}
        </section>
      ) : null}
    </div>
  );
}
