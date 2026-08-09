'use client';

import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { submitComprehensiveAssessment, syncPendingRecords, PredictionResult } from '../lib/api';
import VoiceVitalsInput from './VoiceVitalsInput';
import PHCAlertBanner from './PHCAlertBanner';
import { Activity, ShieldAlert, HeartPulse, Stethoscope, RefreshCw, Wifi, WifiOff, CheckCircle2, AlertCircle, ArrowRight, UserCheck, Scale, Zap } from 'lucide-react';

const translations = {
  en: {
    title: "ASHA / ANM Patient Risk Assessment Form",
    subtitle: "Field clinical screening form with automated speech recognition",
    track: "Track 01 - Rural Healthcare",
    online: "Online Mode - Direct Central Sync",
    offline: "Offline Mode - Local IndexedDB Active",
    connected: "Connected",
    offlineFirst: "Offline-First",
    pendingSync: "Pending Sync Counter:",
    recordsAwaiting: "record(s) awaiting upload",
    totalSaved: "Total Saved:",
    syncNow: "Sync Pending Now",
    syncSuccess: "Successfully synced {count} pending record(s) with Central Health Registry.",
    
    // Form Sections
    section1: "1. Patient Demographics & Location",
    section2: "2. Clinical Biomarkers & Vitals",
    section3: "3. Lifestyle & Genetic Indicators",
    
    // Fields
    patientName: "Patient Full Name",
    villageName: "Village / Sub-Centre Sector",
    age: "Age (Years)",
    gender: "Gender",
    female: "Female",
    male: "Male",
    other: "Other",
    bmi: "BMI (kg/m²)",
    glucose: "Glucose (mg/dL)",
    systolicBp: "Systolic BP (mmHg)",
    diastolicBp: "Diastolic BP (mmHg)",
    cholesterol: "Cholesterol (mg/dL)",
    weeklyActivity: "Weekly Activity (Hrs)",
    familyHistory: "Family History",
    highSalt: "High Salt Diet",
    tobacco: "Tobacco / Smoker",
    physicallyActive: "Physically Active",
    
    // Button
    runCalculation: "Run Comprehensive Disease Risk Calculation",
    computing: "Computing AI Risk Score...",
    
    // Results
    resultsTitle: "AI Clinical Prediction Results",
    patient: "Patient:",
    overallRisk: "Overall Risk:",
    offlineFallback: "Offline Rule-Based Inference (Saved locally in IndexedDB)",
    explainabilityDrivers: "Explainability Drivers:",
    readyTitle: "Ready for Risk Screening",
    readySubtitle: "Fill in the patient details on the left or use the Voice Assistant to auto-populate vitals."
  },
  hi: {
    title: "आशा / एएनएम मरीज जोखिम मूल्यांकन फॉर्म",
    subtitle: "स्वचालित आवाज पहचान के साथ फील्ड नैदानिक स्क्रीनिंग फॉर्म",
    track: "ट्रैक 01 - ग्रामीण स्वास्थ्य सेवा",
    online: "ऑनलाइन मोड - प्रत्यक्ष केंद्रीय सिंक",
    offline: "ऑफ़लाइन मोड - स्थानीय डेटाबेस सक्रिय",
    connected: "जुड़ा हुआ",
    offlineFirst: "ऑफ़लाइन-प्रथम",
    pendingSync: "लंबित सिंक काउंटर:",
    recordsAwaiting: "रिकॉर्ड अपलोड की प्रतीक्षा में",
    totalSaved: "कुल सहेजे गए:",
    syncNow: "लंबित रिकॉर्ड सिंक करें",
    syncSuccess: "केंद्रीय स्वास्थ्य रजिस्ट्री के साथ {count} रिकॉर्ड सफलतापूर्वक सिंक किए गए।",
    
    // Form Sections
    section1: "1. रोगी जनसांख्यिकी और स्थान",
    section2: "2. नैदानिक बायोमार्कर और विटल्स",
    section3: "3. जीवनशैली और आनुवंशिक संकेतक",
    
    // Fields
    patientName: "रोगी का पूरा नाम",
    villageName: "गाँव / उप-केंद्र क्षेत्र",
    age: "आयु (वर्ष)",
    gender: "लिंग",
    female: "महिला",
    male: "पुरुष",
    other: "अन्य",
    bmi: "बीएमआई (kg/m²)",
    glucose: "ग्लूकोज (mg/dL)",
    systolicBp: "सिस्टोलिक बीपी (mmHg)",
    diastolicBp: "डायस्टोलिक बीपी (mmHg)",
    cholesterol: "कोलेस्ट्रॉल (mg/dL)",
    weeklyActivity: "साारीरिक गतिविधि (घंटे)",
    familyHistory: "पारिवारिक इतिहास",
    highSalt: "अधिक नमक",
    tobacco: "तंबाकू / धूम्रपान",
    physicallyActive: "सक्रिय व्यायाम",
    
    // Button
    runCalculation: "व्यापक रोग जोखिम गणना चलाएं",
    computing: "एआई जोखिम स्कोर की गणना हो रही है...",
    
    // Results
    resultsTitle: "एआई नैदानिक भविष्यवाणी परिणाम",
    patient: "रोगी:",
    overallRisk: "समग्र जोखिम:",
    offlineFallback: "ऑफ़लाइन नियम-आधारित अनुमान (स्थानीय रूप से सहेजा गया)",
    explainabilityDrivers: "जोखिम के मुख्य कारण:",
    readyTitle: "स्क्रीनिंग के लिए तैयार",
    readySubtitle: "बाएं ओर रोगी का विवरण भरें या विटल्स को स्वतः भरने के लिए आवाज सहायक का उपयोग करें।"
  }
};

