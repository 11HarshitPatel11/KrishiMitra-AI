# Step 24.19 — Controlled Live Integration Test Preparation Plan

**Project:** KrishiMitra AI (Crop Recommendation & Plant Disease Detection System)  
**Path:** `C:\Users\Harshit Patel\Desktop\Crop_Pridiction_final`  
**Date:** October 25, 2026  
**Status:** Preflight Complete — Ready for Execution Pending User Approval  

---

## 1. Preflight Inspection Findings

### 1.1 MongoDB Installation & Configuration
* **Binary Location:** `C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe` (MongoDB Community Server v8.0, in PATH).
* **Shell Client:** `C:\Users\Harshit Patel\AppData\Local\Programs\mongosh\mongosh.exe` (mongosh, in PATH).
* **Configuration File:** `C:\Program Files\MongoDB\Server\8.0\bin\mongod.cfg`.
* **Data Directory:** `C:\Program Files\MongoDB\Server\8.0\data` (Existing directory with active WiredTiger collections).
* **Windows Service Registration:** Registered in Windows Registry as `MongoDB Server (MongoDB)` pointing to:
  `"C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe" --config "C:\Program Files\MongoDB\Server\8.0\bin\mongod.cfg" --service`.
* **Configured Database Name:** `crop_db` (configured in `server/.env`).

### 1.2 Microservice Ports & Port Availability
Port audit executed via `Get-NetTCPConnection`:

| Subsystem | Target Port | Current State | Port Availability |
| :--- | :---: | :---: | :---: |
| MongoDB Daemon | `27017` | Not Listening | **Available** |
| Node.js Express API Gateway | `5000` | Not Listening | **Available** |
| Python FastAPI ML Microservice | `8000` | Not Listening | **Available** |
| React Vite Client (Optional) | `3000` | Not Listening | **Available** |

*All target ports are completely free and ready for binding.*

### 1.3 ML Model Artifacts & Python Runtime
* **Crop Recommendation Artifacts:**
  - `ml-service/artifacts/crop_random_forest.joblib` (3.5 MB)
  - `ml-service/artifacts/crop_label_encoder.joblib` (696 B)
* **Plant Disease Detection Artifacts:**
  - `ml-service/artifacts/disease/disease_mobilenet_v3_small.pt` (6.2 MB)
  - `ml-service/artifacts/disease/disease_class_names.json` (1.5 KB)
* **Python Virtual Environment:** `ml-service\disease-venv` is fully provisioned with `fastapi`, `uvicorn`, `torch` (2.14.1+cpu), `torchvision` (0.29.1+cpu), `pillow` (12.3.0), and `python-multipart` (0.0.32).
* **Existing Test Image:**
  `ml-service\datasets\PlantVillage\test\Tomato___Early_blight\0012b9d2-2130-4a06-a834-b1f3af34f57e___RS_Erly.B 8389.JPG` (32.8 KB).

### 1.4 Frontend Vite Dev Server Requirement
* **Headless Integration Testing:** A running Vite server on port 3000 is **not** required for testing the Express → FastAPI → Model pipeline via HTTP requests (`curl` or Node test harnesses).
* **Browser Interactive UI Testing:** Running `npm run dev` in `client/` is only required if testing the React web application visually in a live browser window.

---

## 2. Service Startup & Shutdown Commands

To maintain transparency, observability, and graceful control, services should be launched in visible terminal windows:

### 2.1 Terminal 1 — MongoDB (Port 27017)
```powershell
# Visible terminal command:
& "C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe" --config "C:\Program Files\MongoDB\Server\8.0\bin\mongod.cfg"
```
* **Readiness Verification:** `mongosh --quiet --eval "db.runCommand({ ping: 1 })"` returns `{ ok: 1 }`.
* **Safe Shutdown:** Press `Ctrl+C` in Terminal 1. WiredTiger will safely flush the journal and exit cleanly without data corruption.

### 2.2 Terminal 2 — FastAPI ML Service (Port 8000)
```powershell
cd "C:\Users\Harshit Patel\Desktop\Crop_Pridiction_final\ml-service"
& .\disease-venv\Scripts\uvicorn.exe app.main:app --host 127.0.0.1 --port 8000
```
* **Readiness Verification:** `curl http://127.0.0.1:8000/health` returns `crop_model_loaded: true` and `disease_model_loaded: true`.
* **Safe Shutdown:** Press `Ctrl+C` in Terminal 2. Uvicorn handles SIGINT and unloads model artifacts gracefully.

