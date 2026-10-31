/**
 * test_farm_unit.js
 * ---------------------------------------------------------------------------
 * Comprehensive unit tests for Step 24.2 Farm Update and Delete:
 *   - Validators: validateFarmCreation & validateFarmUpdate
 *   - Services: updateFarmService, deleteFarmService (with mocked Mongoose models)
 *   - Controllers: updateFarm, deleteFarm
 *   - Middleware: auth protect middleware (401 validation)
 *   - Cross-user isolation, dependent record integrity, and ID validation
 *
 * Runs completely isolated without requiring a live MongoDB daemon.
 * ---------------------------------------------------------------------------
 */

import { validateFarmCreation, validateFarmUpdate } from './src/validators/farm.validator.js';
import { updateFarmService, deleteFarmService } from './src/services/farm.service.js';
import { updateFarm, deleteFarm } from './src/controllers/farm.controller.js';
import { protect } from './src/middlewares/auth.middleware.js';
import Farm from './src/models/farm.model.js';
import CropHistory from './src/models/cropHistory.model.js';
import SoilInformation from './src/models/soilInformation.model.js';
import ExternalSoilInformation from './src/models/externalSoilInformation.model.js';
import jwt from 'jsonwebtoken';

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

console.log("==================================================");
console.log("Step 24.2 Farm Update & Delete Unit Test Suite");
console.log("==================================================\n");

// ---------------------------------------------------------------------------
// 1. Validator Tests: validateFarmUpdate
// ---------------------------------------------------------------------------
console.log("1. Validator Tests — validateFarmUpdate");

// 1.1 Non-object / null body
const errNull = validateFarmUpdate(null);
assert(errNull.length === 1 && errNull[0].path === 'body', "Rejects null body with 400 validation error");

const errArr = validateFarmUpdate([]);
assert(errArr.length === 1 && errArr[0].path === 'body', "Rejects array body with 400 validation error");

// 1.2 Empty body
const errEmpty = validateFarmUpdate({});
assert(errEmpty.length === 1 && errEmpty[0].path === 'body', "Rejects empty object body");

// 1.3 Forbidden fields: userId, _id, __v, createdAt, updatedAt
const errUserId = validateFarmUpdate({ userId: 'hacker123', farmName: 'Hacked' });
assert(errUserId.some(e => e.path === 'userId'), "Rejects attempt to modify userId");

const errMongoId = validateFarmUpdate({ _id: '507f1f77bcf86cd799439011', area: 10 });
assert(errMongoId.some(e => e.path === '_id'), "Rejects attempt to modify _id");

const errCreatedAt = validateFarmUpdate({ createdAt: new Date() });
assert(errCreatedAt.some(e => e.path === 'createdAt'), "Rejects attempt to modify createdAt");

// 1.4 Unsupported / unknown fields
const errUnknown = validateFarmUpdate({ unknownField: 'val', nitrogen: 50 });
assert(errUnknown.some(e => e.path === 'unknownField'), "Rejects unsupported/unknown fields");

// 1.5 Individual field validations
const errBadName = validateFarmUpdate({ farmName: '   ' });
assert(errBadName.some(e => e.path === 'farmName'), "Rejects empty or whitespace-only farmName");

const errBadArea = validateFarmUpdate({ area: -5 });
assert(errBadArea.some(e => e.path === 'area'), "Rejects negative area");

const errBadAreaZero = validateFarmUpdate({ area: 0 });
assert(errBadAreaZero.some(e => e.path === 'area'), "Rejects zero area");

const errBadUnit = validateFarmUpdate({ areaUnit: 'sqm' });
assert(errBadUnit.some(e => e.path === 'areaUnit'), "Rejects invalid areaUnit (must be acre or hectare)");

const errBadN = validateFarmUpdate({ nitrogen: -1 });
assert(errBadN.some(e => e.path === 'nitrogen'), "Rejects negative nitrogen");

const errBadP = validateFarmUpdate({ phosphorus: -1 });
assert(errBadP.some(e => e.path === 'phosphorus'), "Rejects negative phosphorus");

const errBadK = validateFarmUpdate({ potassium: -1 });
assert(errBadK.some(e => e.path === 'potassium'), "Rejects negative potassium");

const errBadPHLow = validateFarmUpdate({ pH: -0.5 });
assert(errBadPHLow.some(e => e.path === 'pH'), "Rejects pH < 0");

const errBadPHHigh = validateFarmUpdate({ pH: 14.5 });
assert(errBadPHHigh.some(e => e.path === 'pH'), "Rejects pH > 14");

