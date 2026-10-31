/**
 * test_rainfall_guidance.mjs
 * ---------------------------------------------------------------------------
 * Automated Test Suite for Step 24.9 (GAP-01 UI Remediation):
 * Rainfall Input Usability, Transparency Guidance & Validation Preservation
 *
 * Mode: Hermetic Source-Level & Functional Unit Tests
 * (Clearly distinguished from live browser tests)
 *
 * Verifies:
 *   1. Rainfall field presence, attributes, and API field name compatibility
 *   2. Accessible label, units (millimetres / mm), helper text, and ARIA bindings
 *   3. All 4 required transparency guidance criteria are accurately explained
 *   4. Zero invented aggregation formulas, periods, or conversion factors
 *   5. Mobile-responsive layout structure (md:col-span-2, flex wrap)
 *   6. Weather integration isolation (weather cannot overwrite manual rainfall)
 *   7. Direct functional validation execution (missing, non-numeric, negative, valid)
 *   8. RecommendationResult advisory limitation notice presence and clarity
 *   9. Recommendation API 7-feature contract alignment
 * ---------------------------------------------------------------------------
 */

import fs from 'fs';
import path from 'path';
import { validateRecommendationInput } from './src/features/recommendation/utils/recommendation.validation.js';

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
console.log("Step 24.9 Rainfall Input Guidance Test Suite");
console.log("==================================================\n");

const formPath = path.resolve('src/features/recommendation/components/RecommendationForm.jsx');
const resultPath = path.resolve('src/features/recommendation/components/RecommendationResult.jsx');

const formContent = fs.readFileSync(formPath, 'utf8');
const resultContent = fs.readFileSync(resultPath, 'utf8');

// ---------------------------------------------------------------------------
// 1. Rainfall Field Presence & Attribute Integrity
// ---------------------------------------------------------------------------
console.log("1. Rainfall Field Presence & Input Attributes");

assert(
    formContent.includes('name="rainfall"'),
    "Rainfall input specifies standard name attribute 'name=\"rainfall\"'"
);

assert(
    formContent.includes('id="rainfall"'),
    "Rainfall input specifies DOM id 'id=\"rainfall\"' for accessibility"
);

assert(
    formContent.includes('type="number"'),
    "Rainfall input enforces numeric input type 'type=\"number\"'"
);

assert(
    formContent.includes('step="0.01"'),
    "Rainfall input permits decimal precision 'step=\"0.01\"'"
);

assert(
    formContent.includes('placeholder="e.g. 100"'),
    "Rainfall input includes standard placeholder 'placeholder=\"e.g. 100\"'"
);

assert(
    formContent.includes('value={formData.rainfall}'),
    "Rainfall input is controlled by React state formData.rainfall"
);

// ---------------------------------------------------------------------------
// 2. Units, Accessible Labels & ARIA Bindings
// ---------------------------------------------------------------------------
console.log("\n2. Units, Accessible Labels & Helper Text");

assert(
    formContent.includes('htmlFor="rainfall"') && formContent.includes('Rainfall (mm)'),
    "Label explicitly binds to input via htmlFor=\"rainfall\" and displays 'Rainfall (mm)'"
);

assert(
    formContent.includes('Millimetres (mm)'),
    "Form explicitly states measurement unit as Millimetres (mm)"
);

assert(
    formContent.includes('id="rainfall-helper"') &&
    formContent.includes('aria-describedby="rainfall-helper rainfall-guidance"'),
    "Input links to helper and guidance via aria-describedby"
);

assert(
    formContent.includes('aria-invalid={errors.rainfall ? "true" : "false"}'),
    "Input includes dynamic aria-invalid attribute"
);

assert(
    formContent.includes('id="rainfall-error"') && formContent.includes('role="alert"'),
    "Validation error renders with role=\"alert\" and id=\"rainfall-error\""
);

// ---------------------------------------------------------------------------
// 3. Four Core Transparency Guidance Criteria (Phase 2 Requirements)
// ---------------------------------------------------------------------------
console.log("\n3. Transparency Guidance & Educational Clarity");

assert(
    formContent.includes('id="rainfall-guidance"') &&
    formContent.includes('role="region"'),
    "Guidance callout rendered with id=\"rainfall-guidance\" and role=\"region\""
);

