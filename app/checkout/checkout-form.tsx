"use client";

import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Product = {
  code: string;
  name: string;
  short_desc: string | null;
  price: string;
  is_featured: boolean;
  type: string;
};

type Instrument = { code: string; name: string };

type Profile = {
  name: string;
  email: string;
  phone: string;
  businessName: string;
  businessField: string;
  businessCity: string;
  businessStartYear: string;
  employeeRange: string;
  monthlyRevenue: string;
  ownerRole: string;
};

type Method = {
  id: string;
  code: string;
  name: string;
  logo_url: string | null;
  type: string;
  provider: string;
  account_number?: string | null;
  account_holder?: string | null;
};

const DRAFT_KEY = "blu-checkout-draft";
const patterns = {
  name: /^[A-Za-zÀ-ÿ'’. -]{2,80}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^(?:\+62|62|0)?8\d{8,12}$/,
  businessName: /^[\w\s&.'’,-]{2,120}$/,
  coupon: /^[A-Za-z0-9]{4,20}$/,
};

function rupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

function isSingleAudit(product: Product | undefined) {
  return product?.type === "SINGLE_AUDIT" || product?.code === "audit-satu-fase";
}

function defaultMethodId(methods: Method[]) {
  return methods.find((method) => method.provider === "Manual" || method.type === "bank_transfer")?.id ?? methods[0]?.id ?? "";
}

function methodHint(method: Method) {
  const number = method.account_number?.trim();
  if (number) {
    const holder = method.account_holder?.trim();
    return holder ? `Rekening ${number} a.n. ${holder}` : `Rekening ${number}`;
  }
  if (method.provider === "Manual" || method.type === "bank_transfer") {
    return "Nomor rekening mengikuti pengaturan metode bayar";
  }
  return `Konfirmasi instan via ${method.provider}`;
}

function assurance(method: Method | undefined) {
  if (method?.provider === "Manual" || method?.type === "bank_transfer") {
    return "Transfer ke rekening yang tertera di metode ini. Admin menandai lunas setelah dana masuk.";
  }
  if (method?.provider === "Midtrans") return "Pembayaran diamankan oleh Midtrans";
  return "Pembayaran diamankan oleh Xendit";
}

export function CheckoutForm({
  products,
  methods,
  instruments,
  profile = null,
  initialCode,
  restoreProduct = false,
}: {
  products: Product[];
  methods: Method[];
  instruments: Instrument[];
  profile?: Profile | null;
  initialCode: string;
  restoreProduct?: boolean;
}) {
  const router = useRouter();
  const lockedEmail = Boolean(profile?.email);
  const [productCode, setProductCode] = useState(initialCode);
  const [methodId, setMethodId] = useState(defaultMethodId(methods));
  const [auditCode, setAuditCode] = useState("");
  const [fields, setFields] = useState({
    name: profile?.name ?? "",
    email: profile?.email ?? "",
    phone: profile?.phone ?? "",
    businessName: profile?.businessName ?? "",
    businessField: profile?.businessField ?? "",
    businessCity: profile?.businessCity ?? "",
    businessStartYear: profile?.businessStartYear ?? "",
    employeeRange: profile?.employeeRange ?? "",
    monthlyRevenue: profile?.monthlyRevenue ?? "",
    ownerRole: profile?.ownerRole ?? "",
  });
  const [fieldError, setFieldError] = useState<Record<string, string>>({});
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponNote, setCouponNote] = useState("");
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<"" | "create" | "redirect">("");
  const [agreed, setAgreed] = useState(false);
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftJson = useRef<string | null>(null);

  function flushDraft() {
    if (draftTimer.current) {
      clearTimeout(draftTimer.current);
      draftTimer.current = null;
    }
    if (draftJson.current) localStorage.setItem(DRAFT_KEY, draftJson.current);
  }

  function clearDraft() {
    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = null;
    draftJson.current = null;
    localStorage.removeItem(DRAFT_KEY);
  }

  function writeDraft(next: {
    fields: typeof fields;
    methodId: string;
    coupon: string;
    productCode: string;
    agreed: boolean;
    auditCode: string;
  }) {
    draftJson.current = JSON.stringify(next);
    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(flushDraft, 250);
  }

  useEffect(() => {
    const onHide = () => flushDraft();
    window.addEventListener("pagehide", onHide);
    return () => {
      window.removeEventListener("pagehide", onHide);
      flushDraft();
    };
  }, []);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- hydrate the saved checkout draft once */
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Partial<typeof fields> & {
        fields?: Partial<typeof fields>;
        methodId?: string;
        coupon?: string;
        productCode?: string;
        agreed?: boolean;
        auditCode?: string;
      };
      const saved = { ...parsed, ...parsed.fields };
      setFields((prev) => ({
        ...prev,
        name: profile?.name || saved.name || prev.name,
        email: profile?.email || saved.email || prev.email,
        phone: profile?.phone || saved.phone || prev.phone,
        businessName: saved.businessName || profile?.businessName || prev.businessName,
        businessField: saved.businessField || profile?.businessField || prev.businessField,
        businessCity: saved.businessCity || profile?.businessCity || prev.businessCity,
        businessStartYear: saved.businessStartYear || profile?.businessStartYear || prev.businessStartYear,
        employeeRange: saved.employeeRange || profile?.employeeRange || prev.employeeRange,
        monthlyRevenue: saved.monthlyRevenue || profile?.monthlyRevenue || prev.monthlyRevenue,
        ownerRole: saved.ownerRole || profile?.ownerRole || prev.ownerRole,
      }));
      if (saved.auditCode && instruments.some((item) => item.code === saved.auditCode)) {
        setAuditCode(saved.auditCode);
      }
      if (saved.methodId && methods.some((item) => String(item.id) === String(saved.methodId))) {
        setMethodId(String(saved.methodId));
      }
      if (saved.coupon) setCoupon(saved.coupon);
      if (restoreProduct && saved.productCode && products.some((item) => item.code === saved.productCode)) {
        setProductCode(saved.productCode);
      }
      if (saved.agreed) setAgreed(true);
    } catch {
      clearDraft();
    }
    // Muat sekali. Jangan tulis ulang di sini, supaya draft tidak tertimpa nilai kosong.
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const product = products.find((item) => item.code === productCode) ?? products[0];
  const selectedMethod = methods.find((item) => String(item.id) === String(methodId));
  const subtotal = Number(product?.price ?? 0);
  const total = Math.max(0, subtotal - discount);

  function setField(name: keyof typeof fields, value: string) {
    setFields((prev) => {
      const next = { ...prev, [name]: value };
      writeDraft({ fields: next, methodId, coupon, productCode, agreed, auditCode });
      return next;
    });
  }

  function chooseMethod(id: string) {
    setMethodId(id);
    writeDraft({ fields, methodId: id, coupon, productCode, agreed, auditCode });
  }

  function chooseProduct(code: string) {
    setProductCode(code);
    setApplied("");
    setDiscount(0);
    setCouponNote("");
    writeDraft({ fields, methodId, coupon, productCode: code, agreed, auditCode });
    window.history.replaceState(null, "", `/checkout?product=${code}`);
  }

  function validateFields() {
    const next: Record<string, string> = {};
    if (!patterns.name.test(fields.name.trim())) next.name = "Nama hanya huruf, minimal 2 karakter";
    if (!patterns.email.test(fields.email.trim())) next.email = "Email tidak valid";
    if (!patterns.phone.test(fields.phone.replace(/[\s-]/g, ""))) next.phone = "Nomor WA contoh 081234567890";
    if (!patterns.businessName.test(fields.businessName.trim())) next.businessName = "Nama bisnis 2–120 karakter";
    if (!fields.businessField) next.businessField = "Pilih bidang bisnis";
    if (fields.businessCity.trim().length < 2) next.businessCity = "Isi kota bisnis";
    if (!/^(19|20)\d{2}$/.test(fields.businessStartYear)) next.businessStartYear = "Tahun mulai 4 digit";
    if (!fields.employeeRange) next.employeeRange = "Pilih jumlah tim";
    if (!fields.monthlyRevenue) next.monthlyRevenue = "Pilih kisaran omzet";
    if (!fields.ownerRole) next.ownerRole = "Pilih peran Anda";
    if (isSingleAudit(product) && !instruments.some((item) => item.code === auditCode)) {
      next.auditCode = "Pilih instrumen audit";
    }
    setFieldError(next);
    return Object.keys(next).length === 0;
  }

  async function applyCoupon() {
    setCouponNote("");
    setError("");
    const code = coupon.trim();
    if (!patterns.coupon.test(code)) {
      setCouponNote("Format kupon: 4–20 huruf atau angka");
      setApplied("");
      setDiscount(0);
      return;
    }
    const res = await fetch("/api/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, productCode }),
    });
    const json = await res.json();
    if (!res.ok) {
      setApplied("");
      setDiscount(0);
      setCouponNote(json.error ?? "Kupon ditolak");
      return;
    }
    setApplied(code.toUpperCase());
    setDiscount(json.data.discount);
    setCouponNote(`Diskon ${rupiah(json.data.discount)} diterapkan`);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (phase) return;
    setPhase("create");
    setError("");
    if (!validateFields() || !agreed) {
      setPhase("");
      if (!agreed) setError("Centang persetujuan ketentuan layanan.");
      return;
    }
    let res: Response;
    try {
      res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productCode,
        name: fields.name.trim(),
        email: fields.email.trim(),
        phone: fields.phone.replace(/[\s-]/g, "").replace(/^(?:\+62|62)/, "0").replace(/^(8)/, "0$1"),
        businessName: fields.businessName.trim(),
        businessField: fields.businessField,
        businessCity: fields.businessCity.trim(),
        businessStartYear: Number(fields.businessStartYear),
        employeeRange: fields.employeeRange,
        monthlyRevenue: fields.monthlyRevenue,
        ownerRole: fields.ownerRole,
        paymentMethodId: methodId,
        coupon: applied || undefined,
        auditCode: isSingleAudit(product) ? auditCode : undefined,
        agree: agreed,
      }),
    });
    } catch {
      setPhase("");
      setError("Checkout gagal. Periksa koneksi lalu coba lagi.");
      return;
    }
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setPhase("");
      setError(json.error ?? "Checkout gagal");
      return;
    }
    clearDraft();
    setPhase("redirect");
    if (json.data?.redirect) {
      window.location.href = json.data.redirect;
      return;
    }
    router.push(`/bayar/${json.data.invoice}`);
  }

  return (
    <form onSubmit={onSubmit}>
      <style>{`
        @media (max-width: 720px) {
          .checkout-pair { grid-template-columns: 1fr !important; }
        }
        @keyframes checkout-spin { to { transform: rotate(360deg); } }
      `}</style>
      {phase ? (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            background: "rgba(15,23,42,.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <div style={{ background: "#fff", borderRadius: 16, padding: "28px 32px", textAlign: "center", maxWidth: 320 }}>
            <div
              aria-hidden="true"
              style={{
                width: 36,
                height: 36,
                margin: "0 auto 14px",
                borderRadius: "50%",
                border: "3px solid #d1fae5",
                borderTopColor: "#059669",
                animation: "checkout-spin .8s linear infinite",
              }}
            />
            <strong>{phase === "redirect" ? "Mengalihkan ke pembayaran..." : "Membuat pesanan..."}</strong>
          </div>
        </div>
      ) : null}
      <fieldset disabled={Boolean(phase)} style={{ border: 0, margin: 0, padding: 0, minWidth: 0 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 32, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <section style={card}>
            <h3 style={stepTitle}>
              <span style={badge}>1</span> Data Pemilik & Usaha
            </h3>
            <div className="checkout-pair" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label="Nama Lengkap *" name="name" value={fields.name} error={fieldError.name} onChange={(v) => setField("name", v)} pattern={patterns.name.source} />
              <Field
                label="Email Aktif (untuk Laporan PDF) *"
                name="email"
                type="email"
                value={fields.email}
                error={fieldError.email}
                readOnly={lockedEmail}
                hint={lockedEmail ? "Email dikunci ke akun yang sedang masuk, supaya laporan tidak salah kirim." : undefined}
                onChange={(v) => setField("email", v)}
              />
              <Field label="Nomor WhatsApp *" name="phone" value={fields.phone} error={fieldError.phone} onChange={(v) => setField("phone", v)} pattern={patterns.phone.source} />
              <Field label="Nama Bisnis / Brand *" name="businessName" value={fields.businessName} error={fieldError.businessName} onChange={(v) => setField("businessName", v)} />
            </div>
            <label style={{ display: "block", marginTop: 16, fontSize: "0.88rem", fontWeight: 600 }}>
              Bidang Bisnis *
              <select
                name="businessField"
                required
                value={fields.businessField}
                onChange={(e) => setField("businessField", e.target.value)}
                style={{ ...input, marginTop: 6 }}
              >
                <option value="">Pilih bidang</option>
                {(
                  [
                    "Ritel & Grosir / Minimarket",
                    "F&B / Kuliner",
                    "Jasa Profesional",
                    "Manufaktur",
                    "Digital / Agensi",
                  ] as string[]
                )
                  .concat(
                    fields.businessField &&
                      !["Ritel & Grosir / Minimarket", "F&B / Kuliner", "Jasa Profesional", "Manufaktur", "Digital / Agensi"].includes(
                        fields.businessField,
                      )
                      ? [fields.businessField]
                      : [],
                  )
                  .map((item) => (
                    <option key={item}>{item}</option>
                  ))}
              </select>
              {fieldError.businessField ? <span style={{ color: "#dc2626", fontWeight: 500 }}>{fieldError.businessField}</span> : null}
            </label>
            <div className="checkout-pair" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
              <Field label="Kota bisnis *" name="businessCity" value={fields.businessCity} error={fieldError.businessCity} onChange={(v) => setField("businessCity", v)} />
              <Field label="Tahun mulai bisnis *" name="businessStartYear" value={fields.businessStartYear} error={fieldError.businessStartYear} onChange={(v) => setField("businessStartYear", v)} />
              <SelectField label="Peran Anda *" name="ownerRole" value={fields.ownerRole} error={fieldError.ownerRole} onChange={(v) => setField("ownerRole", v)} options={["Owner", "Co-founder", "Direktur", "Manajer operasional"]} />
              <SelectField label="Jumlah tim *" name="employeeRange" value={fields.employeeRange} error={fieldError.employeeRange} onChange={(v) => setField("employeeRange", v)} options={["Hanya saya", "2-5 orang", "6-20 orang", "21-50 orang", "Lebih dari 50"]} />
              <SelectField label="Omzet bulanan *" name="monthlyRevenue" value={fields.monthlyRevenue} error={fieldError.monthlyRevenue} onChange={(v) => setField("monthlyRevenue", v)} options={["Di bawah 50 juta", "50-200 juta", "200-500 juta", "500 juta - 2 miliar", "Di atas 2 miliar"]} />
            </div>
          </section>

          <section style={card}>
            <h3 style={stepTitle}>
              <span style={badge}>2</span> Pilih Metode Pembayaran
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {methods.map((method) => {
                const active = String(method.id) === String(methodId);
                return (
                  <label
                    key={method.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      textAlign: "left",
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: 14,
                      border: active ? "1.5px solid #10b981" : "1px solid #e2e8f0",
                      background: active ? "#f0fdf4" : "#fff",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={active}
                      onChange={() => chooseMethod(String(method.id))}
                    />
                    {method.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={method.logo_url} alt="" style={{ width: 42, height: 28, objectFit: "contain" }} />
                    ) : null}
                    <span style={{ flex: 1 }}>
                      <strong style={{ display: "block", fontSize: "0.92rem" }}>{method.name}</strong>
                      <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                        {methodHint(method)}
                      </span>
                    </span>
                    <span style={{ fontSize: "0.72rem", background: "#ecfeff", color: "#0369a1", borderRadius: 999, padding: "4px 8px", fontWeight: 700 }}>
                      Bebas Biaya Admin
                    </span>
                  </label>
                );
              })}
            </div>
          </section>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <section style={card}>
            <p style={{ fontWeight: 700, marginBottom: 12 }}>Paket yang Dipilih:</p>
            {products.map((item) => {
              const active = item.code === productCode;
              return (
                <label
                  key={item.code}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    justifyContent: "space-between",
                    width: "100%",
                    textAlign: "left",
                    marginBottom: 8,
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: active ? "1.5px solid #38bdf8" : "1px solid #e2e8f0",
                    background: active ? "#f0f9ff" : "#fff",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name="product"
                    checked={active}
                    onChange={() => chooseProduct(item.code)}
                  />
                  <span style={{ flex: 1 }}>
                    <strong style={{ display: "block" }}>{item.name}</strong>
                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{item.short_desc}</span>
                  </span>
                  <strong>{rupiah(Number(item.price))}</strong>
                </label>
              );
              })}
            {isSingleAudit(product) ? (
              <label style={{ display: "block", marginTop: 14, fontSize: "0.88rem", fontWeight: 600 }}>
                Instrumen audit *
                <select
                  name="auditCode"
                  required
                  value={auditCode}
                  onChange={(event) => {
                    const next = event.target.value;
                    setAuditCode(next);
                    setFieldError((prev) => ({ ...prev, auditCode: "" }));
                    writeDraft({ fields, methodId, coupon, productCode, agreed, auditCode: next });
                  }}
                  style={{ ...input, marginTop: 6, borderColor: fieldError.auditCode ? "#dc2626" : "#e2e8f0" }}
                >
                  <option value="">Pilih transisi fase</option>
                  {instruments.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.name}
                    </option>
                  ))}
                </select>
                {fieldError.auditCode ? (
                  <span style={{ display: "block", color: "#dc2626", fontWeight: 500, marginTop: 4 }}>{fieldError.auditCode}</span>
                ) : (
                  <span style={{ display: "block", color: "#64748b", fontWeight: 500, marginTop: 6 }}>
                    Wajib dipilih. Sesi tes untuk instrumen ini dibuat saat pesanan lunas.
                  </span>
                )}
              </label>
            ) : null}
          </section>

          <section style={card}>
            <p style={{ fontWeight: 700, marginBottom: 10 }}>Rincian Pembayaran</p>
            <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>
              Punya Kode Promo / Kupon?
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                <input
                  value={coupon}
                  onChange={(e) => {
                    const next = e.target.value.toUpperCase();
                    setCoupon(next);
                    writeDraft({ fields, methodId, coupon: next, productCode, agreed, auditCode });
                  }}
                  placeholder="LEVELUP10"
                  style={{ ...input, flex: 1 }}
                />
                <button
                  type="button"
                  onClick={() => void applyCoupon()}
                  style={{ borderRadius: 10, border: "1px solid #e2e8f0", padding: "0 12px", background: "#fff", fontWeight: 700 }}
                >
                  Terapkan
                </button>
              </div>
            </label>
            {couponNote ? (
              <p style={{ color: discount ? "#059669" : "#dc2626", fontSize: "0.8rem", marginTop: 8 }}>{couponNote}</p>
            ) : null}
            <Row label="Subtotal Produk" value={rupiah(subtotal)} />
            {discount ? <Row label="Diskon" value={`- ${rupiah(discount)}`} green /> : null}
            <Row
              label={selectedMethod?.provider === "Manual" ? "Biaya admin transfer" : "Biaya layanan payment gateway"}
              value="GRATIS"
              green
            />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, fontSize: "1.15rem" }}>
              <strong>Total Pembayaran</strong>
              <strong style={{ color: "#059669" }}>{rupiah(total)}</strong>
            </div>
            <label style={{ display: "flex", gap: 8, marginTop: 16, fontSize: "0.82rem", color: "#475569" }}>
              <input
                type="checkbox"
                name="agree"
                required
                checked={agreed}
                onChange={(event) => {
                  const next = event.target.checked;
                  setAgreed(next);
                  writeDraft({ fields, methodId, coupon, productCode, agreed: next, auditCode });
                }}
              />
              Saya menyetujui ketentuan layanan. Hasil audit akan dikirim ke email terdaftar.
            </label>
            {error ? <p style={{ color: "#dc2626", marginTop: 10, fontSize: "0.88rem" }}>{error}</p> : null}
            <button
              disabled={Boolean(phase)}
              className="btn btn-primary"
              style={{ width: "100%", borderRadius: 999, marginTop: 16, padding: "14px 18px" }}
            >
              {phase === "redirect" ? "Mengalihkan ke pembayaran..." : phase === "create" ? "Membuat pesanan..." : `Bayar Sekarang (${rupiah(total)}) →`}
            </button>
            <p style={{ textAlign: "center", color: "#94a3b8", fontSize: "0.75rem", marginTop: 10 }}>
              Garansi 100% uang kembali · {assurance(selectedMethod)}
            </p>
          </section>
        </div>
      </div>
      </fieldset>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  value,
  error,
  pattern,
  readOnly = false,
  hint,
  onChange,
}: {
  label: string;
  name: string;
  type?: string;
  value: string;
  error?: string;
  pattern?: string;
  readOnly?: boolean;
  hint?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label style={{ fontSize: "0.88rem", fontWeight: 600 }}>
      {label}
      <input
        name={name}
        type={type}
        required
        pattern={pattern}
        readOnly={readOnly}
        aria-readonly={readOnly || undefined}
        value={value}
        onChange={(e) => {
          if (!readOnly) onChange(e.target.value);
        }}
        style={{
          ...input,
          marginTop: 6,
          borderColor: error ? "#dc2626" : "#e2e8f0",
          background: readOnly ? "#f8fafc" : "#fff",
          color: readOnly ? "#334155" : "#0f172a",
        }}
      />
      {hint ? <span style={{ display: "block", color: "#64748b", fontWeight: 500, marginTop: 4 }}>{hint}</span> : null}
      {error ? <span style={{ display: "block", color: "#dc2626", fontWeight: 500, marginTop: 4 }}>{error}</span> : null}
    </label>
  );
}

