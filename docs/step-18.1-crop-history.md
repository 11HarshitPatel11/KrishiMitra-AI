# Step 18.1: Crop History CRUD

## 1. Why Crop History is required
The AI-Based Crop Recommendation system evaluates soil metrics and weather inputs dynamically to optimize crop selection. Keeping track of historical crop plantings is crucial for farmers as it helps identify long-term yield trends over multiple seasons and preserves farm utilization patterns over the years. 

## 2. What data is stored
The historical record stores parameters intrinsically related to the planted harvest period:
- **userId** and **farmId**: For strictly isolating multi-tenant data access.
- **crop**: The name of the crop planted.
- **season**: Season of planting mapped strictly to standard phases ('Kharif', 'Rabi', 'Zaid', 'Other').
- **year**: Standard Integer describing the harvest year. 
- **notes**: Optional observations supplied by the farmer (e.g. observations regarding yield, pests, or fertilizers applied).

## 3. Relationship between User -> Farm -> CropHistory
The architectural layout implements a strictly normalized **One-to-Many cascade**. 
- A **User** has zero-to-many **Farms**. 
- A **Farm** has zero-to-many **CropHistory** documents.
Each `CropHistory` document maintains references to both the parent `farmId` and the root `userId`. By storing `userId` redundantly into `CropHistory`, we skip computationally expensive JOIN validation across tables on every retrieval, maximizing security efficiency during runtime.

## 4. API Endpoints
The backend provisions RESTful interfaces protecting all paths implicitly resolving identity purely from the payload's encoded `Authorization: Bearer <TOKEN>` definition:
- `GET /api/v1/crop-history` — Retrieve all history scoped purely to the requester's ID.
- `GET /api/v1/crop-history/farm/:farmId` — Extract history matching a specific farm.
- `GET /api/v1/crop-history/:id` — Retrieve details of a distinct history entry.
- `POST /api/v1/crop-history` — Create a historical event against a targeted farm.
- `PATCH /api/v1/crop-history/:id` — Edit an existing historical entry safely.
- `DELETE /api/v1/crop-history/:id` — Destroy a historical entry.

## 5. Ownership/Security Rules
A persistent principle across these endpoints is IDOR (Insecure Direct Object Reference) prevention.
1. The API never accepts `userId` parameter overrides supplied passively through Request body forms. 
2. Upon POST requests, `CropHistory.farmId` is strictly verified against the underlying `Farm` collection intersecting with `req.user.id` to block impersonation.
3. Every history query embeds `userId: req.user.id`, masking and isolating document domains natively at the database level, ensuring cross-tenant exposures remain impossible even gracefully circumventing manual ID tracking mistakes in frontend interfaces.

## 6. Crop History is NOT yet directly sent to the Random Forest
Currently, the historical entries collected effectively only serve organizational, logging, and tracing capacities inside the interface! These models maintain NO footprint into the live inferences occurring via the AI engines.

## 7. Next Step context (Step 18.2)
Step 18.2 will meticulously dissect and formulate exactly how this structured `CropHistory` dimension should analytically influence subsequent AI prediction metrics safely, incorporating it accurately.
