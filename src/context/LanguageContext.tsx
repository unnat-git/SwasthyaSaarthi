'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'hi' | 'bn';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Nav & Common
    app_title: 'Swastai Rural Health AI',
    role_asha: 'ASHA Worker',
    role_phc: 'PHC Medical Officer',
    role_dho: 'District Health Officer',
    role_admin: 'System Administrator',
    sign_in: 'Sign In',
    sign_out: 'Sign Out',
    get_started: 'Get Started',
    back_to_dashboard: 'Back to Dashboard',
    refresh: 'Refresh Data',
    search_placeholder: 'Search patients, villages, or vitals...',
    loading: 'Loading data...',
    actions: 'Actions',
    view_profile: 'View Profile & Risk Report',

    // Landing Page
    hero_badge: 'AI-Powered · Offline-First · Built for Rural India',
    hero_title: 'Early Disease Risk Prediction for Rural Healthcare',
    hero_desc: 'Swastai empowers ASHA workers, PHC staff, and District Officers to identify health risks early — even in remote areas.',
    what_we_detect: 'What We Detect',
    detect_desc: 'AI models trained on clinical data to flag risk early before symptoms worsen.',
    how_it_works: 'How It Works',
    how_it_works_sub: 'A simple, powerful workflow designed for field healthcare workers',

    // Auth Pages
    login_title: 'Sign In to Swastai',
    login_sub: 'Enter your email and password to access your role-based dashboard.',
    email: 'Email Address',
    password: 'Password',
    quick_fill: 'Quick Fill Demo Accounts:',
    dont_have_account: "Don't have an account?",
    register_now: 'Register now',
    signup_title: 'Create Swastai Account',

    // ASHA Dashboard & Intake
    asha_dashboard_title: 'ASHA Field Worker Dashboard',
    asha_dashboard_sub: 'Register patients, conduct vitals screening, and monitor high-risk alerts in your village.',
    register_new_patient: 'Register New Patient',
    voice_vitals_dictation: 'Voice Vitals Dictation',
    total_registered: 'Total Patients Registered',
    high_risk_alerts: 'High Risk Alerts Flagged',
    moderate_risk_cases: 'Moderate Risk Cases',
    patient_directory: 'Registered Patient Directory',
    intake_title: 'New Patient Intake & Health Risk Screening',
    intake_sub: 'Fill patient vitals and lifestyle details to run AI multi-disease risk assessment.',
    full_name: 'Full Name',
    age: 'Age (Years)',
    gender: 'Gender',
    male: 'Male',
    female: 'Female',
    village_name: 'Village Name',
    systolic_bp: 'Systolic BP (mmHg)',
    diastolic_bp: 'Diastolic BP (mmHg)',
    blood_glucose: 'Fasting Blood Glucose (mg/dL)',
    total_cholesterol: 'Total Cholesterol (mg/dL)',
    height_cm: 'Height (cm)',
    weight_kg: 'Weight (kg)',
    bmi: 'Body Mass Index (BMI)',
    smoking_status: 'Tobacco / Smoking Status',
    alcohol_status: 'Alcohol Consumption',
    physical_activity: 'Physical Activity Level',
    family_history: 'Family Medical History',
    known_condition: 'Known Pre-existing Condition',
    yes: 'Yes',
    no: 'No',
    low: 'Low',
    moderate: 'Moderate',
    high: 'High',
    submit_intake: 'Submit Intake & Generate AI Risk Report',

    // Intake Form — section tabs
    section_basic: 'Basic Info',
    section_vitals: 'Vitals',
    section_lab: 'Lab Values',
    section_lifestyle: 'Lifestyle',
    section_history: 'Medical History',

    // Intake Form — section headings
    section_basic_heading: 'Basic Information',
    section_vitals_heading: 'Physical Measurements & Vital Signs',
    section_lab_heading: 'Laboratory Measurements',
    section_lifestyle_heading: 'Lifestyle Information',
    section_history_heading: 'Medical History',

    // Intake Form — field labels
    full_name_label: 'Full Name',
    age_label: 'Age (years)',
    gender_label: 'Gender',
    village_label: 'Village Name',
    height_label: 'Height (cm)',
    weight_label: 'Weight (kg)',
    bp_systolic_label: 'Systolic BP (mmHg)',
    bp_diastolic_label: 'Diastolic BP (mmHg)',
    heart_rate_label: 'Heart Rate (bpm)',
    glucose_label: 'Fasting Glucose (mg/dL)',
    cholesterol_label: 'Total Cholesterol (mg/dL)',
    smoking_label: 'Smoking Status',
    alcohol_label: 'Alcohol Use',
    activity_label: 'Physical Activity Level',
    family_hist_label: 'Family History of Disease',
    describe_family_label: 'Describe the family history',
    known_cond_label: 'Known Medical Condition',
    describe_cond_label: 'Describe the condition',
    calc_bmi_label: 'Calculated BMI:',

    // Intake Form — select options
    select_gender: 'Select gender',
    opt_male: 'Male',
    opt_female: 'Female',
    opt_other: 'Other',
    opt_no_smoke: 'No — Does not smoke',
    opt_yes_smoke: 'Yes — Active smoker',
    opt_no_alcohol: 'No — Does not drink',
    opt_yes_alcohol: 'Yes — Consumes alcohol',
    opt_activity_low: 'Low — Mostly sedentary, little to no exercise',
    opt_activity_moderate: 'Moderate — Light activity 3–5 days/week',
    opt_activity_high: 'High — Intense exercise most days',
    opt_no_family_hist: 'No family history',
    opt_yes_family_hist: 'Yes — Family member(s) had a disease',
    opt_no_known_cond: 'No known condition',
    opt_yes_known_cond: 'Yes — Has a diagnosed condition',

    // Intake Form — buttons & navigation
    btn_previous: 'Previous',
    btn_next: 'Next',
    btn_submit: 'Save & Run Risk Assessment',
    btn_running: 'Running AI Assessment...',
    btn_clear_form: 'Clear Form',
    form_sections_label: 'Form Sections',

    // Voice Assistant UI
    voice_status_listening: '🔴 Listening… Speak clearly now',
    voice_status_filled: '✅ Form filled! Tap mic again to add more details',
    voice_status_idle: '🎙️ Tap mic and dictate patient details',
    voice_hint_listening: 'Say: "Patient Ramesh Kumar 45 years male, BP 140 over 90, glucose 130, smoker"',
    voice_hint_filled: 'Tap mic again to speak more details — they will be added to the form.',
    voice_hint_idle: 'Example: "My patient is Sunita Devi 42 years female, blood pressure 130 over 85, sugar 110"',
    voice_transcribed: 'Transcribed:',
    voice_test_prompt: '✨ Or test with a sample voice prompt (Click to auto-extract):',

    // PHC Dashboard
    phc_dashboard_title: 'PHC Medical Officer Referral Dashboard',
    phc_dashboard_sub: 'Urgent medical reviews and teleconsultation referrals for high-risk rural patients.',
    pending_phc_alerts: 'Pending PHC Alerts',
    phc_referrals_list: 'High-Risk PHC Referral List',

    // DHO Dashboard
    dho_dashboard_title: 'District Village Health Zonation Dashboard',
    dho_dashboard_sub: 'Categorized risk graph of villages across the district — Red Zone (Critical High Risk), Yellow Zone (Moderate Watchlist), and Green Zone (Healthy).',
    total_district_coverage: 'Total District Coverage',
    red_zone_villages: '🔴 Red Zone Villages',
    yellow_zone_villages: '🟡 Yellow Zone Villages',
    green_zone_villages: '🟢 Green Zone Villages',
    village_zonation_graph: 'Village Health Risk Zonation Graph',
    red_zone_label: '🔴 RED ZONE - Critical High Risk Alert',
    yellow_zone_label: '🟡 YELLOW ZONE - Moderate Risk Watchlist',
    green_zone_label: '🟢 GREEN ZONE - Low Risk / Healthy',
    priority_red_action: '⚠️ Priority Action: Dispatch Mobile Medical Unit & ASHA Screening Camp',
    priority_yellow_action: '⚡ Action: Schedule Bi-weekly Vitals Monitoring',
    priority_green_action: '✓ Status: Safe Routine Annual Health Screening',

    // Admin Dashboard & Audit Logs
    admin_dashboard_title: 'System Administration & Activity Audit Log Console',
    admin_dashboard_sub: 'Real-time audit trail monitoring all activity across ASHA Workers, PHC Doctors, DHO Officers, and AI Inference Engine.',
    system_users: 'System Users',
    patient_database: 'Patient Database',
    high_risk_cases: 'High Risk Cases',
    total_audit_trail: 'Total Audit Trail',
    activity_logs_title: 'Activity Logs by Dashboard Profile',
    all_logs: 'All Dashboard Logs',
    asha_logs: '👩‍⚕️ ASHA Worker Logs',
    phc_logs: '👨‍⚕️ PHC Doctor Logs',
    dho_logs: '🏛️ DHO Officer Logs',
    ai_logs: '🤖 AI Model Engine Logs',
    auth_logs: '🔐 Auth & Security Logs',

    // Patient Profile & Vitals
    patient_profile: 'Patient Profile & Clinical Assessment',
    basic_info: 'Basic Information',
    lifestyle: 'Lifestyle',
    vital_signs: 'Vital Signs & Measurements',
    medical_history: 'Medical History',
    lab_values: 'Laboratory Values',
    clinical_summary_title: 'Clinical Risk & Contributing Factor Breakdown Summary',
    disease_reports_title: 'Individual Disease Risk Assessment Reports',
    diabetes_report: 'Diabetes Mellitus Report',
    hypertension_report: 'Hypertension Report',
    cardio_report: 'Cardiovascular Disease Report',
    vitals_profile_risk: 'Vitals & Clinical Profile Risk',
    contributing_factors: 'Contributing Risk Factors',
    high_risk: 'High Risk',
    moderate_risk: 'Moderate Risk',
    low_risk: 'Low Risk',
    // OCR Scanner
    ocr_scanner_title: 'Prescription OCR Scanner',
    ocr_scanner_sub: 'Upload or take a photo of a prescription to automatically extract patient details and vitals.',
    ocr_dropzone_text: 'Drag & drop a prescription image here, or click to browse',
    ocr_camera_shortcut: 'Take Photo with Camera',
    ocr_extracted_text: 'Extracted Prescription Text',
    ocr_btn_autofill: 'Auto-Fill Form',
    ocr_btn_clear: 'Clear Scan',
    ocr_status_initializing: 'Initializing OCR Engine...',
    ocr_status_recognizing: 'Extracting text from prescription...',
    ocr_progress_label: 'Analyzing',
  },
  hi: {
    // Nav & Common
    app_title: 'स्वस्तई ग्रामीण स्वास्थ्य एआई',
    role_asha: 'आशा (ASHA) कार्यकर्ता',
    role_phc: 'PHC चिकित्सा अधिकारी',
    role_dho: 'जिला स्वास्थ्य अधिकारी (DHO)',
    role_admin: 'सिस्टम प्रशासक',
    sign_in: 'साइन इन करें',
    sign_out: 'साइन आउट करें',
    get_started: 'प्रारंभ करें',
    back_to_dashboard: 'डैशबोर्ड पर वापस जाएं',
    refresh: 'डेटा रिफ्रेश करें',
    search_placeholder: 'मरीज, गांव या वाइटल्स खोजें...',
    loading: 'डेटा लोड हो रहा है...',
    actions: 'कार्रवाई',
    view_profile: 'प्रोफाइल एवं रिपोर्ट देखें',

    // Landing Page
    hero_badge: 'एआई-संचालित · ऑफलाइन-फर्स्ट · ग्रामीण भारत के लिए निर्मित',
    hero_title: 'ग्रामीण स्वास्थ्य देखभाल के लिए शुरुआती बीमारी जोखिम पूर्वानुमान',
    hero_desc: 'स्वस्तई आशा कार्यकर्ताओं, PHC कर्मचारियों और जिला अधिकारियों को दूरदराज के क्षेत्रों में स्वास्थ्य जोखिमों की समय पर पहचान करने में सक्षम बनाता है।',
    what_we_detect: 'हम क्या जांचते हैं',
    detect_desc: 'लक्षण बिगड़ने से पहले जोखिम को चिह्नित करने के लिए क्लिनिकल डेटा पर प्रशिक्षित एआई मॉडल।',
    how_it_works: 'यह कैसे काम करता है',
    how_it_works_sub: 'मैदानी स्वास्थ्य कार्यकर्ताओं के लिए एक सरल और शक्तिशाली कार्यप्रवाह',

    // Auth Pages
    login_title: 'स्वस्तई में साइन इन करें',
    login_sub: 'अपनी भूमिका आधारित डैशबोर्ड तक पहुंचने के लिए अपना ईमेल और पासवर्ड दर्ज करें।',
    email: 'ईमेल पता',
    password: 'पासवर्ड',
    quick_fill: 'त्वरित डेमो खाते भरें:',
    dont_have_account: 'खाता नहीं है?',
    register_now: 'अभी पंजीकरण करें',
    signup_title: 'स्वस्तई खाता बनाएं',

    // ASHA Dashboard & Intake
    asha_dashboard_title: 'आशा (ASHA) फील्ड वर्कर डैशबोर्ड',
    asha_dashboard_sub: 'अपने गांव में मरीजों का पंजीकरण करें, वाइटल्स जांच करें और उच्च जोखिम वाले अलर्ट पर नजर रखें।',
    register_new_patient: 'नया मरीज पंजीकृत करें',
    voice_vitals_dictation: 'वॉइस वाइटल्स बोलकर भरें',
    total_registered: 'कुल पंजीकृत मरीज',
    high_risk_alerts: 'उच्च जोखिम अलर्ट',
    moderate_risk_cases: 'मध्यम जोखिम मामले',
    patient_directory: 'पंजीकृत मरीज निर्देशिका',
    intake_title: 'नया मरीज पंजीकरण एवं स्वास्थ्य जोखिम जांच',
    intake_sub: 'एआई बहु-रोग जोखिम मूल्यांकन चलाने के लिए मरीज के वाइटल्स और जीवनशैली विवरण भरें।',
    full_name: 'पूरा नाम',
    age: 'आयु (वर्ष)',
    gender: 'लिंग',
    male: 'पुरुष',
    female: 'महिला',
    village_name: 'गांव का नाम',
    systolic_bp: 'सिस्टोलिक रक्तचाप (mmHg)',
    diastolic_bp: 'डायस्टोलिक रक्तचाप (mmHg)',
    blood_glucose: 'फास्टिंग ब्लड ग्लूकोज (mg/dL)',
    total_cholesterol: 'कुल कोलेस्ट्रॉल (mg/dL)',
    height_cm: 'लंबाई (सेंटीमीटर)',
    weight_kg: 'वजन (किलोग्राम)',
    bmi: 'शरीर द्रव्यमान सूचकांक (BMI)',
    smoking_status: 'तंबाकू / धूम्रपान की स्थिति',
    alcohol_status: 'शराब का सेवन',
    physical_activity: 'शारीरिक गतिविधि का स्तर',
    family_history: 'पारिवारिक चिकित्सा इतिहास',
    known_condition: 'ज्ञात पूर्व स्थिति',
    yes: 'हां',
    no: 'नहीं',
    low: 'कम',
    moderate: 'मध्यम',
    high: 'उच्च',
    submit_intake: 'इंटेक जमा करें और एआई जोखिम रिपोर्ट बनाएं',

    // Intake Form — section tabs
    section_basic: 'मूल जानकारी',
    section_vitals: 'वाइटल्स',
    section_lab: 'लैब मान',
    section_lifestyle: 'जीवन शैली',
    section_history: 'चिकित्सा इतिहास',

    // Intake Form — section headings
    section_basic_heading: 'मूल जानकारी',
    section_vitals_heading: 'शारीरिक माप एवं महत्वपूर्ण वाइटल्स',
    section_lab_heading: 'प्रयोगशाला माप',
    section_lifestyle_heading: 'जीवन शैली की जानकारी',
    section_history_heading: 'चिकित्सा इतिहास',

    // Intake Form — field labels
    full_name_label: 'पूरा नाम',
    age_label: 'आयु (वर्ष)',
    gender_label: 'लिंग',
    village_label: 'गांव का नाम',
    height_label: 'लंबाई (सेमी)',
    weight_label: 'वजन (किलोग्राम)',
    bp_systolic_label: 'सिस्टोलिक रक्तचाप (mmHg)',
    bp_diastolic_label: 'डायस्टोलिक रक्तचाप (mmHg)',
    heart_rate_label: 'हृदय गति (bpm)',
    glucose_label: 'फास्टिंग ग्लूकोज (mg/dL)',
    cholesterol_label: 'कुल कोलेस्ट्रॉल (mg/dL)',
    smoking_label: 'धूम्रपान / तंबाकू',
    alcohol_label: 'शराब का सेवन',
    activity_label: 'शारीरिक गतिविधि स्तर',
    family_hist_label: 'पारिवारिक बीमारी का इतिहास',
    describe_family_label: 'पारिवारिक इतिहास बताएं',
    known_cond_label: 'ज्ञात चिकित्सा स्थिति',
    describe_cond_label: 'स्थिति का विवरण दें',
    calc_bmi_label: 'गणना किया गया BMI:',

    // Intake Form — select options
    select_gender: 'लिंग चुनें',
    opt_male: 'पुरुष',
    opt_female: 'महिला',
    opt_other: 'अन्य',
    opt_no_smoke: 'नहीं — धूम्रपान नहीं करते',
    opt_yes_smoke: 'हाँ — धूम्रपान करते हैं',
    opt_no_alcohol: 'नहीं — शराब नहीं पीते',
    opt_yes_alcohol: 'हाँ — शराब पीते हैं',
    opt_activity_low: 'कम — ज्यादातर निष्क्रिय, व्यायाम नहीं',
    opt_activity_moderate: 'मध्यम — हल्की गतिविधि 3-5 दिन/सप्ताह',
    opt_activity_high: 'अधिक — अधिकांश दिनों में कड़ा व्यायाम',
    opt_no_family_hist: 'कोई पारिवारिक इतिहास नहीं',
    opt_yes_family_hist: 'हाँ — परिवार के सदस्य को बीमारी थी',
    opt_no_known_cond: 'कोई ज्ञात स्थिति नहीं',
    opt_yes_known_cond: 'हाँ — निदान की गई स्थिति है',

    // Intake Form — buttons & navigation
    btn_previous: 'पिछला',
    btn_next: 'अगला',
    btn_submit: 'सहेजें और जोखिम मूल्यांकन करें',
    btn_running: 'एआई मूल्यांकन चल रहा है...',
    btn_clear_form: 'फॉर्म साफ करें',
    form_sections_label: 'फॉर्म अनुभाग',

    // Voice Assistant UI
    voice_status_listening: '🔴 सुन रहे हैं... कृपया स्पष्ट बोलें',
    voice_status_filled: '✅ फॉर्म भर गया है! और विवरण जोड़ने के लिए माइक पर दोबारा टैप करें',
    voice_status_idle: '🎙️ मरीज का विवरण बोलने के लिए माइक टैप करें',
    voice_hint_listening: 'बोलें: "मरीज रमेश कुमार 45 साल पुरुष, बीपी 145 और 90, ग्लूकोज 130, धूम्रपान"',
    voice_hint_filled: 'अधिक विवरण बोलने के लिए माइक पर फिर से टैप करें - उन्हें फॉर्म में जोड़ दिया जाएगा।',
    voice_hint_idle: 'उदाहरण: "रोगी सुनीता देवी 42 वर्ष महिला, रक्तचाप 130 और 85, शुगर 110"',
    voice_transcribed: 'बोला गया शब्द:',
    voice_test_prompt: '✨ या एक नमूना आवाज के साथ परीक्षण करें (स्वतः निकालने के लिए क्लिक करें):',

    // PHC Dashboard
    phc_dashboard_title: 'PHC चिकित्सा अधिकारी रेफरल डैशबोर्ड',
    phc_dashboard_sub: 'उच्च जोखिम वाले ग्रामीण मरीजों के लिए तत्काल चिकित्सा समीक्षा और टेलीकंसल्टेशन रेफरल।',
    pending_phc_alerts: 'लंबित PHC अलर्ट',
    phc_referrals_list: 'उच्च-जोखिम PHC रेफरल सूची',

    // DHO Dashboard
    dho_dashboard_title: 'जिला ग्राम स्वास्थ्य जोखिम क्षेत्र (Zonation) डैशबोर्ड',
    dho_dashboard_sub: 'जिले के गांवों का वर्गीकृत जोखिम ग्राफ — रेड ज़ोन (गंभीर उच्च जोखिम), येलो ज़ोन (मध्यम वॉचलिस्ट), और ग्रीन ज़ोन (स्वस्थ)।',
    total_district_coverage: 'कुल जिला कवरेज',
    red_zone_villages: '🔴 रेड ज़ोन गांव',
    yellow_zone_villages: '🟡 येलो ज़ोन गांव',
    green_zone_villages: '🟢 ग्रीन ज़ोन गांव',
    village_zonation_graph: 'ग्राम स्वास्थ्य जोखिम क्षेत्र (Zonation) ग्राफ',
    red_zone_label: '🔴 रेड ज़ोन - गंभीर उच्च जोखिम अलर्ट',
    yellow_zone_label: '🟡 येलो ज़ोन - मध्यम जोखिम वॉचलिस्ट',
    green_zone_label: '🟢 ग्रीन ज़ोन - कम जोखिम / स्वस्थ',
    priority_red_action: '⚠️ प्राथमिकता कार्रवाई: मोबाइल मेडिकल यूनिट एवं आशा स्क्रीनिंग कैंप भेजें',
    priority_yellow_action: '⚡ कार्रवाई: पाक्षिक वाइटल्स निगरानी का शेड्यूल बनाएं',
    priority_green_action: '✓ स्थिति: सुरक्षित नियमित वार्षिक स्वास्थ्य जांच',

    // Admin Dashboard & Audit Logs
    admin_dashboard_title: 'सिस्टम प्रशासन एवं गतिविधि ऑडिट लॉग कंसोल',
    admin_dashboard_sub: 'आशा कार्यकर्ताओं, PHC डॉक्टरों, DHO अधिकारियों और AI इंजन की सभी गतिविधियों का रियल-टाइम ऑडिट ट्रेल।',
    system_users: 'सिस्टम उपयोगकर्ता',
    patient_database: 'मरीज डेटाबेस',
    high_risk_cases: 'उच्च जोखिम मामले',
    total_audit_trail: 'कुल ऑडिट ट्रेल',
    activity_logs_title: 'डैशबोर्ड प्रोफाइल अनुसार गतिविधि लॉग',
    all_logs: 'सभी डैशबोर्ड लॉग',
    asha_logs: '👩‍⚕️ आशा वर्कर लॉग',
    phc_logs: '👨‍⚕️ PHC डॉक्टर लॉग',
    dho_logs: '🏛️ DHO अधिकारी लॉग',
    ai_logs: '🤖 एआई मॉडल इंजन लॉग',
    auth_logs: '🔐 सुरक्षा एवं लॉगिन लॉग',

    // Patient Profile & Vitals
    patient_profile: 'मरीज प्रोफाइल एवं क्लिनिकल मूल्यांकन',
    basic_info: 'मूल जानकारी',
    lifestyle: 'जीवन शैली',
    vital_signs: 'महत्वपूर्ण वाइटल्स एवं माप',
    medical_history: 'चिकित्सा इतिहास',
    lab_values: 'प्रयोगशाला मान',
    clinical_summary_title: 'नैदानिक ​​जोखिम एवं योगदान कारक विश्लेषण सारांश',
    disease_reports_title: 'व्यक्तिगत बीमारी जोखिम मूल्यांकन रिपोर्ट',
    diabetes_report: 'मधुमेह (Diabetes) रिपोर्ट',
    hypertension_report: 'उच्च रक्तचाप (Hypertension) रिपोर्ट',
    cardio_report: 'हृदय रोग (CVD) रिपोर्ट',
    vitals_profile_risk: 'वाइटल्स एवं क्लिनिकल प्रोफाइल जोखिम',
    contributing_factors: 'योगदान जोखिम कारक',
    high_risk: 'उच्च जोखिम',
    moderate_risk: 'मध्यम जोखिम',
    low_risk: 'कम जोखिम',
    // OCR Scanner
    ocr_scanner_title: 'प्रिस्क्रिप्शन ओसीआर (OCR) स्कैनर',
    ocr_scanner_sub: 'मरीज के विवरण और वाइटल्स को स्वचालित रूप से निकालने के लिए नुस्खे (प्रिस्क्रिप्शन) की तस्वीर अपलोड करें या खींचें।',
    ocr_dropzone_text: 'यहाँ प्रिस्क्रिप्शन इमेज ड्रैग करें या ब्राउज़ करने के लिए क्लिक करें',
    ocr_camera_shortcut: 'कैमरे से फोटो लें',
    ocr_extracted_text: 'निकाला गया प्रिस्क्रिप्शन टेक्स्ट',
    ocr_btn_autofill: 'फॉर्म स्वतः भरें',
    ocr_btn_clear: 'स्कैन साफ़ करें',
    ocr_status_initializing: 'ओसीआर (OCR) इंजन प्रारंभ हो रहा है...',
    ocr_status_recognizing: 'प्रिस्क्रिप्शन से टेक्स्ट निकाला जा रहा है...',
    ocr_progress_label: 'विश्लेषण किया जा रहा है',
  },
  bn: {
    // Nav & Common
    app_title: 'স্বস্তই গ্রামীণ স্বাস্থ্য এআই',
    role_asha: 'আশা (ASHA) কর্মী',
    role_phc: 'PHC মেডিকেল অফিসার',
    role_dho: 'জেলা স্বাস্থ্য কর্মকর্তা (DHO)',
    role_admin: 'সিস্টেম অ্যাডমিনিস্ট্রেটর',
    sign_in: 'সাইন ইন করুন',
    sign_out: 'সাইন আউট করুন',
    get_started: 'শুরু করুন',
    back_to_dashboard: 'ড্যাশবোর্ডে ফিরে যান',
    refresh: 'ডাটা রিফ্রেশ করুন',
    search_placeholder: 'রোগী, গ্রাম বা ভাইটাল খুঁজুন...',
    loading: 'ডাটা লোড হচ্ছে...',
    actions: 'পদক্ষেপ',
    view_profile: 'প্রোফাইল ও রিপোর্ট দেখুন',

    // Landing Page
    hero_badge: 'এআই-চালিত · অফলাইন-ফার্স্ট · গ্রামীণ ভারতের জন্য নির্মিত',
    hero_title: 'গ্রামীণ স্বাস্থ্যসেবার জন্য প্রাথমিক রোগ ঝুঁকি পূর্বাভাস',
    hero_desc: 'স্বস্তই আশা কর্মী, PHC কর্মী এবং জেলা কর্মকর্তাদের দুর্গম এলাকায় স্বাস্থ্যের ঝুঁকি সময়মতো চিহ্নিত করতে সাহায্য করে।',
    what_we_detect: 'আমরা যা সনাক্ত করি',
    detect_desc: 'লক্ষণ বাড়ার আগেই ঝুঁকি চিহ্নিত করতে চিকিৎসাগত তথ্যে প্রশিক্ষিত এআই মডেল।',
    how_it_works: 'এটি যেভাবে কাজ করে',
    how_it_works_sub: 'মাঠ পর্যায়ের স্বাস্থ্যকর্মীদের জন্য একটি সহজ ও শক্তিশালী কর্মপদ্ধতি',

    // Auth Pages
    login_title: 'স্বস্তই-এ সাইন ইন করুন',
    login_sub: 'আপনার ভূমিকা ভিত্তিক ড্যাশবোর্ড অ্যাক্সেস করতে আপনার ইমেল এবং পাসওয়ার্ড লিখুন।',
    email: 'ইমেল ঠিকানা',
    password: 'পাসওয়ার্ড',
    quick_fill: 'দ্রুত ডেমো অ্যাকাউন্ট:',
    dont_have_account: 'অ্যাকাউন্ট নেই?',
    register_now: 'এখনই নিবন্ধন করুন',
    signup_title: 'স্বস্তই অ্যাকাউন্ট তৈরি করুন',

    // ASHA Dashboard & Intake
    asha_dashboard_title: 'আশা (ASHA) ফিল্ড ওয়ার্কার ড্যাশবোর্ড',
    asha_dashboard_sub: 'আপনার গ্রামে রোগীদের নিবন্ধন করুন, ভাইটাল পরীক্ষা করুন এবং উচ্চ ঝুঁকিপূর্ণ অ্যালার্ট পর্যবেক্ষণ করুন।',
    register_new_patient: 'নতুন রোগী নিবন্ধন করুন',
    voice_vitals_dictation: 'ভয়েস ভাইটাল ডিকটেশন',
    total_registered: 'মোট নিবন্ধিত রোগী',
    high_risk_alerts: 'উচ্চ ঝুঁকি অ্যালার্ট',
    moderate_risk_cases: 'মাঝারি ঝুঁকি কেস',
    patient_directory: 'নিবন্ধিত রোগী ডিরেক্টরি',
    intake_title: 'নতুন রোগী নিবন্ধন এবং স্বাস্থ্য ঝুঁকি পরীক্ষা',
    intake_sub: 'এআই বহু-রোগ ঝুঁকি মূল্যায়ন চালাতে রোগীর ভাইটাল এবং জীবনযাত্রার বিবরণ লিখুন।',
    full_name: 'সম্পূর্ণ নাম',
    age: 'বয়স (বছর)',
    gender: 'লিঙ্গ',
    male: 'পুরুষ',
    female: 'মহিলা',
    village_name: 'গ্রামের নাম',
    systolic_bp: 'সিস্টোলিক রক্তচাপ (mmHg)',
    diastolic_bp: 'ডায়াস্টোলিক রক্তচাপ (mmHg)',
    blood_glucose: 'ফাস্টিং ব্লাড গ্লুকোজ (mg/dL)',
    total_cholesterol: 'মোট কোলেস্টেরল (mg/dL)',
    height_cm: 'উচ্চতা (সেমি)',
    weight_kg: 'ওজন (কেজি)',
    bmi: 'বডি মাস ইনডেক্স (BMI)',
    smoking_status: 'তামাক / ধূমপানের অবস্থা',
    alcohol_status: 'মদ্যপান',
    physical_activity: 'শারীরিক পরিশ্রমের মাত্রা',
    family_history: 'পারিবারিক চিকিৎসার ইতিহাস',
    known_condition: 'জানা পূর্বের অবস্থা',
    yes: 'হ্যাঁ',
    no: 'না',
    low: 'কম',
    moderate: 'মাঝারি',
    high: 'উচ্চ',
    submit_intake: 'জমা দিন এবং এআই ঝুঁকি রিপোর্ট তৈরি করুন',

    // PHC Dashboard
    phc_dashboard_title: 'PHC মেডিকেল অফিসার রেফারেল ড্যাশবোর্ড',
    phc_dashboard_sub: 'উচ্চ ঝুঁকিপূর্ণ গ্রামীণ রোগীদের জন্য জরুরি চিকিৎসা মূল্যায়ন এবং টেলিকনসাল্টেশন রেফারেল।',
    pending_phc_alerts: 'অপেক্ষমাণ PHC অ্যালার্ট',
    phc_referrals_list: 'উচ্চ-ঝুঁকিপূর্ণ PHC রেফারেল তালিকা',

    // DHO Dashboard
    dho_dashboard_title: 'জেলা গ্রাম স্বাস্থ্য ঝুঁকি জোন ড্যাশবোর্ড',
    dho_dashboard_sub: 'জেলার গ্রামগুলির শ্রেণীবদ্ধ ঝুঁকি গ্রাফ — রেড জোন (আশঙ্কাজনক উচ্চ ঝুঁকি), ইয়োলো জোন (মাঝারি ওয়াচলিস্ট), এবং গ্রিন জোন (সুস্থ)।',
    total_district_coverage: 'মোট জেলা কভারেজ',
    red_zone_villages: '🔴 রেড জোন গ্রাম',
    yellow_zone_villages: '🟡 ইয়োলো জোন গ্রাম',
    green_zone_villages: '🟢 গ্রিন জোন গ্রাম',
    village_zonation_graph: 'গ্রাম স্বাস্থ্য ঝুঁকি জোন গ্রাফ',
    red_zone_label: '🔴 রেড জোন - আশঙ্কাজনক উচ্চ ঝুঁকি অ্যালার্ট',
    yellow_zone_label: '🟡 ইয়োলো জোন - মাঝারি ঝুঁকি ওয়াচলিস্ট',
    green_zone_label: '🟢 গ্রিন জোন - কম ঝুঁকি / সুস্থ',
    priority_red_action: '⚠️ অগ্রাধিকার পদক্ষেপ: মোবাইল মেডিকেল ইউনিট এবং আশা স্ক্রিনিং ক্যাম্প পাঠান',
    priority_yellow_action: '⚡ পদক্ষেপ: পাক্ষিক ভাইটাল পরীক্ষার সময়সূচী নির্ধারণ করুন',
    priority_green_action: '✓ অবস্থা: নিরাপদ নিয়মিত বার্ষিক স্বাস্থ্য পরীক্ষা',

    // Admin Dashboard & Audit Logs
    admin_dashboard_title: 'সিস্টেম প্রশাসন এবং অ্যাক্টিভিটি অডিট লগ কনসোল',
    admin_dashboard_sub: 'আশা কর্মী, PHC ডাক্তার, DHO কর্মকর্তা এবং এআই ইঞ্জিনের সমস্ত কার্যকলাপের রিয়েল-টাইম অডিট ট্রেইল।',
    system_users: 'সিস্টেম ব্যবহারকারী',
    patient_database: 'রোগী ডাটাবেস',
    high_risk_cases: 'উচ্চ ঝুঁকি কেস',
    total_audit_trail: 'মোট অডিট ট্রেইল',
    activity_logs_title: 'ড্যাশবোর্ড প্রোফাইল অনুসারে অ্যাক্টিভিটি লগ',
    all_logs: 'সমস্ত ড্যাশবোর্ড লগ',
    asha_logs: '👩‍⚕️ আশা কর্মী লগ',
    phc_logs: '👨‍⚕️ PHC ডাক্তার লগ',
    dho_logs: '🏛️ DHO কর্মকর্তা লগ',
    ai_logs: '🤖 এআই মডেল ইঞ্জিন লগ',
    auth_logs: '🔐 সুরক্ষা এবং লগইন লগ',

    // Patient Profile & Vitals
    patient_profile: 'রোগীর প্রোফাইল ও ক্লিনিকাল মূল্যায়ন',
    basic_info: 'মৌলিক তথ্য',
    lifestyle: 'জীবনযাত্রা',
    vital_signs: 'গুরুত্বপূর্ণ ভাইটাল ও পরিমাপ',
    medical_history: 'চিকিৎসার ইতিহাস',
    lab_values: 'ল্যাবরেটরি মান',
    clinical_summary_title: 'ক্লিনিকাল ঝুঁকি এবং অবদানকারী কারণগুলির বিবরণ সারসংক্ষেপ',
    disease_reports_title: 'ব্যক্তিগত রোগ ঝুঁকি মূল্যায়ন রিপোর্ট',
    diabetes_report: 'ডায়াবেটিস রিপোর্ট',
    hypertension_report: 'উচ্চ রক্তচাপ রিপোর্ট',
    cardio_report: 'হৃদরোগ (CVD) রিপোর্ট',
    vitals_profile_risk: 'ভাইটাল ও ক্লিনিকাল প্রোফাইল ঝুঁকি',
    contributing_factors: 'অবদানকারী ঝুঁকি কারণসমূহ',
    high_risk: 'উচ্চ ঝুঁকি',
    moderate_risk: 'মাঝারি ঝুঁকি',
    low_risk: 'কম ঝুঁকি',
    // OCR Scanner
    ocr_scanner_title: 'প্রেসক্রিপশন ওসিআর (OCR) স্ক্যানার',
    ocr_scanner_sub: 'রোগীর বিবরণ এবং ভাইটালগুলি স্বয়ংক্রিয়ভাবে বের করতে প্রেসক্রিপশনের ছবি আপলোড করুন বা ছবি তুলুন।',
    ocr_dropzone_text: 'এখানে প্রেসক্রিপশন ইমেজ ড্র্যাগ করুন বা ব্রাউজ করতে ক্লিক করুন',
    ocr_camera_shortcut: 'ক্যামেরা দিয়ে ছবি তুলুন',
    ocr_extracted_text: 'উদ্ধৃত প্রেসক্রিপশন টেক্সট',
    ocr_btn_autofill: 'ফর্মটি স্বতঃ পূরণ করুন',
    ocr_btn_clear: 'স্ক্যান পরিষ্কার করুন',
    ocr_status_initializing: 'ওসিআর (OCR) ইঞ্জিন শুরু হচ্ছে...',
    ocr_status_recognizing: 'প্রেসক্রিপশন থেকে টেক্সট বের করা হচ্ছে...',
    ocr_progress_label: 'বিশ্লেষণ করা হচ্ছে',
  }
};

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  t: (key: string) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('swastai_lang') as Language;
    if (saved && (saved === 'en' || saved === 'hi' || saved === 'bn')) {
      setLangState(saved);
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('swastai_lang', newLang);
  };

  const t = (key: string): string => {
    return translations[lang]?.[key] || translations['en']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
