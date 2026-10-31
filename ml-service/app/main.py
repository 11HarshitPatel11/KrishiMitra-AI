import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Response, status
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from app.cors_config import get_allowed_origins, ALLOWED_METHODS, ALLOWED_HEADERS
from app.api.predict import router as predict_router
from app.api.disease import router as disease_router
from app.services.prediction_service import prediction_service
from app.services.disease_service import disease_service

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load ML artifacts strictly on startup
    try:
        prediction_service.load_artifacts()
        disease_service.load_artifacts()
        logging.info("ML Artifacts uniquely loaded into memory.")
    except Exception as e:
        logging.error(f"Failed to cleanly load ML artifacts: {e}")
        # Proceed running but /predict endpoint will dynamically catch this state and return 503
    yield
    # Unload resources strictly on shutdown (Step 24.24 / BLK-09)
    logging.info("Shutting down ML Service: unloading model artifacts.")
    prediction_service.unload_artifacts()
    disease_service.unload_artifacts()

app = FastAPI(
    title="Crop Recommendation ML Service",
    description="API for crop recommendation and disease detection models",
    version="0.1.0",
    lifespan=lifespan
)

# ------------------------------------------------------------------------------
# CORS Configuration (Step 24.10 / GAP-14 Hardening)
# ------------------------------------------------------------------------------
# The ML service is an internal microservice called server-to-server by the
# Node.js Express backend. Browser clients communicate through Node.js.
#
# Allowed origins are configured via ML_ALLOWED_ORIGINS (or fallback ALLOWED_ORIGINS).
# In development: defaults to local Vite frontend ("http://localhost:3000,http://127.0.0.1:3000").
# In production: defaults to an empty list (strict server-to-server isolation with
# zero browser access unless explicitly configured). Wildcards are strictly rejected.
# ------------------------------------------------------------------------------
allowed_origins = get_allowed_origins()

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=ALLOWED_METHODS,
    allow_headers=ALLOWED_HEADERS,
)

@app.get("/health")
def health_check():
    """
    Liveness probe endpoint.
    Returns HTTP 200 indicating the Uvicorn/FastAPI process is running and responsive.
    """
    return {
        "status": "success", 
        "message": "ML Service process is live",
        "crop_model_loaded": prediction_service.is_loaded(),
        "disease_model_loaded": disease_service.is_loaded()
    }

@app.get("/ready")
def readiness_check(response: Response):
    """
    Readiness probe endpoint (Step 24.24 / BLK-03).
    Returns HTTP 200 ONLY when both Crop and Disease ML models are loaded into memory.
    Returns HTTP 503 Service Unavailable if either model is missing or unloaded,
    preventing load balancers and orchestrators from routing inference traffic prematurely.
    """
    crop_ready = prediction_service.is_loaded()
    disease_ready = disease_service.is_loaded()

    if crop_ready and disease_ready:
        return {
            "status": "ready",
            "message": "ML Service is ready to accept inference requests",
            "crop_model_loaded": True,
            "disease_model_loaded": True
        }

    response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return {
        "status": "not_ready",
        "message": "ML Service is not ready: required model artifacts are offline",
        "crop_model_loaded": crop_ready,
        "disease_model_loaded": disease_ready
    }

app.include_router(predict_router, prefix="/api/v1", tags=["Crop Prediction"])
app.include_router(disease_router, prefix="/api/v1", tags=["Disease Prediction"])