export default function ASHAWorkerDashboard() {
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const t = translations[lang];
  const [formData, setFormData] = useState({
    name: 'Sunita Devi',
    age: 48,
    gender: 'Female',
    villageName: 'Rampur Sector 4',
    bmi: 27.5,
    glucose: 142,
    systolicBp: 145,
    diastolicBp: 92,
    cholesterol: 215,
    familyHistory: 1,
    physicalActivityHours: 1.0,
    saltIntakeHigh: 1,
    smoker: 0,
    active: 0
  });

  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Live Query pending sync records from Dexie IndexedDB
  const pendingRecords = useLiveQuery(() => db.patients.where('synced').equals(0).toArray()) || [];
  const totalPatientsCount = useLiveQuery(() => db.patients.count()) || 0;

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleVitalsParsed = (parsed: any) => {
    setFormData((prev) => ({
      ...prev,
      name: parsed.name !== undefined ? parsed.name : prev.name,
      gender: parsed.gender !== undefined ? parsed.gender : prev.gender,
      villageName: parsed.villageName !== undefined ? parsed.villageName : prev.villageName,
      age: parsed.age !== undefined ? parsed.age : prev.age,
      glucose: parsed.glucose !== undefined ? parsed.glucose : prev.glucose,
      systolicBp: parsed.systolicBp !== undefined ? parsed.systolicBp : prev.systolicBp,
      diastolicBp: parsed.diastolicBp !== undefined ? parsed.diastolicBp : prev.diastolicBp,
      bmi: parsed.bmi !== undefined ? parsed.bmi : prev.bmi,
      cholesterol: parsed.cholesterol !== undefined ? parsed.cholesterol : prev.cholesterol,
      smoker: parsed.smoker !== undefined ? parsed.smoker : prev.smoker,
      saltIntakeHigh: parsed.saltIntakeHigh !== undefined ? parsed.saltIntakeHigh : prev.saltIntakeHigh,
      familyHistory: parsed.familyHistory !== undefined ? parsed.familyHistory : prev.familyHistory,
    }));
  };

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSyncMessage(null);
    try {
      const res = await submitComprehensiveAssessment({
        name: formData.name,
        age: formData.age,
        gender: formData.gender,
        bmi: formData.bmi,
        glucose: formData.glucose,
        systolicBp: formData.systolicBp,
        diastolicBp: formData.diastolicBp,
        cholesterol: formData.cholesterol,
        familyHistory: formData.familyHistory,
        physicalActivityHours: formData.physicalActivityHours,
        saltIntakeHigh: formData.saltIntakeHigh,
        smoker: formData.smoker,
        active: formData.active,
        villageName: formData.villageName
      });
      setPrediction(res);
    } catch (err) {
      console.error('Calculation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSync = async () => {
    setLoading(true);
    const count = await syncPendingRecords();
    setSyncMessage(lang === 'hi' 
      ? `केंद्रीय स्वास्थ्य रजिस्ट्री के साथ ${count} रिकॉर्ड सफलतापूर्वक सिंक किए गए।`
      : `Successfully synced ${count} pending record(s) with Central Health Registry.`
    );
    setLoading(false);
  };

  const highRiskDiseases = prediction
    ? Object.values(prediction.predictions)
        .filter((p: any) => p.risk_level === 'HIGH')
        .map((p: any) => p.disease)
    : [];

  return (
    <div className="space-y-6">
      {/* OFFLINE SYNC BAR */}
      <div className="bg-white border border-stitch-border rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>
            {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5 animate-pulse" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm text-stitch-indigo">
                {isOnline ? t.online : t.offline}
              </h4>
              <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}>
                {isOnline ? t.connected : t.offlineFirst}
              </span>
            </div>
            <p className="text-xs text-stitch-muted mt-0.5">
              {t.pendingSync} <span className="font-extrabold text-stitch-indigo">{pendingRecords.length} {t.recordsAwaiting}</span> • {t.totalSaved} {totalPatientsCount}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {pendingRecords.length > 0 && (
            <button
              onClick={handleManualSync}
              disabled={loading || !isOnline}
              className="px-4 py-2 bg-stitch-teal text-white rounded-xl text-xs font-bold hover:bg-stitch-teal-dark flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{t.syncNow} ({pendingRecords.length})</span>
            </button>
          )}
        </div>
      </div>

      {syncMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{syncMessage}</span>
        </div>
      )}

      {/* AUTOMATED PHC ALERT BANNER IF HIGH RISK DETECTED */}
      {prediction && prediction.requires_phc_alert && (
        <PHCAlertBanner
          patientName={formData.name}
          patientId={prediction.patient_id}
          villageName={formData.villageName}
          highRiskDiseases={highRiskDiseases}
        />
      )}

      {/* ASSESSMENT INPUT FORM */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-stitch-border shadow-stitch">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-xl font-bold text-stitch-indigo flex items-center gap-2">
                <Stethoscope className="w-6 h-6 text-stitch-teal" />
                {t.title}
              </h2>
              <p className="text-xs text-stitch-muted">
                {t.subtitle}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
                className="px-3 py-1 bg-stitch-indigo/10 hover:bg-stitch-indigo/20 text-stitch-indigo font-bold text-xs rounded-full border border-stitch-indigo/30 transition-all flex items-center gap-1.5 shadow-sm"
              >
                <span>🌐</span>
                <span>{lang === 'en' ? 'हिन्दी' : 'English'}</span>
              </button>
              <span className="px-3 py-1 bg-stitch-teal-light/40 text-stitch-teal-dark font-extrabold text-xs rounded-full">
                {t.track}
              </span>
            </div>
          </div>

          {/* Voice Input Assistant */}
          <VoiceVitalsInput onVitalsParsed={handleVitalsParsed} lang={lang} />

          <form onSubmit={handleCalculate} className="space-y-5 mt-4">
            {/* Patient Demographics */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h3 className="text-xs font-black uppercase text-stitch-indigo tracking-wider mb-3">
                {t.section1}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t.patientName}</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-base rounded-lg border border-slate-300 focus:ring-2 focus:ring-stitch-teal focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t.villageName}</label>
                  <input
                    type="text"
                    value={formData.villageName}
                    onChange={(e) => setFormData({ ...formData, villageName: e.target.value })}
                    className="w-full px-3 py-2 text-base rounded-lg border border-slate-300 focus:ring-2 focus:ring-stitch-teal focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t.age}</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-base rounded-lg border border-slate-300 focus:ring-2 focus:ring-stitch-teal focus:border-transparent outline-none font-bold"
                    min="1"
                    max="120"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t.gender}</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 text-base rounded-lg border border-slate-300 focus:ring-2 focus:ring-stitch-teal focus:border-transparent outline-none"
                  >
                    <option value="Female">{t.female}</option>
                    <option value="Male">{t.male}</option>
                    <option value="Other">{t.other}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Clinical Vitals */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h3 className="text-xs font-black uppercase text-stitch-indigo tracking-wider mb-3">
                {t.section2}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t.bmi}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.bmi}
                    onChange={(e) => setFormData({ ...formData, bmi: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-base rounded-lg border border-slate-300 focus:ring-2 focus:ring-stitch-teal outline-none font-semibold text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t.glucose}</label>
                  <input
                    type="number"
                    value={formData.glucose}
                    onChange={(e) => setFormData({ ...formData, glucose: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-base rounded-lg border border-slate-300 focus:ring-2 focus:ring-stitch-teal outline-none font-semibold text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t.systolicBp}</label>
                  <input
                    type="number"
                    value={formData.systolicBp}
                    onChange={(e) => setFormData({ ...formData, systolicBp: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-base rounded-lg border border-slate-300 focus:ring-2 focus:ring-stitch-teal outline-none font-semibold text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t.diastolicBp}</label>
                  <input
                    type="number"
                    value={formData.diastolicBp}
                    onChange={(e) => setFormData({ ...formData, diastolicBp: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-base rounded-lg border border-slate-300 focus:ring-2 focus:ring-stitch-teal outline-none font-semibold text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t.cholesterol}</label>
                  <input
                    type="number"
                    value={formData.cholesterol}
                    onChange={(e) => setFormData({ ...formData, cholesterol: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-base rounded-lg border border-slate-300 focus:ring-2 focus:ring-stitch-teal outline-none font-semibold text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t.weeklyActivity}</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.physicalActivityHours}
                    onChange={(e) => setFormData({ ...formData, physicalActivityHours: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-base rounded-lg border border-slate-300 focus:ring-2 focus:ring-stitch-teal outline-none font-semibold text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Lifestyle Risk Factors */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h3 className="text-xs font-black uppercase text-stitch-indigo tracking-wider mb-3">
                {t.section3}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100">
                  <input
                    type="checkbox"
                    checked={formData.familyHistory === 1}
                    onChange={(e) => setFormData({ ...formData, familyHistory: e.target.checked ? 1 : 0 })}
                    className="w-4 h-4 text-stitch-teal rounded focus:ring-stitch-teal"
                  />
                  <span className="text-xs font-bold text-slate-800">{t.familyHistory}</span>
                </label>

                <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100">
                  <input
                    type="checkbox"
                    checked={formData.saltIntakeHigh === 1}
                    onChange={(e) => setFormData({ ...formData, saltIntakeHigh: e.target.checked ? 1 : 0 })}
                    className="w-4 h-4 text-stitch-teal rounded focus:ring-stitch-teal"
                  />
                  <span className="text-xs font-bold text-slate-800">{t.highSalt}</span>
                </label>

                <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100">
                  <input
                    type="checkbox"
                    checked={formData.smoker === 1}
                    onChange={(e) => setFormData({ ...formData, smoker: e.target.checked ? 1 : 0 })}
                    className="w-4 h-4 text-stitch-teal rounded focus:ring-stitch-teal"
                  />
                  <span className="text-xs font-bold text-slate-800">{t.tobacco}</span>
                </label>

                <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100">
                  <input
                    type="checkbox"
                    checked={formData.active === 1}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked ? 1 : 0 })}
                    className="w-4 h-4 text-stitch-teal rounded focus:ring-stitch-teal"
                  />
                  <span className="text-xs font-bold text-slate-800">{t.physicallyActive}</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full stitch-btn-primary shadow-lg hover:shadow-xl transition-all"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>{t.computing}</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 text-stitch-gold-light" />
                  <span>{t.runCalculation}</span>
                  <ArrowRight className="w-5 h-5 ml-1" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* RESULTS & RISK GAUGES DISPLAY */}
        <div className="lg:col-span-5 space-y-5">
          {prediction ? (
            <div className="bg-white rounded-2xl p-6 border border-stitch-border shadow-stitch space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-stitch-indigo">{t.resultsTitle}</h3>
                  <p className="text-xs text-stitch-muted">{t.patient} {prediction.name}</p>
                </div>
                <div
                  className={`px-3 py-1.5 rounded-full font-black text-xs uppercase tracking-wider ${
                    prediction.overall_risk_level === 'HIGH'
                      ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                      : prediction.overall_risk_level === 'MODERATE'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}
                >
                  {t.overallRisk} {prediction.overall_risk_level}
                </div>
              </div>

              {prediction.isOfflineFallback && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs font-semibold text-amber-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{t.offlineFallback}</span>
                </div>
              )}

              {/* DISEASE GAUGES */}
              <div className="space-y-4">
                {Object.entries(prediction.predictions).map(([key, item]) => {
                  const isHigh = item.risk_level === 'HIGH';
                  const isMod = item.risk_level === 'MODERATE';
                  const badgeClass = isHigh
                    ? 'stitch-badge-high'
                    : isMod
                    ? 'stitch-badge-moderate'
                    : 'stitch-badge-low';

                  const barColor = isHigh
                    ? 'bg-rose-600'
                    : isMod
                    ? 'bg-amber-500'
                    : 'bg-emerald-600';

                  return (
                    <div key={key} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Activity className={`w-5 h-5 ${isHigh ? 'text-rose-600' : isMod ? 'text-amber-600' : 'text-emerald-600'}`} />
                          <h4 className="font-bold text-sm text-slate-900">{item.disease}</h4>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${badgeClass}`}>
                          {item.risk_score}% ({item.risk_level})
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden mb-3">
                        <div
                          className={`h-full ${barColor} transition-all duration-700`}
                          style={{ width: `${Math.max(5, item.risk_score)}%` }}
                        />
                      </div>

                      {/* Explainability Drivers */}
                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <span className="text-xs font-bold text-stitch-indigo block mb-1">
                          {t.explainabilityDrivers}
                        </span>
                        <ul className="space-y-1">
                          {item.explainability_factors.map((factor: string, idx: number) => (
                            <li key={idx} className="text-xs text-slate-700 flex items-start gap-1.5">
                              <span className="text-stitch-teal font-bold">•</span>
                              <span>{factor}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 border border-stitch-border shadow-stitch text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-stitch-teal/10 text-stitch-teal mx-auto flex items-center justify-center">
                <HeartPulse className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-stitch-indigo">{t.readyTitle}</h3>
              <p className="text-sm text-stitch-muted max-w-sm mx-auto">
                {t.readySubtitle}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
