'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAuth, logout } from '../../../lib/auth';
import { listPatients, PatientSummary } from '../../../lib/api';

function RiskBadge({ level }: { level?: string }) {
  if (!level) return <span style={{ color: '#64748b', fontSize: 13 }}>—</span>;
  const map: Record<string, { label: string; cls: string }> = {
    HIGH: { label: 'High Risk', cls: 'risk-high' }, MODERATE: { label: 'Moderate', cls: 'risk-moderate' }, LOW: { label: 'Low Risk', cls: 'risk-low' }
  };
  const item = map[level] || { label: level, cls: 'risk-low' };
  return <span className={item.cls} style={{ padding: '3px 10px', borderRadius: 100, fontSize: 12, fontWeight: 600 }}>{item.label}</span>;
}

import { useLanguage } from '../../../context/LanguageContext';

export default function PHCDashboard() {
  const router = useRouter();
  const { t } = useLanguage();
  const [auth, setAuth] = useState<ReturnType<typeof getAuth>>(null);
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listPatients();
      setPatients(data);
    } catch (err: any) {
      if (err.message?.includes('401')) { logout(); router.replace('/auth/login'); }
      else setError('Failed to load data. Ensure backend is running.');
    } finally { setLoading(false); }
  }, [router]);

  useEffect(() => {
    const a = getAuth();
    if (!a) { router.replace('/auth/login'); return; }
    if (a.role !== 'phc') { router.replace(`/dashboard/${a.role}`); return; }
    setAuth(a);
    loadData();
  }, [router, loadData]);

  const highRisk = patients.filter(p => p.overall_risk_level === 'HIGH');
  const moderate = patients.filter(p => p.overall_risk_level === 'MODERATE');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <aside className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{ width: 36, height: 36, background: '#4648d4', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: 18 }}>local_hospital</span>
          </div>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#4648d4' }}>Swastya Saarthi</span>
        </div>
        <div style={{ background: '#eef2ff', borderRadius: 10, padding: '12px 14px', marginBottom: 24, border: '1px solid #c7d2fe' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{auth?.full_name || '...'}</div>
          <div style={{ fontSize: 12, color: '#4648d4', fontWeight: 600 }}>{t('role_phc')}</div>
        </div>
        <nav style={{ flex: 1 }}>
          <a className="sidebar-link active" href="#" style={{ marginBottom: 4 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>dashboard</span> {t('app_title')}
          </a>
        </nav>
        <button onClick={() => { logout(); router.replace('/'); }} className="sidebar-link" style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', color: '#dc2626' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span> {t('sign_out')}
        </button>
      </aside>
      <main className="main-with-sidebar" style={{ flex: 1, padding: '32px 36px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>{t('phc_dashboard_title')}</h1>
          <p style={{ color: '#64748b', margin: 0 }}>{t('phc_dashboard_sub')}</p>
        </div>
        {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '14px 18px', marginBottom: 24, color: '#dc2626' }}>{error}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
          <div className="stat-card"><div className="stat-icon" style={{ background: '#eef2ff' }}><span className="material-symbols-outlined" style={{ color: '#4648d4' }}>group</span></div><div><div style={{ fontSize: 26, fontWeight: 700 }}>{patients.length}</div><div style={{ fontSize: 13, color: '#64748b' }}>{t('patient_database')}</div></div></div>
          <div className="stat-card"><div className="stat-icon" style={{ background: '#fef2f2' }}><span className="material-symbols-outlined" style={{ color: '#dc2626' }}>emergency</span></div><div><div style={{ fontSize: 26, fontWeight: 700, color: '#dc2626' }}>{highRisk.length}</div><div style={{ fontSize: 13, color: '#64748b' }}>{t('pending_phc_alerts')}</div></div></div>
          <div className="stat-card"><div className="stat-icon" style={{ background: '#fffbeb' }}><span className="material-symbols-outlined" style={{ color: '#d97706' }}>warning</span></div><div><div style={{ fontSize: 26, fontWeight: 700, color: '#d97706' }}>{moderate.length}</div><div style={{ fontSize: 13, color: '#64748b' }}>{t('moderate_risk_cases')}</div></div></div>
        </div>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0' }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{t('phc_referrals_list')}</h2>
          </div>
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto', width: 32, height: 32 }} /><p style={{ color: '#64748b', marginTop: 12 }}>Loading patients...</p></div>
          ) : patients.length === 0 ? (
            <div className="empty-state"><span className="material-symbols-outlined" style={{ fontSize: 40, color: '#94a3b8' }}>group_off</span><h3>No patient records yet</h3><p style={{ color: '#64748b' }}>ASHA workers in your sub-district have not registered any patients yet.</p></div>
          ) : (
            [...patients].sort((a, b) => {
              const order = { HIGH: 0, MODERATE: 1, LOW: 2 };
              return (order[a.overall_risk_level as keyof typeof order] ?? 3) - (order[b.overall_risk_level as keyof typeof order] ?? 3);
            }).map((p, i) => (
              <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 80px', padding: '12px 24px', alignItems: 'center', borderBottom: i < patients.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                <div style={{ fontSize: 14, color: '#374151' }}>{p.age} / {p.gender}</div>
                <div style={{ fontSize: 14, color: '#64748b' }}>{p.village_name || '—'}</div>
                <RiskBadge level={p.overall_risk_level} />
                <Link href={`/patients/${p.id}`} style={{ textDecoration: 'none' }}><button style={{ height: 30, padding: '0 12px', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 6, color: '#4648d4', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>View</button></Link>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
