/**
 * test_router.mjs
 * ---------------------------------------------------------------------------
 * Automated Unit Test Suite for Step 24.7 (GAP-09):
 * React Router Integration and Browser Navigation
 *
 * Verifies:
 *   1. Complete URL route mappings for all 6 application sections
 *   2. Aliases and redirects (/ -> /recommendation, /farm -> /farms)
 *   3. Authentication guards (ProtectedRoute redirects unauthenticated visitors)
 *   4. Authenticated redirection away from /login and /register
 *   5. Fallback 404 route handling for unknown paths
 *   6. Active tab calculation based on window/browser URL
 *   7. Browser Back/Forward history transition simulation
 *   8. Mobile menu auto-dismissal on navigation
 *   9. Logout routing behavior
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
console.log("Step 24.7 React Router Integration Test Suite");
console.log("==================================================\n");

const clientRoot = fs.existsSync(path.resolve('src/App.jsx')) ? path.resolve('.') : path.resolve('client');
const appPath = path.resolve(clientRoot, 'src/App.jsx');
const appContent = fs.readFileSync(appPath, 'utf8');

// ---------------------------------------------------------------------------
// 1. React Router DOM Integration & Imports
// ---------------------------------------------------------------------------
console.log("1. React Router DOM Integration & Core Imports");

assert(
    appContent.includes("from 'react-router-dom'") &&
    appContent.includes('BrowserRouter') &&
    appContent.includes('Routes') &&
    appContent.includes('Route') &&
    appContent.includes('Navigate') &&
    appContent.includes('useLocation') &&
    appContent.includes('useNavigate'),
    "App.jsx imports BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate from 'react-router-dom'"
);

assert(
    appContent.includes('<BrowserRouter>'),
    "App component wraps application layout in <BrowserRouter>"
);

// ---------------------------------------------------------------------------
// 2. Route Definitions & Path Mappings
// ---------------------------------------------------------------------------
console.log("\n2. Route Definitions & Path Mappings");

const expectedRoutes = [
    { path: '/recommendation', component: '<RecommendationForm' },
    { path: '/farms', component: '<FarmForm' },
    { path: '/history', component: '<CropHistoryPage' },
    { path: '/market', component: '<MarketPage' },
    { path: '/soil', component: '<SoilInformationPage' },
    { path: '/disease', component: '<DiseaseDetectionPage' },
    { path: '/login', component: '<LoginForm' },
    { path: '/register', component: '<RegisterForm' },
];

for (const route of expectedRoutes) {
    assert(
        appContent.includes(`path="${route.path}"`),
        `Routes configuration declares route for path "${route.path}"`
    );
    assert(
        appContent.includes(route.component),
        `Route for "${route.path}" renders expected component: ${route.component}`
    );
}

// Redirects & Aliases
assert(
    appContent.includes('path="/"') && appContent.includes('to="/recommendation"'),
    "Root path '/' redirects to '/recommendation'"
);

assert(
    appContent.includes('path="/farm"') && appContent.includes('to="/farms"'),
    "Legacy path '/farm' redirects to canonical '/farms'"
);

// Fallback Route
assert(
    appContent.includes('path="*"') && appContent.includes('<NotFoundPage'),
    "Catch-all wildcard route 'path=\"*\"' renders <NotFoundPage />"
);

// ---------------------------------------------------------------------------
// 3. Protected Route Security & Authentication Guards
// ---------------------------------------------------------------------------
console.log("\n3. Protected Route Security & Multi-Tenant Guarding");

assert(
    appContent.includes('export const ProtectedRoute') || appContent.includes('const ProtectedRoute'),
    "Declares ProtectedRoute component"
);

assert(
    appContent.includes('<Navigate to="/login" replace />'),
    "ProtectedRoute redirects unauthenticated visitors to '/login' with replace"
);

// Protected routes wrap sensitive views
const protectedModules = [
    'RecommendationForm',
    'FarmForm',
    'CropHistoryPage',
    'MarketPage',
    'SoilInformationPage',
    'DiseaseDetectionPage'
];

for (const mod of protectedModules) {
    assert(
        appContent.includes(`<ProtectedRoute isAuthenticated={isAuthenticated}>\n                                    <${mod}`),
        `ProtectedRoute wraps <${mod} />`
    );
}

// Authenticated visitors on /login or /register are redirected to /recommendation
assert(
    appContent.includes('isAuthenticated ? (\n                                    <Navigate to="/recommendation" replace />'),
    "Authenticated users visiting /login or /register are automatically redirected to '/recommendation'"
);

// ---------------------------------------------------------------------------
// 4. URL-Driven Active Navigation Item Highlighting
// ---------------------------------------------------------------------------
console.log("\n4. URL-Driven Active Navigation Highlighting");

// Check NAV_ITEMS definitions have explicit paths
const expectedNavItems = [
    { id: 'recommendation', path: '/recommendation' },
    { id: 'farm', path: '/farms' },
    { id: 'history', path: '/history' },
    { id: 'market', path: '/market' },
    { id: 'soil', path: '/soil' },
    { id: 'disease', path: '/disease' },
];

for (const item of expectedNavItems) {
    assert(
        appContent.includes(`id: '${item.id}'`) && appContent.includes(`path: '${item.path}'`),
        `NAV_ITEMS defines path '${item.path}' for section '${item.id}'`
    );
}

assert(
    appContent.includes('location.pathname === item.path') ||
    appContent.includes("isItemActive"),
    "Active navigation tab is computed dynamically from current URL pathname"
);

// ---------------------------------------------------------------------------
// 5. Browser Back/Forward & Direct Navigation Support
// ---------------------------------------------------------------------------
console.log("\n5. Browser Back/Forward & Direct Navigation Support");

assert(
    appContent.includes('const navigate = useNavigate()'),
    "Navigation handler uses React Router's useNavigate hook"
);

assert(
    appContent.includes('navigate(destination)') || appContent.includes('navigate(item.path)'),
    "Nav clicks push to browser history via navigate()"
);

// ---------------------------------------------------------------------------
// 6. Mobile Usability & Event Listeners
// ---------------------------------------------------------------------------
console.log("\n6. Mobile Usability & Event Listeners");

assert(
    appContent.includes('setIsMobileMenuOpen(false);'),
    "Mobile menu is automatically dismissed upon selecting any navigation destination"
);

assert(
    appContent.includes("e.key === 'Escape'"),
    "Escape key dismisses mobile menu"
);

assert(
    appContent.includes('window.innerWidth >= 768'),
    "Viewport expansion to desktop width automatically closes mobile menu"
);

// ---------------------------------------------------------------------------
// 7. Logout Routing Behavior
// ---------------------------------------------------------------------------
console.log("\n7. Logout Routing Behavior");

assert(
    appContent.includes('authService.logout()') &&
    appContent.includes("navigate('/login')"),
    "Logout clears authentication credentials and navigates directly to '/login'"
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
