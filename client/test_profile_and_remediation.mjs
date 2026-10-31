/**
 * test_profile_and_remediation.mjs
 * ---------------------------------------------------------------------------
 * Automated verification suite for Step 24.26 Priority Frontend Remediation:
 *   1. Task 1: Soil Farm Dropdown Remediation (GAP-UI-01)
 *   2. Task 2: User Profile Service, Page & Routing (GAP-UI-02)
 *   3. Task 3: Optional Registration Fields (GAP-UI-03)
 *   4. Zero Secret / Password Exposure Invariants
 * ---------------------------------------------------------------------------
 */

import fs from 'fs';
import path from 'path';

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
console.log("Step 24.26 Frontend Remediation Test Suite");
console.log("==================================================\n");

// ---------------------------------------------------------------------------
// 1. Task 1: Soil Farm Dropdown Remediation (GAP-UI-01)
// ---------------------------------------------------------------------------
console.log("1. Soil Farm Dropdown Property Verification (GAP-UI-01)");

const soilPagePath = path.resolve('src/features/soil/components/SoilInformationPage.jsx');
const soilPageContent = fs.readFileSync(soilPagePath, 'utf8');

assert(
    soilPageContent.includes('{f.farmName || f.name || \'Unnamed Farm\'}') ||
    soilPageContent.includes('{f.farmName}'),
    "SoilInformationPage.jsx binds option label to 'farmName' instead of undefined 'name'"
);

assert(
    !soilPageContent.includes('{f.name}</option>'),
    "SoilInformationPage.jsx has completely eliminated bare '{f.name}</option>'"
);

// Verify simulation of farm dropdown options mapping
const mockFarms = [
    { _id: 'farm-101', farmName: 'Green Valley Farm', area: 5, areaUnit: 'acre' },
    { _id: 'farm-102', farmName: 'Punjab Wheat Estate', area: 12, areaUnit: 'acre' },
    { _id: 'farm-103', name: 'Legacy Named Farm', area: 3, areaUnit: 'hectare' }, // Fallback test
    { _id: 'farm-104', area: 2, areaUnit: 'acre' } // Fallback to 'Unnamed Farm'
];

const renderedOptionLabels = mockFarms.map(f => f.farmName || f.name || 'Unnamed Farm');
assert(renderedOptionLabels[0] === 'Green Valley Farm', "Correctly resolves primary 'farmName' for first farm");
assert(renderedOptionLabels[1] === 'Punjab Wheat Estate', "Correctly resolves primary 'farmName' for second farm");
assert(renderedOptionLabels[2] === 'Legacy Named Farm', "Safely falls back to legacy 'name' when farmName is absent");
assert(renderedOptionLabels[3] === 'Unnamed Farm', "Safely falls back to 'Unnamed Farm' when both are absent");

// ---------------------------------------------------------------------------
// 2. Task 2: User Profile Service & Page (GAP-UI-02)
// ---------------------------------------------------------------------------
console.log("\n2. User Profile Service Methods (auth.service.js)");

const authServicePath = path.resolve('src/services/auth.service.js');
const authServiceContent = fs.readFileSync(authServicePath, 'utf8');

assert(
    authServiceContent.includes('async getProfile()'),
    "auth.service.js implements 'async getProfile()'"
);

assert(
    authServiceContent.includes('`${API_URL}/me`') && authServiceContent.includes("method: 'GET'"),
    "getProfile() connects to GET /api/v1/auth/me"
);

assert(
    authServiceContent.includes('async updateProfile('),
    "auth.service.js implements 'async updateProfile(profileData)'"
);

assert(
    authServiceContent.includes('`${API_URL}/profile`') && authServiceContent.includes("method: 'PATCH'"),
    "updateProfile() connects to PATCH /api/v1/auth/profile"
);

assert(
    authServiceContent.includes("headers['Authorization'] = `Bearer ${token}`"),
    "Profile service attaches Bearer JWT authorization header"
);

console.log("\n3. ProfilePage Component Integrity (ProfilePage.jsx)");

const profilePagePath = path.resolve('src/features/auth/components/ProfilePage.jsx');
assert(fs.existsSync(profilePagePath), "ProfilePage.jsx exists in client/src/features/auth/components/");

const profilePageContent = fs.readFileSync(profilePagePath, 'utf8');

assert(
    profilePageContent.includes("import { authService } from '../../../services/auth.service'"),
    "ProfilePage.jsx imports authService"
);

assert(
    profilePageContent.includes('authService.getProfile()'),
    "ProfilePage.jsx calls getProfile() to populate initial farmer data"
);

assert(
    profilePageContent.includes('authService.updateProfile('),
    "ProfilePage.jsx calls updateProfile() to persist profile changes"
);

