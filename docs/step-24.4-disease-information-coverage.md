# Step 24.4 — Crop Disease Information Coverage & Safety Audit

## 1. Executive Summary

The KrishiMitra AI platform features a deep learning disease classification model (MobileNetV3-Small) trained on the 38-class PlantVillage benchmark dataset. In Step 20.4, an initial proof-of-concept database seeded exactly **4 disease records**.

Step 24.4 audits all 38 model output classes, eliminates seed idempotency hazards, and expands verified agricultural coverage to **all 26 genuine plant pathology entities** using authoritative agricultural university extension services. Crucially, this audit prioritizes **correctness, clinical safety, and responsible disclosure**:
- The **12 non-disease healthy control classes** are deliberately left unseeded with disease management advice to prevent fabricated symptoms or unjustified pesticide applications.
- When an unseeded or healthy class is identified, the API safely responds with `informationStatus: "unavailable"`, and the frontend clearly explains that treatment advice is withheld.
- When model predictions are classified as `status: "uncertain"`, disease information is strictly withheld (`withheld_due_to_uncertainty`) to prevent farmers from treating tentative AI outputs as confirmed diagnoses.
- Dangerous chemical dosage instructions and fabricated pesticide recipes are strictly prohibited across all profiles.

---

## 2. Complete Model Class Coverage Inventory (38 Classes)

