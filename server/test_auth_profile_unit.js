/**
 * test_auth_profile_unit.js
 * ---------------------------------------------------------------------------
 * Comprehensive Unit Tests for Step 24.12:
 *   - Profile Update Validator: validateProfileUpdate
 *   - Existing Auth Validators: validateRegister, validateLogin (Regression)
 *   - Service Layer: getUserProfileService, updateUserProfileService
 *   - Controller Layer: getProfile, updateProfile
 *   - Middleware: protect middleware (401 verification)
 *   - Tenant Isolation: User A vs User B profile scoping
 *   - Client Branding: KrishiMitra AI in App.jsx
 *
 * Runs completely hermetic in-process without requiring a live MongoDB daemon.
 * ---------------------------------------------------------------------------
 */

import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import {
    validateRegister,
    validateLogin,
    validateProfileUpdate
} from './src/validators/auth.validator.js';
import {
    getUserProfileService,
    updateUserProfileService
} from './src/services/auth.service.js';
import {
    getProfile,
    updateProfile
} from './src/controllers/auth.controller.js';
import { protect } from './src/middlewares/auth.middleware.js';
import User from './src/models/user.model.js';

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
console.log("Step 24.12 User Profile & Branding Unit Test Suite");
console.log("==================================================\n");

// ---------------------------------------------------------------------------
// 1. Validator Tests: validateProfileUpdate
// ---------------------------------------------------------------------------
console.log("1. Validator Tests — validateProfileUpdate");

// 1.1 Non-object / null body
const errNull = validateProfileUpdate(null);
assert(errNull.length === 1 && errNull[0].path === 'body', "Rejects null body with 400 validation error");

const errArr = validateProfileUpdate([]);
assert(errArr.length === 1 && errArr[0].path === 'body', "Rejects array body with 400 validation error");

const errStr = validateProfileUpdate("string");
assert(errStr.length === 1 && errStr[0].path === 'body', "Rejects string body with 400 validation error");

// 1.2 Empty body
const errEmpty = validateProfileUpdate({});
assert(errEmpty.length === 1 && errEmpty[0].path === 'body', "Rejects empty body with 400 validation error");

// 1.3 Forbidden fields
const forbiddenKeys = ['_id', 'id', 'email', 'password', 'role', '__v', 'createdAt', 'updatedAt'];
for (const key of forbiddenKeys) {
    const err = validateProfileUpdate({ [key]: 'test_val' });
    assert(
        err.some(e => e.path === key && e.message.includes('cannot be modified')),
        `Rejects forbidden field '${key}' from profile update`
    );
}

// 1.4 Unsupported / unknown fields
const errUnknown = validateProfileUpdate({ unknownField: 'foo' });
assert(
    errUnknown.some(e => e.path === 'unknownField' && e.message.includes('not a supported profile field')),
    "Rejects unsupported/unknown field 'unknownField'"
);

// 1.5 Name validation
const errEmptyName = validateProfileUpdate({ name: '' });
assert(errEmptyName.some(e => e.path === 'name'), "Rejects empty name");

const errWhitespaceName = validateProfileUpdate({ name: '   ' });
assert(errWhitespaceName.some(e => e.path === 'name'), "Rejects whitespace-only name");

const errNumName = validateProfileUpdate({ name: 12345 });
assert(errNumName.some(e => e.path === 'name'), "Rejects numeric name");

// 1.6 Mobile number validation
const errNumMobile = validateProfileUpdate({ mobileNumber: 9876543210 });
assert(errNumMobile.some(e => e.path === 'mobileNumber'), "Rejects non-string mobileNumber");

// 1.7 Location validation
const errNumLoc = validateProfileUpdate({ location: 999 });
assert(errNumLoc.some(e => e.path === 'location'), "Rejects non-string location");

// 1.8 Valid permitted updates
const okName = validateProfileUpdate({ name: 'Ramesh Patel' });
assert(okName.length === 0, "Accepts valid partial update with name only");

