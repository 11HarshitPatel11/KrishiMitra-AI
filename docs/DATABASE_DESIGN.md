# Database Design & Data Dictionary
## KrishiMitra AI Platform

**Database Management System:** MongoDB (v6.0+)  
**Object Data Modeling (ODM):** Mongoose (v7.5+)  
**Database Name:** `crop_db` (or configurable via `MONGODB_URI`)  

---

## 1. Overview & Architectural Principles

The KrishiMitra AI data architecture is designed for high read throughput, multi-tenant farm isolation, and referential safety within a non-relational document model:
1. **Multi-Tenant User Scoping:** Every user-owned entity (`farms`, `soilinformations`, `externalsoilinformations`, `crophistories`) maintains an indexed foreign reference to `User._id` (`userId`).
2. **Compound Unique Indexes:** Enforces single active states per farm (e.g. one lab soil test and one cached ISRIC SoilGrids record per parcel).
3. **Cascading Delete Protection:** Farm deletion enforces referential integrity at the application controller layer, preventing orphaned records by returning HTTP 409 Conflict if child records exist.
4. **Automated Timestamps:** All collections utilize Mongoose `{ timestamps: true }`, automatically generating `createdAt` and `updatedAt` ISO 8601 UTC timestamps.

---

## 2. Detailed Data Dictionary

### 2.1 Collection: `users`
* **Model Name:** `User` (`server/src/models/user.model.js`)
* **Purpose:** Stores authenticated farmer identities, secure password hashes, and optional regional contact metadata.

| Field Name | BSON / Mongoose Type | Required | Default | Constraints & Rules | Purpose / Description |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `_id` | `ObjectId` | Yes | Auto | Primary Key (MongoDB Object ID) | Unique user identifier. |
| `name` | `String` | Yes | None | `trim: true` | Farmer / user display name. |
| `email` | `String` | Yes | None | `unique: true`, `trim: true`, `lowercase: true`, regex validated | Login email address (case-insensitive unique index). |
| `password` | `String` | Yes | None | `minlength: 6` | Salted and hashed password via `bcryptjs` (salt work factor: 10). |
| `mobileNumber` | `String` | No | `undefined` | `trim: true` | Optional 10-digit Indian mobile contact number. |
| `location` | `String` | No | `undefined` | `trim: true` | Optional regional location (e.g., "Indore, Madhya Pradesh"). |
| `createdAt` | `Date` | Yes | Current Time | Managed by Mongoose | Timestamp of user registration. |
| `updatedAt` | `Date` | Yes | Current Time | Managed by Mongoose | Timestamp of latest profile modification. |

* **Indexes:**
  * `{ email: 1 }` — **Unique index** to enforce email unicity and accelerate authentication lookups.

---

### 2.2 Collection: `farms`
* **Model Name:** `Farm` (`server/src/models/farm.model.js`)
* **Purpose:** Stores agricultural parcel geometry, baseline chemical fertility parameters, and geographic coordinates.

| Field Name | BSON / Mongoose Type | Required | Default | Constraints & Rules | Purpose / Description |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `_id` | `ObjectId` | Yes | Auto | Primary Key | Unique farm parcel identifier. |
| `userId` | `ObjectId` | Yes | None | `ref: 'User'` | Foreign Key referencing owning `User._id`. |
| `farmName` | `String` | Yes | None | `trim: true` | Descriptive parcel name (e.g., "Pehla Farm", "Malwa Plot"). |
| `area` | `Number` | Yes | None | `min: 0.01` | Parcel area magnitude (must be positive). |
| `areaUnit` | `String` | Yes | None | `enum: ['acre', 'hectare']` | Standard agricultural land area measurement unit. |
| `nitrogen` | `Number` | Yes | None | `min: 0` | Baseline soil Nitrogen (N) content in kg/ha or mg/kg. |
| `phosphorus` | `Number` | Yes | None | `min: 0` | Baseline soil Phosphorus (P) content in kg/ha or mg/kg. |
| `potassium` | `Number` | Yes | None | `min: 0` | Baseline soil Potassium (K) content in kg/ha or mg/kg. |
| `pH` | `Number` | Yes | None | `min: 0, max: 14` | Baseline soil chemical reaction (pH scale 0 to 14). |
| `latitude` | `Number` | No | `undefined` | `min: -90, max: 90` | WGS84 GPS latitude coordinate. |
| `longitude` | `Number` | No | `undefined` | `min: -180, max: 180` | WGS84 GPS longitude coordinate. |
| `location` | `String` | No | `""` | `trim: true` | Reverse-geocoded or manually entered administrative address. |
| `createdAt` | `Date` | Yes | Current Time | Managed by Mongoose | Record creation timestamp. |
| `updatedAt` | `Date` | Yes | Current Time | Managed by Mongoose | Record update timestamp. |

* **Indexes:**
  * `{ userId: 1 }` — Secondary index ensuring $O(\log N)$ retrieval of all farms owned by an authenticated user, eliminating unindexed full-collection scans.

---

