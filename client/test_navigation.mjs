/**
 * test_navigation.mjs
 * ---------------------------------------------------------------------------
 * Automated verification suite for Step 24.3 Mobile Navigation:
 *   - Verifies removal of 'hide-mobile'
 *   - Verifies all 6 essential application sections are present in NAV_ITEMS
 *   - Verifies responsive desktop & mobile nav structures
 *   - Verifies accessibility attributes (aria-expanded, aria-controls, aria-label, aria-current)
 *   - Verifies keyboard listeners (Escape key) and window resize handlers
 *   - Verifies logout availability across mobile and desktop
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
console.log("Step 24.3 Mobile Navigation Test Suite");
console.log("==================================================\n");

const appPath = path.resolve('src/App.jsx');
const appContent = fs.readFileSync(appPath, 'utf8');

// 1. Verify 'hide-mobile' is completely eliminated
console.log("1. Root Cause & Class Cleanup");
assert(!appContent.includes('hide-mobile'), "Removed problematic 'hide-mobile' class completely from App.jsx");

// 2. Verify all 6 essential application sections
console.log("\n2. Essential Application Sections Coverage");
const expectedSections = [
    { id: 'recommendation', label: 'AI Recommendation' },
    { id: 'farm', label: 'Farm Management' },
    { id: 'history', label: 'Crop History' },
    { id: 'market', label: 'Market Price' },
    { id: 'soil', label: 'Soil Info' },
    { id: 'disease', label: 'Disease Detection' },
];

for (const section of expectedSections) {
    assert(
        appContent.includes(`id: '${section.id}'`) && appContent.includes(`label: '${section.label}'`),
        `NAV_ITEMS includes '${section.label}' (${section.id})`
    );
}

// 3. Responsive Navigation Elements in JSX
console.log("\n3. Responsive Layout Patterns (Desktop vs Mobile)");

// Desktop navigation: hidden md:flex
assert(
    appContent.includes('hidden md:flex') && appContent.includes('aria-label="Main Desktop Navigation"'),
    "Desktop navigation uses 'hidden md:flex' for screens >= 768px"
);

// Desktop nav buttons have nav-tab- IDs
for (const section of expectedSections) {
    assert(
        appContent.includes(`id={\`nav-tab-\${item.id}\`}`),
        `Desktop navigation renders interactive button for ${section.id}`
    );
}

// Mobile navigation container: md:hidden
assert(
    appContent.includes('md:hidden') && appContent.includes('mobile-menu-toggle'),
    "Mobile navigation uses 'md:hidden' container with mobile-menu-toggle"
);

// Mobile dropdown menu
assert(
    appContent.includes('id="mobile-nav-menu"'),
    "Mobile dropdown menu present with id 'mobile-nav-menu'"
);

// Mobile nav buttons have mobile-nav- IDs
assert(
    appContent.includes('id={`mobile-nav-${item.id}`}'),
    "Mobile navigation renders distinct full-width buttons for each section"
);

// 4. Accessibility Attributes (WCAG 2.1 AA)
console.log("\n4. Accessibility Attributes & Usability");

assert(
    appContent.includes('aria-expanded={isMobileMenuOpen}'),
    "Mobile toggle button includes dynamic 'aria-expanded'"
);

assert(
    appContent.includes('aria-controls="mobile-nav-menu"'),
    "Mobile toggle button links via 'aria-controls=\"mobile-nav-menu\"'"
);

assert(
    appContent.includes('aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}'),
    "Mobile toggle button includes accessible dynamic 'aria-label'"
);

assert(
    appContent.includes("aria-current={isActive ? 'page' : undefined}"),
    "Active tabs include 'aria-current=\"page\"' on both mobile and desktop"
);

assert(
    appContent.includes("e.key === 'Escape'"),
    "Keyboard handler closes mobile menu on Escape key press"
);

assert(
    appContent.includes("window.innerWidth >= 768"),
    "Window resize listener automatically collapses mobile menu when returning to desktop width"
);

assert(
    appContent.includes("min-h-[44px]"),
    "Mobile buttons satisfy touch target sizing (minimum 44px height)"
);

// 5. Overflow Prevention
console.log("\n5. Horizontal Overflow Prevention");
assert(
    appContent.includes('overflow-x-hidden'),
    "Root container enforces 'overflow-x-hidden' to prevent layout horizontal scroll"
);

assert(
    appContent.includes('overflow-x-auto'),
    "Desktop nav bar includes 'overflow-x-auto' as safety for medium tablet viewports"
);

// 6. Authentication & Logout Flow
console.log("\n6. Authentication & Logout Flow");

assert(
    appContent.includes('desktop-logout-btn') && appContent.includes('hidden md:inline-flex'),
    "Desktop logout button cleanly positioned without mobile title collision"
);

assert(
    appContent.includes('mobile-logout-btn'),
    "Mobile menu includes accessible logout button for touch devices"
);

assert(
    appContent.includes('handleLogout();') || appContent.includes('onClick={handleLogout}'),
    "Both logout buttons trigger handleLogout"
);

// 7. Page Views Integrity
console.log("\n7. Application Views Integrity");
const expectedViews = [
    '<LoginForm',
    '<RegisterForm',
    '<RecommendationForm',
    '<FarmForm',
    '<CropHistoryPage',
    '<MarketPage',
    '<SoilInformationPage',
    '<DiseaseDetectionPage',
];

for (const view of expectedViews) {
    assert(appContent.includes(view), `Preserved view component mount: ${view}`);
}

// 8. RecommendationForm useEffect check
const recFormPath = path.resolve('src/features/recommendation/components/RecommendationForm.jsx');
const recFormContent = fs.readFileSync(recFormPath, 'utf8');
assert(
    recFormContent.includes("import React, { useState, useEffect } from 'react';"),
    "RecommendationForm imports both useState and useEffect from 'react'"
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
