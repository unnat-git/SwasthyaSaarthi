'use client';

export interface OfflinePatientRecord {
  id: string;
  createdAt: string;
  formData: any;
  overall_risk_level: 'HIGH' | 'MODERATE' | 'LOW';
  synced: boolean;
}

const OFFLINE_QUEUE_KEY = 'swastai_offline_queue';

/**
 * Fallback client-side risk estimation when offline
 */
export function calculateOfflineRiskEstimate(formData: any): 'HIGH' | 'MODERATE' | 'LOW' {
  const sBP = Number(formData.systolic_bp || 0);
  const dBP = Number(formData.diastolic_bp || 0);
  const glucose = Number(formData.glucose || 0);
  const bmi = Number(formData.bmi || 0);
  const age = Number(formData.age || 0);
  const smoker = String(formData.smoker) === '1';

  let riskPoints = 0;
  if (sBP >= 140 || dBP >= 90) riskPoints += 3;
  else if (sBP >= 130 || dBP >= 80) riskPoints += 1;

  if (glucose >= 126) riskPoints += 3;
  else if (glucose >= 100) riskPoints += 1;

  if (bmi >= 30) riskPoints += 2;
  else if (bmi >= 25) riskPoints += 1;

  if (age >= 55) riskPoints += 2;
  else if (age >= 45) riskPoints += 1;

  if (smoker) riskPoints += 2;

  if (riskPoints >= 5) return 'HIGH';
  if (riskPoints >= 2) return 'MODERATE';
  return 'LOW';
}

/**
 * Save an intake form to local offline storage
 */
export function saveOfflineIntake(formData: any): OfflinePatientRecord {
  const existing = getOfflineQueue();
  const estimatedRisk = calculateOfflineRiskEstimate(formData);
  
  const record: OfflinePatientRecord = {
    id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    createdAt: new Date().toISOString(),
    formData,
    overall_risk_level: estimatedRisk,
    synced: false,
  };

  existing.push(record);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(existing));
  return record;
}

/**
 * Get all unsynced offline records
 */
export function getOfflineQueue(): OfflinePatientRecord[] {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as OfflinePatientRecord[];
  } catch (err) {
    console.error('Failed to read offline queue', err);
    return [];
  }
}

/**
 * Get count of pending offline intakes waiting for sync
 */
export function getOfflinePendingCount(): number {
  return getOfflineQueue().filter((item) => !item.synced).length;
}

/**
 * Clear synced items from local storage
 */
export function clearSyncedRecords() {
  const unsynced = getOfflineQueue().filter((item) => !item.synced);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(unsynced));
}

/**
 * Sync all pending offline records to backend server
 */
export async function syncOfflineQueue(createPatientFn: (data: any) => Promise<any>): Promise<{ syncedCount: number; errorsCount: number }> {
  const queue = getOfflineQueue().filter((item) => !item.synced);
  if (queue.length === 0) return { syncedCount: 0, errorsCount: 0 };

  let syncedCount = 0;
  let errorsCount = 0;

  for (const record of queue) {
    try {
      await createPatientFn(record.formData);
      record.synced = true;
      syncedCount++;
    } catch (err) {
      console.error(`Failed to sync offline record ${record.id}:`, err);
      errorsCount++;
    }
  }

  // Update storage
  const remaining = queue.filter((r) => !r.synced);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));

  return { syncedCount, errorsCount };
}
