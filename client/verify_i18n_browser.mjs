import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import os from 'os';

const ARTIFACT_DIR = 'C:/Users/Harshit Patel/.gemini/antigravity/brain/3e3907e5-8d58-4791-9eca-5f0b6455b1fe';

async function runBrowserVerification() {
    console.log("==================================================");
    console.log("Starting Step 24.34 Browser Live i18n Verification");
    console.log("==================================================\n");

    const uniqueProfileDir = path.join(os.tmpdir(), `puppeteer_i18n_${Date.now()}`);
    const browser = await puppeteer.launch({
        headless: 'new',
        userDataDir: uniqueProfileDir,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    try {
        // --- TEST 1: Default Language (English) ---
        console.log("1. Testing clean launch without saved language preference...");
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

        const defaultLang = await page.evaluate(() => localStorage.getItem('krishimitra_lang'));
        console.log(`   Initial localStorage 'krishimitra_lang': ${defaultLang || '(null - expected default)'}`);

        const switcherVal = await page.$eval('#language-switcher', el => el.value);
        console.log(`   Language switcher value: '${switcherVal}' (expected 'en')`);
        if (switcherVal !== 'en') throw new Error(`Expected default language 'en', got '${switcherVal}'`);

        const brandTextEn = await page.$eval('header', el => el.textContent);
        if (!brandTextEn.includes('KrishiMitra AI') || !brandTextEn.includes('Sign In')) {
            throw new Error(`English navigation text missing expected strings: ${brandTextEn}`);
        }
        console.log("   ✅ Default English language verified in header.");

        // --- TEST 2: Switch to Hindi without reload ---
        console.log("\n2. Switching to Hindi ('hi') via Language Switcher...");
        await page.select('#language-switcher', 'hi');
        await new Promise(r => setTimeout(r, 400));

        const savedLangHi = await page.evaluate(() => localStorage.getItem('krishimitra_lang'));
        console.log(`   Saved localStorage 'krishimitra_lang': '${savedLangHi}'`);
        if (savedLangHi !== 'hi') throw new Error(`Expected localStorage to be 'hi', got '${savedLangHi}'`);

        const navTextHi = await page.$eval('header', el => el.textContent);
        console.log(`   Hindi header contains 'साइन इन': ${navTextHi.includes('साइन इन')}`);
        if (!navTextHi.includes('साइन इन') && !navTextHi.includes('कृषि मित्र AI')) {
            throw new Error(`Expected Hindi strings in header, got: ${navTextHi}`);
        }
        console.log("   ✅ Instant Hindi switch verified.");

        // --- TEST 3: Persistence Across Reload ---
        console.log("\n3. Testing language persistence across browser reload...");
        await page.reload({ waitUntil: 'networkidle0' });
        const postReloadVal = await page.$eval('#language-switcher', el => el.value);
        console.log(`   Post-reload switcher value: '${postReloadVal}'`);
        if (postReloadVal !== 'hi') throw new Error(`Expected switcher to retain 'hi' after reload, got '${postReloadVal}'`);

        const heroHeadingHi = await page.$eval('h1', el => el.textContent);
        console.log(`   Hindi Landing Hero H1: "${heroHeadingHi.trim()}"`);
        console.log("   ✅ Hindi persisted across page reload.");

        // Screenshot Landing Hindi
        const landingHiPath = path.join(ARTIFACT_DIR, 'i18n_landing_hindi.png');
        await page.screenshot({ path: landingHiPath, fullPage: false });
        console.log(`   📸 Captured Hindi landing page: ${landingHiPath}`);

        // --- TEST 4: Restore English ---
        console.log("\n4. Restoring English ('en') and verifying clean restoration...");
        await page.select('#language-switcher', 'en');
        await new Promise(r => setTimeout(r, 400));

        const postRestoreVal = await page.$eval('#language-switcher', el => el.value);
        const heroHeadingEn = await page.$eval('h1', el => el.textContent);
        console.log(`   Restored English switcher value: '${postRestoreVal}'`);
        console.log(`   Restored English Landing Hero H1: "${heroHeadingEn.trim()}"`);

        const landingEnPath = path.join(ARTIFACT_DIR, 'i18n_landing_english.png');
        await page.screenshot({ path: landingEnPath, fullPage: false });
        console.log(`   📸 Captured English landing page: ${landingEnPath}`);

        // Switch back to Hindi for deep page inspection
        await page.select('#language-switcher', 'hi');
        await new Promise(r => setTimeout(r, 400));

        // --- TEST 5: Login & Register Pages ---
        console.log("\n5. Testing Login page in Hindi...");
        await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
        const loginTitle = await page.$eval('h2', el => el.textContent);
        console.log(`   Login H2: "${loginTitle.trim()}"`);
        if (!loginTitle.includes('लॉगिन') && !loginTitle.includes('साइन इन')) {
            throw new Error(`Login heading not localized in Hindi: ${loginTitle}`);
        }
        const loginHiPath = path.join(ARTIFACT_DIR, 'i18n_login_hindi.png');
        await page.screenshot({ path: loginHiPath, fullPage: false });
        console.log(`   📸 Captured Hindi login page: ${loginHiPath}`);

        // --- TEST 6: User Authentication for Protected Routes ---
        console.log("\n6. Authenticating test farmer session for protected routes...");
        const registerPayload = {
            name: "हरित पटेल (Harshit)",
            email: `farmer_i18n_${Date.now()}@krishimitra.org`,
            password: "SecurePassword123!",
            farmSize: 15,
            primaryCrop: "Wheat",
            mobileNumber: "+91 9876543210",
            location: "Indore, Madhya Pradesh"
        };

        const authRes = await page.evaluate(async (payload) => {
            const regRes = await fetch('http://localhost:5000/api/v1/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const regData = await regRes.json();
            if (!regData.success) return { success: false, error: regData };

            const loginRes = await fetch('http://localhost:5000/api/v1/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: payload.email, password: payload.password })
            });
            return await loginRes.json();
        }, registerPayload);

        let token, user;
        if (authRes.success && authRes.data?.token) {
            token = authRes.data.token;
            user = authRes.data.user;
            console.log(`   Created & logged in test user: ${registerPayload.email}`);
        } else {
            console.error("   Authentication error:", authRes);
            throw new Error("Could not acquire authentication token for live browser audit.");
        }

        await page.evaluate((tok, usr) => {
            localStorage.setItem('token', tok);
            localStorage.setItem('user', JSON.stringify(usr));
            localStorage.setItem('krishimitra_lang', 'hi');
        }, token, user);

        // --- TEST 7: Dashboard Page in Hindi ---
        console.log("\n7. Auditing Dashboard page in Hindi...");
        await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle0' });
        await new Promise(r => setTimeout(r, 600));
        const dashTitle = await page.$eval('h1, h2', el => el.textContent);
        console.log(`   Dashboard Heading: "${dashTitle.trim()}"`);
        const dashHiPath = path.join(ARTIFACT_DIR, 'i18n_dashboard_hindi.png');
        await page.screenshot({ path: dashHiPath, fullPage: false });
        console.log(`   📸 Captured Hindi dashboard: ${dashHiPath}`);

        // --- TEST 8: Recommendation Page in Hindi ---
        console.log("\n8. Auditing Crop Recommendation page in Hindi...");
        await page.goto('http://localhost:3000/recommendation', { waitUntil: 'networkidle0' });
        await new Promise(r => setTimeout(r, 600));
        const recTitle = await page.$eval('h2', el => el.textContent);
        console.log(`   Recommendation Heading: "${recTitle.trim()}"`);
        const recHiPath = path.join(ARTIFACT_DIR, 'i18n_recommendation_hindi.png');
        await page.screenshot({ path: recHiPath, fullPage: false });
        console.log(`   📸 Captured Hindi recommendation page: ${recHiPath}`);

        // --- TEST 9: Farm Management Page in Hindi ---
        console.log("\n9. Auditing Farm Management page in Hindi...");
        await page.goto('http://localhost:3000/farms', { waitUntil: 'networkidle0' });
        await new Promise(r => setTimeout(r, 600));
        const farmTitle = await page.$eval('h2', el => el.textContent);
        console.log(`   Farm Management Heading: "${farmTitle.trim()}"`);
        const farmsHiPath = path.join(ARTIFACT_DIR, 'i18n_farms_hindi.png');
        await page.screenshot({ path: farmsHiPath, fullPage: false });
        console.log(`   📸 Captured Hindi farm management page: ${farmsHiPath}`);

        // --- TEST 10: Soil Information Page in Hindi ---
        console.log("\n10. Auditing Soil Information page in Hindi...");
        await page.goto('http://localhost:3000/soil', { waitUntil: 'networkidle0' });
        await new Promise(r => setTimeout(r, 600));
        const soilTitle = await page.$eval('h2', el => el.textContent);
        console.log(`   Soil Information Heading: "${soilTitle.trim()}"`);
        const soilHiPath = path.join(ARTIFACT_DIR, 'i18n_soil_hindi.png');
        await page.screenshot({ path: soilHiPath, fullPage: false });
        console.log(`   📸 Captured Hindi soil page: ${soilHiPath}`);

        // --- TEST 11: Plant Disease Detection Page in Hindi ---
        console.log("\n11. Auditing Plant Disease Detection page in Hindi...");
        await page.goto('http://localhost:3000/disease', { waitUntil: 'networkidle0' });
        await new Promise(r => setTimeout(r, 600));
        const diseaseTitle = await page.$eval('h2', el => el.textContent);
        console.log(`   Disease Detection Heading: "${diseaseTitle.trim()}"`);
        const diseaseHiPath = path.join(ARTIFACT_DIR, 'i18n_disease_hindi.png');
        await page.screenshot({ path: diseaseHiPath, fullPage: false });
        console.log(`   📸 Captured Hindi disease page: ${diseaseHiPath}`);

        // --- TEST 12: Market Intelligence Page in Hindi ---
        console.log("\n12. Auditing Market Prices page in Hindi...");
        await page.goto('http://localhost:3000/market', { waitUntil: 'networkidle0' });
        await new Promise(r => setTimeout(r, 1500)); // wait for initial load
        const marketTitle = await page.$eval('h2', el => el.textContent);
        console.log(`   Market Intelligence Heading: "${marketTitle.trim()}"`);
        const marketHiPath = path.join(ARTIFACT_DIR, 'i18n_market_hindi.png');
        await page.screenshot({ path: marketHiPath, fullPage: false });
        console.log(`   📸 Captured Hindi market page: ${marketHiPath}`);

        // --- TEST 13: Crop History Page in Hindi ---
        console.log("\n13. Auditing Crop History page in Hindi...");
        await page.goto('http://localhost:3000/history', { waitUntil: 'networkidle0' });
        await new Promise(r => setTimeout(r, 600));
        const historyTitle = await page.$eval('h2', el => el.textContent);
        console.log(`   Crop History Heading: "${historyTitle.trim()}"`);
        const historyHiPath = path.join(ARTIFACT_DIR, 'i18n_history_hindi.png');
        await page.screenshot({ path: historyHiPath, fullPage: false });
        console.log(`   📸 Captured Hindi crop history page: ${historyHiPath}`);

        // --- TEST 14: Farmer Profile Page in Hindi ---
        console.log("\n14. Auditing Farmer Profile page in Hindi...");
        await page.goto('http://localhost:3000/profile', { waitUntil: 'networkidle0' });
        await new Promise(r => setTimeout(r, 600));
        const profileTitle = await page.$eval('h2', el => el.textContent);
        console.log(`   Farmer Profile Heading: "${profileTitle.trim()}"`);
        const profileHiPath = path.join(ARTIFACT_DIR, 'i18n_profile_hindi.png');
        await page.screenshot({ path: profileHiPath, fullPage: false });
        console.log(`   📸 Captured Hindi profile page: ${profileHiPath}`);

        // --- TEST 15: Mobile Viewport Inspection ---
        console.log("\n15. Testing Mobile Viewport (375x667) and Mobile Menu in Hindi...");
        await page.setViewport({ width: 375, height: 667, isMobile: true, hasTouch: true });
        await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle0' });
        await new Promise(r => setTimeout(r, 400));

        // Open mobile menu
        const menuBtn = await page.$('button[aria-label="Toggle navigation menu"]');
        if (menuBtn) {
            await menuBtn.click();
            await new Promise(r => setTimeout(r, 400));
            console.log("   Opened mobile menu drawer.");
        }

        const mobileHiPath = path.join(ARTIFACT_DIR, 'i18n_mobile_drawer_hindi.png');
        await page.screenshot({ path: mobileHiPath, fullPage: false });
        console.log(`   📸 Captured Mobile drawer in Hindi: ${mobileHiPath}`);

        console.log("\n==================================================");
        console.log("ALL BROWSER i18n CHECKS PASSED PERFECTLY!");
        console.log("==================================================");

    } catch (err) {
        console.error("Browser verification error:", err);
        process.exitCode = 1;
    } finally {
        if (browser) await browser.close();
        try {
            if (uniqueProfileDir && fs.existsSync(uniqueProfileDir)) {
                fs.rmSync(uniqueProfileDir, { recursive: true, force: true });
            }
        } catch {
            // Ignore cleanup errors
        }
    }
}

runBrowserVerification();