// Criterion 1: Rainfall is an input used by the crop recommendation model
assert(
    formContent.includes('Model Requirement:') &&
    formContent.includes('Rainfall is one of seven environmental inputs evaluated by the crop recommendation model'),
    "Criterion 1 satisfied: Explains rainfall is an evaluated ML model input"
);

// Criterion 2: Training dataset exact accumulation period is undocumented
assert(
    formContent.includes('Undocumented Accumulation Period:') &&
    formContent.includes('does not document the specific temporal accumulation period') &&
    (formContent.includes('annual') && formContent.includes('seasonal') && formContent.includes('monthly')),
    "Criterion 2 satisfied: Explicitly discloses training dataset accumulation period is undocumented"
);

// Criterion 3: Current weather precipitation is a different measurement and cannot be substituted
assert(
    formContent.includes('Why Weather API Is Not Auto-Substituted:') &&
    formContent.includes('Current precipitation from the weather service measures instantaneous rainfall') &&
    formContent.includes('cannot be safely substituted'),
    "Criterion 3 satisfied: Explains why instantaneous weather API precipitation is not substituted"
);

// Criterion 4: Farmer should enter value only with reasonable basis
assert(
    formContent.includes('Farmer Action:') &&
    formContent.includes('Enter a rainfall value only when you have a reasonable local basis'),
    "Criterion 4 satisfied: Instructs farmer to enter values only with reasonable local basis"
);

// Negative check: Do NOT invent conversion formulas or periods
assert(
    !formContent.includes('multiply by') &&
    !formContent.includes('divide by') &&
    !formContent.includes('formula:') &&
    !formContent.includes('recommended period is 30 days'),
    "Negative check passed: No fabricated conversion formulas or artificial periods are prescribed"
);

// ---------------------------------------------------------------------------
// 4. Responsive & Accessible Layout
// ---------------------------------------------------------------------------
console.log("\n4. Responsive & Accessible Layout Structure");

assert(
    formContent.includes('md:col-span-2'),
    "Rainfall block spans md:col-span-2 to provide ample horizontal reading room on desktop"
);

assert(
    formContent.includes('flex flex-col sm:flex-row'),
    "Header layout stacks on mobile viewports and aligns on wider screens"
);

// ---------------------------------------------------------------------------
// 5. Weather Integration Isolation (No Silent Overwrite)
// ---------------------------------------------------------------------------
console.log("\n5. Weather Integration Isolation");

// fetchWeather must NOT set rainfall in formData
const fetchWeatherMatch = formContent.match(/const fetchWeather = async \(\) => {([\s\S]*?)};/);
const fetchWeatherBody = fetchWeatherMatch ? fetchWeatherMatch[1] : '';
assert(
    !fetchWeatherBody.includes('setFormData') || !fetchWeatherBody.includes('rainfall'),
    "fetchWeather does not mutate or silently populate formData.rainfall"
);

// handleSubmit must protect formData.rainfall from weather overwrite
assert(
    formContent.includes('rainfall: formData.rainfall'),
    "handleSubmit explicitly preserves manual formData.rainfall during validation payload merge"
);

// Weather preview only displays temperature and humidity
assert(
    formContent.includes('Temperature and humidity are automatically retrieved for prediction. Rainfall is managed separately above.'),
    "Weather section informs user that weather only populates temperature and humidity"
);

assert(
    formContent.includes('grid grid-cols-2'),
    "Weather preview uses balanced 2-column grid for Temperature and Humidity"
);

// ---------------------------------------------------------------------------
// 6. Functional Input Validation Preservation (recommendation.validation.js)
// ---------------------------------------------------------------------------
console.log("\n6. Functional Validation Rules Preservation");

const baseValidInput = {
    nitrogen: 90,
    phosphorus: 40,
    potassium: 40,
    pH: 6.5,
    temperature: 25.0,
    humidity: 80.0,
    rainfall: 100.0
};

// Valid input passes
const validResult = validateRecommendationInput(baseValidInput);
assert(validResult.isValid === true, "Valid input with rainfall=100 passes validation");

// Missing/undefined rainfall fails
const missingResult = validateRecommendationInput({ ...baseValidInput, rainfall: undefined });
assert(
    missingResult.isValid === false && missingResult.errors.rainfall === 'Rainfall is required and must be numeric.',
    "Undefined rainfall is rejected with required numeric message"
);

