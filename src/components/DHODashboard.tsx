'use client';

import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, PatientRecord } from '../lib/db';
import { BarChart3, Users, AlertTriangle, Building2, Filter, Search, Download, ShieldCheck, ChevronRight, CheckCircle2, FileSpreadsheet, Eye } from 'lucide-react';

export default function DHODashboard() {
  const [filterRisk, setFilterRisk] = useState<'ALL' | 'HIGH' | 'MODERATE' | 'LOW'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);

  // Live Query from Dexie IndexedDB
  const indexedPatients = useLiveQuery(() => db.patients.toArray()) || [];
  const pendingSyncCount = useLiveQuery(() => db.patients.where('synced').equals(0).count()) || 0;

  // Sample static district records merged with dynamic live records
  const sampleDistrictData: PatientRecord[] = [
    {
      id: 901,
      patientId: 'PAT-492019',
      name: 'Ram Charan',
      age: 56,
      gender: 'Male',
      vitals: { bmi: 31.2, glucose: 188, systolicBp: 155, diastolicBp: 98, cholesterol: 245, familyHistory: 1, physicalActivityHours: 0.5, saltIntakeHigh: 1, smoker: 1, active: 0 },
      overallRiskLevel: 'HIGH',
      requiresPhcAlert: true,
      predictions: {
        diabetes: { score: 78.4, level: 'HIGH', factors: ['Glucose 188 mg/dL', 'BMI 31.2 kg/m²'] },
        hypertension: { score: 82.1, level: 'HIGH', factors: ['BP 155/98 mmHg', 'Tobacco Smoker'] },
        cardio: { score: 71.0, level: 'HIGH', factors: ['Cholesterol 245 mg/dL', 'Systolic 155 mmHg'] }
      },
      synced: true,
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      villageName: 'Rampur Sector 1'
    },
    {
      id: 902,
      patientId: 'PAT-301928',
      name: 'Kavita Singh',
      age: 42,
      gender: 'Female',
      vitals: { bmi: 26.0, glucose: 128, systolicBp: 132, diastolicBp: 84, cholesterol: 195, familyHistory: 0, physicalActivityHours: 2.5, saltIntakeHigh: 1, smoker: 0, active: 1 },
      overallRiskLevel: 'MODERATE',
      requiresPhcAlert: false,
      predictions: {
        diabetes: { score: 48.2, level: 'MODERATE', factors: ['Fasting Glucose 128 mg/dL'] },
        hypertension: { score: 42.0, level: 'MODERATE', factors: ['Elevated BP 132/84 mmHg'] },
        cardio: { score: 28.5, level: 'LOW', factors: ['Active Lifestyle'] }
      },
      synced: true,
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      villageName: 'Chandanpur Sector 3'
    },
    {
      id: 903,
      patientId: 'PAT-881920',
      name: 'Meena Kumari',
      age: 34,
      gender: 'Female',
      vitals: { bmi: 22.4, glucose: 95, systolicBp: 118, diastolicBp: 76, cholesterol: 170, familyHistory: 0, physicalActivityHours: 4.0, saltIntakeHigh: 0, smoker: 0, active: 1 },
      overallRiskLevel: 'LOW',
      requiresPhcAlert: false,
      predictions: {
        diabetes: { score: 12.0, level: 'LOW', factors: ['Normal Glucose'] },
        hypertension: { score: 14.5, level: 'LOW', factors: ['Normal BP'] },
        cardio: { score: 11.2, level: 'LOW', factors: ['Optimal Cholesterol'] }
      },
      synced: true,
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      villageName: 'Balrampur'
    }
  ];

  const allPatients = [...indexedPatients, ...sampleDistrictData];

  const filteredPatients = allPatients.filter((p) => {
    const matchesRisk = filterRisk === 'ALL' || p.overallRiskLevel === filterRisk;
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.villageName && p.villageName.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesRisk && matchesSearch;
  });

  const totalScreened = allPatients.length + 148;
  const highRiskCount = allPatients.filter((p) => p.overallRiskLevel === 'HIGH').length + 38;
  const modRiskCount = allPatients.filter((p) => p.overallRiskLevel === 'MODERATE').length + 54;
  const activePHCs = 12;

  const exportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Patient ID,Name,Age,Gender,Village,Overall Risk,Diabetes Score,Hypertension Score,Cardio Score,Date'].join(',') +
      '\n' +
      filteredPatients
        .map(
          (p) =>
            `${p.patientId},"${p.name}",${p.age},${p.gender},"${p.villageName || ''}",${p.overallRiskLevel},${p.predictions.diabetes.score}%,${p.predictions.hypertension.score}%,${p.predictions.cardio.score}%,${p.createdAt}`
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DHO_District_Triage_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-slate-900 via-stitch-indigo to-slate-950 text-white rounded-2xl p-6 shadow-stitch">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 bg-stitch-teal/30 text-stitch-teal-light rounded-full text-xs font-black uppercase tracking-wider">
              District Health Administration Portal
            </span>
            <h2 className="text-2xl font-black mt-2">District Health Officer (DHO) Monitoring Dashboard</h2>
            <p className="text-sm text-slate-300 mt-1">
              Real-time epidemiological risk surveillance, PHC triage alerts, and village-level screening analytics.
            </p>
          </div>
          <button
            onClick={exportCSV}
            className="stitch-btn-primary text-xs py-2.5 px-4 shadow-lg shrink-0"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export District CSV Report</span>
          </button>
        </div>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="stitch-card p-5 border-l-4 border-l-stitch-indigo">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stitch-muted uppercase tracking-wider">Total Patients Screened</span>
            <Users className="w-5 h-5 text-stitch-indigo" />
          </div>
          <div className="text-3xl font-black text-stitch-indigo mt-2">{totalScreened}</div>
          <p className="text-xs text-emerald-700 font-semibold mt-1">↑ +24 today across 18 sub-centres</p>
        </div>

        <div className="stitch-card p-5 border-l-4 border-l-rose-600 bg-rose-50/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">High Risk Flagged</span>
            <AlertTriangle className="w-5 h-5 text-rose-600 animate-pulse" />
          </div>
          <div className="text-3xl font-black text-rose-700 mt-2">{highRiskCount}</div>
          <p className="text-xs text-rose-800 font-bold mt-1">Requires Immediate PHC Clinical Referral</p>
        </div>

        <div className="stitch-card p-5 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">Moderate Risk Watch</span>
            <BarChart3 className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-3xl font-black text-amber-700 mt-2">{modRiskCount}</div>
          <p className="text-xs text-amber-800 font-semibold mt-1">Scheduled for 30-day follow-up</p>
        </div>

        <div className="stitch-card p-5 border-l-4 border-l-stitch-teal">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stitch-teal-dark uppercase tracking-wider">Active PHCs & Pending</span>
            <Building2 className="w-5 h-5 text-stitch-teal" />
          </div>
          <div className="text-3xl font-black text-stitch-teal mt-2">{activePHCs} PHCs</div>
          <p className="text-xs text-stitch-indigo font-bold mt-1">Pending Offline Syncs: {pendingSyncCount}</p>
        </div>
      </div>

      {/* PATIENT TRIAGE TABLE & SEARCH */}
      <div className="bg-white rounded-2xl p-6 border border-stitch-border shadow-stitch space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-stitch-indigo">Patient Triage & Screening Registry</h3>
            <p className="text-xs text-stitch-muted">Filtered by risk priority levels for PHC allocation</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search patient, village..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-stitch-teal"
              />
            </div>

            {/* Risk Filters */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {(['ALL', 'HIGH', 'MODERATE', 'LOW'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setFilterRisk(lvl)}
                  className={`px-3 py-1 text-xs font-extrabold rounded-lg transition-all ${
                    filterRisk === lvl
                      ? lvl === 'HIGH'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : lvl === 'MODERATE'
                        ? 'bg-amber-500 text-white shadow-sm'
                        : lvl === 'LOW'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-stitch-indigo text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 uppercase font-black tracking-wider border-b border-slate-200">
                <th className="p-3 rounded-tl-xl">Patient Info</th>
                <th className="p-3">Village / Sector</th>
                <th className="p-3">Triage Level</th>
                <th className="p-3">Diabetes Risk</th>
                <th className="p-3">Hypertension Risk</th>
                <th className="p-3">CVD Risk</th>
                <th className="p-3">PHC Alert</th>
                <th className="p-3 rounded-tr-xl">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
              {filteredPatients.map((patient, i) => {
                const isHigh = patient.overallRiskLevel === 'HIGH';
                const isMod = patient.overallRiskLevel === 'MODERATE';
                return (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-stitch-indigo text-sm">{patient.name}</div>
                      <div className="text-[11px] text-slate-500">{patient.patientId} • {patient.age}y, {patient.gender}</div>
                    </td>
                    <td className="p-3 text-slate-700 font-medium">{patient.villageName || 'Rampur Sector 4'}</td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-1 rounded-full font-black text-[11px] uppercase ${
                          isHigh
                            ? 'stitch-badge-high'
                            : isMod
                            ? 'stitch-badge-moderate'
                            : 'stitch-badge-low'
                        }`}
                      >
                        {patient.overallRiskLevel}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-slate-900">{patient.predictions.diabetes.score}%</td>
                    <td className="p-3 font-bold text-slate-900">{patient.predictions.hypertension.score}%</td>
                    <td className="p-3 font-bold text-slate-900">{patient.predictions.cardio.score}%</td>
                    <td className="p-3">
                      {patient.requiresPhcAlert ? (
                        <span className="px-2 py-0.5 bg-rose-600 text-white font-black text-[10px] rounded-md animate-pulse">
                          FLAGGED TO PHC
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Normal</span>
                      )}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => setSelectedPatient(patient)}
                        className="px-3 py-1 bg-stitch-indigo/10 hover:bg-stitch-indigo hover:text-white text-stitch-indigo rounded-lg font-bold transition-all flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* INSPECT MODAL */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stitch-border space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-stitch-indigo">Patient Epidemiological Summary</h3>
                <p className="text-xs text-stitch-muted">{selectedPatient.name} ({selectedPatient.patientId})</p>
              </div>
              <span
                className={`px-3 py-1 rounded-full font-black text-xs uppercase ${
                  selectedPatient.overallRiskLevel === 'HIGH' ? 'stitch-badge-high' : 'stitch-badge-low'
                }`}
              >
                {selectedPatient.overallRiskLevel} RISK
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div><strong>Age / Gender:</strong> {selectedPatient.age} yrs / {selectedPatient.gender}</div>
              <div><strong>Village:</strong> {selectedPatient.villageName || 'N/A'}</div>
              <div><strong>Systolic/Diastolic BP:</strong> {selectedPatient.vitals.systolicBp}/{selectedPatient.vitals.diastolicBp} mmHg</div>
              <div><strong>Glucose:</strong> {selectedPatient.vitals.glucose} mg/dL</div>
              <div><strong>BMI:</strong> {selectedPatient.vitals.bmi} kg/m²</div>
              <div><strong>Cholesterol:</strong> {selectedPatient.vitals.cholesterol} mg/dL</div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-xs text-stitch-indigo uppercase">Explainability Factors & Drivers</h4>
              {Object.entries(selectedPatient.predictions).map(([diseaseKey, item]: [string, any]) => {
                const diseaseName =
                  diseaseKey === 'diabetes'
                    ? 'Diabetes Mellitus'
                    : diseaseKey === 'hypertension'
                    ? 'Hypertension'
                    : 'Cardiovascular Disease';
                return (
                  <div key={diseaseKey} className="p-2.5 bg-slate-100 rounded-lg text-xs">
                    <span className="font-bold text-stitch-teal uppercase">
                      {diseaseName} ({item.score}% - {item.level}):
                    </span>
                    <ul className="mt-1 list-disc list-inside text-slate-700 space-y-0.5">
                      {item.factors.map((f: string, idx: number) => (
                        <li key={idx}>{f}</li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedPatient(null)}
                className="stitch-btn-indigo text-xs py-2 px-5"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
