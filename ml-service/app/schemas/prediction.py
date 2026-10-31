from pydantic import BaseModel, Field

# ==================================================
# EDUCATIONAL DOCUMENTATION
# ==================================================
# 6. Why validation is necessary: Missing values, wrong types (strings instead of numbers), or physically impossible values (like negative rainfall) would crash the underlying ML model or produce logically invalid predictions. Pydantic enforces domain validation automatically.

class CropPredictionRequest(BaseModel):
    nitrogen: float = Field(..., ge=0, description="Ratio of Nitrogen content in soil")
    phosphorus: float = Field(..., ge=0, description="Ratio of Phosphorus content in soil")
    potassium: float = Field(..., ge=0, description="Ratio of Potassium content in soil")
    temperature: float = Field(..., description="Temperature in degree Celsius")
    humidity: float = Field(..., description="Relative humidity in %")
    pH: float = Field(..., ge=0, le=14, description="pH value of the soil")
    rainfall: float = Field(..., ge=0, description="Rainfall in mm")

class CropRecommendation(BaseModel):
    rank: int
    crop: str
    score: float = Field(description="Model Probability")

class CropPredictionData(BaseModel):
    recommendations: list[CropRecommendation]

class CropPredictionResponse(BaseModel):
    success: bool
    message: str
    data: CropPredictionData
