import Link from "next/link";
import { getPesertaSession } from "@/lib/auth/session";
import { listCatalog, listOwnedAudits, listReports } from "@/lib/db/portal";
import { getReportDocument, getSupportWhatsapp } from "@/lib/db/report";
import { KEY_NA_NOTE, crisisGateLabel, formatAuditScore, isRiskSection, riskAreaNote, scoreBasisLine } from "@/lib/pdf/format";
import { buildReportCtas } from "@/lib/portal/ctas";
import { formatWib, statusLabel } from "@/lib/portal/labels";
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
  const [report, catalog, owned, whatsapp] = await Promise.all([
    getReportDocument(customerId, sessionId, { origin: "" }),
    listCatalog(),
    listOwnedAudits(customerId),
    getSupportWhatsapp(),
  ]);
  if (!report) return <p>Laporan tidak ditemukan.</p>;
  const label = statusLabel(report.status);
  const ctas = buildReportCtas({ status: report.status, auditCode: report.auditCode, origin: "", whatsapp });
  const upsells = ctas.suppressProducts
    ? []
    : suggestUpsells(
        {
          status: report.status,
          auditCode: report.auditCode,
          sections: report.sections,
          gaps: report.sections.flatMap((section) => section.gaps),
        },
        catalog,
        owned.map((item) => item.code),
      );
  const scoreText = formatAuditScore(report.score, report.status);
  const gateLabel = crisisGateLabel({ status: report.status, phaseNumber: report.fromPhaseNumber, crisisTitle: report.crisis });
  const riskSections = report.sections.filter((section) => isRiskSection(section.score));

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0 }}>Laporan {report.company || report.respondent}</h1>
          <p style={{ color: "#64748b" }}>{report.auditName}</p>
          <p style={{ color: "#64748b", marginTop: 0 }}>Selesai {formatWib(report.completedAt) || "—"}</p>
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
          <div style={{ fontSize: 13, color: "#64748b" }}>{report.fromPhase} → {report.toPhase}</div>
          <h2 style={{ margin: "6px 0" }}>{label.title}</h2>
          <span style={{ background: label.bg, color: label.color, borderRadius: 999, padding: "4px 10px", fontWeight: 800 }}>{label.tone}</span>
          <p>{label.meaning}</p>
          {gateLabel ? <p>{gateLabel}</p> : null}
        </article>
        <article style={{ background: "#fff", borderRadius: 20, padding: 20, border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: scoreText.length > 12 ? 28 : 42, fontWeight: 900, color: report.status === "TIDAK_DAPAT_DINILAI" ? "#64748b" : "#d97706" }}>{scoreText}</div>
          <div>{scoreBasisLine(report)}</div>
        </article>
      </section>
      {report.narrative ? (
        <section style={{ background: "#fff", borderRadius: 20, padding: 20, border: "1px solid #e2e8f0" }}>
          <h2 style={{ marginTop: 0 }}>{report.narrative.headline}</h2>
          {report.narrative.summary.split("\n\n").map((paragraph) => (
            <p key={paragraph.slice(0, 40)}>{paragraph}</p>
          ))}
        </section>
      ) : null}
      {report.triad ? (
        <section style={{ background: "#fff", borderRadius: 20, padding: 20, border: "1px solid #e2e8f0" }}>
          <h2 style={{ marginTop: 0 }}>Sistem, kas, dan orang</h2>
          {report.triad.map((group) => (
            <p key={group.id}>{group.label}: {group.ready ? "gerbang lulus" : "gerbang belum"}{group.scorePct === null ? "" : ` · pendukung ${group.scorePct}%`}</p>
          ))}
        </section>
      ) : null}
      {report.agBlock ? (
        <section style={{ background: "#fff", borderRadius: 20, padding: 20, border: "1px solid #e2e8f0" }}>
          <h2 style={{ marginTop: 0 }}>Lean Again dan identitas</h2>
          <p>{report.agBlock.warning ? "A dan G harus berjalan bersamaan." : report.agBlock.ready ? "A dan G sama-sama lulus." : "A dan G belum sama-sama lulus."}</p>
        </section>
      ) : null}
      <section style={{ background: "#fff", borderRadius: 20, padding: 20, border: "1px solid #e2e8f0", display: "grid", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Kesehatan seksi</h2>
        {report.sections.map((section) => (
          <div key={section.code}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontWeight: 700 }}>
              <span>{section.code}. {section.name}{section.keyPass ? "" : " · kunci gagal"}{isRiskSection(section.score) ? " · Area risiko" : ""}</span>
              <span>{section.score === null ? "—" : `${Math.round(section.score)}%`}</span>
            </div>
            <div style={{ height: 10, background: "#f1f5f9", borderRadius: 999 }}>
              <div style={{ width: `${section.score === null ? 0 : Math.min(100, section.score)}%`, height: "100%", background: section.score === null ? "#94a3b8" : section.score >= 80 ? "#059669" : section.score >= 60 ? "#d97706" : "#dc2626", borderRadius: 999 }} />
            </div>
          </div>
        ))}
      </section>
      {riskSections.length ? (
        <section style={{ background: "#fff", borderRadius: 20, padding: 20, border: "1px solid #e2e8f0" }}>
          <h2 style={{ marginTop: 0 }}>Area risiko</h2>
          <p>{riskAreaNote(report.status)}</p>
          <ul style={{ paddingLeft: 18 }}>
            {riskSections.map((section) => (
              <li key={section.code}>
                Seksi {section.code}. {section.name}: {section.score === null ? "—" : `${section.score}%`}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {report.skippedKeys.length ? (
        <section style={{ background: "#fff", borderRadius: 20, padding: 20, border: "1px solid #e2e8f0" }}>
          <h2>Butir kunci yang dilewati</h2>
          <ul style={{ paddingLeft: 18 }}>
            {report.skippedKeys.map((item) => (
              <li key={item.number} style={{ marginBottom: 8 }}>
                #{item.number} {item.sectionName}: {item.text}
                <div>{KEY_NA_NOTE}</div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <section style={{ background: "#fff", borderRadius: 20, padding: 20, border: "1px solid #e2e8f0" }}>
        <h2>Butir yang dijawab Tidak</h2>
        {report.sections.every((section) => section.gaps.length === 0) ? <p>Tidak ada.</p> : (
          <ul style={{ paddingLeft: 18 }}>
            {report.sections.flatMap((section) => section.gaps).map((gap) => (
              <li key={`${gap.sectionCode}-${gap.number}`} style={{ marginBottom: 8 }}>
                {gap.isKey ? <strong>Prioritas kritis · </strong> : null}
                #{gap.number} {gap.sectionName}: {gap.text}
              </li>
            ))}
          </ul>
        )}
      </section>
      {ctas.items.length ? (
        <section style={{ display: "grid", gap: 12 }}>
          {ctas.items.map((item) => (
            <article key={item.label} style={{ background: "#fff", borderRadius: 20, padding: 16, border: "1px solid #e2e8f0" }}>
              <h2 style={{ marginTop: 0 }}>{item.label}</h2>
              <p style={{ color: "#475569" }}>{item.detail}</p>
              <a href={item.href} style={{ fontWeight: 800, color: "#047857" }}>{item.label}</a>
            </article>
          ))}
        </section>
      ) : null}
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
