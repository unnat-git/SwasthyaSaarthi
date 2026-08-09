import Dexie, { Table } from 'dexie';

// Extended schema to match full patient intake form
export interface PatientRecord {
  id?: number;
  patientId: string;
  name: string;
  age: number;
  gender: string;
  heightCm?: number;
  weightKg?: number;
  bmi?: number;
  systolicBp?: number;
  diastolicBp?: number;
  heartRate?: number;
  cholesterol?: number;
  glucose?: number;
  smoker?: any;
  alcoholUse?: any;
  physicalActivity?: any;
  familyHistoryPresent?: any;
  familyHistoryDetails?: string;
  knownConditionPresent?: any;
  knownConditionDetails?: string;
  villageName?: string;
  ashaWorkerId?: string;
  overallRiskLevel?: any;
  requiresPhcAlert?: boolean;
  predictions?: any;
  synced?: boolean;
  createdAt?: string;
  vitals?: any;
}

export interface PHCAlert {
  id?: number;
  patientId: string;
  patientName: string;
  riskLevel: string;
  phcCenterName: string;
  status: 'PENDING' | 'ACKNOWLEDGED' | 'DISPATCHED';
  flaggedAt: string;
  vitalsSummary: string;
}

export class RuralHealthDatabase extends Dexie {
  patients!: Table<PatientRecord>;
  phcAlerts!: Table<PHCAlert>;

  constructor() {
    super('RuralHealthDB_v2');
    this.version(1).stores({
      patients: '++id, patientId, name, overallRiskLevel, synced, createdAt, ashaWorkerId',
      phcAlerts: '++id, patientId, riskLevel, status, flaggedAt'
    });
  }
}

export const db = new RuralHealthDatabase();
