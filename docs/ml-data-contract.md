# ML Data Contract

## 1. Purpose
This document defines the strict data boundaries, canonical feature sets, and input/output contracts between the main application (Node.js/Express) and the future Machine Learning microservice (Python/FastAPI) in the Crop Recommendation System. Its primary goal is to prevent the frontend, backend, and ML services from becoming tightly coupled by standardizing how application data transforms into ML inference data.

## 2. Current Farm Data
The current `Farm` model collects and stores the following information locally from the farmer:
- **`farmName`** (String)
- **`area`** (Number)
- **`areaUnit`** (Enum: acre, hectare)
- **`nitrogen`** (Number)
- **`phosphorus`** (Number)
- **`potassium`** (Number)
- **`pH`** (Number)
- **`createdAt`** / **`updatedAt`** (Timestamps)

## 3. Initial ML Feature List
The crop recommendation model will eventually use exactly **seven numerical features** for its initial implementation:
1. nitrogen
2. phosphorus
3. potassium
4. temperature
5. humidity
6. pH
7. rainfall

The expected prediction target is the **crop** type.

## 4. Feature Source Table
| Feature      | Intended Data Source      | Status         |
|--------------|---------------------------|----------------|
| nitrogen     | Farmer Input              | Implemented    |
| phosphorus   | Farmer Input              | Implemented    |
| potassium    | Farmer Input              | Implemented    |
| temperature  | External Weather Service  | Implemented    |
| humidity     | External Weather Service  | Implemented    |
| pH           | Farmer Input              | Implemented    |
| rainfall     | Farmer Input (Manual)     | Implemented    |

**Note:** Current precipitation from the weather API is not directly used as the ML rainfall feature because the temporal aggregation of the training dataset's rainfall feature is not explicitly established. Rainfall is therefore currently provided manually to preserve training/inference feature compatibility.

## 5. Canonical Feature Order
The strict and absolute feature order required by the model is:
```json
[
  "nitrogen",
  "phosphorus",
  "potassium",
  "temperature",
  "humidity",
  "pH",
  "rainfall"
]
```
**Why Ordering Matters**: ML models (like Random Forests or XGBoost) process inputs as mathematically ordered arrays or arrays of vectors. They do not naturally inherently bind metadata names (like `"temperature" = 20`) unless managed strictly by the inference layer. Supplying features out of order will result in completely invalid underlying mathematical representations and thus inaccurate crop predictions. This canonical order must be rigidly adhered to across training, data preprocessing, and API communication.

## 6. Training Data Definition
The training dataset must exactly map:
- **Features (Input)**: `N`, `P`, `K`, `temperature`, `humidity`, `pH`, `rainfall`
- **Target (Output)**: `crop` (String/Label representing the ideal crop)

## 7. Production Inference Data Definition
A model trained on seven features cannot be reliably called with only four features. In production, we cannot infer crops using solely the farmer's raw inputs. 
The production flow dictates:
1. **Farmer Input Data** (N, P, K, pH) is combined with **External Weather Data** (temperature, humidity, rainfall).
2. Together, they yield the exact 7-feature definition matching the training data constraints.

## 8. Future ML Input Contract
The backend Node.js application will eventually use an **ML Input Builder** class/function. This builder transforms disparate logic into the specific JSON format the Python FastAPI ML Service expects.

**Conceptual Expected ML Input Request:**
```json
{
  "nitrogen": 90,
  "phosphorus": 42,
  "potassium": 43,
  "temperature": 20.8,
  "humidity": 82,
  "pH": 6.5,
  "rainfall": 202
}
```

## 9. Future ML Output Contract
The FastAPI service will respond structurally. Future adjustments will support confidence probabilities and ranked recommendations, but the baseline contract sets:

**Conceptual Expected ML Output Response:**
```json
{
  "crop": "rice"
}
```

## 10. Data Validation Principles
Before any ML prediction commences, the ML Python service will perform strict, robust validation. Principles include:
- All required 7 features must exist in the payload.
- All values must be explicitly numeric.
- Values must be finite and within plausible scientific ranges.
- Absolutely no `NaN`, `null`, or undefined missing values allowed.
- Feature ordering consistency must be mapped accurately before inference.

## 11. Farm Data vs ML Data Distinction
Farm MongoDB documents represent organizational states. They contain business abstractions (like Farm Names, Timestamps, Area sizes, and relationships). 
Conversely, **ML Data** requires pure normalized feature arrays exclusively designed for inference math. The `Farm` schema must never be considered synonymous with the ML Input array. The Backend Application's _ML Input Builder_ serves as the distinct boundary between application abstractions and mathematical vectors. 

## 12. Future Weather Integration Boundary
No weather tracking APIs (such as OpenWeatherMap, Meteostat) will be directly hooked into the UI or Farm schemas. Instead, weather boundaries exist in the backend orchestration layer. At the exact time of crop recommendation inference, the backend will resolve coordinates/regions to fetch `temperature`, `humidity`, and `rainfall`, and immediately forward them through the ML Input Builder.

## 13. Future SoilGrids Integration Boundary
SoilGrids represents an optional future enrichment source to replace missing farmer-provided physical soil data. We do not assume SoilGrids maps flawlessly 1:1 to every ML feature. The current Farm infrastructure remains decoupled. If SoilGrids data is integrated, the ML Input Builder will decide whether to prioritize Farmer inputs over SoilGrid defaults without breaking original API interactions.

## 14. Future Extensibility Considerations
By establishing strict boundaries via the ML Input Builder and Canonical feature ordering, the architecture enables smooth progression toward:
- Versioned endpoints (e.g. `POST /api/v2/predict_crop`) capable of dynamically digesting new features.
- Additional soil parameters (like Organic Carbon, Soil Texture) being appended gracefully to MongoDB schemas without immediately breaking legacy 7-feature inference ML models in production.
