import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Star,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Lightbulb,
  Building,
  DollarSign,
  Clock,
  Activity,
  Layers,
  Award,
  ShieldCheck,
  Check
} from 'lucide-react';
import { productsData } from '../mockData';

interface LandingPageProps {
  onSelectProduct: (productId: number) => void;
  onStartDemoTest: () => void;
  onNavigate: (page: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onSelectProduct,
  onStartDemoTest,
  onNavigate
}) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activePoll, setActivePoll] = useState('Rp 50-100 Juta');

  // Exact 5 Phases with Icons matching the Attachment
  const phasesRoadmap = [
    {
      num: 1,
      title: 'Validasi',
      desc: 'Menguji ide dan pasar.',
      color: '#f59e0b',
      icon: '💡'
    },
    {
      num: 2,
      title: 'Fondasi',
      desc: 'Membangun produk dan sistem dasar.',
      color: '#059669',
      icon: '⚙️'
    },
    {
      num: 3,
      title: 'Bertumbuh',
      desc: 'Meningkatkan penjualan dan tim.',
      color: '#10b981',
      icon: '📈'
    },
    {
      num: 4,
      title: 'Ekspansi',
      desc: 'Skalasi bisnis ke pasar lebih luas.',
      color: '#6366f1',
      icon: '🚀'
    },
    {
      num: 5,
      title: 'Mandiri',
      desc: 'Bisnis berjalan lebih sistematis dan berkelanjutan.',
      color: '#ec4899',
      icon: '👑'
    }
  ];

  const faqs = [
    {
      q: 'Berapa lama proses audit dilakukan?',
      a: 'Proses pengisian audit hanya membutuhkan 30-45 menit. Formatnya adalah checklist Ya/Tidak yang intuitif dengan auto-save otomatis, sehingga Anda bisa menyelesaikannya kapan saja.'
    },
    {
      q: 'Apakah cocok untuk semua jenis bisnis?',
      a: 'Ya, ScaleUp Bisnis dirancang untuk bisnis produk fisik (ritel, manufaktur, FMCG), F&B, fashion, jasa profesional, hingga agensi dan digital business yang sudah memiliki aktivitas komersial.'
    },
    {
      q: 'Dalam bentuk apa saya menerima laporan?',
      a: 'Anda akan langsung mendapatkan Laporan Eksekutif interaktif di dashboard serta dokumen PDF resmi 12+ halaman siap cetak, mencakup grafik skor 8 dimensi dan rekomendasi kurikulum perbaikan 30-90 hari.'
    },
    {
      q: 'Apakah ada sesi konsultasi?',
      a: 'Tersedia! Anda dapat memilih paket "Audit Lengkap + Konsultasi Online" untuk mendapatkan sesi 1:1 langsung selama 90 menit bersama praktisi senior mentor bisnis.'
    },
    {
      q: 'Bagaimana jika saya tidak puas?',
      a: 'Kami memberikan jaminan 100% garansi kepuasan insight. Jika laporan audit tidak memberikan peta jalan atau sudut pandang baru bagi bisnis Anda, tim kami akan mengembalikan investasi Anda.'
    }
  ];

  return (
    <div style={{ overflowX: 'hidden', background: '#ffffff', color: '#0f172a' }}>

      {/* 1. HERO SECTION (Exact layout from attachment) */}
      <section style={{
        position: 'relative',
        padding: '70px 0 90px',
        background: 'linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%)',
        overflow: 'hidden'
      }}>
        {/* Soft background glow circles */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '5%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />

        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '50px',
            alignItems: 'center'
          }}>
            {/* Left Hero Column */}
            <div>
              {/* Badge Pill */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#ecfdf5',
                color: '#059669',
                border: '1px solid #a7f3d0',
                padding: '6px 16px',
                borderRadius: '999px',
                fontSize: '0.8rem',
                fontWeight: 700,
                marginBottom: '24px'
              }}>
                <span>Audit Fase Bisnis untuk Pertumbuhan Nyata</span>
              </div>

              {/* Headline from attachment */}
              <h1 style={{
                fontSize: 'clamp(2.4rem, 4.5vw, 3.4rem)',
                fontWeight: 850,
                lineHeight: 1.18,
                letterSpacing: '-0.025em',
                color: '#0f172a',
                marginBottom: '20px'
              }}>
                Sudah Ikut Banyak Kelas,
                Tapi Bisnis Masih&nbsp;
                <span style={{ color: '#059669' }}>Jalan di Tempat?</span>
              </h1>

              {/* Subheadline from attachment */}
              <p style={{
                fontSize: '1.05rem',
                color: '#475569',
                lineHeight: 1.65,
                maxWidth: '520px',
                marginBottom: '32px'
              }}>
                ScaleUpBisnis membantu Anda mengenali fase bisnis saat ini, mengukur kesiapan, dan mendapatkan rekomendasi strategi pertumbuhan yang tepat dan terarah.
              </p>

              {/* Main Green CTA Button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '32px' }}>
                <button
                  onClick={() => onSelectProduct(2)}
                  className="btn btn-primary"
                  style={{
                    padding: '14px 28px',
                    fontSize: '1rem',
                    borderRadius: '999px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    boxShadow: '0 8px 20px rgba(5, 150, 105, 0.3)'
                  }}
                >
                  Temukan Fase Bisnisku
                  <ArrowRight size={18} />
                </button>
                <button
                  onClick={onStartDemoTest}
                  className="btn btn-outline"
                  style={{
                    padding: '14px 24px',
                    fontSize: '0.95rem',
                    borderRadius: '999px'
                  }}
                >
                  Coba Simulasi Tes
                </button>
              </div>

              {/* 3 Green Tick Trust Indicators */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                flexWrap: 'wrap',
                fontSize: '0.85rem',
                color: '#64748b'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={16} color="#059669" />
                  <span>Proses cepat & mudah</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={16} color="#059669" />
                  <span>Hasil langsung</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={16} color="#059669" />
                  <span>Dipercaya entrepreneur</span>
                </div>
              </div>
            </div>

            {/* Right Hero Column: Exact Card Illustration Mockup from Attachment */}
            <div style={{ position: 'relative' }}>
              {/* Floating mini target badge on right */}
              <div style={{
                position: 'absolute',
                top: '30%',
                right: '-10px',
                zIndex: 10,
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '12px 16px',
                boxShadow: 'var(--shadow-lg)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                textAlign: 'center'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#ecfdf5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.8rem'
                }}>
                  🎯
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0f172a' }}>40+</span>
                <span style={{ fontSize: '0.65rem', color: '#64748b' }}>Rekomendasi Strategi</span>
              </div>

              {/* Main Phone/Report Mockup Container */}
              <div style={{
                maxWidth: '420px',
                margin: '0 auto',
                background: '#ffffff',
                borderRadius: '32px',
                border: '8px solid #f1f5f9',
                boxShadow: '0 25px 50px -12px rgba(5, 150, 105, 0.2)',
                padding: '24px',
                position: 'relative'
              }}>
                {/* Mockup Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: '#059669', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <TrendingUp size={14} />
                    </div>
                    <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>ScaleUpBisnis</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>•••</span>
                </div>

                {/* Score Section Inside Card */}
                <div style={{
                  background: 'linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%)',
                  borderRadius: '20px',
                  border: '1px solid #d1fae5',
                  padding: '20px',
                  marginBottom: '16px'
                }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Hasil Audit Bisnismu:</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0 14px' }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', background: '#ecfdf5', color: '#059669', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>Fase Saat Ini</span>
                      <div style={{ fontSize: '1.25rem', fontWeight: 850, color: '#0f172a', marginTop: '2px' }}>
                        Fase Bertumbuh
                      </div>
                    </div>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: '#10b981',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 850,
                      fontSize: '0.95rem'
                    }}>
                      78%
                    </div>
                  </div>

                  {/* 5 Progress Stages horizontal dots */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px', marginBottom: '16px' }}>
                    {['Validasi', 'Fondasi', 'Bertumbuh', 'Ekspansi', 'Mandiri'].map((st, i) => (
                      <div key={i} style={{ textAlign: 'center', flex: 1 }}>
                        <div style={{
                          height: '5px',
                          borderRadius: '99px',
                          background: i <= 2 ? '#10b981' : '#e2e8f0',
                          marginBottom: '4px'
                        }} />
                        <span style={{ fontSize: '0.62rem', color: i === 2 ? '#059669' : '#94a3b8', fontWeight: i === 2 ? 800 : 500 }}>
                          {st}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Skor Kesiapan Bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 600, color: '#475569' }}>Skor Kesiapan:</span>
                      <span style={{ fontWeight: 800, color: '#059669' }}>78 / 100</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ width: '78%', height: '100%', background: '#10b981' }} />
                    </div>
                  </div>
                </div>

                {/* Bottom Recommendation Snippet in Card */}
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '14px',
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'flex-start'
                }}>
                  <div style={{
                    background: '#fef3c7',
                    color: '#d97706',
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    💡
                  </div>
                  <div>
                    <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#0f172a' }}>Rekomendasi Utama:</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', lineHeight: 1.4, marginTop: '2px' }}>
                      Fokus pada sistem penjualan dan efisiensi operasional sebelum menambah cabang.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. REALITA DI LAPANGAN (Section 2 from Attachment) */}
      <section id="features-section" style={{ padding: '80px 0', background: '#ffffff' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '860px' }}>
          <span className="section-tag">REALITA DI LAPANGAN</span>
          <h2 style={{ fontSize: '2.1rem', marginTop: '12px', marginBottom: '14px', fontWeight: 800 }}>
            Masalahnya Bukan Kamu Kurang Belajar.
          </h2>
          <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.6, marginBottom: '44px' }}>
            Banyak entrepreneur sudah ikut kelas, baca buku, dan coba berbagai strategi. Tapi tetap merasa bisnis jalan di tempat. Karena yang sering terjadi bukan ilmunya, melainkan pemahaman fase bisnis dan strategi yang sesuai.
          </p>

          {/* 3 Problem Cards from attachment */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '24px',
            textAlign: 'left'
          }}>
            <div style={{
              background: '#ffffff',
              border: '1px solid var(--color-border)',
              borderRadius: '20px',
              padding: '28px 24px',
              boxShadow: 'var(--shadow-card)'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: '#fee2e2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                marginBottom: '16px'
              }}>
                🔄
              </div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '8px', fontWeight: 700 }}>Strategi Tidak Tepat Fase</h3>
              <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                Menerapkan strategi perusahaan besar, padahal bisnis masih tahap awal.
              </p>
            </div>

            <div style={{
              background: '#ffffff',
              border: '1px solid var(--color-border)',
              borderRadius: '20px',
              padding: '28px 24px',
              boxShadow: 'var(--shadow-card)'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: '#fef3c7',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                marginBottom: '16px'
              }}>
                🧭
              </div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '8px', fontWeight: 700 }}>Fokus Tersebar</h3>
              <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                Terlalu banyak mencoba hal sekaligus, akhirnya tidak ada yang selesai.
              </p>
            </div>

            <div style={{
              background: '#ffffff',
              border: '1px solid var(--color-border)',
              borderRadius: '20px',
              padding: '28px 24px',
              boxShadow: 'var(--shadow-card)'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: '#e0f2fe',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                marginBottom: '16px'
              }}>
                📉
              </div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '8px', fontWeight: 700 }}>Hasil Tidak Konsisten</h3>
              <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                Kadang ada peningkatan, tapi sulit dipertahankan dan tidak terukur.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SOLUSI YANG TEPAT (Dark Teal Section with Graphic from Attachment) */}
      <section style={{
        padding: '70px 0',
        background: 'linear-gradient(135deg, #064e3b 0%, #042f2e 100%)',
        color: '#ffffff',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div className="container" style={{ maxWidth: '960px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '30px' }}>
            <div style={{ maxWidth: '560px' }}>
              <span style={{
                display: 'inline-block',
                background: 'rgba(52, 211, 153, 0.2)',
                color: '#6ee7b7',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                padding: '4px 14px',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                marginBottom: '16px'
              }}>
                SOLUSI YANG TEPAT
              </span>
              <h2 style={{ fontSize: '2.2rem', color: '#ffffff', fontWeight: 800, lineHeight: 1.25, marginBottom: '14px' }}>
                Saatnya Mengenali Fase Bisnismu <br />
                Sebelum Memilih Strategi.
              </h2>
              <p style={{ color: '#a7f3d0', fontSize: '1rem', lineHeight: 1.6, margin: 0 }}>
                Dengan memahami fase bisnis secara objektif, Anda bisa fokus pada langkah yang paling tepat, hemat waktu, biaya, dan energi.
              </p>
            </div>

            {/* Glowing Growth Badge Icon from Attachment */}
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: '#ffffff',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 35px rgba(52, 211, 153, 0.5)'
            }}>
              <TrendingUp size={40} />
            </div>
          </div>
        </div>
      </section>

      {/* 4. JALUR PERTUMBUHAN (5 Fase Perjalanan Bisnis from Attachment) */}
      <section style={{ padding: '90px 0', background: '#f8fafc' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px', alignItems: 'center' }}>
            <div>
              <span className="section-tag">JALUR PERTUMBUHAN</span>
              <h2 style={{ fontSize: '2.2rem', marginTop: '12px', marginBottom: '14px', fontWeight: 800 }}>
                5 Fase Perjalanan <br />
                Bisnismu.
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.98rem', lineHeight: 1.65, marginBottom: '28px' }}>
                Setiap bisnis memiliki tahap yang berbeda. ScaleUpBisnis membantu Anda mengidentifikasi posisi saat ini dan langkah berikutnya.
              </p>
              <button
                onClick={() => onSelectProduct(2)}
                className="btn btn-primary"
                style={{ borderRadius: '999px', padding: '12px 26px' }}
              >
                Temukan Fase Bisnisku →
              </button>
            </div>

            {/* Horizontal Timeline of 5 Phases from Attachment */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '12px'
            }}>
              {phasesRoadmap.map((p) => (
                <div key={p.num} style={{
                  background: '#ffffff',
                  border: '1px solid var(--color-border)',
                  borderRadius: '16px',
                  padding: '20px 14px',
                  textAlign: 'center',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    margin: '0 auto 10px',
                    borderRadius: '50%',
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.1rem'
                  }}>
                    {p.icon}
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#059669', marginBottom: '2px' }}>
                    {p.num}. {p.title}
                  </div>
                  <p style={{ fontSize: '0.74rem', color: '#64748b', lineHeight: 1.4, margin: 0 }}>
                    {p.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. DIBIMBING OLEH AHLI (30+ Tahun Pengalaman Lapangan from Attachment) */}
      <section style={{ padding: '80px 0', background: '#ffffff', borderBottom: '1px solid var(--color-border)' }}>
        <div className="container" style={{ maxWidth: '920px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '48px', alignItems: 'center' }}>
            {/* Founder Avatar with Badge from Attachment */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                position: 'relative',
                display: 'inline-block'
              }}>
                <img
                  src="/riza-zacharias.png"
                  alt="Mentor Bisnis Riza Zacharias"
                  style={{
                    width: '300px',
                    height: 'auto',
                    objectFit: 'contain',
                    borderRadius: '24px',
                    boxShadow: 'var(--shadow-xl)'
                  }}
                />
              </div>
            </div>

            {/* Content description & 3 checklist points */}
            <div>
              <span className="section-tag">DIBIMBING OLEH AHLI</span>
              <h2 style={{ fontSize: '2.1rem', marginTop: '12px', marginBottom: '14px', fontWeight: 800 }}>
                30+ Tahun Pengalaman Lapangan.
              </h2>
              <p style={{ color: '#475569', fontSize: '0.96rem', lineHeight: 1.65, marginBottom: '24px' }}>
                Metodologi ScaleUpBisnis disusun bersama praktisi bisnis yang telah membantu ratusan UMKM dan perusahaan tumbuh di berbagai industri.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: '#ecfdf5', borderRadius: '50%', padding: '4px', color: '#059669' }}>
                    <CheckCircle2 size={18} />
                  </div>
                  <span style={{ fontSize: '0.94rem', fontWeight: 600, color: '#0f172a' }}>
                    Pengalaman nyata di berbagai industri
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: '#ecfdf5', borderRadius: '50%', padding: '4px', color: '#059669' }}>
                    <CheckCircle2 size={18} />
                  </div>
                  <span style={{ fontSize: '0.94rem', fontWeight: 600, color: '#0f172a' }}>
                    Pendekatan praktis dan aplikatif
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: '#ecfdf5', borderRadius: '50%', padding: '4px', color: '#059669' }}>
                    <CheckCircle2 size={18} />
                  </div>
                  <span style={{ fontSize: '0.94rem', fontWeight: 600, color: '#0f172a' }}>
                    Fokus pada hasil yang bisa dieksekusi
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. LAPORAN YANG AKAN KAMU TEMUKAN (Executive Report Card & 5 Items from Attachment) */}
      <section style={{ padding: '80px 0', background: '#f8fafc' }}>
        <div className="container" style={{ maxWidth: '980px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px', alignItems: 'center' }}>

            {/* Visual Report Card preview from attachment */}
            <div style={{
              background: '#ffffff',
              border: '1px solid var(--color-border)',
              borderRadius: '24px',
              padding: '28px',
              boxShadow: 'var(--shadow-card)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#059669', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TrendingUp size={14} />
                  </div>
                  <span style={{ fontWeight: 800, fontSize: '0.92rem' }}>Laporan Audit Bisnis</span>
                </div>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>12 Januari 2026</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '20px', alignItems: 'center', marginBottom: '20px' }}>
                {/* 78 Circle Gauge */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: '90px',
                    height: '90px',
                    borderRadius: '50%',
                    border: '6px solid #10b981',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto'
                  }}>
                    <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>78</span>
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>/100</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px', display: 'block' }}>Skor Kesiapan Bisnis</span>
                </div>

                {/* 4 Dimension Bars from Attachment */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.78rem' }}>
                  {[
                    { label: 'Produk & Pasar', pct: 85 },
                    { label: 'Pemasaran', pct: 72 },
                    { label: 'Operasional', pct: 60 },
                    { label: 'Tim & SDM', pct: 54 },
                    { label: 'Keuangan', pct: 80 }
                  ].map((dim, di) => (
                    <div key={di}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', marginBottom: '2px' }}>
                        <span>{dim.label}</span>
                        <span style={{ fontWeight: 700 }}>{dim.pct}%</span>
                      </div>
                      <div style={{ height: '5px', background: '#e2e8f0', borderRadius: '99px', overflow: 'hidden' }}>
                        <div style={{ width: `${dim.pct}%`, height: '100%', background: '#10b981' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '14px',
                padding: '12px 14px',
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start'
              }}>
                <span style={{ fontSize: '1rem' }}>💡</span>
                <div>
                  <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#059669' }}>Insight Utama:</div>
                  <div style={{ fontSize: '0.72rem', color: '#166534', lineHeight: 1.4 }}>
                    Bisnis Anda siap untuk fokus pada peningkatan penjualan dan efisiensi operasional.
                  </div>
                </div>
              </div>
            </div>

            {/* Checklist of What You Find from Attachment */}
            <div>
              <span className="section-tag">LAPORAN YANG KOMPREHENSIF</span>
              <h2 style={{ fontSize: '2.1rem', marginTop: '12px', marginBottom: '14px', fontWeight: 800 }}>
                Yang Akan Kamu Temukan.
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.96rem', lineHeight: 1.6, marginBottom: '24px' }}>
                Laporan audit yang mudah dipahami dengan rekomendasi strategis sesuai kondisi bisnismu.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  'Analisis posisi fase bisnis saat ini',
                  'Skor kesiapan di 5 area penting',
                  'Rekomendasi strategi prioritas',
                  'Rencana aksi 90 hari',
                  'Insight risiko dan peluang'
                ].map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: '#ecfdf5', borderRadius: '50%', padding: '4px', color: '#059669' }}>
                      <CheckCircle2 size={18} />
                    </div>
                    <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a' }}>
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 7. JANGAN SALAH LANGKAH (Dark Teal Section with Red Trend Curve from Attachment) */}
      <section style={{
        padding: '80px 0',
        background: '#0a1e1b',
        color: '#ffffff',
        position: 'relative'
      }}>
        <div className="container" style={{ maxWidth: '980px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px', alignItems: 'center' }}>

            <div>
              <span className="section-tag-dark" style={{
                display: 'inline-block',
                padding: '4px 14px',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                marginBottom: '16px'
              }}>
                JANGAN SALAH LANGKAH
              </span>
              <h2 style={{ fontSize: '2.2rem', color: '#ffffff', fontWeight: 800, lineHeight: 1.25, marginBottom: '14px' }}>
                Strategi yang Salah Bisa <br />
                Menguras Waktu, Biaya, dan Energi.
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '0.96rem', lineHeight: 1.65, marginBottom: '32px' }}>
                Tanpa memahami fase bisnis, Anda berisiko mengambil keputusan yang tidak tepat dan memperlambat pertumbuhan.
              </p>

              {/* 3 Red/Amber Warning Points */}
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', maxWidth: '160px' }}>
                  <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', borderRadius: '10px', padding: '8px' }}>
                    💸
                  </div>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800 }}>Buang Biaya</div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Untuk strategi yang tidak cocok</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', maxWidth: '160px' }}>
                  <div style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', borderRadius: '10px', padding: '8px' }}>
                    ⏱️
                  </div>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800 }}>Buang Waktu</div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Karena harus coba-coba berulang kali</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', maxWidth: '160px' }}>
                  <div style={{ background: 'rgba(52, 211, 153, 0.2)', color: '#34d399', borderRadius: '10px', padding: '8px' }}>
                    📉
                  </div>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800 }}>Motivasi Menurun</div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Karena hasil tidak sesuai harapan</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Red Negative Curve Graph Box from Attachment */}
            <div style={{
              background: '#0f2d27',
              border: '1px solid #1a423a',
              borderRadius: '24px',
              padding: '24px',
              boxShadow: 'var(--shadow-lg)'
            }}>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '12px' }}>Tingkatan Hasil</div>

              {/* Graphic line chart */}
              <div style={{
                height: '140px',
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '16px',
                padding: '16px',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                <svg width="100%" height="100%" viewBox="0 0 280 80" fill="none">
                  <path d="M10 20 C 60 15, 120 55, 190 35 C 230 25, 250 65, 270 60" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="270" cy="60" r="4" fill="#ef4444" />
                </svg>
              </div>

              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '12px',
                padding: '12px 14px',
                display: 'flex',
                gap: '8px',
                alignItems: 'center'
              }}>
                <span style={{ color: '#ef4444', fontSize: '1.1rem' }}>⚠️</span>
                <span style={{ fontSize: '0.78rem', color: '#fca5a5' }}>
                  <strong>Risiko Nyata:</strong> Bisnis stagnan berbulan-bulan karena fokus pada eksekusi yang keliru.
                </span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 8. PROSES YANG MUDAH (Dapatkan Insight Bisnis dalam 3 Langkah + Interactive Poll from Attachment) */}
      <section id="how-it-works-section" style={{ padding: '80px 0', background: '#ffffff' }}>
        <div className="container" style={{ maxWidth: '960px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px', alignItems: 'center' }}>

            {/* 3 Step List */}
            <div>
              <span className="section-tag">PROSES YANG MUDAH</span>
              <h2 style={{ fontSize: '2.1rem', marginTop: '12px', marginBottom: '14px', fontWeight: 800 }}>
                Dapatkan Insight Bisnis <br />
                dalam 3 Langkah.
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.96rem', lineHeight: 1.6, marginBottom: '32px' }}>
                Proses audit dirancang sederhana dan cepat, agar Anda bisa segera mendapatkan hasil dan mulai menyusun strategi.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {[
                  { num: '1', title: 'Isi Pertanyaan', desc: 'Jawab pertanyaan singkat tentang bisnismu.' },
                  { num: '2', title: 'Proses Analisis', desc: 'Kami analisis dengan metodologi teruji.' },
                  { num: '3', title: 'Dapatkan Laporan', desc: 'Terima hasil audit dan rekomendasi strategi.' }
                ].map((st, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: '#10b981',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      flexShrink: 0
                    }}>
                      {st.num}
                    </div>
                    <div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>{st.title}</div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>{st.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive Question Card from Attachment (Berapa omset bulanan Anda?) */}
            <div style={{
              background: '#ffffff',
              border: '1px solid var(--color-border)',
              borderRadius: '24px',
              padding: '28px',
              boxShadow: 'var(--shadow-card)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>Pertanyaan Audit Bisnis</span>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>1/12</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a', marginBottom: '16px' }}>
                Berapa kisaran omzet bulanan bisnis Anda?
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {['< Rp 5 Juta', 'Rp 5 - 50 Juta', 'Rp 50 - 100 Juta', 'Rp 100 - 250 Juta', '> Rp 250 Juta'].map((opt) => {
                  const isSelected = activePoll === opt;
                  return (
                    <div
                      key={opt}
                      onClick={() => setActivePoll(opt)}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: isSelected ? '2px solid #10b981' : '1px solid var(--color-border)',
                        background: isSelected ? '#ecfdf5' : '#ffffff',
                        color: isSelected ? '#065f46' : '#334155',
                        fontWeight: isSelected ? 700 : 500,
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        border: isSelected ? '5px solid #10b981' : '2px solid #cbd5e1',
                        background: '#fff'
                      }} />
                      <span>{opt}</span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 9. HASIL YANG NYATA (Laporan Insight & Rencana 90 Hari + Testimonial Cards from Attachment) */}
      <section id="testimonials-section" style={{ padding: '80px 0', background: '#f8fafc' }}>
        <div className="container" style={{ maxWidth: '980px' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span className="section-tag">HASIL YANG NYATA</span>
            <h2 style={{ fontSize: '2.1rem', marginTop: '12px', marginBottom: '12px', fontWeight: 800 }}>
              Laporan Insight & Rencana 90 Hari.
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.96rem' }}>
              Dapatkan laporan yang tidak hanya menunjukkan posisi bisnis saat ini, tetapi juga langkah konkret untuk 90 hari ke depan.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {/* Left box: Rencana Aksi 90 Hari list from attachment */}
            <div style={{
              background: '#ffffff',
              border: '1px solid var(--color-border)',
              borderRadius: '20px',
              padding: '28px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <span style={{ fontSize: '1.4rem' }}>🎯</span>
                <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>Rencana Aksi 90 Hari</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem', color: '#475569' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Check size={16} color="#10b981" />
                  <span>Optimasi penawaran produk</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Check size={16} color="#10b981" />
                  <span>Bangun sistem penjualan</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Check size={16} color="#10b981" />
                  <span>Menyusun tim operasional</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Check size={16} color="#10b981" />
                  <span>Ukur dan evaluasi hasil</span>
                </div>
              </div>
            </div>

            {/* Testimonial 1 from attachment (Rina S. - Founder Brand Lokal) */}
            <div style={{
              background: '#ffffff',
              border: '1px solid var(--color-border)',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <img
                  src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80"
                  alt="Rina S."
                  style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>Rina S.</div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Founder Brand Lokal</div>
                </div>
              </div>
              <p style={{ fontSize: '0.86rem', color: '#475569', lineHeight: 1.6, fontStyle: 'italic', margin: 0 }}>
                "Setelah tahu fase bisnis saya, akhirnya saya bisa fokus dan hasilnya mulai terlihat dalam 3 bulan."
              </p>
              <div style={{ display: 'flex', gap: '3px', marginTop: '14px' }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={15} fill="#f59e0b" color="#f59e0b" />
                ))}
              </div>
            </div>

            {/* Testimonial 2 from attachment (Andi R. - Pemilik Usaha Manufaktur) */}
            <div style={{
              background: '#ffffff',
              border: '1px solid var(--color-border)',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80"
                  alt="Andi R."
                  style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>Andi R.</div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Pemilik Usaha Manufaktur</div>
                </div>
              </div>
              <p style={{ fontSize: '0.86rem', color: '#475569', lineHeight: 1.6, fontStyle: 'italic', margin: 0 }}>
                "Laporan auditnya sangat jelas dan aplikatif. Membantu kami menentukan prioritas yang tepat."
              </p>
              <div style={{ display: 'flex', gap: '3px', marginTop: '14px' }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={15} fill="#f59e0b" color="#f59e0b" />
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 10. PILIH PAKET AUDIT (Pricing Cards: Rp 197.000 vs Rp 597.000 from Attachment) */}
      <section id="pricing-section" style={{ padding: '90px 0', background: '#ffffff' }}>
        <div className="container" style={{ maxWidth: '880px' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <span className="section-tag">PILIH PAKET AUDIT</span>
            <h2 style={{ fontSize: '2.2rem', marginTop: '12px', marginBottom: '12px', fontWeight: 800 }}>
              Mulai Kenali Fase Bisnismu Sekarang.
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.98rem' }}>
              Pilih paket yang sesuai dengan kebutuhan bisnismu.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>

            {/* Card 1: Audit Satu Fase - Rp 197.000 from Attachment */}
            <div style={{
              background: '#ffffff',
              border: '1px solid var(--color-border)',
              borderRadius: '24px',
              padding: '36px 28px',
              boxShadow: 'var(--shadow-card)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a', marginBottom: '6px' }}>
                  Audit Satu Fase
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '24px' }}>
                  <span style={{ fontSize: '2rem', fontWeight: 900, color: '#059669', fontFamily: 'var(--font-heading)' }}>
                    Rp 197.000
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px', fontSize: '0.88rem', color: '#334155' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CheckCircle2 size={16} color="#059669" />
                    <span>Analisis fase bisnis saat ini</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CheckCircle2 size={16} color="#059669" />
                    <span>Skor 5 area usaha</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CheckCircle2 size={16} color="#059669" />
                    <span>Rekomendasi strategi dasar</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CheckCircle2 size={16} color="#059669" />
                    <span>Laporan dalam 5-10 hari</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onSelectProduct(1)}
                className="btn btn-outline"
                style={{ width: '100%', borderRadius: '999px', padding: '12px' }}
              >
                Pilih Paket Ini
              </button>
            </div>

            {/* Card 2: Audit Lengkap - Rp 597.000 (Paling Direkomendasikan from Attachment) */}
            <div style={{
              background: 'linear-gradient(180deg, #ecfdf5 0%, #ffffff 100%)',
              border: '2px solid #10b981',
              borderRadius: '24px',
              padding: '36px 28px',
              boxShadow: '0 12px 30px rgba(16, 185, 129, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '-13px',
                right: '24px',
                background: '#059669',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.72rem',
                padding: '3px 12px',
                borderRadius: '999px'
              }}>
                Paling Direkomendasikan
              </div>

              <div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a', marginBottom: '6px' }}>
                  Audit Lengkap
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '24px' }}>
                  <span style={{ fontSize: '2rem', fontWeight: 900, color: '#059669', fontFamily: 'var(--font-heading)' }}>
                    Rp 597.000
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px', fontSize: '0.88rem', color: '#334155' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CheckCircle2 size={16} color="#059669" />
                    <span>Analisis mendalam 5 fase</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CheckCircle2 size={16} color="#059669" />
                    <span>Skor lengkap 5 area</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CheckCircle2 size={16} color="#059669" />
                    <span>Rekomendasi strategi prioritas</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CheckCircle2 size={16} color="#059669" />
                    <span>Rencana aksi 90 hari</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CheckCircle2 size={16} color="#059669" />
                    <span>Sesi konsultasi online (90 menit)</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onSelectProduct(2)}
                className="btn btn-primary"
                style={{ width: '100%', borderRadius: '999px', padding: '12px' }}
              >
                Pilih Paket Lengkap →
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* 10.5 SECTION UPSELLING & LAYANAN LANJUTAN (Sesuai PRD Section 5.8) */}
      <section id="upsell-section" style={{ padding: '80px 0', background: 'linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%)', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
        <div className="container" style={{ maxWidth: '1280px' }}>
          <div style={{ textAlign: 'center', marginBottom: '44px' }}>
            <span className="section-tag">KATALOG LAYANAN LANJUTAN</span>
            <h2 style={{ fontSize: '2.1rem', marginTop: '12px', marginBottom: '10px', fontWeight: 800 }}>
              Solusi & Program Akselerasi Naik Fase
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.96rem', maxWidth: '640px', margin: '0 auto' }}>
              Disesuaikan dengan gap spesifik bisnismu: kelas praktis, toolkit spreadsheet finansial, dan pendampingan 1:1 bersama mentor lapangan.
            </p>
          </div>

          <div className="upsell-grid">
            {productsData.slice(2).map((item) => (
              <div key={item.id} style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '18px',
                padding: '22px 20px',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', minHeight: '24px' }}>
                    <span style={{ fontSize: '0.7rem', background: '#ecfdf5', color: '#059669', padding: '3px 8px', borderRadius: '999px', fontWeight: 700 }}>
                      {item.badge}
                    </span>
                    {item.price_strikethrough && (
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                        Rp {item.price_strikethrough.toLocaleString('id-ID')}
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px', lineHeight: 1.35 }}>
                    {item.name}
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.5, marginBottom: '14px' }}>
                    {item.short_desc}
                  </p>

                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', marginBottom: '18px', display: 'flex', flexDirection: 'column', gap: '7px', fontSize: '0.78rem', color: '#334155' }}>
                    {item.features.map((feat, fi) => (
                      <div key={fi} style={{ display: 'flex', alignItems: 'flex-start', gap: '7px' }}>
                        <Check size={13} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#059669', marginBottom: '12px', fontFamily: 'var(--font-heading)' }}>
                    Rp {item.price.toLocaleString('id-ID')}
                  </div>
                  <button
                    onClick={() => onSelectProduct(item.id)}
                    className="btn btn-primary"
                    style={{ width: '100%', borderRadius: '999px', padding: '10px 14px', fontSize: '0.84rem' }}
                  >
                    Beli Layanan Ini →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 11. FAQ (Accordion List from Attachment) */}
      <section id="faq-section" style={{ padding: '80px 0', background: '#f8fafc' }}>
        <div className="container" style={{ maxWidth: '820px' }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <span className="section-tag">PERTANYAAN YANG SERING DITANYA</span>
            <h2 style={{ fontSize: '2.1rem', marginTop: '12px', marginBottom: '10px', fontWeight: 800 }}>
              FAQ
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
              Masih ada pertanyaan? Berikut beberapa hal yang sering ditanyakan.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} style={{
                  background: '#ffffff',
                  border: '1px solid var(--color-border)',
                  borderRadius: '14px',
                  overflow: 'hidden'
                }}>
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    style={{
                      width: '100%',
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'transparent',
                      border: 'none',
                      textAlign: 'left',
                      fontWeight: 650,
                      fontSize: '0.96rem',
                      color: '#0f172a',
                      cursor: 'pointer'
                    }}
                  >
                    <span>{faq.q}</span>
                    <span style={{ fontSize: '1.2rem', color: '#64748b', fontWeight: 400 }}>
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>
                  {isOpen && (
                    <div style={{
                      padding: '0 20px 18px',
                      color: '#475569',
                      fontSize: '0.9rem',
                      lineHeight: 1.6,
                      borderTop: '1px solid #f1f5f9',
                      paddingTop: '12px'
                    }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 12. FINAL CALL TO ACTION (Dark Teal Section from Attachment) */}
      <section style={{
        padding: '90px 0',
        background: 'linear-gradient(135deg, #064e3b 0%, #042f2e 100%)',
        color: '#ffffff',
        textAlign: 'center'
      }}>
        <div className="container" style={{ maxWidth: '780px' }}>
          <span style={{
            display: 'inline-block',
            background: 'rgba(52, 211, 153, 0.2)',
            color: '#6ee7b7',
            border: '1px solid rgba(52, 211, 153, 0.3)',
            padding: '4px 14px',
            borderRadius: '999px',
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            marginBottom: '18px'
          }}>
            MULAI SEKARANG
          </span>

          <h2 style={{
            fontSize: 'clamp(2rem, 3.8vw, 2.7rem)',
            color: '#ffffff',
            fontWeight: 850,
            lineHeight: 1.25,
            marginBottom: '16px'
          }}>
            Satu Jam Hari Ini Bisa Mengubah <br />
            Arah Bisnismu Bertahun-Tahun.
          </h2>

          <p style={{ color: '#a7f3d0', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '32px' }}>
            Kenali fase bisnis, dapatkan insight yang tepat, dan mulai langkah pertumbuhan dengan lebih percaya diri bersama ScaleUpBisnis.
          </p>

          <button
            onClick={() => onSelectProduct(2)}
            className="btn btn-primary"
            style={{
              padding: '14px 34px',
              fontSize: '1.05rem',
              borderRadius: '999px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)'
            }}
          >
            Temukan Fase Bisnisku →
          </button>
        </div>
      </section>

    </div>
  );
};
