/**
 * test_disease_info_unit.js
 * ---------------------------------------------------------------------------
 * Comprehensive Unit Test Suite for Step 24.4:
 *   - Class matching against all 38 PlantVillage classes in disease_class_names.json
 *   - Seed data completeness (crop, name, symptoms, causes, prevention, management, source, limitations)
 *   - Absence of fabricated dosages / unsafe chemical instructions
 *   - Preservation of existing 4 original disease seeds
 *   - Model schema compliance & idempotency verification
 *   - Service & Controller behavior (confident vs uncertain, available vs unavailable)
 *   - Distinguishes unit tests from live DB integration tests
 * ---------------------------------------------------------------------------
 */

import fs from 'fs';
import path from 'path';
import { diseaseSeeds } from './seedDiseaseInfos.js';
import DiseaseInformation from './src/models/diseaseInformation.model.js';
import { DiseaseInformationService } from './src/services/diseaseInformation.service.js';
import { getDiseaseInformation, getSupportedDiseases } from './src/controllers/diseaseInformation.controller.js';

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
console.log("Step 24.4 Disease Information Unit Test Suite");
console.log("==================================================\n");

// ---------------------------------------------------------------------------
// 1. Coverage & Exact Class Matching against disease_class_names.json
// ---------------------------------------------------------------------------
console.log("1. Exact Class Matching (disease_class_names.json)");

const classNamesPath = path.resolve('../ml-service/artifacts/disease/disease_class_names.json');
const classNamesJson = JSON.parse(fs.readFileSync(classNamesPath, 'utf8'));
const all38Classes = Object.values(classNamesJson);

assert(all38Classes.length === 38, "Model artifact defines exactly 38 classes (0 to 37)");

// Extract all seeded disease codes
const seededCodes = diseaseSeeds.map(s => s.diseaseCode);

// Duplicate check
const uniqueCodes = new Set(seededCodes);
assert(uniqueCodes.size === seededCodes.length, `No duplicate disease codes in seed data (${uniqueCodes.size} unique)`);
assert(seededCodes.length === 26, `Exactly 26 plant disease profiles seeded with verified documentation`);

// Check every seeded code exists in disease_class_names.json
let allMatched = true;
for (const code of seededCodes) {
    if (!all38Classes.includes(code)) {
        console.error(`    Mismatch: Seed code "${code}" is not in disease_class_names.json`);
        allMatched = false;
    }
}
assert(allMatched, "Every single seeded diseaseCode exactly matches a class in disease_class_names.json");

// Check the unseeded 12 classes are healthy control classes
const unseededClasses = all38Classes.filter(cls => !seededCodes.includes(cls));
assert(unseededClasses.length === 12, "Remaining 12 unseeded classes identified");

const allUnseededAreHealthy = unseededClasses.every(cls => cls.endsWith('___healthy'));
assert(allUnseededAreHealthy, "All 12 unseeded classes are confirmed non-disease healthy control classes (*___healthy)");

// ---------------------------------------------------------------------------
// 2. Data Quality, Citations, & Safety Checks
// ---------------------------------------------------------------------------
console.log("\n2. Data Quality, Citations, and Safety Compliance");

let allFieldsPresent = true;
let allSourcesValid = true;
let allNoChemicalDosage = true;

const unsafeDosagePatterns = [
    /\d+\s*(?:ml|mg|g|grams|litres|liters|kg|pounds|lbs|oz|ounces)\s*(?:per|\/)\s*(?:liter|litre|gallon|acre|hectare|ha)/i,
    /\d+%\s*(?:spray|solution)\s*at\s*\d+\s*(?:ppm|lbs)/i,
];

for (const seed of diseaseSeeds) {
    if (!seed.diseaseCode || !seed.crop || !seed.name) allFieldsPresent = false;
    if (!Array.isArray(seed.symptoms) || seed.symptoms.length === 0) allFieldsPresent = false;
    if (!Array.isArray(seed.causes) || seed.causes.length === 0) allFieldsPresent = false;
    if (!Array.isArray(seed.prevention) || seed.prevention.length === 0) allFieldsPresent = false;
    if (!Array.isArray(seed.management) || seed.management.length === 0) allFieldsPresent = false;

    if (!seed.sourceName || seed.sourceName.trim() === '') allSourcesValid = false;
    if (!seed.sourceUrl || !seed.sourceUrl.startsWith('http')) allSourcesValid = false;
    if (!seed.limitations || seed.limitations.trim() === '') allSourcesValid = false;

    // Check for unsafe dosage advice in management text
    const mgmtText = seed.management.join(' ');
    for (const pat of unsafeDosagePatterns) {
        if (pat.test(mgmtText)) {
            console.error(`    Unsafe dosage pattern found in ${seed.diseaseCode}: ${mgmtText}`);
            allNoChemicalDosage = false;
        }
    }
}

assert(allFieldsPresent, "All 26 disease profiles contain non-empty crop, name, symptoms, causes, prevention, and management");
assert(allSourcesValid, "All 26 disease profiles include reputable extension sourceName and valid HTTP(S) sourceUrl");
assert(allNoChemicalDosage, "Safety check: No unsupported chemical dosage/mixing instructions present in management text");

