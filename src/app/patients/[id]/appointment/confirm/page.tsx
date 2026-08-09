'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AppointmentConfirmPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    const data = sessionStorage.getItem('pendingAppointment');
    if (data) {
      setDetails(JSON.parse(data));
    } else {
      router.replace(`/patients/${params.id}/appointment`);
    }
  }, [params.id, router]);

  if (!details) return null;

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{
        background: '#fff', borderBottom: '1px solid #e2e8f0',
        padding: '0 36px', height: 60, display: 'flex', alignItems: 'center', gap: 16
      }}>
        <Link href={`/patients/${params.id}/appointment`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 14 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
          Back to Booking
        </Link>
        <div style={{ width: 1, height: 20, background: '#e2e8f0' }} />
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Appointment Confirmation</div>
      </div>

      <div style={{ maxWidth: 600, margin: '40px auto', padding: '0 24px' }}>
        <div style={{ background: '#fff', padding: 32, borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
          
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ width: 64, height: 64, background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#16a34a' }}>check</span>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>Appointment Scheduled</h1>
            <p style={{ color: '#64748b', margin: 0, fontSize: 15 }}>Your doctor's appointment has been successfully booked.</p>
          </div>

          <div style={{ background: '#f1f5f9', borderRadius: 12, padding: 20, marginBottom: 32 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 16px' }}>Appointment Details</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span className="material-symbols-outlined" style={{ color: '#64748b', fontSize: 20 }}>person</span>
                <div>
                  <div style={{ fontSize: 13, color: '#64748b', marginBottom: 2 }}>Patient</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>{details.name}</div>
                  <div style={{ fontSize: 14, color: '#475569' }}>{details.phone}</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span className="material-symbols-outlined" style={{ color: '#64748b', fontSize: 20 }}>event</span>
                <div>
                  <div style={{ fontSize: 13, color: '#64748b', marginBottom: 2 }}>Date & Time</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>{details.date}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span className="material-symbols-outlined" style={{ color: '#64748b', fontSize: 20 }}>location_on</span>
                <div>
                  <div style={{ fontSize: 13, color: '#64748b', marginBottom: 2 }}>Location</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>{details.location}</div>
                  <div style={{ fontSize: 14, color: '#475569' }}>{details.address}</div>
                </div>
              </div>
            </div>
          </div>

          <Link href={`/patients/${params.id}/appointment/receipt`} style={{ textDecoration: 'none' }}>
            <button style={{ 
              width: '100%', padding: '14px', background: '#0f172a', 
              color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, 
              cursor: 'pointer', transition: 'background 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>receipt_long</span>
              Generate Receipt
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
