import os
import joblib
import pandas as pd
import numpy as np

# Apply sklearn compatibility patch
import sklearn.compose._column_transformer
class DummyRemainderColsList(list):
    def __setstate__(self, state):
        if isinstance(state, dict): self.__dict__.update(state)
        elif isinstance(state, tuple) and len(state) == 2:
            self.extend(state[0]); self.__dict__.update(state[1])
sklearn.compose._column_transformer._RemainderColsList = DummyRemainderColsList

models_dir = r'c:\Users\rajun\Desktop\swastai\backend\models'

diabetes_obj = joblib.load(os.path.join(models_dir, 'diabetes_xgboost_final.pkl'))
cvd_model = joblib.load(os.path.join(models_dir, 'final_xgboost_cvd_model.pkl'))
ht_model = joblib.load(os.path.join(models_dir, 'hypertension_xgb_model.pkl'))

print("All 3 models loaded successfully!")
print("Diabetes keys:", diabetes_obj.keys() if isinstance(diabetes_obj, dict) else type(diabetes_obj))
print("CVD model type:", type(cvd_model))
print("Hypertension model type:", type(ht_model))

# Test High Risk Patient Input
age = 58
gender = 'Male'
bmi = 31.5
systolic_bp = 152.0
diastolic_bp = 96.0
glucose = 185.0
cholesterol = 245.0
smoker = 1
alcohol_use = 1
physical_activity = 'low'
family_history_present = 1
known_condition_present = 1

# 1. Diabetes Prediction
diab_model = diabetes_obj['model']
df_db = pd.DataFrame([{
    'gender': 'Male',
    'age': float(age),
    'smoking_history': 'current',
    'bmi': float(bmi),
    'blood_glucose_level': float(glucose)
}])
diab_prob = float(diab_model.predict_proba(df_db)[0][1])
print(f"Diabetes Risk: {diab_prob*100:.1f}% (High if >= 42%)")

# 2. CVD Prediction
gender_num = 2 if gender == 'Male' else 1
chol_cat = 3 if cholesterol >= 240 else (2 if cholesterol >= 200 else 1)
gluc_cat = 3 if glucose >= 126 else (2 if glucose >= 100 else 1)
active_num = 0 if physical_activity == 'low' else 1

df_cvd = pd.DataFrame([{
    'age': float(age),
    'bmi': float(bmi),
    'ap_hi': float(systolic_bp),
    'ap_lo': float(diastolic_bp),
    'gender': gender_num,
    'cholesterol': chol_cat,
    'gluc': gluc_cat,
    'smoke': smoker,
    'alco': alcohol_use,
    'active': active_num,
    'age_squared': float(age**2),
    'bmi_squared': float(bmi**2),
    'age_bp_interaction': float(age * systolic_bp)
}])
cvd_prob = float(cvd_model.predict_proba(df_cvd)[0][1])
print(f"CVD Risk: {cvd_prob*100:.1f}%")

# 3. Hypertension Prediction
if hasattr(ht_model, 'named_steps') and 'imputer' in ht_model.named_steps:
    imp = ht_model.named_steps['imputer']
    if not hasattr(imp, '_fill_dtype'):
        imp._fill_dtype = getattr(imp, '_fit_dtype', float)

df_ht = pd.DataFrame([{
    'male': 1,
    'age': float(age),
    'currentSmoker': smoker,
    'diabetes': 1 if glucose >= 126 else 0,
    'totChol': float(cholesterol),
    'sysBP': float(systolic_bp),
    'diaBP': float(diastolic_bp),
    'BMI': float(bmi),
    'heartRate': 82.0,
    'glucose': float(glucose)
}])
ht_prob = float(ht_model.predict_proba(df_ht)[0][1])
print(f"Hypertension Risk: {ht_prob*100:.1f}%")