const errBadLat = validateFarmUpdate({ latitude: 95 });
assert(errBadLat.some(e => e.path === 'latitude'), "Rejects latitude > 90");

const errBadLng = validateFarmUpdate({ longitude: -185 });
assert(errBadLng.some(e => e.path === 'longitude'), "Rejects longitude < -180");

// 1.6 Valid partial updates
const validPartial1 = validateFarmUpdate({ farmName: 'Updated Farm Name' });
assert(validPartial1.length === 0, "Accepts partial update with only farmName");

const validPartial2 = validateFarmUpdate({ nitrogen: 80, phosphorus: 40 });
assert(validPartial2.length === 0, "Accepts partial update with subset of soil fields");

const validFull = validateFarmUpdate({
    farmName: 'Green Valley',
    area: 5.5,
    areaUnit: 'acre',
    nitrogen: 90,
    phosphorus: 42,
    potassium: 43,
    pH: 6.8,
    latitude: 28.6139,
    longitude: 77.2090
});
assert(validFull.length === 0, "Accepts valid full update payload");

// ---------------------------------------------------------------------------
// 2. Validator Tests: validateFarmCreation
// ---------------------------------------------------------------------------
console.log("\n2. Validator Tests — validateFarmCreation");

const errCreateNull = validateFarmCreation(null);
assert(errCreateNull.length === 1 && errCreateNull[0].path === 'body', "Rejects null creation body");

const errCreateMissing = validateFarmCreation({ farmName: 'Test' });
assert(errCreateMissing.length >= 6, "Rejects creation with missing required fields");

const validCreate = validateFarmCreation({
    farmName: 'Valid Farm',
    area: 10,
    areaUnit: 'acre',
    nitrogen: 50,
    phosphorus: 50,
    potassium: 50,
    pH: 7.0
});
assert(validCreate.length === 0, "Accepts valid creation payload");

// ---------------------------------------------------------------------------
// 3. Service Layer Unit Tests: updateFarmService & deleteFarmService
// ---------------------------------------------------------------------------
console.log("\n3. Service Layer Unit Tests — updateFarmService & deleteFarmService");

// 3.1 updateFarmService safe filtering and ownership query
const origFindOneAndUpdate = Farm.findOneAndUpdate;
let capturedQuery = null;
let capturedUpdate = null;

Farm.findOneAndUpdate = async (query, update, options) => {
    capturedQuery = query;
    capturedUpdate = update;
    return { _id: query._id, userId: query.userId, ...update.$set };
};

const dummyFarmId = '507f1f77bcf86cd799439011';
const dummyUserId = '607f1f77bcf86cd799439022';

await updateFarmService(dummyFarmId, dummyUserId, {
    farmName: 'New Name',
    area: 3.2,
    userId: 'maliciousUserId', // Should be stripped out by service
    unsupportedField: 'ignored'
});

assert(capturedQuery._id === dummyFarmId, "updateFarmService queries correct farmId");
assert(capturedQuery.userId === dummyUserId, "updateFarmService enforces userId ownership check in query");
assert(capturedUpdate.$set.farmName === 'New Name', "updateFarmService applies farmName");
assert(capturedUpdate.$set.area === 3.2, "updateFarmService applies area");
assert(capturedUpdate.$set.userId === undefined, "updateFarmService strictly strips client-supplied userId");
assert(capturedUpdate.$set.unsupportedField === undefined, "updateFarmService strictly strips unsupported fields");
assert(capturedUpdate.$set.nitrogen === undefined, "updateFarmService preserves omitted fields without overriding");

// Restore Farm.findOneAndUpdate
Farm.findOneAndUpdate = origFindOneAndUpdate;

// 3.2 deleteFarmService behavior
const origFarmFindOne = Farm.findOne;
const origFarmDeleteOne = Farm.deleteOne;
const origCropHistoryCount = CropHistory.countDocuments;
const origSoilInfoCount = SoilInformation.countDocuments;
const origExtSoilCount = ExternalSoilInformation.countDocuments;

// Scenario A: Farm not found or not owned by requesting user
Farm.findOne = async () => null;
const deleteNotFoundResult = await deleteFarmService(dummyFarmId, dummyUserId);
assert(deleteNotFoundResult === null, "deleteFarmService returns null when farm not found or not owned");

// Scenario B: Farm exists, but CropHistory dependent records exist
Farm.findOne = async () => ({ _id: dummyFarmId, userId: dummyUserId });
CropHistory.countDocuments = async () => 2;
SoilInformation.countDocuments = async () => 0;
ExternalSoilInformation.countDocuments = async () => 0;