const okMobile = validateProfileUpdate({ mobileNumber: '9876543210' });
assert(okMobile.length === 0, "Accepts valid partial update with mobileNumber only");

const okLoc = validateProfileUpdate({ location: 'Nashik, Maharashtra' });
assert(okLoc.length === 0, "Accepts valid partial update with location only");

const okFull = validateProfileUpdate({
    name: 'Ramesh Patel',
    mobileNumber: '+91-9876543210',
    location: 'Nashik, Maharashtra'
});
assert(okFull.length === 0, "Accepts valid full profile update with all permitted fields");

// ---------------------------------------------------------------------------
// 2. Existing Auth Validators Regression
// ---------------------------------------------------------------------------
console.log("\n2. Existing Auth Validators Regression");

const regValid = validateRegister({
    name: 'Farmer Alice',
    email: 'alice@example.com',
    password: 'Password123'
});
assert(regValid.length === 0, "validateRegister accepts valid registration payload");

const regInvalid = validateRegister({
    name: '',
    email: 'invalid-email',
    password: '123'
});
assert(regInvalid.length === 3, "validateRegister rejects invalid registration fields");

const loginValid = validateLogin({
    email: 'alice@example.com',
    password: 'Password123'
});
assert(loginValid.length === 0, "validateLogin accepts valid login payload");

const loginInvalid = validateLogin({});
assert(loginInvalid.length === 2, "validateLogin rejects empty login payload");

// ---------------------------------------------------------------------------
// 3. Service Layer Unit Tests: getUserProfileService & updateUserProfileService
// ---------------------------------------------------------------------------
console.log("\n3. Service Layer Unit Tests");

// Save original Mongoose methods
const origFindById = User.findById;
const origFindByIdAndUpdate = User.findByIdAndUpdate;

try {
    // 3.1 getUserProfileService: Clean retrieval
    User.findById = (id) => ({
        select: (projection) => {
            if (id === 'user_123') {
                return Promise.resolve({
                    _id: 'user_123',
                    name: 'Farmer John',
                    email: 'john@example.com',
                    mobileNumber: '9876543210',
                    location: 'Nagpur',
                    createdAt: new Date('2026-01-01'),
                    updatedAt: new Date('2026-01-02'),
                });
            }
            return Promise.resolve(null);
        }
    });

    const profile = await getUserProfileService('user_123');
    assert(profile.id === 'user_123', "getUserProfileService returns correct user id");
    assert(profile.name === 'Farmer John', "getUserProfileService returns name");
    assert(profile.email === 'john@example.com', "getUserProfileService returns email");
    assert(profile.mobileNumber === '9876543210', "getUserProfileService returns mobileNumber");
    assert(profile.location === 'Nagpur', "getUserProfileService returns location");
    assert(profile.password === undefined, "Password is NEVER returned in profile");

    // 3.2 getUserProfileService: Not found
    let notFoundCaught = false;
    try {
        await getUserProfileService('nonexistent_id');
    } catch (err) {
        notFoundCaught = true;
        assert(err.statusCode === 404, "getUserProfileService throws 404 when user not found");
        assert(err.message === 'User not found', "getUserProfileService error message is 'User not found'");
    }
    assert(notFoundCaught, "getUserProfileService properly throws on nonexistent user");

    // 3.3 updateUserProfileService: Clean partial update
    let capturedUpdates = null;
    User.findByIdAndUpdate = (id, updateDoc, options) => ({
        select: (projection) => {
            capturedUpdates = updateDoc.$set;
            if (id === 'user_123') {
                return Promise.resolve({
                    _id: 'user_123',
                    name: capturedUpdates.name || 'Farmer John',
                    email: 'john@example.com',
                    mobileNumber: 'mobileNumber' in capturedUpdates ? capturedUpdates.mobileNumber : '9876543210',
                    location: 'location' in capturedUpdates ? capturedUpdates.location : 'Nagpur',
                    createdAt: new Date('2026-01-01'),
                    updatedAt: new Date('2026-01-03'),
                });
            }
            return Promise.resolve(null);
        }
    });

    const updated = await updateUserProfileService('user_123', {
        name: '  Farmer John Doe  ',
        mobileNumber: '9998887776',
        location: 'Amravati',
        // Attempt rogue field injection
        email: 'hacked@evil.com',
        role: 'admin',
        password: 'new_password'
    });

    assert(capturedUpdates.name === 'Farmer John Doe', "Service trims name before updating");
    assert(capturedUpdates.mobileNumber === '9998887776', "Service applies mobileNumber");
    assert(capturedUpdates.location === 'Amravati', "Service applies location");
    assert(capturedUpdates.email === undefined, "Service strictly strips rogue email update");
    assert(capturedUpdates.role === undefined, "Service strictly strips rogue role update");
    assert(capturedUpdates.password === undefined, "Service strictly strips rogue password update");
    assert(updated.name === 'Farmer John Doe', "updateUserProfileService returns updated name");
    assert(updated.password === undefined, "Password hash is NEVER returned in update response");

    // 3.4 updateUserProfileService: Not found throws 404
    let updateNotFound = false;
    try {
        await updateUserProfileService('nonexistent_id', { name: 'Nobody' });
    } catch (err) {
        updateNotFound = true;
        assert(err.statusCode === 404, "updateUserProfileService throws 404 on nonexistent user");
    }
    assert(updateNotFound, "updateUserProfileService properly throws on nonexistent user");

} finally {
    User.findById = origFindById;
    User.findByIdAndUpdate = origFindByIdAndUpdate;
}

