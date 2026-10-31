# Software Requirements Specification (SRS)
## KrishiMitra AI — Intelligent Agricultural Decision Support & Plant Health Diagnostic Platform

**Document Version:** 1.0  
**Status:** Approved / Academic Final-Year Major Project  
**Author:** Department of Computer Science & Engineering  
**Project Repository:** `Crop_Pridiction_final`  

---

## 1. Introduction

### 1.1 Purpose
This Software Requirements Specification (SRS) provides a comprehensive, rigorous definition of the requirements, architecture, data models, and behavioral specifications for **KrishiMitra AI**. KrishiMitra AI is an end-to-end agricultural decision-support system designed to empower Indian farmers, agronomists, and agricultural extension workers with machine learning (ML)-driven crop suitability recommendations, deep-learning-based foliar plant disease detection, and real-time agro-climatic intelligence.

### 1.2 Document Conventions
* **Must / Shall:** Mandatory requirements strictly implemented in the current release.
* **Should:** Recommended operational behaviors.
* **May:** Optional configurations or user choices.
* **UML / Mermaid:** Standard graphical modeling notation used for behavioral and structural representations.

### 1.3 Intended Audience
* **Academic Reviewers & Evaluators:** For assessing technical scope, algorithmic integrity, engineering rigor, and compliance with B.Tech CSE project standards.
* **Software Engineers & Maintainers:** For architectural comprehension, microservice boundary inspection, and future extensions.
* **Agricultural Extension Officers (KVKs):** For understanding model inputs, operational boundaries, and advisory safeguards.

---

## 2. Overall Description

### 2.1 Problem Statement
Agriculture forms the backbone of the Indian economy, employing over 45% of the national workforce. Despite its centrality, Indian smallholder farmers face severe structural challenges:
1. **Uninformed Crop Selection:** Farmers frequently select crops based on historical habit or localized peer trends rather than scientific soil chemistry (Nitrogen, Phosphorus, Potassium, pH) and micro-climate realities. This leads to soil nutrient exhaustion, crop failure, and economic distress.
2. **Delayed Foliar Disease Identification:** Fungal, bacterial, and viral infections often progress undetected until macroscopic leaf damage occurs. Farmers either apply improper chemical treatments based on guesswork or consult informal chemical retailers, resulting in pesticide misuse, environmental toxicity, and crop loss.
3. **Information Asymmetry in Mandi Prices:** Farmers lack localized, real-time market price benchmarks and demand trend signals, leading to distress sales at unremunerative farm-gate prices.
4. **Monoculture Fatigue & Soil Degradation:** Lack of crop rotation awareness leads to repeated monoculture of exhaustive annual crops, depleting specific soil horizons and harboring recurring pathogens.
5. **Language & Digital Literacy Barriers:** Existing agricultural portals are predominantly in technical English, excluding rural Hindi-speaking farming communities.

### 2.2 Existing System vs. Proposed KrishiMitra AI

| Feature / Dimension | Existing / Traditional System | KrishiMitra AI (Proposed System) |
| :--- | :--- | :--- |
| **Crop Recommendation** | Based on manual intuition, local hearsay, or static district-level charts. | **Multi-Factor ML Model:** 100-tree Random Forest evaluating 7 soil and climate parameters, dynamically weighted by crop rotation history and Mandi market profitability. |
| **Disease Diagnosis** | Visual guesswork or delayed physical visits by agricultural extension personnel. | **MobileNetV3 Deep Learning CNN:** Instant inference on uploaded leaf photos across 38 crop-disease classes with a 70% confidence threshold safeguard. |
| **Soil Intelligence** | Requires physical soil testing laboratory visits with weeks of turnaround time. | **Dual-Source Soil Management:** Manual lab entry supported by automated geographic synchronization via ISRIC SoilGrids v2.0 global soil profiles. |
| **Market Context** | Disconnected physical visits to local APMC mandis; unaware of prevailing modal prices. | **Automated Mandi Intelligence:** Real-time commodity price tracking via Data.gov.in with median filtering, 30-day freshness checks, and demand signals. |
| **Crop History & Rotation** | Unrecorded or maintained in handwritten paper registers. | **Digital Crop History Tracking:** Automatically applies a conservative 25% monoculture penalty ($0.75$) when repeating annual crops. |
| **Language Accessibility** | English-only technical terminology. | **Bilingual Native UI:** Seamless client-side switching between English and natural, easy-to-understand Hindi (Devanagari script). |