let deleteCalled = false;
Farm.deleteOne = async () => { deleteCalled = true; };

const blockedByHistory = await deleteFarmService(dummyFarmId, dummyUserId);
assert(blockedByHistory.blocked === true, "deleteFarmService blocks deletion when CropHistory records exist");
assert(blockedByHistory.counts.cropHistory === 2, "Reports accurate cropHistory dependent count");
assert(deleteCalled === false, "Farm.deleteOne is NOT called when dependencies exist (integrity preserved)");

// Scenario C: Farm exists, but SoilInformation dependent records exist
CropHistory.countDocuments = async () => 0;
SoilInformation.countDocuments = async () => 1;
ExternalSoilInformation.countDocuments = async () => 0;
const blockedBySoil = await deleteFarmService(dummyFarmId, dummyUserId);
assert(blockedBySoil.blocked === true, "deleteFarmService blocks deletion when SoilInformation records exist");
assert(blockedBySoil.counts.soilInformation === 1, "Reports accurate soilInformation dependent count");
assert(deleteCalled === false, "Farm.deleteOne is NOT called when soil record exists");

// Scenario D: Farm exists, but ExternalSoilInformation dependent records exist
CropHistory.countDocuments = async () => 0;
SoilInformation.countDocuments = async () => 0;
ExternalSoilInformation.countDocuments = async () => 3;
const blockedByExtSoil = await deleteFarmService(dummyFarmId, dummyUserId);
assert(blockedByExtSoil.blocked === true, "deleteFarmService blocks deletion when ExternalSoil records exist");
assert(blockedByExtSoil.counts.externalSoilInformation === 3, "Reports accurate externalSoilInformation dependent count");
assert(deleteCalled === false, "Farm.deleteOne is NOT called when external soil record exists");

// Scenario E: Farm exists and has 0 dependent records (clean deletion)
CropHistory.countDocuments = async () => 0;
SoilInformation.countDocuments = async () => 0;
ExternalSoilInformation.countDocuments = async () => 0;
Farm.deleteOne = async (query) => {
    deleteCalled = true;
    assert(query._id === dummyFarmId && query.userId === dummyUserId, "deleteOne enforces farmId and userId scoping");
    return { deletedCount: 1 };
};

const successDelete = await deleteFarmService(dummyFarmId, dummyUserId);
assert(successDelete.deleted === true, "deleteFarmService returns { deleted: true } on clean deletion");
assert(deleteCalled === true, "Farm.deleteOne was invoked on clean deletion");

// Restore original methods
Farm.findOne = origFarmFindOne;
Farm.deleteOne = origFarmDeleteOne;
CropHistory.countDocuments = origCropHistoryCount;
SoilInformation.countDocuments = origSoilInfoCount;
ExternalSoilInformation.countDocuments = origExtSoilCount;

// ---------------------------------------------------------------------------
// 4. Controller Layer Unit Tests: updateFarm & deleteFarm
// ---------------------------------------------------------------------------
console.log("\n4. Controller Layer Unit Tests — updateFarm & deleteFarm");

// Helper to mock Express req, res
const mockRes = () => {
    const res = {};
    res.statusCode = null;
    res.body = null;
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.body = data;
        return res;
    };
    return res;
};

// 4.1 updateFarm invalid ObjectId param
const resBadId = mockRes();
await updateFarm({ params: { id: 'invalid-id' }, user: { id: dummyUserId }, body: { area: 5 } }, resBadId, () => {});
assert(resBadId.statusCode === 400, "updateFarm returns HTTP 400 for invalid MongoDB ObjectId");
assert(resBadId.body.message === 'Invalid farm ID', "updateFarm returns 'Invalid farm ID' message");

// 4.2 updateFarm nonexistent / unowned farm
Farm.findOneAndUpdate = async () => null;
const resNotFound = mockRes();
await updateFarm({ params: { id: dummyFarmId }, user: { id: dummyUserId }, body: { area: 5 } }, resNotFound, () => {});
assert(resNotFound.statusCode === 404, "updateFarm returns HTTP 404 when farm is nonexistent or belongs to another user");
assert(resNotFound.body.message === 'Farm not found', "updateFarm returns 'Farm not found'");
Farm.findOneAndUpdate = origFindOneAndUpdate;

