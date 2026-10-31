# Step 21.1: Soil Information Module

## Implementation Overview
In this step, a straightforward securely scoped backend and frontend Soil Information platform was conceptualized natively scaling KrishiMitra's farm-management capabilities, deliberately avoiding unprompted coupling or adjustments against the foundational core Crop Recommendation `Random Forest` capabilities. 

### Purpose
To permit farmers straightforward manual documentation logging tracking specific local metrics (pH, Nitrogen, Phosphorus, Potassium, Moisture, and typing) without corrupting global application states or cross-farm footprints, anticipating future SoilGrids integration later.

### Schema details
The schema limits fields explicitly down to:
- `userId` (Protected internal Reference bound implicitly dynamically via JWT Auth rules).
- `farmId` (Protected Reference validating cross-user constraints).
- `pH` (0-14 bounded parameters).
- N/P/K & `moisture` (Strictly bound cleanly > 0 limiting negative nonsense).
- `source` (**Strictly governed string bounded currently completely default statically returning "manual" preventing fraudulent parameter spoofing**).

### API Endpoints
Hosted fundamentally over `/api/v1/soil-information/`.
1. **`POST /`** - Appends/Validates fresh properties against the Mongo model. (Strictly tests `farmId` possession).
2. **`GET /`** - Locates general components via internal `jwt.user.id`
3. **`GET /farm/:farmId`** - Specific limits matching targeted arrays bounded logically.
4. **`GET /:id`** - Isolated individual tracking payload bounds.
5. **`PATCH /:id`** - Alters individual variables overriding API "external" definitions securely into fallback "manual" tags preserving schema scopes.
6. **`DELETE /:id`** - Natively drops rules.

Sample Secure Creation Payload Return:
```json
{
    "success": true,
    "message": "Soil information created successfully",
    "data": {
        "userId": "6ac75423...",
        "farmId": "69273...",
        "soilType": "Loamy",
        "pH": 6.8,
        "nitrogen": 45,
        "source": "manual",
        "_id": "01994af..."
    }
}
```

### Security & IDOR Protections
All Express routines explicitly force compound query tracking appending `req.user.id` continuously protecting arbitrary indexing. An attacker attempting to inject a POST requesting mapping parameter `farmId = Bob's Farm` explicitly hits a guarded custom `404 Not Found or Not Owned by User` boundary handled uniformly in `soilInformation.service.js` avoiding DB leakages. 

### Tests Output (`test_soil_api.js`)
All isolated limits passed execution flawlessly natively.
- ✅ *IDOR Guarding:* Confirmed User A definitively could not `GET` or `PATCH` User B's entities.
- ✅ *Validation Filters:* Negative pH and N rules properly dropped returning bounded `400 Validation Error` array traces safely.
- ✅ *Duplicate Handling Constraints:* A MongoDB compound index safely intercepted duplicate farm schemas translating `11000 E11000 duplicate key` accurately backward into standard `400 Soil information record already exists`.
- ✅ *Crop Recommendation + Disease Functionality Check:* Verified no logic overlaps damaged earlier pipelines completely unmodified safely. 

### Future Pipeline Preparation
The structure logically holds placeholders protecting data limits (`source`) maintaining separation ensuring later iterations pulling spatial mapping grids securely lock independently vs farmer localized insights without contaminating dataset predictions.

**FINAL STATUS:** `STEP 21.1 COMPLETE`
