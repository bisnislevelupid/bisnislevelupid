import React from 'react';
import { 
  FileText, 
  Play, 
  CheckCircle2, 
  Sparkles, 
  Building2, 
  Receipt,
  ShoppingCart,
  ArrowRight,
  Check
} from 'lucide-react';
import { sampleOrders, productsData } from '../mockData';

interface CustomerPortalProps {
  currentUser: any;
  onNavigate: (path: string) => void;
  subPage?: string;
  onSelectProduct?: (prodId: number) => void;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({
  currentUser,
  onNavigate,
  subPage = 'overview',
  onSelectProduct = () => {}
}) => {
  const user = currentUser || {
    name: 'Budi Santoso',
    email: 'budi.santoso@berkahmandiri.id',
    business_name: 'Toko Berkah Mandiri',
    business_field: 'Ritel Sembako & Distribusi'
  };

  // ==========================================
  // VIEW: KATALOG BELI LAYANAN LAIN (UPSELL DI USER PORTAL)
  // ==========================================
  if (subPage === 'services') {
    return (
      <div>
        <div style={{ marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: '#ecfdf5',
            color: '#059669',
            padding: '4px 12px',
            borderRadius: '999px',
            fontSize: '0.78rem',
            fontWeight: 700,
            marginBottom: '8px'
          }}>
            <Sparkles size={14} />
            KATALOG UPGRADE & PROGRAM LANJUTAN (PRD SECTION 5.8)
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
            Beli Layanan & Program Akselerasi Bisnis
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.94rem' }}>
            Pilih layanan pendampingan, modul toolkit, atau kelas intensif untuk mengatasi titik sumbatan bisnismu langsung ke proses checkout.
          </p>
        </div>

        <div className="upsell-grid">
          {productsData.slice(2).map((item) => (
            <div key={item.id} style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '20px',
              padding: '28px',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.72rem', background: '#ecfdf5', color: '#059669', padding: '3px 10px', borderRadius: '999px', fontWeight: 700 }}>
                    {item.badge}
                  </span>
                  {item.price_strikethrough && (
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                      Rp {item.price_strikethrough.toLocaleString('id-ID')}
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                  {item.name}
                </h3>
                <p style={{ fontSize: '0.86rem', color: '#64748b', lineHeight: 1.55, marginBottom: '20px' }}>
                  {item.short_desc}
                </p>

                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem', color: '#334155' }}>
                  {item.features.map((feat, fi) => (
                    <div key={fi} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Check size={14} color="#059669" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#059669', marginBottom: '16px', fontFamily: 'var(--font-heading)' }}>
                  Rp {item.price.toLocaleString('id-ID')}
                </div>
                <button
                  onClick={() => onSelectProduct(item.id)}
                  className="btn btn-primary"
                  style={{ width: '100%', borderRadius: '999px', padding: '12px', fontSize: '0.92rem' }}
                >
                  <ShoppingCart size={16} />
                  Checkout Layanan Ini →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: RIWAYAT PEMBAYARAN & INVOICE (/portal/orders)
  // ==========================================
  if (subPage === 'orders') {
    return (
      <div style={{
        background: '#ffffff',
        border: '1px solid var(--color-border)',
        borderRadius: '20px',
        padding: '28px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px', color: '#0f172a' }}>
          Riwayat Pembelian & Faktur Tagihan
        </h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
          Daftar lisensi instrumen audit dan layanan yang telah lunas atas akun Anda.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.92rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b' }}>
                <th style={{ padding: '12px' }}>No. Invoice</th>
                <th style={{ padding: '12px' }}>Produk Paket</th>
                <th style={{ padding: '12px' }}>Nominal</th>
                <th style={{ padding: '12px' }}>Metode</th>
                <th style={{ padding: '12px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {sampleOrders.slice(0, 2).map((ord) => (
                <tr key={ord.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px', fontWeight: 700, fontFamily: 'monospace' }}>
                    {ord.invoice_code}
                  </td>
                  <td style={{ padding: '14px' }}>{ord.product_name}</td>
                  <td style={{ padding: '14px', fontWeight: 700, color: '#059669' }}>
                    Rp {ord.total_amount.toLocaleString('id-ID')}
                  </td>
                  <td style={{ padding: '14px' }}>{ord.payment_method_name}</td>
                  <td style={{ padding: '14px' }}>
                    <span style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: '999px',
                      background: '#dcfce7',
                      color: '#15803d'
                    }}>
                      LUNAS
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: OVERVIEW / DASHBOARD MEMBER (/portal)
  // ==========================================
  return (
    <div>
      {/* Welcome Greeting Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
        color: '#ffffff',
        borderRadius: '24px',
        padding: '36px',
        boxShadow: 'var(--shadow-md)',
        marginBottom: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '24px'
      }}>
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255, 255, 255, 0.2)',
            padding: '4px 12px',
            borderRadius: '999px',
            fontSize: '0.8rem',
            fontWeight: 700,
            marginBottom: '10px'
          }}>
            <Sparkles size={14} />
            SCALEUP BISNIS MEMBER
          </div>
          <h1 style={{ fontSize: '1.9rem', color: '#ffffff', marginBottom: '6px' }}>
            Selamat Datang, {user.name}! 👋
          </h1>
          <p style={{ color: '#d1fae5', fontSize: '0.94rem', margin: 0 }}>
            Perusahaan: <strong>{user.business_name}</strong> ({user.business_field || 'Ritel & Distribusi'})
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => onNavigate('/test')}
            className="btn btn-primary"
            style={{
              background: '#ffffff',
              color: '#059669',
              padding: '13px 26px',
              fontSize: '0.96rem',
              borderRadius: '999px',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)'
            }}
          >
            <Play size={16} fill="#059669" />
            Mulai / Lanjutkan Audit →
          </button>
          <button
            onClick={() => onNavigate('/portal/services')}
            className="btn btn-outline"
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              borderRadius: '999px',
              padding: '13px 22px'
            }}
          >
            <ShoppingCart size={16} />
            Beli Layanan Lain
          </button>
        </div>
      </div>

      {/* SECTION 1: ACTIVE AUDIT SESSIONS & RESULTS */}
      <div style={{
        background: '#ffffff',
        border: '1px solid var(--color-border)',
        borderRadius: '20px',
        padding: '28px',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '32px'
      }}>
        <h2 style={{ fontSize: '1.35rem', marginBottom: '8px' }}>
          Paket Audit & Lembar Hasil Anda
        </h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
          Status pengerjaan checklist instrumen audit yang sudah di-unlock oleh akun Anda.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Audit 1 item */}
          <div style={{
            border: '1px solid var(--color-border)',
            borderRadius: '16px',
            padding: '22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            background: '#f8fafc'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: '#dcfce7',
                  color: '#15803d'
                }}>
                  SELESAI (COMPLETED)
                </span>
                <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                  Selesai pada: 05 Okt 2026, 10:45 WIB
                </span>
              </div>
              <h3 style={{ fontSize: '1.15rem', color: '#0f172a', marginBottom: '4px' }}>
                Audit Fase 1 ke 2: Survival → Cash Growth (92 Butir)
              </h3>
              <div style={{ fontSize: '0.88rem', color: '#475569' }}>
                Skor: <strong>72.5%</strong> · Status: <span style={{ color: '#dc2626', fontWeight: 700 }}>Gerbang Belum Terbuka (2 Butir Kunci Merah)</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => onNavigate('/result')}
                className="btn btn-primary"
                style={{ padding: '9px 18px', fontSize: '0.88rem', borderRadius: '999px' }}
              >
                <FileText size={16} />
                Lihat Diagnosis & Laporan
              </button>
            </div>
          </div>

          {/* Audit 2 item */}
          <div style={{
            border: '1px solid var(--color-border)',
            borderRadius: '16px',
            padding: '22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            background: '#ffffff'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: '#ecfdf5',
                  color: '#059669'
                }}>
                  SIAP DIKERJAKAN
                </span>
                <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                  161 Butir Checklist 8 Dimensi
                </span>
              </div>
              <h3 style={{ fontSize: '1.15rem', color: '#0f172a', marginBottom: '4px' }}>
                Audit Fase 2 ke 3: Cash Growth → Systemize (Otonomi & SOP)
              </h3>
              <div style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
                Gunakan instrumen ini setelah Anda lulus butir kunci fase 1.
              </div>
            </div>

            <button
              onClick={() => onNavigate('/test')}
              className="btn btn-outline"
              style={{ padding: '9px 18px', fontSize: '0.88rem', borderRadius: '999px' }}
            >
              <Play size={15} />
              Mulai Sesi Tes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
