import Link from "next/link";
import { listCatalog } from "@/lib/db/portal";
import { FOUNDATION_OFFERS } from "@/lib/portal/foundations";
import { rupiah } from "@/lib/portal/labels";

export const dynamic = "force-dynamic";

export default async function LayananPage() {
  const products = await listCatalog();
  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Beli layanan dan program lanjutan</h1>
      <p style={{ color: "#64748b" }}>Pilih pendampingan atau instrumen berikutnya. Checkout memakai alur pembayaran yang sudah ada.</p>
      <div className="catalog-grid" style={{ marginBottom: 16 }}>
        {FOUNDATION_OFFERS.map((offer) => (
          <article id={offer.code} key={offer.code} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, padding: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#c2410c" }}>KELAS & EBOOK FONDASI</div>
            <h2 style={{ margin: "8px 0" }}>{offer.name}</h2>
            <p style={{ color: "#475569" }}>{offer.summary}</p>
            <p>{offer.modules}</p>
          </article>
        ))}
      </div>
      <div className="catalog-grid">
        {products.map((product) => (
          <article key={product.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#059669" }}>{product.type}</div>
            <h2 style={{ margin: 0, fontSize: "1.15rem" }}>{product.name}</h2>
            <p style={{ color: "#64748b", flex: 1 }}>{product.short_desc}</p>
            {product.price_strikethrough ? (
              <div style={{ color: "#94a3b8", textDecoration: "line-through" }}>{rupiah(product.price_strikethrough)}</div>
            ) : null}
            <strong style={{ fontSize: "1.4rem", color: "#059669" }}>{rupiah(product.price)}</strong>
            <Link href={`/checkout?product=${product.code}`} style={{ background: "#059669", color: "#fff", borderRadius: 999, textAlign: "center", padding: "12px 14px", fontWeight: 800 }}>
              Checkout layanan ini
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
