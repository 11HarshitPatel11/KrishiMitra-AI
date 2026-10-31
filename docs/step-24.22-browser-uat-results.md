# STEP 24.22 — Interactive Browser End-to-End User Acceptance Testing (UAT) Report

**Project:** KrishiMitra AI (`Crop_Pridiction_final`)  
**Execution Date:** October 25, 2026  
**Test Runner:** Puppeteer Chrome (`run_browser_uat.mjs`)  
**Scope:** Full-Stack Browser Automation (React Client $\to$ Express Gateway $\to$ FastAPI ML $\to$ Models + MongoDB)  
**Overall UAT Verdict:** **PASS (7 / 7 Workflows Passing, 0 Defects, 15 Screenshots Captured)**

---

## 1. Executive Summary

In Step 24.22, KrishiMitra AI was subjected to an automated, end-to-end interactive User Acceptance Testing (UAT) suite running inside an actual Chromium browser (`Chrome/154.0.8037.57`). Unlike unit tests or mock HTTP invocations, this suite exercised the real user workflows across the complete application stack:

$$\text{React 18 SPA (Port 3000)} \iff \text{Express Backend (Port 5000)} \iff \text{FastAPI (Port 8000)} \iff \text{MongoDB (Port 27017)}$$

All user-facing workflows—including authentication, farm management, weather-integrated crop recommendation, market queries, disease detection with uncertainty safety gating, responsive mobile navigation, and session termination—were verified in the live browser DOM.

### Key Highlights
* **Automated Browser Automation:** 100% of interactions (clicks, keyboard input, file uploads, navigations) were executed via Puppeteer in Chrome.
* **Full Stack Verification:** Real Random Forest crop recommendation inference and MobileNetV3 disease inference were triggered from the UI and rendered in the DOM.
* **Safety Gating in Browser:** Clinical safety was confirmed in the browser DOM: an uncertain plant disease prediction properly activated the warning state (`Prediction is uncertain`) and strictly suppressed chemical treatment advice.
* **Database & Process Hygiene:** All UAT test farms and users were deleted upon completion; all 41 pre-existing user accounts and 17 farms were preserved intact. All spawned child processes were terminated cleanly.

---

## 2. Test Environment & Stack Configuration

| Layer | Component | Version / Runtime | Port / Target | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Browser Runner** | Chromium (Puppeteer) | Chrome/154.0.8037.57 | Headless (1280x800 & 375x667) | Verified |
| **Frontend Client** | React 18 / Vite / Tailwind | Vite 4.5.14, React 18.2.0 | `http://localhost:3000` | Verified |
| **Backend Gateway** | Node.js Express Gateway | Node v24.11.1, Express 4.18.2 | `http://localhost:5000` | Verified |
| **ML Microservice** | FastAPI / Uvicorn | FastAPI 0.115.0, Python 3.10 | `http://127.0.0.1:8000` | Verified |
| **Database** | MongoDB Community Service | WiredTiger Engine | `127.0.0.1:27017/crop_db` | Verified |
| **ML Models** | Random Forest + MobileNetV3 | PyTorch 2.4.1+cpu, Sklearn 1.3.0 | Real `.pkl` & `.pth` artifacts | Verified |

---

## 3. Detailed Workflow Results Matrix

| Test ID | Workflow Category | Primary User Action | Verified DOM Assertion | Verdict |
| :--- | :--- | :--- | :--- | :--- |
| **UAT-NAV-01** | Navigation & Routing | Unauthenticated visit to `/` and invalid route `/unknown-route-test-404` | Redirects to `/login`; Header displays "KrishiMitra AI"; 404 displays "Page Not Found" | **PASS** |
| **UAT-AUTH-01** | Authentication & Session | Farmer registration, invalid login test, and valid login with JWT storage | Form validation tooltips; HTTP 401 triggers "Invalid credentials"; valid login stores JWT and redirects to `/recommendation` | **PASS** |
| **UAT-FARM-01** | Farm Management | Create "UAT Punjab Wheat Farm", verify card rendering, edit farm name in modal | Form submits; card renders with N/P/K/pH/coords; modal updates title to "UAT Punjab Wheat Farm (Updated)" | **PASS** |
| **UAT-REC-01** | Soil & Recommendation | Auto-fill farm properties, verify rainfall guidance, fetch live weather, run ML prediction | `#rainfall-guidance` callout verified; Open-Meteo fetches temp/humidity; RF model returns ranked crops (🥇 Coffee, 🥈 Rice, 🥉 Jute) | **PASS** |
| **UAT-MKT-01** | Market Intelligence | Filter commodity (Rice) & state (Punjab) | Form submits; advisory limitation disclaimer rendered in DOM | **PASS** |
| **UAT-DIS-01** | Disease Detection | Upload text file (invalid) then real leaf image (`Tomato___Early_blight`) | Invalid file rejected with "Unsupported file type"; real inference triggers "Prediction is uncertain"; chemical advice withheld | **PASS** |
| **UAT-SEC-01** | Mobile Nav & Route Protection | Crop history view, 375px mobile drawer toggle, logout, and protected route probe | Mobile drawer toggles cleanly; logout purges JWT; unauthenticated `/farms` request redirects to `/login` | **PASS** |

---

## 4. Screenshot Evidence Inventory

