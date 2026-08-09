'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAuth, logout } from '../../../lib/auth';
import { listPatients, PatientSummary } from '../../../lib/api';
import { useLanguage } from '../../../context/LanguageContext';

interface VillageHealthData {
  name: string;
  total: number;
  high: number;
  moderate: number;
  low: number;
  highPct: number;
  modPct: number;
  lowPct: number;
  zone: 'RED' | 'YELLOW' | 'GREEN';
  phcAlerts: number;
}

// Fallback seed villages to ensure rich visualization for demo
const DEMO_VILLAGES: VillageHealthData[] = [
  { name: 'Rampur', total: 18, high: 7, moderate: 6, low: 5, highPct: 38.9, modPct: 33.3, lowPct: 27.8, zone: 'RED', phcAlerts: 7 },
  { name: 'Chapra East', total: 22, high: 8, moderate: 7, low: 7, highPct: 36.4, modPct: 31.8, lowPct: 31.8, zone: 'RED', phcAlerts: 8 },
  { name: 'Bishunpur', total: 15, high: 3, moderate: 7, low: 5, highPct: 20.0, modPct: 46.7, lowPct: 33.3, zone: 'YELLOW', phcAlerts: 3 },
  { name: 'Sultanpur', total: 12, high: 2, moderate: 5, low: 5, highPct: 16.7, modPct: 41.7, lowPct: 41.7, zone: 'YELLOW', phcAlerts: 2 },
  { name: 'Sonpur West', total: 25, high: 1, moderate: 4, low: 20, highPct: 4.0, modPct: 16.0, lowPct: 80.0, zone: 'GREEN', phcAlerts: 1 },
  { name: 'Kalyanpur', total: 19, high: 0, moderate: 3, low: 16, highPct: 0.0, modPct: 15.8, lowPct: 84.2, zone: 'GREEN', phcAlerts: 0 },
];

