/**
 * test_farm_integration.js
 * ---------------------------------------------------------------------------
 * Live End-to-End Integration Tests for Step 24.2 Farm Update & Delete:
 *   - Runs against real Express app and real MongoDB daemon
 *   - Tests live HTTP requests with fetch()
 *   - Tests real JWT issuance, verification, and route protection
 *   - Tests real database mutations, partial updates, ownership isolation,
 *     dependent record 409 Conflict detection, and cleanup
 * ---------------------------------------------------------------------------
 */

import mongoose from 'mongoose';
import app from './src/app.js';
import CropHistory from './src/models/cropHistory.model.js';
import Farm from './src/models/farm.model.js';
import User from './src/models/user.model.js';

import dotenv from 'dotenv';
dotenv.config();

let passed = 0;
let failed = 0;

function assert(condition, label, detail = '') {
    if (condition) {
        console.log(`  ✅  ${label}`);
        passed++;
    } else {
        console.error(`  ❌  ${label}${detail ? ` (${detail})` : ''}`);
        failed++;
    }
}

const PORT = 5005;
const BASE_URL = `http://localhost:${PORT}/api/v1`;
const MONGO_URI = process.env.TEST_MONGODB_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/crop_db';

async function run() {
    console.log("==================================================");
    console.log("Step 24.2 Live Integration Tests (Express + Mongo)");
    console.log("==================================================\n");

    // Connect to test database
    await mongoose.connect(MONGO_URI);
    console.log("Connected to test database at", MONGO_URI);

    // Clean test collections
    await User.deleteMany({ email: /@integration-test\.com$/ });
    await Farm.deleteMany({ farmName: /^Integration Farm/ });
    await CropHistory.deleteMany({ notes: 'Integration Test Record' });

    // Start Express server
    const server = app.listen(PORT);
    console.log(`Test Express server listening on port ${PORT}\n`);

    try {
        const ts = Date.now();
        // -------------------------------------------------------------------
        // 1. Setup: Register User A and User B
        // -------------------------------------------------------------------
        console.log("1. User Setup & Authentication");
        const emailA = `farmer_a_${ts}@integration-test.com`;
        const emailB = `farmer_b_${ts}@integration-test.com`;

        const regA = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Farmer A', email: emailA, password: 'password123' })
        });
        assert(regA.status === 201, "Registered Farmer A (HTTP 201)");
        const dataA = await regA.json();
        const tokenA = dataA.data.token;
        const userA_id = dataA.data.user._id;

        const regB = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Farmer B', email: emailB, password: 'password123' })
        });
        assert(regB.status === 201, "Registered Farmer B (HTTP 201)");
        const dataB = await regB.json();
        const tokenB = dataB.data.token;

        // -------------------------------------------------------------------
        // 2. Farm Creation (Existing Endpoint Verification)
        // -------------------------------------------------------------------
        console.log("\n2. Farm Creation");
        const createRes = await fetch(`${BASE_URL}/farms`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenA}`
            },
            body: JSON.stringify({
                farmName: 'Integration Farm Alpha',
                area: 10.5,
                areaUnit: 'acre',
                nitrogen: 75,
                phosphorus: 35,
                potassium: 40,
                pH: 6.5,
                latitude: 23.0225,
                longitude: 72.5714
            })
        });
        assert(createRes.status === 201, "Created Farm Alpha for User A (HTTP 201)");
        const createdFarm = (await createRes.json()).data;
        const farmId = createdFarm._id;

        // -------------------------------------------------------------------
        // 3. Live PATCH Tests
        // -------------------------------------------------------------------
        console.log("\n3. Live Farm Update (PATCH /api/v1/farms/:id)");

        // 3.1 Unauthenticated PATCH
        const patchUnauth = await fetch(`${BASE_URL}/farms/${farmId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ area: 12 })
        });
        assert(patchUnauth.status === 401, "Rejects unauthenticated PATCH (HTTP 401)");

        // 3.2 Invalid MongoDB ID
        const patchBadId = await fetch(`${BASE_URL}/farms/not-a-valid-id`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenA}`
            },
            body: JSON.stringify({ area: 12 })
        });
        assert(patchBadId.status === 400, "Rejects invalid ObjectId on PATCH (HTTP 400)");

        // 3.3 Attempt to overwrite userId
        const patchUserId = await fetch(`${BASE_URL}/farms/${farmId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenA}`
            },
            body: JSON.stringify({ userId: 'hacker-user-id', area: 12 })
        });
        assert(patchUserId.status === 400, "Rejects client-supplied userId attempt (HTTP 400)");

        // 3.4 Unsupported field
        const patchUnknown = await fetch(`${BASE_URL}/farms/${farmId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenA}`
            },
            body: JSON.stringify({ rogueField: 'malicious', area: 12 })
        });
        assert(patchUnknown.status === 400, "Rejects unsupported field on PATCH (HTTP 400)");

        // 3.5 Invalid field value (negative nitrogen)
        const patchBadVal = await fetch(`${BASE_URL}/farms/${farmId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenA}`
            },
            body: JSON.stringify({ nitrogen: -10 })
        });
        assert(patchBadVal.status === 400, "Rejects negative nitrogen value (HTTP 400)");

        // 3.6 Cross-user update: User B attempts to patch User A's farm
        const patchCrossUser = await fetch(`${BASE_URL}/farms/${farmId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenB}`
            },
            body: JSON.stringify({ farmName: 'Stolen Farm' })
        });
        assert(patchCrossUser.status === 404, "Cross-user PATCH returns HTTP 404 (ownership protection)");

        // 3.7 Successful partial update by owner (User A)
        const patchSuccess = await fetch(`${BASE_URL}/farms/${farmId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenA}`
            },
            body: JSON.stringify({
                farmName: 'Integration Farm Alpha Updated',
                area: 15.0
            })
        });
        assert(patchSuccess.status === 200, "Successful partial update by owner (HTTP 200)");
        const updatedFarm = (await patchSuccess.json()).data;
        assert(updatedFarm.farmName === 'Integration Farm Alpha Updated', "Farm name successfully updated");
        assert(updatedFarm.area === 15.0, "Area successfully updated");
        assert(updatedFarm.nitrogen === 75, "Omitted field 'nitrogen' preserved intact (75)");
        assert(updatedFarm.phosphorus === 35, "Omitted field 'phosphorus' preserved intact (35)");
        assert(updatedFarm.pH === 6.5, "Omitted field 'pH' preserved intact (6.5)");
        assert(updatedFarm.userId === userA_id, "Farm ownership unchanged (userId preserved)");

        // -------------------------------------------------------------------
        // 4. Live DELETE Tests
        // -------------------------------------------------------------------
        console.log("\n4. Live Farm Deletion (DELETE /api/v1/farms/:id)");

        // 4.1 Unauthenticated DELETE
        const delUnauth = await fetch(`${BASE_URL}/farms/${farmId}`, {
            method: 'DELETE'
        });
        assert(delUnauth.status === 401, "Rejects unauthenticated DELETE (HTTP 401)");

        // 4.2 Invalid ObjectId
        const delBadId = await fetch(`${BASE_URL}/farms/xyz-123`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${tokenA}` }
        });
        assert(delBadId.status === 400, "Rejects invalid ObjectId on DELETE (HTTP 400)");

        // 4.3 Attach dependent CropHistory record to Farm A
        console.log("   Creating dependent CropHistory record for Farm Alpha...");
        const depRecord = new CropHistory({
            userId: userA_id,
            farmId: farmId,
            crop: 'rice',
            season: 'Kharif',
            year: 2025,
            notes: 'Integration Test Record'
        });
        await depRecord.save();

        // 4.4 Attempt deletion while dependent record exists -> must return 409 Conflict
        const delBlocked = await fetch(`${BASE_URL}/farms/${farmId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${tokenA}` }
        });
        assert(delBlocked.status === 409, "DELETE blocked by dependent record (HTTP 409 Conflict)");
        const blockedJson = await delBlocked.json();
        assert(blockedJson.data.dependentCounts.cropHistory === 1, "409 reports exact cropHistory dependent count (1)");

        // Verify farm and cropHistory record still exist in database
        const farmStillExists = await Farm.findById(farmId);
        assert(farmStillExists !== null, "Farm Alpha remains intact after blocked delete");
        const cropHistoryStillExists = await CropHistory.findById(depRecord._id);
        assert(cropHistoryStillExists !== null, "Dependent CropHistory remains intact (data integrity)");

        // 4.5 Cross-user DELETE attempt (User B)
        const delCrossUser = await fetch(`${BASE_URL}/farms/${farmId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${tokenB}` }
        });
        assert(delCrossUser.status === 404, "Cross-user DELETE returns HTTP 404 (ownership protection)");

        // 4.6 Remove dependent record to allow clean deletion
        console.log("   Removing dependent record...");
        await CropHistory.deleteOne({ _id: depRecord._id });

        // 4.7 Successful deletion by owner
        const delSuccess = await fetch(`${BASE_URL}/farms/${farmId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${tokenA}` }
        });
        assert(delSuccess.status === 200, "Clean farm deletion by owner succeeds (HTTP 200)");

        // 4.8 Confirm farm is no longer retrievable
        const getDeleted = await fetch(`${BASE_URL}/farms/${farmId}`, {
            headers: { 'Authorization': `Bearer ${tokenA}` }
        });
        assert(getDeleted.status === 404, "GET /farms/:id confirms deleted farm returns HTTP 404");

    } finally {
        server.close();
        await mongoose.disconnect();
    }

    console.log("\n==================================================");
    console.log(`Live Integration Results: ${passed} PASSED, ${failed} FAILED`);
    console.log("==================================================");

    if (failed > 0) process.exit(1);
    else process.exit(0);
}

run().catch((err) => {
    console.error("Integration test encountered unexpected error:", err);
    process.exit(1);
});
