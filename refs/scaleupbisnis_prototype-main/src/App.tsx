import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';

// Shared Layouts
import { Navbar } from './components/Navbar';
import { AdminLayout } from './components/AdminLayout';
import { PortalLayout } from './components/PortalLayout';

// Pages
import { LandingPage } from './pages/LandingPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { TestAssessmentPage } from './pages/TestAssessmentPage';
import { ResultReportPage } from './pages/ResultReportPage';
import { AdminPanelPage } from './pages/AdminPanelPage';
import { LoginPage } from './pages/LoginPage';
import { CustomerPortal } from './pages/CustomerPortal';

// Data
import { sampleCompletedResult, phasesData, sampleQuestions, sampleSections } from './mockData';

export function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  const [selectedProductId, setSelectedProductId] = useState<number>(2);
  const [currentUser, setCurrentUser] = useState<any>({
    id: 1,
    name: 'Budi Santoso',
    email: 'budi.santoso@berkahmandiri.id',
    business_name: 'Toko Berkah Mandiri',
    business_field: 'Ritel Sembako & Distribusi',
    role: 'CUSTOMER'
  });

  const [activeResult, setActiveResult] = useState<any>(sampleCompletedResult);

  // Sync state with browser History API (popstate)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleSelectProduct = (prodId: number) => {
    setSelectedProductId(prodId);
    navigateTo('/checkout');
  };

  const handlePaymentSuccess = () => {
    triggerConfetti();
    navigateTo('/portal');
  };

  const handleFinishTest = (answers: Record<number, 'YA' | 'TIDAK' | 'TIDAK_BERLAKU'>, sessionMeta: any) => {
    let yaCount = 0;
    let tidakCount = 0;
    let keyYaCount = 0;
    let keyTidakCount = 0;
    const criticalGaps: any[] = [];

    sampleQuestions.forEach(q => {
      const ans = answers[q.id];
      if (ans === 'YA') {
        yaCount++;
        if (q.is_key) keyYaCount++;
      } else if (ans === 'TIDAK') {
        tidakCount++;
        if (q.is_key) {
          keyTidakCount++;
          const sec = sampleSections.find(s => s.id === q.section_id);
          criticalGaps.push({
            question_number: q.question_number,
            question_text: q.question_text,
            section_name: sec ? sec.name : 'Operasional',
            is_key: true,
            recommendation_title: q.question_number === 9 
              ? 'Workshop: Menghitung COGS, HPP & Titik Impas (BEP)' 
              : q.question_number === 11 
              ? 'Buku: The E-Myth Revisited' 
              : 'Ebook: Panduan Pemisahan Kas Usaha',
            recommendation_author: q.question_number === 9 ? 'Tim Finansial NaikFase' : 'Michael E. Gerber',
            recommendation_type: q.question_number === 9 ? 'KELAS_INTERNAL' : 'BUKU'
          });
        }
      }
    });

    const totalQ = sampleQuestions.length;
    const overallScore = Math.round((yaCount / totalQ) * 100 * 10) / 10;
    const totalKeyQ = sampleQuestions.filter(q => q.is_key).length;
    const keyPass = keyTidakCount === 0;

    let status = 'BELUM_SIAP';
    let statusLabel = 'Gerbang Belum Terbuka (Perlu Pembenahan Butir Kunci)';

    if (keyPass && overallScore >= 80) {
      status = 'SIAP_NAIK';
      statusLabel = '🟢 Siap Naik Fase (Level Up Ready)';
    } else if (keyPass && overallScore >= 60) {
      status = 'HAMPIR';
      statusLabel = '🟡 Hampir Siap (Perlu Penguatan Dimensi Biasa)';
    } else if (keyTidakCount >= 3 || overallScore < 50) {
      status = 'DALAM_BAHAYA';
      statusLabel = '🚨 Dalam Bahaya (Krisis Kritis Terdeteksi)';
    }

    const calculatedResult = {
      session_id: Date.now(),
      respondent_name: sessionMeta.respondent_name || 'Budi Santoso',
      company_name: sessionMeta.company_name || 'Toko Berkah Mandiri',
      business_field: sessionMeta.business_field || 'Ritel & Grosir',
      audit_name: 'Audit Fase 1 ke 2: Survival → Cash Growth',
      overall_score: overallScore,
      key_pass: keyPass,
      status: status,
      status_label: statusLabel,
      total_questions: totalQ,
      total_key_questions: totalKeyQ,
      answered_ya: yaCount,
      answered_tidak: tidakCount,
      key_ya: keyYaCount,
      key_tidak: keyTidakCount,
      from_phase: phasesData[0],
      to_phase: phasesData[1],
      crisis_warning: keyPass 
        ? 'Selamat! Seluruh kriteria kunci gerbang survival telah terpenuhi. Bisnis Anda siap melangkah ke fase Cash Growth.'
        : `Krisis Kepemimpinan Terdeteksi: Ditemukan ${keyTidakCount} butir kunci (★) yang dijawab TIDAK. Gerbang kelulusan belum dapat dibuka.`,
      section_scores: sampleCompletedResult.section_scores,
      critical_gaps: criticalGaps.length > 0 ? criticalGaps : sampleCompletedResult.critical_gaps,
      recommendations: sampleCompletedResult.recommendations
    };

    setActiveResult(calculatedResult);
    triggerConfetti();
    navigateTo('/result');
  };

  const handleBuyUpsell = (itemTitle: string) => {
    alert(`Mengarahkan pendaftaran untuk "${itemTitle}". Membuka invoice upgrade...`);
    navigateTo('/checkout');
  };

  // ==========================================
  // 1. ROUTE /admin & SUB-PAGES (/admin/orders, /admin/customers, /admin/questions, /admin/products)
  // Completely isolated layout with left sidebar
  // ==========================================
  if (currentPath.startsWith('/admin')) {
    let sub = 'dashboard';
    if (currentPath === '/admin/orders') sub = 'orders';
    if (currentPath === '/admin/customers') sub = 'customers';
    if (currentPath === '/admin/questions') sub = 'questions';
    if (currentPath === '/admin/products') sub = 'products';

    return (
      <AdminLayout
        activePath={currentPath}
        onNavigate={navigateTo}
        currentUser={currentUser}
        onLogout={() => {
          setCurrentUser(null);
          navigateTo('/login');
        }}
      >
        <AdminPanelPage onNavigate={navigateTo} subSection={sub} />
      </AdminLayout>
    );
  }

  // ==========================================
  // 2. ROUTE USER / MEMBER MODE (PORTAL, AUDIT TEST, RESULT REPORT)
  // When logged in or accessing /portal, /test, /result:
  // Render inside dedicated PortalLayout with left sidebar!
  // ==========================================
  if (
    currentPath === '/portal' || 
    currentPath.startsWith('/portal/') || 
    currentPath === '/test' || 
    currentPath === '/result'
  ) {
    return (
      <PortalLayout
        activePath={currentPath}
        onNavigate={navigateTo}
        currentUser={currentUser}
        onLogout={() => {
          setCurrentUser(null);
          navigateTo('/login');
        }}
      >
        {currentPath === '/test' ? (
          <TestAssessmentPage
            onFinishTest={handleFinishTest}
            onNavigate={navigateTo}
          />
        ) : currentPath === '/result' ? (
          <ResultReportPage
            customResult={activeResult}
            onNavigate={navigateTo}
            onBuyUpsell={handleBuyUpsell}
          />
        ) : (
          <CustomerPortal
            currentUser={currentUser}
            onNavigate={navigateTo}
            subPage={currentPath === '/portal/services' ? 'services' : currentPath === '/portal/orders' ? 'orders' : 'overview'}
            onSelectProduct={(id) => {
              setSelectedProductId(id);
              navigateTo('/checkout');
            }}
          />
        )}
      </PortalLayout>
    );
  }

  // ==========================================
  // 3. ROUTE /login (CLEAN STANDALONE PAGE)
  // ==========================================
  if (currentPath === '/login') {
    return (
      <LoginPage
        onLoginSuccess={(user) => {
          setCurrentUser(user);
        }}
        onNavigate={navigateTo}
      />
    );
  }

  // ==========================================
  // 4. PUBLIC LANDING PAGE & CHECKOUT
  // Standard public Header & Footer matching screenshot
  // ==========================================
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        onNavigate={navigateTo}
        currentUser={currentUser}
      />

      <main style={{ flex: 1 }}>
        {currentPath === '/checkout' ? (
          <CheckoutPage
            selectedProductId={selectedProductId}
            onPaymentSuccess={handlePaymentSuccess}
            onBack={() => navigateTo('/')}
          />
        ) : (
          <LandingPage
            onSelectProduct={handleSelectProduct}
            onStartDemoTest={() => navigateTo('/test')}
            onNavigate={navigateTo}
          />
        )}
      </main>

      {/* Clean Public Footer */}
      <footer style={{
        background: '#ffffff',
        color: '#64748b',
        padding: '50px 0 30px',
        borderTop: '1px solid #e2e8f0',
        fontSize: '0.88rem'
      }}>
        <div className="container">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '24px',
            marginBottom: '32px'
          }}>
            <div style={{ maxWidth: '420px' }}>
              <div style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.25rem',
                fontWeight: 800,
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px'
              }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff'
                }}>
                  📈
                </div>
                <span>ScaleUp<span style={{ color: '#059669' }}>Bisnis</span></span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                Platform audit fase bisnis untuk membantu entrepreneur Indonesia tumbuh lebih terarah.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '22px', flexWrap: 'wrap', fontSize: '0.86rem', fontWeight: 500 }}>
              <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('/'); }}>Beranda</a>
              <a href="#features-section" onClick={(e) => { e.preventDefault(); navigateTo('/'); setTimeout(() => document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' }), 50); }}>Fitur</a>
              <a href="#how-it-works-section" onClick={(e) => { e.preventDefault(); navigateTo('/'); setTimeout(() => document.getElementById('how-it-works-section')?.scrollIntoView({ behavior: 'smooth' }), 50); }}>Cara Kerja</a>
              <a href="#pricing-section" onClick={(e) => { e.preventDefault(); navigateTo('/'); setTimeout(() => document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' }), 50); }}>Harga</a>
              <a href="#testimonials-section" onClick={(e) => { e.preventDefault(); navigateTo('/'); setTimeout(() => document.getElementById('testimonials-section')?.scrollIntoView({ behavior: 'smooth' }), 50); }}>Testimoni</a>
              <a href="#faq-section" onClick={(e) => { e.preventDefault(); navigateTo('/'); setTimeout(() => document.getElementById('faq-section')?.scrollIntoView({ behavior: 'smooth' }), 50); }}>FAQ</a>
            </div>

            <div style={{ display: 'flex', gap: '10px', color: '#94a3b8' }}>
              <span style={{ cursor: 'pointer', background: '#f1f5f9', padding: '6px 10px', borderRadius: '8px', fontSize: '0.8rem' }}>in</span>
              <span style={{ cursor: 'pointer', background: '#f1f5f9', padding: '6px 10px', borderRadius: '8px', fontSize: '0.8rem' }}>ig</span>
              <span style={{ cursor: 'pointer', background: '#f1f5f9', padding: '6px 10px', borderRadius: '8px', fontSize: '0.8rem' }}>yt</span>
            </div>
          </div>

          <div style={{
            borderTop: '1px solid #f1f5f9',
            paddingTop: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            fontSize: '0.78rem',
            color: '#94a3b8'
          }}>
            <div>
              © 2026 ScaleUpBisnis. All rights reserved.
            </div>
            <div style={{ display: 'flex', gap: '14px' }}>
              <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('/admin'); }} style={{ color: '#059669', textDecoration: 'none', fontWeight: 600 }}>Panel Admin ↗</a>
              <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('/login'); }} style={{ color: '#64748b', textDecoration: 'none' }}>Login Member ↗</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
