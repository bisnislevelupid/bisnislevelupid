import React, { useState } from 'react';
import { 
  TrendingUp, 
  Menu, 
  X, 
  ArrowRight,
  User
} from 'lucide-react';

interface NavbarProps {
  onNavigate: (path: string) => void;
  currentUser: any;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onNavigate, 
  currentUser 
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Exact public landing links from attachment image:
  // Beranda | Fitur | Cara Kerja | Harga | Testimoni | FAQ
  const navItems = [
    { label: 'Beranda', href: '#', onClick: () => { onNavigate('/'); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
    { label: 'Fitur', href: '#features-section', onClick: () => scrollToSection('features-section') },
    { label: 'Cara Kerja', href: '#how-it-works-section', onClick: () => scrollToSection('how-it-works-section') },
    { label: 'Harga', href: '#pricing-section', onClick: () => scrollToSection('pricing-section') },
    { label: 'Testimoni', href: '#testimonials-section', onClick: () => scrollToSection('testimonials-section') },
    { label: 'FAQ', href: '#faq-section', onClick: () => scrollToSection('faq-section') },
  ];

  const scrollToSection = (sectionId: string) => {
    if (window.location.pathname !== '/' && window.location.hash !== '') {
      onNavigate('/');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
      transition: 'all 0.2s ease'
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '76px'
      }}>
        {/* Brand Logo - ScaleUp Bisnis */}
        <div 
          onClick={() => { onNavigate('/'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
          }}>
            <TrendingUp size={22} strokeWidth={2.5} />
          </div>
          <div style={{ 
            fontFamily: 'var(--font-heading)',
            fontSize: '1.4rem', 
            fontWeight: 800,
            color: '#0f172a',
            letterSpacing: '-0.02em',
            display: 'flex',
            alignItems: 'center',
            gap: '2px'
          }}>
            ScaleUp<span style={{ color: '#059669' }}>Bisnis</span>
          </div>
        </div>

        {/* Clean Center Navigation Menu - EXACTLY like screenshot */}
        <nav style={{ display: 'none', alignItems: 'center', gap: '32px' }} className="desktop-nav">
          {navItems.map((item, idx) => (
            <a
              key={idx}
              href={item.href}
              onClick={(e) => {
                e.preventDefault();
                item.onClick();
              }}
              style={{
                color: '#475569',
                fontFamily: 'var(--font-heading)',
                fontWeight: 500,
                fontSize: '0.94rem',
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'color 0.15s ease',
                padding: '4px 0'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#059669')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#475569')}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Right CTA Button - EXACTLY like screenshot */}
        <div style={{ display: 'none', alignItems: 'center', gap: '14px' }} className="desktop-actions">
          {currentUser ? (
            <button
              onClick={() => onNavigate('/portal')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#334155',
                padding: '8px 16px',
                borderRadius: '999px',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <User size={15} color="#059669" />
              <span>Portal Member</span>
            </button>
          ) : (
            <button
              onClick={() => onNavigate('/login')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#475569',
                padding: '8px 14px',
                fontSize: '0.92rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#059669')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#475569')}
            >
              Masuk
            </button>
          )}

          <button
            onClick={() => onNavigate('/checkout')}
            className="btn btn-primary"
            style={{
              padding: '11px 24px',
              fontSize: '0.92rem',
              borderRadius: '999px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)'
            }}
          >
            Temukan Fase Bisnisku
            <ArrowRight size={15} />
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f8fafc',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            padding: '8px',
            color: 'var(--color-text-main)',
            cursor: 'pointer'
          }}
          className="mobile-toggle"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div style={{
          background: '#ffffff',
          borderBottom: '1px solid var(--color-border)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          {navItems.map((item, idx) => (
            <a
              key={idx}
              href={item.href}
              onClick={(e) => {
                e.preventDefault();
                item.onClick();
                setMobileMenuOpen(false);
              }}
              style={{
                color: '#334155',
                fontSize: '1rem',
                fontWeight: 600,
                textDecoration: 'none',
                padding: '8px 0'
              }}
            >
              {item.label}
            </a>
          ))}

          <div style={{ height: '1px', background: '#e2e8f0', margin: '4px 0' }} />

          <button
            onClick={() => {
              onNavigate('/login');
              setMobileMenuOpen(false);
            }}
            className="btn btn-outline"
            style={{ width: '100%', borderRadius: '999px' }}
          >
            Masuk Member / Admin
          </button>

          <button
            onClick={() => {
              onNavigate('/checkout');
              setMobileMenuOpen(false);
            }}
            className="btn btn-primary"
            style={{ width: '100%', borderRadius: '999px' }}
          >
            Temukan Fase Bisnisku Sekarang →
          </button>
        </div>
      )}

      <style>{`
        @media (min-width: 900px) {
          .desktop-nav { display: flex !important; }
          .desktop-actions { display: flex !important; }
          .mobile-toggle { display: none !important; }
        }
      `}</style>
    </header>
  );
};
