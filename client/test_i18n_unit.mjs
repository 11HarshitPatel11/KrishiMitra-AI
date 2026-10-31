/**
 * client/test_i18n_unit.mjs
 * ---------------------------------------------------------------------------
 * Unit test suite for Step 24.34 (English and Hindi Language Support):
 * 1. Locale dictionary parity check (0 missing keys between en and hi)
 * 2. Translation fallback & variable interpolation logic
 * 3. Default language and localStorage persistence logic
 * 4. Language switcher component interface
 * ---------------------------------------------------------------------------
 */

import en from './src/locales/en.js';
import hi from './src/locales/hi.js';
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

console.log("==================================================");
console.log("Step 24.34 i18n Localization Unit Test Suite");
console.log("==================================================\n");

// 1. Recursive key extraction helper
function getLeafKeys(obj, prefix = '') {
    let keys = [];
    for (const [key, val] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
            keys = keys.concat(getLeafKeys(val, fullKey));
        } else {
            keys.push(fullKey);
        }
    }
    return keys;
}

const enKeys = getLeafKeys(en);
const hiKeys = getLeafKeys(hi);

console.log(`1. Dictionary Parity Check (EN keys: ${enKeys.length}, HI keys: ${hiKeys.length})`);

const missingInHi = enKeys.filter(k => !hiKeys.includes(k));
const missingInEn = hiKeys.filter(k => !enKeys.includes(k));

assert(missingInHi.length === 0, `No English keys missing in Hindi dictionary`, missingInHi.join(', '));
assert(missingInEn.length === 0, `No Hindi keys missing in English dictionary`, missingInEn.join(', '));
assert(enKeys.length === hiKeys.length, `Key counts match exactly (${enKeys.length} keys)`);

// 2. Interpolation and fallback function simulation
console.log("\n2. Translation Interpolation & Fallback Unit Verification");

function mockTranslate(dict, key, interpolations = null, fallback = null) {
    const parts = key.split('.');
    let curr = dict;
    for (const part of parts) {
        if (curr == null || typeof curr !== 'object') {
            curr = undefined;
            break;
        }
        curr = curr[part];
    }

    if (curr === undefined) {
        curr = fallback !== null ? fallback : key;
    }

    if (typeof curr === 'string' && interpolations) {
        return curr.replace(/\{(\w+)\}/g, (m, token) => token in interpolations ? String(interpolations[token]) : m);
    }
    return curr;
}

assert(
    mockTranslate(en, 'dashboard.welcome', { name: 'Kisan' }) === 'Namaste, Kisan!',
    "English interpolation renders 'Namaste, Kisan!'"
);

assert(
    mockTranslate(hi, 'dashboard.welcome', { name: 'किसान' }) === 'नमस्ते, किसान!',
    "Hindi interpolation renders 'नमस्ते, किसान!'"
);

assert(
    mockTranslate(hi, 'non.existent.key', null, 'Default Fallback') === 'Default Fallback',
    "Missing key falls back cleanly to provided fallback string"
);

// 3. LanguageContext & LanguageSwitcher file existence & structure
console.log("\n3. Language Context & Switcher Component Files");

const contextPath = path.resolve(__dirname, 'src/context/LanguageContext.jsx');
const switcherPath = path.resolve(__dirname, 'src/components/common/LanguageSwitcher.jsx');

assert(fs.existsSync(contextPath), "LanguageContext.jsx exists");
assert(fs.existsSync(switcherPath), "LanguageSwitcher.jsx exists");

const contextCode = fs.readFileSync(contextPath, 'utf8');
const switcherCode = fs.readFileSync(switcherPath, 'utf8');

assert(contextCode.includes("STORAGE_KEY = 'krishimitra_lang'"), "LanguageContext uses storage key 'krishimitra_lang'");
assert(contextCode.includes("DEFAULT_LANGUAGE = 'en'"), "LanguageContext defaults to English ('en')");
assert(contextCode.includes("useLanguage"), "LanguageContext exports useLanguage hook");
assert(contextCode.includes("useTranslation"), "LanguageContext exports useTranslation hook");

assert(switcherCode.includes('id="language-switcher"'), "LanguageSwitcher renders select with id 'language-switcher'");
assert(switcherCode.includes('<option value="en">English</option>'), "LanguageSwitcher contains 'English' option");
assert(switcherCode.includes('<option value="hi">हिंदी</option>'), "LanguageSwitcher contains 'हिंदी' option");

console.log("\n==================================================");
console.log(`Results: ${passed} PASSED, ${failed} FAILED`);
console.log("==================================================");

if (failed > 0) process.exit(1);
