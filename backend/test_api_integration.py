import sys
import os
import json
import sqlite3
import pandas as pd

# Add backend dir to sys.path
sys.path.insert(0, os.path.dirname(__file__))

from main import run_predictions, init_db, get_db, load_or_train_models

print("="*60)
print("TESTING SWASTHYASAARTHI MODEL INTEGRATION & CLINICAL EXPLAINABILITY")
print("="*60)

# Initialize DB and Load Models
init_db()
load_or_train_models()

# Test High Risk Patient Case
high_risk_patient = {
    'name': 'Ramesh Kumar',
    'age': 58,
    'gender': 'Male',
    'height_cm': 168.0,
    'weight_kg': 89.0,
    'bmi': 31.5,
    'systolic_bp': 156.0,
    'diastolic_bp': 98.0,
    'heart_rate': 88.0,
    'cholesterol': 255.0,
    'glucose': 192.0,
    'smoker': 1,
    'alcohol_use': 1,
    'physical_activity': 'low',
    'family_history_present': 1,
    'known_condition_present': 1,
    'known_condition_details': 'Hypertension'
}

preds = run_predictions(
    gender=high_risk_patient['gender'],
    age=high_risk_patient['age'],
    height_cm=high_risk_patient['height_cm'],
    weight_kg=high_risk_patient['weight_kg'],
    bmi=high_risk_patient['bmi'],
    systolic_bp=high_risk_patient['systolic_bp'],
    diastolic_bp=high_risk_patient['diastolic_bp'],
    heart_rate=high_risk_patient['heart_rate'],
    cholesterol=high_risk_patient['cholesterol'],
    glucose=high_risk_patient['glucose'],
    smoker=high_risk_patient['smoker'],
    alcohol_use=high_risk_patient['alcohol_use'],
    physical_activity=high_risk_patient['physical_activity'],
    family_history_present=high_risk_patient['family_history_present'],
    known_condition_present=high_risk_patient['known_condition_present'],
    known_condition_details=high_risk_patient['known_condition_details']
)

print("\n--- 1. DIABETES REPORT ---")
print(f"Score: {preds['diabetes']['score']}% | Level: {preds['diabetes']['level']}")
print("Contributing Factors:")
for f in preds['diabetes']['factors']:
    print(f"  • {f}")

print("\n--- 2. HYPERTENSION REPORT ---")
print(f"Score: {preds['hypertension']['score']}% | Level: {preds['hypertension']['level']}")
print("Contributing Factors:")
for f in preds['hypertension']['factors']:
    print(f"  • {f}")

print("\n--- 3. CARDIOVASCULAR DISEASE REPORT ---")
print(f"Score: {preds['cardio']['score']}% | Level: {preds['cardio']['level']}")
print("Contributing Factors:")
for f in preds['cardio']['factors']:
    print(f"  • {f}")

print("\n--- 4. CLINICAL EXPLAINABILITY SUMMARY ---")
print(preds['clinical_summary'])

print("\n" + "="*60)
print("TEST SUCCESSFUL!")
print("="*60)
