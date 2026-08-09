'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAuth, logout, authHeaders } from '../../../lib/auth';

interface AdminStats {
  total_patients: number;
  total_users: number;
  high_risk_patients: number;
  total_logs: number;
}

interface ActivityLogItem {
  id: string;
  timestamp: string;
  user_id?: string;
  user_name: str;
  role: str;
  action: str;
  details: str;
  category: str;
  ip_address?: str;
}

import { useLanguage } from '../../../context/LanguageContext';

export default function AdminDashboard() {
  const router = useRouter();
  const { t } = useLanguage();
  const [auth, setAuth] = useState<ReturnType<typeof getAuth>>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeProfileTab, setActiveProfileTab] = useState<'ALL' | 'ASHA' | 'PHC' | 'DHO' | 'AI_INFERENCE' | 'AUTH_SECURITY'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, logsRes] = await Promise.all([
        fetch('http://localhost:8008/dashboard/admin/stats', { headers: authHeaders() }),
        fetch('http://localhost:8008/dashboard/admin/logs?limit=150', { headers: authHeaders() })
      ]);

      if (statsRes.status === 401 || logsRes.status === 401) {
        logout(); router.replace('/auth/login'); return;
      }
      if (!statsRes.ok || !logsRes.ok) throw new Error('Failed to fetch system logs.');

      setStats(await statsRes.json());
      setLogs(await logsRes.json());
    } catch {
      setError('Failed to load system activity logs. Ensure backend server is online.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const a = getAuth();
    if (!a) { router.replace('/auth/login'); return; }
    if (a.role !== 'admin') { router.replace(`/dashboard/${a.role}`); return; }
    setAuth(a);
    loadData();
  }, [router, loadData]);

  // Filter logs by profile role tab and search query
  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.role.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (activeProfileTab === 'ALL') return true;
    if (activeProfileTab === 'ASHA') return log.role === 'asha' || log.category === 'ASHA_WORKER';
    if (activeProfileTab === 'PHC') return log.role === 'phc' || log.category === 'PHC_DOCTOR';
    if (activeProfileTab === 'DHO') return log.role === 'dho' || log.category === 'DHO_OFFICER';
    if (activeProfileTab === 'AI_INFERENCE') return log.role === 'system' || log.category === 'AI_INFERENCE';
    if (activeProfileTab === 'AUTH_SECURITY') return log.category === 'AUTH_SECURITY' || log.action.includes('LOGIN') || log.action.includes('SIGNUP');
    return true;
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Inter, sans-serif', background: 'transparent' }}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{ width: 38, height: 38, background: '#dc2626', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: 20 }}>admin_panel_settings</span>
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#dc2626' }}>Swastai Admin</div>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>System Audit Log Console</div>
          </div>
        </div>

        <div style={{ background: '#fef2f2', borderRadius: 12, padding: '14px 16px', marginBottom: 24, border: '1px solid #fecaca' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#7f1d1d' }}>{auth?.full_name || 'System Admin'}</div>
          <div style={{ fontSize: 12, color: '#dc2626', fontWeight: 600, marginTop: 2 }}>{t('role_admin')}</div>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <a className="sidebar-link active" style={{ textDecoration: 'none' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>history_edu</span>
            {t('audit_logs')}
          </a>
          <Link href="/dashboard/dho" className="sidebar-link" style={{ textDecoration: 'none' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>account_balance</span>
            {t('role_dho')}
          </Link>
          <Link href="/dashboard/phc" className="sidebar-link" style={{ textDecoration: 'none' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>local_hospital</span>
            {t('phc_referrals_list')}
          </Link>
        </nav>

        <button onClick={() => { logout(); router.replace('/'); }} className="sidebar-link" style={{ background: '#fef2f2', border: '1px solid #fecaca', cursor: 'pointer', width: '100%', textAlign: 'left', color: '#dc2626', marginTop: 20 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span> {t('sign_out')}
        </button>
      </aside>

      {/* Main Content */}
      <main className="main-with-sidebar" style={{ flex: 1, padding: '32px 36px', maxWidth: 1250 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
              {t('admin_dashboard_title')}
            </h1>
            <p style={{ color: '#64748b', margin: 0, fontSize: 14 }}>
              {t('admin_dashboard_sub')}
            </p>
          </div>

          <button onClick={loadData} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '10px 18px', background: '#fff', border: '1px solid #cbd5e1',
            borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#334155'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>refresh</span> {t('refresh')}
          </button>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 12, padding: '14px 18px', marginBottom: 24, color: '#dc2626', fontSize: 14 }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <div className="spinner" style={{ width: 40, height: 40, margin: '0 auto' }} />
            <p style={{ color: '#64748b', marginTop: 16 }}>Loading platform audit logs...</p>
          </div>
        ) : (
          <>
            {/* System Overview Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16, marginBottom: 28 }}>
              <div className="card" style={{ background: '#fff', borderLeft: '4px solid #dc2626', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('system_users')}</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>{stats?.total_users ?? 0} Accounts</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>ASHA, PHC, DHO, Admin</div>
                  </div>
                  <div style={{ width: 44, height: 44, background: '#fef2f2', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ color: '#dc2626', fontSize: 22 }}>badge</span>
                  </div>
                </div>
              </div>

              <div className="card" style={{ background: '#fff', borderLeft: '4px solid #16a34a', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('patient_database')}</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: '#16a34a', marginTop: 4 }}>{stats?.total_patients ?? 0} Records</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Registered across District</div>
                  </div>
                  <div style={{ width: 44, height: 44, background: '#f0fdf4', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ color: '#16a34a', fontSize: 22 }}>folder_shared</span>
                  </div>
                </div>
              </div>

              <div className="card" style={{ background: '#fff', borderLeft: '4px solid #ea580c', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('high_risk_cases')}</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: '#ea580c', marginTop: 4 }}>{stats?.high_risk_patients ?? 0} Flagged</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Requires PHC Follow-up</div>
                  </div>
                  <div style={{ width: 44, height: 44, background: '#fff7ed', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ color: '#ea580c', fontSize: 22 }}>emergency</span>
                  </div>
                </div>
              </div>

              <div className="card" style={{ background: '#fff', borderLeft: '4px solid #7c3aed', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('total_audit_trail')}</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: '#7c3aed', marginTop: 4 }}>{stats?.total_logs ?? logs.length} Activity Logs</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>3 AI Disease Models Online</div>
                  </div>
                  <div style={{ width: 44, height: 44, background: '#f5f3ff', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ color: '#7c3aed', fontSize: 22 }}>history</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Log Filter Tabs & Search Bar */}
            <div className="card" style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="material-symbols-outlined" style={{ color: '#dc2626', fontSize: 22 }}>receipt_long</span>
                    {t('activity_logs_title')}
                  </h2>
                  <p style={{ color: '#64748b', margin: 0, fontSize: 13 }}>
                    Filter actions taken by ASHA workers, PHC doctors, DHO officers, and automated AI model inferences.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative' }}>
                    <span className="material-symbols-outlined" style={{ position: 'absolute', left: 12, top: 10, color: '#94a3b8', fontSize: 18 }}>search</span>
                    <input
                      type="text"
                      placeholder={t('search_placeholder')}
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      style={{
                        padding: '8px 12px 8px 36px', borderRadius: 8, border: '1px solid #cbd5e1',
                        fontSize: 14, outline: 'none', width: 230, fontFamily: 'Inter, sans-serif'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Profile Filter Badges */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
                {[
                  { id: 'ALL', label: t('all_logs'), icon: 'apps', color: '#0f172a', bg: '#f1f5f9' },
                  { id: 'ASHA', label: t('asha_logs'), icon: 'person', color: '#00685f', bg: '#e6f4f1' },
                  { id: 'PHC', label: t('phc_logs'), icon: 'local_hospital', color: '#3b82f6', bg: '#eff6ff' },
                  { id: 'DHO', label: t('dho_logs'), icon: 'account_balance', color: '#d97706', bg: '#fffbeb' },
                  { id: 'AI_INFERENCE', label: t('ai_logs'), icon: 'psychology', color: '#7c3aed', bg: '#f5f3ff' },
                  { id: 'AUTH_SECURITY', label: t('auth_logs'), icon: 'security', color: '#dc2626', bg: '#fef2f2' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveProfileTab(tab.id as any)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '8px 16px', borderRadius: 8, border: '1px solid',
                      borderColor: activeProfileTab === tab.id ? tab.color : '#e2e8f0',
                      background: activeProfileTab === tab.id ? tab.bg : '#fff',
                      color: activeProfileTab === tab.id ? tab.color : '#64748b',
                      fontSize: 13, fontWeight: activeProfileTab === tab.id ? 700 : 500,
                      cursor: 'pointer', transition: 'all 0.15s'
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Log List View */}
              {filteredLogs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 40, color: '#cbd5e1' }}>history_toggle_off</span>
                  <p style={{ margin: '8px 0 0' }}>No activity logs found for the selected profile filter.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {filteredLogs.map(log => {
                    const badge = getProfileBadge(log.role, log.category);
                    const formattedDate = new Date(log.timestamp).toLocaleString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
                    });

                    return (
                      <div key={log.id} style={{
                        background: '#fff', border: `1px solid ${badge.borderColor}`,
                        borderRadius: 12, padding: '16px 20px', display: 'flex', gap: 16,
                        alignItems: 'flex-start', transition: 'box-shadow 0.15s'
                      }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 10, background: badge.bg,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                          <span className="material-symbols-outlined" style={{ color: badge.color, fontSize: 20 }}>
                            {badge.icon}
                          </span>
                        </div>

                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                                {log.user_name}
                              </span>
                              <span style={{
                                padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                                background: badge.bg, color: badge.color, border: `1px solid ${badge.borderColor}`
                              }}>
                                {badge.label}
                              </span>
                              <span style={{
                                padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                                background: '#f1f5f9', color: '#475569'
                              }}>
                                {log.action}
                              </span>
                            </div>

                            <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>
                              {formattedDate}
                            </span>
                          </div>

                          <div style={{ fontSize: 14, color: '#334155', lineHeight: '1.5', marginTop: 4 }}>
                            {log.details}
                          </div>

                          {log.ip_address && (
                            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 12 }}>dns</span>
                              IP: {log.ip_address} • Log ID: {log.id.slice(0, 8)}…
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Database Info Card */}
            <div className="card" style={{ padding: '20px 24px', background: '#fff' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-outlined" style={{ color: '#dc2626', fontSize: 20 }}>database</span>
                Database & Log Storage Infrastructure
              </h3>
              <p style={{ color: '#64748b', fontSize: 14, margin: 0, lineHeight: 1.6 }}>
                All user transactions, ML model predictions, and role activities are stored persistently in the SQLite database at <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, fontSize: 13 }}>backend/swastai.db</code>.
                System administrators can audit activity logs across ASHA workers, PHC clinicians, District Officers, and AI inference tasks.
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function getProfileBadge(role: string, category: string) {
  if (role === 'asha' || category === 'ASHA_WORKER') {
    return { label: 'ASHA Worker', icon: 'assignment_ind', color: '#00685f', bg: '#f0fdf4', borderColor: '#bbf7d0' };
  }
  if (role === 'phc' || category === 'PHC_DOCTOR') {
    return { label: 'PHC Doctor', icon: 'local_hospital', color: '#2563eb', bg: '#eff6ff', borderColor: '#bfdbfe' };
  }
  if (role === 'dho' || category === 'DHO_OFFICER') {
    return { label: 'DHO Officer', icon: 'account_balance', color: '#d97706', bg: '#fffbeb', borderColor: '#fde68a' };
  }
  if (role === 'system' || category === 'AI_INFERENCE') {
    return { label: 'AI Model Engine', icon: 'smart_toy', color: '#7c3aed', bg: '#f5f3ff', borderColor: '#ddd6fe' };
  }
  if (category === 'AUTH_SECURITY') {
    return { label: 'Auth & Security', icon: 'shield', color: '#dc2626', bg: '#fef2f2', borderColor: '#fecaca' };
  }
  return { label: 'System Admin', icon: 'admin_panel_settings', color: '#dc2626', bg: '#fef2f2', borderColor: '#fecaca' };
}

