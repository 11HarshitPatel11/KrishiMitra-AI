/**
 * capture_redesign_screenshots.mjs
 * Captures comprehensive visual audit screenshots of the redesigned KrishiMitra AI platform.
 */

import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const req = createRequire(path.join(process.cwd(), 'client', 'index.js'));
const puppeteer = req('puppeteer');

const SCREENSHOT_DIR = path.resolve('docs/screenshots/ui-redesign');
if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function fetchJson(url, options = {}) {
    const res = await fetch(url, options);
    const data = await res.json().catch(() => null);
    return { status: res.status, ok: res.ok, data };
}

async function run() {
    console.log("==================================================");
    console.log("KrishiMitra AI — UI/UX Redesign Screenshot Capture");
    console.log("==================================================");

    // 1. Register test user to obtain JWT
    const demoEmail = `audit_farmer_${Date.now()}@example.com`;
    console.log(`\nCreating demo farmer account: ${demoEmail}...`);
    const regRes = await fetchJson('http://localhost:5000/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: "Rameshwar Singh Patel",
            email: demoEmail,
            password: "Password123!",
            mobileNumber: "+91 9876543210",
            location: "Ujjain, Madhya Pradesh"
        })
    });

    const loginRes = await fetchJson('http://localhost:5000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: demoEmail,
            password: "Password123!"
        })
    });

    const token = loginRes.data?.data?.token || loginRes.data?.token;
    const user = loginRes.data?.data?.user || loginRes.data?.user;
    console.log(`JWT Token acquired: ${Boolean(token)}`);

    // Create a demo farm for rich dashboard display
    if (token) {
        await fetchJson('http://localhost:5000/api/v1/farms', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                farmName: "Shanti Krishi Farm",
                area: 8.5,
                areaUnit: "acre",
                location: {
                    state: "Madhya Pradesh",
                    district: "Ujjain"
                },
                soilMetrics: {
                    nitrogen: 85,
                    phosphorus: 40,
                    potassium: 42,
                    pH: 6.8
                }
            })
        });
        console.log("Sample farm 'Shanti Krishi Farm' initialized.");
    }

    // Launch Browser
    console.log("\nLaunching headless Chromium...");
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // 1. Desktop Landing Page (Unauthenticated)
    console.log("Capturing 01-landing-page-desktop.png...");
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0', timeout: 15000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-landing-page-desktop.png') });

    // 2. Mobile Landing Page
    console.log("Capturing 02-landing-page-mobile.png...");
    await page.setViewport({ width: 375, height: 812 });
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0', timeout: 15000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-landing-page-mobile.png') });

    // 3. Desktop Login Page
    console.log("Capturing 03-login-desktop.png...");
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0', timeout: 15000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-login-desktop.png') });

    // 4. Desktop Register Page
    console.log("Capturing 04-register-desktop.png...");
    await page.goto('http://localhost:3000/register', { waitUntil: 'networkidle0', timeout: 15000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-register-desktop.png') });

    // Inject token for Authenticated views
    console.log("\nInjecting JWT into localStorage for authenticated views...");
    await page.evaluate(({ token, user }) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
    }, { token, user });

    // 5. Desktop Dashboard
    console.log("Capturing 05-dashboard-desktop.png...");
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-dashboard-desktop.png') });

    // 6. Desktop Recommendation Form
    console.log("Capturing 06-recommendation-desktop.png...");
    await page.goto('http://localhost:3000/recommendation', { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06-recommendation-desktop.png') });

    // 7. Desktop Farm Form
    console.log("Capturing 07-farms-desktop.png...");
    await page.goto('http://localhost:3000/farms', { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07-farms-desktop.png') });

    // 8. Desktop Disease Detection
    console.log("Capturing 08-disease-detection-desktop.png...");
    await page.goto('http://localhost:3000/disease', { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08-disease-detection-desktop.png') });

    // 9. Desktop Market Prices
    console.log("Capturing 09-market-prices-desktop.png...");
    await page.goto('http://localhost:3000/market', { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09-market-prices-desktop.png') });

    // 10. Desktop Soil Insights
    console.log("Capturing 10-soil-insights-desktop.png...");
    await page.goto('http://localhost:3000/soil', { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10-soil-insights-desktop.png') });

    // 11. Desktop Farmer Profile
    console.log("Capturing 11-farmer-profile-desktop.png...");
    await page.goto('http://localhost:3000/profile', { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11-farmer-profile-desktop.png') });

    // 12. Mobile Navigation Drawer
    console.log("Capturing 12-mobile-navigation-drawer.png...");
    await page.setViewport({ width: 375, height: 812 });
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 800));
    const toggleBtn = await page.$('#mobile-menu-toggle');
    if (toggleBtn) {
        await toggleBtn.click();
        await new Promise(r => setTimeout(r, 500));
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12-mobile-navigation-drawer.png') });

    await browser.close();

    console.log("\n==================================================");
    console.log(`✅ All 12 screenshots saved to: ${SCREENSHOT_DIR}`);
    console.log("==================================================");
}

run().catch(err => {
    console.error("❌ Screenshot capture failed:", err);
    process.exit(1);
});
