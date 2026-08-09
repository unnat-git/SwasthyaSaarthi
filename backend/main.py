import os
import sqlite3
import joblib
import numpy as np
import pandas as pd
import uuid
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, Field, EmailStr
from jose import JWTError, jwt
from passlib.context import CryptContext

# Apply sklearn compatibility patch for unpickling models saved with older sklearn versions
import sklearn.compose._column_transformer
class DummyRemainderColsList(list):
    def __setstate__(self, state):
        if isinstance(state, dict): self.__dict__.update(state)
        elif isinstance(state, tuple) and len(state) == 2:
            self.extend(state[0]); self.__dict__.update(state[1])
sklearn.compose._column_transformer._RemainderColsList = DummyRemainderColsList

# -----------------------------------------------------------------------
# CONFIG
# -----------------------------------------------------------------------
SECRET_KEY = "swastai-rural-health-secret-key-2024-very-long-secure-string"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

DB_PATH = os.path.join(os.path.dirname(__file__), "swastai.db")
MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
os.makedirs(MODELS_DIR, exist_ok=True)

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# -----------------------------------------------------------------------
# FASTAPI APP
# -----------------------------------------------------------------------
app = FastAPI(
    title="Swastai - Rural Health AI Risk Prediction API",
    description="Production-Ready Early Disease Risk Assessment Platform",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------------------------------------------------
# SQLITE DATABASE SETUP
# -----------------------------------------------------------------------
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            hashed_password TEXT NOT NULL,
            full_name TEXT NOT NULL,
            role TEXT NOT NULL,
            sub_district TEXT,
            village TEXT,
            facility_name TEXT,
            district TEXT,
            created_at TEXT NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS patients (
            id TEXT PRIMARY KEY,
            asha_worker_id TEXT NOT NULL,
            name TEXT NOT NULL,
            age INTEGER NOT NULL,
            gender TEXT NOT NULL,
            height_cm REAL,
            weight_kg REAL,
            systolic_bp REAL NOT NULL,
            diastolic_bp REAL NOT NULL,
            heart_rate REAL,
            cholesterol REAL,
            glucose REAL NOT NULL,
            bmi REAL,
            smoker INTEGER DEFAULT 0,
            alcohol_use INTEGER DEFAULT 0,
            physical_activity TEXT DEFAULT 'moderate',
            family_history_present INTEGER DEFAULT 0,
            family_history_details TEXT,
            known_condition_present INTEGER DEFAULT 0,
            known_condition_details TEXT,
            village_name TEXT,
            overall_risk_level TEXT,
            requires_phc_alert INTEGER DEFAULT 0,
            prediction_diabetes_score REAL,
            prediction_diabetes_level TEXT,
            prediction_diabetes_factors TEXT,
            prediction_hypertension_score REAL,
            prediction_hypertension_level TEXT,
            prediction_hypertension_factors TEXT,
            prediction_cardio_score REAL,
            prediction_cardio_level TEXT,
            prediction_cardio_factors TEXT,
            prediction_clinical_summary TEXT,
            is_offline_prediction INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            FOREIGN KEY (asha_worker_id) REFERENCES users(id)
        )
    """)
    conn.commit()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS activity_logs (
            id TEXT PRIMARY KEY,
            timestamp TEXT NOT NULL,
            user_id TEXT,
            user_name TEXT NOT NULL,
            role TEXT NOT NULL,
            action TEXT NOT NULL,
            details TEXT NOT NULL,
            category TEXT NOT NULL,
            ip_address TEXT
        )
    """)
    conn.commit()

    # Migration check for existing DBs
    try:
        cursor.execute("ALTER TABLE patients ADD COLUMN prediction_clinical_summary TEXT")
        conn.commit()
    except Exception:
        pass

    # Seed Demo Accounts if not present
    demo_accounts = [
        ("demo-asha-1", "asha@swastai.gov.in", "asha123", "Priya Sharma (ASHA)", "asha", "Chapra", "Rampur", None, "Muzaffarpur"),
        ("demo-phc-1", "phc@swastai.gov.in", "phc123", "Dr. Rajesh Kumar (PHC Officer)", "phc", "Chapra", None, "Rampur PHC", "Muzaffarpur"),
        ("demo-dho-1", "dho@swastai.gov.in", "dho123", "Dr. Anita Verma (DHO)", "dho", None, None, None, "Muzaffarpur"),
        ("demo-admin-1", "admin@swastai.gov.in", "admin123", "System Admin", "admin", None, None, None, None),
    ]

    for uid, email, plain_pw, name, role, sub_dist, village, fac, dist in demo_accounts:
        existing = cursor.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
        if not existing:
            hashed = hash_password(plain_pw)
            now = datetime.utcnow().isoformat()
            cursor.execute(
                """INSERT INTO users (id, email, hashed_password, full_name, role,
                   sub_district, village, facility_name, district, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (uid, email, hashed, name, role, sub_dist, village, fac, dist, now)
            )
            print(f"Seeded demo user: {email} ({role})")

    # Seed initial activity logs across all profiles if empty
    existing_logs = cursor.execute("SELECT COUNT(*) FROM activity_logs").fetchone()[0]
    if existing_logs == 0:
        now_dt = datetime.utcnow()
        seed_logs = [
            (str(uuid.uuid4()), (now_dt - timedelta(minutes=4)).isoformat(), "demo-asha-1", "Priya Sharma (ASHA)", "asha", "PATIENT_INTAKE", "Registered patient Ramesh Kumar (Age 58, BP 156/98 mmHg, Glucose 192 mg/dL). High Risk Alert Flagged.", "ASHA_WORKER", "127.0.0.1"),
            (str(uuid.uuid4()), (now_dt - timedelta(minutes=5)).isoformat(), "system-ml", "Swastai AI Engine", "system", "AI_MODEL_INFERENCE", "Executed multi-disease risk inference: Diabetes (69.5% High), CVD (79.6% High), Hypertension (84.1% High).", "AI_INFERENCE", "127.0.0.1"),
            (str(uuid.uuid4()), (now_dt - timedelta(minutes=15)).isoformat(), "demo-phc-1", "Dr. Rajesh Kumar (PHC)", "phc", "PHC_ALERT_REVIEW", "Reviewed emergency alert for Ramesh Kumar at Rampur PHC. Scheduled teleconsultation.", "PHC_DOCTOR", "127.0.0.1"),
            (str(uuid.uuid4()), (now_dt - timedelta(minutes=30)).isoformat(), "demo-dho-1", "Dr. Anita Verma (DHO)", "dho", "DISTRICT_ZONATION_UPDATE", "Generated District Village Risk Zonation Graph. Rampur classified as RED ZONE (High Risk Alert).", "DHO_OFFICER", "127.0.0.1"),
            (str(uuid.uuid4()), (now_dt - timedelta(hours=1)).isoformat(), "demo-asha-1", "Priya Sharma (ASHA)", "asha", "VOICE_VITALS_NLP", "Used Voice Vitals NLP engine to dictate patient intake details for Rampur village.", "ASHA_WORKER", "127.0.0.1"),
            (str(uuid.uuid4()), (now_dt - timedelta(hours=2)).isoformat(), "demo-dho-1", "Dr. Anita Verma (DHO)", "dho", "MOBILE_MEDICAL_DISPATCH", "Dispatched Mobile Medical Unit to Chapra East (RED ZONE).", "DHO_OFFICER", "127.0.0.1"),
            (str(uuid.uuid4()), (now_dt - timedelta(hours=3)).isoformat(), "demo-asha-1", "Priya Sharma (ASHA)", "asha", "USER_LOGIN", "ASHA Worker Priya Sharma logged in from Chapra Sub-district.", "AUTH_SECURITY", "127.0.0.1"),
            (str(uuid.uuid4()), (now_dt - timedelta(hours=4)).isoformat(), "demo-phc-1", "Dr. Rajesh Kumar (PHC)", "phc", "PATIENT_DISCHARGE_REVIEW", "Updated medication follow-up plan for Sunita Devi (Hypertension Moderate Risk).", "PHC_DOCTOR", "127.0.0.1"),
        ]
        cursor.executemany("""
            INSERT INTO activity_logs (id, timestamp, user_id, user_name, role, action, details, category, ip_address)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, seed_logs)
        print("Seeded activity logs for Admin dashboard monitoring.")

    conn.commit()
    conn.close()