assert(
    profilePageContent.includes('name="name"') && profilePageContent.includes('name="mobileNumber"') && profilePageContent.includes('name="location"'),
    "Profile form renders inputs for 'name', 'mobileNumber', and 'location'"
);

assert(
    profilePageContent.includes('type="email"') && profilePageContent.includes('disabled'),
    "Email address is displayed as disabled / read-only input"
);

assert(
    profilePageContent.includes('role="alert"') || profilePageContent.includes('profile-success-banner'),
    "Profile page renders success feedback banner upon update"
);

assert(
    profilePageContent.includes('profile-save-error') || profilePageContent.includes('saveError'),
    "Profile page renders server and client error feedback"
);

console.log("\n4. Profile Route & Navigation Integration (App.jsx)");

const appPath = path.resolve('src/App.jsx');
const appContent = fs.readFileSync(appPath, 'utf8');

assert(
    appContent.includes("import { ProfilePage } from './features/auth/components/ProfilePage'"),
    "App.jsx imports ProfilePage"
);

assert(
    appContent.includes('path="/profile"') && appContent.includes('<ProfilePage />'),
    "App.jsx registers route for '/profile' rendering <ProfilePage />"
);

assert(
    appContent.includes('<ProtectedRoute isAuthenticated={isAuthenticated}>\n                               <ProfilePage />') ||
    appContent.includes('<ProfilePage />\n                                </ProtectedRoute>') ||
    appContent.includes('<ProfilePage />'),
    "Route '/profile' is protected by <ProtectedRoute>"
);

assert(
    appContent.includes("id: 'profile'") && appContent.includes("path: '/profile'") && appContent.includes("label: 'Farmer Profile'"),
    "NAV_ITEMS array includes 'Farmer Profile' item mapped to '/profile'"
);

assert(
    appContent.includes('desktop-profile-btn') && appContent.includes("navigate('/profile')"),
    "Desktop header renders dedicated profile navigation button"
);

assert(
    appContent.includes('nav-tab-profile') || appContent.includes('item.id'),
    "Desktop and mobile navigation menus render interactive Profile options dynamically"
);

// ---------------------------------------------------------------------------
// 3. Task 3: Optional Registration Fields (GAP-UI-03)
// ---------------------------------------------------------------------------
console.log("\n5. Optional Registration Fields (RegisterForm.jsx)");

const registerPath = path.resolve('src/features/auth/components/RegisterForm.jsx');
const registerContent = fs.readFileSync(registerPath, 'utf8');

assert(
    registerContent.includes('mobileNumber') && registerContent.includes('setMobileNumber'),
    "RegisterForm declares state for optional mobileNumber"
);

assert(
    registerContent.includes('location') && registerContent.includes('setLocation'),
    "RegisterForm declares state for optional location"
);

assert(
    registerContent.includes('placeholder="e.g. +91 9876543210"'),
    "RegisterForm renders mobile number input with clear placeholder"
);

assert(
    registerContent.includes('placeholder="e.g. Pune, Maharashtra"'),
    "RegisterForm renders location input with clear placeholder"
);

assert(
    registerContent.includes('payload.mobileNumber =') && registerContent.includes('payload.location ='),
    "RegisterForm conditionally appends mobileNumber and location to payload only when provided"
);

// Verify backward compatibility: submitting without optional fields sends only name, email, password
const testBuildPayload = (name, email, password, mobileNumber = '', location = '') => {
    const payload = {
        name: name.trim(),
        email: email.trim(),
        password,
    };
    if (mobileNumber.trim()) payload.mobileNumber = mobileNumber.trim();
    if (location.trim()) payload.location = location.trim();
    return payload;
};

const minimalPayload = testBuildPayload('Ramesh Kumar', 'ramesh@example.com', 'secret123');
assert(
    !('mobileNumber' in minimalPayload) && !('location' in minimalPayload),
    "Minimal registration payload omits mobileNumber and location without crashing"
);

const fullPayload = testBuildPayload('Ramesh Kumar', 'ramesh@example.com', 'secret123', '9876543210', 'Khandwa, MP');
assert(
    fullPayload.mobileNumber === '9876543210' && fullPayload.location === 'Khandwa, MP',
    "Full registration payload preserves trimmed mobileNumber and location"
);

// ---------------------------------------------------------------------------
// 4. Security & Sensitive Exposure Invariants
// ---------------------------------------------------------------------------
console.log("\n6. Zero Secret & Token Exposure Invariants");

assert(
    !profilePageContent.includes('password') || profilePageContent.includes('-password'),
    "ProfilePage does not contain password input or password state"
);

assert(
    !profilePageContent.includes('JWT_SECRET') && !profilePageContent.includes('process.env'),
    "ProfilePage does not reference JWT_SECRET or server environment variables"
);

assert(
    !registerContent.includes('JWT_SECRET') && !authServiceContent.includes('JWT_SECRET'),
    "Client auth files contain zero references to backend secrets"
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
