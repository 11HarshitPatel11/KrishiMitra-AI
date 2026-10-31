/**
 * test_backend_integration.js
 * ---------------------------------------------------------------------------
 * Comprehensive Automated Integration Test Suite for KrishiMitra AI (Step 24.8 / GAP-15)
 *
 * Workflows Tested:
 *   [A] Authentication Workflow:
 *       - Registration with name, email, password (201)
 *       - Duplicate email rejection (400)
 *       - Login with valid credentials (200 + JWT)
 *       - Login rejection on bad password (401)
 *       - Unauthenticated access rejection (401)
 *       - Invalid token rejection (401)
 *   [B] Farm Operations Workflow:
 *       - Authenticated farm creation (201)
 *       - Authenticated farm retrieval by ID (200)
 *       - Partial update via PATCH, preserving omitted fields (200)
 *       - Multi-tenant IDOR isolation: User B cannot access/update/delete User A's farm (404)
 *       - Conflict detection on delete: blocks deletion when dependent records exist (409)
 *       - Clean deletion after dependencies cleared (200)
 *   [C] Crop Recommendation Gateway Workflow:
 *       - Request validation: missing required features (400)
 *       - Request validation: negative / out-of-bounds values (400)
 *       - Mock ML service integration: successful prediction mapping & score calculation (200)
 *       - Upstream ML failure: controlled 503 error handling (503)
 *   [D] Disease Detection Gateway Workflow:
 *       - Upload validation: missing image file (400)
 *       - Upload validation: invalid non-image MIME type (400)
 *       - Mock ML service integration: confident prediction with DB lookup (200 + available)
 *       - Mock ML service integration: uncertain prediction with withheld advice (200 + withheld)
 *       - Upstream Disease ML failure: controlled 502/503 error handling
 *
 * Guarantees:
 *   - Runs against isolated test database ('crop_integration_test_db')
 *   - Never modifies or deletes production or development data
 *   - Closes all servers, sockets, and database connections in finally block
 * ---------------------------------------------------------------------------
 */

import dotenv from 'dotenv';
dotenv.config();

// Ensure required test environment defaults
process.env.JWT_SECRET = process.env.JWT_SECRET || 'integration-test-jwt-secret-min-32-chars-long-abc';

import mongoose from 'mongoose';
import app from './src/app.js';
import User from './src/models/user.model.js';
import Farm from './src/models/farm.model.js';
import CropHistory from './src/models/cropHistory.model.js';
import DiseaseInformation from './src/models/diseaseInformation.model.js';
import { createTestClient } from './test_helpers/http_client.js';
import { createMockMlService } from './test_helpers/mock_ml_service.js';

let passed = 0;
let failed = 0;
let skipped = 0;

function assert(condition, label, detail = '') {
    if (condition) {
        console.log(`  ✅  ${label}`);
        passed++;
    } else {
        console.error(`  ❌  ${label}${detail ? ` (${detail})` : ''}`);
        failed++;
    }
}

function skip(label, reason = '') {
    console.log(`  ⏭️   [SKIPPED] ${label}${reason ? ` (${reason})` : ''}`);
    skipped++;
}

console.log("==================================================");
console.log("Step 24.8 Backend Integration Test Suite");
console.log("==================================================\n");

const TEST_DB_URI = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/crop_integration_test_db';

