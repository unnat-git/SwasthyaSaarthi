'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getAuth } from '../../../lib/auth';
import { getPatient, PatientProfile } from '../../../lib/api';

function RiskGauge({ score, level }: { score: number; level: string }) {
  const color = level === 'HIGH' ? '#dc2626' : level === 'MODERATE' ? '#d97706' : '#16a34a';
  const bg = level === 'HIGH' ? '#fef2f2' : level === 'MODERATE' ? '#fffbeb' : '#f0fdf4';
  const r = 44;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(score, 100) / 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: 110, height: 110 }}>
        <svg width="110" height="110" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="55" cy="55" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
          <circle
            cx="55" cy="55" r={r} fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - pct)}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
          <span style={{ fontSize: 22, fontWeight: 700, color }}>{score.toFixed(0)}</span>
          <span style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>/ 100</span>
        </div>
      </div>
      <span style={{
        marginTop: 8, padding: '3px 12px', borderRadius: 100,
        background: bg, color, fontSize: 12, fontWeight: 700,
        border: `1px solid ${color}44`
      }}>
        {level === 'HIGH' ? 'High Risk' : level === 'MODERATE' ? 'Moderate Risk' : 'Low Risk'}
      </span>
    </div>
  );
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8, background: '#f0fdf4',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#00685f' }}>{icon}</span>
      </div>
      <div>
        <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
        <div style={{ fontSize: 15, color: '#0f172a', fontWeight: 600, marginTop: 1 }}>{value || '—'}</div>
      </div>
    </div>
  );
}