### 2.3 System Architecture Overview
KrishiMitra AI is architected as a decoupled, three-tier microservices platform:
1. **Presentation Layer (React Single-Page Application):** Built with React 18, Vite, React Router v7, and Tailwind CSS. Provides a responsive user experience optimized for both mobile smartphones and desktop displays.
2. **Application & Gateway Layer (Node.js / Express):** Express REST API server providing stateless JWT authentication, input validation, multi-tenant farm isolation, in-memory rate limiting, external API orchestration, and persistence with MongoDB.
3. **Machine Learning Microservice Layer (Python / FastAPI):** High-performance Python inference service hosting serialized scikit-learn Random Forest and PyTorch MobileNetV3 Small models.
4. **Data Persistence Layer (MongoDB):** Non-relational document database hosting user accounts, farm parcels, soil profiles, crop rotation histories, and university-extension-verified disease management profiles.

```
┌────────────────────────────────────────────────────────┐
│               Client Tier: React 18 + Vite             │
│            (Bilingual English / Hindi SPA)             │
└───────────────────────────┬────────────────────────────┘
                            │ HTTPS / REST (Bearer JWT)
                            ▼
┌────────────────────────────────────────────────────────┐
│           Gateway Tier: Node.js / Express API          │
│       (Auth, Validation, IDOR Security, Rate Limiter)  │
└──────────────┬──────────────────────────┬──────────────┘
               │ Internal REST            │ Mongoose ODM
               ▼                          ▼
┌──────────────────────────────┐   ┌─────────────────────┐
│    ML Tier: Python FastAPI   │   │  MongoDB Database   │
│  • Random Forest (Crops)     │   │  • Users, Farms     │
│  • MobileNetV3 (Diseases)    │   │  • Soil, History    │
└──────────────────────────────┘   │  • Disease Guidance │
                                   └─────────────────────┘
```

---

## 3. User Roles and Characteristics

1. **Smallholder Farmer (Primary User):**
   * Operates agricultural parcels between 0.5 and 20 acres.
   * Accesses the system primarily via Android mobile smartphones or rural common service centers.
   * Interacts with farm registration, GPS auto-location, soil entry, crop recommendations, leaf photo uploads, and Hindi localization.
2. **Agricultural Extension Worker / KVK Agronomist:**
   * Uses the platform to verify crop suitability reports and review disease diagnosis safeguards during farmer counseling sessions.
3. **Academic Evaluator / System Administrator:**
   * Reviews architectural compliance, API endpoints, rate limiting, and ML evaluation metrics.

---

## 4. Functional Requirements

### 4.1 Module 1: User Authentication & Profile Management
* **FR-AUTH-01 (Registration):** The system shall allow new users to register using `name`, a unique RFC 5322-compliant `email`, and a `password` of at least 6 characters. Passwords must be hashed using `bcryptjs` with 10 salt rounds before storage.
* **FR-AUTH-02 (Rate Limiting):** The authentication endpoints (`/api/v1/auth/register` and `/api/v1/auth/login`) shall enforce an in-memory sliding-window rate limit (10 requests per 15-minute window per IP) and return HTTP 429 with `Retry-After` headers upon breach.
* **FR-AUTH-03 (Authentication & Tokens):** Upon valid login, the system shall issue a signed JSON Web Token (JWT) containing the user ID with a configurable expiration (default: 7 days).
* **FR-AUTH-04 (Profile Inspection & Update):** Authenticated users shall retrieve their profile (`GET /api/v1/auth/me`) and update permitted fields (`name`, `mobileNumber`, `location`) via `PATCH /api/v1/auth/profile`. Password hashes shall never be returned in responses.

### 4.2 Module 2: Farm Parcel & GPS Location Management
* **FR-FARM-01 (Farm Parcel CRUD):** Authenticated users shall create, read, update, and delete farm parcels (`/api/v1/farms`). Each parcel must capture `farmName`, `area` ($> 0$), `areaUnit` (`acre` or `hectare`), baseline soil nutrients (`nitrogen`, `phosphorus`, `potassium` $\ge 0$, and `pH` between 0 and 14).
* **FR-FARM-02 (Multi-Tenant IDOR Protection):** All farm operations must strictly enforce tenant ownership (`userId: req.user.id`). Any attempt by User A to read, update, or delete User B's farm shall return HTTP 404.
* **FR-FARM-03 (Cascading Deletion Protection):** Farm deletion shall be blocked with HTTP 409 Conflict if dependent records exist in `CropHistory`, `SoilInformation`, or `ExternalSoilInformation`, reporting exact dependency counts.
* **FR-FARM-04 (Browser GPS Geolocation):** The farm form shall provide a "Use My Current Location" button utilizing the W3C Geolocation API (`navigator.geolocation.getCurrentPosition`) with error handling for user denial, timeouts, and unmapped positions.
* **FR-FARM-05 (Reverse Geocoding):** When coordinates are captured, the backend shall query OpenStreetMap Nominatim (`GET /api/v1/farms/reverse-geocode`) with a custom User-Agent to resolve village, district, and state.
* **FR-FARM-06 (Coordinate Boundaries):** Latitude must strictly validate between $-90^\circ$ and $+90^\circ$; Longitude must strictly validate between $-180^\circ$ and $+180^\circ$. Coordinates must remain strictly optional so farmers without GPS can still register farms.