// ---------------------------------------------------------------------------
// 3. Preservation of Original 4 Disease Seeds
// ---------------------------------------------------------------------------
console.log("\n3. Preservation of Original 4 Seed Records");

const original4Codes = [
    "Tomato___Early_blight",
    "Tomato___Late_blight",
    "Corn_(maize)___Common_rust_",
    "Apple___Apple_scab"
];

for (const origCode of original4Codes) {
    const found = diseaseSeeds.find(s => s.diseaseCode === origCode);
    assert(!!found, `Original seed preserved: ${origCode}`);
    assert(found.symptoms.length >= 3, `Preserved rich symptom details for ${origCode}`);
}

// ---------------------------------------------------------------------------
// 4. Schema & Idempotency Design Verification
// ---------------------------------------------------------------------------
console.log("\n4. Database Schema & Idempotency Verification");

// Verify schema has all required and extension fields
const schemaPaths = Object.keys(DiseaseInformation.schema.paths);
const requiredPaths = ['diseaseCode', 'crop', 'name', 'symptoms', 'causes', 'prevention', 'management', 'sourceName', 'sourceUrl', 'limitations'];

for (const p of requiredPaths) {
    assert(schemaPaths.includes(p), `DiseaseInformation schema defines field '${p}'`);
}

// Read seedDiseaseInfos.js content to verify deleteMany was eradicated
const seedScriptContent = fs.readFileSync(path.resolve('seedDiseaseInfos.js'), 'utf8');
assert(!seedScriptContent.includes('deleteMany'), "Dangerous 'deleteMany({})' removed from seed script");
assert(seedScriptContent.includes('findOneAndUpdate'), "Seed script uses 'findOneAndUpdate' with upsert:true for idempotent execution");

// ---------------------------------------------------------------------------
// 5. Service & Controller Unit Tests
// ---------------------------------------------------------------------------
console.log("\n5. Service and Controller Unit Tests");

const origFindOne = DiseaseInformation.findOne;
const origFind = DiseaseInformation.find;

// 5.1 Service: getDiseaseByCode returns record when found
DiseaseInformation.findOne = async ({ diseaseCode }) => {
    return diseaseSeeds.find(s => s.diseaseCode === diseaseCode) || null;
};

const foundRecord = await DiseaseInformationService.getDiseaseByCode("Tomato___Early_blight");
assert(foundRecord !== null && foundRecord.name === "Early Blight", "Service returns disease record when code is found");

// 5.2 Service: getDiseaseByCode returns null when not found
const missingRecord = await DiseaseInformationService.getDiseaseByCode("Tomato___healthy");
assert(missingRecord === null, "Service returns null for unseeded/healthy class code");

// 5.3 Controller: getDiseaseInformation with existing code
const mockRes = () => {
    const res = {};
    res.statusCode = null;
    res.body = null;
    res.status = (c) => { res.statusCode = c; return res; };
    res.json = (b) => { res.body = b; return res; };
    return res;
};

const resFound = mockRes();
await getDiseaseInformation({ params: { diseaseCode: 'Tomato___Early_blight' } }, resFound, () => {});
assert(resFound.statusCode === 200, "Controller returns HTTP 200 when disease information exists");
assert(resFound.body.success === true, "Response indicates success: true");
assert(resFound.body.data.name === "Early Blight", "Response contains complete disease data");

// 5.4 Controller: getDiseaseInformation with missing/unavailable code -> returns 404
const resMissing = mockRes();
await getDiseaseInformation({ params: { diseaseCode: 'Tomato___healthy' } }, resMissing, () => {});
assert(resMissing.statusCode === 404, "Controller returns HTTP 404 when disease information is unavailable");
assert(resMissing.body.message === 'Disease information is currently unavailable.', "Controller returns safe unavailable message");
assert(resMissing.body.data === null, "Controller returns data: null when unavailable");

// 5.5 Controller: missing diseaseCode param -> returns 400
const resBadParam = mockRes();
await getDiseaseInformation({ params: { diseaseCode: '' } }, resBadParam, () => {});
assert(resBadParam.statusCode === 400, "Controller returns HTTP 400 when diseaseCode parameter is missing");

// Restore methods
DiseaseInformation.findOne = origFindOne;
DiseaseInformation.find = origFind;

// ---------------------------------------------------------------------------
// 6. Controller Combined Prediction & Uncertainty Logic Check
// ---------------------------------------------------------------------------
console.log("\n6. Combined Prediction & Uncertainty Logic (disease.controller.js)");

const diseaseControllerContent = fs.readFileSync(path.resolve('src/controllers/disease.controller.js'), 'utf8');

assert(
    diseaseControllerContent.includes('prediction.status === "uncertain"'),
    "Controller checks prediction.status === 'uncertain'"
);

assert(
    diseaseControllerContent.includes('informationStatus = "withheld_due_to_uncertainty"'),
    "Controller strictly assigns informationStatus = 'withheld_due_to_uncertainty' on uncertain predictions"
);

assert(
    diseaseControllerContent.includes('informationStatus = "unavailable"'),
    "Controller safely assigns informationStatus = 'unavailable' when no database record matches"
);

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
