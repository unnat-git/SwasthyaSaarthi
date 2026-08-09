'use client';

import React, { useState } from 'react';
import { AlertTriangle, Send, PhoneCall, CheckCircle, ShieldAlert, Navigation } from 'lucide-react';

interface PHCAlertBannerProps {
  patientName: string;
  patientId?: string;
  villageName?: string;
  highRiskDiseases: string[];
}

export default function PHCAlertBanner({
  patientName,
  patientId = 'PAT-884920',
  villageName = 'Rampur Sector 4',
  highRiskDiseases
}: PHCAlertBannerProps) {
  const [notified, setNotified] = useState(false);
  const [dispatched, setDispatched] = useState(false);

  return (
    <div className="my-6 bg-gradient-to-r from-rose-900 via-red-800 to-rose-950 text-white rounded-2xl p-6 shadow-xl border-2 border-rose-400 relative overflow-hidden animate-fade-in">
      {/* Background Accent Graphics */}
      <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-red-600/20 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute right-4 top-4 opacity-10">
        <ShieldAlert className="w-32 h-32" />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white text-rose-700 flex items-center justify-center shrink-0 shadow-lg animate-bounce">
            <AlertTriangle className="w-8 h-8 text-rose-600" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-wider text-rose-100 mb-1">
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
              Automated PHC Critical Alert Flagged
            </div>
            <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">
              High Risk Detected: Flagged to Nearest Primary Health Centre (PHC)
            </h3>
            <p className="text-sm text-rose-100 font-medium mt-1">
              Patient: <span className="font-bold underline text-white">{patientName}</span> ({patientId}) • Village: {villageName}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="text-xs font-bold text-rose-200">Critical Triggers:</span>
              {highRiskDiseases.map((d, i) => (
                <span key={i} className="px-2.5 py-0.5 bg-rose-950/80 border border-rose-400/50 rounded-md text-xs font-bold text-rose-200">
                  ⚠️ {d}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
          <button
            onClick={() => setNotified(true)}
            disabled={notified}
            className={`px-5 py-3 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
              notified
                ? 'bg-emerald-600 text-white cursor-default'
                : 'bg-white text-rose-900 hover:bg-rose-50 active:scale-95'
            }`}
          >
            {notified ? (
              <>
                <CheckCircle className="w-4 h-4 text-white" />
                <span>PHC Doctor Notified</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 text-rose-700" />
                <span>Transmit Alert to PHC</span>
              </>
            )}
          </button>

          <button
            onClick={() => setDispatched(true)}
            disabled={dispatched}
            className={`px-5 py-3 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-lg border border-white/30 ${
              dispatched
                ? 'bg-amber-600 text-white cursor-default'
                : 'bg-rose-900/80 hover:bg-rose-950 text-white'
            }`}
          >
            {dispatched ? (
              <>
                <Navigation className="w-4 h-4 text-white animate-spin" />
                <span>108 Ambulance En-Route</span>
              </>
            ) : (
              <>
                <PhoneCall className="w-4 h-4 text-white" />
                <span>Dispatch 108 Transport</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
