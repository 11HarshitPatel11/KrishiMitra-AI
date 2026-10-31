# Entity-Relationship (ER) Diagram
## KrishiMitra AI Data Architecture

This document specifies the conceptual and logical Entity-Relationship model for **KrishiMitra AI**, derived strictly from the implemented Mongoose schemas in `server/src/models/`.

---

## 1. Entity-Relationship Diagram (Mermaid)

```mermaid
erDiagram
    USER ||--o{ FARM : "owns (1:N)"
    USER ||--o{ SOIL_INFORMATION : "records (1:N)"
    USER ||--o{ EXTERNAL_SOIL_INFORMATION : "synchronizes (1:N)"
    USER ||--o{ CROP_HISTORY : "tracks (1:N)"

    FARM ||--o| SOIL_INFORMATION : "has current (1:1 unique)"
    FARM ||--o| EXTERNAL_SOIL_INFORMATION : "has cached (1:1 unique)"
    FARM ||--o{ CROP_HISTORY : "has historical (1:N)"

    USER {
        ObjectId _id PK "Unique identifier"
        string name "Full farmer name"
        string email UK "Unique lowercase login email"
        string password "Bcrypt hashed password (cost: 10)"
        string mobileNumber "Optional contact number"
        string location "Optional state / district string"
        Date createdAt "Timestamp of creation"
        Date updatedAt "Timestamp of modification"
    }

    FARM {
        ObjectId _id PK "Unique identifier"
        ObjectId userId FK "Reference to User._id (Indexed)"
        string farmName "Descriptive parcel name"
        number area "Land area magnitude (> 0)"
        string areaUnit "Unit: 'acre' or 'hectare'"
        number nitrogen "Soil Nitrogen (N >= 0)"
        number phosphorus "Soil Phosphorus (P >= 0)"
        number potassium "Soil Potassium (K >= 0)"
        number pH "Soil pH value (0 - 14)"
        number latitude "Optional latitude (-90 to 90)"
        number longitude "Optional longitude (-180 to 180)"
        string location "Optional address / reverse-geocoded text"
        Date createdAt "Timestamp of creation"
        Date updatedAt "Timestamp of modification"
    }

    SOIL_INFORMATION {
        ObjectId _id PK "Unique identifier"
        ObjectId userId FK "Reference to User._id (Indexed)"
        ObjectId farmId FK "Reference to Farm._id (Compound Unique UK)"
        string soilType "Textual soil category (e.g. Alluvial)"
        number pH "Soil pH (0 - 14)"
        number nitrogen "Total Nitrogen >= 0"
        number phosphorus "Available Phosphorus >= 0"
        number potassium "Available Potassium >= 0"
        number moisture "Moisture percentage >= 0"
        string source "Enum: 'manual' or 'external'"
        string notes "Agronomic observation notes"
        Date createdAt "Timestamp of creation"
        Date updatedAt "Timestamp of modification"
    }

    EXTERNAL_SOIL_INFORMATION {
        ObjectId _id PK "Unique identifier"
        ObjectId userId FK "Reference to User._id (Indexed)"
        ObjectId farmId FK "Reference to Farm._id (Compound Unique UK)"
        string source "Default: 'soilgrids'"
        number latitude "Geographical latitude of sample"
        number longitude "Geographical longitude of sample"
        Mixed properties "Structured 7-layer ISRIC depth arrays"
        Date retrievedAt "Timestamp of API synchronization"
        Date createdAt "Timestamp of creation"
        Date updatedAt "Timestamp of modification"
    }

    CROP_HISTORY {
        ObjectId _id PK "Unique identifier"
        ObjectId userId FK "Reference to User._id (Indexed)"
        ObjectId farmId FK "Reference to Farm._id (Indexed)"
        string crop "Recorded crop name (lowercase)"
        string season "Enum: 'Kharif', 'Rabi', 'Zaid', 'Other'"
        number year "Harvest year (1900 to Year+5)"
        string notes "Agronomic yield / rotation notes"
        Date createdAt "Timestamp of creation"
        Date updatedAt "Timestamp of modification"
    }

    DISEASE_INFORMATION {
        ObjectId _id PK "Unique identifier"
        string diseaseCode UK "Class identifier matching MobileNetV3 (Indexed)"
        string crop "Affected host plant (e.g. Tomato)"
        string name "Human-readable pathology name"
        Array symptoms "Array of diagnostic visual symptoms"
        Array causes "Array of fungal/bacterial/viral causal agents"
        Array prevention "Cultural and bio-control prevention methods"
        Array management "Integrated Pest Management (IPM) controls"
        string sourceName "University extension bulletin / citation"
        string sourceUrl "Official extension literature URL"
        string limitations "Safety precautions and diagnostic limitations"
        Date createdAt "Timestamp of creation"
        Date updatedAt "Timestamp of modification"
    }
```

---

## 2. Structural Relationships & Cardinality Analysis

### 2.1 User to Farm (1:N)
* **Cardinality:** One-to-Many (`1` to `0..*`).
* **Foreign Key:** `Farm.userId` $\rightarrow$ `User._id`.
* **Business Rules:**
  * A farmer may register multiple agricultural parcels (e.g., "Kalyan Plot", "South Orchard").
  * Multi-tenant isolation is enforced at the database level by indexing `Farm.userId`.

### 2.2 Farm to Soil Information (1:1 Compound Unique)
* **Cardinality:** One-to-One (`1` to `0..1` per user/farm).
* **Foreign Key:** `SoilInformation.farmId` $\rightarrow$ `Farm._id`, `SoilInformation.userId` $\rightarrow$ `User._id`.
* **Constraint:** A compound unique index `{ farmId: 1, userId: 1 }` guarantees that each farm parcel possesses at most one active laboratory soil test record.

### 2.3 Farm to External Soil Information (1:1 Compound Unique)
* **Cardinality:** One-to-One (`1` to `0..1` per user/farm).
* **Foreign Key:** `ExternalSoilInformation.farmId` $\rightarrow$ `Farm._id`, `ExternalSoilInformation.userId` $\rightarrow$ `User._id`.
* **Constraint:** A compound unique index `{ farmId: 1, userId: 1 }` guarantees that each parcel maintains a single cached snapshot of ISRIC SoilGrids v2.0 raster layers.

### 2.4 Farm to Crop History (1:N)
* **Cardinality:** One-to-Many (`1` to `0..*`).
* **Foreign Key:** `CropHistory.farmId` $\rightarrow$ `Farm._id`, `CropHistory.userId` $\rightarrow$ `User._id`.
* **Index:** Compound index on `{ userId: 1, farmId: 1 }` enables high-speed retrieval of historical crop sequences for monoculture rotation penalty calculation.

### 2.5 Standalone Master Collection: Disease Information
* **Collection:** `diseaseinformations`
* **Nature:** Static reference knowledge base seeded with 26 university-extension-verified disease profiles.
* **Linkage:** Correlated dynamically at runtime via `diseaseCode` (e.g., `Tomato___Early_blight`) produced by the MobileNetV3 Small deep learning classifier.
