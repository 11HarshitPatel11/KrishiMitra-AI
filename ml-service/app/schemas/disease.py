from pydantic import BaseModel
from typing import List, Dict, Any

class DiseasePredictionInfo(BaseModel):
    className: str
    confidence: float
    status: str

class DiseaseTop3Info(BaseModel):
    rank: int
    className: str
    confidence: float

class DiseasePredictionData(BaseModel):
    prediction: DiseasePredictionInfo
    top3: List[DiseaseTop3Info]

class DiseasePredictionResponse(BaseModel):
    success: bool
    message: str
    data: DiseasePredictionData
