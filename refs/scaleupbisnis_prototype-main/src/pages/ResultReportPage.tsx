import React, { useState } from 'react';
import { 
  Download, 
  Share2, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Star, 
  BookOpen, 
  Users, 
  ArrowRight, 
  Compass, 
  Calendar, 
  ShieldCheck, 
  Sparkles,
  Printer,
  ChevronRight,
  TrendingUp,
  FileCheck2,
  DollarSign
} from 'lucide-react';
import { sampleCompletedResult } from '../mockData';

interface ResultReportPageProps {
  customResult?: any;
  onNavigate: (page: string) => void;
  onBuyUpsell: (itemTitle: string) => void;
}

export const ResultReportPage: React.FC<ResultReportPageProps> = ({
  customResult,
  onNavigate,
  onBuyUpsell
}) => {
  const result = customResult || sampleCompletedResult;
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPdf = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      window.print();
    }, 800);
  };

  return (
    <div style={{ padding: '40px 0 90px', background: '#f8fafc', minHeight: 'calc(100vh - 72px)' }}>
      <div className="container" style={{ maxWidth: '1040px' }}>
        
        {/* Action Header: Download PDF & Print */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '28px'
        }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#dcfce7',
              color: '#16a34a',
              fontWeight: 700,
              fontSize: '0.8rem',
              padding: '3px 12px',
              borderRadius: '999px',
              marginBottom: '6px'
            }}>
              <CheckCircle2 size={14} />
              AUDIT SELESAI & TERVERIFIKASI SISTEM
            </div>
            <h1 style={{ fontSize: '2rem', color: '#0f172a' }}>
              Laporan Diagnosis Bisnis: {result.company_name}
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="btn btn-primary"
              style={{ padding: '12px 22px' }}
            >
              <Download size={18} />
              {downloading ? 'Menyiapkan PDF...' : 'Download Laporan PDF (Resmi)'}
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert('Tautan laporan tersalin ke clipboard!');
              }}
              className="btn btn-outline"
              style={{ background: '#ffffff', padding: '12px 18px' }}
            >
              <Share2 size={18} />
              Bagikan
            </button>
          </div>
        </div>

        {/* SECTION 1: EXECUTIVE SUMMARY CARD */}
        <div style={{
          background: '#ffffff',
          border: '1px solid var(--color-border)',
          borderRadius: '24px',
          padding: '36px',
          boxShadow: 'var(--shadow-md)',
          marginBottom: '32px'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '32px',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                HASIL DIAGNOSIS TINGKATAN
              </div>
              <div style={{
                fontSize: '2.4rem',
                fontWeight: 900,
                color: '#0f172a',
                fontFamily: 'var(--font-heading)',
                margin: '8px 0 12px'
              }}>
                Fase {result.from_phase.phase_number}: {result.from_phase.name_short}
              </div>

              {/* Status Badge */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: result.key_pass ? '#dcfce7' : '#fee2e2',
                color: result.key_pass ? '#15803d' : '#991b1b',
                fontWeight: 800,
                fontSize: '0.92rem',
                padding: '6px 16px',
                borderRadius: '10px',
                marginBottom: '18px'
              }}>
                {result.key_pass ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                <span>{result.status_label}</span>
              </div>

              <p style={{ color: '#475569', fontSize: '0.98rem', lineHeight: 1.6, margin: 0 }}>
                {result.crisis_warning}
              </p>
            </div>

            {/* Score Wheel Simulation */}
            <div style={{
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
              border: '1px solid var(--color-border)',
              borderRadius: '20px',
              padding: '28px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Skor Kumulatif 8 Dimensi
              </div>
              <div style={{
                fontSize: '3.6rem',
                fontWeight: 900,
                color: result.overall_score >= 80 ? '#10b981' : '#f59e0b',
                fontFamily: 'var(--font-heading)',
                lineHeight: 1.1,
                margin: '10px 0'
              }}>
                {result.overall_score}%
              </div>
              <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                Syarat Minimum Kelulusan Gerbang: <strong>80.0% + 100% Butir Kunci ★</strong>
              </div>

              <div style={{ height: '1px', background: 'var(--color-border)', margin: '18px 0' }} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem' }}>
                <div style={{ background: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ color: '#64748b' }}>Butir Kunci ★ Lulus</div>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: result.key_tidak === 0 ? '#16a34a' : '#dc2626' }}>
                    {result.key_ya} / {result.total_key_questions}
                  </div>
                </div>
                <div style={{ background: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ color: '#64748b' }}>Total Butir Ya</div>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>
                    {result.answered_ya} / {result.total_questions}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: 8 DIMENSIONS PERFORMANCE RADAR / BARS */}
        <div style={{
          background: '#ffffff',
          border: '1px solid var(--color-border)',
          borderRadius: '24px',
          padding: '36px',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '32px'
        }}>
          <h2 style={{ fontSize: '1.45rem', marginBottom: '8px' }}>
            Rapor Kesehatan 8 Dimensi Operasional Bisnis
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.92rem', marginBottom: '28px' }}>
            Grafik komparatif capaian per departemen. Warna merah menandakan seksi yang mengandung butir kunci belum terpenuhi.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {result.section_scores.map((sc: any, idx: number) => {
              const isWarning = sc.score_pct < 60 || !sc.key_pass;
              return (
                <div key={idx} style={{
                  padding: '16px 20px',
                  borderRadius: '14px',
                  background: isWarning ? '#fff7ed' : '#f8fafc',
                  border: isWarning ? '1px solid #fdba74' : '1px solid var(--color-border)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        background: isWarning ? '#ea580c' : '#0284c7',
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        padding: '2px 8px',
                        borderRadius: '4px'
                      }}>
                        Seksi {sc.section_code}
                      </span>
                      <span style={{ fontWeight: 700, fontSize: '0.98rem', color: '#0f172a' }}>
                        {sc.section_name}
                      </span>
                      {!sc.key_pass && (
                        <span className="badge-key" style={{ fontSize: '0.7rem' }}>
                          ★ Gerbang Kunci Gagal
                        </span>
                      )}
                    </div>

                    <div style={{ fontWeight: 800, fontSize: '1.05rem', color: isWarning ? '#ea580c' : '#15803d' }}>
                      {sc.score_pct}% ({sc.ya_count}/{sc.total} Butir)
                    </div>
                  </div>

                  {/* Visual Bar */}
                  <div style={{
                    width: '100%',
                    height: '10px',
                    background: '#e2e8f0',
                    borderRadius: '999px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${sc.score_pct}%`,
                      height: '100%',
                      background: isWarning 
                        ? 'linear-gradient(90deg, #f97316, #ef4444)' 
                        : 'linear-gradient(90deg, #0284c7, #10b981)',
                      transition: 'width 0.4s ease'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 3: CRITICAL KEY GAPS (PRIORITAS KRITIS) */}
        <div style={{
          background: '#ffffff',
          border: '1.5px solid #fecaca',
          borderRadius: '24px',
          padding: '36px',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '32px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <span style={{
              background: '#ef4444',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.75rem',
              padding: '4px 12px',
              borderRadius: '999px',
              letterSpacing: '0.04em'
            }}>
              PRIORITAS KRITIS PERBAIKAN
            </span>
          </div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>
            Butir Kunci (★) yang Menjadi Penyumbat Kelulusan Fase
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.92rem', marginBottom: '24px' }}>
            Satu saja butir ini dijawab "TIDAK", bisnis Anda belum siap naik level dan berisiko mengalami turbulensi fatal jika dipaksakan bertumbuh.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {result.critical_gaps.map((gap: any, gi: number) => (
              <div key={gi} style={{
                background: '#fff1f2',
                border: '1px solid #fecdd3',
                borderRadius: '16px',
                padding: '20px 24px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '20px',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <XCircle size={18} color="#e11d48" />
                    <span style={{ fontWeight: 700, color: '#be123c', fontSize: '0.85rem' }}>
                      Gagal di Seksi: {gap.section_name} (Soal #{gap.question_number})
                    </span>
                  </div>
                  <div style={{ fontWeight: 650, fontSize: '1.02rem', color: '#0f172a' }}>
                    {gap.question_text}
                  </div>
                </div>

                <div style={{
                  background: '#ffffff',
                  border: '1px solid #fda4af',
                  borderRadius: '12px',
                  padding: '16px',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <div style={{ fontSize: '0.75rem', color: '#be123c', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>
                    Rekomendasi Penanganan Spesifik:
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                    {gap.recommendation_title}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '10px' }}>
                    Instruktur / Penulis: {gap.recommendation_author}
                  </div>
                  <button
                    onClick={() => onBuyUpsell(gap.recommendation_title)}
                    className="btn btn-primary"
                    style={{ padding: '6px 14px', fontSize: '0.82rem', width: '100%' }}
                  >
                    Akses Solusi Ini →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 4: CURATED RECOMMENDATION LIBRARY */}
        <div style={{
          background: '#ffffff',
          border: '1px solid var(--color-border)',
          borderRadius: '24px',
          padding: '36px',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '32px'
        }}>
          <h2 style={{ fontSize: '1.45rem', marginBottom: '8px' }}>
            Kurikulum Bacaan & Rekomendasi Solusi Fase Ini
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.92rem', marginBottom: '24px' }}>
            Berdasarkan profil gap jawaban Anda, berikut adalah buku dan modul pembelajaran pilihan Riza Zacharias yang paling mendesak untuk dipelajari.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {result.recommendations.map((rec: any, ri: number) => (
              <div key={ri} style={{
                background: '#f8fafc',
                border: '1px solid var(--color-border)',
                borderRadius: '16px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{
                    display: 'inline-block',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: rec.type === 'BUKU' ? '#e0f2fe' : '#fef3c7',
                    color: rec.type === 'BUKU' ? '#0369a1' : '#b45309',
                    marginBottom: '10px'
                  }}>
                    {rec.type === 'BUKU' ? '📚 BUKU WAJIB' : '🎓 WORKSHOP / KELAS'}
                  </div>

                  <h3 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>{rec.title}</h3>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '12px' }}>
                    Oleh: {rec.author_or_name}
                  </div>
                  <p style={{ fontSize: '0.88rem', color: '#334155', lineHeight: 1.6, marginBottom: '20px' }}>
                    {rec.description}
                  </p>
                </div>

                <div>
                  {rec.price ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Investasi:</span>
                      <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0284c7' }}>
                        Rp {rec.price.toLocaleString('id-ID')}
                      </span>
                    </div>
                  ) : null}

                  <button
                    onClick={() => {
                      if (rec.price) {
                        onBuyUpsell(rec.title);
                      } else {
                        window.open(rec.external_url, '_blank');
                      }
                    }}
                    className={rec.price ? 'btn btn-primary' : 'btn btn-outline'}
                    style={{ width: '100%', padding: '10px', fontSize: '0.88rem' }}
                  >
                    {rec.price ? 'Daftar Kelas Ini →' : 'Cari Buku di Tokopedia ↗'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 5: 30-60-90 DAYS ROADMAP */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          borderRadius: '24px',
          padding: '40px',
          boxShadow: 'var(--shadow-lg)',
          marginBottom: '32px'
        }}>
          <h2 style={{ fontSize: '1.6rem', color: '#ffffff', marginBottom: '8px' }}>
            Roadmap Aksi 30 — 60 — 90 Hari Kedepan
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '28px' }}>
            Langkah konkret yang harus Anda eksekusi bersama tim Anda untuk menembus gerbang fase berikutnya:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <div style={{ color: '#38bdf8', fontWeight: 800, fontSize: '1rem', marginBottom: '10px' }}>
                Bulan 1 (30 Hari Pertama)
              </div>
              <ul style={{ paddingLeft: '18px', fontSize: '0.88rem', color: '#e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>Pisahkan rekening bank usaha 100% dari rekening belanja rumah tangga.</li>
                <li>Hitung COGS dan Break-Even Point (BEP) bulanan yang akurat bersama tim keuangan.</li>
                <li>Hentikan diskon yang membakar modal di bawah biaya HPP.</li>
              </ul>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <div style={{ color: '#f59e0b', fontWeight: 800, fontSize: '1rem', marginBottom: '10px' }}>
                Bulan 2 (60 Hari)
              </div>
              <ul style={{ paddingLeft: '18px', fontSize: '0.88rem', color: '#e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>Rekrut 1-2 staf operasional teknis pertama dan berikan job description jelas.</li>
                <li>Owner mulai berhenti membalas chat komplain teknis sendiri.</li>
                <li>Susun SOP sederhana untuk checklist pembukaan dan penutupan harian.</li>
              </ul>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <div style={{ color: '#4ade80', fontWeight: 800, fontSize: '1rem', marginBottom: '10px' }}>
                Bulan 3 (90 Hari)
              </div>
              <ul style={{ paddingLeft: '18px', fontSize: '0.88rem', color: '#e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>Lakukan audit ulang NaikFase untuk memverifikasi kenaikan ke Fase 2 (Cash Growth).</li>
                <li>Bangun 2 kanal pemasaran berulang (repeat order engine).</li>
                <li>Tetapkan target cash buffer cadangan kas minimal 3 bulan operasional.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* SECTION 6: CONTEXTUAL UPSELL COACHING */}
        <div style={{
          background: '#f0fdf4',
          border: '2px solid #bbf7d0',
          borderRadius: '24px',
          padding: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '24px'
        }}>
          <div style={{ maxWidth: '640px' }}>
            <span style={{
              background: '#16a34a',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.75rem',
              padding: '3px 10px',
              borderRadius: '999px',
              letterSpacing: '0.04em'
            }}>
              PENDAMPINGAN EKSEKUTIF
            </span>
            <h3 style={{ fontSize: '1.5rem', margin: '8px 0', color: '#14532d' }}>
              Butuh Mentor Berpengalaman untuk Membedah Hasil Audit Ini Bersama Anda?
            </h3>
            <p style={{ color: '#166534', fontSize: '0.95rem', margin: 0, lineHeight: 1.6 }}>
              Ambil sesi 1:1 Strategic Business Review (90 Menit via Zoom) bersama Senior Advisor Syaamil Group untuk menyusun rencana pembenahan kas dan tim secara customized.
            </p>
          </div>

          <button
            onClick={() => onBuyUpsell('Coaching 1:1 Senior Advisor Syaamil')}
            className="btn btn-primary"
            style={{ padding: '14px 28px', fontSize: '1rem', background: '#16a34a', border: 'none' }}
          >
            Jadwalkan Sesi Coaching 1:1 →
          </button>
        </div>

      </div>
    </div>
  );
};
