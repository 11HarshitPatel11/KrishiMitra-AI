"""
test_readiness.py
---------------------------------------------------------------------------
Step 24.24 (BLK-03 & BLK-09) Verification Suite:
FastAPI Liveness (/health), Readiness (/ready), and Lifecycle Cleanup
---------------------------------------------------------------------------
"""

import sys
import os
from unittest.mock import patch, MagicMock

# Ensure ml-service root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import Response, status
from app.main import app, health_check, readiness_check
from app.services.prediction_service import prediction_service
from app.services.disease_service import disease_service

passed = 0
failed = 0

def assert_test(condition, label, detail=""):
    global passed, failed
    if condition:
        print(f"  [PASS] {label}")
        passed += 1
    else:
        print(f"  [FAIL] {label}{f' ({detail})' if detail else ''}")
        failed += 1

print("==================================================")
print("Step 24.24 FastAPI Readiness & Liveness Test Suite")
print("==================================================")

# -----------------------------------------------------------------------------
# 1. Route Registration Verification
# -----------------------------------------------------------------------------
print("\n1. Route Registration in FastAPI App")
routes = {route.path: route for route in app.routes if hasattr(route, 'path')}
assert_test("/health" in routes, "Route '/health' is registered in FastAPI app")
assert_test("/ready" in routes, "Route '/ready' is registered in FastAPI app")
assert_test("GET" in routes["/health"].methods, "'/health' accepts GET requests")
assert_test("GET" in routes["/ready"].methods, "'/ready' accepts GET requests")

# -----------------------------------------------------------------------------
# 2. Fully Ready State (Both Models Loaded)
# -----------------------------------------------------------------------------
print("\n2. Both Models Loaded (Full Readiness)")
with patch.object(prediction_service, 'is_loaded', return_value=True), \
     patch.object(disease_service, 'is_loaded', return_value=True):
    resp = Response()
    body = readiness_check(resp)
    assert_test(resp.status_code == 200, "readiness_check returns HTTP 200 when all models are loaded")
    assert_test(body.get("status") == "ready", "Response status is 'ready'")
    assert_test(body.get("crop_model_loaded") is True, "crop_model_loaded is True")
    assert_test(body.get("disease_model_loaded") is True, "disease_model_loaded is True")

    h_body = health_check()
    assert_test(h_body.get("status") == "success", "Liveness health_check status is 'success'")
    assert_test(h_body.get("crop_model_loaded") is True, "Liveness reports crop_model_loaded True")
    assert_test(h_body.get("disease_model_loaded") is True, "Liveness reports disease_model_loaded True")

# -----------------------------------------------------------------------------
# 3. Crop Model Unloaded State
# -----------------------------------------------------------------------------
print("\n3. Crop Model Offline / Unloaded")
with patch.object(prediction_service, 'is_loaded', return_value=False), \
     patch.object(disease_service, 'is_loaded', return_value=True):
    resp = Response()
    body = readiness_check(resp)
    assert_test(resp.status_code == status.HTTP_503_SERVICE_UNAVAILABLE, "readiness_check returns HTTP 503 when Crop model is offline")
    assert_test(body.get("status") == "not_ready", "Response status is 'not_ready'")
    assert_test(body.get("crop_model_loaded") is False, "crop_model_loaded reports False")
    assert_test(body.get("disease_model_loaded") is True, "disease_model_loaded reports True")

    # Liveness remains 200 (container process is live, just not ready for traffic)
    h_body = health_check()
    assert_test(h_body.get("status") == "success", "Liveness /health remains success while unready")
    assert_test(h_body.get("crop_model_loaded") is False, "Liveness reflects crop_model_loaded False")

# -----------------------------------------------------------------------------
# 4. Disease Model Unloaded State
# -----------------------------------------------------------------------------
print("\n4. Disease Model Offline / Unloaded")
with patch.object(prediction_service, 'is_loaded', return_value=True), \
     patch.object(disease_service, 'is_loaded', return_value=False):
    resp = Response()
    body = readiness_check(resp)
    assert_test(resp.status_code == status.HTTP_503_SERVICE_UNAVAILABLE, "readiness_check returns HTTP 503 when Disease model is offline")
    assert_test(body.get("status") == "not_ready", "Response status is 'not_ready'")
    assert_test(body.get("crop_model_loaded") is True, "crop_model_loaded reports True")
    assert_test(body.get("disease_model_loaded") is False, "disease_model_loaded reports False")

# -----------------------------------------------------------------------------
# 5. Neither Model Loaded (Cold Start / Fatal Missing Artifacts)
# -----------------------------------------------------------------------------
print("\n5. Neither Model Loaded")
with patch.object(prediction_service, 'is_loaded', return_value=False), \
     patch.object(disease_service, 'is_loaded', return_value=False):
    resp = Response()
    body = readiness_check(resp)
    assert_test(resp.status_code == status.HTTP_503_SERVICE_UNAVAILABLE, "readiness_check returns HTTP 503 when both models offline")
    assert_test(body.get("status") == "not_ready", "Response status is 'not_ready'")
    assert_test(body.get("crop_model_loaded") is False, "crop_model_loaded reports False")
    assert_test(body.get("disease_model_loaded") is False, "disease_model_loaded reports False")

# -----------------------------------------------------------------------------
# 6. Lifecycle Resource Cleanup (BLK-09)
# -----------------------------------------------------------------------------
print("\n6. Lifecycle Cleanup Methods")
mock_rf = MagicMock()
mock_le = MagicMock()
prediction_service.model = mock_rf
prediction_service.label_encoder = mock_le
assert_test(prediction_service.is_loaded() is True, "Prediction service reports loaded with mocks")
prediction_service.unload_artifacts()
assert_test(prediction_service.is_loaded() is False, "Prediction service reports unloaded after unload_artifacts()")
assert_test(prediction_service.model is None, "Prediction model reference is cleared (None)")
assert_test(prediction_service.label_encoder is None, "Label encoder reference is cleared (None)")

mock_torch = MagicMock()
mock_names = {"0": "healthy"}
disease_service.model = mock_torch
disease_service.class_names_map = mock_names
assert_test(disease_service.is_loaded() is True, "Disease service reports loaded with mocks")
disease_service.unload_artifacts()
assert_test(disease_service.is_loaded() is False, "Disease service reports unloaded after unload_artifacts()")
assert_test(disease_service.model is None, "Disease model reference is cleared (None)")
assert_test(disease_service.class_names_map is None, "Class names reference is cleared (None)")

print("\n==================================================")
print(f"Results: {passed} PASSED, {failed} FAILED")
print("==================================================")

if failed > 0:
    sys.exit(1)