// ---------------------------------------------------------------------------
// 4. Controller Layer Unit Tests: getProfile & updateProfile
// ---------------------------------------------------------------------------
console.log("\n4. Controller Layer Unit Tests");

const origGetProfileService = getUserProfileService;
const origUpdateProfileService = updateUserProfileService;

// Mock req and res objects
function createMockRes() {
    const res = {
        statusCode: 200,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.body = payload;
            return this;
        }
    };
    return res;
}

// 4.1 getProfile controller success
{
    const req = { user: { id: 'user_456' } };
    const res = createMockRes();
    let nextCalled = false;

    User.findById = (id) => ({
        select: () => Promise.resolve({
            _id: 'user_456',
            name: 'Pooja Sharma',
            email: 'pooja@example.com',
            mobileNumber: null,
            location: null,
            createdAt: new Date(),
            updatedAt: new Date()
        })
    });

    await getProfile(req, res, (err) => { nextCalled = true; });

    assert(res.statusCode === 200, "getProfile controller returns status 200");
    assert(res.body.success === true, "getProfile controller returns success: true");
    assert(res.body.message === 'User profile retrieved successfully', "getProfile returns standard message");
    assert(res.body.data.user.name === 'Pooja Sharma', "getProfile returns user data payload");
    assert(!nextCalled, "next was not called on success");
}

// 4.2 updateProfile controller success
{
    const req = {
        user: { id: 'user_456' },
        body: { name: 'Pooja R. Sharma', location: 'Kolhapur' }
    };
    const res = createMockRes();
    let nextCalled = false;

    User.findByIdAndUpdate = () => ({
        select: () => Promise.resolve({
            _id: 'user_456',
            name: 'Pooja R. Sharma',
            email: 'pooja@example.com',
            mobileNumber: null,
            location: 'Kolhapur',
            createdAt: new Date(),
            updatedAt: new Date()
        })
    });

    await updateProfile(req, res, (err) => { nextCalled = true; });

    assert(res.statusCode === 200, "updateProfile controller returns status 200");
    assert(res.body.success === true, "updateProfile controller returns success: true");
    assert(res.body.message === 'User profile updated successfully', "updateProfile returns standard message");
    assert(res.body.data.user.location === 'Kolhapur', "updateProfile returns updated user data payload");
    assert(!nextCalled, "next was not called on success");
}