function getTranslatedContent(rawSummary: string, overallRisk: string, lang: 'en' | 'hi' | 'bn', patient: PatientProfile) {
  const highDiseases: string[] = [];
  const modDiseases: string[] = [];
  if (patient.predictions) {
    if (patient.predictions.diabetes?.level === 'HIGH') highDiseases.push('Diabetes');
    if (patient.predictions.diabetes?.level === 'MODERATE') modDiseases.push('Diabetes');

    if (patient.predictions.hypertension?.level === 'HIGH') highDiseases.push('Hypertension');
    if (patient.predictions.hypertension?.level === 'MODERATE') modDiseases.push('Hypertension');

    if (patient.predictions.cardio?.level === 'HIGH') highDiseases.push('Cardiovascular Disease');
    if (patient.predictions.cardio?.level === 'MODERATE') modDiseases.push('Cardiovascular Disease');
  }

  // Factor badges
  const factorBadges: { icon: string; text: string; color: string }[] = [];
  if (patient.systolic_bp >= 140 || patient.diastolic_bp >= 90) {
    factorBadges.push({
      icon: 'blood_pressure',
      text: lang === 'hi' ? `उच्च रक्तचाप (${patient.systolic_bp}/${patient.diastolic_bp} mmHg)` : lang === 'bn' ? `উচ্চ রক্তচাপ (${patient.systolic_bp}/${patient.diastolic_bp} mmHg)` : `Hypertensive BP (${patient.systolic_bp}/${patient.diastolic_bp} mmHg)`,
      color: '#dc2626'
    });
  } else if (patient.systolic_bp >= 130 || patient.diastolic_bp >= 80) {
    factorBadges.push({
      icon: 'blood_pressure',
      text: lang === 'hi' ? `प्री-हाइपरटेंसिव BP (${patient.systolic_bp}/${patient.diastolic_bp} mmHg)` : lang === 'bn' ? `প্রাক-উচ্চ রক্তচাপ (${patient.systolic_bp}/${patient.diastolic_bp} mmHg)` : `Pre-Hypertensive BP (${patient.systolic_bp}/${patient.diastolic_bp} mmHg)`,
      color: '#d97706'
    });
  }

  if (patient.glucose >= 126) {
    factorBadges.push({
      icon: 'water_drop',
      text: lang === 'hi' ? `उच्च ग्लूकोज (${patient.glucose} mg/dL)` : lang === 'bn' ? `উচ্চ গ্লুকোজ (${patient.glucose} mg/dL)` : `High Fasting Glucose (${patient.glucose} mg/dL)`,
      color: '#4648d4'
    });
  }

  if (patient.bmi && patient.bmi >= 25) {
    factorBadges.push({
      icon: 'monitor_weight',
      text: lang === 'hi' ? `अधिक वजन/मोटापा (BMI ${patient.bmi})` : lang === 'bn' ? `অতিরিক্ত ওজন (BMI ${patient.bmi})` : `Elevated BMI (${patient.bmi} kg/m²)`,
      color: '#ea580c'
    });
  }

  if (patient.cholesterol && patient.cholesterol >= 200) {
    factorBadges.push({
      icon: 'vital_signs',
      text: lang === 'hi' ? `उच्च कोलेस्ट्रॉल (${patient.cholesterol} mg/dL)` : lang === 'bn' ? `উচ্চ কোলেস্টেরল (${patient.cholesterol} mg/dL)` : `High Cholesterol (${patient.cholesterol} mg/dL)`,
      color: '#c026d3'
    });
  }

  if (patient.smoker) {
    factorBadges.push({
      icon: 'smoking_rooms',
      text: lang === 'hi' ? 'सक्रिय धूम्रपान/तंबाकू' : lang === 'bn' ? 'তামাক সেবন' : 'Active Tobacco Consumption',
      color: '#7f1d1d'
    });
  }

  if (patient.age >= 50) {
    factorBadges.push({
      icon: 'cake',
      text: lang === 'hi' ? `आयु जोखिम (${patient.age} वर्ष)` : lang === 'bn' ? `বয়স ঝুঁকি (${patient.age} বছর)` : `Age Risk Group (${patient.age} Years)`,
      color: '#475569'
    });
  }

  if (lang === 'hi') {
    const highNames = highDiseases.map(d => d === 'Diabetes' ? 'मधुमेह (Diabetes)' : d === 'Hypertension' ? 'उच्च रक्तचाप (Hypertension)' : 'हृदय रोग (CVD)').join(', ');
    const modNames = modDiseases.map(d => d === 'Diabetes' ? 'मधुमेह (Diabetes)' : d === 'Hypertension' ? 'उच्च रक्तचाप (Hypertension)' : 'हृदय रोग (CVD)').join(', ');

    return {
      title: 'नैदानिक ​​जोखिम एवं योगदान कारक विश्लेषण सारांश',
      subtitle: 'एआई क्लिनिकल असेसमेंट इंजन द्वारा निर्मित',
      overviewHeading: 'जोखिम अवलोकन',
      overviewText: overallRisk === 'HIGH'
        ? `मरीज को निम्नलिखित स्थितियों के लिए उच्च जोखिम (HIGH RISK) पाया गया है: ${highNames || 'क्रोनिक स्थितियां'}।`
        : overallRisk === 'MODERATE'
        ? `मरीज को निम्नलिखित स्थितियों के लिए मध्यम जोखिम (MODERATE RISK) पाया गया है: ${modNames || 'क्रोनिक स्थितियां'}।`
        : 'मरीज के सभी मुख्य वाइटल्स सुरक्षित सीमा में हैं (कम जोखिम)।',
      factorsHeading: 'मुख्य योगदान कारक एवं वाइटल्स',
      recommendationHeading: 'आशा (ASHA) एवं PHC के लिए अनुशंसित कार्रवाई',
      recommendationText: overallRisk === 'HIGH'
        ? 'प्राथमिक स्वास्थ्य केंद्र (PHC) चिकित्सा अधिकारी के पास तत्काल रेफरल आवश्यक है। त्वरित डॉक्टर जांच, नैदानिक ​​पुष्टि और दवा समीक्षा की आवश्यकता है।'
        : overallRisk === 'MODERATE'
        ? '14 दिनों के भीतर अनुवर्ती वाइटल्स जांच का शेड्यूल बनाएं। कम नमक, संतुलित आहार और नियमित व्यायाम की सलाह दें।'
        : 'नियमित स्वास्थ्य निगरानी जारी रखें और वार्षिक जांच कराएं।',
      diseaseReportsTitle: 'व्यक्तिगत बीमारी जोखिम रिपोर्ट',
      factorsTitle: 'योगदान जोखिम कारक',
      factorBadges
    };
  }

  if (lang === 'bn') {
    const highNames = highDiseases.map(d => d === 'Diabetes' ? 'ডায়াবেটিস (Diabetes)' : d === 'Hypertension' ? 'উচ্চ রক্তচাপ (Hypertension)' : 'হৃদরোগ (CVD)').join(', ');
    const modNames = modDiseases.map(d => d === 'Diabetes' ? 'ডায়াবেটিস (Diabetes)' : d === 'Hypertension' ? 'উচ্চ রক্তচাপ (Hypertension)' : 'হৃদরোগ (CVD)').join(', ');

    return {
      title: 'ক্লিনিকাল ঝুঁকি এবং অবদানকারী কারণগুলির বিবরণ সারসংক্ষেপ',
      subtitle: 'এআই ক্লিনিকাল অ্যাসেসমেন্ট ইঞ্জিন দ্বারা নির্মিত',
      overviewHeading: 'ঝুঁকি ওভারভিউ',
      overviewText: overallRisk === 'HIGH'
        ? `রোগীর নিম্নলিখিত ক্ষেত্রগুলিতে উচ্চ ঝুঁকি (HIGH RISK) চিহ্নিত করা হয়েছে: ${highNames || 'ক্রনিক রোগ'}।`
        : overallRisk === 'MODERATE'
        ? `রোগীর নিম্নলিখিত ক্ষেত্রগুলিতে মাঝারি ঝুঁকি (MODERATE RISK) চিহ্নিত করা হয়েছে: ${modNames || 'ক্রনিক রোগ'}।`
        : 'রোগীর সমস্ত মূল ভাইটাল পরীক্ষা নিরাপদ সীমার মধ্যে রয়েছে (কম ঝুঁকি)।',
      factorsHeading: 'প্রধান অবদানকারী কারণ ও ভাইটাল',
      recommendationHeading: 'আশা (ASHA) এবং PHC-এর জন্য প্রস্তাবিত পদক্ষেপ',
      recommendationText: overallRisk === 'HIGH'
        ? 'প্রাথমিক স্বাস্থ্য কেন্দ্র (PHC) মেডিকেল অফিসারের কাছে জরুরি রেফারেল প্রয়োজন। অবিলম্বে চিকিৎসক মূল্যায়ন, নিশ্চিতকরণ এবং ওষুধ পর্যালোচনা আবশ্যক।'
        : overallRisk === 'MODERATE'
        ? '১৪ দিনের মধ্যে ফলো-আপ ভাইটাল পরীক্ষা করুন। খাদ্য তালিকায় লবণের পরিমাণ হ্রাস ও স্বাস্থ্যকর জীবনযাত্রার পরামর্শ দিন।'
        : 'সাধারণ প্রতিরোধমূলক স্বাস্থ্য নজরদারি এবং বার্ষিক স্ক্রিনিং অব্যাহত রাখুন।',
      diseaseReportsTitle: 'ব্যক্তিগত রোগ ঝুঁকি রিপোর্ট',
      factorsTitle: 'অবদানকারী ঝুঁকি কারণসমূহ',
      factorBadges
    };
  }

  // English
  return {
    title: 'Clinical Risk & Contributing Factor Breakdown Summary',
    subtitle: 'Generated by AI Clinical Assessment Engine',
    overviewHeading: 'Clinical Risk Overview',
    overviewText: overallRisk === 'HIGH'
      ? `Patient is evaluated at HIGH RISK for ${highDiseases.join(', ').toUpperCase() || 'chronic illness'}.`
      : overallRisk === 'MODERATE'
      ? `Patient is evaluated at MODERATE RISK for ${modDiseases.join(', ').toUpperCase() || 'chronic illness'}.`
      : 'Patient vitals indicate low overall risk across all assessed chronic disease models.',
    factorsHeading: 'Primary Contributing Risk Vitals',
    recommendationHeading: 'Clinical Recommendation for ASHA & PHC',
    recommendationText: overallRisk === 'HIGH'
      ? 'Urgent referral to Primary Health Centre (PHC) Medical Officer required. Immediate physician evaluation, diagnostic confirmation, and medication review needed.'
      : overallRisk === 'MODERATE'
      ? 'Schedule follow-up vitals intake within 14 days. Provide dietary, sodium reduction, and physical activity counseling.'
      : 'Continue standard preventive health monitoring and annual screening.',
    diseaseReportsTitle: 'Individual Disease Risk Assessment Reports',
    factorsTitle: 'Contributing Risk Factors',
    factorBadges
  };
}

