/**
 * server/test_farm_location_unit.js
 * ---------------------------------------------------------------------------
 * Unit test suite for Farm Location & Geolocation Enhancements:
 * 1. Farm creation validation with optional coordinates & location
 * 2. Farm update validation with optional coordinates & location
 * 3. Coordinate boundary validation (-90 to 90, -180 to 180)
 * 4. Reverse-geocoding endpoint and controller input validation
 * 5. Updatable fields and persistence of location attributes
 * ---------------------------------------------------------------------------
 */

import { validateFarmCreation, validateFarmUpdate } from './src/validators/farm.validator.js';
import { reverseGeocodeFarmLocation } from './src/controllers/farm.controller.js';
import Farm from './src/models/farm.model.js';
import { updateFarmService } from './src/services/farm.service.js';

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

console.log('==================================================');
console.log('Farm Location & Geolocation Unit Test Suite');
console.log('==================================================\n');

// 1. Creation Validation
console.log('1. Farm Creation Validation (Coordinates & Location)');
const baseFarm = {
    farmName: 'Surya Krishi Farm',
    area: 4.5,
    areaUnit: 'acre',
    nitrogen: 65,
    phosphorus: 35,
    potassium: 40,
    pH: 6.8,
};

// 1.1 Valid coordinates & location
const validCreateWithLoc = validateFarmCreation({
    ...baseFarm,
    latitude: 22.719568,
    longitude: 75.857727,
    location: 'Sanwer, Indore, Madhya Pradesh',
});
assert(validCreateWithLoc.length === 0, 'Accepts valid farm creation with coordinates and location');

// 1.2 Optionality preserved (no coords, no location)
const validCreateWithoutLoc = validateFarmCreation({ ...baseFarm });
assert(validCreateWithoutLoc.length === 0, 'Accepts farm creation without coordinates or location (strictly optional)');

// 1.3 Out of bounds latitude
const errLatHigh = validateFarmCreation({ ...baseFarm, latitude: 91.5 });
assert(errLatHigh.some(e => e.path === 'latitude'), 'Rejects latitude > 90 on creation');

const errLatLow = validateFarmCreation({ ...baseFarm, latitude: -91.5 });
assert(errLatLow.some(e => e.path === 'latitude'), 'Rejects latitude < -90 on creation');

// 1.4 Out of bounds longitude
const errLngHigh = validateFarmCreation({ ...baseFarm, longitude: 181 });
assert(errLngHigh.some(e => e.path === 'longitude'), 'Rejects longitude > 180 on creation');

const errLngLow = validateFarmCreation({ ...baseFarm, longitude: -185 });
assert(errLngLow.some(e => e.path === 'longitude'), 'Rejects longitude < -180 on creation');

// 1.5 Invalid location type
const errLocType = validateFarmCreation({ ...baseFarm, location: 12345 });
assert(errLocType.some(e => e.path === 'location'), 'Rejects non-string location on creation');


// 2. Update Validation
console.log('\n2. Farm Update Validation (Coordinates & Location)');

// 2.1 Updating location alone
const updateLocOnly = validateFarmUpdate({ location: 'Ujjain, Madhya Pradesh' });
assert(updateLocOnly.length === 0, 'Accepts partial update with location alone');

// 2.2 Updating coordinates
const updateCoords = validateFarmUpdate({ latitude: 23.1765, longitude: 75.7885 });
assert(updateCoords.length === 0, 'Accepts partial update with latitude and longitude');

// 2.3 Invalid update coordinates
const errUpdateLat = validateFarmUpdate({ latitude: 95 });
assert(errUpdateLat.some(e => e.path === 'latitude'), 'Rejects latitude > 90 on update');

const errUpdateLng = validateFarmUpdate({ longitude: -185 });
assert(errUpdateLng.some(e => e.path === 'longitude'), 'Rejects longitude < -180 on update');

// 2.4 Unsupported field alongside location
const errUnknownWithLoc = validateFarmUpdate({ location: 'Indore', randomField: 'bad' });
assert(errUnknownWithLoc.some(e => e.path === 'randomField'), 'Rejects unknown field while supporting location');


// 3. Service Layer Updatable Fields
console.log('\n3. Service Layer Updatable Fields');
const origFindOneAndUpdate = Farm.findOneAndUpdate;
let capturedSet = null;

Farm.findOneAndUpdate = async (query, update) => {
    capturedSet = update.$set;
    return { _id: query._id, ...update.$set };
};

await updateFarmService('507f1f77bcf86cd799439011', '607f1f77bcf86cd799439022', {
    location: 'Khandwa, MP',
    latitude: 21.8257,
    longitude: 76.3526,
    hackerField: 'drop_database',
});

assert(capturedSet.location === 'Khandwa, MP', 'updateFarmService updates location field');
assert(capturedSet.latitude === 21.8257, 'updateFarmService updates latitude field');
assert(capturedSet.longitude === 76.3526, 'updateFarmService updates longitude field');
assert(capturedSet.hackerField === undefined, 'updateFarmService strips unapproved fields');

Farm.findOneAndUpdate = origFindOneAndUpdate;


// 4. Reverse Geocode Controller Unit Tests
console.log('\n4. Reverse Geocode Controller Unit Tests');

const createMockRes = () => {
    const res = {};
    res.statusCode = 200;
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

// 4.1 Missing coordinates
const resMissing = createMockRes();
await reverseGeocodeFarmLocation({ query: {} }, resMissing, () => {});
assert(resMissing.statusCode === 400, 'Returns 400 when coordinates are missing');
assert(resMissing.body?.success === false, 'Returns success: false for missing coordinates');

// 4.2 Invalid latitude range
const resBadLat = createMockRes();
await reverseGeocodeFarmLocation({ query: { lat: '100', lon: '77' } }, resBadLat, () => {});
assert(resBadLat.statusCode === 400, 'Returns 400 when latitude is out of bounds (> 90)');

// 4.3 Invalid longitude range
const resBadLng = createMockRes();
await reverseGeocodeFarmLocation({ query: { lat: '28', lon: '200' } }, resBadLng, () => {});
assert(resBadLng.statusCode === 400, 'Returns 400 when longitude is out of bounds (> 180)');

// 4.4 Non-numeric coordinates
const resNaN = createMockRes();
await reverseGeocodeFarmLocation({ query: { lat: 'abc', lon: 'xyz' } }, resNaN, () => {});
assert(resNaN.statusCode === 400, 'Returns 400 when coordinates are non-numeric');

console.log('\n==================================================');
console.log(`Results: ${passed} PASSED, ${failed} FAILED`);
console.log('==================================================');

if (failed > 0) process.exit(1);
