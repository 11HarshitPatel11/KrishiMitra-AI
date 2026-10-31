# Step 22 — ML Strategy Analysis: AI-Based Crop Recommendation System

**Status:** `ANALYSIS COMPLETE — NO MODEL OR APPLICATION CHANGES`  
**Date:** 2026-10-16  
**Scope:** Research and feasibility only. All existing artifacts, code, and API contracts are untouched.

---

## Table of Contents

1. [Existing Model Audit](#1-existing-model-audit)
2. [Candidate Dataset and Source Comparison](#2-candidate-dataset-and-source-comparison)
3. [Feature Compatibility Matrix](#3-feature-compatibility-matrix)
4. [SoilGrids Compatibility Assessment](#4-soilgrids-compatibility-assessment)
5. [Comparison of Approaches A, B, and C](#5-comparison-of-approaches-a-b-and-c)
6. [Risks and Limitations](#6-risks-and-limitations)
7. [Recommended Strategy with Evidence](#7-recommended-strategy-with-evidence)
8. [Implementation Steps Required After Strategy Approval](#8-implementation-steps-required-after-strategy-approval)

---

## 1. Existing Model Audit

### 1.1 Dataset

| Property | Value |
|---|---|
| File | `ml-service/datasets/Crop_recommendation.csv` |
| Origin | Published on Kaggle by Atharva Ingle (~2020) |
| Total Rows | 2,200 |
| Rows per Class | Exactly 100 per crop (perfectly balanced) |
| Target Classes | 22 |
| Nature | **Derived/augmented synthetic data**, not direct field measurement records |
| Geographic Coverage | India (general agricultural context; no GPS coordinates included) |
| License | Not formally documented in the project |

**Target classes (22):** apple, banana, blackgram, chickpea, coconut, coffee, cotton, grapes, jute, kidneybeans, lentil, maize, mango, mothbeans, mungbean, muskmelon, orange, papaya, pigeonpeas, pomegranate, rice, watermelon.

### 1.2 Seven Model Input Features

| # | Feature Name | Column in Dataset | Unit (approx.) | Description |
|---|---|---|---|---|
| 1 | `nitrogen` | `N` | ratio / relative content | Nitrogen content in soil |
| 2 | `phosphorus` | `P` | ratio / relative content | Phosphorus content in soil |
| 3 | `potassium` | `K` | ratio / relative content | Potassium content in soil |
| 4 | `temperature` | `temperature` | °C | Ambient temperature |
| 5 | `humidity` | `humidity` | % relative humidity | Ambient humidity |
| 6 | `pH` | `ph` | 0–14 scale | Soil pH |
| 7 | `rainfall` | `rainfall` | mm | Rainfall |

**Critical note on N, P, K units:** The dataset column labels are `N`, `P`, `K` with no documented unit specification. Based on the dataset's augmentation context (Indian agricultural recommendations), the values appear to represent soil nutrient ratios or content relative to common fertilizer prescription thresholds. They are **not clearly documented as mg/kg, kg/ha, or any other absolute unit**. This is a structural limitation of the benchmark.

### 1.3 Actual Sources of Each Input in the Application

As implemented and documented in `docs/ml-data-contract.md` and verified against the application code:

| Feature | Who Provides It | Module / Source | How |
|---|---|---|---|
| `nitrogen` | Farmer | `Farm` model | Manual entry via UI form |
| `phosphorus` | Farmer | `Farm` model | Manual entry via UI form |
| `potassium` | Farmer | `Farm` model | Manual entry via UI form |
| `pH` | Farmer | `Farm` model | Manual entry via UI form |
| `temperature` | External service | Open-Meteo API | Automated fetch by coordinates |
| `humidity` | External service | Open-Meteo API | Automated fetch by coordinates |
| `rainfall` | Farmer | `Farm` / Recommendation form | Manual entry (see note below) |

**Rainfall note (from `ml-data-contract.md`, Section 4):** "Current precipitation from the weather API is not directly used as the ML rainfall feature because the temporal aggregation of the training dataset's rainfall feature is not explicitly established." Rainfall is therefore manually entered. This is architecturally correct and intentional.

### 1.4 Model Architecture

| Property | Value |
|---|---|
| Algorithm | `RandomForestClassifier` (scikit-learn) |
| `n_estimators` | 100 |
| `random_state` | 42 |
| Feature scaling | None (correct for tree-based models) |
| Train/test split | 80/20 stratified |
| Training samples | 1,760 |
| Test samples | 440 |
| Label encoding | `LabelEncoder` (inverse-transformable) |
| Output | Top-5 ranked crops with `predict_proba()` confidence scores |

### 1.5 Benchmark Performance Metrics

#### Hold-out Test Set (20%)

| Metric | Value |
|---|---|
| Training accuracy | 1.0000 (100%) |
| Test accuracy | 0.9955 (99.55%) |
| Test macro F1 | 0.9955 |
| Test macro precision | ~1.00 |
| Test macro recall | ~1.00 |

Only 2 of 440 test samples were misclassified. The confusion matrix showed all errors concentrated between `jute`, `maize`, and `blackgram`/`rice` — crops with overlapping feature distributions.

#### Cross-Validation (5-fold StratifiedKFold on training set)

| Metric | Mean | Std Dev |
|---|---|---|
| Accuracy | 0.9938 | 0.0061 |
| Macro Precision | 0.9946 | 0.0050 |
| Macro Recall | 0.9938 | 0.0061 |
| Macro F1 | 0.9937 | 0.0061 |

The extremely low standard deviation confirms the model is consistent across folds on this dataset. There is no evidence of overfitting within the benchmark.

### 1.6 Why Benchmark Performance Does Not Establish Real-World Accuracy

The training script itself acknowledges this limitation (comment #20):  
> "Why high test accuracy on this benchmark dataset does not automatically prove real-world agricultural accuracy: Real farm data is messy, noisy, and has variances not captured in clean datasets."

The following specific factors prevent benchmark metrics from generalizing to real deployments:

1. **Synthetic/augmented data.** The dataset has exactly 100 rows per class across 22 classes, which is statistically implausible in real field distribution. This perfect balance is a consequence of construction, not nature.

2. **Unknown N, P, K units.** The crop recommendation dataset does not specify whether N, P, K values represent mg/kg, kg/ha, or another scale. Farmers entering values from soil test reports in kg/ha or ppm may supply numbers in entirely different numerical ranges than the training distribution, causing the model to operate outside its learned decision boundaries.

3. **Undocumented rainfall aggregation period.** The training dataset does not define whether `rainfall` represents annual total, seasonal, or monthly rainfall. A farmer entering rainfall for the current month provides a semantically different quantity from the training feature.

4. **No geographic stratification.** The dataset has no GPS coordinates, district, or state labels. The model cannot be evaluated for regional bias. A model that generalizes well across 22 balanced classes in a synthetic dataset may still be locally inaccurate for specific regions.

5. **Laboratory vs. field conditions.** Soil N, P, K and pH readings depend on measurement methodology, time of year, depth, and accredited laboratory procedures. Farmer-entered values may reflect different protocols.

6. **No temporal validation.** There is no evaluation against future planting seasons or out-of-sample years, which would be required to demonstrate predictive validity for real decision-making.

7. **Benchmark leakage risk.** Since the dataset is derived from the same simulated agricultural context used to construct all 22 classes, test-set performance reflects within-distribution evaluation, not generalization to unseen farm profiles.

**Conclusion:** The ~99.5% test accuracy is a benchmark score on a curated, balanced, simulated dataset. It should not be presented as the model's expected real-world predictive accuracy. The model is a functional demonstration tool whose real-world performance cannot be established from this evaluation alone.

---

## 2. Candidate Dataset and Source Comparison

The following candidates were investigated as potential alternatives or supplements. No dataset was downloaded.

---

### Candidate 1: Existing Dataset — Kaggle `Crop_recommendation.csv` (Atharva Ingle, 2020)

| Property | Finding |
|---|---|
| Source | Kaggle (https://www.kaggle.com/datasets/atharvaingle/crop-recommendation-dataset) |
| License | Not formally specified (no official license visible in the dataset card) |
| Records | 2,200 (exactly 100 per class) |
| Target Classes | 22 Indian crops |
| Features | N, P, K, temperature, humidity, pH, rainfall |
| Geographic coverage | India (no coordinates) |
| Data quality | Synthetic/augmented; perfectly balanced; no missing values |
| Temporal coverage | None documented |
| Label meaning | "Ideal crop for the given conditions" — prescriptive, not observational |
| Unit documentation | N, P, K units not formally specified |
| Training limitations | Benchmark accuracy is inflated by simulated distribution; no real-world validation |
| Feature match to application | High for all 7 features; all are collected by the system |
| **Assessment** | **Currently in use. Defensible as a demonstration dataset with documented limitations. Cannot be used to claim real-world accuracy.** |

---

### Candidate 2: Figshare / ICAR-Referenced Crop Recommendation Datasets

| Property | Finding |
|---|---|
| Source | Figshare (public repository), with features described as referencing ICAR and ICFA standards |
| License | Some variants published under CC BY 4.0 |
| Records | Varies; similar structure to the Kaggle dataset |
| Target Classes | Similar set of Indian crops |
| Features | N, P, K, temperature, humidity, pH, rainfall |
| Geographic coverage | India; some variants include district-level attribution |
| Data quality | Varies; some are re-uploads of the Kaggle dataset or close derivatives |
| Temporal coverage | Not documented |
| Label meaning | Recommended crop under given conditions |
| Unit documentation | Generally not formally documented |
| **Assessment** | **Not independently verifiable as distinct from the existing Kaggle dataset without direct inspection. ICAR-referenced does not confirm ICAR-validated. Cannot be adopted without downloading, independently verifying provenance, checking for duplication with the existing dataset, and confirming the license terms allow use in an application. Not suitable as a drop-in replacement without this verification.** |

---

### Candidate 3: Geo-Referenced Indian Crop Prediction Dataset (Soil Health Portal–derived)

| Property | Finding |
|---|---|
| Source | Kaggle; claims to use data from `soilhealth.dac.gov.in` (India Soil Health Portal) |
| License | Described as open/public; formal terms not confirmed from search results alone |
| Records | Not verified (not downloaded) |
| Target Classes | Indian crops; exact count not verified |
| Features | N, P, K, pH, electrical conductivity, temperature, precipitation, latitude, longitude |
| Geographic coverage | India with district/coordinate attribution — meaningfully better than Candidate 1 |
| Data quality | Unverified without download and inspection |
| Temporal coverage | Unknown |
| Label meaning | Prescribed crop based on district-level soil and climate |
| Unit documentation | Not confirmed; Soil Health Portal measures N, P, K in kg/ha for macronutrient categories |
| **Assessment** | **The inclusion of GPS coordinates and district-level attribution is a genuine improvement over Candidate 1. However, the data provenance claim (Soil Health Portal) cannot be verified from search results alone — the portal issues "Low/Medium/High" soil fertility categories rather than continuous NPK values in many reports. Formal unit documentation and license terms must be confirmed before the dataset can be used. Requires full download and inspection. Not ready to adopt in this step.** |

---

### Candidate 4: NASA POWER / Open-Meteo Historical Climate Data

| Property | Finding |
|---|---|
| Source | NASA POWER (https://power.larc.nasa.gov/) and Open-Meteo Historical API |
| License | NASA POWER: open, no registration required. Open-Meteo: CC BY 4.0 on ERA5-Land reanalysis |
| Records | Time-series historical; can be queried for any coordinate set |
| Target Classes | None — this is a feature source, not a labeled crop dataset |
| Features | Daily/hourly: precipitation, temperature (min/max/mean), humidity, solar radiation, evapotranspiration, soil moisture (0–7cm, 7–28cm) |
| Geographic coverage | Global |
| Data quality | High for large-scale climate patterns; ERA5-Land at 9km resolution |
| Temporal coverage | ERA5-Land: 1940–present; POWER: 1981–present |
| Label meaning | N/A |
| **Assessment** | **Not a standalone crop recommendation dataset. Could provide high-quality historical climate features (temperature, humidity, rainfall aggregated over a defined period) if a labeled crop dataset with matching farm coordinates and planting seasons were assembled. The critical gap is the absence of crop labels — this data cannot train a crop classifier without pairing it with ground-truth crop outcomes at specific locations and seasons. This is a valid future enrichment path, not an immediate replacement.** |

---

### Candidate 5: Ethiopian ATA and African Government Datasets

| Property | Finding |
|---|---|
| Source | Various open repositories, Zenodo |
| License | Varies; some CC BY |
| Records | Varies |
| Target Classes | African and Ethiopian crops — not Indian crop classes |
| Features | Geographic, climate, soil texture categories |
| Geographic coverage | East Africa |
| **Assessment** | **Not applicable to the KrishiMitra target geography (India). The 22 crop classes in the existing model are largely India-specific. A model trained on African crop labels with African soil and climate distributions cannot be applied to Indian farmers.** |

---

### Candidate 6: Google Earth Engine (GEE) — Remote Sensing Feature Pipeline

| Property | Finding |
|---|---|
| Source | Google Earth Engine (MODIS, Sentinel-2, ERA5, NDVI time series) |
| License | Many datasets free for research; commercial licensing complex |
| Records | Continuous raster; must be sampled at farm coordinates to create tabular records |
| Target Classes | N/A — feature source only |
| Features | Land cover, NDVI, evapotranspiration, precipitation, land use, soil moisture indices |
| Geographic coverage | Global |
| Data quality | High for macro-environmental features |
| **Assessment** | **Requires significant research infrastructure to assemble a labeled crop recommendation dataset from GEE rasters. Would require ground-truth planting outcome data to pair with spatial features. Not feasible as an immediate replacement. Viable as part of a multi-year research pipeline.** |

---

## 3. Feature Compatibility Matrix

This matrix assesses whether each application input source can plausibly substitute for the training feature it is intended to serve.

| Model Feature | Training Dataset Value | Application Source | Same Quantity? | Key Risks |
|---|---|---|---|---|
| `nitrogen` | Soil N (simulated, unit unspecified) | Farmer-entered value | **Uncertain** | Farmer may enter from a soil test in kg/ha or ppm. Training data unit is unknown. Numerical range mismatch is possible. |
| `phosphorus` | Soil P (simulated, unit unspecified) | Farmer-entered value | **Uncertain** | Same risk as nitrogen. |
| `potassium` | Soil K (simulated, unit unspecified) | Farmer-entered value | **Uncertain** | Same risk as nitrogen. |
| `pH` | Soil pH (standard water-based measure) | Farmer-entered value | **Likely compatible** | pH values are dimensionless and relatively protocol-independent at 0–14 scale. Risk is manageable. |
| `temperature` | Ambient temperature °C | Open-Meteo current temperature | **Likely compatible** | Current temperature may differ from seasonal growing-season average used in training. Acceptable approximation. |
| `humidity` | Relative humidity % | Open-Meteo current humidity | **Likely compatible** | Same caveat as temperature. Acceptable approximation. |
| `rainfall` | mm (aggregation period unknown) | Farmer-entered mm | **Possibly compatible** | If farmer provides annual or seasonal rainfall (matching training definition), feature is valid. If farmer provides recent-week or last-month rainfall, the values will be semantically mismatched. The undocumented aggregation period is the key risk. |

**Summary:** `pH`, `temperature`, and `humidity` have defensible compatibility. N, P, K and rainfall carry semantic compatibility risks that cannot be eliminated without formal documentation of the training dataset's measurement protocol.

---

## 4. SoilGrids Compatibility Assessment

SoilGrids was integrated in Step 21.2 as a **display-only** supplementary layer. This section documents why each SoilGrids property cannot be directly or silently substituted for the current model's training features.

### 4.1 SoilGrids `nitrogen` vs. Model `nitrogen`

| Dimension | SoilGrids Nitrogen | Training Dataset Nitrogen |
|---|---|---|
| Property measured | **Total Nitrogen** (organic + inorganic; Kjeldahl-digested) | **Unspecified** — likely plant-available nitrogen or a prescriptive ratio |
| Unit (after conversion) | g/kg | Unknown (likely either kg/ha or a relative ratio) |
| Numerical scale | ~0.5–3.0 g/kg for typical mineral soils | Dataset range: ~0–140 (raw N column) |
| Scale interpretation | Total nitrogen of the entire soil matrix | Prescriptive soil fertility category or scaled ratio |
| **Compatibility verdict** | ❌ **Incompatible** | Even if units were matched numerically, total nitrogen ≠ available nitrogen. Passing SoilGrids N into the model would constitute a semantic mismatch. |

**Key finding from research:** SoilGrids provides `Total Nitrogen` (`cg/kg` raw → `g/kg` after ÷100). Crop recommendation models trained on standard Indian agricultural guidelines use **plant-available nitrogen** (mineral forms: NO₃⁻ and NH₄⁺), which is a small and season-dependent fraction of total nitrogen. Typical total N in agricultural soil: 1,500–3,000 mg/kg (1.5–3.0 g/kg); typical plant-available N: 20–200 kg/ha depending on season and mineralization rate. These are different quantities and are not interchangeable.

### 4.2 SoilGrids `phh2o` vs. Model `pH`

| Dimension | SoilGrids `phh2o` | Training Dataset pH |
|---|---|---|
| Method | pH in water suspension (1:2.5 or similar); modeled at 250m pixel | Standard lab probe measurement |
| Spatial resolution | 250m × 250m raster pixel (6.25 ha average) | Field-scale point measurement |
| Typical RMSE vs. in-situ | ±0.5–1.0 pH units for dense data regions; higher in sparse regions | Reference standard |
| Bias | Smoothed (misses micro-scale extremes) | Exact local sample |
| **Compatibility verdict** | ⚠️ **Partially compatible with caveats** | pH is dimensionless and measured water-based in both cases. However, the 250m spatial averaging and ±0.5 unit RMSE means SoilGrids pH may systematically differ from a field soil test by a margin that is agronomically significant (0.5 pH is the difference between strongly acidic and moderately acidic categories). Could be used as a rough contextual indicator only. |

### 4.3 SoilGrids `sand`, `silt`, `clay`, `soc`, `bdod` vs. Model Features

None of these SoilGrids properties are included in the existing model's training feature set. They cannot be added without retraining on a dataset that uses them.

| SoilGrids Property | Present in Current Model? | Notes |
|---|---|---|
| `sand` (%) | ❌ No | Not a training feature |
| `silt` (%) | ❌ No | Not a training feature |
| `clay` (%) | ❌ No | Not a training feature |
| `soc` (g/kg) | ❌ No | Not a training feature |
| `bdod` (kg/dm³) | ❌ No | Not a training feature |

### 4.4 SoilGrids Missing Properties (P and K)

SoilGrids **does not provide Phosphorus (P) or Potassium (K)** as global products. This is a known limitation of the ISRIC data model. Any approach that proposes using SoilGrids to replace farmer-entered P and K without fabricating values is structurally impossible.

### 4.5 SoilGrids Compatibility Summary

| SoilGrids Property | Could be used as model feature? | Reason |
|---|---|---|
| `nitrogen` (total N) | ❌ No | Different quantity from training N; unit and scale mismatch |
| `phh2o` (pH) | ⚠️ Contextual only | Approximate; ±0.5–1.0 RMSE; spatial smoothing bias |
| `phosphorus` | ❌ Not available | ISRIC does not provide P globally |
| `potassium` | ❌ Not available | ISRIC does not provide K globally |
| `soc`, `sand`, `silt`, `clay`, `bdod` | ❌ Not model features | Not in training data; cannot be used without full retraining |

**Conclusion:** SoilGrids data cannot replace any of the 7 training features in the existing model in a scientifically defensible way. Its role is and must remain informational display only, clearly labeled as supplementary data from an external source.

---

## 5. Comparison of Approaches A, B, and C

### Approach A: Retain Existing Seven-Feature Random Forest

**Description:** Keep the current `crop_random_forest.joblib` and `crop_label_encoder.joblib` artifacts. Continue requiring all 7 inputs from their current sources. Make no changes to the ML pipeline.

| Dimension | Assessment |
|---|---|
| Input requirements | N, P, K, temperature, humidity, pH, rainfall (all 7 required) |
| Farmer usability | Moderate: requires 4 manual entries (N, P, K, rainfall). Temperature and humidity auto-fetched. |
| Scientific limitations | Benchmark accuracy is on a synthetic dataset; real-world accuracy cannot be established. Unit ambiguity for N, P, K. Rainfall aggregation period undocumented. These are known and documented limitations. |
| Dataset availability | ✅ Dataset already present; no download or legal clearance required |
| Implementation effort | ✅ None — system is already built and working |
| Evaluation completeness | 5-fold cross-validation complete; confusion matrix and classification report documented |
| Risk of misleading recommendations | Moderate: quantifiable risk from N/P/K unit mismatch and rainfall aggregation ambiguity. Manageable if properly disclosed to farmers. |
| **Verdict** | **Viable and currently deployed. Scientifically defensible as a demonstration tool with explicit limitations documented.** |

---

### Approach B: Separately Trained Model on a Different Dataset with Different Feature Set

**Description:** Identify a verified, legal, documented dataset with a different feature set (ideally requiring fewer manually measured soil parameters) and train a separate model.

| Dimension | Assessment |
|---|---|
| Input requirements | Depends on dataset; possibly weather + coordinates only, or with macro soil categories |
| Farmer usability | Potentially higher if fewer manual entries needed |
| Scientific limitations | No verified dataset with different features has been identified in this analysis. GEE/NASA POWER can provide weather features but not labeled crop outcomes. |
| Dataset availability | ❌ No confirmed, legally usable, independently verified alternative dataset was identified |
| Implementation effort | High: dataset identification, download, inspection, cleaning, training, evaluation, new API contract, new validation tests, updated documentation |
| Evaluation requirements | Full train/validation/test separation, class-wise metrics, confusion matrix, cross-validation with no leakage, geographic evaluation |
| Risk of misleading recommendations | Unknown — depends entirely on dataset quality and feature-outcome alignment |
| **Verdict** | **Not currently feasible. No defensible alternative dataset was identified in this analysis. Requires substantial additional research effort before this approach can be assessed.** |

---

### Approach C: Hybrid Model Using SoilGrids + Weather for Some Features

**Description:** Replace or supplement farmer-entered N, P, K with SoilGrids values and/or other remotely sensed properties to reduce manual entry burden, then pass modified features into a model.

| Dimension | Assessment |
|---|---|
| Input requirements | SoilGrids coordinates + Open-Meteo coordinates (fewer manual inputs) |
| Farmer usability | Potentially better if manual soil entry is removed |
| Scientific limitations | SoilGrids total N ≠ available N; P and K not available from SoilGrids; SoilGrids pH has ±0.5 RMSE and spatial smoothing bias; the existing model was never trained on SoilGrids-derived features |
| Data contract compatibility | ❌ Fundamentally incompatible: filling model slots trained on prescriptive soil fertility ratios with globally-modeled soil total nitrogen values is a semantic violation |
| Risk of misleading recommendations | **High**: A model silently accepting out-of-distribution inputs (wrong quantity, wrong unit, wrong measurement methodology) will produce numerically plausible but agronomically meaningless predictions. |
| Evaluation requirements | Would require retraining from scratch on a dataset that uses SoilGrids-derived features with matching ground-truth crop outcomes — which does not currently exist in verified form |
| **Verdict** | **Not scientifically defensible. The fundamental incompatibility between SoilGrids total nitrogen and the training data's available nitrogen makes this approach invalid without a complete, verified dataset retraining pipeline. The risk of producing confident but incorrect recommendations is unacceptably high.** |

---

## 6. Risks and Limitations

### Risks Inherent in the Existing Model (Approach A)

| Risk | Severity | Mitigated? | How |
|---|---|---|---|
| Benchmark accuracy ≠ real-world accuracy | High | Partially | Comment in training script; cross-validation documented |
| N, P, K unit ambiguity (farmer entry vs. training data) | Medium | Not fully | Currently undocumented to end users |
| Rainfall aggregation mismatch | Medium | Not fully | Documented in ml-data-contract.md §4; not communicated to farmers |
| Dataset not independently verified as non-synthetic | Medium | Partially | Origin is known; limitations documented in this analysis |
| No geographic stratification | Medium | Not mitigated | Model has no regional adjustment mechanism |
| License not formally confirmed | Low | Not confirmed | Dataset described as open; exact license not in project |

### Risks of Introducing an Unverified Replacement

| Risk | Severity |
|---|---|
| Adopting a dataset that is a re-upload of the existing dataset, introducing no actual improvement | High |
| Applying a model trained on a geographically different context (e.g., Africa) to Indian farmers | High |
| Fabricating missing features (e.g., substituting zero for missing P or K) | Critical |
| Training and evaluating on the same subset of a non-randomized dataset (leakage) | High |
| Claiming improvement based solely on benchmark accuracy | High |

---

## 7. Recommended Strategy with Evidence

### Primary Recommendation: **Retain Approach A — Existing Random Forest**

**Rationale:**

1. **The existing model is the only option with a complete, verified, documented pipeline.** Training script, preprocessing script, cross-validation report, classification report, confusion matrix, and model metadata are all present. No candidate alternative meets this standard.

2. **No verified alternative dataset was identified.** Every alternative investigated in this analysis either (a) lacks a confirmed distinct provenance from the existing Kaggle dataset, (b) lacks a formal license, (c) lacks verified feature units and documentation, or (d) is not a labeled crop recommendation dataset at all.

3. **Approach C is scientifically invalid.** SoilGrids total nitrogen cannot replace the training model's nitrogen feature without retraining on a matched dataset, which does not currently exist in verified form. Implementing it would produce misleading recommendations.

4. **The existing model's limitations are known and documentable.** Known limitations are preferable to unknown risks introduced by unverified alternatives. The limitations of the existing model can be communicated transparently to farmers.

5. **The cross-validation confirms within-dataset consistency.** Mean CV accuracy 99.4% with std 0.006 demonstrates the model consistently generalizes within its training distribution. The limitation is the distribution itself, not the model's fit to it.

### Secondary Recommendation: Document Limitations Explicitly to Farmers

The following disclosures should be added to the farmer-facing UI:

- *"This recommendation is based on a machine learning model trained on simulated agricultural data. It is intended as a starting point for discussion with local agricultural experts, not a definitive prescription."*
- *"Soil nutrient values (N, P, K) should be entered from a certified soil test report where possible."*
- *"Rainfall should represent the expected annual or seasonal total for your growing region, not recent precipitation."*

### Conditional Future Path (Approach B)

Approach B becomes viable only when all of the following are satisfied:

1. A dataset is identified with:
   - Confirmed distinct provenance from the existing Kaggle dataset
   - Formally documented license permitting use in a deployed application
   - Formally documented feature units
   - Geo-referenced records (farm coordinates and/or district)
   - Ground-truth crop outcome labels (not synthetically constructed)

2. The dataset has been downloaded, inspected for class balance, missing values, and unit consistency.

3. A feature-to-application-input mapping is documented and defensible.

4. A full training pipeline with train/validation/test isolation, cross-validation, and confusion matrix is executed.

5. The new model's performance is compared class-by-class against the existing model's classification report.

6. Documentation, tests, and API contracts are updated.

**This analysis does not identify any currently available dataset that satisfies all these conditions.**

---

## 8. Implementation Steps Required After Strategy Approval

> These steps are defined for completeness. **None are executed in this step.** They apply only if a future decision is made to pursue Approach B.

### Phase 1 — Dataset Qualification (Research Step)

1. Identify the specific dataset to be used. Record: URL, license text, download date, version, SHA-256 hash of raw file.
2. Verify it is not a re-upload or derivative of `Crop_recommendation.csv` by inspecting row counts, class counts, and a statistical summary of feature distributions.
3. Confirm the license permits commercial or application use.
4. Document all feature names, units, measurement methodology, data collection process, and geographic scope.
5. Contact authors or check official repository for errata or known issues.

### Phase 2 — Data Inspection (No Training)

6. Run an inspection script equivalent to `inspect_dataset.py` to profile: shape, dtypes, missing value counts, class distribution, feature min/max/mean/std, outlier counts.
7. Confirm all labels are valid crop names mapping to the application's target geography.
8. Document class distribution and flag severely imbalanced classes.
9. Record findings in a new `docs/dataset-qualification-report.md`.

### Phase 3 — Feature Mapping

10. For each feature in the new dataset, document: how it will be provided in the application (farm model, weather API, manual entry), the unit used at training vs. the unit available at inference, and any conversion needed.
11. Identify any features present in training data that cannot be supplied at inference time. Document the planned handling (imputation, exclusion, or blocking the inference request).

### Phase 4 — Training Pipeline

12. Write a new preprocessing script (`preprocess_new_dataset.py`) with structural validation equivalent to the existing `preprocess_dataset.py`, including: exact feature count check, class count check, null check, type check, and train/validation/test separation **before** any exploratory analysis to prevent leakage.
13. Train the model using an 80/10/10 train/validation/test split where validation is used for hyperparameter tuning and test set is held out until final evaluation.
14. Run 5-fold stratified cross-validation on the training portion only.
15. Evaluate on the held-out test set. Produce: classification report, confusion matrix, and macro/weighted F1, precision, and recall.

### Phase 5 — Comparison and Validation

16. Compare the new model's class-wise F1 scores against the existing model's classification report side-by-side.
17. Evaluate performance on a held-out geographic subset (e.g., held-out states or districts) to check for regional generalization if coordinates are available.
18. If new model's evaluation metrics are acceptable and the feature mapping is defensible, proceed. Otherwise, return to Phase 1.

### Phase 6 — Integration (Only After Approval)

19. Update `ml-service/artifacts/` with new model and encoder artifacts.
20. Update `model_metadata.json` with new training date, dataset filename, feature order, class mapping, and metrics.
21. Update `docs/ml-data-contract.md` with the new feature set, units, and sources.
22. Update `ml-service/app/schemas/prediction.py` if the feature set changes.
23. Update `ml-service/app/services/prediction_service.py` with any new canonical feature order.
24. Update all related Node.js validators and recommendation controller inputs.
25. Run all existing backend tests. Update tests to reflect new features.
26. Run frontend build. Verify UI inputs match new feature requirements.
27. Update documentation in `docs/` accordingly.
28. Create `docs/step-22b-replacement-model.md` with the full audit trail.

---

## Appendix: Files Inspected in This Analysis

| File | Purpose |
|---|---|
| `ml-service/training/scripts/train_random_forest.py` | Training pipeline, model configuration, evaluation logic |
| `ml-service/training/scripts/preprocess_dataset.py` | Feature definitions, validation rules, train/test split |
| `ml-service/artifacts/model_metadata.json` | Recorded metrics, class mapping, feature order |
| `ml-service/training/outputs/classification_report.txt` | Per-class precision, recall, F1 on 20% test set |
| `ml-service/training/outputs/cross_validation_report.txt` | 5-fold CV accuracy, precision, recall, F1 |
| `ml-service/app/schemas/prediction.py` | Pydantic input/output schema; enforced feature bounds |
| `ml-service/app/services/prediction_service.py` | Inference logic; canonical feature order; top-5 ranking |
| `docs/ml-data-contract.md` | Feature sources, canonical order, separation principles |
| `server/src/services/recommendation.service.js` | Application orchestration; confirmed SoilGrids not used |
| `server/src/services/soilGrids.service.js` | Confirmed: external soil data display-only, not passed to ML |

---

**FINAL STATUS: `ANALYSIS COMPLETE — NO MODEL OR APPLICATION CHANGES`**