async function run() {
    let client;
    let mockMl;
    let dbConnected = false;

    try {
        // -------------------------------------------------------------------
        // 1. Setup: Start Mock ML Service & HTTP Test Client
        // -------------------------------------------------------------------
        console.log("1. Test Infrastructure Initialization");

        mockMl = await createMockMlService();
        process.env.ML_SERVICE_URL = mockMl.url;
        assert(true, `Mock ML Microservice listening at ${mockMl.url}`);

        client = await createTestClient(app);
        assert(true, `Express HTTP test client initialized at ${client.baseUrl}`);

        // -------------------------------------------------------------------
        // 2. Connect to Isolated Test Database
        // -------------------------------------------------------------------
        try {
            await mongoose.connect(TEST_DB_URI, { serverSelectionTimeoutMS: 2000 });
            dbConnected = true;
            assert(true, `Connected to isolated test database: ${TEST_DB_URI}`);

            // Clean any stale test records from previous aborted runs
            await User.deleteMany({ email: /@integration-test\.com$/ });
            await Farm.deleteMany({ farmName: /^Integration Test/ });
            await CropHistory.deleteMany({ notes: 'Integration Test Dependent Record' });

            // Ensure test disease info record exists for Workflow D
            await DiseaseInformation.findOneAndUpdate(
                { diseaseCode: 'Tomato___Early_blight' },
                {
                    $set: {
                        diseaseCode: 'Tomato___Early_blight',
                        crop: 'Tomato',
                        name: 'Early Blight',
                        symptoms: 'Concentric dark rings and brown spots on foliage.',
                        causes: 'Fungal pathogen Alternaria solani.',
                        prevention: 'Crop rotation and drip irrigation.',
                        management: 'Prune lower leaves and practice good sanitation.',
                        sourceName: 'Cornell Cooperative Extension',
                        sourceUrl: 'https://extension.umd.edu/resource/early-blight-tomatoes',
                        limitations: 'Advisory guidance only.'
                    }
                },
                { upsert: true, new: true }
            );
        } catch (dbErr) {
            console.warn(`  ⚠️  MongoDB connection to ${TEST_DB_URI} failed: ${dbErr.message}`);
            console.warn(`     (If running in restricted sandbox mode, live database tests will be safely skipped)`);
        }

        // ===================================================================
        // WORKFLOW A: Authentication Integration
        // ===================================================================
        console.log("\n==================================================");
        console.log("Workflow A: Authentication Integration");
        console.log("==================================================");

        let tokenUserA = null;
        let tokenUserB = null;
        const ts = Date.now();
        const userA_email = `farmer_a_${ts}@integration-test.com`;
        const userB_email = `farmer_b_${ts}@integration-test.com`;
        const userPassword = 'TestPassword123!';

        if (dbConnected) {
            // A1. Register User A
            const regA = await client.post('/api/v1/auth/register', {
                name: 'Farmer Alice',
                email: userA_email,
                password: userPassword,
            });
            assert(regA.status === 201, `User A registration returns HTTP 201 (status: ${regA.status})`);
            assert(regA.body?.success === true, "Registration response indicates success: true");
            assert(regA.body?.data?.user?.email === userA_email, "Registration response returns user profile");
            assert(regA.body?.data?.user?.password === undefined, "Password is NEVER returned in response");

            // A2. Duplicate Registration Rejection
            const regDup = await client.post('/api/v1/auth/register', {
                name: 'Farmer Alice Duplicate',
                email: userA_email,
                password: userPassword,
            });
            assert(regDup.status === 400, `Duplicate email registration rejected with HTTP 400 (status: ${regDup.status})`);
            assert(regDup.body?.success === false, "Duplicate registration indicates success: false");

            // A3. Login User A
            const loginA = await client.post('/api/v1/auth/login', {
                email: userA_email,
                password: userPassword,
            });
            assert(loginA.status === 200, `Valid login returns HTTP 200 (status: ${loginA.status})`);
            assert(loginA.body?.success === true, "Login response indicates success: true");
            assert(typeof loginA.body?.data?.token === 'string', "Login returns valid JWT token");
            tokenUserA = loginA.body?.data?.token;

            // A4. Invalid Password Rejection
            const loginBad = await client.post('/api/v1/auth/login', {
                email: userA_email,
                password: 'WrongPassword999!',
            });
            assert(loginBad.status === 401, `Invalid password rejected with HTTP 401 (status: ${loginBad.status})`);
            assert(loginBad.body?.message === 'Invalid credentials', "Returns unified 'Invalid credentials' message");

            // Register & Login User B for multi-tenant tests
            await client.post('/api/v1/auth/register', {
                name: 'Farmer Bob',
                email: userB_email,
                password: userPassword,
            });
            const loginB = await client.post('/api/v1/auth/login', {
                email: userB_email,
                password: userPassword,
            });
            tokenUserB = loginB.body?.data?.token;
        } else {
            skip("User registration & login (requires live MongoDB)");
        }

        // A5. Protected Endpoint Rejects Unauthenticated Request
        const unauthReq = await client.get('/api/v1/farms');
        assert(unauthReq.status === 401, `Protected route without token returns HTTP 401 (status: ${unauthReq.status})`);

        // A6. Protected Endpoint Rejects Invalid JWT
        const badTokenReq = await client.get('/api/v1/farms', {
            'Authorization': 'Bearer invalid.tampered.jwt_token_here',
        });
        assert(badTokenReq.status === 401, `Protected route with invalid JWT returns HTTP 401 (status: ${badTokenReq.status})`);

        // A7. Profile Endpoint Rejects Unauthenticated Request
        const unauthMe = await client.get('/api/v1/auth/me');
        assert(unauthMe.status === 401, `GET /auth/me without token returns HTTP 401 (status: ${unauthMe.status})`);

        if (dbConnected && tokenUserA && tokenUserB) {
            // A8. Authenticated User A Retrieves Own Profile
            const meA = await client.get('/api/v1/auth/me', {
                'Authorization': `Bearer ${tokenUserA}`,
            });
            assert(meA.status === 200, `GET /auth/me with User A token returns HTTP 200 (status: ${meA.status})`);
            assert(meA.body?.data?.user?.email === userA_email, "User A profile returns correct email");
            assert(meA.body?.data?.user?.password === undefined, "User A profile password hash is NEVER returned");

            // A9. Profile Update Rejects Forbidden Fields
            const badPatch = await client.patch('/api/v1/auth/profile', {
                email: 'rogue@evil.com',
                password: 'hacked_password',
            }, {
                'Authorization': `Bearer ${tokenUserA}`,
            });
            assert(badPatch.status === 400, `PATCH /auth/profile with forbidden fields returns HTTP 400 (status: ${badPatch.status})`);

            // A10. Profile Update Accepts Permitted Fields
            const goodPatch = await client.patch('/api/v1/auth/profile', {
                name: 'Alice Cooper',
                mobileNumber: '9876543210',
                location: 'Baramati, Maharashtra',
            }, {
                'Authorization': `Bearer ${tokenUserA}`,
            });
            assert(goodPatch.status === 200, `PATCH /auth/profile with valid permitted fields returns HTTP 200 (status: ${goodPatch.status})`);
            assert(goodPatch.body?.data?.user?.name === 'Alice Cooper', "Profile update reflects updated name");
            assert(goodPatch.body?.data?.user?.mobileNumber === '9876543210', "Profile update reflects updated mobileNumber");
            assert(goodPatch.body?.data?.user?.location === 'Baramati, Maharashtra', "Profile update reflects updated location");
            assert(goodPatch.body?.data?.user?.email === userA_email, "Email remains unmodified");

            // A11. User B Profile Scoping & Tenant Isolation
            const meB = await client.get('/api/v1/auth/me', {
                'Authorization': `Bearer ${tokenUserB}`,
            });
            assert(meB.status === 200, `GET /auth/me with User B token returns HTTP 200`);
            assert(meB.body?.data?.user?.email === userB_email, "User B profile returns User B's email, strictly isolated from User A");
        }

        // ===================================================================
        // WORKFLOW B: Farm Operations & Security Integration
        // ===================================================================
        console.log("\n==================================================");
        console.log("Workflow B: Farm Operations & Multi-Tenant IDOR Integration");
        console.log("==================================================");

        if (dbConnected && tokenUserA && tokenUserB) {
            let createdFarmId = null;

            // B1. Create Farm as User A
            const createRes = await client.post('/api/v1/farms', {
                farmName: `Integration Test Farm ${ts}`,
                area: 12.5,
                areaUnit: 'acre',
                nitrogen: 85,
                phosphorus: 45,
                potassium: 40,
                pH: 6.8,
            }, { 'Authorization': `Bearer ${tokenUserA}` });

            assert(createRes.status === 201, `Farm creation returns HTTP 201 (status: ${createRes.status})`);
            assert(createRes.body?.success === true, "Farm creation indicates success: true");
            assert(createRes.body?.data?.farmName === `Integration Test Farm ${ts}`, "Farm document contains farmName");
            createdFarmId = createRes.body?.data?._id;

            // B2. Retrieve Farm by ID
            const getRes = await client.get(`/api/v1/farms/${createdFarmId}`, {
                'Authorization': `Bearer ${tokenUserA}`,
            });
            assert(getRes.status === 200, `Retrieve farm returns HTTP 200 (status: ${getRes.status})`);
            assert(getRes.body?.data?._id === createdFarmId, "Retrieved farm matches requested farm ID");

            // B3. Partial Update via PATCH
            const patchRes = await client.patch(`/api/v1/farms/${createdFarmId}`, {
                farmName: `Integration Test Farm Updated ${ts}`,
                area: 18.0,
            }, { 'Authorization': `Bearer ${tokenUserA}` });

            assert(patchRes.status === 200, `Farm PATCH update returns HTTP 200 (status: ${patchRes.status})`);
            assert(patchRes.body?.data?.farmName === `Integration Test Farm Updated ${ts}`, "Updated field 'farmName' changed");
            assert(patchRes.body?.data?.area === 18.0, "Updated field 'area' changed");
            assert(patchRes.body?.data?.nitrogen === 85, "Omitted field 'nitrogen' preserved intact");
            assert(patchRes.body?.data?.pH === 6.8, "Omitted field 'pH' preserved intact");

            // B4. Multi-Tenant IDOR Isolation (User B cannot access User A's farm)
            const idorGet = await client.get(`/api/v1/farms/${createdFarmId}`, {
                'Authorization': `Bearer ${tokenUserB}`,
            });
            assert(idorGet.status === 404, `User B reading User A's farm returns HTTP 404 (status: ${idorGet.status})`);

            const idorPatch = await client.patch(`/api/v1/farms/${createdFarmId}`, {
                farmName: "Hijacked Farm Name",
            }, { 'Authorization': `Bearer ${tokenUserB}` });
            assert(idorPatch.status === 404, `User B updating User A's farm returns HTTP 404 (status: ${idorPatch.status})`);

            const idorDel = await client.delete(`/api/v1/farms/${createdFarmId}`, {
                'Authorization': `Bearer ${tokenUserB}`,
            });
            assert(idorDel.status === 404, `User B deleting User A's farm returns HTTP 404 (status: ${idorDel.status})`);

            // B5. Deletion Dependency Protection (HTTP 409 Conflict)
            // Insert a dependent crop history record for this farm
            const userADoc = await User.findOne({ email: userA_email });
            const depHistory = await CropHistory.create({
                userId: userADoc._id,
                farmId: createdFarmId,
                crop: 'rice',
                season: 'Kharif',
                year: 2024,
                notes: 'Integration Test Dependent Record'
            });

            const conflictDel = await client.delete(`/api/v1/farms/${createdFarmId}`, {
                'Authorization': `Bearer ${tokenUserA}`,
            });
            assert(conflictDel.status === 409, `Deletion with dependent records returns HTTP 409 Conflict (status: ${conflictDel.status})`);
            assert(conflictDel.body?.success === false, "Conflict response indicates success: false");
            assert(conflictDel.body?.data?.dependentCounts?.cropHistory === 1, "Reports exact dependent count (cropHistory: 1)");

            // Verify farm was NOT deleted
            const verifyStillExists = await client.get(`/api/v1/farms/${createdFarmId}`, {
                'Authorization': `Bearer ${tokenUserA}`,
            });
            assert(verifyStillExists.status === 200, "Farm is preserved in database when deletion is blocked");

            // B6. Clean Deletion after Dependencies Cleared
            await CropHistory.deleteOne({ _id: depHistory._id });

            const cleanDel = await client.delete(`/api/v1/farms/${createdFarmId}`, {
                'Authorization': `Bearer ${tokenUserA}`,
            });
            assert(cleanDel.status === 200, `Clean deletion returns HTTP 200 OK (status: ${cleanDel.status})`);
            assert(cleanDel.body?.success === true, "Deletion indicates success: true");

            // Verify farm is deleted
            const verifyGone = await client.get(`/api/v1/farms/${createdFarmId}`, {
                'Authorization': `Bearer ${tokenUserA}`,
            });
            assert(verifyGone.status === 404, "Subsequent GET for deleted farm returns HTTP 404");
        } else {
            skip("Farm CRUD & IDOR operations (requires live MongoDB)");
        }

        // ===================================================================
        // WORKFLOW C: Crop Recommendation Gateway Integration
        // ===================================================================
        console.log("\n==================================================");
        console.log("Workflow C: Crop Recommendation Gateway Integration");
        console.log("==================================================");

        const authHeader = tokenUserA ? { 'Authorization': `Bearer ${tokenUserA}` } : {};

        if (tokenUserA) {
            // C1. Request Validation (Missing Fields)
            const invalidReq1 = await client.post('/api/v1/recommendations/predict', {
                // missing nitrogen, phosphorus, potassium, etc.
                pH: 6.5,
            }, authHeader);
            assert(invalidReq1.status === 400, `Missing required fields rejected with HTTP 400 (status: ${invalidReq1.status})`);

            // C2. Request Validation (Negative / Out-of-bounds Values)
            const invalidReq2 = await client.post('/api/v1/recommendations/predict', {
                nitrogen: -10,
                phosphorus: 40,
                potassium: 40,
                temperature: 25.0,
                humidity: 75.0,
                pH: 6.5,
                rainfall: 100.0,
            }, authHeader);
            assert(invalidReq2.status === 400, `Negative feature value rejected with HTTP 400 (status: ${invalidReq2.status})`);

            // C3. Successful Forwarding to Mock ML Service & Response Mapping
            mockMl.setMode('normal');
            const validRec = await client.post('/api/v1/recommendations/predict', {
                nitrogen: 90,
                phosphorus: 42,
                potassium: 43,
                temperature: 20.8,
                humidity: 82.0,
                pH: 6.5,
                rainfall: 150.0,
            }, authHeader);

            assert(validRec.status === 200, `Valid recommendation request returns HTTP 200 (status: ${validRec.status})`);
            assert(validRec.body?.success === true, "Recommendation indicates success: true");
            assert(Array.isArray(validRec.body?.data?.recommendations), "Returns recommendations array");
            assert(validRec.body?.data?.recommendations.length > 0, "Recommendations array is populated");
            assert(typeof validRec.body?.data?.recommendations[0]?.finalScore === 'number', "Each recommendation contains finalScore");
            assert(validRec.body?.data?.recommendations[0]?.crop === 'rice', "Top crop correctly mapped from mock ML service ('rice')");

            // C4. Upstream ML Service Failure Handling (HTTP 500 from ML)
            mockMl.setMode('failure');
            const failedRec = await client.post('/api/v1/recommendations/predict', {
                nitrogen: 90,
                phosphorus: 42,
                potassium: 43,
                temperature: 20.8,
                humidity: 82.0,
                pH: 6.5,
                rainfall: 150.0,
            }, authHeader);

            assert(failedRec.status === 503, `Upstream ML service failure returns controlled HTTP 503 (status: ${failedRec.status})`);
            assert(failedRec.body?.success === false, "Failure response indicates success: false");
            assert(failedRec.body?.message?.includes("ML service is currently unavailable"), "Returns safe ML service unavailable message");
            mockMl.setMode('normal');
        } else {
            skip("Crop recommendation gateway end-to-end (requires authenticated user token)");
        }

        // ===================================================================
        // WORKFLOW D: Disease Detection Gateway Integration
        // ===================================================================
        console.log("\n==================================================");
        console.log("Workflow D: Disease Detection Gateway Integration");
        console.log("==================================================");

        if (tokenUserA) {
            // D1. Missing Image Upload
            const missingFileRes = await client.post('/api/v1/disease/predict', {}, authHeader);
            assert(missingFileRes.status === 400, `Missing file upload returns HTTP 400 (status: ${missingFileRes.status})`);
            assert(missingFileRes.body?.message?.includes("No image file uploaded"), "Error explains that image file is required");

            // D2. Invalid MIME Type (e.g. text/plain)
            const badMimeRes = await client.postMultipart('/api/v1/disease/predict', {
                fieldName: 'file',
                filename: 'malicious.txt',
                contentType: 'text/plain',
                content: Buffer.from('hello plain text')
            }, authHeader);
            assert(badMimeRes.status === 400, `Non-image MIME type rejected with HTTP 400 (status: ${badMimeRes.status})`);

            // D3. Valid Image with Confident ML Prediction
            mockMl.setMode('normal');
            const validImageBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00]); // JPEG magic header

            const confidentRes = await client.postMultipart('/api/v1/disease/predict', {
                fieldName: 'file',
                filename: 'tomato_leaf.jpg',
                contentType: 'image/jpeg',
                content: validImageBuffer
            }, authHeader);

            assert(confidentRes.status === 200, `Confident disease detection returns HTTP 200 (status: ${confidentRes.status})`);
            assert(confidentRes.body?.success === true, "Response indicates success: true");
            assert(confidentRes.body?.data?.prediction?.className === 'Tomato___Early_blight', "Correctly identifies predicted class");
            assert(confidentRes.body?.data?.prediction?.status === 'confident', "Prediction status is 'confident'");
            assert(confidentRes.body?.data?.informationStatus === 'available', "Disease information status is 'available'");
            assert(confidentRes.body?.data?.information?.crop === 'Tomato', "Database details enriched in response");

            // D4. Valid Image with Uncertain ML Prediction (Withholding Guidance)
            mockMl.setMode('uncertain');
            const uncertainRes = await client.postMultipart('/api/v1/disease/predict', {
                fieldName: 'file',
                filename: 'tomato_leaf.jpg',
                contentType: 'image/jpeg',
                content: validImageBuffer
            }, authHeader);

            assert(uncertainRes.status === 200, `Uncertain disease prediction returns HTTP 200 (status: ${uncertainRes.status})`);
            assert(uncertainRes.body?.data?.prediction?.status === 'uncertain', "Prediction status is 'uncertain'");
            assert(uncertainRes.body?.data?.informationStatus === 'withheld_due_to_uncertainty', "Disease information is strictly withheld");
            assert(uncertainRes.body?.data?.information === null, "Information payload is null when prediction is uncertain");

            // D5. Upstream Disease ML Service Failure (HTTP 500)
            mockMl.setMode('failure');
            const diseaseFailRes = await client.postMultipart('/api/v1/disease/predict', {
                fieldName: 'file',
                filename: 'tomato_leaf.jpg',
                contentType: 'image/jpeg',
                content: validImageBuffer
            }, authHeader);

            assert(diseaseFailRes.status === 502 || diseaseFailRes.status === 503, `Upstream Disease ML failure returns controlled HTTP 502/503 (status: ${diseaseFailRes.status})`);
            assert(diseaseFailRes.body?.success === false, "Failure response indicates success: false");
            mockMl.setMode('normal');
        } else {
            skip("Disease detection gateway end-to-end (requires authenticated user token)");
        }

    } finally {
        // ===================================================================
        // Clean Shutdown & Teardown
        // ===================================================================
        console.log("\n==================================================");
        console.log("Teardown & Cleanup");
        console.log("==================================================");

        if (dbConnected) {
            try {
                await User.deleteMany({ email: /@integration-test\.com$/ });
                await Farm.deleteMany({ farmName: /^Integration Test/ });
                await CropHistory.deleteMany({ notes: 'Integration Test Dependent Record' });
                await mongoose.connection.dropDatabase();
                await mongoose.disconnect();
                console.log("  🧹  Test database dropped and Mongoose disconnected cleanly.");
            } catch (cleanupErr) {
                console.warn("  ⚠️  Database cleanup error:", cleanupErr.message);
            }
        }

        if (client) {
            try {
                await client.close();
                console.log("  🧹  Express HTTP test client closed.");
            } catch (clientErr) {
                console.warn("  ⚠️  Test client close error:", clientErr.message);
            }
        }

        if (mockMl) {
            try {
                await mockMl.close();
                console.log("  🧹  Mock ML service HTTP server closed.");
            } catch (mlErr) {
                console.warn("  ⚠️  Mock ML server close error:", mlErr.message);
            }
        }
    }

    console.log("\n==================================================");
    console.log(`Integration Test Results: ${passed} PASSED, ${failed} FAILED, ${skipped} SKIPPED`);
    console.log("==================================================");

    if (failed > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

run().catch(err => {
    console.error("Fatal error during integration test execution:", err);
    process.exit(1);
});