def log_activity(user_name: str, role: str, action: str, details: str, category: str = "GENERAL", user_id: Optional[str] = None, ip_address: Optional[str] = "127.0.0.1"):
    try:
        log_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        conn = get_db()
        conn.execute("""
            INSERT INTO activity_logs (id, timestamp, user_id, user_name, role, action, details, category, ip_address)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (log_id, now, user_id, user_name, role, action, details, category, ip_address))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error logging activity: {e}")

# -----------------------------------------------------------------------
# ML MODELS
# -----------------------------------------------------------------------
models: Dict[str, Any] = {
    "diabetes": None,
    "hypertension": None,
    "cardio": None
}

def load_or_train_models():
    global models
    # Primary models from SwasthyaSaarthi repo
    swasthya_files = {
        "diabetes": "diabetes_xgboost_final.pkl",
        "cardio": "final_xgboost_cvd_model.pkl",
        "hypertension": "hypertension_xgb_model.pkl"
    }

    for key, fname in swasthya_files.items():
        path = os.path.join(MODELS_DIR, fname)
        if os.path.exists(path):
            try:
                models[key] = joblib.load(path)
                print(f"Loaded SwasthyaSaarthi {key} model ({fname}).")
            except Exception as err:
                print(f"Error loading SwasthyaSaarthi {key} model ({fname}): {err}")

    # Fallback to legacy models if any missing
    legacy_files = {
        "diabetes": "diabetes_model.pkl",
        "hypertension": "hypertension_model.pkl",
        "cardio": "cardio_model.pkl"
    }
    for key, fname in legacy_files.items():
        if models[key] is None:
            path = os.path.join(MODELS_DIR, fname)
            if os.path.exists(path):
                try:
                    models[key] = joblib.load(path)
                    print(f"Loaded baseline fallback {key} model ({fname}).")
                except Exception as err:
                    print(f"Error loading fallback {key} model: {err}")

@app.on_event("startup")
def startup_event():
    init_db()
    load_or_train_models()

# -----------------------------------------------------------------------
# AUTH HELPERS
# -----------------------------------------------------------------------
def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    if user is None:
        raise credentials_exception
    return dict(user)

def require_role(allowed_roles: list):
    def checker(current_user=Depends(get_current_user)):
        if current_user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access restricted. Required role: {allowed_roles}"
            )
        return current_user
    return checker

# -----------------------------------------------------------------------
# PYDANTIC SCHEMAS
# -----------------------------------------------------------------------
class SignupRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: str  # admin | dho | phc | asha
    sub_district: Optional[str] = None
    village: Optional[str] = None
    facility_name: Optional[str] = None
    district: Optional[str] = None

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: str
    role: str
    full_name: str

class UserProfile(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    sub_district: Optional[str]
    village: Optional[str]
    facility_name: Optional[str]
    district: Optional[str]
    created_at: str

class PatientCreateRequest(BaseModel):
    name: str
    age: int = Field(..., ge=1, le=120)
    gender: str  # Male | Female | Other
    height_cm: Optional[float] = Field(None, ge=50.0, le=250.0)
    weight_kg: Optional[float] = Field(None, ge=10.0, le=300.0)
    systolic_bp: float = Field(..., ge=60.0, le=240.0)
    diastolic_bp: float = Field(..., ge=40.0, le=160.0)
    heart_rate: Optional[float] = Field(None, ge=30.0, le=250.0)
    cholesterol: Optional[float] = Field(None, ge=50.0, le=600.0)
    glucose: float = Field(..., ge=40.0, le=600.0)
    smoker: int = Field(0, ge=0, le=1)
    alcohol_use: int = Field(0, ge=0, le=1)
    physical_activity: str = Field("moderate")  # low | moderate | high
    family_history_present: int = Field(0, ge=0, le=1)
    family_history_details: Optional[str] = None
    known_condition_present: int = Field(0, ge=0, le=1)
    known_condition_details: Optional[str] = None
    village_name: Optional[str] = None

class PatientSummary(BaseModel):
    id: str
    name: str
    age: int
    gender: str
    overall_risk_level: Optional[str]
    requires_phc_alert: bool
    created_at: str
    village_name: Optional[str]

class PredictionDetail(BaseModel):
    score: float
    level: str
    factors: List[str]

class PatientProfile(BaseModel):
    id: str
    asha_worker_id: str
    name: str
    age: int
    gender: str
    height_cm: Optional[float]
    weight_kg: Optional[float]
    bmi: Optional[float]
    systolic_bp: float
    diastolic_bp: float
    heart_rate: Optional[float]
    cholesterol: Optional[float]
    glucose: float
    smoker: bool
    alcohol_use: bool
    physical_activity: str
    family_history_present: bool
    family_history_details: Optional[str]
    known_condition_present: bool
    known_condition_details: Optional[str]
    village_name: Optional[str]
    overall_risk_level: Optional[str]
    requires_phc_alert: bool
    is_offline_prediction: bool
    clinical_summary: Optional[str] = None
    predictions: Optional[dict]
    created_at: str

# ML Input schemas (kept from v1)
class DiabetesInput(BaseModel):
    age: int
    bmi: float
    glucose: float
    blood_pressure: float
    family_history: int
    physical_activity_hours: float

class HypertensionInput(BaseModel):
    age: int
    systolic_bp: float
    diastolic_bp: float
    bmi: float
    salt_intake_high: int
    smoker: int

class CardioInput(BaseModel):
    age: int
    systolic_bp: float
    cholesterol: float
    smoker: int
    active: int
    glucose: float

class SinglePredictionOutput(BaseModel):
    disease: str
    risk_score: float
    risk_level: str
    explainability_factors: List[str]

# -----------------------------------------------------------------------
# PREDICTION HELPERS & EXPLAINABILITY ENGINE
# -----------------------------------------------------------------------
def determine_risk_level(score: float) -> str:
    if score < 35.0:
        return "LOW"
    elif score < 65.0:
        return "MODERATE"
    else:
        return "HIGH"

def run_predictions(
    gender: str, age: int, height_cm: Optional[float], weight_kg: Optional[float],
    bmi: float, systolic_bp: float, diastolic_bp: float, heart_rate: Optional[float],
    cholesterol: Optional[float], glucose: float, smoker: int, alcohol_use: int,
    physical_activity: str, family_history_present: int, known_condition_present: int,
    known_condition_details: Optional[str] = None
) -> dict:
    """
    Route exact trained features to SwasthyaSaarthi XGBoost models, compute probabilities,
    determine risk levels, and generate detailed explainability risk factor summaries.
    """
    # ---------------- 1. DIABETES MODEL ----------------
    # Expected features: ['gender', 'age', 'smoking_history', 'bmi', 'blood_glucose_level']
    diab_entry = models.get("diabetes")
    diab_factors = []
    if diab_entry and isinstance(diab_entry, dict) and "model" in diab_entry and hasattr(diab_entry["model"], "predict_proba"):
        diab_model = diab_entry["model"]
        diab_thresh = diab_entry.get("threshold", 0.42)
        smoking_history = 'current' if smoker == 1 else 'never'
        gender_str = 'Male' if gender == 'Male' else 'Female'
        
        df_db = pd.DataFrame([{
            'gender': gender_str,
            'age': float(age),
            'smoking_history': smoking_history,
            'bmi': float(bmi),
            'blood_glucose_level': float(glucose)
        }])
        try:
            diab_prob = float(diab_model.predict_proba(df_db)[0][1])
            diab_score = round(diab_prob * 100.0, 1)
            diab_level = "HIGH" if diab_prob >= diab_thresh else ("MODERATE" if diab_score >= 25.0 else "LOW")
        except Exception as e:
            print(f"Diabetes prediction error: {e}")
            diab_score = min(99.0, max(5.0, (glucose/200)*45 + (bmi/35)*35 + (age/80)*20))
            diab_level = determine_risk_level(diab_score)
    elif diab_entry and hasattr(diab_entry, "predict_proba"):
        df_db = pd.DataFrame([{"age": age, "bmi": bmi, "glucose": glucose}])
        diab_score = round(float(diab_entry.predict_proba(df_db)[0][1]) * 100.0, 1)
        diab_level = determine_risk_level(diab_score)
    else:
        diab_score = min(99.0, max(5.0, (glucose/200)*45 + (bmi/35)*30 + (age/80)*15 + (10 if family_history_present else 0)))
        diab_level = determine_risk_level(diab_score)

    # Diabetes Risk Factors & Clinical Indicators
    if glucose >= 126.0:
        diab_factors.append(f"Critical Hyperglycemia: Blood glucose is {glucose:.0f} mg/dL (Normal <100 mg/dL)")
    elif glucose >= 100.0:
        diab_factors.append(f"Impaired Fasting Glucose (Pre-Diabetes): Blood glucose is {glucose:.0f} mg/dL")

    if bmi >= 30.0:
        diab_factors.append(f"Obesity Class I/II: BMI is {bmi:.1f} kg/m² (Normal: 18.5–24.9 kg/m²)")
    elif bmi >= 25.0:
        diab_factors.append(f"Overweight Status: BMI is {bmi:.1f} kg/m²")

    if age >= 45:
        diab_factors.append(f"Age Risk Group: Patient is {age} years old (Risk accelerates past 45)")

    if smoker == 1:
        diab_factors.append("Active Tobacco Use: Nicotine worsens systemic insulin resistance")

    if family_history_present:
        diab_factors.append("Hereditary Factor: Positive family history of Diabetes Mellitus")

    if not diab_factors:
        diab_factors.append("Fasting blood glucose and metabolic BMI are within safe clinical range")

    # ---------------- 2. CARDIOVASCULAR DISEASE (CVD) MODEL ----------------
    # Expected features: ['age', 'bmi', 'ap_hi', 'ap_lo', 'gender', 'cholesterol', 'gluc', 'smoke', 'alco', 'active', 'age_squared', 'bmi_squared', 'age_bp_interaction']
    cvd_model = models.get("cardio")
    cvd_factors = []
    if cvd_model and hasattr(cvd_model, "predict_proba"):
        chol_val = cholesterol if cholesterol is not None else 180.0
        chol_cat = 1 if chol_val < 200.0 else (2 if chol_val < 240.0 else 3)
        gluc_cat = 1 if glucose < 100.0 else (2 if glucose < 126.0 else 3)
        gender_num = 2 if gender == "Male" else 1
        active_num = 1 if physical_activity in ["moderate", "high"] else 0

        df_cvd = pd.DataFrame([{
            'age': float(age),
            'bmi': float(bmi),
            'ap_hi': float(systolic_bp),
            'ap_lo': float(diastolic_bp),
            'gender': gender_num,
            'cholesterol': chol_cat,
            'gluc': gluc_cat,
            'smoke': int(smoker),
            'alco': int(alcohol_use),
            'active': active_num,
            'age_squared': float(age**2),
            'bmi_squared': float(bmi**2),
            'age_bp_interaction': float(age * systolic_bp)
        }])
        try:
            cvd_prob = float(cvd_model.predict_proba(df_cvd)[0][1])
            cvd_score = round(cvd_prob * 100.0, 1)
            cvd_level = determine_risk_level(cvd_score)
        except Exception as e:
            print(f"CVD prediction error: {e}")
            cvd_score = min(99.0, max(5.0, ((systolic_bp-100)/100)*40 + (((cholesterol or 180)-150)/200)*35))
            cvd_level = determine_risk_level(cvd_score)
    else:
        cvd_score = min(99.0, max(5.0, ((systolic_bp-100)/100)*35 + (((cholesterol or 180)-150)/200)*35 + (15 if smoker else 0)))
        cvd_level = determine_risk_level(cvd_score)

    # CVD Factors
    if systolic_bp >= 140.0 or diastolic_bp >= 90.0:
        cvd_factors.append(f"Severe Arterial Strain: Blood Pressure {systolic_bp:.0f}/{diastolic_bp:.0f} mmHg")
    elif systolic_bp >= 130.0 or diastolic_bp >= 80.0:
        cvd_factors.append(f"Pre-Hypertensive Strain: BP {systolic_bp:.0f}/{diastolic_bp:.0f} mmHg")

    if cholesterol and cholesterol >= 240.0:
        cvd_factors.append(f"Severe Hypercholesterolemia: {cholesterol:.0f} mg/dL (Category 3 - High Atherosclerotic Risk)")
    elif cholesterol and cholesterol >= 200.0:
        cvd_factors.append(f"Borderline Cholesterol: {cholesterol:.0f} mg/dL (Category 2)")

    if age * systolic_bp >= 7500:
        cvd_factors.append(f"High Age-BP Interaction Metric ({age * systolic_bp:.0f}): Elevated long-term vascular burden")

    if smoker == 1:
        cvd_factors.append("Active Smoking: Accelerates coronary artery plaque accumulation")
    if alcohol_use == 1:
        cvd_factors.append("Regular Alcohol Intake: Contributes to myocardial stress")
    if physical_activity == "low":
        cvd_factors.append("Sedentary Lifestyle: Low physical activity increases cardiovascular mortality risk")

    if not cvd_factors:
        cvd_factors.append("Cardiovascular markers and lipid profile within low risk range")

    # ---------------- 3. HYPERTENSION MODEL ----------------
    # Expected features: ['male', 'age', 'currentSmoker', 'diabetes', 'totChol', 'sysBP', 'diaBP', 'BMI', 'heartRate', 'glucose']
    ht_model = models.get("hypertension")
    ht_factors = []
    if ht_model and hasattr(ht_model, "predict_proba"):
        if hasattr(ht_model, 'named_steps') and 'imputer' in ht_model.named_steps:
            imp = ht_model.named_steps['imputer']
            if not hasattr(imp, '_fill_dtype'):
                imp._fill_dtype = getattr(imp, '_fit_dtype', float)

        male_flag = 1 if gender == "Male" else 0
        diabetes_flag = 1 if (glucose >= 126.0 or known_condition_present) else 0
        chol_val = cholesterol if cholesterol is not None else 200.0
        hr_val = heart_rate if heart_rate is not None else 72.0

        df_ht = pd.DataFrame([{
            'male': male_flag,
            'age': float(age),
            'currentSmoker': int(smoker),
            'diabetes': diabetes_flag,
            'totChol': float(chol_val),
            'sysBP': float(systolic_bp),
            'diaBP': float(diastolic_bp),
            'BMI': float(bmi),
            'heartRate': float(hr_val),
            'glucose': float(glucose)
        }])
        try:
            ht_prob = float(ht_model.predict_proba(df_ht)[0][1])
            ht_score = round(ht_prob * 100.0, 1)
            ht_level = "HIGH" if ht_score >= 45.0 else ("MODERATE" if ht_score >= 25.0 else "LOW")
        except Exception as e:
            print(f"Hypertension prediction error: {e}")
            ht_score = min(99.0, max(5.0, ((systolic_bp-90)/100)*60 + ((bmi-20)/15)*30))
            ht_level = determine_risk_level(ht_score)
    else:
        ht_score = min(99.0, max(5.0, ((systolic_bp-90)/100)*50 + ((diastolic_bp-60)/60)*30 + (10 if smoker else 0)))
        ht_level = determine_risk_level(ht_score)

    # Hypertension Factors
    if systolic_bp >= 140.0 or diastolic_bp >= 90.0:
        ht_factors.append(f"Stage 1/2 Hypertension Reading: {systolic_bp:.0f}/{diastolic_bp:.0f} mmHg (Optimal: <120/80)")
    elif systolic_bp >= 130.0 or diastolic_bp >= 80.0:
        ht_factors.append(f"Pre-Hypertensive Stage: {systolic_bp:.0f}/{diastolic_bp:.0f} mmHg")

    if heart_rate and heart_rate >= 90.0:
        ht_factors.append(f"Resting Tachycardia: Heart Rate {heart_rate:.0f} bpm (Elevated sympathetic tone)")

    if smoker == 1:
        ht_factors.append("Nicotine Exposure: Induces peripheral arterial vasoconstriction")

    if bmi >= 28.0:
        ht_factors.append(f"Adiposity Resistance: BMI {bmi:.1f} kg/m² increases vascular systemic load")

    if not ht_factors:
        ht_factors.append("Blood pressure and resting cardiac pulse within optimal limits")

    # ---------------- 4. HIGH-RISK CLINICAL SUMMARY GENERATOR ----------------
    overall_high = [k for k, lvl in [("Diabetes Mellitus", diab_level), ("Cardiovascular Disease", cvd_level), ("Hypertension", ht_level)] if lvl == "HIGH"]
    overall_mod = [k for k, lvl in [("Diabetes Mellitus", diab_level), ("Cardiovascular Disease", cvd_level), ("Hypertension", ht_level)] if lvl == "MODERATE"]

    summary_parts = []
    if overall_high:
        summary_parts.append(f"CRITICAL RISK SUMMARY: Patient is evaluated at HIGH RISK for {', '.join(overall_high).upper()}.")
    elif overall_mod:
        summary_parts.append(f"MODERATE RISK SUMMARY: Patient is evaluated at MODERATE RISK for {', '.join(overall_mod).upper()}.")
    else:
        summary_parts.append("LOW RISK SUMMARY: Patient vitals indicate low overall risk across all three assessed chronic disease models.")

    # Breakdown of what contributed to high risk
    contributors = []
    if systolic_bp >= 140 or diastolic_bp >= 90:
        contributors.append(f"Hypertensive Blood Pressure ({systolic_bp:.0f}/{diastolic_bp:.0f} mmHg)")
    if glucose >= 126:
        contributors.append(f"Elevated Fasting Glucose ({glucose:.0f} mg/dL, Hyperglycemic Tier)")
    if bmi >= 30:
        contributors.append(f"Obesity (BMI {bmi:.1f} kg/m²)")
    elif bmi >= 25:
        contributors.append(f"Elevated BMI ({bmi:.1f} kg/m²)")
    if cholesterol and cholesterol >= 240:
        contributors.append(f"High Total Cholesterol ({cholesterol:.0f} mg/dL, Category 3)")
    if smoker == 1:
        contributors.append("Active Tobacco Consumption")
    if age >= 50:
        contributors.append(f"Age Risk Group ({age} Years)")

    if contributors:
        summary_parts.append("Primary Contributing Factors: " + "; ".join(contributors) + ".")

    if overall_high:
        summary_parts.append("CLINICAL RECOMMENDATION FOR ASHA & PHC: Urgent referral to Primary Health Centre (PHC) Medical Officer required. Immediate physician evaluation, diagnostic confirmation, and medication review needed.")
    elif overall_mod:
        summary_parts.append("CLINICAL RECOMMENDATION FOR ASHA: Schedule follow-up vitals intake within 14 days. Provide dietary, sodium reduction, and physical activity counseling.")
    else:
        summary_parts.append("CLINICAL RECOMMENDATION FOR ASHA: Continue standard preventive health monitoring and annual screening.")

    clinical_summary = " ".join(summary_parts)

    return {
        "diabetes": {
            "score": diab_score,
            "level": diab_level,
            "factors": diab_factors
        },
        "hypertension": {
            "score": ht_score,
            "level": ht_level,
            "factors": ht_factors
        },
        "cardio": {
            "score": cvd_score,
            "level": cvd_level,
            "factors": cvd_factors
        },
        "clinical_summary": clinical_summary
    }

# -----------------------------------------------------------------------
# AUTH ENDPOINTS
# -----------------------------------------------------------------------
# -----------------------------------------------------------------------
# INTELLIGENT VOICE NLP EXTRACTION ENGINE
# -----------------------------------------------------------------------
class NLPExtractRequest(BaseModel):
    transcript: str

class NLPExtractResponse(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    systolic_bp: Optional[float] = None
    diastolic_bp: Optional[float] = None
    heart_rate: Optional[float] = None
    cholesterol: Optional[float] = None
    glucose: Optional[float] = None
    smoker: Optional[int] = None
    alcohol_use: Optional[int] = None
    physical_activity: Optional[str] = None
    family_history_present: Optional[int] = None
    family_history_details: Optional[str] = None
    known_condition_present: Optional[int] = None
    known_condition_details: Optional[str] = None
    village_name: Optional[str] = None
    confidence_scores: Dict[str, str] = {}

import re

@app.post("/nlp/extract-vitals", response_model=NLPExtractResponse)
def nlp_extract_vitals(req: NLPExtractRequest):
    t = req.transcript.strip()
    tl = t.lower()
    res = NLPExtractResponse()
    scores = {}
    # 1. Name Extraction
    hindi_stop_look = 'उम्र|साल|वर्ष|लिंग|पुरुष|महिला|गाँव|गांव|ग्राम|बीपी|ग्लूкоज|शुगर|लम्बाई|लंबाई|वजन|भार|धड़कन|पल्स|कोलेस्ट्रॉल|धूम्रपान|शराब|व्यायाम|डायबिटीज|बुखार'
    eng_stop_look = 'is|aged?|\\d+|years?|from|male|female|gender|sex|bp|blood|pressure|systolic|diastolic|weight|height|bmi|cholesterol|glucose|sugar|smoker|smoke|active|activity|family|history|village|gaav|gram|with|having'
    stop_look = f"{eng_stop_look}|{hindi_stop_look}"

    name_patterns = [
        # Pattern 1: Hindi "मरीज/रोगी का नाम / मेरे मरीज का नाम" with optional colons/equals/spaces
        r'(?:(?:मेरे|हमारे)\s+)?(?:रोगी|मरीज)\s+(?:का|की|के)\s+नाम\s*[:\s=|-]+\s*([^\d,.:;।\n]+?)(?=\s*(?:(?:\s+|^)(?:' + stop_look + r'))(?:\s+|$|[.,:;।])|[,.:;।]|$)',
        # Pattern 2: Hindi short form "नाम <NAME>" with optional colons/equals/spaces
        r'(?<![a-zA-Z\u0900-\u097F])नाम\s*[:\s=|-]+\s*([^\d,.:;।\n]+?)(?=\s*(?:(?:\s+|^)(?:' + stop_look + r'))(?:\s+|$|[.,:;।])|[,.:;।]|$)',
        # Pattern 3: English patterns "patient/full name is" / "my patient is" with optional colons/equals/spaces
        r'(?:(?:patient|full)?\s*name|my\s+patient\s+is|patient(?:\s+name)?\s+is|name\s+is|patient\s+is|this\s+is)\s*[:\s=|-]+\s*([^\d,.:;।\n]+?)(?=\s*(?:(?:\s+|^)(?:' + stop_look + r'))(?:\s+|$|[.,:;।])|[,.:;।]|$)',
        # Pattern 4: General fallback starting from the beginning
        r'^\s*([^\d,.:;।\n]+?)(?=\s*(?:(?:\s+|^)(?:' + stop_look + r'))(?:\s+|$|[.,:;।])|[,.:;।]|$)',
    ]
    for p in name_patterns:
        m = re.search(p, t, re.IGNORECASE | re.UNICODE)
        if m:
            candidate = m.group(1).strip().title()
            if candidate and len(candidate) > 2 and candidate.lower() not in ['my', 'the', 'a', 'patient', 'this', 'age', 'gender', 'male', 'female', 'from', 'name', 'full']:
                res.name = candidate
                scores['name'] = 'high'
                break

    # 2. Age Extraction (support "Age: 52", "Age - 52" or "52 years old")
    age_m = re.search(r'(?:aged?|age|उम्र)\s*[:\s=|-]+\s*(\d{1,3})', tl)
    if not age_m:
        age_m = re.search(r'(\d{1,3})\s*(?:years?\s*old|years?|yrs?|saal|age|साल|वर्ष)', tl)
    if age_m:
        val = int(age_m.group(1))
        if 1 <= val <= 120:
            res.age = val
            scores['age'] = 'high'

    # 3. Sex / Gender Extraction (support "Gender: Male", "Gender: Female")
    word_start = r'(?<![a-zA-Z\u0900-\u097F])'
    word_end = r'(?![a-zA-Z\u0900-\u097F])'
    
    gender_m = re.search(r'(?:gender|sex|लिंग)\s*[:\s=|-]+\s*(male|female|other|पुरुष|महिला|स्त्री|अन्य)', tl)
    if gender_m:
        g = gender_m.group(1)
        if g in ['male', 'पुरुष']:
            res.gender = "Male"
        elif g in ['female', 'महिला', 'स्त्री']:
            res.gender = "Female"
        else:
            res.gender = "Other"
        scores['gender'] = 'high'
    else:
        if re.search(word_start + r'(male|man|boy|purush|aadmi|gentleman|पुरुष)' + word_end, tl) and not re.search(word_start + r'female' + word_end, tl):
            res.gender = "Male"
            scores['gender'] = 'high'
        elif re.search(word_start + r'(female|woman|girl|mahila|aurat|lady|महिला|स्त्री)' + word_end, tl):
            res.gender = "Female"
            scores['gender'] = 'high'

    # 4. Height Extraction (cm or feet/inches, support "Height: 168 cm")
    h_cm_m = re.search(r'(?:height|lambi|lambaee|लम्बाई|ऊंचाई)\s*[:\s=|-]+\s*(\d{2,3})\s*(?:cm|centimeters?|centimetres?|सेंटीमीटर)?', tl)
    if not h_cm_m:
        h_cm_m = re.search(r'(?:height|lambi|lambaee|लम्बाई|ऊंचाई)\s*(?:is|=|:|है)?\s*(\d{2,3})\s*(?:cm|centimeters?|centimetres?|सेंटीमीटर)?', tl)
    if not h_cm_m:
        h_cm_m = re.search(r'(\d{3})\s*(?:cm|centimeters?|centimetres?|सेंटीमीटर)', tl)
    if h_cm_m:
        val = float(h_cm_m.group(1))
        if 50 <= val <= 250:
            res.height_cm = val
            scores['height_cm'] = 'high'

    # Feet/inches fallback e.g. 5 feet 6 inches
    ft_m = re.search(r'(\d)\s*(?:feet|ft|\')\s*(?:(\d{1,2})\s*(?:inches|in|\"))?', tl)
    if ft_m and not res.height_cm:
        ft = int(ft_m.group(1))
        inch = int(ft_m.group(2)) if ft_m.group(2) else 0
        total_inches = ft * 12 + inch
        res.height_cm = round(total_inches * 2.54, 1)
        scores['height_cm'] = 'high'

    # 5. Weight Extraction (support "Weight: 74 kg")
    w_m = re.search(r'(?:weight|wajan|vajan|वजन|भार)\s*[:\s=|-]+\s*(\d{2,3}(?:\.\d)?)\s*(?:kg|kilos?|kilograms?|किलो|किलोग्राम)?', tl)
    if not w_m:
        w_m = re.search(r'(?:weight|wajan|vajan|वजन|भार)\s*(?:is|=|:|है)?\s*(\d{2,3}(?:\.\d)?)\s*(?:kg|kilos?|kilograms?|किलो|किलोग्राम)?', tl)
    if not w_m:
        w_m = re.search(r'(\d{2,3}(?:\.\d)?)\s*(?:kg|kilos?|kilograms?|किलो|किलोग्राम)', tl)
    if w_m:
        val = float(w_m.group(1))
        if 10 <= val <= 300:
            res.weight_kg = val
            scores['weight_kg'] = 'high'

    # 6. Blood Pressure Extraction (support "Blood Pressure: 145/92 mmHg")
    bp_m = re.search(r'(?:blood\s*pressure|bp|b\.p\.|रक्तचाप|बीपी)\s*[:\s=|-]+\s*(\d{2,3})\s*(?:over|\/|by|and|और|बटे|बटा|बाय)\s*(\d{2,3})', tl)
    if not bp_m:
        bp_m = re.search(r'(?:blood\s*pressure|bp|b\.p\.|रक्तचाप|बीपी)\s*(?:is|=|:|है)?\s*(\d{2,3})\s*(?:over|\/|by|and|और|बटे|बटा|बाय)\s*(\d{2,3})', tl)
    if not bp_m:
        bp_m = re.search(r'(\d{2,3})\s*(?:over|\/|by|और|बटे|बटा|बाय)\s*(\d{2,3})\s*(?:mmhg|bp|बीपी|रक्तचाप)?', tl)
    if bp_m:
        sbp, dbp = float(bp_m.group(1)), float(bp_m.group(2))
        if 60 <= sbp <= 240 and 40 <= dbp <= 160:
            res.systolic_bp = sbp
            res.diastolic_bp = dbp
            scores['bp'] = 'high'

    # 7. Heart Rate Extraction (support "Pulse: 78")
    hr_m = re.search(r'(?:heart\s*rate|pulse|dhadkan|धड़कन|पल्स|हार्ट\s*रेट)\s*[:\s=|-]+\s*(\d{2,3})\s*(?:bpm|beats)?', tl)
    if not hr_m:
        hr_m = re.search(r'(?:heart\s*rate|pulse|dhadkan|धड़कन|पल्स|हार्ट\s*रेट)\s*(?:is|=|:|है)?\s*(\d{2,3})\s*(?:bpm|beats)?', tl)
    if not hr_m:
        hr_m = re.search(r'(\d{2,3})\s*(?:bpm|beats\s+per\s+minute|धड़कन|पल्स)', tl)
    if hr_m:
        val = float(hr_m.group(1))
        if 30 <= val <= 250:
            res.heart_rate = val
            scores['heart_rate'] = 'high'

    # 8. Glucose / Sugar Extraction (support "Glucose: 130 mg/dL")
    g_m = re.search(r'(?:glucose|sugar|blood\s*sugar|fasting\s*sugar|ग्लूकोज|ग्लूकोस|शुगर|फास्टिंग\s*शुगर)\s*[:\s=|-]+\s*(\d{2,3}(?:\.\d)?)', tl)
    if not g_m:
        g_m = re.search(r'(?:glucose|sugar|blood\s*sugar|fasting\s*sugar|ग्लूकोज|ग्लूकोस|शुगर|फास्टिंग\s*शुगर)\s*(?:is|=|:|है)?\s*(\d{2,3}(?:\.\d)?)', tl)
    if not g_m:
        g_m = re.search(r'(\d{2,3})\s*(?:mg\/dl|mgdl|ग्लूकोज|ग्लूकोस|शुगर)', tl)
    if g_m:
        val = float(g_m.group(1))
        if 40 <= val <= 600:
            res.glucose = val
            scores['glucose'] = 'high'

    # 9. Cholesterol Extraction (support "Cholesterol: 210")
    c_m = re.search(r'(?:cholesterol|fat|lipid|कोलेस्ट्रॉल|कोलेस्ट्रोल)\s*[:\s=|-]+\s*(\d{2,3}(?:\.\d)?)', tl)
    if not c_m:
        c_m = re.search(r'(?:cholesterol|fat|lipid|कोलेस्ट्रॉल|कोलेस्ट्रोल)\s*(?:is|=|:|है)?\s*(\d{2,3}(?:\.\d)?)', tl)
    if c_m:
        val = float(c_m.group(1))
        if 50 <= val <= 600:
            res.cholesterol = val
            scores['cholesterol'] = 'high'

    # 10. Smoker Extraction (support "Smoker: No" vs "Smoker: Yes")
    sm_val_m = re.search(r'(?:smoker|smoking|smoke|tobacco|beedi|cigarette|धूम्रपान|तंबाकू|बीड़ी|सिगरेट)\s*[:\s=|-]+\s*(yes|active|daily|1|no|none|0|नहीं|ना|हाँ|चालू)', tl)
    if sm_val_m:
        val = sm_val_m.group(1)
        if val in ['no', 'none', '0', 'नहीं', 'ना']:
            res.smoker = 0
        else:
            res.smoker = 1
        scores['smoker'] = 'high'
    else:
        if re.search(r'(does\s+not\s+smoke|non[\s-]?smoker|no\s+smoking|smoke\s+nahi|cigar\s+no|धूम्रपान\s*नहीं|तंबाकू\s*नहीं|बीड़ी\s*नहीं|गुटखा\s*नहीं)', tl):
            res.smoker = 0
            scores['smoker'] = 'high'
        elif re.search(word_start + r'(smokes?|smoker|tobacco|cigarette|bidi|gutkha|chain\s+smoker|धूम्रपान|तंबाकू|बीड़ी|सिगरेट|गुटखा|खैनी)' + word_end, tl):
            res.smoker = 1
            scores['smoker'] = 'high'

    # 11. Alcohol Extraction (support "Alcohol: No" vs "Alcohol: Yes")
    al_val_m = re.search(r'(?:alcohol|drinks?|drinking|sharab|daroo|दारू|शराब|alcohol\s+use)\s*[:\s=|-]+\s*(yes|active|weekly|1|no|none|0|नहीं|ना|हाँ|चालू)', tl)
    if al_val_m:
        val = al_val_m.group(1)
        if val in ['no', 'none', '0', 'नहीं', 'ना']:
            res.alcohol_use = 0
        else:
            res.alcohol_use = 1
        scores['alcohol_use'] = 'high'
    else:
        if re.search(r'(drinks?\s+alcohol|alcohol\s+use|consumes?\s+alcohol|sharab|drinks?\s+weekly|heavy\s+drinker|शराब|दारू|मदिरा)', tl):
            res.alcohol_use = 1
            scores['alcohol_use'] = 'high'
        elif re.search(r'(does\s+not\s+drink|no\s+alcohol|non[\s-]?drinker|sharab\s+nahi|शराब\s*नहीं|दारू\s*नहीं)', tl):
            res.alcohol_use = 0
            scores['alcohol_use'] = 'high'

    # 12. Physical Activity Extraction
    if re.search(word_start + r'(sedentary|low\s+activity|no\s+exercise|inactive|works\s+sitting|exercise\s+nahi)' + word_end, tl) or re.search(r'(व्यायाम\s*नहीं|काम\s*नहीं|सक्रिय\s*नहीं)', tl):
        res.physical_activity = "low"
        scores['physical_activity'] = 'high'
    elif re.search(word_start + r'(high\s+activity|intense|daily\s+gym|very\s+active|heavy\s+labor|kheti)' + word_end, tl) or re.search(r'(नियमित\s*व्यायाम|कड़ा\s*परिश्रम|ज्यादा\s*सक्रिय)', tl):
        res.physical_activity = "high"
        scores['physical_activity'] = 'high'
    elif re.search(word_start + r'(moderate|normal\s+walk|walks\s+daily|light\s+exercise)' + word_end, tl) or re.search(r'(हल्का\s*व्यायाम|मध्यम\s*व्यायाम|सक्रिय)', tl):
        res.physical_activity = "moderate"
        scores['physical_activity'] = 'high'

    # 13. Family History Extraction (support "Family History: Diabetes")
    fam_val_m = re.search(r'(?:family\s+history|family|history|परिवार|पारिवारिक)\s*[:\s=|-]+\s*(no|none|0|नहीं|ना)', tl)
    if fam_val_m:
        res.family_history_present = 0
        scores['family_history'] = 'high'
    else:
        fam_m = re.search(r'(?:father|mother|parent|family|brother|sister|grandfather|पिता|माता|दादा|दादी|परिवार)\s+(?:had|has|suffered\s+from|with|history\s+of|को|में|था|थी)\s+([a-zA-Z\s\u0900-\u097F]+?)(?:,|\.|$)', tl)
        if fam_m:
            res.family_history_present = 1
            res.family_history_details = fam_m.group(0).strip().title()
            scores['family_history'] = 'high'
        elif re.search(word_start + r'(family\s+history|hereditary)' + word_end, tl) or re.search(r'(परिवार\s*इतिहास|वंशानुगत)', tl):
            res.family_history_present = 1
            scores['family_history'] = 'high'

    # 14. Known Medical Condition Extraction (support "Known Condition: Diabetes")
    cond_val_m = re.search(r'(?:known\s+condition|condition|disease|बीमारी|बीमारी)\s*[:\s=|-]+\s*(no|none|0|नहीं|ना)', tl)
    if cond_val_m:
        res.known_condition_present = 0
        scores['known_condition'] = 'high'
    else:
        cond_m = re.search(r'(?:has\s+a\s+condition|diagnosed\s+with|suffering\s+from|patient\s+has|को|उन्हें|उसे|मरीज\s+को|इन्हें|बीमारी|बीमारी|condition)\s*[:\s=|-]*\s*([a-zA-Z\s\u0900-\u097F]+?)(?=\s*(?:since|since|and|$|[.।])|[.।]$|$)', tl)
        if cond_m:
            candidate_cond = cond_m.group(1).strip().title()
            if candidate_cond.lower() not in ['no', 'none', '0', 'नहीं', 'ना', 'yes', 'present']:
                res.known_condition_present = 1
                res.known_condition_details = candidate_cond
                scores['known_condition'] = 'high'
        else:
            # Check direct keywords
            hi_conds = ['डायबिटीज', 'मधुमेह', 'उच्च रक्तचाप', 'हाइपरटेंशन', 'थायराइड', 'अस्थमा', 'टीबी', 'हृदय रोग']
            for cond in hi_conds:
                if cond in tl:
                    res.known_condition_present = 1
                    res.known_condition_details = cond
                    scores['known_condition'] = 'high'
                    break

    # 15. Village Name Extraction
    v_m = re.search(r'(?:village(?:\s+name)?(?:\s+is)?|resident\s+of|gaav|gram|गांव|गाँव|ग्राम|रहने\s+वाला)\s+([a-zA-Z0-9\s\u0900-\u097F]{1,30}?)(?=\s*(?:' + stop_look + r')(?:\s+|$|[.,:;।])|[,.:;।]|$)', tl)
    if v_m:
        candidate = v_m.group(1).strip().title()
        if candidate.lower() not in ['the', 'a', 'in', 'is', 'area', 'name']:
            res.village_name = candidate
            scores['village_name'] = 'high'

    res.confidence_scores = scores
    return res

@app.get("/")
def health_check():
    return {
        "status": "online",
        "service": "Swastai Rural Health AI Platform v2.0",
        "models_loaded": {k: (v is not None) for k, v in models.items()}
    }

@app.post("/auth/signup", response_model=LoginResponse)
def signup(req: SignupRequest):
    conn = get_db()
    existing = conn.execute("SELECT id FROM users WHERE email = ?", (req.email,)).fetchone()
    if existing:
        conn.close()
        raise HTTPException(status_code=400, detail="Email already registered")

    valid_roles = ["admin", "dho", "phc", "asha"]
    if req.role not in valid_roles:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {valid_roles}")

    user_id = str(uuid.uuid4())
    hashed = hash_password(req.password)
    now = datetime.utcnow().isoformat()

    conn.execute(
        """INSERT INTO users (id, email, hashed_password, full_name, role,
           sub_district, village, facility_name, district, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (user_id, req.email, hashed, req.full_name, req.role,
         req.sub_district, req.village, req.facility_name, req.district, now)
    )
    conn.commit()
    conn.close()

    token = create_access_token({"sub": user_id, "role": req.role})
    return LoginResponse(
        access_token=token,
        token_type="bearer",
        user_id=user_id,
        role=req.role,
        full_name=req.full_name
    )

@app.post("/auth/login", response_model=LoginResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE email = ?", (form_data.username,)).fetchone()
    conn.close()
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )
    token = create_access_token({"sub": user["id"], "role": user["role"]})
    return LoginResponse(
        access_token=token,
        token_type="bearer",
        user_id=user["id"],
        role=user["role"],
        full_name=user["full_name"]
    )

@app.get("/users/me", response_model=UserProfile)
def get_me(current_user=Depends(get_current_user)):
    return UserProfile(**current_user)

# -----------------------------------------------------------------------
# PATIENT ENDPOINTS
# -----------------------------------------------------------------------
@app.post("/patients", response_model=PatientProfile)
@app.post("/patients/", response_model=PatientProfile)
def create_patient(req: PatientCreateRequest, current_user=Depends(get_current_user)):
    if current_user["role"] != "asha":
        raise HTTPException(status_code=403, detail="Only ASHA workers can create patients")

    # Compute BMI if height and weight provided
    bmi = None
    if req.height_cm and req.weight_kg:
        height_m = req.height_cm / 100.0
        bmi = round(req.weight_kg / (height_m ** 2), 1)
    bmi = bmi or 22.0  # fallback neutral value for prediction

    # Map physical_activity to hours/week
    activity_map = {"low": 0.5, "moderate": 3.0, "high": 7.0}
    physical_activity_hours = activity_map.get(req.physical_activity, 3.0)
    active = 1 if req.physical_activity in ["moderate", "high"] else 0
    salt_intake = 0  # not collected separately, default low
    cholesterol = req.cholesterol or 180.0  # default neutral

    # Run ML predictions
    try:
        predictions = run_predictions(
            gender=req.gender,
            age=req.age,
            height_cm=req.height_cm,
            weight_kg=req.weight_kg,
            bmi=bmi,
            systolic_bp=req.systolic_bp,
            diastolic_bp=req.diastolic_bp,
            heart_rate=req.heart_rate,
            cholesterol=cholesterol,
            glucose=req.glucose,
            smoker=req.smoker,
            alcohol_use=req.alcohol_use,
            physical_activity=req.physical_activity,
            family_history_present=req.family_history_present,
            known_condition_present=req.known_condition_present,
            known_condition_details=req.known_condition_details
        )
        is_offline = False
    except Exception as e:
        print(f"Prediction error: {e}")
        raise HTTPException(status_code=503, detail="Prediction service unavailable. Please try again.")

    levels = [predictions["diabetes"]["level"], predictions["hypertension"]["level"], predictions["cardio"]["level"]]
    overall = "HIGH" if "HIGH" in levels else "MODERATE" if "MODERATE" in levels else "LOW"
    requires_alert = "HIGH" in levels
    clinical_sum = predictions.get("clinical_summary", "")

    import json
    patient_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()

    conn = get_db()
    conn.execute("""
        INSERT INTO patients (
            id, asha_worker_id, name, age, gender, height_cm, weight_kg,
            systolic_bp, diastolic_bp, heart_rate, cholesterol, glucose, bmi,
            smoker, alcohol_use, physical_activity, family_history_present, family_history_details,
            known_condition_present, known_condition_details, village_name,
            overall_risk_level, requires_phc_alert,
            prediction_diabetes_score, prediction_diabetes_level, prediction_diabetes_factors,
            prediction_hypertension_score, prediction_hypertension_level, prediction_hypertension_factors,
            prediction_cardio_score, prediction_cardio_level, prediction_cardio_factors,
            prediction_clinical_summary, is_offline_prediction, created_at
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    """, (
        patient_id, current_user["id"], req.name, req.age, req.gender,
        req.height_cm, req.weight_kg,
        req.systolic_bp, req.diastolic_bp, req.heart_rate,
        req.cholesterol, req.glucose, bmi,
        req.smoker, req.alcohol_use, req.physical_activity,
        req.family_history_present, req.family_history_details,
        req.known_condition_present, req.known_condition_details,
        req.village_name,
        overall, 1 if requires_alert else 0,
        predictions["diabetes"]["score"], predictions["diabetes"]["level"],
        json.dumps(predictions["diabetes"]["factors"]),
        predictions["hypertension"]["score"], predictions["hypertension"]["level"],
        json.dumps(predictions["hypertension"]["factors"]),
        predictions["cardio"]["score"], predictions["cardio"]["level"],
        json.dumps(predictions["cardio"]["factors"]),
        clinical_sum, 0, now
    ))
    conn.commit()

    row = conn.execute("SELECT * FROM patients WHERE id = ?", (patient_id,)).fetchone()
    conn.close()

    # Log activity for Admin Dashboard monitoring
    try:
        log_activity(
            user_name=current_user["full_name"],
            role=current_user["role"],
            action="PATIENT_INTAKE",
            details=f"Registered patient {req.name} (Age {req.age}, BP {req.systolic_bp:.0f}/{req.diastolic_bp:.0f} mmHg, Glucose {req.glucose:.0f} mg/dL). Risk Level: {overall}.",
            category="ASHA_WORKER",
            user_id=current_user["id"]
        )
        log_activity(
            user_name="Swastai AI Engine",
            role="system",
            action="AI_MODEL_INFERENCE",
            details=f"Evaluated ML risks for {req.name}: Diabetes ({predictions['diabetes']['score']}% {predictions['diabetes']['level']}), CVD ({predictions['cardio']['score']}% {predictions['cardio']['level']}), Hypertension ({predictions['hypertension']['score']}% {predictions['hypertension']['level']}).",
            category="AI_INFERENCE",
            user_id="system-ml"
        )
    except Exception as e:
        print(f"Logging warning: {e}")

    return _row_to_profile(row, predictions)

@app.get("/patients", response_model=List[PatientSummary])
@app.get("/patients/", response_model=List[PatientSummary])
def list_patients(current_user=Depends(get_current_user)):
    conn = get_db()
    if current_user["role"] == "asha":
        rows = conn.execute(
            "SELECT * FROM patients WHERE asha_worker_id = ? ORDER BY created_at DESC",
            (current_user["id"],)
        ).fetchall()
    elif current_user["role"] in ["phc", "dho", "admin"]:
        rows = conn.execute("SELECT * FROM patients ORDER BY created_at DESC").fetchall()
    else:
        conn.close()
        raise HTTPException(status_code=403, detail="Access denied")
    conn.close()
    return [PatientSummary(
        id=r["id"], name=r["name"], age=r["age"], gender=r["gender"],
        overall_risk_level=r["overall_risk_level"],
        requires_phc_alert=bool(r["requires_phc_alert"]),
        created_at=r["created_at"],
        village_name=r["village_name"]
    ) for r in rows]

@app.get("/patients/{patient_id}", response_model=PatientProfile)
def get_patient(patient_id: str, current_user=Depends(get_current_user)):
    conn = get_db()
    row = conn.execute("SELECT * FROM patients WHERE id = ?", (patient_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Patient not found")
    if current_user["role"] == "asha" and row["asha_worker_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    import json
    predictions = {
        "diabetes": {"score": row["prediction_diabetes_score"], "level": row["prediction_diabetes_level"],
                     "factors": json.loads(row["prediction_diabetes_factors"] or "[]")},
        "hypertension": {"score": row["prediction_hypertension_score"], "level": row["prediction_hypertension_level"],
                         "factors": json.loads(row["prediction_hypertension_factors"] or "[]")},
        "cardio": {"score": row["prediction_cardio_score"], "level": row["prediction_cardio_level"],
                   "factors": json.loads(row["prediction_cardio_factors"] or "[]")},
        "clinical_summary": row["prediction_clinical_summary"] if ("prediction_clinical_summary" in row.keys() and row["prediction_clinical_summary"]) else None
    }
    return _row_to_profile(row, predictions)

@app.get("/dashboard/asha/stats")
def asha_stats(current_user=Depends(require_role(["asha"]))):
    conn = get_db()
    total = conn.execute("SELECT COUNT(*) FROM patients WHERE asha_worker_id = ?", (current_user["id"],)).fetchone()[0]
    high_risk = conn.execute(
        "SELECT COUNT(*) FROM patients WHERE asha_worker_id = ? AND overall_risk_level = 'HIGH'",
        (current_user["id"],)
    ).fetchone()[0]
    moderate_risk = conn.execute(
        "SELECT COUNT(*) FROM patients WHERE asha_worker_id = ? AND overall_risk_level = 'MODERATE'",
        (current_user["id"],)
    ).fetchone()[0]
    conn.close()
    return {"total_patients": total, "high_risk": high_risk, "moderate_risk": moderate_risk}

class ActivityLogItem(BaseModel):
    id: str
    timestamp: str
    user_id: Optional[str] = None
    user_name: str
    role: str
    action: str
    details: str
    category: str
    ip_address: Optional[str] = None

@app.get("/dashboard/admin/stats")
def admin_stats(current_user=Depends(require_role(["admin"]))):
    conn = get_db()
    total_patients = conn.execute("SELECT COUNT(*) FROM patients").fetchone()[0]
    total_users = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    high_risk = conn.execute("SELECT COUNT(*) FROM patients WHERE overall_risk_level = 'HIGH'").fetchone()[0]
    total_logs = conn.execute("SELECT COUNT(*) FROM activity_logs").fetchone()[0]
    conn.close()
    return {
        "total_patients": total_patients,
        "total_users": total_users,
        "high_risk_patients": high_risk,
        "total_logs": total_logs
    }

@app.get("/dashboard/admin/logs", response_model=List[ActivityLogItem])
def get_activity_logs(
    profile_filter: Optional[str] = None,
    limit: int = 100,
    current_user=Depends(require_role(["admin"]))
):
    conn = get_db()
    if profile_filter and profile_filter != "ALL":
        rows = conn.execute(
            """SELECT * FROM activity_logs 
               WHERE role = ? OR category = ?
               ORDER BY timestamp DESC LIMIT ?""",
            (profile_filter.lower(), profile_filter, limit)
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT ?",
            (limit,)
        ).fetchall()
    conn.close()
    return [ActivityLogItem(
        id=r["id"],
        timestamp=r["timestamp"],
        user_id=r["user_id"],
        user_name=r["user_name"],
        role=r["role"],
        action=r["action"],
        details=r["details"],
        category=r["category"],
        ip_address=r["ip_address"]
    ) for r in rows]

def _row_to_profile(row, predictions: dict) -> PatientProfile:
    summary_val = predictions.get("clinical_summary")
    if not summary_val and "prediction_clinical_summary" in row.keys():
        summary_val = row["prediction_clinical_summary"]
    return PatientProfile(
        id=row["id"],
        asha_worker_id=row["asha_worker_id"],
        name=row["name"],
        age=row["age"],
        gender=row["gender"],
        height_cm=row["height_cm"],
        weight_kg=row["weight_kg"],
        bmi=row["bmi"],
        systolic_bp=row["systolic_bp"],
        diastolic_bp=row["diastolic_bp"],
        heart_rate=row["heart_rate"],
        cholesterol=row["cholesterol"],
        glucose=row["glucose"],
        smoker=bool(row["smoker"]),
        alcohol_use=bool(row["alcohol_use"]),
        physical_activity=row["physical_activity"],
        family_history_present=bool(row["family_history_present"]),
        family_history_details=row["family_history_details"],
        known_condition_present=bool(row["known_condition_present"]),
        known_condition_details=row["known_condition_details"],
        village_name=row["village_name"],
        overall_risk_level=row["overall_risk_level"],
        requires_phc_alert=bool(row["requires_phc_alert"]),
        is_offline_prediction=bool(row["is_offline_prediction"]),
        clinical_summary=summary_val,
        predictions=predictions,
        created_at=row["created_at"]
    )

# -----------------------------------------------------------------------
# LEGACY ML ENDPOINTS (kept for compatibility)
# -----------------------------------------------------------------------
@app.post("/predict/comprehensive")
def predict_comprehensive_legacy(input_data: dict):
    """Legacy endpoint for offline fallback compatibility."""
    try:
        preds = run_predictions(
            gender="Female",
            age=input_data.get("age", 40),
            height_cm=None,
            weight_kg=None,
            bmi=input_data.get("bmi", 22.0),
            glucose=input_data.get("glucose", 90.0),
            systolic_bp=input_data.get("systolic_bp", 120.0),
            diastolic_bp=input_data.get("diastolic_bp", 80.0),
            heart_rate=None,
            cholesterol=input_data.get("cholesterol", 180.0),
            smoker=input_data.get("smoker", 0),
            alcohol_use=0,
            physical_activity="moderate" if input_data.get("active", 1) else "low",
            family_history_present=input_data.get("family_history", 0),
            known_condition_present=0
        )
        levels = [preds["diabetes"]["level"], preds["hypertension"]["level"], preds["cardio"]["level"]]
        overall = "HIGH" if "HIGH" in levels else "MODERATE" if "MODERATE" in levels else "LOW"
        return {
            "patient_id": input_data.get("patient_id"),
            "name": input_data.get("name"),
            "overall_risk_level": overall,
            "requires_phc_alert": "HIGH" in levels,
            "predictions": {
                "diabetes": {"disease": "Diabetes Mellitus", "risk_score": preds["diabetes"]["score"],
                             "risk_level": preds["diabetes"]["level"], "explainability_factors": preds["diabetes"]["factors"]},
                "hypertension": {"disease": "Hypertension", "risk_score": preds["hypertension"]["score"],
                                 "risk_level": preds["hypertension"]["level"], "explainability_factors": preds["hypertension"]["factors"]},
                "cardio": {"disease": "Cardiovascular Disease", "risk_score": preds["cardio"]["score"],
                           "risk_level": preds["cardio"]["level"], "explainability_factors": preds["cardio"]["factors"]}
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/diabetes", response_model=SinglePredictionOutput)
def predict_diabetes(inp: DiabetesInput):
    try:
        res = run_predictions(
            gender="Female",
            age=inp.age,
            height_cm=None,
            weight_kg=None,
            bmi=inp.bmi,
            systolic_bp=inp.blood_pressure,
            diastolic_bp=80.0,
            heart_rate=None,
            cholesterol=None,
            glucose=inp.glucose,
            smoker=0,
            alcohol_use=0,
            physical_activity="moderate",
            family_history_present=inp.family_history,
            known_condition_present=0
        )
        return SinglePredictionOutput(
            disease="Diabetes Mellitus",
            risk_score=res["diabetes"]["score"],
            risk_level=res["diabetes"]["level"],
            explainability_factors=res["diabetes"]["factors"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/hypertension", response_model=SinglePredictionOutput)
def predict_hypertension(inp: HypertensionInput):
    try:
        res = run_predictions(
            gender="Female",
            age=inp.age,
            height_cm=None,
            weight_kg=None,
            bmi=inp.bmi,
            systolic_bp=inp.systolic_bp,
            diastolic_bp=inp.diastolic_bp,
            heart_rate=None,
            cholesterol=None,
            glucose=80.0,
            smoker=inp.smoker,
            alcohol_use=0,
            physical_activity="moderate",
            family_history_present=0,
            known_condition_present=0
        )
        return SinglePredictionOutput(
            disease="Hypertension",
            risk_score=res["hypertension"]["score"],
            risk_level=res["hypertension"]["level"],
            explainability_factors=res["hypertension"]["factors"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/cardio", response_model=SinglePredictionOutput)
def predict_cardio(inp: CardioInput):
    try:
        res = run_predictions(
            gender="Female",
            age=inp.age,
            height_cm=None,
            weight_kg=None,
            bmi=22.0,
            systolic_bp=inp.systolic_bp,
            diastolic_bp=80.0,
            heart_rate=None,
            cholesterol=inp.cholesterol,
            glucose=inp.glucose,
            smoker=inp.smoker,
            alcohol_use=0,
            physical_activity="moderate" if inp.active else "low",
            family_history_present=0,
            known_condition_present=0
        )
        return SinglePredictionOutput(
            disease="Cardiovascular Disease",
            risk_score=res["cardio"]["score"],
            risk_level=res["cardio"]["level"],
            explainability_factors=res["cardio"]["factors"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