### 4.3 Module 3: Soil Information & ISRIC SoilGrids Integration
* **FR-SOIL-01 (Manual Soil Chemistry Tracking):** Users shall record field laboratory soil test metrics (`soilType`, `pH`, `nitrogen`, `phosphorus`, `potassium`, `moisture`, `notes`) tied uniquely to a farm parcel (`SoilInformation`).
* **FR-SOIL-02 (ISRIC SoilGrids v2.0 Synchronization):** The system shall fetch geographic soil profiles from ISRIC SoilGrids (`GET /api/v1/soil-information/external/farm/:farmId`) querying 7 properties (`phh2o`, `nitrogen`, `soc`, `sand`, `silt`, `clay`, `bdod`) across 6 standard depths (`0-5cm`, `5-15cm`, `15-30cm`, `30-60cm`, `60-100cm`, `100-200cm`).
* **FR-SOIL-03 (SoilGrids Unit Conversion):** Raw integer values returned by ISRIC SoilGrids shall be converted to scientific units using official factors:
  * `phh2o`: divided by 10 $\rightarrow \text{pH}$
  * `nitrogen`: divided by 100 $\rightarrow \text{g/kg}$
  * `soc`: divided by 10 $\rightarrow \text{g/kg}$
  * `sand`, `silt`, `clay`: divided by 10 $\rightarrow \%$
  * `bdod`: divided by 100 $\rightarrow \text{kg/dm}^3$
* **FR-SOIL-04 (Resilient Regional Baseline Fallback):** When the overseas ISRIC SoilGrids REST service times out ($> 6\text{s}$) or encounters network dropouts, the backend shall check for stored records in MongoDB. If absent, it shall generate an agro-climatic regional baseline calibrated for Indian soil zones (Vertisols, Alluvium, Red/Laterite, Arid) to guarantee zero downtime for farmers.
* **FR-SOIL-05 (Local Persistence):** Synced external soil records shall be saved in MongoDB (`ExternalSoilInformation`) to enable instant cached loading ($< 250\text{ ms}$) on subsequent visits.

### 4.4 Module 4: Multi-Factor Crop Recommendation Engine
* **FR-REC-01 (Input Validation):** The recommendation endpoint (`POST /api/v1/recommendations/predict`) shall validate exactly 7 environmental parameters: Nitrogen ($0 \le N \le 300$), Phosphorus ($0 \le P \le 150$), Potassium ($0 \le K \le 210$), Temperature ($-10 \le T \le 60^\circ\text{C}$), Humidity ($0 \le H \le 100\%$), pH ($0 \le \text{pH} \le 14$), and Rainfall ($0 \le R \le 5000\text{ mm}$).
* **FR-REC-02 (Canonical Feature Ordering):** The Node.js gateway shall format inputs into canonical order `["nitrogen", "phosphorus", "potassium", "temperature", "humidity", "pH", "rainfall"]` before invoking the FastAPI microservice.
* **FR-REC-03 (Random Forest Inference):** The ML service shall execute inference using the pre-trained Random Forest model (100 estimators, 22 classes) and compute class probabilities via `predict_proba()`.
* **FR-REC-04 (Zero-Probability Crop Filtering):** The ML service shall filter out all crops with probability $\le 0.0$, returning only viable candidate crops with non-zero probability.
* **FR-REC-05 (Crop Rotation Penalty Calculation):** If the selected farm has a recorded previous crop (`CropHistory`):
  * Same annual crop (e.g. rice after rice): $F_{\text{rotation}} = 0.75$ (25% monoculture penalty).
  * Same perennial crop (e.g. mango, apple) or different crop: $F_{\text{rotation}} = 1.00$ (no penalty).
