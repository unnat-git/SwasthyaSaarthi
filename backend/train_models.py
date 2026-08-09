import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier

# Define models directory
MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
os.makedirs(MODELS_DIR, exist_ok=True)

def train_diabetes_model():
    np.random.seed(42)
    n_samples = 1500
    
    age = np.random.randint(18, 85, n_samples)
    bmi = np.random.normal(24, 5, n_samples).clip(15, 45)
    glucose = np.random.normal(110, 35, n_samples).clip(70, 300)
    blood_pressure = np.random.normal(120, 18, n_samples).clip(80, 200)
    family_history = np.random.choice([0, 1], n_samples, p=[0.7, 0.3])
    physical_activity_hours = np.random.uniform(0, 10, n_samples)
    
    # Calculate synthetic risk log-odds
    z = (-4.5 
         + 0.03 * (age - 40) 
         + 0.08 * (bmi - 23) 
         + 0.035 * (glucose - 100) 
         + 0.015 * (blood_pressure - 120) 
         + 0.8 * family_history 
         - 0.15 * physical_activity_hours)
    
    prob = 1 / (1 + np.exp(-z))
    target = (np.random.rand(n_samples) < prob).astype(int)
    
    X = pd.DataFrame({
        "age": age,
        "bmi": bmi,
        "glucose": glucose,
        "blood_pressure": blood_pressure,
        "family_history": family_history,
        "physical_activity_hours": physical_activity_hours
    })
    
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X, target)
    
    file_path = os.path.join(MODELS_DIR, "diabetes_model.pkl")
    joblib.dump(model, file_path)
    print(f"Saved {file_path}")

def train_hypertension_model():
    np.random.seed(43)
    n_samples = 1500
    
    age = np.random.randint(18, 85, n_samples)
    systolic_bp = np.random.normal(125, 20, n_samples).clip(90, 210)
    diastolic_bp = np.random.normal(82, 12, n_samples).clip(60, 130)
    bmi = np.random.normal(24, 5, n_samples).clip(15, 45)
    salt_intake_high = np.random.choice([0, 1], n_samples, p=[0.6, 0.4])
    smoker = np.random.choice([0, 1], n_samples, p=[0.75, 0.25])
    
    z = (-5.0 
         + 0.035 * (age - 35) 
         + 0.045 * (systolic_bp - 120) 
         + 0.04 * (diastolic_bp - 80) 
         + 0.05 * (bmi - 23) 
         + 0.6 * salt_intake_high 
         + 0.7 * smoker)
    
    prob = 1 / (1 + np.exp(-z))
    target = (np.random.rand(n_samples) < prob).astype(int)
    
    X = pd.DataFrame({
        "age": age,
        "systolic_bp": systolic_bp,
        "diastolic_bp": diastolic_bp,
        "bmi": bmi,
        "salt_intake_high": salt_intake_high,
        "smoker": smoker
    })
    
    model = RandomForestClassifier(n_estimators=100, random_state=43)
    model.fit(X, target)
    
    file_path = os.path.join(MODELS_DIR, "hypertension_model.pkl")
    joblib.dump(model, file_path)
    print(f"Saved {file_path}")

def train_cardio_model():
    np.random.seed(44)
    n_samples = 1500
    
    age = np.random.randint(18, 85, n_samples)
    systolic_bp = np.random.normal(128, 22, n_samples).clip(90, 210)
    cholesterol = np.random.normal(200, 40, n_samples).clip(120, 360)
    smoker = np.random.choice([0, 1], n_samples, p=[0.75, 0.25])
    active = np.random.choice([0, 1], n_samples, p=[0.4, 0.6])
    glucose = np.random.normal(110, 35, n_samples).clip(70, 300)
    
    z = (-5.2 
         + 0.04 * (age - 40) 
         + 0.035 * (systolic_bp - 120) 
         + 0.02 * (cholesterol - 190) 
         + 0.8 * smoker 
         - 0.5 * active 
         + 0.015 * (glucose - 100))
    
    prob = 1 / (1 + np.exp(-z))
    target = (np.random.rand(n_samples) < prob).astype(int)
    
    X = pd.DataFrame({
        "age": age,
        "systolic_bp": systolic_bp,
        "cholesterol": cholesterol,
        "smoker": smoker,
        "active": active,
        "glucose": glucose
    })
    
    model = RandomForestClassifier(n_estimators=100, random_state=44)
    model.fit(X, target)
    
    file_path = os.path.join(MODELS_DIR, "cardio_model.pkl")
    joblib.dump(model, file_path)
    print(f"Saved {file_path}")

if __name__ == "__main__":
    train_diabetes_model()
    train_hypertension_model()
    train_cardio_model()
    print("All models successfully trained and serialized.")
