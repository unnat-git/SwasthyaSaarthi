import { authHeaders } from './auth';

const API_BASE = '/api';

export interface PatientCreatePayload {
  name: string;
  age: number;
  gender: string;
  height_cm?: number;
  weight_kg?: number;
  systolic_bp: number;
  diastolic_bp: number;
  heart_rate?: number;
  cholesterol?: number;
  glucose: number;
  smoker: number;
  alcohol_use: number;
  physical_activity: string;
  family_history_present: number;
  family_history_details?: string;
  known_condition_present: number;
  known_condition_details?: string;
  village_name?: string;
}

export interface PredictionDetail {
  score: number;
  level: string;
  factors: string[];
}

export interface PatientProfile {
  id: string;
  asha_worker_id: string;
  name: string;
  age: number;
  gender: string;
  height_cm?: number;
  weight_kg?: number;
  bmi?: number;
  systolic_bp: number;
  diastolic_bp: number;
  heart_rate?: number;
  cholesterol?: number;
  glucose: number;
  smoker: boolean;
  alcohol_use: boolean;
  physical_activity: string;
  family_history_present: boolean;
  family_history_details?: string;
  known_condition_present: boolean;
  known_condition_details?: string;
  village_name?: string;
  overall_risk_level?: string;
  requires_phc_alert: boolean;
  is_offline_prediction: boolean;
  clinical_summary?: string;
  predictions?: {
    diabetes: PredictionDetail;
    hypertension: PredictionDetail;
    cardio: PredictionDetail;
  };
  created_at: string;
}

export interface PatientSummary {
  id: string;
  name: string;
  age: number;
  gender: string;
  overall_risk_level?: string;
  requires_phc_alert: boolean;
  created_at: string;
  village_name?: string;
}

export async function createPatient(payload: PatientCreatePayload): Promise<PatientProfile> {
  const res = await fetch(`${API_BASE}/patients/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to create patient');
  }
  return res.json();
}

export async function listPatients(): Promise<PatientSummary[]> {
  const res = await fetch(`${API_BASE}/patients/`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch patients');
  return res.json();
}

export async function getPatient(id: string): Promise<PatientProfile> {
  const res = await fetch(`${API_BASE}/patients/${id}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Patient not found');
  return res.json();
}

// Legacy exports for component backwards compatibility
export async function submitComprehensiveAssessment(input: any): Promise<any> {
  return createPatient({
    name: input.name || 'Anonymous',
    age: Number(input.age || 40),
    gender: input.gender || 'Male',
    height_cm: input.height_cm,
    weight_kg: input.weight_kg,
    systolic_bp: Number(input.systolicBp || input.systolic_bp || 120),
    diastolic_bp: Number(input.diastolicBp || input.diastolic_bp || 80),
    heart_rate: input.heart_rate,
    cholesterol: input.cholesterol,
    glucose: Number(input.glucose || 90),
    smoker: Number(input.smoker || 0),
    alcohol_use: Number(input.alcohol_use || 0),
    physical_activity: input.physical_activity || 'moderate',
    family_history_present: Number(input.familyHistory || input.family_history_present || 0),
    family_history_details: input.family_history_details,
    known_condition_present: Number(input.known_condition_present || 0),
    known_condition_details: input.known_condition_details,
    village_name: input.villageName || input.village_name
  });
}

export async function syncPendingRecords(): Promise<number> {
  return 0;
}

export interface PredictionResult {
  patient_id?: string;
  name?: string;
  overall_risk_level: string;
  requires_phc_alert: boolean;
  isOfflineFallback?: boolean;
  predictions: Record<string, any>;
}

export async function nlpExtractVitals(transcript: string): Promise<Record<string, any>> {
  try {
    const res = await fetch(`${API_BASE}/nlp/extract-vitals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript }),
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('NLP backend unreachable, using local fallback', e);
  }
  return {};
}

export async function getAshaStats(): Promise<{
  total_patients: number;
  high_risk: number;
  moderate_risk: number;
}> {
  const res = await fetch(`${API_BASE}/dashboard/asha/stats`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}
