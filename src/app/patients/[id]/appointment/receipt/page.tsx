'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getPatient, PatientProfile } from '../../../../../lib/api';

export default function ReceiptPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [details, setDetails] = useState<any>(null);
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const data = sessionStorage.getItem('pendingAppointment');
    if (data) {
      setDetails(JSON.parse(data));
      getPatient(params.id)
        .then(setPatient)
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      router.replace(`/patients/${params.id}/appointment`);
    }
  }, [params.id, router]);

  if (!details || loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <div className="spinner" style={{ width: 36, height: 36 }} />
    </div>
  );

  const printReceipt = () => {
    window.print();
  };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: '#f8fafc', minHeight: '100vh', paddingBottom: 60 }}>
      {/* Print Specific CSS */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background: #fff !important; }
          .no-print { display: none !important; }
          .print-area { box-shadow: none !important; border: none !important; padding: 0 !important; margin: 0 !important; }
        }
      `}} />

      <div className="no-print" style={{
        background: '#fff', borderBottom: '1px solid #e2e8f0',
        padding: '0 36px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href={`/patients/${params.id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 14 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>home</span>
            Return to Profile
          </Link>
          <div style={{ width: 1, height: 20, background: '#e2e8f0' }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Appointment Receipt</div>
        </div>
        
        <button onClick={printReceipt} style={{
          padding: '8px 16px', background: '#0f172a', color: '#fff', border: 'none', 
          borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>print</span>
          Print Receipt
        </button>
      </div>

      <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 24px' }}>
        <div className="print-area" style={{ 
          background: '#fff', padding: 48, borderRadius: 16, 
          boxShadow: '0 10px 40px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' 
        }}>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f766e', paddingBottom: 24, marginBottom: 32 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#0f766e' }}>health_and_safety</span>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f766e', margin: 0, letterSpacing: '-0.02em' }}>SWASTHYA</h1>
              </div>
              <div style={{ color: '#64748b', fontSize: 14 }}>Primary Health Care Network</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Appointment Receipt</div>
              <div style={{ fontSize: 14, color: '#64748b' }}>Date Issued: {new Date().toLocaleDateString('en-IN')}</div>
            </div>
          </div>

          {/* Patient & Appointment Details */}
          <div style={{ display: 'flex', gap: 40, marginBottom: 40 }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Patient Details</h3>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{details.name}</div>
              <div style={{ fontSize: 15, color: '#475569', marginBottom: 4 }}>Phone: {details.phone}</div>
              <div style={{ fontSize: 15, color: '#475569' }}>Address: {details.address}</div>
            </div>
            
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Appointment Details</h3>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>{details.date}</div>
              <div style={{ fontSize: 15, color: '#475569', lineHeight: 1.5 }}>
                <span style={{ fontWeight: 600 }}>Location:</span><br/>
                {details.location}
              </div>
            </div>
          </div>

          {/* AI Clinical Assessment */}
          {patient && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: 12, marginBottom: 20 }}>
                AI Clinical Assessment & Predictions
              </h3>
              
              <div style={{ 
                background: patient.overall_risk_level === 'HIGH' ? '#fef2f2' : patient.overall_risk_level === 'MODERATE' ? '#fffbeb' : '#f0fdf4',
                border: `1px solid ${patient.overall_risk_level === 'HIGH' ? '#fecaca' : patient.overall_risk_level === 'MODERATE' ? '#fde68a' : '#bbf7d0'}`,
                borderRadius: 8, padding: 16, marginBottom: 24
              }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: patient.overall_risk_level === 'HIGH' ? '#dc2626' : patient.overall_risk_level === 'MODERATE' ? '#d97706' : '#16a34a', marginBottom: 4 }}>
                  OVERALL CLINICAL RISK LEVEL: {patient.overall_risk_level}
                </div>
                <div style={{ fontSize: 13, color: '#475569' }}>
                  Please present this receipt to the Primary Health Centre Medical Officer for prioritization and medical verification.
                </div>
              </div>

              {/* Vitals & Clinical Measurements */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 20, marginBottom: 24 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0f766e', margin: '0 0 12px 0' }}>Clinical Measurements Summary</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Blood Pressure</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{patient.systolic_bp}/{patient.diastolic_bp} mmHg</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Fasting Glucose</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{patient.glucose} mg/dL</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Body Mass Index (BMI)</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{patient.bmi ? `${patient.bmi.toFixed(1)} kg/m²` : 'N/A'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Heart Rate</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{patient.heart_rate ? `${patient.heart_rate} bpm` : 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* Disease-Specific Risk Assessment Models */}
              {patient.predictions && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0f766e', margin: 0 }}>AI Disease Risk Predictions</h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                    {/* Diabetes Card */}
                    {patient.predictions.diabetes && (
                      <div style={{ 
                        border: '1px solid #e2e8f0', 
                        borderRadius: 8, 
                        padding: 14, 
                        background: patient.predictions.diabetes.level === 'HIGH' ? '#fff5f5' : patient.predictions.diabetes.level === 'MODERATE' ? '#fffbeb' : '#f8fafc' 
                      }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Diabetes Risk</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <span style={{ 
                            fontSize: 11, 
                            fontWeight: 700, 
                            padding: '2px 8px', 
                            borderRadius: 100, 
                            background: patient.predictions.diabetes.level === 'HIGH' ? '#fecaca' : patient.predictions.diabetes.level === 'MODERATE' ? '#fde68a' : '#bbf7d0',
                            color: patient.predictions.diabetes.level === 'HIGH' ? '#dc2626' : patient.predictions.diabetes.level === 'MODERATE' ? '#b45309' : '#15803d'
                          }}>
                            {patient.predictions.diabetes.level} RISK
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
                            {patient.predictions.diabetes.score}%
                          </span>
                        </div>
                        {patient.predictions.diabetes.factors && patient.predictions.diabetes.factors.length > 0 && (
                          <div style={{ fontSize: 10, color: '#64748b' }}>
                            <strong>Factors:</strong> {patient.predictions.diabetes.factors.slice(0, 3).join(', ')}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Hypertension Card */}
                    {patient.predictions.hypertension && (
                      <div style={{ 
                        border: '1px solid #e2e8f0', 
                        borderRadius: 8, 
                        padding: 14, 
                        background: patient.predictions.hypertension.level === 'HIGH' ? '#fff5f5' : patient.predictions.hypertension.level === 'MODERATE' ? '#fffbeb' : '#f8fafc' 
                      }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Hypertension Risk</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <span style={{ 
                            fontSize: 11, 
                            fontWeight: 700, 
                            padding: '2px 8px', 
                            borderRadius: 100, 
                            background: patient.predictions.hypertension.level === 'HIGH' ? '#fecaca' : patient.predictions.hypertension.level === 'MODERATE' ? '#fde68a' : '#bbf7d0',
                            color: patient.predictions.hypertension.level === 'HIGH' ? '#dc2626' : patient.predictions.hypertension.level === 'MODERATE' ? '#b45309' : '#15803d'
                          }}>
                            {patient.predictions.hypertension.level} RISK
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
                            {patient.predictions.hypertension.score}%
                          </span>
                        </div>
                        {patient.predictions.hypertension.factors && patient.predictions.hypertension.factors.length > 0 && (
                          <div style={{ fontSize: 10, color: '#64748b' }}>
                            <strong>Factors:</strong> {patient.predictions.hypertension.factors.slice(0, 3).join(', ')}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Cardiovascular Disease Card */}
                    {patient.predictions.cardio && (
                      <div style={{ 
                        border: '1px solid #e2e8f0', 
                        borderRadius: 8, 
                        padding: 14, 
                        background: patient.predictions.cardio.level === 'HIGH' ? '#fff5f5' : patient.predictions.cardio.level === 'MODERATE' ? '#fffbeb' : '#f8fafc' 
                      }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>CVD Risk</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <span style={{ 
                            fontSize: 11, 
                            fontWeight: 700, 
                            padding: '2px 8px', 
                            borderRadius: 100, 
                            background: patient.predictions.cardio.level === 'HIGH' ? '#fecaca' : patient.predictions.cardio.level === 'MODERATE' ? '#fde68a' : '#bbf7d0',
                            color: patient.predictions.cardio.level === 'HIGH' ? '#dc2626' : patient.predictions.cardio.level === 'MODERATE' ? '#b45309' : '#15803d'
                          }}>
                            {patient.predictions.cardio.level} RISK
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
                            {patient.predictions.cardio.score}%
                          </span>
                        </div>
                        {patient.predictions.cardio.factors && patient.predictions.cardio.factors.length > 0 && (
                          <div style={{ fontSize: 10, color: '#64748b' }}>
                            <strong>Factors:</strong> {patient.predictions.cardio.factors.slice(0, 3).join(', ')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer signature area */}
          <div style={{ marginTop: 60, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>
              Generated by SWASTAI Health Platform<br/>
              Receipt ID: APT-{Math.floor(100000 + Math.random() * 900000)}
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 160, borderBottom: '1px solid #cbd5e1', marginBottom: 8 }}></div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Authorized Signature</div>
            </div>
          </div>

        </div>
        
        <div className="no-print" style={{ textAlign: 'center', marginTop: 32 }}>
          <button onClick={printReceipt} style={{
            padding: '12px 24px', background: '#0f766e', color: '#fff', border: 'none', 
            borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(15, 118, 110, 0.2)'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>print</span>
            Print Receipt Now
          </button>
        </div>
      </div>
    </div>
  );
}
