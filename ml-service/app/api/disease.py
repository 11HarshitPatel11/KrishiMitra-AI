from fastapi import APIRouter, HTTPException, UploadFile, File
from app.schemas.disease import DiseasePredictionResponse, DiseasePredictionData, DiseasePredictionInfo, DiseaseTop3Info
from app.services.disease_service import disease_service

import io

router = APIRouter()

ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
ALLOWED_EXTENSIONS = ["jpeg", "jpg", "png", "webp"]

@router.post("/disease/predict", response_model=DiseasePredictionResponse)
async def predict_disease(file: UploadFile = File(...)):
    """
    Receives an uploaded leaf image and returns the predicted disease class, confidence, and top-3 matches.
    """
    if not disease_service.is_loaded():
        raise HTTPException(status_code=503, detail="Prediction service unavailable: Disease ML model artifacts are offline.")
        
    if not file:
        raise HTTPException(status_code=400, detail="No file explicitly uploaded.")
        
    # Check mime type (basic check)
    if file.content_type not in ALLOWED_MIME_TYPES:
         raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}. Only JPEG, PNG, and WEBP are allowed.")
         
    try:
        # Read file contents
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Empty upload.")
            
        # Optional: Advanced deep check for format using imghdr or PIL (done in service)
        # We handle valid checking efficiently inside the service via Pillow
        result = disease_service.predict_disease(content)
        
        return DiseasePredictionResponse(
            success=True,
            message="Disease prediction generated successfully",
            data=DiseasePredictionData(
                prediction=DiseasePredictionInfo(**result["prediction"]),
                top3=[DiseaseTop3Info(**t) for t in result["top3"]]
            )
        )
        
    except ValueError as ve:
        # Invalid image parsing, thrown by the disease_service explicitly
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        # Generic inference crash mapping securely handled to not drop stack traces publicly
        raise HTTPException(status_code=500, detail="Internal ML inference execution failed.")