// 4.3 deleteFarm invalid ObjectId param
const resBadDeleteId = mockRes();
await deleteFarm({ params: { id: 'bad-id' }, user: { id: dummyUserId } }, resBadDeleteId, () => {});
assert(resBadDeleteId.statusCode === 400, "deleteFarm returns HTTP 400 for invalid MongoDB ObjectId");

// 4.4 deleteFarm nonexistent / unowned farm
Farm.findOne = async () => null;
const resDeleteNotFound = mockRes();
await deleteFarm({ params: { id: dummyFarmId }, user: { id: dummyUserId } }, resDeleteNotFound, () => {});
assert(resDeleteNotFound.statusCode === 404, "deleteFarm returns HTTP 404 for nonexistent or unowned farm");
Farm.findOne = origFarmFindOne;

// 4.5 deleteFarm with dependent records -> returns HTTP 409 Conflict
Farm.findOne = async () => ({ _id: dummyFarmId, userId: dummyUserId });
CropHistory.countDocuments = async () => 1;
SoilInformation.countDocuments = async () => 1;
ExternalSoilInformation.countDocuments = async () => 0;

const resConflict = mockRes();
await deleteFarm({ params: { id: dummyFarmId }, user: { id: dummyUserId } }, resConflict, () => {});
assert(resConflict.statusCode === 409, "deleteFarm returns HTTP 409 Conflict when dependent records exist");
assert(resConflict.body.success === false, "409 response indicates success: false");
assert(resConflict.body.message.includes('dependent records'), "409 message explains dependent records block deletion");
assert(resConflict.body.data.dependentCounts.cropHistory === 1, "409 returns exact dependent cropHistory counts");
assert(resConflict.body.data.dependentCounts.soilInformation === 1, "409 returns exact dependent soilInformation counts");

// 4.6 deleteFarm clean deletion -> returns HTTP 200
CropHistory.countDocuments = async () => 0;
SoilInformation.countDocuments = async () => 0;
ExternalSoilInformation.countDocuments = async () => 0;
Farm.deleteOne = async () => ({ deletedCount: 1 });

const resCleanDelete = mockRes();
await deleteFarm({ params: { id: dummyFarmId }, user: { id: dummyUserId } }, resCleanDelete, () => {});
assert(resCleanDelete.statusCode === 200, "deleteFarm returns HTTP 200 for clean deletion");
assert(resCleanDelete.body.success === true, "200 response indicates success: true");

// ---------------------------------------------------------------------------
// 5. Auth Middleware Unit Tests: protect
// ---------------------------------------------------------------------------
console.log("\n5. Authentication Middleware Tests — protect");

// 5.1 No authorization header
const resNoAuth = mockRes();
await protect({ headers: {} }, resNoAuth, () => {});
assert(resNoAuth.statusCode === 401, "protect middleware returns HTTP 401 when no token is provided");

// 5.2 Malformed token
const resBadToken = mockRes();
await protect({ headers: { authorization: 'Bearer invalid-token' } }, resBadToken, () => {});
assert(resBadToken.statusCode === 401, "protect middleware returns HTTP 401 for invalid JWT signature");

// 5.3 Valid token
process.env.JWT_SECRET = 'test-secret';
const validToken = jwt.sign({ id: dummyUserId }, process.env.JWT_SECRET, { expiresIn: '1h' });
const reqValid = { headers: { authorization: `Bearer ${validToken}` } };
let nextCalled = false;
await protect(reqValid, mockRes(), () => { nextCalled = true; });
assert(nextCalled === true, "protect middleware allows valid JWT");
assert(reqValid.user.id === dummyUserId, "protect middleware attaches user ID to req.user");

// ---------------------------------------------------------------------------
// 6. Schema & Database Index Verification (Step 24.17)
// ---------------------------------------------------------------------------
console.log("\n6. Schema & Database Index Verification");

const indexes = Farm.schema.indexes();
const userIndexTuple = indexes.find(([fields]) => fields.userId === 1);

assert(Boolean(userIndexTuple), "Farm schema defines an index on { userId: 1 }");
assert(userIndexTuple && userIndexTuple[0].userId === 1, "Index specifies ascending order for userId");
assert(!userIndexTuple || !userIndexTuple[1]?.unique, "Index on userId is non-unique (users may own multiple farms)");
assert(Farm.schema.path('userId').isRequired === true, "userId field remains strictly required");
assert(Farm.schema.path('userId').instance === 'ObjectId', "userId field is typed as Mongoose ObjectId");

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log("\n==================================================");
console.log(`Results: ${passed} PASSED, ${failed} FAILED`);
console.log("==================================================");

if (failed > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
