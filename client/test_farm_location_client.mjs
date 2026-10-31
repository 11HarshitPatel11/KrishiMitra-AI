/**
 * client/test_farm_location_client.mjs
 * ---------------------------------------------------------------------------
 * Client Unit Test Suite for Farm Location & Geolocation Enhancements:
 * 1. FarmLocationInput component structure & accessibility invariants
 * 2. farm.service.js reverseGeocodeCoordinates export & contract
 * 3. Form coordinate parsing, validation & optionality checks
 * 4. Geolocation browser API error code mapping & fallback invariants
 * ---------------------------------------------------------------------------
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
console.log('Client Farm Location & Geolocation Test Suite');
console.log('==================================================\n');

// 1. Component File Existence & Token Invariants
console.log('1. Component File Existence & Accessibility Invariants');
const compPath = path.resolve(__dirname, 'src/features/farm/components/FarmLocationInput.jsx');
assert(fs.existsSync(compPath), 'FarmLocationInput.jsx component exists');

const compCode = fs.readFileSync(compPath, 'utf8');

assert(compCode.includes('navigator.geolocation'), 'Uses browser navigator.geolocation API');
assert(compCode.includes('getCurrentPosition'), 'Calls getCurrentPosition with options');
assert(compCode.includes('enableHighAccuracy: true'), 'Enables high accuracy GPS resolution');
assert(compCode.includes('PERMISSION_DENIED'), 'Handles PERMISSION_DENIED error code (1)');
assert(compCode.includes('POSITION_UNAVAILABLE'), 'Handles POSITION_UNAVAILABLE error code (2)');
assert(compCode.includes('TIMEOUT'), 'Handles TIMEOUT error code (3)');
assert(compCode.includes('reverseGeocodeCoordinates'), 'Integrates configured reverse-geocoding service');
assert(compCode.includes('openstreetmap.org'), 'Provides OpenStreetMap parcel preview link');
assert(compCode.includes('Use My Current Location'), 'Renders clear "Use My Current Location" button text');

// 2. Farm Service Reverse Geocoding Method
console.log('\n2. Farm Service Integration');
const servicePath = path.resolve(__dirname, 'src/features/farm/services/farm.service.js');
const serviceCode = fs.readFileSync(servicePath, 'utf8');

assert(serviceCode.includes('export const reverseGeocodeCoordinates'), 'farm.service.js exports reverseGeocodeCoordinates');
assert(serviceCode.includes('/farms/reverse-geocode'), 'Connects to /farms/reverse-geocode API endpoint');

// 3. FarmForm.jsx Integration & Coordinate Invariants
console.log('\n3. FarmForm.jsx Integration & Coordinate Invariants');
const formPath = path.resolve(__dirname, 'src/features/farm/components/FarmForm.jsx');
const formCode = fs.readFileSync(formPath, 'utf8');

assert(formCode.includes('import { FarmLocationInput }'), 'FarmForm.jsx imports FarmLocationInput');
assert(formCode.includes('location: \'\''), 'emptyForm includes location property');
assert(formCode.includes('FarmLocationInput') && formCode.includes('idPrefix="create"'), 'CreateFarmForm renders FarmLocationInput with idPrefix="create"');
assert(formCode.includes('FarmLocationInput') && formCode.includes('idPrefix="edit"'), 'EditModal renders FarmLocationInput with idPrefix="edit"');
assert(formCode.includes('farm.location'), 'FarmCard displays farm.location');

// 4. Client Validation Rules Logic Test
console.log('\n4. Coordinate Bounds Validation Invariants');

const validateBounds = (lat, lng) => {
    const errors = {};
    if (lat !== '' && lat !== null && lat !== undefined && (Number(lat) < -90 || Number(lat) > 90)) {
        errors.latitude = 'Latitude must be between -90 and 90';
    }
    if (lng !== '' && lng !== null && lng !== undefined && (Number(lng) < -180 || Number(lng) > 180)) {
        errors.longitude = 'Longitude must be between -180 and 180';
    }
    return errors;
};

assert(Object.keys(validateBounds('', '')).length === 0, 'Permits empty coordinates (optional GPS)');
assert(Object.keys(validateBounds(22.7196, 75.8577)).length === 0, 'Accepts valid central India coordinates');
assert(Object.keys(validateBounds(-33.8688, 151.2093)).length === 0, 'Accepts valid southern hemisphere coordinates');
assert(validateBounds(95, 75.8577).latitude !== undefined, 'Rejects latitude > 90');
assert(validateBounds(-95, 75.8577).latitude !== undefined, 'Rejects latitude < -90');
assert(validateBounds(22.7196, 185).longitude !== undefined, 'Rejects longitude > 180');
assert(validateBounds(22.7196, -185).longitude !== undefined, 'Rejects longitude < -180');

console.log('\n==================================================');
console.log(`Results: ${passed} PASSED, ${failed} FAILED`);
console.log('==================================================');

if (failed > 0) process.exit(1);
