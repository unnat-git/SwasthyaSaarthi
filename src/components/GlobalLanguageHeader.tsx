'use client';
import React from 'react';
import { useLanguage, Language } from '../context/LanguageContext';

export default function GlobalLanguageHeader() {
  const { lang, setLang } = useLanguage();

  const options: { id: Language; label: string; flag: string }[] = [
    { id: 'en', label: 'English', flag: '🇬🇧' },
    { id: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
    { id: 'bn', label: 'বাংলা', flag: '🇮🇳' },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: 14,
        right: 24,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(12px)',
        padding: '5px 8px',
        borderRadius: 12,
        border: '1.5px solid #cbd5e1',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        transition: 'all 0.2s ease',
      }}
    >
      <span
        className="material-symbols-outlined"
        style={{ color: '#00685f', fontSize: 18, marginLeft: 4 }}
      >
        translate
      </span>

      {options.map((opt) => {
        const active = lang === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => setLang(opt.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '5px 12px',
              borderRadius: 8,
              border: 'none',
              fontSize: 12,
              fontWeight: active ? 700 : 600,
              background: active ? '#00685f' : 'transparent',
              color: active ? '#ffffff' : '#334155',
              cursor: 'pointer',
              boxShadow: active ? '0 2px 6px rgba(0, 104, 95, 0.25)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <span>{opt.flag}</span>
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
