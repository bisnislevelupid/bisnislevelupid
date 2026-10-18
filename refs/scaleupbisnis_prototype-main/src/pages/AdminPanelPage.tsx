import React, { useState } from 'react';
import { 
  Users, 
  ShoppingCart, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  Plus, 
  Star, 
  TrendingUp, 
  FileText, 
  DollarSign, 
  Download, 
  AlertCircle, 
  ShieldCheck, 
  Building, 
  Eye, 
  Check, 
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Briefcase
} from 'lucide-react';
import { sampleCustomers, sampleOrders, sampleQuestions, productsData } from '../mockData';

interface AdminPanelPageProps {
  onNavigate: (path: string) => void;
  subSection?: string;
}

export const AdminPanelPage: React.FC<AdminPanelPageProps> = ({ onNavigate, subSection = 'dashboard' }) => {
  const [orderList, setOrderList] = useState(sampleOrders);
  const [searchQuery, setSearchQuery] = useState('');
  const [questionsList, setQuestionsList] = useState(sampleQuestions);
  
  // Selected Customer Modal State for DataGrid detail action
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  // Revenue metrics
  const totalRevenue = orderList.reduce((acc, curr) => acc + (curr.status === 'PAID' ? curr.total_amount : 0), 0);
  const paidOrdersCount = orderList.filter(o => o.status === 'PAID').length;
  const pendingOrdersCount = orderList.filter(o => o.status === 'PENDING').length;

  const handleManualConfirmOrder = (orderId: number) => {
    setOrderList(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          status: 'PAID',
          paid_at: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        };
      }
      return o;
    }));
    alert('Pembayaran order berhasil diverifikasi manual oleh Admin!');
  };

  const handleToggleKeyQuestion = (qId: number) => {
    setQuestionsList(prev => prev.map(q => {
      if (q.id === qId) {
        return { ...q, is_key: !q.is_key };
      }
      return q;
    }));
  };

  return (
    <div>
      {/* ======================================================== */}
      {/* 1. /admin OR /admin/dashboard */}
      {/* ======================================================== */}
      {(subSection === 'dashboard' || !subSection) && (
        <div>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>Ringkasan Eksekutif & Statistik</h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Pantau perkembangan penjualan audit, konversi checkout, dan aktivitas pengguna secara realtime.</p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px',
            marginBottom: '32px'
          }}>
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '22px' }}>
              <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Total Revenue Masuk</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#059669', margin: '6px 0', fontFamily: 'var(--font-heading)' }}>
                Rp {totalRevenue.toLocaleString('id-ID')}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 600 }}>
                ↑ 14.8% dibanding pekan lalu
              </div>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '22px' }}>
              <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Transaksi Lunas (Paid)</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', margin: '6px 0', fontFamily: 'var(--font-heading)' }}>
                {paidOrdersCount} Order
              </div>
              <div style={{ fontSize: '0.78rem', color: '#059669' }}>
                Konversi Checkout: <strong>78.4%</strong>
              </div>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '22px' }}>
              <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Menunggu Konfirmasi</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#f59e0b', margin: '6px 0', fontFamily: 'var(--font-heading)' }}>
                {pendingOrdersCount} Order
              </div>
              <div style={{ fontSize: '0.78rem', color: '#d97706' }}>
                Menunggu transfer / VA
              </div>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '22px' }}>
              <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Total Sesi Audit Aktif</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', margin: '6px 0', fontFamily: 'var(--font-heading)' }}>
                {sampleCustomers.length} Peserta
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Rata-rata pengerjaan: 38 menit
              </div>
            </div>
          </div>

          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '18px',
            padding: '24px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Aktivitas Transaksi Terbaru</h3>
              <button 
                onClick={() => onNavigate('/admin/orders')}
                className="btn btn-outline"
                style={{ fontSize: '0.8rem', padding: '6px 14px' }}
              >
                Lihat Semua Pesanan →
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b' }}>
                    <th style={{ padding: '12px 14px' }}>Invoice</th>
                    <th style={{ padding: '12px 14px' }}>Customer</th>
                    <th style={{ padding: '12px 14px' }}>Produk</th>
                    <th style={{ padding: '12px 14px' }}>Nominal</th>
                    <th style={{ padding: '12px 14px' }}>Metode</th>
                    <th style={{ padding: '12px 14px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orderList.map((ord) => (
                    <tr key={ord.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px', fontWeight: 700, fontFamily: 'monospace' }}>
                        {ord.invoice_code}
                      </td>
                      <td style={{ padding: '14px' }}>
                        <div style={{ fontWeight: 600 }}>{ord.customer_name}</div>
                        <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{ord.customer_email}</div>
                      </td>
                      <td style={{ padding: '14px' }}>{ord.product_name}</td>
                      <td style={{ padding: '14px', fontWeight: 700 }}>
                        Rp {ord.total_amount.toLocaleString('id-ID')}
                      </td>
                      <td style={{ padding: '14px' }}>{ord.payment_method_name}</td>
                      <td style={{ padding: '14px' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: '999px',
                          background: ord.status === 'PAID' ? '#dcfce7' : '#fef3c7',
                          color: ord.status === 'PAID' ? '#15803d' : '#b45309'
                        }}>
                          {ord.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. /admin/orders */}
      {/* ======================================================== */}
      {subSection === 'orders' && (
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '18px',
          padding: '28px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>Manajemen Pesanan & Invoice (/admin/orders)</h2>
              <p style={{ color: '#64748b', fontSize: '0.88rem' }}>Semua transaksi masuk via Xendit QRIS, Virtual Account, dan Transfer Bank Manual.</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                placeholder="Cari invoice atau nama customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '9px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.88rem',
                  minWidth: '260px'
                }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b' }}>
                  <th style={{ padding: '12px 14px' }}>Invoice Code</th>
                  <th style={{ padding: '12px 14px' }}>Data Pelanggan</th>
                  <th style={{ padding: '12px 14px' }}>Paket Dibeli</th>
                  <th style={{ padding: '12px 14px' }}>Nominal</th>
                  <th style={{ padding: '12px 14px' }}>Status</th>
                  <th style={{ padding: '12px 14px' }}>Waktu Order</th>
                  <th style={{ padding: '12px 14px' }}>Tindakan Verifikasi</th>
                </tr>
              </thead>
              <tbody>
                {orderList
                  .filter(o => o.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) || o.invoice_code.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((ord) => (
                  <tr key={ord.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px', fontWeight: 700, fontFamily: 'monospace' }}>
                      {ord.invoice_code}
                    </td>
                    <td style={{ padding: '14px' }}>
                      <div style={{ fontWeight: 650, color: '#0f172a' }}>{ord.customer_name}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{ord.customer_email} · {ord.customer_phone}</div>
                    </td>
                    <td style={{ padding: '14px', fontSize: '0.88rem' }}>{ord.product_name}</td>
                    <td style={{ padding: '14px', fontWeight: 800, color: '#059669' }}>
                      Rp {ord.total_amount.toLocaleString('id-ID')}
                    </td>
                    <td style={{ padding: '14px' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: '999px',
                        background: ord.status === 'PAID' ? '#dcfce7' : '#fef3c7',
                        color: ord.status === 'PAID' ? '#15803d' : '#b45309'
                      }}>
                        {ord.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px', fontSize: '0.82rem', color: '#64748b' }}>
                      {ord.created_at}
                    </td>
                    <td style={{ padding: '14px' }}>
                      {ord.status === 'PENDING' ? (
                        <button
                          onClick={() => handleManualConfirmOrder(ord.id)}
                          className="btn btn-primary"
                          style={{ padding: '6px 14px', fontSize: '0.8rem', background: '#059669', borderRadius: '6px' }}
                        >
                          Konfirmasi Lunas (PAID)
                        </button>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#059669', fontWeight: 600 }}>
                          <CheckCircle2 size={16} />
                          <span>Lunas & Aktif</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. /admin/customers (DETAILED DATAGRID WITH ACTION MODAL) */}
      {/* ======================================================== */}
      {subSection === 'customers' && (
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '18px',
          padding: '28px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>DataGrid Pelanggan & Profil Bisnis (/admin/customers)</h2>
              <p style={{ color: '#64748b', fontSize: '0.88rem' }}>Database lengkap identitas founder, omzet bisnis, jumlah karyawan, dan hasil status audit.</p>
            </div>
            <input
              type="text"
              placeholder="Cari pelanggan atau bisnis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '9px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.88rem',
                minWidth: '240px'
              }}
            />
          </div>

          {/* DATAGRID TABLE */}
          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                  <th style={{ padding: '12px 14px' }}>Customer / Founder</th>
                  <th style={{ padding: '12px 14px' }}>Nama Bisnis & Kota</th>
                  <th style={{ padding: '12px 14px' }}>Bidang Industri</th>
                  <th style={{ padding: '12px 14px' }}>Fase Saat Ini</th>
                  <th style={{ padding: '12px 14px' }}>Skor Audit Terakhir</th>
                  <th style={{ padding: '12px 14px' }}>Total Belanja</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>Aksi Profil</th>
                </tr>
              </thead>
              <tbody>
                {sampleCustomers
                  .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.business_name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((cust) => (
                  <tr key={cust.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img 
                          src={cust.avatar} 
                          alt={cust.name}
                          style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{cust.name}</div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{cust.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px' }}>
                      <div style={{ fontWeight: 650, color: '#0f172a' }}>{cust.business_name}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{cust.business_city}</div>
                    </td>
                    <td style={{ padding: '14px', color: '#334155' }}>
                      {cust.business_field}
                    </td>
                    <td style={{ padding: '14px' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: '#ecfdf5',
                        color: '#059669'
                      }}>
                        {cust.current_phase}
                      </span>
                    </td>
                    <td style={{ padding: '14px' }}>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>{cust.last_audit_score}</div>
                      <div style={{ fontSize: '0.72rem', color: cust.audit_status.includes('Siap') ? '#16a34a' : '#dc2626' }}>
                        {cust.audit_status}
                      </div>
                    </td>
                    <td style={{ padding: '14px', fontWeight: 700, color: '#059669' }}>
                      Rp {cust.total_spent.toLocaleString('id-ID')}
                    </td>
                    <td style={{ padding: '14px', textAlign: 'center' }}>
                      <button
                        onClick={() => setSelectedCustomer(cust)}
                        className="btn btn-outline"
                        style={{
                          padding: '6px 12px',
                          fontSize: '0.8rem',
                          borderRadius: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Eye size={14} color="#059669" />
                        <span>Detail Profil</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. /admin/questions */}
      {/* ======================================================== */}
      {subSection === 'questions' && (
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '18px',
          padding: '28px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
              Bank Soal Audit & Konfigurasi Butir Kunci (★) (/admin/questions)
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
              Atur bobot dan status <strong>Butir Kunci Gerbang</strong>. Jawaban "YA" pada butir kunci adalah syarat wajib kelulusan naik fase bisnis.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {questionsList.map(q => (
              <div key={q.id} style={{
                padding: '18px 22px',
                borderRadius: '14px',
                border: q.is_key ? '1.5px solid #fed7aa' : '1px solid #e2e8f0',
                background: q.is_key ? '#fffbeb' : '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '20px'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
                      Soal #{q.question_number}
                    </span>
                    {q.is_key && (
                      <span className="badge-key" style={{ fontSize: '0.72rem' }}>
                        <Star size={11} fill="#dc2626" />
                        BUTIR KUNCI GERBANG (WAJIB YA)
                      </span>
                    )}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.98rem', color: '#0f172a' }}>
                    {q.question_text}
                  </div>
                  {q.guidance_text && (
                    <div style={{ fontSize: '0.82rem', color: '#92400e', marginTop: '4px' }}>
                      Catatan Pedoman: {q.guidance_text}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleToggleKeyQuestion(q.id)}
                  className="btn btn-outline"
                  style={{
                    padding: '8px 16px',
                    fontSize: '0.82rem',
                    borderRadius: '8px',
                    background: q.is_key ? '#fee2e2' : '#ecfdf5',
                    color: q.is_key ? '#991b1b' : '#059669',
                    border: q.is_key ? '1px solid #fecaca' : '1px solid #a7f3d0',
                    fontWeight: 700,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {q.is_key ? 'Lepas Status Kunci' : 'Jadikan Butir Kunci ★'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. /admin/products */}
      {/* ======================================================== */}
      {subSection === 'products' && (
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '18px',
          padding: '28px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
              Katalog Produk & Paket Upsell (/admin/products)
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
              Atur harga, nama paket, dan fitur yang ditawarkan di formulir checkout dan halaman laporan.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {productsData.map(p => (
              <div key={p.id} style={{
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '26px',
                background: '#f8fafc',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#0f172a' }}>{p.name}</div>
                    {p.badge && (
                      <span style={{ fontSize: '0.72rem', background: '#ecfdf5', color: '#059669', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
                        {p.badge}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.86rem', color: '#64748b', marginBottom: '16px', lineHeight: 1.5 }}>
                    {p.short_desc}
                  </div>
                  <div style={{ fontWeight: 900, fontSize: '1.5rem', color: '#059669', marginBottom: '16px' }}>
                    Rp {p.price.toLocaleString('id-ID')}
                  </div>

                  <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '14px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem', color: '#334155' }}>
                    {p.features.map((feat, fi) => (
                      <div key={fi} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Check size={14} color="#059669" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => alert(`Pengaturan paket "${p.name}" tersimpan di database.`)}
                  className="btn btn-outline"
                  style={{ width: '100%', padding: '10px', fontSize: '0.86rem', borderRadius: '8px' }}
                >
                  Edit Konfigurasi Paket
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL ACTION: DETAIL PROFIL & BISNIS CUSTOMER */}
      {/* ======================================================== */}
      {selectedCustomer && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '36px',
            boxShadow: 'var(--shadow-xl)',
            position: 'relative'
          }}>
            <button
              onClick={() => setSelectedCustomer(null)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748b'
              }}
            >
              <X size={20} />
            </button>

            {/* Header info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '28px' }}>
              <img 
                src={selectedCustomer.avatar} 
                alt={selectedCustomer.name}
                style={{ width: '68px', height: '68px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #ecfdf5' }}
              />
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, background: '#ecfdf5', color: '#059669', padding: '3px 10px', borderRadius: '6px' }}>
                  CUSTOMER PROFILE #{selectedCustomer.id}
                </span>
                <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', margin: '4px 0 2px' }}>
                  {selectedCustomer.name}
                </h3>
                <div style={{ fontSize: '0.88rem', color: '#64748b' }}>
                  {selectedCustomer.email} · {selectedCustomer.phone}
                </div>
              </div>
            </div>

            {/* Business Profile Details Grid */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '24px'
            }}>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building size={18} color="#059669" />
                <span>Profil Entitas Bisnis</span>
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.88rem' }}>
                <div>
                  <div style={{ color: '#64748b', fontSize: '0.8rem' }}>Nama Perusahaan</div>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{selectedCustomer.business_name}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: '0.8rem' }}>Bidang Usaha</div>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{selectedCustomer.business_field}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: '0.8rem' }}>Tahun Didirikan</div>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{selectedCustomer.established_year}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: '0.8rem' }}>Kekuatan Tim</div>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{selectedCustomer.employee_count}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: '0.8rem' }}>Estimasi Omzet</div>
                  <div style={{ fontWeight: 700, color: '#059669' }}>{selectedCustomer.monthly_turnover}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: '0.8rem' }}>Kota & Wilayah</div>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{selectedCustomer.business_city}</div>
                </div>
              </div>

              <div style={{ marginTop: '14px', borderTop: '1px solid #e2e8f0', paddingTop: '10px', fontSize: '0.85rem' }}>
                <span style={{ color: '#64748b' }}>Alamat Operasional: </span>
                <span style={{ color: '#0f172a', fontWeight: 500 }}>{selectedCustomer.business_address}</span>
              </div>
            </div>

            {/* Audit Status & Historical Assessment */}
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#166534', marginBottom: '10px' }}>
                Hasil Audit Diagnosis Terakhir
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.86rem' }}>
                <div>
                  <span style={{ color: '#15803d' }}>Posisi Fase: </span>
                  <strong>{selectedCustomer.current_phase}</strong>
                </div>
                <div>
                  <span style={{ color: '#15803d' }}>Skor: </span>
                  <strong style={{ fontSize: '1rem', color: '#059669' }}>{selectedCustomer.last_audit_score}</strong>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <span style={{ color: '#15803d' }}>Status Gerbang: </span>
                  <span style={{ fontWeight: 700, color: selectedCustomer.audit_status.includes('Siap') ? '#16a34a' : '#dc2626' }}>
                    {selectedCustomer.audit_status}
                  </span>
                </div>
              </div>
              <div style={{ marginTop: '10px', fontSize: '0.82rem', color: '#166534', fontStyle: 'italic' }}>
                Catatan Evaluator: "{selectedCustomer.notes}"
              </div>
            </div>

            {/* Action buttons inside modal */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setSelectedCustomer(null);
                  onNavigate('/result');
                }}
                className="btn btn-primary"
                style={{ flex: 1, padding: '12px', borderRadius: '10px' }}
              >
                Buka Laporan Hasil ({selectedCustomer.business_name})
              </button>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="btn btn-outline"
                style={{ padding: '12px 20px', borderRadius: '10px' }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
