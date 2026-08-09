'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiLogin, saveAuth, getDashboardRoute } from '../../../lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiLogin(email, password);
      saveAuth({ user_id: data.user_id, role: data.role, full_name: data.full_name, access_token: data.access_token });
      router.replace(getDashboardRoute(data.role));
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'transparent',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, background: '#00685f', borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: 22 }}>health_and_safety</span>
            </div>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#00685f' }}>Swastya Saarthi</span>
          </Link>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', margin: '20px 0 6px' }}>Welcome back</h1>
          <p style={{ color: '#64748b', margin: 0 }}>Sign in to your account to continue</p>
        </div>

        <div className="card" style={{ padding: 32 }}>
          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: 8, padding: '12px 16px', marginBottom: 20,
              color: '#dc2626', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Email Address
              </label>
              <input
                type="email"
                className="field-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="asha@swastai.gov.in"
                required
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Password
              </label>
              <input
                type="password"
                className="field-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? <span className="spinner" /> : <span className="material-symbols-outlined" style={{ fontSize: 18 }}>login</span>}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Quick Demo Accounts */}
          <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, textAlign: 'center' }}>
              ⚡ Quick Demo Account Login
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'ASHA Worker', email: 'asha@swastai.gov.in', pw: 'asha123', bg: '#f0fdf4', color: '#00685f', icon: 'volunteer_activism' },
                { label: 'PHC Centre', email: 'phc@swastai.gov.in', pw: 'phc123', bg: '#eef2ff', color: '#4648d4', icon: 'local_hospital' },
                { label: 'DHO Officer', email: 'dho@swastai.gov.in', pw: 'dho123', bg: '#fffbeb', color: '#d97706', icon: 'account_balance' },
                { label: 'Admin', email: 'admin@swastai.gov.in', pw: 'admin123', bg: '#fef2f2', color: '#dc2626', icon: 'admin_panel_settings' },
              ].map(acc => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => {
                    setEmail(acc.email);
                    setPassword(acc.pw);
                  }}
                  style={{
                    background: acc.bg, border: `1px solid ${acc.color}33`,
                    borderRadius: 8, padding: '10px 12px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left',
                    fontFamily: 'Inter, sans-serif'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ color: acc.color, fontSize: 18 }}>{acc.icon}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: acc.color }}>{acc.label}</div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>Click to fill</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#64748b' }}>
            Don't have an account?{' '}
            <Link href="/auth/signup" style={{ color: '#00685f', fontWeight: 600, textDecoration: 'none' }}>
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
