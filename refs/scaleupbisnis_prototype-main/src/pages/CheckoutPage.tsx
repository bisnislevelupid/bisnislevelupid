import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CreditCard, 
  QrCode, 
  CheckCircle2, 
  ArrowLeft, 
  Tag, 
  HelpCircle,
  Copy,
  Clock,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { productsData, paymentMethodsData } from '../mockData';
import type { Product, PaymentMethod } from '../types';

interface CheckoutPageProps {
  selectedProductId: number;
  onPaymentSuccess: (orderData: any) => void;
  onBack: () => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  selectedProductId,
  onPaymentSuccess,
  onBack
}) => {
  const [productId, setProductId] = useState(selectedProductId || 2);
  const [selectedMethodId, setSelectedMethodId] = useState(1); // Default QRIS
  const [couponInput, setCouponInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  // Form Fields as per PRD
  const [fullName, setFullName] = useState('Budi Santoso');
  const [email, setEmail] = useState('budi.santoso@berkahmandiri.id');
  const [phone, setPhone] = useState('081234567001');
  const [businessName, setBusinessName] = useState('Toko Berkah Mandiri');
  const [businessField, setBusinessField] = useState('Ritel Sembako & Distribusi');
  const [agreedTerms, setAgreedTerms] = useState(true);

  // Simulation State: Pending / Processing / Paid
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'FORM' | 'INVOICE'>('FORM');
  const [generatedInvoice, setGeneratedInvoice] = useState<any>(null);

  const product = productsData.find(p => p.id === productId) || productsData[1];
  const selectedMethod = paymentMethodsData.find(m => m.id === selectedMethodId) || paymentMethodsData[0];

  const subtotal = product.price;
  const adminFee = 0;
  const total = Math.max(0, subtotal - appliedDiscount + adminFee);

  const handleApplyCoupon = () => {
    setCouponError('');
    setCouponSuccess('');
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    if (code === 'SYAAMIL30') {
      const disc = Math.round(subtotal * 0.3);
      setAppliedDiscount(disc);
      setCouponSuccess('Kupon SYAAMIL30 berhasil digunakan! Diskon 30% diterapkan.');
    } else if (code === 'BUNDEL50K') {
      setAppliedDiscount(50000);
      setCouponSuccess('Kupon BUNDEL50K berhasil digunakan! Potongan Rp 50.000.');
    } else if (code === 'EARLYBIRD') {
      const disc = Math.round(subtotal * 0.2);
      setAppliedDiscount(disc);
      setCouponSuccess('Kupon EARLYBIRD berhasil digunakan! Diskon 20%.');
    } else {
      setCouponError('Kode promo tidak valid atau telah kedaluwarsa.');
    }
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedTerms) {
      alert('Harap setujui syarat dan ketentuan sebelum melanjutkan.');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const invoiceData = {
        invoice_code: `INV-20261007-${randomCode}`,
        customer_name: fullName,
        customer_email: email,
        customer_phone: phone,
        business_name: businessName,
        business_field: businessField,
        product: product,
        payment_method: selectedMethod,
        subtotal: subtotal,
        discount: appliedDiscount,
        total: total,
        va_number: selectedMethod.type === 'VIRTUAL_ACCOUNT' ? `93478${Math.floor(1000000000 + Math.random() * 9000000000)}` : undefined,
        status: 'PENDING',
        created_at: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      };

      setGeneratedInvoice(invoiceData);
      setIsProcessing(false);
      setPaymentStep('INVOICE');
    }, 700);
  };

  const handleSimulatePaid = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onPaymentSuccess(generatedInvoice);
    }, 800);
  };

  return (
    <div style={{ padding: '40px 0 80px', background: '#f8fafc', minHeight: 'calc(100vh - 72px)' }}>
      <div className="container" style={{ maxWidth: '1040px' }}>
        
        {/* Back Link */}
        <button
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'transparent',
            border: 'none',
            color: 'var(--color-text-muted)',
            fontWeight: 600,
            cursor: 'pointer',
            marginBottom: '24px',
            fontSize: '0.92rem'
          }}
        >
          <ArrowLeft size={16} />
          Kembali ke Informasi Paket
        </button>

        {paymentStep === 'FORM' ? (
          <div>
            <div style={{ marginBottom: '32px' }}>
              <h1 style={{ fontSize: '2.1rem', marginBottom: '8px' }}>Formulir Pembelian & Checkout</h1>
              <p style={{ color: 'var(--color-text-muted)' }}>
                Isi data perusahaan Anda untuk penerbitan lisensi instrumen audit dan invoice resmi.
              </p>
            </div>

            <form onSubmit={handleCreateOrder}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '32px',
                alignItems: 'start'
              }}>
                {/* Left Column: Form Fields & Payment Methods */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {/* Step 1: Data Pengusaha */}
                  <div style={{
                    background: '#ffffff',
                    border: '1px solid var(--color-border)',
                    borderRadius: '20px',
                    padding: '28px',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        background: '#0284c7',
                        color: '#fff',
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.85rem',
                        fontWeight: 700
                      }}>1</span>
                      Data Pemilik & Usaha
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px' }}>
                          Nama Lengkap *
                        </label>
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            border: '1px solid var(--color-border)',
                            borderRadius: '8px',
                            fontSize: '0.95rem'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px' }}>
                          Email Aktif (untuk Laporan PDF) *
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            border: '1px solid var(--color-border)',
                            borderRadius: '8px',
                            fontSize: '0.95rem'
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px' }}>
                          Nomor WhatsApp (Notifikasi Instan) *
                        </label>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            border: '1px solid var(--color-border)',
                            borderRadius: '8px',
                            fontSize: '0.95rem'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px' }}>
                          Nama Bisnis / Brand *
                        </label>
                        <input
                          type="text"
                          required
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            border: '1px solid var(--color-border)',
                            borderRadius: '8px',
                            fontSize: '0.95rem'
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px' }}>
                        Bidang Bisnis *
                      </label>
                      <select
                        value={businessField}
                        onChange={(e) => setBusinessField(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          border: '1px solid var(--color-border)',
                          borderRadius: '8px',
                          fontSize: '0.95rem',
                          background: '#fff'
                        }}
                      >
                        <option value="Ritel Sembako & Distribusi">Ritel & Grosir / Minimarket</option>
                        <option value="Food & Beverage">Kuliner & F&B (Resto/Cafe/Cloud Kitchen)</option>
                        <option value="Fashion & Konveksi">Fashion, Pakaian & Hijab Muslim</option>
                        <option value="Jasa Digital & Kreatif">Agensi Digital, Software & Kreatif</option>
                        <option value="Kesehatan & Kecantikan">Klinik Kecantikan, Skincare & Herbal</option>
                        <option value="Konstruksi & Properti">Konstruksi, Arsitektur & Properti</option>
                        <option value="Lainnya">Bidang Usaha Lainnya</option>
                      </select>
                    </div>
                  </div>

                  {/* Step 2: Pilih Metode Pembayaran Xendit */}
                  <div style={{
                    background: '#ffffff',
                    border: '1px solid var(--color-border)',
                    borderRadius: '20px',
                    padding: '28px',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        background: '#0284c7',
                        color: '#fff',
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.85rem',
                        fontWeight: 700
                      }}>2</span>
                      Pilih Metode Pembayaran
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {paymentMethodsData.map((pm) => {
                        const isSelected = selectedMethodId === pm.id;
                        return (
                          <div
                            key={pm.id}
                            onClick={() => setSelectedMethodId(pm.id)}
                            style={{
                              border: isSelected ? '2px solid #0284c7' : '1px solid var(--color-border)',
                              background: isSelected ? '#f0f9ff' : '#ffffff',
                              borderRadius: '12px',
                              padding: '14px 18px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <input
                                type="radio"
                                name="payment_method"
                                checked={isSelected}
                                onChange={() => setSelectedMethodId(pm.id)}
                                style={{ accentColor: '#0284c7' }}
                              />
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '0.98rem' }}>{pm.name}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                  Konfirmasi instan otomatis via {pm.provider}
                                </div>
                              </div>
                            </div>
                            <div style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              color: '#0284c7',
                              background: '#e0f2fe',
                              padding: '3px 8px',
                              borderRadius: '4px'
                            }}>
                              Bebas Biaya Admin
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right Column: Order Summary & Coupon */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* Package Selector Pills */}
                  <div style={{
                    background: '#ffffff',
                    border: '1px solid var(--color-border)',
                    borderRadius: '20px',
                    padding: '24px',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, marginBottom: '12px' }}>
                      Paket yang Dipilih:
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {productsData.map((p) => {
                        const isChosen = p.id === productId;
                        return (
                          <div
                            key={p.id}
                            onClick={() => setProductId(p.id)}
                            style={{
                              padding: '12px 14px',
                              borderRadius: '10px',
                              border: isChosen ? '2px solid #0284c7' : '1px solid var(--color-border)',
                              background: isChosen ? '#f0f9ff' : '#ffffff',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{p.name}</div>
                              {p.badge && (
                                <span style={{ fontSize: '0.72rem', color: '#0369a1', fontWeight: 600 }}>
                                  {p.badge}
                                </span>
                              )}
                            </div>
                            <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                              Rp {p.price.toLocaleString('id-ID')}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Summary Card */}
                  <div style={{
                    background: '#ffffff',
                    border: '1px solid var(--color-border)',
                    borderRadius: '20px',
                    padding: '24px',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Rincian Pembayaran</h3>

                    {/* Coupon Input */}
                    <div style={{ marginBottom: '18px' }}>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px' }}>
                        Punya Kode Promo / Kupon?
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          placeholder="Cth: SYAAMIL30 / BUNDEL50K"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value)}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            border: '1px solid var(--color-border)',
                            borderRadius: '8px',
                            fontSize: '0.88rem',
                            textTransform: 'uppercase'
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          className="btn btn-outline"
                          style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                        >
                          Terapkan
                        </button>
                      </div>
                      {couponSuccess && (
                        <div style={{ fontSize: '0.82rem', color: '#16a34a', marginTop: '6px', fontWeight: 600 }}>
                          ✓ {couponSuccess}
                        </div>
                      )}
                      {couponError && (
                        <div style={{ fontSize: '0.82rem', color: '#dc2626', marginTop: '6px' }}>
                          ✕ {couponError}
                        </div>
                      )}
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                        Kupon demo tersedia: <code>SYAAMIL30</code> (30%), <code>BUNDEL50K</code>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.92rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                        <span>Subtotal Produk</span>
                        <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                      </div>
                      {appliedDiscount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a', fontWeight: 600 }}>
                          <span>Potongan Promo</span>
                          <span>- Rp {appliedDiscount.toLocaleString('id-ID')}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                        <span>Biaya Layanan Payment Gateway</span>
                        <span style={{ color: '#16a34a', fontWeight: 600 }}>GRATIS</span>
                      </div>

                      <div style={{ height: '1px', background: 'var(--color-border)', margin: '6px 0' }} />

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>Total Pembayaran</span>
                        <span style={{ fontWeight: 900, fontSize: '1.45rem', color: '#0284c7', fontFamily: 'var(--font-heading)' }}>
                          Rp {total.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                    {/* Terms Checkbox */}
                    <div style={{ marginTop: '20px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <input
                        type="checkbox"
                        id="terms"
                        checked={agreedTerms}
                        onChange={(e) => setAgreedTerms(e.target.checked)}
                        style={{ marginTop: '4px', accentColor: '#0284c7' }}
                      />
                      <label htmlFor="terms" style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5 }}>
                        Saya menyetujui Ketentuan Layanan & Kebijakan Privasi NaikFase. Hasil audit akan dikirimkan ke email terdaftar.
                      </label>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="btn btn-primary"
                      style={{
                        width: '100%',
                        marginTop: '20px',
                        padding: '14px',
                        fontSize: '1.05rem',
                        borderRadius: '12px'
                      }}
                    >
                      {isProcessing ? 'Memproses Order...' : `Bayar Sekarang (Rp ${total.toLocaleString('id-ID')}) →`}
                    </button>

                    <div style={{
                      marginTop: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      fontSize: '0.78rem',
                      color: '#94a3b8'
                    }}>
                      <ShieldCheck size={14} color="#10b981" />
                      <span>Garansi 100% Uang Kembali · Xendit Secured</span>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        ) : (
          /* STEP 2: INVOICE & SIMULASI PEMBAYARAN */
          <div style={{ maxWidth: '680px', margin: '0 auto' }}>
            <div style={{
              background: '#ffffff',
              border: '1px solid var(--color-border)',
              borderRadius: '24px',
              padding: '40px',
              boxShadow: 'var(--shadow-lg)'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#fef3c7',
                  color: '#92400e',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  padding: '4px 14px',
                  borderRadius: '999px',
                  marginBottom: '12px'
                }}>
                  <Clock size={14} />
                  MENUNGGU PEMBAYARAN (23:59:45)
                </div>
                <h2 style={{ fontSize: '1.8rem', marginBottom: '6px' }}>
                  Tagihan Pembayaran Resmi
                </h2>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.92rem' }}>
                  Invoice: <strong>{generatedInvoice.invoice_code}</strong>
                </div>
              </div>

              {/* Total Amount Box */}
              <div style={{
                background: '#f0f9ff',
                border: '1px dashed #0284c7',
                borderRadius: '16px',
                padding: '24px',
                textAlign: 'center',
                marginBottom: '28px'
              }}>
                <div style={{ fontSize: '0.85rem', color: '#0369a1', fontWeight: 600 }}>Total yang Harus Dibayar:</div>
                <div style={{
                  fontSize: '2.4rem',
                  fontWeight: 900,
                  color: '#0284c7',
                  fontFamily: 'var(--font-heading)',
                  margin: '6px 0'
                }}>
                  Rp {generatedInvoice.total.toLocaleString('id-ID')}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                  Transfer sesuai nominal tepat hingga digit terakhir
                </div>
              </div>

              {/* Specific Payment Channel Display */}
              {generatedInvoice.payment_method.type === 'QR_CODE' && (
                <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                  <div style={{
                    width: '200px',
                    height: '200px',
                    margin: '0 auto 16px',
                    background: '#ffffff',
                    border: '2px solid #0f172a',
                    borderRadius: '16px',
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow-md)'
                  }}>
                    {/* Simulated High-Res QR */}
                    <div style={{ textAlign: 'center' }}>
                      <QrCode size={160} color="#0f172a" />
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Scan QRIS dengan Aplikasi Mobile Banking / E-Wallet</div>
                  <div style={{ fontSize: '0.82rem', color: '#64748b' }}>BCA, Livin Mandiri, GoPay, OVO, DANA, ShopeePay</div>
                </div>
              )}

              {generatedInvoice.payment_method.type === 'VIRTUAL_ACCOUNT' && (
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid var(--color-border)',
                  borderRadius: '16px',
                  padding: '20px',
                  marginBottom: '24px'
                }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Nomor Virtual Account ({generatedInvoice.payment_method.name}):</div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '8px'
                  }}>
                    <span style={{ fontSize: '1.45rem', fontWeight: 800, fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                      {generatedInvoice.va_number}
                    </span>
                    <button
                      type="button"
                      onClick={() => alert(`Nomor VA ${generatedInvoice.va_number} disalin ke clipboard!`)}
                      className="btn btn-outline"
                      style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                    >
                      <Copy size={14} />
                      Salin
                    </button>
                  </div>
                </div>
              )}

              {/* Instructions Accordion */}
              <div style={{ marginBottom: '32px' }}>
                <h4 style={{ fontSize: '1rem', marginBottom: '12px' }}>Panduan Pembayaran:</h4>
                <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem', color: '#475569' }}>
                  {generatedInvoice.payment_method.instructions[0].steps.map((step: string, si: number) => (
                    <li key={si}>{step}</li>
                  ))}
                </ol>
              </div>

              {/* Simulation Quick Buttons */}
              <div style={{
                background: '#f1f5f9',
                borderRadius: '16px',
                padding: '20px',
                border: '1px solid #cbd5e1',
                textAlign: 'center'
              }}>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#334155', marginBottom: '6px' }}>
                  ⚡ MODE PROTOTYPE SIMULATION
                </div>
                <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '16px' }}>
                  Klik tombol di bawah untuk mensimulasikan webhook Xendit / pembayaran lunas secara instan.
                </div>
                <button
                  type="button"
                  onClick={handleSimulatePaid}
                  disabled={isProcessing}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '14px', fontSize: '1.05rem', background: '#16a34a' }}
                >
                  <CheckCircle2 size={18} />
                  {isProcessing ? 'Mengonfirmasi Pembayaran...' : 'Simulasikan Pembayaran Berhasil (PAID) →'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
