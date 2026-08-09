# Swastai – Rural Health AI Platform
### Comprehensive Project Report

---

> **Project Name:** Swastai Rural Health AI (Swastya Saarthi)
> **Version:** 2.0.0
> **Type:** Full-Stack PWA (Progressive Web App) with AI/ML Backend
> **Domain:** Digital Public Health · Rural Healthcare Technology · Preventive Medicine
> **Target Users:** ASHA Workers, PHC Medical Officers, District Health Officers (DHOs), System Admins

---

## 1. Project Overview

**Swastai** (styled as *Swastya Saarthi* on the UI) is an AI-powered, offline-first rural healthcare platform built for the Indian public health system. It enables community health workers (ASHA workers), Primary Health Centre (PHC) staff, and District Health Officers to conduct early disease risk screening using machine learning — even in areas with no internet connectivity.

The platform addresses a critical healthcare gap: remote villages where symptoms go undetected until it is too late. Swastai enables point-of-care risk assessment for **Diabetes Mellitus**, **Cardiovascular Disease (CVD)**, and **Hypertension** using only basic vitals that any field worker can collect.

---

## 2. Tech Stack

### 2.1 Frontend

| Technology | Version | Purpose |
|---|---|---|
| **Next.js** | 14.2.5 | App framework (App Router, SSR/CSR) |
| **React** | 18.3.1 | UI component library |
| **TypeScript** | 5.4.5 | Type-safe codebase |
| **Tailwind CSS** | 3.4.4 | Utility-first styling |
| **Framer Motion** | 11.2.10 | Animations & transitions |
| **Lucide React** | 0.395.0 | Icon system |
| **clsx** | 2.1.1 | Conditional className merging |
| **tailwind-merge** | 2.3.0 | Tailwind class conflict resolution |
| **Dexie.js** | 4.0.8 | IndexedDB wrapper for offline storage |
| **dexie-react-hooks** | 1.1.7 | Reactive IndexedDB queries in React |
| **Google Material Symbols** | (CDN) | Extended icon set for health UI |

### 2.2 Backend

| Technology | Version | Purpose |
|---|---|---|
| **FastAPI** | ≥ 0.100.0 | Python REST API framework |
| **Uvicorn** | ≥ 0.22.0 | ASGI server |
| **Pydantic** | ≥ 2.0.0 | Data validation & API schemas |
| **SQLite** | (stdlib) | Lightweight embedded SQL database |
| **python-jose** | ≥ 3.3.0 | JWT token signing/verification |
| **passlib[bcrypt]** | ≥ 1.7.4 | Password hashing (pbkdf2_sha256) |
| **python-multipart** | ≥ 0.0.6 | OAuth2 form data parsing |

### 2.3 Machine Learning

| Technology | Version | Purpose |
|---|---|---|
| **scikit-learn** | ≥ 1.3.0 | ML model training, pipelines |
| **XGBoost** | (via pkl) | Primary prediction models |
| **NumPy** | ≥ 1.24.0 | Numerical computations |
| **Pandas** | ≥ 2.0.0 | Feature engineering, DataFrames |
| **Joblib** | ≥ 1.3.0 | Model serialization/deserialization |

### 2.4 Infrastructure & Tooling

