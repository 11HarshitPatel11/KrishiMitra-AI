from fastapi import APIRouter, HTTPException
from app.schemas.prediction import CropPredictionRequest, CropPredictionResponse, CropPredictionData
from app.services.prediction_service import prediction_service

router = APIRouter()

# ==================================================
# EDUCATIONAL DOCUMENTATION
# ==================================================
# 7. Why the ML service is separated from Node.js: Python is the native industry standard for Machine Learning execution (due to Pandas/Scikit-Learn/PyTorch). Node.js efficiently handles authentication, database connections, and web routing. A microservice architecture safely isolates these respective strengths.

@router.post("/predict", response_model=CropPredictionResponse)
def predict_crop(request: CropPredictionRequest):
    """
    Receives exactly 7 environmental features as JSON, delegates canonical ordering 
    and returns a decoded string prediction probability. 
    """
    if not prediction_service.is_loaded():
        raise HTTPException(status_code=503, detail="Prediction service unavailable: ML model artifacts are offline.")
        
    try:
        # Pass destructured required dictionary 
        recommendations = prediction_service.predict_crop(
            nitrogen=request.nitrogen,
            phosphorus=request.phosphorus,
            potassium=request.potassium,
            temperature=request.temperature,
            humidity=request.humidity,
            ph=request.pH,
            rainfall=request.rainfall
        )
        
        return CropPredictionResponse(
            success=True,
            message="Crop prediction generated successfully",
            data=CropPredictionData(
                recommendations=[
                    {
                        "rank": rec["rank"],
                        "crop": rec["crop"],
                        "score": float(rec["score"])
                    } for rec in recommendations
                ]
            )
        )
        
    except ValueError as ve:
        # Safe domain logical bounds failure
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        # Generic inference crash mapping securely handled to not drop stack traces publicly
        raise HTTPException(status_code=500, detail="Internal ML inference execution failed.")
