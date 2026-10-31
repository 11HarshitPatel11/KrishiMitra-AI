# Data Flow Diagram (DFD) — Level 1
## KrishiMitra AI Platform

This document presents the **Level 1 Data Flow Diagram (DFD)** for **KrishiMitra AI**. It decomposes the main process into seven implemented functional subsystems, illustrating the flow of data between processes, external entities, and persistent MongoDB collections / ML artifacts.

---

## 1. DFD Level 1 Diagram (Mermaid)

```mermaid
flowchart TD
    %% External Entities
    User["👨‍🌾 Farmer / User"]
    Meteo["☀️ Open-Meteo API"]
    SoilGrids["🌍 ISRIC SoilGrids API"]
    Agmarknet["📈 Data.gov.in Agmarknet API"]
    OSM["📍 OSM Nominatim API"]

    %% Data Stores
    subgraph DataStores["💾 MongoDB Database Collections & ML Artifacts"]
        D1[("D1: users")]
        D2[("D2: farms")]
        D3[("D3: soilinformations")]
        D4[("D4: externalsoilinformations")]
        D5[("D5: crophistories")]
        D6[("D6: diseaseinformations")]
        M1[("M1: ML Model Artifacts<br/>(RandomForest & MobileNetV3)")]
    end

    %% Implemented Subsystems / Processes
    subgraph Subsystems["⚙️ KrishiMitra Core Subsystems"]
        P1(("1.0<br/>Authentication &<br/>Profile Management"))
        P2(("2.0<br/>Farm Parcel & GPS<br/>Location Management"))
        P3(("3.0<br/>Soil Analysis &<br/>SoilGrids Sync"))
        P4(("4.0<br/>Multi-Factor Crop<br/>Recommendation Engine"))
        P5(("5.0<br/>Deep Learning Plant<br/>Disease Detection"))
        P6(("6.0<br/>Mandi Market<br/>Intelligence Engine"))
        P7(("7.0<br/>Crop Rotation &<br/>History Tracking"))
    end

    %% 1.0 Auth Flows
    User -->|Register / Login credentials| P1
    P1 -->|Hash & store user profile| D1
    D1 -->|Read user & verify bcrypt hash| P1
    P1 -->|Issue signed JWT Token & profile| User

    %% 2.0 Farm Flows
    User -->|Farm params, area, NPK, pH| P2
    User -->|GPS coordinates via browser API| P2
    P2 -->|Reverse-geocode coordinates| OSM
    OSM -->|Administrative district & state| P2
    P2 -->|Store farm document with userId| D2
    D2 -->|Fetch user-scoped farms| P2
    P2 -->|Check dependent child records before delete| D3
    P2 -->|Check dependent child records before delete| D5
    P2 -->|Farm profile & coordinate feedback| User

    %% 3.0 Soil Analysis Flows
    User -->|Manual field soil test data| P3
    P3 -->|Store manual soil record| D3
    D3 -->|Retrieve farm soil chemistry| P3
    User -->|Trigger SoilGrids Sync| P3
    P3 -->|Query raster soil properties| SoilGrids
    SoilGrids -->|Raw integer mean values| P3
    P3 -->|Fallback: Calibrated regional baseline| P3
    P3 -->|Store normalized soil profile| D4
    D4 -->|Retrieve cached SoilGrids profile| P3
    P3 -->|Display 7-layer soil health profile| User

    %% 4.0 Crop Recommendation Flows
    User -->|7 features (NPK, pH, Rainfall, Farm ID)| P4
    P4 -->|Request real-time weather| Meteo
    Meteo -->|Temperature & Humidity| P4
    P4 -->|Canonical 7-feature vector| M1
    M1 -->|Random Forest predict_proba()| P4
    P4 -->|Fetch previous crop for rotation check| D5
    P4 -->|Query candidate prices| P6
    P4 -->|Compute composite Final Score & rank| P4
    P4 -->|Top 5 recommended crops & scores| User

    %% 5.0 Disease Detection Flows
    User -->|Upload leaf photograph| P5
    P5 -->|Preprocess 224x224 tensor| M1
    M1 -->|MobileNetV3 Softmax probabilities| P5
    P5 -->|Check 70% confidence threshold| P5
    P5 -->|Query diseaseCode profile| D6
    D6 -->|Extension-verified symptoms, IPM guide| P5
    P5 -->|Confident / Uncertain diagnosis & treatment| User

    %% 6.0 Market Intelligence Flows
    User -->|State & District search query| P6
    P6 -->|Query APMC daily listings| Agmarknet
    Agmarknet -->|Wholesale records| P6
    P6 -->|Canonicalize names & median filter| P6
    P6 -->|Mandi prices, trends & demand signals| User

    %% 7.0 Crop History Flows
    User -->|Record harvest: crop, season, year| P7
    P7 -->|Store crop history document| D5
    D5 -->|Retrieve chronological crop timeline| P7
    P7 -->|Crop rotation history display| User
```

---

## 2. Process Decomposition Summary

| Process ID | Process Name | Inputs | Outputs | Connected Stores & Services |
| :---: | :--- | :--- | :--- | :--- |
| **1.0** | Authentication & Profile Management | Credentials, Profile updates | Signed JWT, User profile | `D1: users`, In-memory Rate Limiter |
| **2.0** | Farm Parcel & GPS Location Management | Farm geometry, NPK, GPS coordinates | Farm records, Resolved address | `D2: farms`, `D3`, `D5`, OSM Nominatim |
| **3.0** | Soil Analysis & SoilGrids Sync | Lab soil test, Sync trigger | Calibrated soil profile | `D3: soilinformations`, `D4: externalsoilinformations`, ISRIC SoilGrids |
| **4.0** | Multi-Factor Crop Recommendation Engine | 7 features, Farm ID, Rainfall | Top 5 ranked crops, Scores | `M1: crop_random_forest.joblib`, `D5`, Open-Meteo, Process 6.0 |
| **5.0** | Deep Learning Plant Disease Detection | Leaf image (JPEG/PNG/WebP) | Diagnosis, Symptoms, IPM guide | `M1: disease_mobilenet_v3_small.pt`, `D6: diseaseinformations` |
| **6.0** | Mandi Market Intelligence Engine | State, District query | Median prices, Demand signals | Data.gov.in Agmarknet API |
| **7.0** | Crop Rotation & History Tracking | Crop, Season, Harvest Year | Cropping timeline | `D5: crophistories` |
