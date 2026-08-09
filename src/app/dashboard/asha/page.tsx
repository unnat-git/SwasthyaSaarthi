'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAuth, logout } from '../../../lib/auth';
import { listPatients, getAshaStats, PatientSummary } from '../../../lib/api';

function RiskBadge({ level }: { level?: string }) {
  if (!level) return <span style={{ color: '#64748b', fontSize: 13 }}>Pending</span>;
  const map: Record<string, { label: string; className: string }> = {
    HIGH: { label: 'High Risk', className: 'risk-high' },
    MODERATE: { label: 'Moderate Risk', className: 'risk-moderate' },
    LOW: { label: 'Low Risk', className: 'risk-low' },
  };
  const item = map[level] || { label: level, className: 'risk-low' };
  return (
    <span className={item.className} style={{
      padding: '3px 10px', borderRadius: 100,
      fontSize: 12, fontWeight: 600, display: 'inline-block'
    }}>
      {item.label}
    </span>
  );
}

import { useLanguage } from '../../../context/LanguageContext';

import { useSearchParams } from 'next/navigation';

export default function ASHADashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOfflineSaved = searchParams.get('offline_saved') === 'true';
  const savedPatientName = searchParams.get('name') || '';
  const { lang, setLang, t } = useLanguage();
  const [auth, setAuth] = useState<ReturnType<typeof getAuth>>(null);
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [stats, setStats] = useState<{ total_patients: number; high_risk: number; moderate_risk: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [patientsData, statsData] = await Promise.all([listPatients(), getAshaStats()]);
      setPatients(patientsData);
      setStats(statsData);
    } catch (err: any) {
      if (err.message?.includes('401') || err.message?.includes('credentials')) {
        logout();
        router.replace('/auth/login');
      } else {
        setError('Failed to load data. Make sure the backend server is running.');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const a = getAuth();
    if (!a) { router.replace('/auth/login'); return; }
    if (a.role !== 'asha') { router.replace(`/dashboard/${a.role}`); return; }
    setAuth(a);
    loadData();
  }, [router, loadData]);

  const handleLogout = () => { logout(); router.replace('/'); };

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.village_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const highRiskPatients = patients.filter(p => p.requires_phc_alert);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{
            width: 36, height: 36, background: '#00685f', borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: 18 }}>health_and_safety</span>
          </div>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#00685f' }}>Swastya Saarthi</span>
        </div>

        {/* User info */}
        <div style={{
          background: '#f0fdf4', borderRadius: 10, padding: '12px 14px', marginBottom: 24,
          border: '1px solid #bbf7d0'
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{auth?.full_name || '...'}</div>
          <div style={{ fontSize: 12, color: '#00685f', fontWeight: 600 }}>{t('role_asha')}</div>
        </div>

        {/* Language selector */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, paddingLeft: 4 }}>
            Language / भाषा
          </label>
          <select 
            value={lang} 
            onChange={(e) => setLang(e.target.value as any)}
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: 13,
              fontWeight: 600,
              color: '#334155',
              background: '#fff',
              border: '1.5px solid #e2e8f0',
              borderRadius: 8,
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="en">English 🇺🇸</option>
            <option value="hi">हिन्दी (Hindi) 🇮🇳</option>
            <option value="bn">বাংলা (Bengali) 🇮🇳</option>
          </select>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <a className="sidebar-link active" href="#">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>dashboard</span>
            {t('app_title')}
          </a>
          <Link className="sidebar-link" href="/dashboard/asha/intake" style={{ textDecoration: 'none' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>person_add</span>
            {t('register_new_patient')}
          </Link>
        </nav>

        <button
          onClick={handleLogout}
          className="sidebar-link"
          style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', color: '#dc2626' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span>
          {t('sign_out')}
        </button>
      </aside>

      {/* Main */}
      <main className="main-with-sidebar" style={{ flex: 1, padding: '32px 36px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>
              {t('asha_dashboard_title')}
            </h1>
            <p style={{ color: '#64748b', margin: 0, fontSize: 14 }}>
              {t('asha_dashboard_sub')}
            </p>
          </div>
          <Link href="/dashboard/asha/intake" style={{ textDecoration: 'none' }}>
            <button className="btn-primary">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
              {t('register_new_patient')}
            </button>
          </Link>
        </div>

        {isOfflineSaved && (
          <div style={{
            background: '#ecfdf5', border: '1.5px solid #6ee7b7', borderRadius: 12,
            padding: '16px 20px', marginBottom: 24, color: '#065f46',
            display: 'flex', alignItems: 'flex-start', gap: 14, boxShadow: '0 4px 12px rgba(16,185,129,0.1)'
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#059669' }}>wifi_off</span>
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 2 }}>
                📶 Offline Intake Saved Locally!
              </div>
              <div style={{ fontSize: 13, color: '#047857', lineHeight: 1.5 }}>
                Patient <strong>{savedPatientName || 'Record'}</strong> has been saved offline on this device. It will automatically sync to the central hospital server as soon as cellular signal or internet is available.
              </div>
            </div>
          </div>
        )}

        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
            padding: '14px 18px', marginBottom: 24, color: '#dc2626',
            display: 'flex', alignItems: 'center', gap: 10
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>error</span>
            <div>
              <div style={{ fontWeight: 600 }}>{error}</div>
              <button onClick={loadData} style={{
                background: 'none', border: 'none', color: '#dc2626',
                cursor: 'pointer', fontSize: 13, textDecoration: 'underline', padding: 0, marginTop: 4
              }}>Try again</button>
            </div>
          </div>
        )}

        {/* Stats */}
        {loading ? (
          <div style={{ display: 'flex', gap: 20, marginBottom: 28 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{
                flex: 1, border: '1px solid #e2e8f0',
                borderRadius: 12, padding: '20px 24px', height: 92,
                background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
                backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite'
              }} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 28 }}>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#f0fdf4' }}>
                <span className="material-symbols-outlined" style={{ color: '#00685f', fontSize: 22 }}>group</span>
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#0f172a' }}>{stats?.total_patients ?? 0}</div>
                <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Total Patients</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#fef2f2' }}>
                <span className="material-symbols-outlined" style={{ color: '#dc2626', fontSize: 22 }}>warning</span>
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#dc2626' }}>{stats?.high_risk ?? 0}</div>
                <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>High Risk</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#fffbeb' }}>
                <span className="material-symbols-outlined" style={{ color: '#d97706', fontSize: 22 }}>priority_high</span>
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#d97706' }}>{stats?.moderate_risk ?? 0}</div>
                <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Moderate Risk</div>
              </div>
            </div>
          </div>
        )}

        {/* High Risk Alerts */}
        {!loading && highRiskPatients.length > 0 && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: 12, padding: '16px 20px', marginBottom: 24
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span className="material-symbols-outlined" style={{ color: '#dc2626', fontSize: 20 }}>emergency</span>
              <span style={{ fontWeight: 700, color: '#dc2626', fontSize: 15 }}>
                {highRiskPatients.length} patient{highRiskPatients.length > 1 ? 's' : ''} require urgent attention
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {highRiskPatients.slice(0, 5).map(p => (
                <Link key={p.id} href={`/patients/${p.id}`} style={{ textDecoration: 'none' }}>
                  <span style={{
                    background: '#fff', border: '1px solid #fecaca', borderRadius: 8,
                    padding: '6px 12px', fontSize: 13, color: '#dc2626', fontWeight: 600,
                    display: 'inline-flex', alignItems: 'center', gap: 6
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>person</span>
                    {p.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Patient List */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 16 }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#0f172a', flex: 1 }}>Patient Records</h2>
            <div style={{ position: 'relative' }}>
              <span className="material-symbols-outlined" style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                fontSize: 18, color: '#94a3b8'
              }}>search</span>
              <input
                className="field-input"
                style={{ paddingLeft: 40, width: 240, height: 40 }}
                placeholder="Search patients..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto', width: 32, height: 32 }} />
              <p style={{ color: '#64748b', marginTop: 12 }}>Loading patients...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div style={{
                width: 64, height: 64, background: '#f0fdf4', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16
              }}>
                <span className="material-symbols-outlined" style={{ color: '#00685f', fontSize: 30 }}>group_off</span>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>
                {searchQuery ? 'No patients found' : 'No patient records yet'}
              </h3>
              <p style={{ color: '#64748b', margin: '0 0 24px', fontSize: 14 }}>
                {searchQuery
                  ? 'Try a different name or village'
                  : 'Register your first patient to get started with health risk assessments.'}
              </p>
              {!searchQuery && (
                <Link href="/dashboard/asha/intake" style={{ textDecoration: 'none' }}>
                  <button className="btn-primary">
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
                    New Patient Intake
                  </button>
                </Link>
              )}
            </div>
          ) : (
            <div>
              {/* Table header */}
              <div style={{
                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr 80px',
                padding: '12px 24px', background: '#f8fafc',
                borderBottom: '1px solid #e2e8f0'
              }}>
                {['Patient Name', 'Age / Gender', 'Village', 'Risk Level', 'Registered On', ''].map(h => (
                  <div key={h} style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {h}
                  </div>
                ))}
              </div>
              {filtered.map((p, i) => (
                <div
                  key={p.id}
                  style={{
                    display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr 80px',
                    padding: '14px 24px', alignItems: 'center',
                    borderBottom: i < filtered.length - 1 ? '1px solid #f1f5f9' : 'none',
                    transition: 'background 0.1s'
                  }}
                  onMouseOver={e => (e.currentTarget.style.background = '#fafbff')}
                  onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 36, height: 36, background: '#f0fdf4', borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      <span className="material-symbols-outlined" style={{ color: '#00685f', fontSize: 18 }}>person</span>
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>ID: {p.id.slice(0, 8)}…</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 14, color: '#374151' }}>{p.age} yrs / {p.gender}</div>
                  <div style={{ fontSize: 14, color: '#374151' }}>{p.village_name || '—'}</div>
                  <RiskBadge level={p.overall_risk_level} />
                  <div style={{ fontSize: 13, color: '#64748b' }}>
                    {new Date(p.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                  <Link href={`/patients/${p.id}`} style={{ textDecoration: 'none' }}>
                    <button style={{
                      height: 32, padding: '0 12px', background: '#f0fdf4',
                      border: '1px solid #bbf7d0', borderRadius: 6,
                      color: '#00685f', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      fontFamily: 'Inter, sans-serif'
                    }}>View</button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