| Class Index | Exact Model Class Identifier (`diseaseCode`) | Affected Crop | Common / Taxonomic Name | Information Status | Source Authority & Citations |
|:---:|:---|:---|:---|:---:|:---|
| 0 | `Apple___Apple_scab` | Apple | Apple Scab (*Venturia inaequalis*) | **Available** (Preserved) | [Cornell Cooperative Extension / Penn State Extension](https://extension.psu.edu/apple-scab) |
| 1 | `Apple___Black_rot` | Apple | Black Rot (*Botryosphaeria obtusa*) | **Available** (New) | [Ohio State University Extension / Penn State Extension](https://ohioline.osu.edu/factsheet/plpath-fru-47) |
| 2 | `Apple___Cedar_apple_rust` | Apple | Cedar Apple Rust (*Gymnosporangium juniperi-virginianae*) | **Available** (New) | [University of Minnesota Extension](https://extension.umn.edu/plant-diseases/cedar-apple-rust) |
| 3 | `Apple___healthy` | Apple | Healthy Foliage (Control Class) | *Unavailable by Design* | Non-disease negative control in PlantVillage dataset; no pathogen present. |
| 4 | `Blueberry___healthy` | Blueberry | Healthy Foliage (Control Class) | *Unavailable by Design* | Non-disease negative control in PlantVillage dataset; no pathogen present. |
| 5 | `Cherry_(including_sour)___Powdery_mildew` | Cherry | Powdery Mildew (*Podosphaera clandestina*) | **Available** (New) | [Washington State University Extension / UC IPM](https://treefruit.wsu.edu/crop-protection/disease-management/cherry-powdery-mildew/) |
| 6 | `Cherry_(including_sour)___healthy` | Cherry | Healthy Foliage (Control Class) | *Unavailable by Design* | Non-disease negative control in PlantVillage dataset; no pathogen present. |
| 7 | `Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot` | Corn (Maize) | Gray Leaf Spot (*Cercospora zeae-maydis*) | **Available** (New) | [Purdue University Extension / Iowa State Extension](https://extension.entm.purdue.edu/fieldcropsipm/diseases/gray-leaf-spot.php) |
| 8 | `Corn_(maize)___Common_rust_` | Corn (Maize) | Common Rust (*Puccinia sorghi*) | **Available** (Preserved) | [University of Illinois Extension / Iowa State Extension](https://cropprotectionnetwork.org/encyclopedia/common-rust-of-corn) |
| 9 | `Corn_(maize)___Northern_Leaf_Blight` | Corn (Maize) | Northern Corn Leaf Blight (*Exserohilum turcicum*) | **Available** (New) | [Purdue University Extension / Penn State Extension](https://extension.psu.edu/northern-corn-leaf-blight) |
| 10 | `Corn_(maize)___healthy` | Corn (Maize) | Healthy Foliage (Control Class) | *Unavailable by Design* | Non-disease negative control in PlantVillage dataset; no pathogen present. |
| 11 | `Grape___Black_rot` | Grape | Black Rot (*Phyllosticta ampelicida*) | **Available** (New) | [Ohio State University Extension / Cornell Extension](https://ohioline.osu.edu/factsheet/plpath-fru-24) |
| 12 | `Grape___Esca_(Black_Measles)` | Grape | Esca / Black Measles (*Phaeomoniella chlamydospora* et al.) | **Available** (New) | [University of California IPM](https://ipm.ucanr.edu/agriculture/grape/esca-black-measles/) |
| 13 | `Grape___Leaf_blight_(Isariopsis_Leaf_Spot)` | Grape | Leaf Blight (*Pseudocercospora vitis*) | **Available** (New) | [University of Florida Extension (EDIS) / Texas A&M](https://edis.ifas.ufl.edu/publication/HS100) |
| 14 | `Grape___healthy` | Grape | Healthy Foliage (Control Class) | *Unavailable by Design* | Non-disease negative control in PlantVillage dataset; no pathogen present. |
| 15 | `Orange___Haunglongbing_(Citrus_greening)` | Orange | Huanglongbing / Citrus Greening (*Ca.* Liberibacter asiaticus) | **Available** (New) | [USDA APHIS / University of Florida IFAS Extension](https://www.aphis.usda.gov/plant-pests-diseases/citrus-diseases/citrus-greening) |
| 16 | `Peach___Bacterial_spot` | Peach | Bacterial Spot (*Xanthomonas arboricola* pv. *pruni*) | **Available** (New) | [Clemson University Cooperative Extension / NC State Extension](https://hgic.clemson.edu/factsheet/peach-diseases/) |
| 17 | `Peach___healthy` | Peach | Healthy Foliage (Control Class) | *Unavailable by Design* | Non-disease negative control in PlantVillage dataset; no pathogen present. |
| 18 | `Pepper,_bell___Bacterial_spot` | Bell Pepper | Bacterial Spot (*Xanthomonas* spp.) | **Available** (New) | [University of Florida IFAS Extension / Cornell Extension](https://edis.ifas.ufl.edu/publication/VH056) |
| 19 | `Pepper,_bell___healthy` | Bell Pepper | Healthy Foliage (Control Class) | *Unavailable by Design* | Non-disease negative control in PlantVillage dataset; no pathogen present. |
| 20 | `Potato___Early_blight` | Potato | Early Blight (*Alternaria solani*) | **Available** (New) | [North Dakota State University Extension / Univ of Wisconsin](https://www.ag.ndsu.edu/publications/crops/early-blight-in-potato) |
| 21 | `Potato___Late_blight` | Potato | Late Blight (*Phytophthora infestans*) | **Available** (New) | [Oregon State University Extension / Cornell Extension](https://extension.oregonstate.edu/crop-production/potatoes/late-blight-management) |
| 22 | `Potato___healthy` | Potato | Healthy Foliage (Control Class) | *Unavailable by Design* | Non-disease negative control in PlantVillage dataset; no pathogen present. |
| 23 | `Raspberry___healthy` | Raspberry | Healthy Foliage (Control Class) | *Unavailable by Design* | Non-disease negative control in PlantVillage dataset; no pathogen present. |
| 24 | `Soybean___healthy` | Soybean | Healthy Foliage (Control Class) | *Unavailable by Design* | Non-disease negative control in PlantVillage dataset; no pathogen present. |
| 25 | `Squash___Powdery_mildew` | Squash | Powdery Mildew (*Podosphaera xanthii*) | **Available** (New) | [University of Minnesota Extension / Cornell Vegetable MD](https://extension.umn.edu/disease-management/powdery-mildew-cucurbits) |
| 26 | `Strawberry___Leaf_scorch` | Strawberry | Leaf Scorch (*Diplocarpon earlianum*) | **Available** (New) | [NC State Extension / Ohio State University Extension](https://content.ces.ncsu.edu/strawberry-leaf-scorch) |
| 27 | `Strawberry___healthy` | Strawberry | Healthy Foliage (Control Class) | *Unavailable by Design* | Non-disease negative control in PlantVillage dataset; no pathogen present. |
| 28 | `Tomato___Bacterial_spot` | Tomato | Bacterial Spot (*Xanthomonas* spp.) | **Available** (New) | [Penn State Extension / University of Florida IFAS](https://extension.psu.edu/bacterial-spot-of-tomato) |
| 29 | `Tomato___Early_blight` | Tomato | Early Blight (*Alternaria solani*) | **Available** (Preserved) | [Cornell Cooperative Extension / Univ of Maryland Extension](https://extension.umd.edu/resource/early-blight-tomatoes) |
| 30 | `Tomato___Late_blight` | Tomato | Late Blight (*Phytophthora infestans*) | **Available** (Preserved) | [Cornell Cooperative Extension / Univ of Minnesota Extension](https://extension.umn.edu/disease-management/late-blight) |
| 31 | `Tomato___Leaf_Mold` | Tomato | Leaf Mold (*Passalora fulva*) | **Available** (New) | [University of Minnesota Extension / Missouri Botanical Garden](https://extension.umn.edu/disease-management/tomato-leaf-mold) |
| 32 | `Tomato___Septoria_leaf_spot` | Tomato | Septoria Leaf Spot (*Septoria lycopersici*) | **Available** (New) | [Missouri Botanical Garden / Penn State Extension](https://extension.psu.edu/septoria-leaf-spot-on-tomato) |
| 33 | `Tomato___Spider_mites Two-spotted_spider_mite` | Tomato | Two-Spotted Spider Mite (*Tetranychus urticae*) | **Available** (New) | [University of California IPM / University of Florida IFAS](https://ipm.ucanr.edu/agriculture/tomato/spider-mites/) |
| 34 | `Tomato___Target_Spot` | Tomato | Target Spot (*Corynespora cassiicola*) | **Available** (New) | [University of Florida IFAS Extension](https://edis.ifas.ufl.edu/publication/PP316) |
| 35 | `Tomato___Tomato_Yellow_Leaf_Curl_Virus` | Tomato | Tomato Yellow Leaf Curl Virus (TYLCV) | **Available** (New) | [University of Florida IFAS Extension / Texas A&M](https://edis.ifas.ufl.edu/publication/IN682) |
| 36 | `Tomato___Tomato_mosaic_virus` | Tomato | Tomato Mosaic Virus (ToMV) | **Available** (New) | [University of Massachusetts Amherst Extension / Cornell](https://nevegetable.org/crops/diseases/tomato-mosaic-virus-tomv) |
| 37 | `Tomato___healthy` | Tomato | Healthy Foliage (Control Class) | *Unavailable by Design* | Non-disease negative control in PlantVillage dataset; no pathogen present. |

---

## 3. Discrepancy & Mismatch Analysis

1. **Duplicate Disease Codes:** **0** (All 26 seeds have distinct, unique primary keys).
2. **Naming Mismatches:** **0** (Every single identifier matches the raw string from `disease_class_names.json` character-for-character, including specific dataset idiosyncrasies like `Corn_(maize)___Common_rust_` and `Tomato___Spider_mites Two-spotted_spider_mite`).
3. **Mismatched Disease Profiles:** **0** (No cross-crop or misnamed disease entries).

---

## 4. Seeding Safety & Idempotency Improvements

In Step 20.4, `server/seedDiseaseInfos.js` performed `await DiseaseInformation.deleteMany({});` prior to insertion. This was destructive and non-idempotent.

### Changes Made to Seeding Engine:
* **Eradicated `deleteMany({})`**: Existing collections are never wiped out.
* **Idempotent Upsert (`findOneAndUpdate`)**:
  ```javascript
  await DiseaseInformation.findOneAndUpdate(
      { diseaseCode: data.diseaseCode },
      { $set: data },
      { upsert: true, new: true, runValidators: true }
  );
  ```
* **Preservation of 4 Historical Records**: The original symptom details for `Apple___Apple_scab`, `Corn_(maize)___Common_rust_`, `Tomato___Early_blight`, and `Tomato___Late_blight` were strictly maintained, while extending them with extension citations and diagnostic limitation notes.
* **Non-Invention of Healthy Disease Records**: The 12 healthy control classes are intentionally not entered into `DiseaseInformation` collections. When predicted, the backend gracefully emits `informationStatus: "unavailable"`, and the frontend displays a safe disclaimer stating that disease management records are intentionally withheld for healthy or non-pathological tissue.

---

## 5. Agricultural Clinical Safety & Dosage Policy

To protect growers and ecosystems from inappropriate agricultural chemical usage:
* **No Fabricated Fungicide or Pesticide Dosages:** Treatment descriptions provide non-chemical cultural controls (e.g. crop rotation, drip irrigation, sanitizing pruning shears, planting resistant cultivars, roguing infected material) and refer growers to regional agricultural extension services for chemical schedules.
* **Explicit Diagnostic Limitations:** Every disease profile includes an advisory limitation detailing lookalike symptoms (e.g. Septoria vs. Early Blight; nutrient deficiencies vs. Bacterial Spot).
* **Uncertain Prediction Guard:** When the ML service flags a prediction as `uncertain` (`confidence < threshold`), the controller forcefully assigns `informationStatus = "withheld_due_to_uncertainty"` and suppresses treatment recommendations entirely.
* **Advisory Disclaimer:** The frontend (`DiseaseDetectionPage.jsx`) prominently displays a banner explaining that computer vision results represent statistical pattern matches and are not certified laboratory diagnoses.

---

## 6. Verification and Automated Testing

An automated test suite (`server/test_disease_info_unit.js`) validates all 26 seeded entities across 41 assertions:
* Exact mapping of all 26 seeded `diseaseCode` values to `disease_class_names.json`.
* Identification and verification of all 12 unseeded healthy control classes (`*___healthy`).
* Absence of dangerous chemical mixing ratios or unsupported dosages.
* Schema validation compliance for all 10 schema fields.
* Service retrieval and controller 404 unavailable handling.
* Retention and integrity of the original 4 records.
* **Result:** **41 PASSED, 0 FAILED**.