All 15 screenshots were captured directly from the live browser DOM and stored in [`docs/screenshots/uat/`](file:///c:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/docs/screenshots/uat/):

| # | Screenshot Filename | Workflow | Captured Visual State |
| :--- | :--- | :--- | :--- |
| 1 | [`01_404_not_found.png`](file:///c:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/docs/screenshots/uat/01_404_not_found.png) | Navigation | Custom 404 error page with "Page Not Found" and recovery button |
| 2 | [`02_login_page.png`](file:///c:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/docs/screenshots/uat/02_login_page.png) | Authentication | "Farmer Login" view with email/password inputs and register link |
| 3 | [`03_register_validation.png`](file:///c:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/docs/screenshots/uat/03_register_validation.png) | Authentication | Registration form with validation constraints |
| 4 | [`04_invalid_login.png`](file:///c:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/docs/screenshots/uat/04_invalid_login.png) | Authentication | Error banner with "Invalid credentials" upon bad password submission |
| 5 | [`05_authenticated_dashboard.png`](file:///c:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/docs/screenshots/uat/05_authenticated_dashboard.png) | Navigation | Authenticated main dashboard with active navigation tabs and Logout button |
| 6 | [`06_farm_created.png`](file:///c:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/docs/screenshots/uat/06_farm_created.png) | Farm Management | Success banner "Farm information created successfully" and form cleared |
| 7 | [`07_farm_edited.png`](file:///c:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/docs/screenshots/uat/07_farm_edited.png) | Farm Management | Farm card updated to "UAT Punjab Wheat Farm (Updated)" with N=85, P=40, K=42, pH=6.5 |
| 8 | [`08_soil_page.png`](file:///c:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/docs/screenshots/uat/08_soil_page.png) | Soil Information | "Soil Information Management" view with SoilGrids external synchronization panel |
| 9 | [`09_recommendation_flow.png`](file:///c:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/docs/screenshots/uat/09_recommendation_flow.png) | Recommendation | Ranked prediction result cards: 🥇 Coffee (50%), 🥈 Rice (27%), 🥉 Jute (19%) |
| 10 | [`10_market_page.png`](file:///c:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/docs/screenshots/uat/10_market_page.png) | Market Intelligence | Filtered commodity search and Mandi market advisory disclaimer |
| 11 | [`11_disease_invalid_file.png`](file:///c:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/docs/screenshots/uat/11_disease_invalid_file.png) | Disease Detection | Error banner: "Unsupported file type. Allowed types: image/jpeg, image/png, image/webp" |
| 12 | [`12_disease_uncertain_result.png`](file:///c:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/docs/screenshots/uat/12_disease_uncertain_result.png) | Disease Detection | Uncertainty card: "Prediction is uncertain", top 3 tentative outputs, no chemical treatments |
| 13 | [`13_crop_history.png`](file:///c:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/docs/screenshots/uat/13_crop_history.png) | Crop History | Crop history management view with "+ Add Crop History" action button |
| 14 | [`14_mobile_nav_open.png`](file:///c:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/docs/screenshots/uat/14_mobile_nav_open.png) | Mobile Navigation | Responsive mobile menu drawer opened at 375x667 viewport showing all 6 sections |
| 15 | [`15_logout_protected_route.png`](file:///c:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/docs/screenshots/uat/15_logout_protected_route.png) | Security | Direct URL probe to `/farms` post-logout redirected to `/login` |

---

## 5. Clinical Safety & Production Gating Analysis

### 5.1 Uncertainty Gating in Live Browser DOM
During Workflow F, a genuine PlantVillage leaf image (`Tomato___Early_blight`) was uploaded through the React file picker. The MobileNetV3 model produced a low-confidence top prediction (50.1%).
* **Safety Mechanism:** The uncertainty safety gate fired as designed.
* **DOM Verification:** The UI displayed the yellow warning banner `"Prediction is uncertain"` rather than a false-positive diagnosis.
* **Chemical Treatment Suppression:** All pesticide and fungicide treatment recommendations were strictly withheld from the DOM, protecting the user from improper agronomic interventions.

### 5.2 Rainfall Transparency Verification
During Workflow D, the `#rainfall-guidance` container was verified in the live DOM. The callout clearly informs the farmer:
1. Rainfall is one of seven required model inputs.
2. The public benchmark training dataset does not document accumulation periods.
3. Live instantaneous weather precipitation (often 0 mm) cannot be safely substituted automatically.
4. The farmer must provide reasonable local historical values.

---

## 6. Cleanup & Database Integrity Verification

Immediately following the test execution, the cleanup routine verified database record counts in `crop_db`:

| Collection | Pre-Test Baseline | Test Peak | Post-Cleanup Final | Integrity Status |
| :--- | :---: | :---: | :---: | :--- |
| `users` | 41 | 42 | **41** | **PASS** — Exactly 41 pre-existing accounts preserved |
| `farms` | 17 | 18 | **17** | **PASS** — Exactly 17 pre-existing farms preserved |
| `diseaseinformations` | 26 | 26 | **26** | **PASS** — All 26 pathology profiles preserved |

### Process Termination
* **PID 25320** (Vite Dev Server, port 3000): Terminated (`taskkill /F /T`).
* **PID 17708** (Express Gateway, port 5000): Terminated (`taskkill /F /T`).
* **PID 7064** (FastAPI ML Server, port 8000): Terminated (`taskkill /F /T`).
* **Puppeteer Chrome Browser Process:** Cleanly exited via `browser.close()`.
* **Ports 3000, 5000, 8000:** Confirmed closed and released.

---

## 7. Conclusion

Step 24.22 confirms that KrishiMitra AI functions seamlessly as a complete, unified system in a real browser environment. The React frontend, Express API gateway, FastAPI ML inference engine, machine learning models, and MongoDB database interact correctly, securely, and with verified clinical safety gating.
