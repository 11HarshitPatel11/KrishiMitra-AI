# Data Flow Diagram (DFD) — Level 0 (Context Diagram)
## KrishiMitra AI Platform

This document presents the **Level 0 Data Flow Diagram (Context Diagram)** for **KrishiMitra AI**. It depicts the system as a single high-level process (0.0) interacting with external entities and service providers.

---

## 1. DFD Level 0 (Context Diagram) — Mermaid

```mermaid
flowchart TD
    %% External Entities
    User["👨‍🌾 Farmer / User"]
    Meteo["☀️ Open-Meteo Weather API"]
    SoilGrids["🌍 ISRIC SoilGrids v2.0 API"]
    Agmarknet["📈 Data.gov.in Agmarknet API"]
    OSM["📍 OpenStreetMap Nominatim API"]

    %% Central Process
    System(("0.0<br/><b>KrishiMitra AI System</b><br/>(Agricultural Decision<br/>Support Platform)"))

    %% Inflows from User
    User -->|1. User Credentials (Registration/Login)| System
    User -->|2. Farm Profile & Coordinates (GPS)| System
    User -->|3. Soil Test Parameters (NPK, pH, Moisture)| System
    User -->|4. Recommendation Query (7 features, Rainfall)| System
    User -->|5. Leaf Photograph (Multipart Image)| System
    User -->|6. Crop History Entry (Crop, Season, Year)| System
    User -->|7. Language Selection (English / Hindi)| System

    %% Outflows to User
    System -->|8. Authentication Token (JWT) & Profile Info| User
    System -->|9. Farm Parcel Confirmation & Deletion Status| User
    System -->|10. Laboratory & SoilGrids Soil Intelligence| User
    System -->|11. Top Ranked Crop Recommendations & Scores| User
    System -->|12. Disease Diagnosis & Extension Treatment Guide| User
    System -->|13. Mandi Modal Prices, Trends & Demand Signals| User
    System -->|14. Crop Rotation Timeline & Advisory Notices| User

    %% Inflows & Outflows with External Systems
    System -->|15. Request Current Weather (Lat, Lon)| Meteo
    Meteo -->|16. Temperature (°C) & Relative Humidity (%)| System

    System -->|17. Query Soil Properties (Lon, Lat, 7 Properties)| SoilGrids
    SoilGrids -->|18. Multi-depth Raster Soil Values & Units| System

    System -->|19. Request Mandi Commodity Prices (State, District)| Agmarknet
    Agmarknet -->|20. Wholesale Market Records (Modal Price, Date)| System

    System -->|21. Reverse Geocode Coordinates (Lat, Lon)| OSM
    OSM -->|22. Administrative Address (Village, District, State)| System
```

---

## 2. External Entity Descriptions

1. **Farmer / User:**
   * **Inputs into System:** Registration credentials, farm parameters, GPS coordinates, laboratory soil values, expected rainfall, leaf photographs for diagnosis, and crop rotation history.
   * **Outputs received from System:** JWT tokens, verified crop recommendations with suitability percentages, deep-learning-based disease diagnoses, cultural prevention and IPM chemical treatment protocols, localized mandi prices, and multilingual localized interfaces.
2. **Open-Meteo Weather API:**
   * **Role:** Free, high-accuracy global meteorological service.
   * **Interaction:** Ingests latitude and longitude; provides ambient temperature ($^\circ\text{C}$) and relative humidity ($\%$) to eliminate manual entry errors in the crop recommendation form.
3. **ISRIC SoilGrids v2.0 API:**
   * **Role:** Global digital soil mapping system hosted by World Soil Information (Wageningen, Netherlands).
   * **Interaction:** Supplies depth-stratified predictions for pH, nitrogen, soil organic carbon, sand, silt, clay, and bulk density.
4. **Data.gov.in Agmarknet API:**
   * **Role:** Official open data portal of the Ministry of Agriculture & Farmers Welfare, Government of India.
   * **Interaction:** Supplies daily wholesale market arrivals and modal prices across agricultural produce market committees (APMCs).
5. **OpenStreetMap Nominatim Geocoding API:**
   * **Role:** Open-source geographic search engine.
   * **Interaction:** Translates device GPS coordinates into human-readable administrative district and state strings used for market filtering.