* **FR-REC-06 (Mandi Market Adjustment):** If Mandi market prices are available for $\ge 2$ candidate crops:
  * Prices shall be ranked into percentiles using an average-rank tie-aware calculation: $\text{avgRank} / (N - 1)$.
  * Base Market Factor: $F_{\text{market}} = 0.95 + (\text{marketPercentile} \times 0.10)$.
  * Demand Signal adjustment: $+0.01$ for 'High', $-0.01$ for 'Low'.
  * Clamping: $F_{\text{market}} = \text{clamp}(0.95, 1.05)$.
* **FR-REC-07 (Composite Scoring & Deterministic Ranking):**
  $$\text{Final Score} = P_{\text{ML}} \times F_{\text{rotation}} \times F_{\text{market}}$$
  Candidates must be sorted using full-precision values: (1) higher Final Score first, (2) higher ML Probability first, (3) alphabetical crop name ascending. The top 5 candidates shall be returned.

### 4.5 Module 5: Deep Learning Plant Disease Detection
* **FR-DIS-01 (Leaf Image Upload):** The system shall accept foliar image uploads via multipart form-data (`POST /api/v1/disease/predict`) validated by `multer` for allowed MIME types (`image/jpeg`, `image/png`, `image/webp`) with a maximum file size of 5 MB.
* **FR-DIS-02 (MobileNetV3 Inference):** The ML service shall preprocess images to $224 \times 224$ pixels, normalize using ImageNet mean/standard deviation, and execute inference via MobileNetV3 Small across 38 classes.
* **FR-DIS-03 (Confidence Threshold Safeguard):** Predictions with softmax confidence $\ge 0.70$ (70%) shall be flagged as `status: 'confident'`. Predictions with confidence $< 0.70$ shall be flagged as `status: 'uncertain'`.
* **FR-DIS-04 (Actionable Knowledge Base Enrichment):** For confident predictions, the system shall query MongoDB (`DiseaseInformation`) to append university-extension-verified symptoms, causes, cultural prevention, and chemical management strategies. For uncertain predictions, chemical management advice is strictly withheld to prevent inappropriate pesticide application.

### 4.6 Module 6: Mandi Market Prices & Commodity Intelligence
* **FR-MKT-01 (Data.gov.in Integration):** The backend shall query official Agmarknet wholesale mandi prices via the Data.gov.in API filtering by State and District.
* **FR-MKT-02 (Commodity Canonicalization):** Over 40 regional and official Agmarknet commodity strings shall be canonicalized into standard English and ML targets (e.g., "Paddy (Dhan)(Common)" $\rightarrow$ "Rice").
* **FR-MKT-03 (Data Freshness & Median Aggregation):** Records older than 30 days shall be classified as `stale`. Multiple mandi listings for a single commodity within a district shall be aggregated using the median modal price to insulate against reporting anomalies.

### 4.7 Module 7: Historical Crop Rotation Cycles
* **FR-HIST-01 (Crop History Recording):** Users shall record historical crop cycles (`crop`, `season`, `year`, `notes`) tied to a farm parcel.
* **FR-HIST-02 (Timeline Visualization):** Users shall view, update, and delete historical records sorted in reverse-chronological order.

### 4.8 Module 8: Bilingual Localization (English & Hindi)
* **FR-I18N-01 (Language Selector):** A language switcher in the navigation bar shall allow users to toggle between English and Hindi (`हिंदी`).
* **FR-I18N-02 (Full Application Translation):** All navigation, forms, validation messages, error banners, empty states, and dynamic advisory cards shall translate dynamically without full-page reloads.
* **FR-I18N-03 (Client-Side Preference Persistence):** The selected language preference shall be persisted in browser `localStorage` and restored upon refresh or cross-route navigation.
* **FR-I18N-04 (Data Integrity Preservation):** Scientific crop names, disease classification codes, database IDs, and API payloads shall remain uncorrupted and untranslated.

---

## 5. Non-Functional Requirements

### 5.1 Performance Requirements
* **NFR-PERF-01 (ML Inference Latency):** Random Forest crop recommendation inference shall complete in $< 50\text{ ms}$; MobileNetV3 leaf disease inference on CPU shall complete in $< 350\text{ ms}$.
* **NFR-PERF-02 (API Response Time):** Database-backed CRUD operations shall respond in $< 200\text{ ms}$ under local network conditions.
* **NFR-PERF-03 (Client Bundle Size):** Production Vite bundle shall remain under $500\text{ KB}$ gzipped to ensure rapid mobile loading over 4G rural cellular networks.

