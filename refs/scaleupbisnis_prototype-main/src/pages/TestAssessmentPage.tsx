import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  MinusCircle, 
  Star, 
  HelpCircle, 
  ArrowRight, 
  ArrowLeft, 
  Send, 
  Sparkles,
  Info,
  Clock,
  Layers,
  Save
} from 'lucide-react';
import { sampleSections, sampleQuestions } from '../mockData';
import type { TestSection, TestQuestion } from '../types';

interface TestAssessmentPageProps {
  onFinishTest: (answers: Record<number, 'YA' | 'TIDAK' | 'TIDAK_BERLAKU'>, sessionMeta: any) => void;
  onNavigate: (page: string) => void;
}

export const TestAssessmentPage: React.FC<TestAssessmentPageProps> = ({
  onFinishTest,
  onNavigate
}) => {
  // Pre-test form metadata (PRD Section 5.3)
  const [hasStartedSession, setHasStartedSession] = useState(false);
  const [respondentName, setRespondentName] = useState('Budi Santoso');
  const [companyName, setCompanyName] = useState('Toko Berkah Mandiri');
  const [businessField, setBusinessField] = useState('Ritel Sembako & Distribusi');
  const [businessStartYear, setBusinessStartYear] = useState('2019');
  const [externalAuditorName, setExternalAuditorName] = useState('');

  // Active section state
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  
  // Answers state: questionId -> 'YA' | 'TIDAK' | 'TIDAK_BERLAKU'
  const [answers, setAnswers] = useState<Record<number, 'YA' | 'TIDAK' | 'TIDAK_BERLAKU'>>({
    1: 'YA',
    2: 'YA',
    3: 'TIDAK', // Critical Key Failure: Belanja bisnis dicampur pribadi
    4: 'YA',
    5: 'YA',
    6: 'YA',
    7: 'YA',
    8: 'YA',
    9: 'TIDAK', // Critical Key Failure: BEP belum presisi
    10: 'YA',
    11: 'TIDAK', // Critical Key Failure: Belum ada tim delegasi
    12: 'YA'
  });

  const [notes, setNotes] = useState<Record<number, string>>({});
  const [autoSaveStatus, setAutoSaveStatus] = useState<string>('Tersimpan otomatis');

  const currentSection = sampleSections[activeSectionIndex] || sampleSections[0];
  const questionsInCurrentSection = sampleQuestions.filter(q => q.section_id === currentSection.id);

  // Overall statistics
  const totalQuestions = sampleQuestions.length;
  const answeredCount = Object.keys(answers).length;
  const progressPct = Math.round((answeredCount / totalQuestions) * 100);

  const handleSelectAnswer = (qId: number, val: 'YA' | 'TIDAK' | 'TIDAK_BERLAKU') => {
    setAutoSaveStatus('Menyimpan perubahan...');
    setAnswers(prev => ({
      ...prev,
      [qId]: val
    }));
    setTimeout(() => {
      setAutoSaveStatus('Tersimpan di cloud');
    }, 300);
  };

  const handleNextSection = () => {
    if (activeSectionIndex < sampleSections.length - 1) {
      setActiveSectionIndex(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevSection = () => {
    if (activeSectionIndex > 0) {
      setActiveSectionIndex(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmitAll = () => {
    // Confirm submission
    if (window.confirm('Apakah Anda yakin ingin menyelesaikan audit? Jawaban akan dikunci dan sistem akan mengalkulasi skor serta menghasilkan rekomendasi.')) {
      onFinishTest(answers, {
        respondent_name: respondentName,
        company_name: companyName,
        business_field: businessField,
        business_start_year: businessStartYear
      });
    }
  };

  if (!hasStartedSession) {
    return (
      <div style={{ padding: '60px 0 80px', background: '#f8fafc', minHeight: 'calc(100vh - 72px)' }}>
        <div className="container" style={{ maxWidth: '640px' }}>
          <div style={{
            background: '#ffffff',
            border: '1px solid var(--color-border)',
            borderRadius: '24px',
            padding: '40px',
            boxShadow: 'var(--shadow-md)'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#e0f2fe',
              color: '#0369a1',
              fontWeight: 700,
              fontSize: '0.8rem',
              padding: '4px 14px',
              borderRadius: '999px',
              marginBottom: '16px'
            }}>
              <Sparkles size={14} />
              PERSIAPAN SESI AUDIT MANAJEMEN
            </div>
            
            <h1 style={{ fontSize: '1.9rem', marginBottom: '12px' }}>
              Data Awal Perusahaan & Responden
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', marginBottom: '28px', lineHeight: 1.6 }}>
              Informasi ini akan dicetak resmi pada halaman Cover dan Executive Summary Laporan PDF Anda.
            </p>

            <form onSubmit={(e) => { e.preventDefault(); setHasStartedSession(true); }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '28px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px' }}>
                    Nama Lengkap Pengisi Audit *
                  </label>
                  <input
                    type="text"
                    required
                    value={respondentName}
                    onChange={(e) => setRespondentName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '1px solid var(--color-border)',
                      borderRadius: '10px',
                      fontSize: '0.95rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px' }}>
                    Nama Perusahaan / Bisnis *
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '1px solid var(--color-border)',
                      borderRadius: '10px',
                      fontSize: '0.95rem'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px' }}>
                      Bidang Industri *
                    </label>
                    <input
                      type="text"
                      required
                      value={businessField}
                      onChange={(e) => setBusinessField(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        border: '1px solid var(--color-border)',
                        borderRadius: '10px',
                        fontSize: '0.95rem'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px' }}>
                      Tahun Berdiri Usaha *
                    </label>
                    <input
                      type="number"
                      required
                      value={businessStartYear}
                      onChange={(e) => setBusinessStartYear(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        border: '1px solid var(--color-border)',
                        borderRadius: '10px',
                        fontSize: '0.95rem'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px' }}>
                    Nama Penilai Eksternal / Rekan (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Kosongkan jika diisi sendiri oleh founder"
                    value={externalAuditorName}
                    onChange={(e) => setExternalAuditorName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '1px solid var(--color-border)',
                      borderRadius: '10px',
                      fontSize: '0.95rem'
                    }}
                  />
                </div>
              </div>

              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '16px',
                fontSize: '0.85rem',
                color: '#475569',
                marginBottom: '24px',
                display: 'flex',
                gap: '10px'
              }}>
                <Info size={18} color="#0284c7" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  <strong>Petunjuk Pengisian:</strong> Jawablah sesuai kenyataan operasional saat ini. Menjawab "Ya" pada hal yang belum terjadi hanya akan mengaburkan diagnosis dan merugikan bisnis Anda sendiri.
                </span>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '14px', fontSize: '1.05rem', borderRadius: '12px' }}
              >
                Mulai Lembar Kerja Audit →
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '30px 0 80px', background: '#f8fafc', minHeight: 'calc(100vh - 72px)' }}>
      <div className="container" style={{ maxWidth: '1040px' }}>
        
        {/* Top Floating Progress Bar */}
        <div style={{
          background: '#ffffff',
          border: '1px solid var(--color-border)',
          borderRadius: '16px',
          padding: '16px 24px',
          marginBottom: '24px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Audit Aktif: <strong>Audit Fase 1 ke 2: Survival ke Cash Growth</strong>
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
              {companyName} ({respondentName})
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                Progres Pengisian
              </div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0284c7' }}>
                {answeredCount} / {totalQuestions} Butir ({progressPct}%)
              </div>
            </div>

            <div style={{
              width: '120px',
              height: '10px',
              background: '#e2e8f0',
              borderRadius: '999px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${progressPct}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #0284c7, #10b981)',
                transition: 'width 0.3s ease'
              }} />
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.78rem',
              color: '#16a34a',
              background: '#dcfce7',
              padding: '4px 10px',
              borderRadius: '999px'
            }}>
              <Save size={13} />
              <span>{autoSaveStatus}</span>
            </div>
          </div>
        </div>

        {/* Section Navigation Pills */}
        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '12px',
          marginBottom: '24px'
        }}>
          {sampleSections.map((sec, idx) => {
            const isActive = idx === activeSectionIndex;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSectionIndex(idx)}
                style={{
                  padding: '10px 16px',
                  borderRadius: '12px',
                  background: isActive ? '#0284c7' : '#ffffff',
                  color: isActive ? '#ffffff' : '#334155',
                  border: isActive ? '1px solid #0284c7' : '1px solid var(--color-border)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>Seksi {sec.code}</span>
                <span style={{ opacity: 0.8, fontSize: '0.78rem' }}>{sec.name}</span>
              </button>
            );
          })}
        </div>

        {/* Active Section Header */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          borderRadius: '20px',
          padding: '24px 30px',
          marginBottom: '24px'
        }}>
          <div style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#38bdf8',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            marginBottom: '4px'
          }}>
            SEKSI {currentSection.code} DARI {sampleSections.length}
          </div>
          <h2 style={{ fontSize: '1.6rem', color: '#ffffff', marginBottom: '4px' }}>
            {currentSection.name}
          </h2>
          {currentSection.sub_name && (
            <div style={{ color: '#94a3b8', fontSize: '0.92rem' }}>
              Fokus Utama: {currentSection.sub_name}
            </div>
          )}
        </div>

        {/* Question Cards List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
          {questionsInCurrentSection.length === 0 ? (
            <div style={{
              background: '#ffffff',
              border: '1px solid var(--color-border)',
              borderRadius: '16px',
              padding: '36px',
              textAlign: 'center',
              color: 'var(--color-text-muted)'
            }}>
              <p>Butir pertanyaan seksi ini tersedia di lembar lengkap instrumen 92 butir.</p>
              <button
                onClick={() => setActiveSectionIndex(0)}
                className="btn btn-outline"
                style={{ marginTop: '12px' }}
              >
                Kembali ke Seksi A
              </button>
            </div>
          ) : (
            questionsInCurrentSection.map((q) => {
              const currentAns = answers[q.id];
              return (
                <div
                  key={q.id}
                  style={{
                    background: '#ffffff',
                    border: q.is_key ? '1.5px solid #fed7aa' : '1px solid var(--color-border)',
                    borderRadius: '18px',
                    padding: '24px',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'border-color 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <span style={{
                        background: '#f1f5f9',
                        color: '#475569',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        padding: '3px 10px',
                        borderRadius: '6px'
                      }}>
                        No. {q.question_number}
                      </span>

                      {q.is_key && (
                        <span className="badge-key">
                          <Star size={13} fill="#dc2626" />
                          BUTIR KUNCI GERBANG (WAJIB YA)
                        </span>
                      )}
                    </div>

                    <span style={{ fontSize: '0.78rem', color: currentAns ? '#10b981' : '#94a3b8', fontWeight: 600 }}>
                      {currentAns ? '● Terjawab' : '○ Belum diisi'}
                    </span>
                  </div>

                  <h3 style={{
                    fontSize: '1.12rem',
                    lineHeight: 1.5,
                    color: '#0f172a',
                    marginBottom: '10px',
                    fontWeight: 650
                  }}>
                    {q.question_text}
                  </h3>

                  {q.guidance_text && (
                    <div style={{
                      background: '#fffbeb',
                      border: '1px solid #fef3c7',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      fontSize: '0.85rem',
                      color: '#92400e',
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px'
                    }}>
                      <HelpCircle size={16} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{q.guidance_text}</span>
                    </div>
                  )}

                  {/* 3 Answer Buttons: YA / TIDAK / TIDAK BERLAKU */}
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '12px' }}>
                    <button
                      type="button"
                      onClick={() => handleSelectAnswer(q.id, 'YA')}
                      style={{
                        flex: '1 1 120px',
                        padding: '12px 18px',
                        borderRadius: '10px',
                        border: currentAns === 'YA' ? '2px solid #16a34a' : '1px solid var(--color-border)',
                        background: currentAns === 'YA' ? '#dcfce7' : '#f8fafc',
                        color: currentAns === 'YA' ? '#15803d' : '#334155',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <CheckCircle2 size={18} color={currentAns === 'YA' ? '#16a34a' : '#64748b'} />
                      <span>YA (Sudah Dilakukan)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectAnswer(q.id, 'TIDAK')}
                      style={{
                        flex: '1 1 120px',
                        padding: '12px 18px',
                        borderRadius: '10px',
                        border: currentAns === 'TIDAK' ? '2px solid #dc2626' : '1px solid var(--color-border)',
                        background: currentAns === 'TIDAK' ? '#fee2e2' : '#f8fafc',
                        color: currentAns === 'TIDAK' ? '#991b1b' : '#334155',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <XCircle size={18} color={currentAns === 'TIDAK' ? '#dc2626' : '#64748b'} />
                      <span>TIDAK (Belum Ada)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectAnswer(q.id, 'TIDAK_BERLAKU')}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '10px',
                        border: currentAns === 'TIDAK_BERLAKU' ? '2px solid #64748b' : '1px solid var(--color-border)',
                        background: currentAns === 'TIDAK_BERLAKU' ? '#f1f5f9' : '#f8fafc',
                        color: currentAns === 'TIDAK_BERLAKU' ? '#0f172a' : '#64748b',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <MinusCircle size={16} />
                      <span>Tidak Berlaku</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Section Navigation Footbar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          background: '#ffffff',
          padding: '20px 24px',
          borderRadius: '18px',
          border: '1px solid var(--color-border)'
        }}>
          <button
            type="button"
            disabled={activeSectionIndex === 0}
            onClick={handlePrevSection}
            className="btn btn-outline"
            style={{ opacity: activeSectionIndex === 0 ? 0.4 : 1 }}
          >
            <ArrowLeft size={16} />
            Seksi Sebelumnya
          </button>

          <div style={{ display: 'flex', gap: '12px' }}>
            {activeSectionIndex < sampleSections.length - 1 ? (
              <button
                type="button"
                onClick={handleNextSection}
                className="btn btn-primary"
              >
                Lanjut ke Seksi Berikutnya
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitAll}
                className="btn btn-accent"
                style={{ background: '#16a34a', color: '#fff', padding: '12px 28px' }}
              >
                <Send size={18} />
                Selesaikan & Terbitkan Laporan Audit →
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
