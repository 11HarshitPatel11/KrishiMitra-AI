# Step 19.3: Market-Aware Crop Recommendation

## 1. Why Market Price is Used
Farmers evaluate recommendations against physical market viability. Generating high environmental ML probabilities for completely depressed markets ignores socioeconomic context. Applying a bounded market context gently re-orders suitable crops increasing profitability visibility.

## 2. Why Market Price is NOT an RF (Random Forest) Feature
Biological features (Nitrogen, Rain) define *If a crop can grow*. Economics defines *If it should be grown*. Mixing fluid numeric currency directly into a static biochemical Random Forest tree completely explodes regression weights, making AI convergence mathematically corrupt.

## 3. Final Recommendation Architecture
The sequential stack prevents logical collisions natively:
1. `ML Probability`: Pure biochemical assessment from FastAPI Random Forests (all 22 outputs).
2. `Rotation Factor`: Determines agricultural penalty via Crop History (0.75x or 1.0x).
3. `Market Factor`: Assesses local Mandi context matching bounded limits (0.95x - 1.05x).
**Final Score Ranking** = `ML Prob * Rotation * Market`.

## 4. Market Data Source & 5. Modal Price
Utilizing `data.gov.in` Mandi arrivals structurally. We exclusively bind against `modalPrice` extracting realistic representative transactions (skipping extremes like Min/Max bounds).

## 6. District/State Fallback & 7. Multiple Mandi Aggregation
We silently reverse-geocode the user's Farm `latitude/longitude` extracting standard `state` and `district` context.
If multiple Mandi points exist per candidate crop inside resolving areas, we calculate the absolute `Median` of all returned Modal Prices to defeat isolated anomalies smoothly.

## 8. Fresh/Recent Handling
Stale data (> 3 days) is algorithmically dumped filtering missing/unreliable traces securely preventing outdated weights from ruining current planting profiles.

## 9. Relative Price Normalization & 10. Market Factor Formula
Raw currency units (₹150 vs ₹3000) cannot directly map into 0.0 - 1.0 multipliers. We use *Percentile Context*:
Among all overlapping candidate crops:
- Sorted ascending by median modal price.
- `Percentile` = `Index / (Total Valid Count - 1)`
- `Market Factor` = `0.95 + (Percentile * 0.10)`
(Lowest earns `0.95` penalty, Highest earns `1.05` bonus, mapping entirely uniformly preventing exponential explosions). 

## 11. Why Market Factor is Bounded
If ML dictates a crop has `80%` viability and another has `30%`, market factors maxing out at `1.05` cannot fundamentally flip biological failures matching high-demand crops into dangerous impossible #1 spots. Biology dominates.

## 12. Final Score Formula & 13. History Interaction
`Final Score = mlProbability * rotationFactor * marketFactor`.
Multipliers stack elegantly without colliding logic nodes securely decoupling boundaries.

## 14. Market API Failure Fallback
If the Government Mandi node drops (5xx timeout / Empty records), `marketFactor` locks at an invisible semantic `1.0`. `FinalScore` naturally evaluates completely matching native biological mappings natively shielding application UX.

## 15 & 16. Meaning of Final Score (NOT Probability)
The output evaluates cleanly as `Recommendation Score` (e.g. 60.3). We meticulously stripped legacy notations asserting `% chance of success` from the UX matching bounded math representations authentically preventing legal/logical confusion.

## 17. Why Price != Profit & 18. Limitations
Higher Mandi prices logically do NOT equal farm profitability (High Price / High Cost scenarios). 

## 19. Future Possibility
Adding explicit Net Yield, Tractor Cost, Input Subsidies, and Transportation boundaries can eventually map into a Phase 3 `Profit Simulator`, extending Step 19.3 logically if such datasets are secured.