function SelectField({
  label,
  name,
  value,
  error,
  options,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  error?: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  const choices = value && !options.includes(value) ? [value, ...options] : options;
  return (
    <label style={{ fontSize: "0.88rem", fontWeight: 600 }}>
      {label}
      <select name={name} required value={value} onChange={(e) => onChange(e.target.value)} style={{ ...input, marginTop: 6 }}>
        <option value="">Pilih</option>
        {choices.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
      {error ? <span style={{ display: "block", color: "#dc2626", fontWeight: 500, marginTop: 4 }}>{error}</span> : null}
    </label>
  );
}

function Row({ label, value, green }: { label: string; value: string; green?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: "0.9rem" }}>
      <span style={{ color: "#64748b" }}>{label}</span>
      <strong style={{ color: green ? "#059669" : "#0f172a" }}>{value}</strong>
    </div>
  );
}

const card: CSSProperties = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 20,
  padding: 24,
  boxShadow: "0 1px 3px rgb(0 0 0 / 0.05)",
};

const badge: CSSProperties = {
  background: "#0284c7",
  color: "#fff",
  width: 26,
  height: 26,
  borderRadius: "50%",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "0.85rem",
};

const stepTitle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: "1.15rem",
  marginBottom: 16,
};

const input: CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  border: "1px solid #e2e8f0",
  borderRadius: 10,
  fontSize: "0.92rem",
};