### 2.3 Terminal 3 — Node.js Express Backend (Port 5000)
```powershell
cd "C:\Users\Harshit Patel\Desktop\Crop_Pridiction_final\server"
npm start
```
* **Readiness Verification:** `curl http://localhost:5000/api/v1/health` returns `status: "success"`.
* **Safe Shutdown:** Press `Ctrl+C` in Terminal 3.

---

## 3. Data Safety & Environment Isolation

1. **No Database Overwrite:** Starting MongoDB using `--config "C:\Program Files\MongoDB\Server\8.0\bin\mongod.cfg"` reuses the existing `C:\Program Files\MongoDB\Server\8.0\data` path. No new data directory will be created, and no database files will be initialized or overwritten.
2. **Read-Only / Pure ML Endpoints:**
   - `POST /api/v1/recommendations/predict`: Evaluates the 7 canonical features, queries read-only market prices, and calls FastAPI. It writes zero records to MongoDB when executed without a saved farm.
   - `POST /api/v1/disease/predict`: Reads image bytes, forwards them to FastAPI, and queries the read-only `DiseaseInformation` collection. No database mutations occur.
3. **No Secret Leaks:** Full connection strings, database credentials, and JWT signing keys remain in `server/.env` and are never logged or transmitted over non-local networks.

---

## 4. Controlled Live Integration Test Sequence

```text
[Step 1: MongoDB Ping] ──► [Step 2: FastAPI Health] ──► [Step 3: Express Health]
                                                               │
                                                               ▼
[Step 5: Disease Inference] ◄── [Step 4: Crop Inference]
```

### Step 1: Verify MongoDB Daemon
* **Command:** `& "C:\Users\Harshit Patel\AppData\Local\Programs\mongosh\mongosh.exe" --quiet --eval "db.runCommand({ ping: 1 })"`
* **Expected Output:** `{ ok: 1 }`

### Step 2: Verify FastAPI Microservice Health
* **Command:** `curl.exe -s http://127.0.0.1:8000/health`
* **Expected Status:** `200 OK`
* **Expected JSON:**
  ```json
  {
    "status": "success",
    "message": "ML Service is running",
    "crop_model_loaded": true,
    "disease_model_loaded": true
  }
  ```

### Step 3: Verify Express Backend API Health
* **Command:** `curl.exe -s http://localhost:5000/api/v1/health`
* **Expected Status:** `200 OK`
* **Expected JSON:**
  ```json
  {
    "status": "success",
    "message": "Backend is running"
  }
  ```

### Step 4: Real Crop Recommendation Inference (Express → FastAPI)
* **Command:**
  ```powershell
  curl.exe -s -X POST http://localhost:5000/api/v1/recommendations/predict `
    -H "Content-Type: application/json" `
    -d "{\"nitrogen\":90,\"phosphorus\":42,\"potassium\":43,\"temperature\":20.87,\"humidity\":82.0,\"pH\":6.5,\"rainfall\":202.93}"
  ```
* **Expected Status:** `200 OK`
* **Verification Invariants:**
  - Response contains `success: true`.
  - Exactly 5 ranked crop recommendations returned.
  - Top crop is `rice` with probability >= 0.85.
  - Zero state/district parameters passed to FastAPI ML microservice.

### Step 5: Real Plant Disease Detection Inference (Express → FastAPI)
* **Command:**
  ```powershell
  curl.exe -s -X POST http://localhost:5000/api/v1/disease/predict `
    -F "file=@ml-service/datasets/PlantVillage/test/Tomato___Early_blight/0012b9d2-2130-4a06-a834-b1f3af34f57e___RS_Erly.B 8389.JPG"
  ```
* **Expected Status:** `200 OK`
* **Verification Invariants:**
  - Response contains `success: true`.
  - Returns `prediction.className`, `prediction.confidence`, and `prediction.status`.
  - Returns array of top 3 candidate disease predictions.
  - Safely gates medical/treatment advice (`informationStatus: "withheld_due_to_uncertainty"` if confidence < 0.70).

---

## 5. Potential Blockers & Pre-Test Assessment

* **Current Blockers:** None. All prerequisites (Python dependencies in `disease-venv`, model files, binaries for mongod/mongosh, ports 27017/5000/8000) are verified and intact.
* **Next Step:** Awaiting user approval to launch the services and proceed with the test sequence.
