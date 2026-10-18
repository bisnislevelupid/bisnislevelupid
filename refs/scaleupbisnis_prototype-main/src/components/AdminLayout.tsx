import React, { useState } from 'react';
import { 
  TrendingUp, 
  LayoutDashboard, 
  FileText, 
  Users, 
  ShoppingCart, 
  HelpCircle, 
  Package, 
  Settings, 
  LogOut, 
  ExternalLink, 
  Menu, 
  X,
  ShieldCheck,
  ChevronRight,
  Bell
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  activePath: string;
  onNavigate: (path: string) => void;
  currentUser: any;
  onLogout: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  activePath,
  onNavigate,
  currentUser,
  onLogout
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { label: 'Ringkasan Dashboard', icon: LayoutDashboard, path: '/admin' },
    { label: 'Pesanan & Invoice', icon: ShoppingCart, path: '/admin/orders', badge: '3 Baru' },
    { label: 'Data Customer', icon: Users, path: '/admin/customers' },
    { label: 'Bank Soal & Butir Kunci (★)', icon: HelpCircle, path: '/admin/questions' },
    { label: 'Katalog Produk & Upsell', icon: Package, path: '/admin/products' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', color: '#0f172a' }}>
      
      {/* Mobile Sidebar Overlay */}
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

      {/* LEFT SIDEBAR (Dark Slate / Deep Teal style) */}
      <aside style={{
        width: '260px',
        background: '#091e1b',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRight: '1px solid #1a3832',
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        zIndex: 100,
        transform: sidebarOpen ? 'translateX(0)' : 'none',
        transition: 'transform 0.25s ease'
      }} className="admin-sidebar">
        
        {/* Sidebar Header Brand */}
        <div>
          <div style={{
            height: '76px',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
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
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>
                  ScaleUp<span style={{ color: '#34d399' }}>Bisnis</span>
                </div>
                <div style={{ fontSize: '0.65rem', color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  PANEL ADMINISTRATOR
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

          {/* Navigation Links */}
          <div style={{ padding: '24px 16px' }}>
            <div style={{ fontSize: '0.72rem', color: '#6ee7b7', fontWeight: 700, textTransform: 'uppercase', padding: '0 12px 10px', letterSpacing: '0.05em' }}>
              Menu Manajemen
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {menuItems.map((item, idx) => {
                const Icon = item.icon;
                const isActive = activePath === item.path || (item.path === '/admin' && activePath.startsWith('/admin'));
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
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '10px',
                      background: isActive ? 'rgba(16, 185, 129, 0.18)' : 'transparent',
                      color: isActive ? '#34d399' : '#cbd5e1',
                      border: isActive ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid transparent',
                      fontWeight: isActive ? 700 : 500,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Icon size={18} color={isActive ? '#34d399' : '#94a3b8'} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        background: '#10b981',
                        color: '#ffffff',
                        padding: '2px 6px',
                        borderRadius: '999px'
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Sidebar Footer User info */}
        <div style={{
          padding: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: '#059669',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.9rem'
            }}>
              RZ
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser?.name || 'Riza Zacharias'}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#6ee7b7' }}>Super Admin</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <button
              onClick={() => onNavigate('/')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#cbd5e1',
                padding: '7px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              <ExternalLink size={13} />
              Web Publik
            </button>

            <button
              onClick={onLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#f87171',
                padding: '7px',
                borderRadius: '8px',
                fontSize: '0.75rem',
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
      <div style={{ flex: 1, marginLeft: '260px', display: 'flex', flexDirection: 'column' }} className="admin-main">
        {/* Top Minimal Admin Bar */}
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
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Dashboard Administrator</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                ScaleUpBisnis Backoffice System
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#ecfdf5',
              color: '#059669',
              fontSize: '0.78rem',
              fontWeight: 700,
              padding: '4px 12px',
              borderRadius: '999px',
              border: '1px solid #a7f3d0'
            }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981' }} />
              Server Online (Neon PG & Xendit Connected)
            </div>

            <button
              onClick={() => onNavigate('/')}
              className="btn btn-outline"
              style={{ padding: '7px 14px', fontSize: '0.82rem', borderRadius: '8px' }}
            >
              <ExternalLink size={14} />
              Buka Web Utama
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
          .admin-sidebar {
            transform: translateX(-100%) !important;
          }
          .admin-main {
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
