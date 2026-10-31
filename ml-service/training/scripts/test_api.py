import json
import os
import sys

current_dir = os.path.dirname(os.path.abspath(__file__))
# app_dir is the path to "ml-service"
app_dir = os.path.abspath(os.path.join(current_dir, '..', '..'))
sys.path.append(app_dir)

from fastapi.testclient import TestClient
from app.main import app

def test_inference_endpoints():
    with TestClient(app) as client:
        print("==================================================")
        print("Testing ML Service endpoints locally with FastAPI TestClient")
        print("==================================================\n")

        # 1. Test /health
        print("--- Testing GET /health ---")
        res = client.get("/health")
        print(f"Status: {res.status_code}")
        print(f"Response: {res.json()}\n")
        
        # 2. Test valid POST /api/v1/predict
        print("--- Testing valid POST /api/v1/predict ---")
        valid_payload = {
            "nitrogen": 90,
            "phosphorus": 42,
            "potassium": 43,
            "temperature": 20.8,
            "humidity": 82,
            "pH": 6.5,
            "rainfall": 203
        }
        res_valid = client.post("/api/v1/predict", json=valid_payload)
        print(f"Status: {res_valid.status_code}")
        print(f"Response: {res_valid.json()}\n")
        
        # 3. Test invalid: missing nitrogen
        print("--- Testing invalid: Missing Nitrogen ---")
        inv1 = dict(valid_payload)
        del inv1["nitrogen"]
        res_inv1 = client.post("/api/v1/predict", json=inv1)
        print(f"Status: {res_inv1.status_code}")
        print(f"Response: {res_inv1.json()}\n")
        
        # 4. Test invalid: negative nitrogen
        print("--- Testing invalid: Negative Nitrogen ---")
        inv2 = dict(valid_payload)
        inv2["nitrogen"] = -10
        res_inv2 = client.post("/api/v1/predict", json=inv2)
        print(f"Status: {res_inv2.status_code}")
        print(f"Response: {res_inv2.json()}\n")
        
        # 5. Test invalid: pH > 14
        print("--- Testing invalid: pH > 14 ---")
        inv3 = dict(valid_payload)
        inv3["pH"] = 15.2
        res_inv3 = client.post("/api/v1/predict", json=inv3)
        print(f"Status: {res_inv3.status_code}")
        print(f"Response: {res_inv3.json()}\n")
        
        # 6. Test invalid: string instead of numeric
        print("--- Testing invalid: String instead of numeric ---")
        inv4 = dict(valid_payload)
        inv4["temperature"] = "hot"
        res_inv4 = client.post("/api/v1/predict", json=inv4)
        print(f"Status: {res_inv4.status_code}")
        print(f"Response: {res_inv4.json()}\n")
        
        # 7. Test invalid: null value
        print("--- Testing invalid: Null value ---")
        inv5 = dict(valid_payload)
        inv5["humidity"] = None
        res_inv5 = client.post("/api/v1/predict", json=inv5)
        print(f"Status: {res_inv5.status_code}")
        print(f"Response: {res_inv5.json()}\n")

        print("[SUCCESS] FastAPI test suite completed.")

if __name__ == "__main__":
    test_inference_endpoints()