### 5.2 Security Requirements
* **NFR-SEC-01 (Password Encryption):** User passwords must never be stored in plaintext. They shall be hashed using `bcryptjs` with salt work factor of 10.
* **NFR-SEC-02 (Stateless JWT Verification):** All private API routes must require an `Authorization: Bearer <token>` header verified cryptographically against `JWT_SECRET`.
* **NFR-SEC-03 (CORS Policy Hardening):** Cross-Origin Resource Sharing (CORS) shall explicitly whitelist approved browser origins (`http://localhost:3000`). Wildcard `*` origins are strictly prohibited.
* **NFR-SEC-04 (Brute-Force Protection):** Authentication endpoints shall enforce sliding-window IP rate limiting (10 requests / 15 minutes).
* **NFR-SEC-05 (Server-to-Server Isolation):** The Python ML microservice (Port 8000) shall be configured for server-to-server communication from the Express API (Port 5000) and reject untrusted browser requests in production.

### 5.3 Reliability and Availability
* **NFR-REL-01 (Microservice Fault Isolation):** Failure or unreachability of the Python ML microservice shall be caught by the Express gateway and returned as a controlled HTTP 503 error, preventing Node.js process crashes.
* **NFR-REL-02 (Third-Party API Graceful Degradation):** Unavailability of Open-Meteo, ISRIC SoilGrids, or Data.gov.in APIs shall fall back to manual entry or cached regional baselines without blocking core application workflows.

### 5.4 Usability & Accessibility
* **NFR-USE-01 (Mobile Responsiveness):** The application layout shall seamlessly adapt across mobile viewports ($375\text{px}$ width) to high-resolution desktop monitors ($1920\times1080\text{px}$) utilizing Tailwind CSS responsive breakpoints and an off-canvas navigation drawer.
* **NFR-USE-02 (Farmer-Centric Language):** Hindi translations shall use clear, natural Devanagari script suited to rural Indian farmers, avoiding awkward literal machine translations.

---

## 6. Hardware & Software Requirements

### 6.1 Hardware Requirements
* **Development & Evaluation Environment:**
  * Processor: Intel Core i5 / AMD Ryzen 5 or higher (minimum 4 cores, 2.0 GHz).
  * RAM: 8 GB minimum (16 GB recommended for PyTorch model inference and Node dev server).
  * Storage: 5 GB available SSD storage.
* **Client / End-User Hardware:**
  * Any smartphone, tablet, or desktop running a modern web browser.
  * Minimum Display Resolution: $360\times640\text{ pixels}$.
  * Network: 3G / 4G / Wi-Fi broadband internet connection.

### 6.2 Software Requirements
* **Operating System:** Cross-platform (Windows 10/11, Ubuntu 20.04/22.04 LTS, macOS Ventura+).
* **Runtime Environments:**
  * Node.js: v18.0.0 to v24.x
  * Python: v3.10 to v3.13 (with standard venv virtual environment)
* **Database Management System:**
  * MongoDB: v6.0+ Community Server or MongoDB Atlas.
* **Core Libraries & Frameworks:**
  * Backend: Express 4.18, Mongoose 7.5, jsonwebtoken 9.0, bcryptjs 2.4, cors 2.8, multer 1.4.
  * ML Service: FastAPI 0.104, Uvicorn 0.23, PyTorch 2.1+, torchvision 0.16+, scikit-learn 1.3, joblib 1.3, Pillow 10.0, pandas 2.1, numpy 1.26.
  * Frontend: React 18.2, Vite 4.5, React Router v7, Tailwind CSS 3.3.
* **External Web APIs:**
  * Open-Meteo Weather API (`api.open-meteo.com`)
  * ISRIC World Soil Information SoilGrids v2.0 (`rest.isric.org`)
  * OpenStreetMap Nominatim Geocoding API (`nominatim.openstreetmap.org`)
  * Government of India Open Data Agmarknet Mandi Prices (`api.data.gov.in`)

---

## 7. Assumptions, Dependencies, and Constraints

1. **Rainfall Distribution Baseline:** The 2,200-row benchmark dataset used to train the Random Forest crop recommendation model does not document the precise temporal rainfall accumulation period (e.g. 30-day monsoon total vs. annual cumulative mm). The platform treats rainfall as an advisory decision parameter and advises farmers to verify with local Krishi Vigyan Kendras (KVKs).
2. **Third-Party SLA Independence:** Public APIs (Open-Meteo, Data.gov.in, ISRIC) do not provide guaranteed commercial Service Level Agreements. The system implements caching, timeouts, and local defaults to insulate against outages.
3. **Advisory Scope:** KrishiMitra AI outputs represent verified statistical and deep learning inferences. They are intended as intelligent decision support tools and do not constitute legal guarantees or certified pesticide prescriptions.