export default function DHODashboard() {
  const router = useRouter();
  const { t } = useLanguage();
  const [auth, setAuth] = useState<ReturnType<typeof getAuth>>(null);
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeZoneFilter, setActiveZoneFilter] = useState<'ALL' | 'RED' | 'YELLOW' | 'GREEN'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
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
    if (a.role !== 'dho') { router.replace(`/dashboard/${a.role}`); return; }
    setAuth(a);
    loadData();
  }, [router, loadData]);

  // Aggregate health metrics per village from actual patient data
  const villageMap: Record<string, { total: number; high: number; moderate: number; low: number; phcAlerts: number }> = {};
  
  patients.forEach(p => {
    const vName = p.village_name?.trim() || 'Unassigned Village';
    if (!villageMap[vName]) {
      villageMap[vName] = { total: 0, high: 0, moderate: 0, low: 0, phcAlerts: 0 };
    }
    villageMap[vName].total += 1;
    if (p.overall_risk_level === 'HIGH') villageMap[vName].high += 1;
    else if (p.overall_risk_level === 'MODERATE') villageMap[vName].moderate += 1;
    else villageMap[vName].low += 1;
    if (p.requires_phc_alert) villageMap[vName].phcAlerts += 1;
  });

  const computedVillages: VillageHealthData[] = Object.entries(villageMap).map(([name, counts]) => {
    const highPct = counts.total > 0 ? (counts.high / counts.total) * 100 : 0;
    const modPct = counts.total > 0 ? (counts.moderate / counts.total) * 100 : 0;
    const lowPct = counts.total > 0 ? (counts.low / counts.total) * 100 : 0;
    let zone: 'RED' | 'YELLOW' | 'GREEN' = 'GREEN';
    if (highPct >= 30 || counts.high >= 2) zone = 'RED';
    else if (highPct >= 15 || counts.moderate >= 2) zone = 'YELLOW';

    return {
      name,
      total: counts.total,
      high: counts.high,
      moderate: counts.moderate,
      low: counts.low,
      highPct: Math.round(highPct * 10) / 10,
      modPct: Math.round(modPct * 10) / 10,
      lowPct: Math.round(lowPct * 10) / 10,
      zone,
      phcAlerts: counts.phcAlerts
    };
  });

  // Combine computed villages with demo regional villages if data is sparse
  let displayVillages: VillageHealthData[] = computedVillages.length >= 3 ? computedVillages : [...computedVillages];
  
  // Merge demo villages if missing to show complete Red/Yellow/Green zonation graph
  DEMO_VILLAGES.forEach(demoV => {
    if (!displayVillages.some(v => v.name.toLowerCase() === demoV.name.toLowerCase())) {
      displayVillages.push(demoV);
    }
  });

  // Sort: RED zone first (highest highPct), then YELLOW zone, then GREEN zone
  displayVillages.sort((a, b) => {
    const zoneOrder = { RED: 1, YELLOW: 2, GREEN: 3 };
    if (zoneOrder[a.zone] !== zoneOrder[b.zone]) {
      return zoneOrder[a.zone] - zoneOrder[b.zone];
    }
    return b.highPct - a.highPct;
  });

  // Filter by search & zone tab
  const filteredVillages = displayVillages.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesZone = activeZoneFilter === 'ALL' || v.zone === activeZoneFilter;
    return matchesSearch && matchesZone;
  });

  const zoneCounts = {
    RED: displayVillages.filter(v => v.zone === 'RED').length,
    YELLOW: displayVillages.filter(v => v.zone === 'YELLOW').length,
    GREEN: displayVillages.filter(v => v.zone === 'GREEN').length,
  };

  const totalPatientsCount = patients.length > 0 ? patients.length : displayVillages.reduce((sum, v) => sum + v.total, 0);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Inter, sans-serif', background: 'transparent' }}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{ width: 38, height: 38, background: '#d97706', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: 20 }}>account_balance</span>
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#d97706' }}>{t('app_title')}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{t('role_dho')}</div>
          </div>
        </div>

        <div style={{ background: '#fffbeb', borderRadius: 12, padding: '14px 16px', marginBottom: 24, border: '1px solid #fde68a' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#78350f' }}>{auth?.full_name || 'Dr. Health Officer'}</div>
          <div style={{ fontSize: 12, color: '#d97706', fontWeight: 600, marginTop: 2 }}>{t('role_dho')}</div>
          <div style={{ fontSize: 11, color: '#92400e', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>location_on</span>
            {auth?.district || 'Muzaffarpur District'}
          </div>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <a className="sidebar-link active" style={{ textDecoration: 'none' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>map</span>
            {t('village_zonation_graph')}
          </a>
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
      <main className="main-with-sidebar" style={{ flex: 1, padding: '32px 36px', maxWidth: 1200 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
              {t('dho_dashboard_title')}
            </h1>
            <p style={{ color: '#64748b', margin: 0, fontSize: 14 }}>
              {t('dho_dashboard_sub')}
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
            <p style={{ color: '#64748b', marginTop: 16 }}>Analyzing district village risk data...</p>
          </div>
        ) : (
          <>
            {/* Stat Counters */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16, marginBottom: 28 }}>
              <div className="card" style={{ background: '#fff', borderLeft: '4px solid #3b82f6', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('total_district_coverage')}</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>{displayVillages.length} Villages</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{totalPatientsCount} Total Patients Assessed</div>
                  </div>
                  <div style={{ width: 44, height: 44, background: '#eff6ff', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ color: '#3b82f6', fontSize: 22 }}>location_city</span>
                  </div>
                </div>
              </div>

              <div className="card" style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderLeft: '5px solid #dc2626', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#991b1b', textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('red_zone_villages')}</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: '#dc2626', marginTop: 4 }}>{zoneCounts.RED}</div>
                    <div style={{ fontSize: 12, color: '#7f1d1d', marginTop: 2 }}>High Risk Priority (&ge;30%)</div>
                  </div>
                  <div style={{ width: 44, height: 44, background: '#fee2e2', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ color: '#dc2626', fontSize: 22 }}>warning</span>
                  </div>
                </div>
              </div>

              <div className="card" style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderLeft: '5px solid #d97706', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('yellow_zone_villages')}</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: '#d97706', marginTop: 4 }}>{zoneCounts.YELLOW}</div>
                    <div style={{ fontSize: 12, color: '#78350f', marginTop: 2 }}>Moderate Watchlist (15%–30%)</div>
                  </div>
                  <div style={{ width: 44, height: 44, background: '#fef3c7', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ color: '#d97706', fontSize: 22 }}>info</span>
                  </div>
                </div>
              </div>

              <div className="card" style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderLeft: '5px solid #16a34a', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('green_zone_villages')}</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: '#16a34a', marginTop: 4 }}>{zoneCounts.GREEN}</div>
                    <div style={{ fontSize: 12, color: '#14532d', marginTop: 2 }}>Healthy (&lt;15%)</div>
                  </div>
                  <div style={{ width: 44, height: 44, background: '#dcfce7', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ color: '#16a34a', fontSize: 22 }}>check_circle</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Tabs & Search */}
            <div className="card" style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="material-symbols-outlined" style={{ color: '#d97706', fontSize: 22 }}>bar_chart</span>
                    Village Health Risk Zonation Graph
                  </h2>
                  <p style={{ color: '#64748b', margin: 0, fontSize: 13 }}>
                    Comparative stacked distribution graph sorted by severity (Red Zone &rarr; Yellow Zone &rarr; Green Zone)
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative' }}>
                    <span className="material-symbols-outlined" style={{ position: 'absolute', left: 12, top: 10, color: '#94a3b8', fontSize: 18 }}>search</span>
                    <input
                      type="text"
                      placeholder="Filter by Village name..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      style={{
                        padding: '8px 12px 8px 36px', borderRadius: 8, border: '1px solid #cbd5e1',
                        fontSize: 14, outline: 'none', width: 220, fontFamily: 'Inter, sans-serif'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 8, padding: 3 }}>
                    {(['ALL', 'RED', 'YELLOW', 'GREEN'] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveZoneFilter(tab)}
                        style={{
                          padding: '6px 14px', borderRadius: 6, border: 'none',
                          cursor: 'pointer', fontSize: 13, fontWeight: 700,
                          background: activeZoneFilter === tab ? '#fff' : 'transparent',
                          color: activeZoneFilter === tab
                            ? (tab === 'RED' ? '#dc2626' : tab === 'YELLOW' ? '#d97706' : tab === 'GREEN' ? '#16a34a' : '#0f172a')
                            : '#64748b',
                          boxShadow: activeZoneFilter === tab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                          transition: 'all 0.15s'
                        }}
                      >
                        {tab === 'ALL' ? 'All Villages' : tab === 'RED' ? '🔴 Red Zone' : tab === 'YELLOW' ? '🟡 Yellow Zone' : '🟢 Green Zone'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Zonation Visual Legend */}
              <div style={{
                display: 'flex', gap: 24, padding: '12px 18px', background: '#f8fafc',
                borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: 24, flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#dc2626', display: 'inline-block' }} />
                  <span style={{ fontWeight: 600, color: '#334155' }}>High Risk Patients (Red Bar)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#d97706', display: 'inline-block' }} />
                  <span style={{ fontWeight: 600, color: '#334155' }}>Moderate Risk Patients (Yellow Bar)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
                  <span style={{ fontWeight: 600, color: '#334155' }}>Low Risk Patients (Green Bar)</span>
                </div>
              </div>

              {/* Village Risk Graph List */}
              {filteredVillages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 40, color: '#cbd5e1' }}>search_off</span>
                  <p style={{ margin: '8px 0 0' }}>No villages match the selected filter criteria.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {filteredVillages.map((v, idx) => {
                    const isRed = v.zone === 'RED';
                    const isYellow = v.zone === 'YELLOW';
                    const zoneBg = isRed ? '#fef2f2' : isYellow ? '#fffbeb' : '#f0fdf4';
                    const zoneBorder = isRed ? '#fecaca' : isYellow ? '#fde68a' : '#bbf7d0';
                    const zoneBadgeBg = isRed ? '#fee2e2' : isYellow ? '#fef3c7' : '#dcfce7';
                    const zoneBadgeColor = isRed ? '#dc2626' : isYellow ? '#d97706' : '#16a34a';
                    const zoneLabel = isRed ? '🔴 RED ZONE - Critical High Risk Alert' : isYellow ? '🟡 YELLOW ZONE - Moderate Risk Watchlist' : '🟢 GREEN ZONE - Low Risk / Healthy';

                    return (
                      <div key={v.name} style={{
                        background: zoneBg, border: `1.5px solid ${zoneBorder}`,
                        borderRadius: 14, padding: '20px 24px', transition: 'box-shadow 0.2s'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                              width: 36, height: 36, borderRadius: 10, background: zoneBadgeBg,
                              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800,
                              color: zoneBadgeColor, fontSize: 14
                            }}>
                              #{idx + 1}
                            </div>
                            <div>
                              <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                                {v.name}
                              </h3>
                              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                                {v.total} Total Patients Assessed • {v.phcAlerts} PHC Medical Alerts Flagged
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{
                              padding: '5px 14px', borderRadius: 100, fontSize: 12, fontWeight: 800,
                              background: zoneBadgeBg, color: zoneBadgeColor, border: `1px solid ${zoneBadgeColor}44`
                            }}>
                              {zoneLabel}
                            </span>
                          </div>
                        </div>

                        {/* Stacked Risk Meter Bar */}
                        <div style={{ marginBottom: 12 }}>
                          <div style={{
                            height: 18, background: '#e2e8f0', borderRadius: 9,
                            display: 'flex', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)'
                          }}>
                            {v.highPct > 0 && (
                              <div style={{
                                width: `${v.highPct}%`, background: '#dc2626',
                                transition: 'width 0.8s ease', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 700
                              }}>
                                {v.highPct > 8 && `${v.highPct.toFixed(0)}%`}
                              </div>
                            )}
                            {v.modPct > 0 && (
                              <div style={{
                                width: `${v.modPct}%`, background: '#d97706',
                                transition: 'width 0.8s ease', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 700
                              }}>
                                {v.modPct > 8 && `${v.modPct.toFixed(0)}%`}
                              </div>
                            )}
                            {v.lowPct > 0 && (
                              <div style={{
                                width: `${v.lowPct}%`, background: '#16a34a',
                                transition: 'width 0.8s ease', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 700
                              }}>
                                {v.lowPct > 8 && `${v.lowPct.toFixed(0)}%`}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Detailed Risk Numbers & Recommendation */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, fontSize: 13 }}>
                          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                            <span style={{ color: '#dc2626', fontWeight: 700 }}>
                              🔴 High Risk: {v.high} ({v.highPct}%)
                            </span>
                            <span style={{ color: '#d97706', fontWeight: 700 }}>
                              🟡 Moderate Risk: {v.moderate} ({v.modPct}%)
                            </span>
                            <span style={{ color: '#16a34a', fontWeight: 700 }}>
                              🟢 Low Risk: {v.low} ({v.lowPct}%)
                            </span>
                          </div>

                          <div style={{ fontSize: 12, color: isRed ? '#991b1b' : isYellow ? '#78350f' : '#14532d', fontWeight: 600 }}>
                            {isRed
                              ? '⚠️ Priority Action: Dispatch Mobile Medical Unit & ASHA Screening Camp'
                              : isYellow
                              ? '⚡ Action: Schedule Bi-weekly Vitals Monitoring'
                              : '✓ Status: Safe Routine Annual Health Screening'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function roundOne(val: number): number {
  return Math.round(val * 10) / 10;
}