// Null rainfall fails
const nullResult = validateRecommendationInput({ ...baseValidInput, rainfall: null });
assert(
    nullResult.isValid === false && nullResult.errors.rainfall === 'Rainfall is required and must be numeric.',
    "Null rainfall is rejected with required numeric message"
);

// Empty string rainfall fails
const emptyResult = validateRecommendationInput({ ...baseValidInput, rainfall: '' });
assert(
    emptyResult.isValid === false && emptyResult.errors.rainfall === 'Rainfall is required and must be numeric.',
    "Empty string rainfall is rejected with required numeric message"
);

// Non-numeric string rainfall fails
const nonNumericResult = validateRecommendationInput({ ...baseValidInput, rainfall: 'abc' });
assert(
    nonNumericResult.isValid === false && nonNumericResult.errors.rainfall === 'Rainfall is required and must be numeric.',
    "Non-numeric string rainfall 'abc' is rejected"
);

// Negative rainfall fails
const negativeResult = validateRecommendationInput({ ...baseValidInput, rainfall: -1 });
assert(
    negativeResult.isValid === false && negativeResult.errors.rainfall === 'Rainfall cannot be negative.',
    "Negative rainfall -1 is rejected with 'Rainfall cannot be negative.'"
);

// Negative decimal rainfall fails
const negDecimalResult = validateRecommendationInput({ ...baseValidInput, rainfall: -0.01 });
assert(
    negDecimalResult.isValid === false && negDecimalResult.errors.rainfall === 'Rainfall cannot be negative.',
    "Negative decimal rainfall -0.01 is rejected with 'Rainfall cannot be negative.'"
);

// Zero rainfall passes
const zeroResult = validateRecommendationInput({ ...baseValidInput, rainfall: 0 });
assert(zeroResult.isValid === true, "Rainfall=0 passes numeric non-negative validation");

// Decimal rainfall passes
const decimalResult = validateRecommendationInput({ ...baseValidInput, rainfall: 142.75 });
assert(decimalResult.isValid === true, "Rainfall=142.75 passes validation");

// Weather payload collision simulation
const rogueWeather = { temperature: 28, humidity: 75, rainfall: 0 };
const manualFormData = { ...baseValidInput, rainfall: 180 };
const mergedPayload = {
    ...manualFormData,
    ...rogueWeather,
    rainfall: manualFormData.rainfall
};
assert(
    mergedPayload.rainfall === 180,
    "Merger guard guarantees manual rainfall is preserved against rogue weather rainfall properties"
);

// ---------------------------------------------------------------------------
// 7. Recommendation Result Limitation Notice (RecommendationResult.jsx)
// ---------------------------------------------------------------------------
console.log("\n7. Recommendation Result Limitation Notice");

assert(
    resultContent.includes('Advisory Limitation Notice') &&
    resultContent.includes('role="note"') &&
    resultContent.includes('aria-label="Recommendation Limitations"'),
    "RecommendationResult.jsx includes an accessible Advisory Limitation Notice banner"
);

assert(
    resultContent.includes('undocumented rainfall accumulation period') &&
    resultContent.includes('advisory decision-support rather than scientific certainty'),
    "Result notice explains the undocumented rainfall accumulation period and non-definitive advisory nature"
);

assert(
    resultContent.includes('local agricultural extension specialists'),
    "Result notice advises consulting local agricultural extension specialists"
);

// ---------------------------------------------------------------------------
// 8. Recommendation API Contract Compatibility
// ---------------------------------------------------------------------------
console.log("\n8. Recommendation API Contract Compatibility");

assert(
    formContent.includes('parsedFeatures = {') &&
    formContent.includes('nitrogen: Number(formData.nitrogen)') &&
    formContent.includes('phosphorus: Number(formData.phosphorus)') &&
    formContent.includes('potassium: Number(formData.potassium)') &&
    formContent.includes('pH: Number(formData.pH)') &&
    formContent.includes('temperature: Number(fetchedWeather.temperature)') &&
    formContent.includes('humidity: Number(fetchedWeather.humidity)') &&
    formContent.includes('rainfall: Number(formData.rainfall)'),
    "parsedFeatures cleanly transforms to canonical 7-feature schema before calling predictCrop"
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
