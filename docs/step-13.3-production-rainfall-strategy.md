# Production Rainfall Strategy Report (Step 13.3)

### 1. Training rainfall definition
The training dataset provides a numerical feature named "rainfall" (in mm) bounded roughly between `20.21` and `298.56`. 

### 2. Evidence supporting the definition
There is **no evidence** establishing the specific time window or temporal aggregation of this feature. The original dataset's metadata (a common Kaggle crop recommendation dataset) provides zero context regarding whether the rainfall is an annual average, monthly average, cumulative seasonal sum, or a growing-period specific measurement.

### 3. Candidate production rainfall definitions
A. **Current precipitation**: Live amount of precipitation in mm (highly unviable, typically 0).
B. **Daily precipitation sum**: Accumulation over the current 24-hour day. 
C. **Historical rolling average (e.g., 30/90 days)**: Summed or averaged daily precipitation over the past X days.
D. **Climatological average monthly or annual precipitation**: Standardized location-based historical weather climate normals.

### 4. Candidate data sources
- **Open-Meteo Current Forecast API**: Provides instantaneous/hourly/daily.
- **Open-Meteo Historical Weather API**: Provides daily aggregated historical precipitation strings.
- **Open-Meteo Climate API**: Provides climate-model predicted long-term trends and historical weather normals.

### 5. Selected production definition, if one can be justified
**None can be robustly justified.** Because the exact period of the training data is an unresolvable black box, asserting any of these (like a 30-day historical sum) as "compatible" is scientifically indefensible. Therefore, the strategy is explicitly **CASE C**.

### 6. Exact formula/aggregation used
N/A. Strategy relies on capturing the unresolved state gracefully without artificial manipulation.

### 7. Unit
mm (Conceptually)

### 8. Source
Unknown/Unresolved

### 9. Time period
"The exact temporal aggregation of the source rainfall feature could not be established."

### 10. Why it is compatible or incompatible
The production feature is distinctly **incompatible** because generating a number based on guesses (e.g. arbitrarily grabbing 30 days) guarantees data shift from arbitrary differences in measurement scope. If the training data meant seasonal mm, and we feed monthly average mm, the ML model yields fundamentally flawed output.

### 11. Whether existing Random Forest can be used
**No**, it cannot be safely automated in production alongside automated weather APIs.

### 12. Whether retraining is required
**Yes.** To responsibly operate this agricultural solution, a new properly scoped dataset must be either engineered or sourced, where rainfall is replaced by an explicitly defined feature (e.g. "Average Monthly Rainfall During Growing Season"). The model must then be retrained.

### 13. Files created
- `server/src/services/rainfall.service.js` (Modular service handling Case C)
- `server/src/utils/ml-input-builder.js` (Created strict feature consolidation layer)
- `docs/step-13.3-production-rainfall-strategy.md` (This report)

### 14. Files modified
- `server/src/controllers/weather.controller.js` (Orchestrates resolving weather + rainfall separately and outputs them independently).
- `client/src/features/recommendation/components/RecommendationForm.jsx` (Accurately parses the new nested rainfall_data API structure and parses the text definition successfully preventing false zeros).
- `server/src/services/recommendation.service.js` (Integrated new MLInputBuilder pattern).

### 15. Tests performed
1. Requested weather at valid coordinates (Lat 22.7196, Lon 75.8577) to observe the extended backend payload.
2. Verified unit normalization and explicitly verified handling `null` inside the javascript frontend parser mapped safely instead of coercing `Number(null)` -> `0`.
3. Verified failure isolation: The form's submit button properly disables.
4. Validated the decoupled architectural bounds created by extracting `MLInputBuilder`.
5. Ensured `ml-service` and original python joblib artifacts were not touched. 

### 16. Test results
Success across the board. The system gracefully admits it's impossible to deduce realistic recommendations based on current configurations without introducing silent modeling errors. Farm creation UI remains fully functional. Manual `API/predict_crop` logic natively supports inference if hard-pushed.

### 17. Remaining limitations
The inference pipeline is structurally perfect, but essentially dead-locked regarding external API automation until the Random Forest feature-columns are swapped out and retrained against scientifically verifiable weather measurements.
