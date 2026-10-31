# Step 24.2 — Farm Update and Delete APIs

## 1. Overview & Context

In earlier iterations of the KrishiMitra AI platform, the Farm Management module supported farm creation (`POST /api/v1/farms`) and farm retrieval (`GET /api/v1/farms`, `GET /api/v1/farms/:id`). Farmers could register properties and soil measurements, but could not correct erroneous values or remove decommissioned farm entities.

Step 24.2 introduces secure, authenticated **Farm Update (`PATCH`)** and **Farm Deletion (`DELETE`)** endpoints with strict multi-tenant authorization, robust field validation, and dependency protection.

---

## 2. Security Invariants & Design Principles

| Invariant | Implementation Mechanism | Purpose |
|---|---|---|
| **Mandatory Authentication** | `protect` middleware on both `PATCH` and `DELETE` routes | Rejects unauthenticated requests with `HTTP 401 Unauthorized`. |
| **Strict Multi-Tenant Isolation** | All database queries explicitly scoped with `{ _id: id, userId: req.user.id }` | Prevents farmers from viewing, editing, or deleting farms owned by other users. |
| **Never Trust Client `userId`** | `userId` is strictly forbidden in update bodies (`validateFarmUpdate`) and stripped by service layer (`UPDATABLE_FIELDS`) | Prevents horizontal privilege escalation or ownership hijacking. |
| **Mongo ObjectId Validation** | `mongoose.Types.ObjectId.isValid(id)` checked before querying | Rejects malformed IDs with `HTTP 400 Bad Request` rather than triggering unhandled 500 cast errors. |
| **Partial Update Preservation** | Service builds a `$set` object strictly containing supplied, permitted fields | Untouched/omitted fields (e.g. soil metrics or coordinates) remain completely unchanged. |
| **Orphan Prevention Policy** | Dependent record inspection before deletion | Prevents dangling foreign key references in crop history and soil collections; returns `HTTP 409 Conflict`. |

---

## 3. API Endpoint Specifications

### 3.1 Update Farm

* **Route:** `PATCH /api/v1/farms/:id`
* **Authentication:** Required (`Authorization: Bearer <JWT>`)
* **Request Params:**
  * `id` (String, required): Valid 24-character hex MongoDB ObjectId.
* **Permitted Body Fields:**
  * `farmName` (String, non-empty, trimmed)
  * `area` (Number, positive finite > 0)
  * `areaUnit` (String, enum: `'acre'` or `'hectare'`)
  * `nitrogen` (Number, non-negative finite ≥ 0)
  * `phosphorus` (Number, non-negative finite ≥ 0)
  * `potassium` (Number, non-negative finite ≥ 0)
  * `pH` (Number, finite between 0 and 14)
  * `latitude` (Number, finite between -90 and 90, optional)
  * `longitude` (Number, finite between -180 and 180, optional)
* **Forbidden Body Fields:**
  * `userId`, `_id`, `__v`, `createdAt`, `updatedAt` (attempts return `HTTP 400`).
* **Responses:**
  * `200 OK`: Farm successfully updated. Returns updated farm document in `data`.
  * `400 Bad Request`: Invalid ObjectId, empty body, forbidden field, unsupported field, or out-of-range value.
  * `401 Unauthorized`: Missing or invalid Bearer token.
  * `404 Not Found`: Farm does not exist or belongs to another user.

#### Example Request
```http
PATCH /api/v1/farms/650c1f77bcf86cd799439011 HTTP/1.1
Host: localhost:5000
Authorization: Bearer eyJhbGciOi...
Content-Type: application/json

{
  "farmName": "Green Valley - East Field",
  "area": 12.5,
  "nitrogen": 85
}
```

#### Example 200 Response
```json
{
  "success": true,
  "message": "Farm updated successfully",
  "data": {
    "_id": "650c1f77bcf86cd799439011",
    "farmName": "Green Valley - East Field",
    "area": 12.5,
    "areaUnit": "acre",
    "nitrogen": 85,
    "phosphorus": 42,
    "potassium": 43,
    "pH": 6.5,
    "userId": "650c1f00bcf86cd799439001",
    "createdAt": "2026-09-20T10:00:00.000Z",
    "updatedAt": "2026-10-23T21:30:00.000Z"
  }
}
```

---

### 3.2 Delete Farm

* **Route:** `DELETE /api/v1/farms/:id`
* **Authentication:** Required (`Authorization: Bearer <JWT>`)
* **Request Params:**
  * `id` (String, required): Valid 24-character hex MongoDB ObjectId.
