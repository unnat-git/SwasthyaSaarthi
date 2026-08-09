'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiSignup, saveAuth, getDashboardRoute } from '../../../lib/auth';

const ROLES = [
  {
    id: 'asha',
    label: 'ASHA Worker',
    icon: 'volunteer_activism',
    color: '#00685f',
    bg: '#f0fdf4',
    desc: 'Community health worker who registers patients, collects vitals, and performs field assessments.',
    fields: ['sub_district', 'village']
  },
  {
    id: 'phc',
    label: 'PHC',
    icon: 'local_hospital',
    color: '#4648d4',
    bg: '#eef2ff',
    desc: 'Primary Health Centre staff managing patient referrals and monitoring high-risk cases.',
    fields: ['facility_name', 'sub_district']
  },
  {
    id: 'dho',
    label: 'District Health Officer',
    icon: 'account_balance',
    color: '#d97706',
    bg: '#fffbeb',
    desc: 'District-level officer monitoring health metrics, ASHA performance, and outbreak alerts.',
    fields: ['district']
  },
  {
    id: 'admin',
    label: 'Admin',
    icon: 'admin_panel_settings',
    color: '#dc2626',
    bg: '#fef2f2',
    desc: 'System administrator managing users, roles, and platform-wide configuration.',
    fields: []
  },
];

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<'role' | 'details'>('role');
  const [selectedRole, setSelectedRole] = useState<typeof ROLES[0] | null>(null);
  const [form, setForm] = useState({
    email: '', password: '', confirmPassword: '',
    full_name: '', sub_district: '', village: '',
    facility_name: '', district: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRoleSelect = (role: typeof ROLES[0]) => {
    setSelectedRole(role);
    setStep('details');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const data = await apiSignup({
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        role: selectedRole!.id,
        sub_district: form.sub_district || undefined,
        village: form.village || undefined,
        facility_name: form.facility_name || undefined,
        district: form.district || undefined,
      });
      saveAuth({ user_id: data.user_id, role: data.role, full_name: data.full_name, access_token: data.access_token });
      router.replace(getDashboardRoute(data.role));
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const field = (id: keyof typeof form, label: string, type = 'text', placeholder = '') => (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
        {label} <span style={{ color: '#dc2626' }}>*</span>
      </label>
      <input
        type={type}
        className={`field-input${error && !form[id] ? ' error' : ''}`}
        value={form[id]}
        onChange={e => setForm(prev => ({ ...prev, [id]: e.target.value }))}
        placeholder={placeholder}
        required
      />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '24px 16px' }}>
      <div style={{ maxWidth: step === 'role' ? 880 : 480, margin: '0 auto' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32, paddingTop: 16 }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, background: '#00685f', borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: 22 }}>health_and_safety</span>
            </div>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#00685f' }}>Swastya Saarthi</span>
          </Link>
        </div>

        {step === 'role' ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <h1 style={{ fontSize: 30, fontWeight: 700, color: '#0f172a', margin: '0 0 10px' }}>
                Create your account
              </h1>
              <p style={{ color: '#64748b', fontSize: 16, margin: 0 }}>
                Select your role to get started with the right access and tools
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 20, marginBottom: 32 }}>
              {ROLES.map(role => (
                <button
                  key={role.id}
                  onClick={() => handleRoleSelect(role)}
                  style={{
                    background: '#fff', border: '2px solid #e2e8f0', borderRadius: 14,
                    padding: '28px 20px', cursor: 'pointer', textAlign: 'left',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                    fontFamily: 'Inter, sans-serif'
                  }}
                  onMouseOver={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = role.color;
                    (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 3px ${role.color}22`;
                  }}
                  onMouseOut={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0';
                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    width: 48, height: 48, background: role.bg, borderRadius: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14
                  }}>
                    <span className="material-symbols-outlined" style={{ color: role.color, fontSize: 24 }}>
                      {role.icon}
                    </span>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>{role.label}</div>
                  <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{role.desc}</div>
                  <div style={{
                    marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 4,
                    color: role.color, fontSize: 13, fontWeight: 600
                  }}>
                    Select <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
                  </div>
                </button>
              ))}
            </div>
            <p style={{ textAlign: 'center', fontSize: 14, color: '#64748b' }}>
              Already have an account?{' '}
              <Link href="/auth/login" style={{ color: '#00685f', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
            </p>
          </>
        ) : (
          <div className="card" style={{ padding: 36 }}>
            <button
              onClick={() => setStep('role')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'none', border: 'none', color: '#64748b',
                fontSize: 14, cursor: 'pointer', marginBottom: 20, fontFamily: 'Inter, sans-serif'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
              Back to role selection
            </button>

            {/* Selected role badge */}
            {selectedRole && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: selectedRole.bg, borderRadius: 8,
                padding: '8px 14px', marginBottom: 24, border: `1px solid ${selectedRole.color}33`
              }}>
                <span className="material-symbols-outlined" style={{ color: selectedRole.color, fontSize: 18 }}>
                  {selectedRole.icon}
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: selectedRole.color }}>
                  Registering as: {selectedRole.label}
                </span>
              </div>
            )}

            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: '0 0 24px' }}>
              Complete your profile
            </h2>

            {error && (
              <div style={{
                background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8,
                padding: '12px 16px', marginBottom: 20, color: '#dc2626',
                fontSize: 14, display: 'flex', alignItems: 'center', gap: 8
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>error</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {field('full_name', 'Full Name', 'text', 'Your full name')}
              {field('email', 'Email Address', 'email', 'you@healthcenter.gov.in')}
              {field('password', 'Password', 'password', 'Minimum 6 characters')}
              {field('confirmPassword', 'Confirm Password', 'password', 'Re-enter password')}

              {selectedRole?.fields.includes('village') && (
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Village Name</label>
                  <input type="text" className="field-input" value={form.village}
                    onChange={e => setForm(prev => ({ ...prev, village: e.target.value }))} placeholder="e.g. Rampur" />
                </div>
              )}
              {selectedRole?.fields.includes('sub_district') && (
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Sub-District</label>
                  <input type="text" className="field-input" value={form.sub_district}
                    onChange={e => setForm(prev => ({ ...prev, sub_district: e.target.value }))} placeholder="e.g. Chapra" />
                </div>
              )}
              {selectedRole?.fields.includes('facility_name') && (
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Facility / PHC Name</label>
                  <input type="text" className="field-input" value={form.facility_name}
                    onChange={e => setForm(prev => ({ ...prev, facility_name: e.target.value }))} placeholder="e.g. Rampur PHC" />
                </div>
              )}
              {selectedRole?.fields.includes('district') && (
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6 }}>District</label>
                  <input type="text" className="field-input" value={form.district}
                    onChange={e => setForm(prev => ({ ...prev, district: e.target.value }))} placeholder="e.g. Muzaffarpur" />
                </div>
              )}

              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
                {loading ? <span className="spinner" /> : <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span>}
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
