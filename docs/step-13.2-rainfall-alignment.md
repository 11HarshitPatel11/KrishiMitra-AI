# Decision Report: Rainfall Feature Alignment (Step 13.2)

### 1. Training feature meaning
What exactly is known about the dataset rainfall feature?
- The dataset (`Crop_recommendation.csv`) strictly documents the feature as "rainfall" in mm, with statistical values between `20.21` and `298.56` mm.
- Despite exhaustive search, **dataset provenance is completely missing**. The original time period for this measurement is undocumented. It could be daily, monthly, seasonal, or average annual rainfall during the growing period, but no authoritative metadata exists to prove it.

### 2. Production feature meaning
What does each Open-Meteo candidate represent?
- **Current precipitation** (currently integrated): The physical amount of rainfall falling *right now* (or in the current hour). It is generally `0 mm` unless actively raining.
- **Daily precipitation sum**: The total accumulated rainfall over a 24-hour calendar period.
- **Historical / Rolling precipitation**: The accumulation of rain over a rolling window (e.g., 7, 30, or 90 days prior).
- **Climatological average precipitation**: Historic, long-term averages for a geographical location during a specific part of the year.

### 3. Compatibility analysis
Which candidate, if any, is semantically compatible?
- **None are demonstrably compatible**. Current precipitation (0 mm) is grossly mismatched as crops require substantial cumulative water. While "Climatological average precipitation" conceptually aligns closest with agricultural planning (and would likely fit the 20-300mm bounds), selecting it without knowing if the original authors aggregated data this way introduces unscientific assumptions and silent data shift.

### 4. Recommended production rainfall feature
Given lack of provenance, we fall under **CASE C**. The exact definition cannot be safely hardcoded right now. However, for a production agricultural application, the most recommended sensible feature would be **climatological average rainfall for the growing season** of that exact GPS coordinate.

### 5. Existing model decision
Can the existing Random Forest safely use it?
- **No.** The existing Random Forest model cannot safely use current live precipitation data (e.g., 0 mm). Supplying zero to a model trained on numbers starting at 20.21 forces an Out-Of-Distribution evaluation that yields arbitrary inference output. We must pause using automated weather to populate the rainfall feature.

### 6. Retraining decision
- **Cannot determine definitively yet**, but **Retraining is highly likely required**.
- Why? If we cannot determine what the original authors meant, we cannot safely recreate the feature.
- To progress safely: We must redefine "rainfall" explicitly for our system (e.g., Monthly Average Rainfall), pull reliable climatic mappings for the crops in the dataset, replace the `rainfall` column in a new CSV, and retrain the Random Forest model on this fully understood, reproducible ground truth.

### 7. Architecture
```
Farmer
↓
Latitude + Longitude
↓
Weather/Climate Data
↓
Rainfall Feature Builder
↓
ML Input Builder
↓
Random Forest
```

### 8. Files changed
1. `server/src/services/weather.service.js`
   Modified integration to temporarily yield `rainfall: null` and expose `rainfall_status: 'not_aligned'`.
2. `client/src/features/recommendation/components/RecommendationForm.jsx`
   Updated UI to gracefully handle the unaligned state. The weather widget now says "Not available / not aligned" (instead of rendering 0 mm and masquerading as valid ML data) and logically disables form submission to uphold strict ML contracts.
3. `server/src/utils/ml-bounds.js`
   Corrected docstrings and variable meanings to indicate this performs *training-distribution OOD detection*, preventing the misconception that <20.21 mm is physically impossible.

### 9. Tests
1. Tested fetching current coordinates (Lat: 22.7196, Lon: 75.8577) through Open-Meteo script.
2. Verified that temperature and humidity fields retain valid automated functionality.
3. Validated that `ml-bounds.js` properly classifies values purely based on statistical bounds, not physical science.
4. Validated UI successfully blocks prediction on `fetchedWeather.rainfall_status === 'not_aligned'`, guaranteeing no user inadvertently tests invalid logic on the ML API, while existing non-UI POST `/api/predict_crop` testing remains completely intact on the backend.

### 10. Remaining uncertainty
The primary irreconcilable uncertainty is the temporal mapping (the "per-what" period) of the original Kaggle dataset's `rainfall` feature, leaving a definitive semantic alignment impossible until the data is entirely overhauled or synthetically rebuilt.
