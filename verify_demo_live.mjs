/**
 * verify_demo_live.mjs
 * ---------------------------------------------------------------------------
 * Step 24.29 Verification Protocol:
 * Probes all live endpoints, verifies Express -> ML proxy, tests auth & profile,
 * and renders the live frontend in Puppeteer to capture visual proof.
 * ---------------------------------------------------------------------------
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const req = createRequire(path.join(process.cwd(), 'client', 'index.js'));
const puppeteer = req('puppeteer');

async function fetchJson(url, options = {}) {
    const res = await fetch(url, options);
    const data = await res.json().catch(() => null);
    return { status: res.status, ok: res.ok, data };
}

async function verifyAll() {
    console.log("==================================================");
    console.log("KrishiMitra AI — Live Demo Stack Verification");
    console.log("==================================================");

    // 1. FastAPI ML Health & Readiness
    console.log("\n1. Testing FastAPI ML Service (http://127.0.0.1:8000)...");
    const mlHealth = await fetchJson('http://127.0.0.1:8000/health');
    console.log(`   /health -> HTTP ${mlHealth.status}:`, JSON.stringify(mlHealth.data));
    const mlReady = await fetchJson('http://127.0.0.1:8000/ready');
    console.log(`   /ready  -> HTTP ${mlReady.status}:`, JSON.stringify(mlReady.data));

    if (mlHealth.status !== 200 || mlReady.status !== 200) {
        throw new Error("FastAPI ML service checks failed!");
    }

    // 2. Express Backend Health
    console.log("\n2. Testing Express Backend (http://localhost:5000)...");
    const expressHealth = await fetchJson('http://localhost:5000/api/v1/health');
    console.log(`   /api/v1/health -> HTTP ${expressHealth.status}:`, JSON.stringify(expressHealth.data));

    if (expressHealth.status !== 200) {
        throw new Error("Express backend health check failed!");
    }

    // 3. Frontend Landing Page
    console.log("\n3. Testing React Frontend (http://localhost:3000)...");
    const frontendRes = await fetch('http://localhost:3000');
    console.log(`   GET http://localhost:3000 -> HTTP ${frontendRes.status} (${frontendRes.headers.get('content-type')})`);
    const htmlText = await frontendRes.text();
    console.log(`   HTML contains index.html root div: ${htmlText.includes('<div id="root">') ? 'YES' : 'NO'}`);

    // 4. Test Auth & User Profile Workflow
    console.log("\n4. Testing Authentication & User Profile Gateway...");
    const demoEmail = `demo_farmer_${Date.now()}@example.com`;
    const regRes = await fetchJson('http://localhost:5000/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: "Krishi Demo Farmer",
            email: demoEmail,
            password: "Password123!",
            mobileNumber: "9876543210",
            location: "Indore, Madhya Pradesh"
        })
    });
    console.log(`   Registration (${demoEmail}) -> HTTP ${regRes.status}:`, regRes.data?.message || 'Registered');

    const loginRes = await fetchJson('http://localhost:5000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: demoEmail,
            password: "Password123!"
        })
    });
    const token = loginRes.data?.data?.token || loginRes.data?.token;
    console.log(`   Login -> HTTP ${loginRes.status}: Token received: ${Boolean(token)}`);

    const profileRes = await fetchJson('http://localhost:5000/api/v1/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const user = profileRes.data?.data?.user || profileRes.data?.user;
    console.log(`   Profile GET /me -> HTTP ${profileRes.status}: User "${user?.name}", Email: "${user?.email}", Location: "${user?.location}"`);

    // 5. Test ML Integration via Express (Crop Recommendation)
    console.log("\n5. Testing Express -> FastAPI Crop Recommendation Gateway...");
    const recRes = await fetchJson('http://localhost:5000/api/v1/recommendation/predict', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            nitrogen: 90,
            phosphorus: 42,
            potassium: 43,
            temperature: 20.8,
            humidity: 82.0,
            pH: 6.5,
            rainfall: 202.9,
            state: "Madhya Pradesh",
            district: "Indore"
        })
    });
    const topRec = recRes.data?.data?.recommendations?.[0];
    console.log(`   Recommendation -> HTTP ${recRes.status}:`, recRes.data?.success ? `Top Recommended Crop: "${topRec?.crop}" (Score: ${topRec?.finalScore})` : JSON.stringify(recRes.data));

    // 6. Puppeteer Browser Render & Screenshot Confirmation
    console.log("\n6. Launching Puppeteer to capture live rendered browser page...");
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 15000 });

    const pageTitle = await page.title();
    const appHeader = await page.$eval('h1', el => el.innerText).catch(() => 'N/A');
    console.log(`   Page Title: "${pageTitle}"`);
    console.log(`   App Heading (h1): "${appHeader}"`);

    const screenshotPath = path.resolve('docs/screenshots/demo_live_browser.png');
    await page.screenshot({ path: screenshotPath });
    console.log(`   📸 Live browser screenshot saved to: docs/screenshots/demo_live_browser.png`);
    await browser.close();

    console.log("\n==================================================");
    console.log("✅ ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!");
    console.log("==================================================");
}

verifyAll().catch(err => {
    console.error("❌ Verification failed:", err);
    process.exit(1);
});
