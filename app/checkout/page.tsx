import Link from "next/link";
import { getPesertaSession } from "@/lib/auth/session";
import { getCheckoutProfile, listAuditInstruments, listPaymentMethods, listPublicProducts } from "@/lib/db/public";
import { SiteHeader } from "@/components/landing/site-header";
import { CheckoutForm } from "./checkout-form";
import "../prototype.css";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>;
}) {
  const { product } = await searchParams;
  const session = await getPesertaSession();
  const [products, methods, instruments, profile] = await Promise.all([
    listPublicProducts(),
    listPaymentMethods(),
    listAuditInstruments(),
    session ? getCheckoutProfile(session.id) : Promise.resolve(null),
  ]);
  const selected = products.find((item) => item.code === product)?.code ?? products.find((item) => item.is_featured)?.code ?? products[0]?.code;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <SiteHeader />
      <main style={{ padding: "40px 0 80px" }}>
        <div className="container" style={{ maxWidth: 1040 }}>
          <Link
            href="/#pricing-section"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#64748b", fontWeight: 600, marginBottom: 24 }}
          >
            ← Kembali ke Informasi Paket
          </Link>
          <h1 style={{ fontSize: "2.1rem", marginBottom: 8 }}>Formulir Pembelian & Checkout</h1>
          <p style={{ color: "#64748b", marginBottom: 32 }}>
            Isi data perusahaan Anda untuk penerbitan lisensi instrumen audit dan invoice resmi.
          </p>
          {selected ? (
            <CheckoutForm
              products={products}
              methods={methods}
              instruments={instruments}
              profile={profile}
              initialCode={selected}
              restoreProduct={!product}
            />
          ) : (
            <p>Paket belum tersedia.</p>
          )}
        </div>
      </main>
    </div>
  );
}