### 2.3 Collection: `soilinformations`
* **Model Name:** `SoilInformation` (`server/src/models/soilInformation.model.js`)
* **Purpose:** Stores laboratory-tested soil chemistry metrics and agronomic observations entered by the farmer.

| Field Name | BSON / Mongoose Type | Required | Default | Constraints & Rules | Purpose / Description |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `_id` | `ObjectId` | Yes | Auto | Primary Key | Unique soil record identifier. |
| `userId` | `ObjectId` | Yes | None | `ref: 'User'` | Foreign Key referencing owning `User._id`. |
| `farmId` | `ObjectId` | Yes | None | `ref: 'Farm'` | Foreign Key referencing associated `Farm._id`. |
| `soilType` | `String` | No | `undefined` | `trim: true, maxlength: 100` | Physical soil classification (e.g., "Black Cotton", "Alluvial"). |
| `pH` | `Number` | No | `undefined` | `min: 0, max: 14` | Laboratory-measured soil pH. |
| `nitrogen` | `Number` | No | `undefined` | `min: 0` | Laboratory-measured Nitrogen level. |
| `phosphorus` | `Number` | No | `undefined` | `min: 0` | Laboratory-measured Phosphorus level. |
| `potassium` | `Number` | No | `undefined` | `min: 0` | Laboratory-measured Potassium level. |
| `moisture` | `Number` | No | `undefined` | `min: 0` | Gravimetric or volumetric soil moisture percentage. |
| `source` | `String` | Yes | `'manual'` | `enum: ['manual', 'external']` | Origin of data record. |
| `notes` | `String` | No | `undefined` | `trim: true, maxlength: 1000` | Agronomic notes (e.g., "Applied vermicompost last season"). |
| `createdAt` | `Date` | Yes | Current Time | Managed by Mongoose | Record creation timestamp. |
| `updatedAt` | `Date` | Yes | Current Time | Managed by Mongoose | Record update timestamp. |

* **Indexes:**
  * `{ farmId: 1, userId: 1 }` — **Compound unique index** enforcing that a farm parcel has at most one active laboratory soil test record.

---

### 2.4 Collection: `externalsoilinformations`
* **Model Name:** `ExternalSoilInformation` (`server/src/models/externalSoilInformation.model.js`)
* **Purpose:** Caches depth-stratified geographic raster soil profiles retrieved from ISRIC SoilGrids v2.0 or calibrated regional baseline estimations.

| Field Name | BSON / Mongoose Type | Required | Default | Constraints & Rules | Purpose / Description |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `_id` | `ObjectId` | Yes | Auto | Primary Key | Unique record identifier. |
| `userId` | `ObjectId` | Yes | None | `ref: 'User'` | Foreign Key referencing owning `User._id`. |
| `farmId` | `ObjectId` | Yes | None | `ref: 'Farm'` | Foreign Key referencing associated `Farm._id`. |
| `source` | `String` | Yes | `'soilgrids'` | `enum: ['soilgrids']` | Soil data provider identifier. |
| `latitude` | `Number` | Yes | None | Float | Latitude from which raster pixels were queried. |
| `longitude` | `Number` | Yes | None | Float | Longitude from which raster pixels were queried. |
| `properties` | `Mixed` (Object) | Yes | None | Validated JSON structure | 7 property depth arrays (`phh2o`, `nitrogen`, `soc`, `sand`, `silt`, `clay`, `bdod`). |
| `retrievedAt` | `Date` | Yes | `Date.now` | UTC Date | Timestamp when external synchronization occurred. |
| `createdAt` | `Date` | Yes | Current Time | Managed by Mongoose | Creation timestamp. |
| `updatedAt` | `Date` | Yes | Current Time | Managed by Mongoose | Update timestamp. |

* **`properties` Sub-document Structure:**
  Each property key (`phh2o`, `nitrogen`, `soc`, `sand`, `silt`, `clay`, `bdod`) maps to an array of 6 depth objects:
  ```json
  [
    { "depth": "0-5cm", "rawValue": 76, "value": 7.6, "unit": "pH" },
    { "depth": "5-15cm", "rawValue": 77, "value": 7.7, "unit": "pH" },
    { "depth": "15-30cm", "rawValue": 78, "value": 7.8, "unit": "pH" },
    { "depth": "30-60cm", "rawValue": 79, "value": 7.9, "unit": "pH" },
    { "depth": "60-100cm", "rawValue": 80, "value": 8.0, "unit": "pH" },
    { "depth": "100-200cm", "rawValue": 80, "value": 8.0, "unit": "pH" }
  ]
  ```
* **Indexes:**
  * `{ farmId: 1, userId: 1 }` — **Compound unique index** enforcing a single cached SoilGrids profile per farm parcel.

---

### 2.5 Collection: `crophistories`
* **Model Name:** `CropHistory` (`server/src/models/cropHistory.model.js`)
* **Purpose:** Stores chronological cropping cycles per farm, supplying the historical sequence evaluated by the crop rotation penalty engine.

