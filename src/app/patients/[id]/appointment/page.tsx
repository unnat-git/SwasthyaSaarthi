'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAuth } from '../../../../lib/auth';
import { getPatient, PatientProfile } from '../../../../lib/api';

export default function BookAppointmentPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    const a = getAuth();
    if (!a) { router.replace('/auth/login'); return; }
    getPatient(params.id)
      .then(p => {
        setPatient(p);
        setName(p.name || '');
        setAddress(p.village_name || '');
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.id, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !address) return;
    
    // Pass info via sessionStorage to the next page
    const apptDetails = {
      patientId: params.id,
      name,
      phone,
      address,
      date: new Date(Date.now() + 86400000).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' }),
      location: 'Primary Health Centre (PHC), District Headquarter'
    };
    sessionStorage.setItem('pendingAppointment', JSON.stringify(apptDetails));
    
    router.push(`/patients/${params.id}/appointment/confirm`);
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <div className="spinner" style={{ width: 36, height: 36 }} />
    </div>
  );

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{
        background: '#fff', borderBottom: '1px solid #e2e8f0',
        padding: '0 36px', height: 60, display: 'flex', alignItems: 'center', gap: 16
      }}>
        <Link href={`/patients/${params.id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 14 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
          Back to Patient
        </Link>
        <div style={{ width: 1, height: 20, background: '#e2e8f0' }} />
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Book Appointment</div>
      </div>

      <div style={{ maxWidth: 600, margin: '40px auto', padding: '0 24px' }}>
        <div style={{ background: '#fff', padding: 32, borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#0f766e', marginBottom: 12 }}>calendar_month</span>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>Schedule Appointment</h1>
            <p style={{ color: '#64748b', margin: 0, fontSize: 15 }}>Fill in the details to schedule a PHC visit for {patient?.name}</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: '#334155' }}>Patient Name</label>
              <input 
                required 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 15, outline: 'none' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: '#334155' }}>Phone Number</label>
              <input 
                required 
                type="tel" 
                value={phone} 
                onChange={e => setPhone(e.target.value)}
                placeholder="+91 "
                style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 15, outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: '#334155' }}>Address / Village</label>
              <input 
                required 
                type="text" 
                value={address} 
                onChange={e => setAddress(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 15, outline: 'none' }}
              />
            </div>

            <button type="submit" style={{ 
              marginTop: 12, width: '100%', padding: '14px', background: '#0f766e', 
              color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, 
              cursor: 'pointer', transition: 'background 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
            }}>
              Continue to Confirmation
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_forward</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
