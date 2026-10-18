import React, { useState } from 'react';
import { 
  TrendingUp, 
  FileText, 
  Play, 
  Receipt, 
  User, 
  LogOut, 
  ExternalLink, 
  Menu, 
  X,
  Sparkles,
  HelpCircle,
  Clock,
  Compass
} from 'lucide-react';

interface PortalLayoutProps {
  children: React.ReactNode;
  activePath: string;
  onNavigate: (path: string) => void;
  currentUser: any;
  onLogout: () => void;
}

export const PortalLayout: React.FC<PortalLayoutProps> = ({
  children,
  activePath,
  onNavigate,
  currentUser,
  onLogout
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { label: 'Ringkasan Akun', icon: Compass, path: '/portal' },
    { label: 'Lembar Simulasi Audit', icon: Play, path: '/test' },
    { label: 'Laporan Hasil & Roadmap', icon: FileText, path: '/result' },
    { label: 'Beli Layanan Lain (Upsell)', icon: Sparkles, path: '/portal/services', badge: 'Katalog' },
    { label: 'Riwayat Pembayaran & Invoice', icon: Receipt, path: '/portal/orders' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', color: '#0f172a' }}>
      
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.5)',
            zIndex: 90
          }}
        />
      )}

      {/* LEFT SIDEBAR FOR CUSTOMER PORTAL */}
      <aside style={{
        width: '260px',
        background: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        zIndex: 100,
        transform: sidebarOpen ? 'translateX(0)' : 'none',
        transition: 'transform 0.25s ease'
      }} className="portal-sidebar">
        
        {/* Brand Header */}
        <div>
          <div style={{
            height: '76px',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f1f5f9'
          }}>
            <div 
              onClick={() => onNavigate('/')}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff'
              }}>
                <TrendingUp size={18} strokeWidth={2.5} />
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em', color: '#0f172a' }}>
                  ScaleUp<span style={{ color: '#059669' }}>Bisnis</span>
                </div>
                <div style={{ fontSize: '0.65rem', color: '#059669', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  AREA MEMBER PENGUSAHA
                </div>
              </div>
            </div>

            <button
              onClick={() => setSidebarOpen(false)}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'none' }}
              className="mobile-close-sidebar"
            >
              <X size={20} />
            </button>
          </div>

          {/* Member Profile Summary in Sidebar */}
          <div style={{ padding: '20px 20px 10px' }}>
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '14px',
              padding: '14px'
            }}>
              <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 800, textTransform: 'uppercase' }}>
                AKUN TERDAFTAR
              </div>
              <div style={{ fontWeight: 800, fontSize: '0.94rem', color: '#0f172a', marginTop: '2px' }}>
                {currentUser?.name || 'Budi Santoso'}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#475569' }}>
                {currentUser?.business_name || 'Toko Berkah Mandiri'}
              </div>
            </div>
          </div>

          {/* Links */}
          <div style={{ padding: '10px 16px' }}>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {menuItems.map((item, idx) => {
                const Icon = item.icon;
                const isActive = activePath === item.path;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      onNavigate(item.path);
                      setSidebarOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '10px',
                      background: isActive ? '#ecfdf5' : 'transparent',
                      color: isActive ? '#059669' : '#475569',
                      border: isActive ? '1px solid #a7f3d0' : '1px solid transparent',
                      fontWeight: isActive ? 700 : 500,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Icon size={18} color={isActive ? '#059669' : '#94a3b8'} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div style={{ padding: '16px', borderTop: '1px solid #f1f5f9', background: '#fafafa' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <button
              onClick={() => onNavigate('/')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                color: '#475569',
                padding: '8px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <ExternalLink size={13} />
              Web Utama
            </button>

            <button
              onClick={onLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                background: '#fee2e2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '8px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <LogOut size={13} />
              Keluar
            </button>
          </div>
        </div>

      </aside>

      {/* RIGHT MAIN CONTENT AREA */}
      <div style={{ flex: 1, marginLeft: '260px', display: 'flex', flexDirection: 'column' }} className="portal-main">
        {/* Top Portal Header */}
        <header style={{
          height: '76px',
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '0 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 40
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              onClick={() => setSidebarOpen(true)}
              style={{ display: 'none', background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px' }}
              className="mobile-hamburger-btn"
            >
              <Menu size={22} />
            </button>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Dashboard Peserta Audit</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                Portal Pengusaha ScaleUpBisnis
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              onClick={() => onNavigate('/test')}
              className="btn btn-primary"
              style={{
                padding: '8px 18px',
                fontSize: '0.86rem',
                borderRadius: '999px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              }}
            >
              <Play size={14} fill="#fff" />
              Lanjut Pengisian Audit
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main style={{ padding: '32px', flex: 1 }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .portal-sidebar {
            transform: translateX(-100%) !important;
          }
          .portal-main {
            margin-left: 0 !important;
          }
          .mobile-hamburger-btn {
            display: block !important;
          }
          .mobile-close-sidebar {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
};
