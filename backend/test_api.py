from fastapi.testclient import TestClient
from main import app, load_or_train_models

def test_endpoints():
    load_or_train_models()
    client = TestClient(app)

    print("Testing / health check...")
    res = client.get("/")
    assert res.status_code == 200
    print("Health check response:", res.json())

    print("\nTesting /predict/diabetes...")
    res = client.post("/predict/diabetes", json={
        "age": 52,
        "bmi": 29.5,
        "glucose": 155,
        "blood_pressure": 140,
        "family_history": 1,
        "physical_activity_hours": 1.0
    })
    assert res.status_code == 200
    print("Diabetes prediction:", res.json())

    print("\nTesting /predict/hypertension...")
    res = client.post("/predict/hypertension", json={
        "age": 60,
        "systolic_bp": 165,
        "diastolic_bp": 98,
        "bmi": 30.0,
        "salt_intake_high": 1,
        "smoker": 1
    })
    assert res.status_code == 200
    print("Hypertension prediction:", res.json())

    print("\nTesting /predict/cardio...")
    res = client.post("/predict/cardio", json={
        "age": 58,
        "systolic_bp": 150,
        "cholesterol": 240,
        "smoker": 1,
        "active": 0,
        "glucose": 160
    })
    assert res.status_code == 200
    print("Cardio prediction:", res.json())

    print("\nTesting /predict/comprehensive...")
    res = client.post("/predict/comprehensive", json={
        "patient_id": "PAT-9991",
        "name": "Test Patient",
        "age": 75,
        "gender": "Female",
        "bmi": 38.0,
        "glucose": 260.0,
        "systolic_bp": 190.0,
        "diastolic_bp": 115.0,
        "cholesterol": 310.0,
        "family_history": 1,
        "physical_activity_hours": 0.0,
        "salt_intake_high": 1,
        "smoker": 1,
        "active": 0
    })
    assert res.status_code == 200
    data = res.json()
    print("Comprehensive prediction:", data)
    
    # Check requires_phc_alert consistency
    has_high = any(p["risk_level"] == "HIGH" for p in data["predictions"].values())
    assert data["requires_phc_alert"] == has_high
    print("\nALL BACKEND API TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_endpoints()
