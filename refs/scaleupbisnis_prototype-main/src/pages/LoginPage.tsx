import React, { useState } from 'react';
import { 
  Compass, 
  Lock, 
  Mail,
  ArrowRight,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import { sampleCustomers } from '../mockData';

interface LoginPageProps {
  onLoginSuccess: (user: any) => void;
  onNavigate: (path: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onNavigate }) => {
  const [role, setRole] = useState<'CUSTOMER' | 'ADMIN'>('CUSTOMER');
  const [email, setEmail] = useState('budi.santoso@berkahmandiri.id');
  const [password, setPassword] = useState('password123');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'ADMIN') {
      onLoginSuccess({
        id: 99,
        name: 'Riza Zacharias',
        email: 'riza@naikfase.id',
        role: 'ADMIN'
      });
      onNavigate('/admin');
    } else {
      const found = sampleCustomers.find(c => c.email === email) || sampleCustomers[0];
      onLoginSuccess({
        ...found,
        role: 'CUSTOMER'
      });
      onNavigate('/portal');
    }
  };

  const handleQuickCustomer = (c: any) => {
    setEmail(c.email);
    setPassword('password123');
    setRole('CUSTOMER');
  };

  const handleQuickAdmin = () => {
    setEmail('riza@naikfase.id');
    setPassword('admin123');
    setRole('ADMIN');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      background: 'radial-gradient(circle at 50% 20%, #f0fdf4 0%, #ffffff 80%)'
    }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        
        {/* Card */}
        <div style={{
          background: '#ffffff',
          border: '1px solid var(--color-border)',
          borderRadius: '24px',
          padding: '40px',
          boxShadow: 'var(--shadow-xl)'
        }}>
          {/* Logo icon */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div 
              onClick={() => onNavigate('/')}
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 18px rgba(16, 185, 129, 0.35)',
                marginBottom: '12px',
                cursor: 'pointer'
              }}
            >
              <TrendingUp size={30} strokeWidth={2.5} />
            </div>
            <h1 style={{ fontSize: '1.6rem', color: '#0f172a', marginBottom: '4px' }}>
              Masuk ke ScaleUpBisnis
            </h1>
            <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
              Akses hasil audit, download laporan PDF & instrumen tes
            </p>
          </div>

          {/* Role Switcher Pills */}
          <div style={{
            display: 'flex',
            background: '#f1f5f9',
            padding: '4px',
            borderRadius: '12px',
            marginBottom: '24px'
          }}>
            <button
              type="button"
              onClick={() => { setRole('CUSTOMER'); setEmail('budi.santoso@berkahmandiri.id'); }}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '8px',
                border: 'none',
                background: role === 'CUSTOMER' ? '#ffffff' : 'transparent',
                color: role === 'CUSTOMER' ? '#0f172a' : '#64748b',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: role === 'CUSTOMER' ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Peserta / Member
            </button>
            <button
              type="button"
              onClick={() => { setRole('ADMIN'); setEmail('riza@naikfase.id'); }}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '8px',
                border: 'none',
                background: role === 'ADMIN' ? '#ffffff' : 'transparent',
                color: role === 'ADMIN' ? '#0f172a' : '#64748b',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: role === 'ADMIN' ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Administrator
            </button>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                Alamat Email Terdaftar
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px 11px 40px',
                    borderRadius: '10px',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.92rem'
                  }}
                />
                <Mail size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Kata Sandi</label>
                <a href="#" onClick={(e) => { e.preventDefault(); alert('Link reset password dikirimkan ke email!'); }} style={{ fontSize: '0.8rem', color: '#059669' }}>
                  Lupa kata sandi?
                </a>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px 11px 40px',
                    borderRadius: '10px',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.92rem'
                  }}
                />
                <Lock size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '13px', fontSize: '1rem', borderRadius: '999px' }}
            >
              Masuk Sekarang →
            </button>
          </form>

          {/* Quick Simulation Login Helper */}
          <div style={{
            marginTop: '28px',
            background: '#f8fafc',
            border: '1px dashed #cbd5e1',
            borderRadius: '14px',
            padding: '16px',
            fontSize: '0.82rem'
          }}>
            <div style={{ fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
              ⚡ Shortcut Akun Demo (Klik untuk Isi):
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button
                type="button"
                onClick={() => handleQuickCustomer(sampleCustomers[0])}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '7px 10px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '0.8rem'
                }}
              >
                👤 <strong>Budi Santoso</strong> (Member Pengusaha)
              </button>
              <button
                type="button"
                onClick={handleQuickAdmin}
                style={{
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  color: '#059669',
                  borderRadius: '6px',
                  padding: '7px 10px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}
              >
                🛡️ <strong>Riza Zacharias</strong> (Admin Panel)
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem', color: '#64748b' }}>
            <button
              onClick={() => onNavigate('/')}
              style={{ background: 'transparent', border: 'none', color: '#059669', fontWeight: 700, cursor: 'pointer' }}
            >
              ← Kembali ke Beranda Publik
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