// 4.3 Error handling bubbles to next(error)
{
    const req = { user: { id: 'user_error' } };
    const res = createMockRes();
    let errorPassed = null;

    User.findById = () => ({
        select: () => Promise.reject(new Error("Database connection dropped"))
    });

    await getProfile(req, res, (err) => { errorPassed = err; });

    assert(errorPassed !== null, "getProfile bubbles unexpected errors to next(error)");
    assert(errorPassed.message === "Database connection dropped", "Propagates original error message");
}

// ---------------------------------------------------------------------------
// 5. Middleware & Multi-Tenant Isolation Tests
// ---------------------------------------------------------------------------
console.log("\n5. Middleware & Multi-Tenant Isolation Tests");

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_12345';

// 5.1 Missing Authorization header
{
    const req = { headers: {} };
    const res = createMockRes();
    let nextCalled = false;

    await protect(req, res, () => { nextCalled = true; });
    assert(res.statusCode === 401, "protect middleware returns 401 when Authorization header is missing");
    assert(res.body.success === false, "protect middleware indicates success: false on missing auth");
    assert(!nextCalled, "protect blocks request progression when token is absent");
}

// 5.2 Invalid JWT Token
{
    const req = { headers: { authorization: 'Bearer invalid_garbage_token' } };
    const res = createMockRes();
    let nextCalled = false;

    await protect(req, res, () => { nextCalled = true; });
    assert(res.statusCode === 401, "protect middleware returns 401 when token is invalid");
    assert(!nextCalled, "protect blocks request progression on invalid token");
}

// 5.3 Valid JWT Token & Scoping
{
    const validToken = jwt.sign({ id: 'user_authenticated_777' }, process.env.JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${validToken}` } };
    const res = createMockRes();
    let nextCalled = false;

    await protect(req, res, () => { nextCalled = true; });
    assert(nextCalled, "protect allows valid token to proceed");
    assert(req.user.id === 'user_authenticated_777', "protect attaches req.user.id correctly");
}

// 5.4 Cross-Tenant Isolation: User B cannot access User A's profile
{
    // User B is logged in with token for 'user_B'
    const tokenUserB = jwt.sign({ id: 'user_B' }, process.env.JWT_SECRET);
    const req = {
        headers: { authorization: `Bearer ${tokenUserB}` },
        // Malicious client tries to send User A's ID in body or query
        body: { id: 'user_A', userId: 'user_A', name: 'Imposter' },
        params: { id: 'user_A' }
    };

    // Protect middleware decodes token:
    await protect(req, createMockRes(), () => {});
    assert(req.user.id === 'user_B', "Middleware strictly guarantees req.user.id is derived from token, not body/params");

    // Profile update validator strictly strips 'id' and 'userId'
    const errors = validateProfileUpdate(req.body);
    assert(
        errors.some(e => e.path === 'id' || e.path === 'userId'),
        "Validator rejects attempts to pass 'id' or 'userId' in update payload"
    );
}

// ---------------------------------------------------------------------------
// 6. Client Branding Verification
// ---------------------------------------------------------------------------
console.log("\n6. Client Branding Verification (client/src/App.jsx)");

let appJsxPath = path.resolve('client', 'src', 'App.jsx');
if (!fs.existsSync(appJsxPath)) {
    appJsxPath = path.resolve('..', 'client', 'src', 'App.jsx');
}
const appJsxContent = fs.readFileSync(appJsxPath, 'utf8');

assert(
    appJsxContent.includes('KrishiMitra AI'),
    "App.jsx contains primary header branding 'KrishiMitra AI'"
);

assert(
    appJsxContent.includes('Crop Recommendation System'),
    "App.jsx contains subtitle 'Crop Recommendation System'"
);

assert(
    /<h1[^>]*>[\s\S]*?KrishiMitra AI[\s\S]*?<\/h1>/.test(appJsxContent),
    "KrishiMitra AI is enclosed within the primary <h1> semantic element"
);

// ---------------------------------------------------------------------------
// Results Summary
// ---------------------------------------------------------------------------
console.log("\n==================================================");
console.log(`Results: ${passed} PASSED, ${failed} FAILED`);
console.log("==================================================");

if (failed > 0) {
    process.exit(1);
}