import { useLanguage } from '../../../context/LanguageContext';

export default function PatientProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNew = searchParams.get('new') === 'true';
  const { lang, setLang } = useLanguage();
  const summaryLang = lang;
  const setSummaryLang = setLang;
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSuccessToast, setShowSuccessToast] = useState(isNew);

  useEffect(() => {
    const a = getAuth();
    if (!a) { router.replace('/auth/login'); return; }
    getPatient(params.id)
      .then(setPatient)
      .catch(err => setError(err.message || 'Failed to load patient'))
      .finally(() => setLoading(false));
  }, [params.id, router]);

  useEffect(() => {
    if (showSuccessToast) {
      const t = setTimeout(() => setShowSuccessToast(false), 4000);
      return () => clearTimeout(t);
    }
  }, [showSuccessToast]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ width: 36, height: 36, margin: '0 auto' }} />
        <p style={{ color: '#64748b', marginTop: 12 }}>Loading patient profile...</p>
      </div>
    </div>
  );

  if (error || !patient) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#dc2626' }}>error</span>
        <h2 style={{ color: '#0f172a' }}>Patient not found</h2>
        <p style={{ color: '#64748b' }}>{error}</p>
        <Link href="/dashboard/asha" style={{ textDecoration: 'none' }}>
          <button className="btn-primary">Back to Dashboard</button>
        </Link>
      </div>
    </div>
  );

  const overallColor = patient.overall_risk_level === 'HIGH' ? '#dc2626' : patient.overall_risk_level === 'MODERATE' ? '#d97706' : '#16a34a';
  const overallBg = patient.overall_risk_level === 'HIGH' ? '#fef2f2' : patient.overall_risk_level === 'MODERATE' ? '#fffbeb' : '#f0fdf4';

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: 'transparent', minHeight: '100vh' }}>
      {/* Success toast */}
      {showSuccessToast && (
        <div className="toast success">
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>check_circle</span>
          Patient registered and risk assessment complete!
        </div>
      )}

      {/* Top bar */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #e2e8f0',
        padding: '0 36px', height: 60, display: 'flex', alignItems: 'center', gap: 16,
        position: 'sticky', top: 0, zIndex: 10
      }}>
        <Link href="/dashboard/asha" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 14 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
          Back to Dashboard
        </Link>
        <div style={{ width: 1, height: 20, background: '#e2e8f0' }} />
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Patient Profile</div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>
        {/* Patient header card */}
        <div className="card" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{
            width: 72, height: 72, background: '#f0fdf4', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <span className="material-symbols-outlined" style={{ color: '#00685f', fontSize: 36 }}>person</span>
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>{patient.name}</h1>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 14, color: '#64748b' }}>{patient.age} years • {patient.gender}</span>
              {patient.village_name && (
                <span style={{ fontSize: 14, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>location_on</span>
                  {patient.village_name}
                </span>
              )}
              <span style={{ fontSize: 14, color: '#64748b' }}>ID: {patient.id.slice(0, 8)}…</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              padding: '8px 18px', borderRadius: 100, fontWeight: 700, fontSize: 15,
              background: overallBg, color: overallColor, border: `1.5px solid ${overallColor}44`
            }}>
              {patient.overall_risk_level === 'HIGH' ? '⚠ High Overall Risk'
                : patient.overall_risk_level === 'MODERATE' ? '⚡ Moderate Overall Risk'
                : '✓ Low Overall Risk'}
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>
              Assessed {new Date(patient.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
            {patient.is_offline_prediction && (
              <div style={{ fontSize: 12, color: '#d97706', marginTop: 4 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 12 }}>wifi_off</span>
                Offline prediction
              </div>
            )}
          </div>
        </div>

        {/* Appointment Button Row */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
          <Link href={`/patients/${patient.id}/appointment`} style={{ textDecoration: 'none' }}>
            <button style={{
              padding: '12px 24px', background: '#0f766e', color: '#fff', border: 'none', 
              borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(15, 118, 110, 0.2)'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>calendar_month</span>
              Book Appointment
            </button>
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          {/* Left column: Patient details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Basic Info */}
            <div className="card">
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-outlined" style={{ color: '#00685f', fontSize: 18 }}>person</span>
                Basic Information
              </h2>
              <InfoRow label="Full Name" value={patient.name} icon="badge" />
              <InfoRow label="Age" value={`${patient.age} years`} icon="calendar_today" />
              <InfoRow label="Gender" value={patient.gender} icon="wc" />
              <InfoRow label="Village" value={patient.village_name || 'Not recorded'} icon="location_on" />
            </div>

            {/* Vitals */}
            <div className="card">
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-outlined" style={{ color: '#00685f', fontSize: 18 }}>monitor_heart</span>
                Vital Signs & Measurements
              </h2>
              <InfoRow label="Blood Pressure" value={`${patient.systolic_bp}/${patient.diastolic_bp} mmHg`} icon="blood_pressure" />
              {patient.heart_rate && <InfoRow label="Heart Rate" value={`${patient.heart_rate} bpm`} icon="favorite" />}
              {patient.height_cm && <InfoRow label="Height" value={`${patient.height_cm} cm`} icon="height" />}
              {patient.weight_kg && <InfoRow label="Weight" value={`${patient.weight_kg} kg`} icon="monitor_weight" />}
              {patient.bmi && <InfoRow label="BMI" value={`${patient.bmi} kg/m²`} icon="straighten" />}
            </div>

            {/* Lab */}
            <div className="card">
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-outlined" style={{ color: '#00685f', fontSize: 18 }}>science</span>
                Laboratory Values
              </h2>
              <InfoRow label="Fasting Glucose" value={`${patient.glucose} mg/dL`} icon="water_drop" />
              {patient.cholesterol && <InfoRow label="Total Cholesterol" value={`${patient.cholesterol} mg/dL`} icon="bloodtype" />}
            </div>
          </div>

          {/* Right column: Lifestyle + History */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Lifestyle */}
            <div className="card">
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-outlined" style={{ color: '#00685f', fontSize: 18 }}>directions_run</span>
                Lifestyle
              </h2>
              <InfoRow label="Smoking" value={patient.smoker ? 'Active Smoker' : 'Non-Smoker'} icon="smoking_rooms" />
              <InfoRow label="Alcohol Use" value={patient.alcohol_use ? 'Yes' : 'No'} icon="liquor" />
              <InfoRow label="Physical Activity" value={patient.physical_activity.charAt(0).toUpperCase() + patient.physical_activity.slice(1)} icon="fitness_center" />
            </div>

            {/* Medical History */}
            <div className="card">
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-outlined" style={{ color: '#00685f', fontSize: 18 }}>history_edu</span>
                Medical History
              </h2>
              <InfoRow
                label="Family History"
                value={patient.family_history_present
                  ? (patient.family_history_details || 'Yes (details not recorded)')
                  : 'None reported'}
                icon="family_restroom"
              />
              <InfoRow
                label="Known Condition"
                value={patient.known_condition_present
                  ? (patient.known_condition_details || 'Yes (details not recorded)')
                  : 'None'}
                icon="medication"
              />
            </div>

            {/* PHC Alert notice */}
            {patient.requires_phc_alert && (
              <div style={{
                background: '#fef2f2', border: '1.5px solid #fecaca',
                borderRadius: 12, padding: '16px 18px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span className="material-symbols-outlined" style={{ color: '#dc2626', fontSize: 20 }}>emergency</span>
                  <span style={{ fontWeight: 700, color: '#dc2626', fontSize: 15 }}>PHC Alert Flagged</span>
                </div>
                <p style={{ margin: 0, fontSize: 14, color: '#7f1d1d' }}>
                  This patient has been flagged for urgent review at the Primary Health Centre due to high risk scores.
                  Ensure immediate follow-up.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Risk Prediction Results */}
        {patient.predictions ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Clinical Explainability & High Risk Summary Banner */}
            {patient.clinical_summary && (() => {
              const translated = getTranslatedContent(patient.clinical_summary, patient.overall_risk_level, summaryLang, patient);
              return (
                <div className="card" style={{
                  background: patient.overall_risk_level === 'HIGH' ? '#fff5f5' : patient.overall_risk_level === 'MODERATE' ? '#fffbeb' : '#f0fdf4',
                  border: `2px solid ${patient.overall_risk_level === 'HIGH' ? '#fca5a5' : patient.overall_risk_level === 'MODERATE' ? '#fde68a' : '#86efac'}`,
                  borderRadius: 18, padding: '24px 28px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                }}>
                  {/* Header & Language Switcher */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: patient.overall_risk_level === 'HIGH' ? '#fee2e2' : patient.overall_risk_level === 'MODERATE' ? '#fef3c7' : '#dcfce7',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <span className="material-symbols-outlined" style={{
                          color: patient.overall_risk_level === 'HIGH' ? '#dc2626' : patient.overall_risk_level === 'MODERATE' ? '#d97706' : '#16a34a',
                          fontSize: 24
                        }}>
                          {patient.overall_risk_level === 'HIGH' ? 'warning' : patient.overall_risk_level === 'MODERATE' ? 'info' : 'check_circle'}
                        </span>
                      </div>
                      <div>
                        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                          {translated.title}
                        </h2>
                        <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>
                          {translated.subtitle}
                        </span>
                      </div>
                    </div>

                    {/* Language Switcher Pills */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', padding: '4px 6px', borderRadius: 10, border: '1px solid #cbd5e1' }}>
                      {[
                        { id: 'en', label: '🇬🇧 English' },
                        { id: 'hi', label: '🇮🇳 हिन्दी' },
                        { id: 'bn', label: '🇮🇳 বাংলা' }
                      ].map(l => (
                        <button
                          key={l.id}
                          onClick={() => setSummaryLang(l.id as any)}
                          style={{
                            padding: '5px 14px', borderRadius: 8, border: 'none',
                            fontSize: 13, fontWeight: summaryLang === l.id ? 700 : 500,
                            background: summaryLang === l.id ? '#00685f' : 'transparent',
                            color: summaryLang === l.id ? '#fff' : '#475569',
                            cursor: 'pointer', transition: 'all 0.15s'
                          }}
                        >
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Structured Uncluttered Sections */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Section 1: Risk Overview */}
                    <div style={{ background: '#ffffff', padding: '16px 20px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.06)' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                        {translated.overviewHeading}
                      </div>
                      <div style={{ fontSize: 15, color: '#1e293b', fontWeight: 600 }}>
                        {translated.overviewText}
                      </div>
                    </div>

                    {/* Section 2: Core Contributing Factor Badges */}
                    {translated.factorBadges.length > 0 && (
                      <div style={{ background: '#ffffff', padding: '16px 20px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.06)' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
                          {translated.factorsHeading}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {translated.factorBadges.map((b, idx) => (
                            <span key={idx} style={{
                              display: 'inline-flex', alignItems: 'center', gap: 6,
                              padding: '6px 14px', borderRadius: 100, fontSize: 13, fontWeight: 600,
                              background: `${b.color}12`, color: b.color, border: `1px solid ${b.color}33`
                            }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{b.icon}</span>
                              {b.text}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Section 3: Actionable Clinical Guidance */}
                    <div style={{
                      background: patient.overall_risk_level === 'HIGH' ? '#fef2f2' : patient.overall_risk_level === 'MODERATE' ? '#fef3c7' : '#dcfce7',
                      padding: '16px 20px', borderRadius: 12,
                      border: `1px solid ${patient.overall_risk_level === 'HIGH' ? '#fecaca' : patient.overall_risk_level === 'MODERATE' ? '#fde68a' : '#bbf7d0'}`,
                      display: 'flex', alignItems: 'flex-start', gap: 12
                    }}>
                      <span className="material-symbols-outlined" style={{
                        color: patient.overall_risk_level === 'HIGH' ? '#dc2626' : patient.overall_risk_level === 'MODERATE' ? '#d97706' : '#16a34a',
                        fontSize: 22, marginTop: 2
                      }}>
                        medical_services
                      </span>
                      <div>
                        <div style={{
                          fontSize: 13, fontWeight: 800,
                          color: patient.overall_risk_level === 'HIGH' ? '#991b1b' : patient.overall_risk_level === 'MODERATE' ? '#92400e' : '#166534',
                          marginBottom: 4
                        }}>
                          {translated.recommendationHeading}
                        </div>
                        <div style={{
                          fontSize: 14,
                          color: patient.overall_risk_level === 'HIGH' ? '#7f1d1d' : patient.overall_risk_level === 'MODERATE' ? '#78350f' : '#14532d',
                          lineHeight: 1.5
                        }}>
                          {translated.recommendationText}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="card">
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 24px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-outlined" style={{ color: '#00685f', fontSize: 22 }}>analytics</span>
                {getTranslatedContent(patient.clinical_summary || '', patient.overall_risk_level, summaryLang, patient).diseaseReportsTitle}
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 20 }}>
                {[
                  { key: 'diabetes', label: 'Diabetes Mellitus Report', icon: 'water_drop', color: '#4648d4', bg: '#eef2ff' },
                  { key: 'hypertension', label: 'Hypertension Report', icon: 'blood_pressure', color: '#dc2626', bg: '#fef2f2' },
                  { key: 'cardio', label: 'Cardiovascular Disease Report', icon: 'favorite', color: '#ea580c', bg: '#fff7ed' },
                ].map(({ key, label, icon, color, bg }) => {
                  const pred = patient.predictions![key as keyof typeof patient.predictions];
                  if (!pred) return null;
                  return (
                    <div key={key} style={{
                      border: `1.5px solid ${pred.level === 'HIGH' ? '#fecaca' : pred.level === 'MODERATE' ? '#fde68a' : '#bbf7d0'}`,
                      borderRadius: 14, padding: '20px', background: pred.level === 'HIGH' ? '#fef2f2' : pred.level === 'MODERATE' ? '#fffbeb' : '#f0fdf4'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                        <div style={{ width: 40, height: 40, background: bg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span className="material-symbols-outlined" style={{ color, fontSize: 20 }}>{icon}</span>
                        </div>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{label}</div>
                          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Vitals & Clinical Profile Risk</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                        <RiskGauge score={pred.score} level={pred.level} />
                      </div>
                      {pred.factors && pred.factors.length > 0 && (
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                            Contributing Risk Factors
                          </div>
                          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                            {pred.factors.map((f, i) => (
                              <li key={i} style={{
                                fontSize: 13, color: '#374151', padding: '6px 0',
                                display: 'flex', alignItems: 'flex-start', gap: 8,
                                borderBottom: i < pred.factors.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none'
                              }}>
                                <span className="material-symbols-outlined" style={{
                                  fontSize: 14,
                                  color: pred.level === 'HIGH' ? '#dc2626' : pred.level === 'MODERATE' ? '#d97706' : '#16a34a',
                                  marginTop: 2, flexShrink: 0
                                }}>
                                  {pred.level === 'HIGH' ? 'warning' : 'info'}
                                </span>
                                <span>{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 40, color: '#d97706' }}>pending</span>
            <h3 style={{ color: '#0f172a' }}>Risk assessment pending</h3>
            <p style={{ color: '#64748b' }}>The prediction service was unavailable when this patient was registered.</p>
          </div>
        )}
      </div>
    </div>
  );
}