| Technology | Purpose |
|---|---|
| **Node.js / npm** | Frontend package management |
| **PostCSS / Autoprefixer** | CSS processing pipeline |
| **Windows Batch Script** (`start_all.bat`) | One-command local startup |
| **SQLite DB** (`swastai.db`) | Local persistent database file |

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND (Next.js 14)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │  ASHA    │  │   PHC    │  │   DHO    │  │    Admin     │   │
│  │Dashboard │  │Dashboard │  │Dashboard │  │  Dashboard   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Shared Components: ChatbotDrawer · OfflineSyncBanner ·   │  │
│  │  TeleconsultationView · VoiceVitalsInput · PHCAlertBanner  │  │
│  └────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐                        │
│  │ Context: LanguageContext (EN/HI/BN)  │                        │
│  └──────────────────────────────────────┘                        │
│  ┌──────────────────────────────────────┐                        │
│  │ Lib: api.ts · auth.ts · db.ts ·      │                        │
│  │      offlineQueue.ts (localStorage)  │                        │
│  └──────────────────────────────────────┘                        │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP REST API (localhost:8008)
┌───────────────────────────▼─────────────────────────────────────┐
│                   BACKEND (FastAPI + SQLite)                     │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────────────────┐  │
│  │  Auth API  │  │ Patient API  │  │  Dashboard Stats API    │  │
│  │  /auth/*   │  │ /patients/*  │  │ /dashboard/asha/stats   │  │
│  └────────────┘  └──────────────┘  │ /dashboard/admin/stats  │  │
│  ┌────────────────────────────┐     │ /dashboard/admin/logs   │  │
│  │  NLP Voice Extraction API  │     └─────────────────────────┘  │
│  │  POST /nlp/extract-vitals  │                                  │
│  └────────────────────────────┘                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              ML PREDICTION ENGINE                          │  │
│  │  Diabetes XGBoost · CVD XGBoost · Hypertension XGBoost    │  │
│  │  + Explainability Factor Generator + Clinical Summary Gen  │  │
│  └────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                SQLite Database (swastai.db)                 │  │
│  │  Tables: users · patients · activity_logs                  │  │
│  └────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Role-Based User System

The platform implements a **4-tier role-based access control (RBAC)** system:

| Role | Description | Access Scope |
|---|---|---|
| **ASHA Worker** (`asha`) | Community health field worker | Own patients only; intake form; voice dictation |
| **PHC Medical Officer** (`phc`) | Primary Health Centre doctor | All patients; PHC alerts; teleconsultation view |
| **District Health Officer** (`dho`) | District-level administrator | All patients; village risk zonation map; district analytics |
| **System Admin** (`admin`) | Platform superuser | System stats; user registry; full activity logs |

**Demo Accounts** are pre-seeded in the database:
- `asha@swastai.gov.in` / `asha123`
- `phc@swastai.gov.in` / `phc123`
- `dho@swastai.gov.in` / `dho123`
- `admin@swastai.gov.in` / `admin123`

---

## 5. Core Features

### 5.1 AI Multi-Disease Risk Prediction Engine

The heart of the platform — runs three simultaneous XGBoost models:

#### Disease Models

| Disease | Model File | Key Input Features |
|---|---|---|
| **Diabetes Mellitus** | `diabetes_xgboost_final.pkl` | gender, age, smoking_history, BMI, blood_glucose_level |
| **Cardiovascular Disease** | `final_xgboost_cvd_model.pkl` | age, BMI, systolic_bp, diastolic_bp, gender, cholesterol_category, glucose_category, smoking, alcohol, activity, age²,  BMI², age×BP interaction |
| **Hypertension** | `hypertension_xgb_model.pkl` | gender(male flag), age, smoker, diabetes_flag, total cholesterol, systolic_bp, diastolic_bp, BMI, heart_rate, glucose |

#### Output per Prediction
- **Risk Score:** 0–100% probability
- **Risk Level:** `LOW` / `MODERATE` / `HIGH`
- **Explainability Factors:** Clinically annotated list of contributing risk indicators
- **Clinical Summary:** Auto-generated ASHA/PHC-targeted recommendation text

#### Overall Risk Algorithm
```
overall_risk = "HIGH"     if any model returns HIGH
             = "MODERATE" if any model returns MODERATE
             = "LOW"       if all models return LOW

PHC Alert Triggered = overall_risk == "HIGH"
```

#### Fallback Mechanism
If a model fails to load, the engine falls back to rule-based regression formulas (clinical thresholds-based scoring). Legacy models (`cardio_model.pkl`, `diabetes_model.pkl`, `hypertension_model.pkl`) are also available as secondary fallbacks.

---

### 5.2 Offline-First Architecture

One of the most critical features for rural deployment:

#### Offline Queue (localStorage)
- File: [`offlineQueue.ts`](file:///c:/Users/rajun/Desktop/swastai/src/lib/offlineQueue.ts)
- When backend is unreachable, patient intake forms are **saved locally** in `localStorage` under the key `swastai_offline_queue`
- Each offline record includes a **client-side risk estimate** computed using a rule-based scoring function (BP, glucose, BMI, age, smoking thresholds)
- When connectivity is restored, records are **automatically synced** to the server in batch

#### IndexedDB (Dexie.js)
- File: [`db.ts`](file:///c:/Users/rajun/Desktop/swastai/src/lib/db.ts)
- Full patient records and PHC alerts are stored in `RuralHealthDB_v2` IndexedDB
- Supports offline viewing of previously fetched patient data
- Tables: `patients`, `phcAlerts`

#### Offline Sync Banner
- File: [`OfflineSyncBanner.tsx`](file:///c:/Users/rajun/Desktop/swastai/src/components/OfflineSyncBanner.tsx)
- Persistent UI indicator showing:
  - **Offline mode** (red banner with wifi-off icon)
  - **Pending sync count** (how many forms are queued locally)
  - **"Sync Now"** manual trigger button
  - **Auto-sync toast** on successful upload
- Polls every 5 seconds via `setInterval` and listens to `window.online/offline` events
- **Fully multilingual**: shows messages in English, Hindi (`ऑफ़लाइन मोड`), and Bengali (`অফলাইন মোড`)

---

### 5.3 Voice Vitals Dictation (NLP Engine)

A dual-layer NLP system allowing ASHA workers to speak patient vitals instead of typing:

#### Frontend (Browser Web Speech API)
- File: [`VoiceVitalsInput.tsx`](file:///c:/Users/rajun/Desktop/swastai/src/components/VoiceVitalsInput.tsx)
- Uses `window.SpeechRecognition` / `window.webkitSpeechRecognition`
- Extracts: age, glucose, blood pressure, BMI, cholesterol, smoking status, salt intake
- Client-side regex pattern matching for instant feedback

#### Backend NLP Endpoint (Rule-Based NLP)
- Endpoint: `POST /nlp/extract-vitals`
- File: [`main.py`](file:///c:/Users/rajun/Desktop/swastai/backend/main.py) (lines 714–1378)
- Handles **15 vital fields** including: name, age, gender, height, weight, BP (systolic/diastolic), heart rate, glucose, cholesterol, smoking, alcohol, physical activity, family history, known conditions, village name
- Supports **Indian English speech patterns** (`en-IN`), Hindi-English code-mixed text (e.g., `sharab`, `bidi`, `kheti`, `gaav`, `saal`, `mahila`)
- Returns `confidence_scores` for each extracted field
- Feet/inches → cm automatic conversion

---

### 5.4 ASHA Worker Dashboard

- File: [`/dashboard/asha/page.tsx`](file:///c:/Users/rajun/Desktop/swastai/src/app/dashboard/asha/page.tsx)
- **Stats Cards:** Total patients registered, High risk alerts flagged, Moderate risk cases
- **Patient Directory Table:** Searchable, filterable by risk level
- **Risk Badge System:** Color-coded HIGH (red) / MODERATE (amber) / LOW (green)
- **PHC Alert Flag:** Shows which patients have been escalated to PHC
- **Voice Vitals Button:** One-tap to open voice dictation interface
- **Offline sync banner** integrated

### 5.5 Patient Intake Form

- File: [`/dashboard/asha/intake/page.tsx`](file:///c:/Users/rajun/Desktop/swastai/src/app/dashboard/asha/intake/page.tsx)
- Collects 15+ clinical fields:
  - Demographics: Name, Age, Gender, Village
  - Vitals: Systolic BP, Diastolic BP, Heart Rate
  - Lab Values: Fasting Glucose, Total Cholesterol
  - Anthropometrics: Height (cm), Weight (kg) → BMI auto-calculated
  - Lifestyle: Smoking status, Alcohol use, Physical activity level
  - History: Family history (text), Known pre-existing conditions (text)
- **Auto BMI calculation** from height and weight
- **Offline submission fallback** with risk estimation
- Triggers AI prediction on successful server submission

---

### 5.6 PHC Medical Officer Dashboard

- File: [`/dashboard/phc/page.tsx`](file:///c:/Users/rajun/Desktop/swastai/src/app/dashboard/phc/page.tsx)
- Views all patients across sub-district
- Integrated **Teleconsultation View** component
- PHC Alert management for high-risk cases

### 5.7 Teleconsultation View

- File: [`TeleconsultationView.tsx`](file:///c:/Users/rajun/Desktop/swastai/src/components/TeleconsultationView.tsx)
- Doctor directory with specialty, hospital, distance, languages spoken
- Available specialists: General Medicine, Cardiology, Endocrinology (Diabetes), Community Health
- Support for Video & Audio / Audio-Only consultation modes
- Doctor languages: Hindi, English, Bengali, Telugu
- Scheduling and appointment booking UI

---

### 5.8 District Health Officer (DHO) Dashboard

- File: [`/dashboard/dho/page.tsx`](file:///c:/Users/rajun/Desktop/swastai/src/app/dashboard/dho/page.tsx)
- **Village Risk Zonation Map:**
  - Aggregates all patient data by village
  - Assigns **RED / YELLOW / GREEN** zone classification
  - RED Zone: >25% high-risk patients
  - YELLOW Zone: 10–25% high-risk patients
  - GREEN Zone: <10% high-risk patients
- **District-wide patient table** with search and zone filters
- Stacked bar charts showing risk distribution per village (inline CSS bars)
- **Mobile Medical Unit dispatch** functionality for red zones
- Fallback seed villages for demo visualization (Rampur, Chapra East, Bishunpur, etc.)

---

### 5.9 System Admin Dashboard

- File: [`/dashboard/admin/page.tsx`](file:///c:/Users/rajun/Desktop/swastai/src/app/dashboard/admin/page.tsx)
- **System Health Stats:** Total patients, total users, high-risk count, total activity logs
- **Full Activity Log Monitor:**
  - Real-time log table with user, role, action, timestamp, IP address
  - Filter tabs: ALL / ASHA Worker / PHC Doctor / DHO Officer / AI Inference / Auth & Security
  - Full-text search across user name, action, details, role
- **Activity Categories tracked:**
  - `PATIENT_INTAKE`, `AI_MODEL_INFERENCE`, `PHC_ALERT_REVIEW`
  - `DISTRICT_ZONATION_UPDATE`, `VOICE_VITALS_NLP`
  - `MOBILE_MEDICAL_DISPATCH`, `USER_LOGIN`, `PATIENT_DISCHARGE_REVIEW`

---

### 5.10 Multilingual Support (i18n)

- File: [`LanguageContext.tsx`](file:///c:/Users/rajun/Desktop/swastai/src/context/LanguageContext.tsx)
- Supports **3 languages** across full UI:
  - 🇬🇧 English (`en`)
  - 🇮🇳 Hindi (`hi`) — Devanagari script
  - 🇧🇩 Bengali (`bn`) — Bengali script
- **Chatbot Drawer** additionally supports Tamil (`ta`) and Telugu (`te`)
- Language switch persisted via React context
- Translation keys cover: navigation, auth, all dashboard sections, intake form fields, offline sync messages, risk labels, recommendations

---

### 5.11 Multilingual Triage Chatbot

- File: [`ChatbotDrawer.tsx`](file:///c:/Users/rajun/Desktop/swastai/src/components/ChatbotDrawer.tsx)
- Floating bottom-right drawer chatbot
- **5 language support:** English, Hindi, Tamil, Telugu, Bengali
- Symptom-based triage and PHC protocol guidance
- Pre-filled suggestion chips in each language (e.g., BP triage, glucose signs, offline sync questions)
- Localized greeting, placeholder, and title per language
- Rule-based response engine with clinical health knowledge

---

### 5.12 PHC Alert Banner

- File: [`PHCAlertBanner.tsx`](file:///c:/Users/rajun/Desktop/swastai/src/components/PHCAlertBanner.tsx)
- Real-time high-risk patient alert banner for PHC dashboards
- Shows patient name, village, vital readings, risk score
- Actionable: Acknowledge, Schedule, Dispatch options

---

### 5.13 Authentication System

- **JWT-based authentication** using `python-jose` (HS256 algorithm)
- Token expiry: **24 hours**
- Password hashing: `pbkdf2_sha256` via `passlib`
- OAuth2 password flow (`OAuth2PasswordBearer`)
- **Role-enforced route guards** on both frontend (`auth.ts`) and backend (`require_role()` dependency)
- Auth stored in browser `localStorage` and parsed by [`auth.ts`](file:///c:/Users/rajun/Desktop/swastai/src/lib/auth.ts)
- Frontend auto-redirect based on role (`getDashboardRoute()`)

---

## 6. API Endpoints Reference

### Auth Endpoints
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/auth/signup` | Register new user | No |
| `POST` | `/auth/login` | Login, returns JWT | No |
| `GET` | `/users/me` | Get current user profile | Yes (any role) |

### Patient Endpoints
| Method | Endpoint | Description | Role Required |
|---|---|---|---|
| `POST` | `/patients/` | Create patient + run AI prediction | `asha` |
| `GET` | `/patients/` | List patients (scoped by role) | Any authenticated |
| `GET` | `/patients/{id}` | Get patient full profile + predictions | Any authenticated |

### Dashboard Endpoints
| Method | Endpoint | Description | Role Required |
|---|---|---|---|
| `GET` | `/dashboard/asha/stats` | ASHA stats (total, high, moderate) | `asha` |
| `GET` | `/dashboard/admin/stats` | System-wide stats | `admin` |
| `GET` | `/dashboard/admin/logs` | Activity log stream (filterable) | `admin` |

### AI / NLP Endpoints
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/nlp/extract-vitals` | Extract vitals from free-text/voice | No |
| `POST` | `/predict/comprehensive` | Legacy multi-disease prediction | No |
| `GET` | `/` | Health check + model status | No |

---

## 7. Database Schema

**Database:** SQLite — `backend/swastai.db`

### `users` table
| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | UUID |
| email | TEXT UNIQUE | Login identifier |
| hashed_password | TEXT | pbkdf2_sha256 |
| full_name | TEXT | Display name |
| role | TEXT | `admin`, `dho`, `phc`, `asha` |
| sub_district | TEXT | For ASHA/PHC |
| village | TEXT | For ASHA |
| facility_name | TEXT | For PHC |
| district | TEXT | For DHO |
| created_at | TEXT | ISO 8601 |

### `patients` table
| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | UUID |
| asha_worker_id | TEXT FK | → users |
| name, age, gender | | Demographics |
| height_cm, weight_kg, bmi | REAL | Anthropometrics |
| systolic_bp, diastolic_bp, heart_rate | REAL | Vitals |
| cholesterol, glucose | REAL | Lab values |
| smoker, alcohol_use | INTEGER | Boolean flags |
| physical_activity | TEXT | `low`/`moderate`/`high` |
| family_history_present | INTEGER | |
| family_history_details | TEXT | Free text |
| known_condition_present | INTEGER | |
| known_condition_details | TEXT | Free text |
| village_name | TEXT | |
| overall_risk_level | TEXT | `HIGH`/`MODERATE`/`LOW` |
| requires_phc_alert | INTEGER | |
| prediction_diabetes_score | REAL | 0–100 |
| prediction_diabetes_level | TEXT | |
| prediction_diabetes_factors | TEXT | JSON array |
| prediction_hypertension_score | REAL | |
| prediction_hypertension_level | TEXT | |
| prediction_hypertension_factors | TEXT | JSON array |
| prediction_cardio_score | REAL | |
| prediction_cardio_level | TEXT | |
| prediction_cardio_factors | TEXT | JSON array |
| prediction_clinical_summary | TEXT | Auto-generated |
| is_offline_prediction | INTEGER | |
| created_at | TEXT | ISO 8601 |

### `activity_logs` table
| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | UUID |
| timestamp | TEXT | ISO 8601 |
| user_id | TEXT | Nullable (system events) |
| user_name | TEXT | Display name |
| role | TEXT | User role or "system" |
| action | TEXT | Event type code |
| details | TEXT | Human-readable log message |
| category | TEXT | Log category |
| ip_address | TEXT | |

---

## 8. ML Model Files

| File | Algorithm | Disease | Size |
|---|---|---|---|
| `diabetes_xgboost_final.pkl` | XGBoost (primary) | Diabetes Mellitus | ~389 KB |
| `final_xgboost_cvd_model.pkl` | XGBoost (primary) | Cardiovascular Disease | ~669 KB |
| `hypertension_xgb_model.pkl` | XGBoost (primary) | Hypertension | ~361 KB |
| `diabetes_model.pkl` | sklearn Pipeline (fallback) | Diabetes | ~948 KB |
| `hypertension_model.pkl` | sklearn Pipeline (fallback) | Hypertension | ~1.5 MB |
| `cardio_model.pkl` | sklearn Pipeline (fallback) | CVD | ~1.0 MB |

All models are loaded at server startup (`@app.on_event("startup")`). Primary XGBoost models are loaded first; sklearn pipelines serve as fallbacks if XGBoost models fail.

A custom **sklearn compatibility patch** (`DummyRemainderColsList`) is applied at startup to handle `_RemainderColsList` deserialization issues with cross-version pickled models.

---

## 9. Frontend File Structure

```
src/
├── app/
│   ├── page.tsx                    # Landing page (role-redirect aware)
│   ├── layout.tsx                  # Root layout
│   ├── globals.css                 # Global styles
│   ├── auth/
│   │   ├── login/page.tsx          # Login with demo account quick-fill
│   │   └── signup/page.tsx         # Role-based registration form
│   ├── dashboard/
│   │   ├── asha/
│   │   │   ├── page.tsx            # ASHA Worker Dashboard
│   │   │   └── intake/page.tsx     # Patient Intake Form
│   │   ├── phc/
│   │   │   └── page.tsx            # PHC Medical Officer Dashboard
│   │   ├── dho/
│   │   │   └── page.tsx            # District Health Officer Dashboard
│   │   └── admin/
│   │       └── page.tsx            # System Admin Dashboard
│   └── patients/                   # Patient profile pages
├── components/
│   ├── ASHAWorkerDashboard.tsx      # ASHA reusable dashboard component
│   ├── DHODashboard.tsx             # DHO reusable dashboard component
│   ├── ChatbotDrawer.tsx            # Multilingual triage chatbot
│   ├── OfflineSyncBanner.tsx        # Offline status & sync UI
│   ├── PHCAlertBanner.tsx           # High-risk alert display
│   ├── TeleconsultationView.tsx     # Doctor booking / teleconsult UI
│   ├── VoiceVitalsInput.tsx         # Browser voice input + parsing
│   └── GlobalLanguageHeader.tsx     # Language switcher header
├── context/
│   └── LanguageContext.tsx          # i18n context (EN/HI/BN + more)
└── lib/
    ├── api.ts                       # Typed API client functions
    ├── auth.ts                      # Auth token management + route helpers
    ├── db.ts                        # Dexie IndexedDB schema & instance
    └── offlineQueue.ts              # localStorage offline queue manager
```

---

## 10. Backend File Structure

```
backend/
├── main.py                          # FastAPI app (1380 lines)
│   ├── Config & DB setup
│   ├── ML model loading
│   ├── Auth helpers (JWT, bcrypt)
│   ├── Pydantic schemas
│   ├── Prediction helpers & explainability engine
│   ├── NLP voice extraction engine
│   ├── REST API endpoints
│   └── Activity logging
├── models/
│   ├── diabetes_xgboost_final.pkl
│   ├── final_xgboost_cvd_model.pkl
│   ├── hypertension_xgb_model.pkl
│   ├── diabetes_model.pkl
│   ├── hypertension_model.pkl
│   └── cardio_model.pkl
├── train_models.py                  # Model training script
├── inspect_models.py                # Model inspection utility
├── test_api.py                      # API unit tests
├── test_api_integration.py          # Integration tests
├── test_swasthya_predictions.py     # ML prediction tests
├── requirements.txt                 # Python dependencies
└── swastai.db                       # SQLite database file
```

---

## 11. Key Design Decisions

| Decision | Rationale |
|---|---|
| **Next.js App Router** | Enables per-role SSR/CSR pages, seamless routing, and PWA compatibility |
| **SQLite over PostgreSQL** | Zero-config, file-based DB; ideal for local deployment in low-resource government settings |
| **Offline-First with localStorage + IndexedDB** | Internet connectivity is unreliable in rural India; data must never be lost |
| **XGBoost over neural networks** | XGBoost offers high accuracy on tabular clinical data with fast inference and small model size |
| **Rule-based NLP over LLM** | LLM APIs require internet + cost; regex NLP works offline, handles Hinglish patterns, zero latency |
| **Dual-language chatbot** | 5-language chatbot covers Hindi belt, Tamil Nadu, Andhra Pradesh, West Bengal |
| **RBAC at API level** | `require_role()` FastAPI dependency enforces access control server-side, not just on UI |
| **Activity logging** | Full audit trail enables Admin accountability and system monitoring |
| **Demo seed accounts** | Reduces onboarding friction for evaluators and hackathon judges |

---

## 12. Startup

The platform can be started with a single Windows batch script:

```bat
start_all.bat
```

This launches:
1. **Backend:** `uvicorn main:app --reload --port 8008` (inside `backend/`)
2. **Frontend:** `npm run dev` (inside project root, typically on port 3000)

Frontend API calls target: `http://localhost:8008`

---

## 13. Testing

| File | Type | Coverage |
|---|---|---|
| `test_api.py` | Unit tests | API endpoint responses |
| `test_api_integration.py` | Integration tests | Auth + patient creation flow |
| `test_swasthya_predictions.py` | ML tests | Prediction output validation |

---

## 14. Summary of Innovations

1. **Offline-First AI:** Full patient intake + risk estimation works without internet — unique for rural health tech
2. **Triple-Disease Concurrent AI Screening:** Simultaneous Diabetes + CVD + Hypertension prediction in one form submission
3. **Voice-to-Vitals NLP:** ASHA workers with low literacy can speak patient data in Hindi/English mix
4. **Village Risk Zonation:** DHO gets RED/YELLOW/GREEN zone maps aggregated from real patient data
5. **Explainable AI:** Every prediction comes with clinician-level explanatory factors, not just a score
6. **Role-Aware Architecture:** Four completely distinct UIs (ASHA/PHC/DHO/Admin) sharing a unified backend
7. **Auto Sync Queue:** Queued offline submissions silently upload when connectivity returns
8. **Full Audit Trail:** Admin sees AI model inference events, ASHA logins, PHC alert reviews — all logged

---

*Report generated: August 2026 | Platform: Swastai Rural Health AI v2.0.0*
