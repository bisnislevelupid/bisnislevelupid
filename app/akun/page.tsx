import Link from "next/link";
import { getPesertaSession } from "@/lib/auth/session";
import { getReport, listCatalog, listOwnedAudits, listPortalOrders, listReports } from "@/lib/db/portal";
import { rupiah, statusLabel } from "@/lib/portal/labels";
import { suggestUpsells } from "@/lib/portal/upsell";

export const dynamic = "force-dynamic";

export default async function AkunHome() {
  const session = await getPesertaSession();
  if (!session?.id) return null;
  const customerId = session.id;
  const [owned, orders, reports, catalog] = await Promise.all([
    listOwnedAudits(customerId),
    listPortalOrders(customerId),
    listReports(customerId),
    listCatalog(),
  ]);
  const latest = reports[0] ? await getReport(customerId, reports[0].session_id) : null;
  const upsells = suggestUpsells(latest, catalog, owned.map((item) => item.code));
  const paid = orders.filter((order) => order.status === "PAID").length;

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <section style={{ background: "linear-gradient(135deg,#059669,#047857)", color: "#fff", borderRadius: 24, padding: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.4 }}>AREA MEMBER</div>
        <h1 style={{ fontSize: "clamp(1.4rem, 4vw, 2rem)", margin: "8px 0" }}>Selamat datang, {session?.name}</h1>
        <p style={{ opacity: 0.9, marginBottom: 16 }}>{paid} pesanan lunas · {reports.length} laporan selesai</p>
        <div className="hero-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/akun/audit" style={{ background: "#fff", color: "#047857", borderRadius: 999, padding: "12px 16px", fontWeight: 800 }}>
            Mulai / lanjutkan audit
          </Link>
          <Link href="/akun/layanan" style={{ border: "1px solid rgba(255,255,255,.5)", borderRadius: 999, padding: "12px 16px", fontWeight: 800 }}>
            Beli layanan lain
          </Link>
        </div>
      </section>

      <section style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 24, padding: 20 }}>
        <h2 style={{ marginTop: 0 }}>Paket audit Anda</h2>
        {owned.length === 0 ? (
          <p style={{ color: "#64748b" }}>
            Belum ada instrumen yang lunas. <Link href="/checkout">Beli paket audit</Link>
          </p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {owned.map((item) => (
              <article key={item.code} style={{ border: "1px solid #e2e8f0", borderRadius: 16, padding: 16, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <strong>{item.name}</strong>
                  <div style={{ color: "#64748b", fontSize: 14 }}>
                    {item.session?.status === "COMPLETED"
                      ? "Selesai"
                      : item.session
                        ? `Berjalan · ${item.session.answered}/${item.session.total} butir`
                        : "Belum mulai"}
                  </div>
                </div>
                <Link href={item.session?.status === "COMPLETED" ? `/akun/laporan?sesi=${item.session.id}` : "/akun/audit"} style={{ background: "#059669", color: "#fff", borderRadius: 999, padding: "10px 14px", fontWeight: 800 }}>
                  {item.session?.status === "COMPLETED" ? "Lihat laporan" : "Kerjakan"}
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>

      {reports[0] ? (
        <section style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 24, padding: 20 }}>
          <h2 style={{ marginTop: 0 }}>Laporan terakhir</h2>
          <p>
            {reports[0].name} · {statusLabel(reports[0].status).title} · {reports[0].score}%
          </p>
          <Link href={`/akun/laporan?sesi=${reports[0].session_id}`} style={{ fontWeight: 800, color: "#047857" }}>
            Buka diagnosis
          </Link>
        </section>
      ) : null}

      {upsells.length ? (
        <section style={{ display: "grid", gap: 12 }}>
          <h2 style={{ margin: 0 }}>Layanan yang relevan</h2>
          <div className="catalog-grid">
            {upsells.map((item) => (
              <article key={item.product.code} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, padding: 16 }}>
                <div style={{ color: "#64748b", fontSize: 14 }}>{item.reason}</div>
                <h3 style={{ margin: "8px 0" }}>{item.product.name}</h3>
                <strong style={{ color: "#059669" }}>{rupiah(item.product.price)}</strong>
                <div style={{ marginTop: 12 }}>
                  <Link href={`/checkout?product=${item.product.code}`} style={{ fontWeight: 800, color: "#047857" }}>
                    Checkout
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