| Field Name | BSON / Mongoose Type | Required | Default | Constraints & Rules | Purpose / Description |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `_id` | `ObjectId` | Yes | Auto | Primary Key | Unique crop cycle record identifier. |
| `userId` | `ObjectId` | Yes | None | `ref: 'User'` | Foreign Key referencing owning `User._id`. |
| `farmId` | `ObjectId` | Yes | None | `ref: 'Farm'` | Foreign Key referencing associated `Farm._id`. |
| `crop` | `String` | Yes | None | `trim: true` | Crop cultivated (e.g. "rice", "wheat", "chickpea"). |
| `season` | `String` | Yes | None | `enum: ['Kharif', 'Rabi', 'Zaid', 'Other']` | Agricultural season during which crop was grown. |
| `year` | `Number` | Yes | None | `min: 1900, max: Year+5` | Calendar year of cultivation. |
| `notes` | `String` | No | `""` | `trim: true` | Optional yield or management notes. |
| `createdAt` | `Date` | Yes | Current Time | Managed by Mongoose | Creation timestamp. |
| `updatedAt` | `Date` | Yes | Current Time | Managed by Mongoose | Update timestamp. |

* **Indexes:**
  * `{ userId: 1, farmId: 1 }` — Compound index supporting rapid sorting by `{ year: -1, createdAt: -1 }` during recommendation generation to locate the immediate previous crop.

---

### 2.6 Collection: `diseaseinformations`
* **Model Name:** `DiseaseInformation` (`server/src/models/diseaseInformation.model.js`)
* **Purpose:** Extension-verified master knowledge base mapping MobileNetV3 disease classification codes to actionable pathology guidance.

| Field Name | BSON / Mongoose Type | Required | Default | Constraints & Rules | Purpose / Description |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `_id` | `ObjectId` | Yes | Auto | Primary Key | Unique document identifier. |
| `diseaseCode` | `String` | Yes | None | `unique: true, trim: true` | Exact class string output by CNN (e.g. `Tomato___Early_blight`). |
| `crop` | `String` | Yes | None | `trim: true` | Common name of host plant (e.g., "Tomato"). |
| `name` | `String` | Yes | None | `trim: true` | Common pathology name (e.g., "Early Blight"). |
| `symptoms` | `Array of String` | Yes | None | Minimum 1 item | Observable visual symptoms on leaves, stems, or fruits. |
| `causes` | `Array of String` | No | `[]` | Strings | Causal fungal, bacterial, or viral pathogen names. |
| `prevention` | `Array of String` | No | `[]` | Strings | Non-chemical and cultural prevention measures. |
| `management` | `Array of String` | No | `[]` | Strings | Chemical, biological, and IPM treatment protocols. |
| `sourceName` | `String` | No | `""` | `trim: true` | Authoritative university extension bulletin citation. |
| `sourceUrl` | `String` | No | `""` | `trim: true` | URL link to scientific agricultural extension bulletin. |
| `limitations` | `String` | No | `""` | `trim: true` | Agronomic limitations and safety precautions. |
| `createdAt` | `Date` | Yes | Current Time | Managed by Mongoose | Record creation timestamp. |
| `updatedAt` | `Date` | Yes | Current Time | Managed by Mongoose | Record update timestamp. |

* **Indexes:**
  * `{ diseaseCode: 1 }` — **Unique index** enabling $O(1)$ constant-time pathology resolution upon MobileNetV3 model inference.

---

## 3. Referential Integrity & Cascading Rules

MongoDB does not provide declarative foreign key cascades out of the box. KrishiMitra AI enforces referential integrity through controller-layer validation:

```
                          ┌──────────────┐
                          │     User     │
                          └──────┬───────┘
                                 │
                     CASCADE ON USER DELETE
                                 │
                                 ▼
                          ┌──────────────┐
                          │     Farm     │
                          └──────┬───────┘
                                 │
               RESTRICT (HTTP 409 CONFLICT) ON DELETE
                IF ANY DEPENDENT RECORDS EXIST IN:
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│ SoilInformation  │    │ExternalSoilInfo  │    │   CropHistory    │
└──────────────────┘    └──────────────────┘    └──────────────────┘
```

* **Cascading Prevention on Farm Deletion (`farm.controller.js`):**
  When `DELETE /api/v1/farms/:id` is received, the backend executes parallel count checks:
  ```javascript
  const [historyCount, soilCount, externalSoilCount] = await Promise.all([
      CropHistory.countDocuments({ farmId: id }),
      SoilInformation.countDocuments({ farmId: id }),
      ExternalSoilInformation.countDocuments({ farmId: id }),
  ]);
  ```
  If `historyCount + soilCount + externalSoilCount > 0`, the deletion is **aborted with HTTP 409 Conflict**:
  ```json
  {
      "success": false,
      "message": "Cannot delete farm with existing dependencies. Please delete related records first.",
      "dependencies": {
          "cropHistory": 2,
          "soilInformation": 1,
          "externalSoilInformation": 1
      }
  }
  ```
  This guarantees that historical cropping sequences and soil tracking histories are never orphaned.
