'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { getOfflinePendingCount, syncOfflineQueue } from '../lib/offlineQueue';
import { createPatient } from '../lib/api';
import { useLanguage } from '../context/LanguageContext';

export default function OfflineSyncBanner() {
  const { lang } = useLanguage();
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const checkStatus = useCallback(() => {
    setIsOnline(navigator.onLine);
    setPendingCount(getOfflinePendingCount());
  }, []);

  const handleSync = useCallback(async () => {
    const count = getOfflinePendingCount();
    if (count === 0 || !navigator.onLine) return;

    setSyncing(true);
    try {
      const res = await syncOfflineQueue(createPatient);
      if (res.syncedCount > 0) {
        const msg =
          lang === 'hi'
            ? `⚡ ${res.syncedCount} ऑफ़लाइन मरीज डेटा सर्वर पर सफलतापूर्वक सिंक हो गए!`
            : lang === 'bn'
            ? `⚡ ${res.syncedCount} টি অফলাইন রোগী ডাটা সফলভাবে সার্ভারে সিঙ্ক হয়েছে!`
            : `⚡ ${res.syncedCount} offline patient records successfully synced to server!`;
        setSyncNotice(msg);
        setTimeout(() => setSyncNotice(null), 6000);
      }
    } catch (err) {
      console.error('Auto sync error:', err);
    } finally {
      setSyncing(false);
      setPendingCount(getOfflinePendingCount());
    }
  }, [lang]);

  useEffect(() => {
    checkStatus();

    const handleOnline = () => {
      setIsOnline(true);
      handleSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setPendingCount(getOfflinePendingCount());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Poll pending count every 5 seconds
    const timer = setInterval(() => {
      checkStatus();
    }, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(timer);
    };
  }, [checkStatus, handleSync]);

  if (isOnline && pendingCount === 0 && !syncNotice) return null;

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 24, zIndex: 99990, display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 420 }}>
      {/* Toast Notice when Sync Finishes */}
      {syncNotice && (
        <div
          style={{
            background: '#064e3b',
            color: '#ecfdf5',
            padding: '12px 18px',
            borderRadius: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            border: '1px solid #059669',
            animation: 'fadeIn 0.3s ease',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#34d399' }}>
            cloud_done
          </span>
          <span>{syncNotice}</span>
        </div>
      )}

      {/* Offline Status Bar */}
      {!isOnline && (
        <div
          style={{
            background: '#7f1d1d',
            color: '#fef2f2',
            padding: '12px 16px',
            borderRadius: 14,
            boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            border: '1.5px solid #ef4444',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#fca5a5' }}>
            wifi_off
          </span>
          <div>
            <div style={{ fontWeight: 700 }}>
              {lang === 'hi' ? 'ऑफ़लाइन मोड (कोई इंटरनेट नहीं)' : lang === 'bn' ? 'অফলাইন মোড (কোন ইন্টারনেট নেই)' : 'Offline Mode (No Internet)'}
            </div>
            <div style={{ fontSize: 11, color: '#fecaca', marginTop: 2 }}>
              {lang === 'hi'
                ? 'चिंता न करें! मरीज इंटेक फॉर्म डिवाइस में सुरक्षित रहेगा और नेट आते ही सिंक होगा।'
                : lang === 'bn'
                ? 'চিন্তা করবেন না! রোগীর ডাটা ডিভাইসে সেভ হবে এবং সংযোগ পেলে সিঙ্ক হবে।'
                : 'Submissions are saved locally on device and will auto-sync when online.'}
            </div>
          </div>
        </div>
      )}

      {/* Pending Sync Button Banner */}
      {isOnline && pendingCount > 0 && (
        <div
          style={{
            background: '#0f172a',
            color: '#fff',
            padding: '12px 18px',
            borderRadius: 14,
            boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            border: '1.5px solid #334155',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="material-symbols-outlined" style={{ color: '#fbbf24', fontSize: 20 }}>
              sync_problem
            </span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                {pendingCount} {lang === 'hi' ? 'ऑफ़लाइन फॉर्म लंबित हैं' : lang === 'bn' ? 'টি অফলাইন ফর্ম অপেক্ষমাণ' : 'Offline Forms Pending'}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>
                {lang === 'hi' ? 'सर्वर पर सिंक करने के लिए तैयार' : lang === 'bn' ? 'সার্ভারে সিঙ্ক করতে প্রস্তুত' : 'Ready to upload to database'}
              </div>
            </div>
          </div>

          <button
            onClick={handleSync}
            disabled={syncing}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              background: '#00685f',
              color: '#fff',
              border: 'none',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              {syncing ? 'sync' : 'cloud_upload'}
            </span>
            {syncing
              ? lang === 'hi'
                ? 'सिंक हो रहा है...'
                : lang === 'bn'
                ? 'সিঙ্ক হচ্ছে...'
                : 'Syncing...'
              : lang === 'hi'
              ? 'अभी सिंक करें'
              : lang === 'bn'
              ? 'এখনই সিঙ্ক করুন'
              : 'Sync Now'}
          </button>
        </div>
      )}
    </div>
  );
}