* **Deletion Policy (Conflict Prevention):**
  * Before deletion, the system queries related collections:
    1. `CropHistory` records where `farmId = id`
    2. `SoilInformation` records where `farmId = id`
    3. `ExternalSoilInformation` (SoilGrids) records where `farmId = id`
  * If any dependent records exist (`count > 0`), the deletion is **blocked** and returns `HTTP 409 Conflict`.
  * If no dependent records exist, the farm document is deleted and returns `HTTP 200 OK`.
* **Responses:**
  * `200 OK`: Farm deleted successfully.
  * `400 Bad Request`: Invalid ObjectId format.
  * `401 Unauthorized`: Missing or invalid Bearer token.
  * `404 Not Found`: Farm does not exist or is not owned by the requesting user.
  * `409 Conflict`: Farm has dependent records and cannot be deleted until dependencies are cleared.

#### Example 409 Conflict Response
```json
{
  "success": false,
  "message": "Cannot delete farm because it has dependent records: 2 crop history record(s), 1 soil information record(s). Remove them first.",
  "data": {
    "dependentCounts": {
      "cropHistory": 2,
      "soilInformation": 1,
      "externalSoilInformation": 0
    }
  }
}
```

#### Example 200 Success Response
```json
{
  "success": true,
  "message": "Farm deleted successfully"
}
```

---

## 4. Frontend Integration (`client/src/features/farm`)

The Farm UI in `FarmForm.jsx` integrates the update and delete functionality seamlessly without requiring full page reloads:

1. **FarmCard Component:**
   * Renders each owned farm with clear metadata (Area, N, P, K, pH, Lat/Lng).
   * Provides distinct **Edit** (`#edit-farm-:id`) and **Delete** (`#delete-farm-:id`) action buttons.
2. **Edit Modal (`EditModal`):**
   * Pre-fills all current farm values into controlled inputs.
   * Performs client-side validation mirroring server bounds.
   * Handles server validation errors dynamically.
   * On successful update, updates React state in-memory (`setFarms`) and closes modal.
3. **Delete Confirmation Modal (`DeleteConfirmModal`):**
   * Prompts user for explicit confirmation before issuing `DELETE`.
   * Displays server error message (including HTTP 409 dependency warnings) directly inside the modal if deletion is blocked.
   * On successful deletion, removes the farm from local state and closes modal.
4. **Service Layer (`farm.service.js`):**
   * Exports `updateFarm(id, updateData)` (PATCH) and `deleteFarm(id)` (DELETE) with authorization header attachment.

---

## 5. Verification & Test Coverage

### 5.1 Unit & Contract Tests (`server/test_farm_unit.js`)
An automated test suite verifies all edge cases in isolation:
* **Validator Tests (21 assertions):** Rejects null body, empty body, forbidden fields (`userId`, `_id`, `createdAt`), unsupported fields, invalid types/ranges for all 9 fields, and accepts valid partial and full bodies.
* **Service Layer Tests (19 assertions):** Verifies safe update filtering, ownership query encapsulation, `userId` stripping, partial field preservation, dependent record count verification, and deletion blocking.
* **Controller Tests (12 assertions):** Validates ObjectId checks (400), ownership/not-found checks (404), dependency conflict handling (409), and clean deletion responses (200).
* **Authentication Tests (4 assertions):** Verifies missing token (401), invalid JWT signature (401), and successful user extraction.
* **Result:** **61 PASSED, 0 FAILED**.

### 5.2 Live Integration Tests (`server/test_farm_integration.js`)
* Provides an end-to-end HTTP integration script testing real User registration, JWT login, Farm creation, live `PATCH` requests, cross-user authorization rejection, live `DELETE` requests, dependent `CropHistory` 409 conflict checks, dependent removal, and clean 200 deletion.
* Executable via `npm run test:farm:integration` when MongoDB is running.

### 5.3 Frontend Build Verification
* `npm run build` executed inside `client/`:
* Vite build succeeded in 1.88s with **0 errors**.

---

## 6. Remaining Limitations & Operational Notes

1. **Cascade Deletion:** Deletion is intentionally strict (`HTTP 409 Conflict`). Cascading automatic deletes are not implemented to prevent accidental loss of historical agricultural rotation and soil data. The farmer must manually clean up or re-assign crop history records before removing a farm.
2. **Database Connectivity in Sandboxed Environments:** In constrained or firewalled deployment sandboxes without loopback socket access, automated test suites should rely on the unit test suite (`npm run test:farm`), which runs without needing a running MongoDB daemon.
